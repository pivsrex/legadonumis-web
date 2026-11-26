/**
 * Tests de functions/api/webhook/dodo.js.
 *
 * Cubre:
 *   - Verificación de firma Standard Webhooks (válida × 1, válida × 2, inválida, timestamp expirado)
 *   - Idempotencia por webhook-id
 *   - license_key.created + payment.succeeded en los dos órdenes posibles
 *   - payment.succeeded para pack: con metadata, con email conocido, sin ninguno
 *   - refund.succeeded
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'
import { onRequestPost, idiomaPorPais } from '../functions/api/webhook/dodo.js'
import { CREDITOS_INICIALES, CREDITOS_PACK_200 } from '../functions/api/_shared/creditos.js'

afterEach(() => { vi.restoreAllMocks() })

// ── Helpers de firma ─────────────────────────────────────────────────────────

const SECRET_B64 = 'dGVzdHNlY3JldA=='   // base64("testsecret")
const SECRET_ENV = 'whsec_' + SECRET_B64

function firmar(id, ts, body) {
  const rawSecret = Buffer.from(SECRET_B64, 'base64')
  return 'v1,' + createHmac('sha256', rawSecret).update(`${id}.${ts}.${body}`, 'utf8').digest('base64')
}

function ahoraTs() {
  return String(Math.floor(Date.now() / 1000))
}

function crearContexto({ id, ts, body, firma, dbMock, envExtra = {} }) {
  const tsStr   = ts    ?? ahoraTs()
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  const hdr     = firma ?? firmar(id, tsStr, bodyStr)
  return {
    request: {
      text: async () => bodyStr,
      headers: {
        get(name) {
          if (name === 'webhook-id')        return id
          if (name === 'webhook-timestamp') return tsStr
          if (name === 'webhook-signature') return hdr
          return null
        },
      },
    },
    env: {
      DB:                       dbMock,
      DODO_WEBHOOK_SECRET:      SECRET_ENV,
      DODO_PRODUCT_CREDITOS_200: 'prod_creditos_200',
      ...envExtra,
    },
  }
}

// ── Mock de base de datos en memoria ─────────────────────────────────────────
//
// Implementa exactamente las sentencias que usa dodo.js, usando el texto SQL
// como discriminador. Las filas con license_key = null se almacenan bajo la
// clave sintética '__p:' + payment_id para que las búsquedas WHERE ... IS NULL
// funcionen correctamente.

function crearDbMock() {
  const store = {
    licencias: new Map(),   // string → fila; pendientes: '__p:'+payment_id
    webhooks:  new Set(),
    compras:   [],
  }

  function run(sql, args) {
    const s = sql.replace(/\s+/g, ' ').trim()

    // Q1 — idempotencia
    if (s.startsWith('INSERT INTO webhooks_vistos')) {
      const [id] = args
      if (store.webhooks.has(id)) return { meta: { changes: 0 } }
      store.webhooks.add(id)
      return { meta: { changes: 1 } }
    }

    // Q2 — completar fila pendiente (payment llegó antes que la licencia)
    if (s.startsWith('UPDATE licencias') && s.includes('license_key IS NULL')) {
      const [clave, customerId, dodoLicId, paymentId] = args
      const pendKey = '__p:' + paymentId
      const row = store.licencias.get(pendKey)
      if (!row) return { meta: { changes: 0 } }
      row.license_key = clave
      row.customer_id = customerId
      row.dodo_lic_id = dodoLicId
      store.licencias.set(clave, row)
      store.licencias.delete(pendKey)
      return { meta: { changes: 1 } }
    }

    // Q3 — insertar o completar por license_key (con COALESCE)
    if (s.startsWith('INSERT INTO licencias') && s.includes('COALESCE')) {
      const [clave, customerId, paymentId, dodoLicId] = args
      if (store.licencias.has(clave)) {
        const row = store.licencias.get(clave)
        row.customer_id = row.customer_id ?? customerId
        row.payment_id  = row.payment_id  ?? paymentId
        row.dodo_lic_id = row.dodo_lic_id ?? dodoLicId
      } else {
        store.licencias.set(clave, {
          license_key: clave, creditos: 0, iniciales_otorgados: 0,
          estado: 'activa', email: null,
          customer_id: customerId, payment_id: paymentId, dodo_lic_id: dodoLicId,
        })
      }
      return { meta: { changes: 1 } }
    }

    // Q4 — abonar créditos iniciales (guarda atómica)
    if (s.includes('iniciales_otorgados = 1')) {
      const [clave, cantidad] = args
      const row = store.licencias.get(clave)
      if (row && row.iniciales_otorgados === 0) {
        row.creditos += cantidad
        row.iniciales_otorgados = 1
        return { meta: { changes: 1 } }
      }
      return { meta: { changes: 0 } }
    }

    // Q5 — añadir email a licencia existente por payment_id
    if (s.includes('SET email = ?1, customer_id = ?2 WHERE payment_id')) {
      const [email, customerId, paymentId] = args
      for (const row of store.licencias.values()) {
        if (row.payment_id === paymentId) {
          row.email       = email
          row.customer_id = customerId
          return { meta: { changes: 1 } }
        }
      }
      return { meta: { changes: 0 } }
    }

    // Q6 — insertar placeholder (payment llegó antes, clave aún desconocida)
    if (s.startsWith('INSERT INTO licencias') && s.includes('VALUES (NULL,')) {
      const [email, customerId, paymentId] = args
      store.licencias.set('__p:' + paymentId, {
        license_key: null, creditos: 0, iniciales_otorgados: 0,
        estado: 'activa', email, customer_id: customerId, payment_id: paymentId, dodo_lic_id: null,
      })
      return { meta: { changes: 1 } }
    }

    // Q8 — abonar pack de créditos
    if (s.includes('creditos = creditos + ?1') && s.includes('actualizada_en')) {
      const [cantidad, clave] = args
      const row = store.licencias.get(clave)
      if (row) { row.creditos += cantidad; return { meta: { changes: 1 } } }
      return { meta: { changes: 0 } }
    }

    // Q9 — registrar compra sin procesar
    if (s.startsWith('INSERT INTO compras_sin_procesar')) {
      store.compras.push(args)
      return { meta: { changes: 1 } }
    }

    // Q10 — revocar licencia por reembolso
    if (s.includes("estado = 'revocada'")) {
      const [paymentId] = args
      for (const row of store.licencias.values()) {
        if (row.payment_id === paymentId) {
          row.estado = 'revocada'
          return { meta: { changes: 1 } }
        }
      }
      return { meta: { changes: 0 } }
    }

    console.warn('[MockDB] SQL no reconocida:', s.slice(0, 80))
    return { meta: { changes: 0 } }
  }

  function first(sql, args) {
    const s = sql.replace(/\s+/g, ' ').trim()
    if (s.includes('SELECT license_key FROM licencias WHERE email')) {
      const [email] = args
      for (const row of store.licencias.values()) {
        if (row.email === email && row.license_key !== null) {
          return { license_key: row.license_key }
        }
      }
      return null
    }
    return null
  }

  function all(sql, args) {
    const s = sql.replace(/\s+/g, ' ').trim()

    if (s.includes('SELECT license_key FROM licencias WHERE customer_id')) {
      const [val] = args
      const rows = []
      for (const row of store.licencias.values()) {
        if (row.customer_id === val && row.license_key !== null) {
          rows.push({ license_key: row.license_key })
          if (rows.length >= 2) break
        }
      }
      return { results: rows }
    }

    if (s.includes('SELECT license_key FROM licencias WHERE email')) {
      const [val] = args
      const rows = []
      for (const row of store.licencias.values()) {
        if (row.email === val && row.license_key !== null) {
          rows.push({ license_key: row.license_key })
          if (rows.length >= 2) break
        }
      }
      return { results: rows }
    }

    console.warn('[MockDB] all() SQL no reconocida:', s.slice(0, 80))
    return { results: [] }
  }

  return {
    state: store,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            run:   async () => run(sql, args),
            first: async () => first(sql, args),
            all:   async () => all(sql, args),
          }
        },
      }
    },
  }
}

// ── Payloads de prueba ────────────────────────────────────────────────────────

function payloadCreada(clave, paymentId) {
  return {
    type: 'license_key.created',
    data: { key: clave, payment_id: paymentId, customer_id: 'cust_1', id: 'lic_123', product_id: 'prod_licencia' },
  }
}

function payloadPagoLicencia(paymentId, email, billingCountry = undefined) {
  return {
    type: 'payment.succeeded',
    data: {
      payment_id: paymentId,
      customer: { email, id: 'cust_1' },
      billing: billingCountry ? { country: billingCountry } : undefined,
      metadata: {},
      product_cart: [{ product_id: 'prod_licencia', quantity: 1 }],
    },
  }
}

function payloadPagoPack(paymentId, email, metaKey = undefined, customerId = 'cust_2') {
  return {
    type: 'payment.succeeded',
    data: {
      payment_id: paymentId,
      customer: { email, id: customerId },
      metadata: metaKey ? { license_key: metaKey } : {},
      product_cart: [{ product_id: 'prod_creditos_200', quantity: 1 }],
    },
  }
}

function payloadReembolso(paymentId) {
  return { type: 'refund.succeeded', data: { payment_id: paymentId } }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('verificación de firma', () => {
  it('firma válida con una sola firma en la cabecera → se procesa (200)', async () => {
    const id   = 'wh-sig-1'
    const body = JSON.stringify(payloadCreada('clave-sig', 'pay_sig'))
    const ctx  = crearContexto({ id, body, dbMock: crearDbMock() })
    const res  = await onRequestPost(ctx)
    expect(res.status).toBe(200)
  })

  it('firma válida siendo la segunda de dos separadas por espacio → se procesa (200)', async () => {
    const id    = 'wh-sig-2'
    const ts    = ahoraTs()
    const body  = JSON.stringify(payloadCreada('clave-sig2', 'pay_sig2'))
    const valida  = firmar(id, ts, body)
    const hdr   = `v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= ${valida}`
    const ctx   = crearContexto({ id, ts, body, firma: hdr, dbMock: crearDbMock() })
    const res   = await onRequestPost(ctx)
    expect(res.status).toBe(200)
  })

  it('firma inválida → 401, la base no se toca', async () => {
    const db  = crearDbMock()
    const id  = 'wh-sig-3'
    const ctx = crearContexto({ id, body: '{}', firma: 'v1,aaaa==', dbMock: db })
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(401)
    expect(db.state.webhooks.size).toBe(0)
  })

  it('timestamp de hace 10 minutos → 401', async () => {
    const id  = 'wh-sig-4'
    const ts  = String(Math.floor(Date.now() / 1000) - 600)
    const body = JSON.stringify(payloadCreada('clave-old', 'pay_old'))
    const sig  = firmar(id, ts, body)
    const ctx  = crearContexto({ id, ts, body, firma: sig, dbMock: crearDbMock() })
    const res  = await onRequestPost(ctx)
    expect(res.status).toBe(401)
  })
})

describe('idempotencia', () => {
  it('el mismo webhook-id dos veces → la segunda no abona créditos', async () => {
    const db   = crearDbMock()
    const id   = 'wh-idm-1'
    const body = JSON.stringify(payloadCreada('clave-idm', 'pay_idm'))

    const ts1  = ahoraTs()
    const sig1 = firmar(id, ts1, body)
    const res1 = await onRequestPost(crearContexto({ id, ts: ts1, body, firma: sig1, dbMock: db }))
    expect(res1.status).toBe(200)
    expect(db.state.licencias.get('clave-idm')?.creditos).toBe(CREDITOS_INICIALES)

    // Mismo id, timestamp ligeramente distinto (simulando reintento de Dodo)
    const ts2  = String(Number(ts1) + 2)
    const sig2 = firmar(id, ts2, body)
    const res2 = await onRequestPost(crearContexto({ id, ts: ts2, body, firma: sig2, dbMock: db }))
    expect(res2.status).toBe(200)
    // Los créditos no deben haber cambiado
    expect(db.state.licencias.get('clave-idm')?.creditos).toBe(CREDITOS_INICIALES)
  })
})

describe('license_key.created + payment.succeeded — orden normal', () => {
  it('license_key.created primero, payment.succeeded después → fila completa', async () => {
    const db      = crearDbMock()
    const clave   = 'clave-orden-ab'
    const payId   = 'pay_ab'
    const email   = 'ab@example.com'

    // 1. Aviso de licencia
    const bodyA = JSON.stringify(payloadCreada(clave, payId))
    const idA   = 'wh-ab-1'
    await onRequestPost(crearContexto({ id: idA, body: bodyA, dbMock: db }))

    // 2. Aviso de pago
    const bodyB = JSON.stringify(payloadPagoLicencia(payId, email))
    const idB   = 'wh-ab-2'
    await onRequestPost(crearContexto({ id: idB, body: bodyB, dbMock: db }))

    const fila = db.state.licencias.get(clave)
    expect(fila?.license_key).toBe(clave)
    expect(fila?.email).toBe(email)
    expect(fila?.payment_id).toBe(payId)
    expect(fila?.creditos).toBe(CREDITOS_INICIALES)
  })
})

describe('payment.succeeded + license_key.created — orden inverso', () => {
  it('payment.succeeded primero, license_key.created después → fila completa', async () => {
    const db    = crearDbMock()
    const clave = 'clave-orden-ba'
    const payId = 'pay_ba'
    const email = 'ba@example.com'

    // 1. Aviso de pago (aún no sabemos la clave)
    const bodyB = JSON.stringify(payloadPagoLicencia(payId, email))
    const idB   = 'wh-ba-1'
    await onRequestPost(crearContexto({ id: idB, body: bodyB, dbMock: db }))

    // 2. Aviso de licencia
    const bodyA = JSON.stringify(payloadCreada(clave, payId))
    const idA   = 'wh-ba-2'
    await onRequestPost(crearContexto({ id: idA, body: bodyA, dbMock: db }))

    const fila = db.state.licencias.get(clave)
    expect(fila?.license_key).toBe(clave)
    expect(fila?.email).toBe(email)
    expect(fila?.payment_id).toBe(payId)
    expect(fila?.creditos).toBe(CREDITOS_INICIALES)
  })
})

describe('payment.succeeded — pack de créditos', () => {
  it('con metadata.license_key → suma CREDITOS_PACK_200', async () => {
    const db    = crearDbMock()
    const clave = 'clave-pack-meta'
    db.state.licencias.set(clave, {
      license_key: clave, creditos: 100, iniciales_otorgados: 1,
      estado: 'activa', email: 'pack@example.com',
      customer_id: 'cust_p', payment_id: 'pay_orig', dodo_lic_id: null,
    })

    const body = JSON.stringify(payloadPagoPack('pay_pack_1', 'pack@example.com', clave))
    await onRequestPost(crearContexto({ id: 'wh-pack-1', body, dbMock: db }))

    expect(db.state.licencias.get(clave)?.creditos).toBe(100 + CREDITOS_PACK_200)
  })

  it('sin metadata pero con correo conocido → suma CREDITOS_PACK_200', async () => {
    const db    = crearDbMock()
    const clave = 'clave-pack-email'
    db.state.licencias.set(clave, {
      license_key: clave, creditos: 50, iniciales_otorgados: 1,
      estado: 'activa', email: 'email@example.com',
      customer_id: 'cust_e', payment_id: 'pay_orig2', dodo_lic_id: null,
    })

    const body = JSON.stringify(payloadPagoPack('pay_pack_2', 'email@example.com'))
    await onRequestPost(crearContexto({ id: 'wh-pack-2', body, dbMock: db }))

    expect(db.state.licencias.get(clave)?.creditos).toBe(50 + CREDITOS_PACK_200)
  })

  it('sin metadata y con correo desconocido → no suma nada, queda en compras_sin_procesar', async () => {
    const db   = crearDbMock()
    const body = JSON.stringify(payloadPagoPack('pay_pack_3', 'desconocido@example.com'))
    await onRequestPost(crearContexto({ id: 'wh-pack-3', body, dbMock: db }))

    expect(db.state.licencias.size).toBe(0)
    expect(db.state.compras.length).toBe(1)
  })

  it('metadata.license_key que no existe en la base → no se abona nada, queda en compras_sin_procesar con la clave, 200', async () => {
    const db    = crearDbMock()
    const clave = 'clave-inexistente'
    // La clave NO existe en db.state.licencias

    const body = JSON.stringify(payloadPagoPack('pay_pack_4', 'nuevo@example.com', clave))
    const res  = await onRequestPost(crearContexto({ id: 'wh-pack-4', body, dbMock: db }))

    expect(res.status).toBe(200)
    expect(db.state.licencias.size).toBe(0)
    expect(db.state.compras.length).toBe(1)
    const [claveGuardada] = db.state.compras[0]
    expect(claveGuardada).toBe(clave)
  })

  it('licencia sí existe → se abonan los 200 y compras_sin_procesar queda vacío', async () => {
    const db    = crearDbMock()
    const clave = 'clave-pack-existe'
    db.state.licencias.set(clave, {
      license_key: clave, creditos: 100, iniciales_otorgados: 1,
      estado: 'activa', email: 'existe@example.com',
      customer_id: 'cust_x', payment_id: 'pay_orig_x', dodo_lic_id: null,
    })

    const body = JSON.stringify(payloadPagoPack('pay_pack_5', 'existe@example.com', clave))
    await onRequestPost(crearContexto({ id: 'wh-pack-5', body, dbMock: db }))

    expect(db.state.licencias.get(clave)?.creditos).toBe(100 + CREDITOS_PACK_200)
    expect(db.state.compras.length).toBe(0)
  })

  it('sin metadata pero con customer_id coincidente → suma CREDITOS_PACK_200', async () => {
    const db    = crearDbMock()
    const clave = 'clave-pack-custid'
    db.state.licencias.set(clave, {
      license_key: clave, creditos: 80, iniciales_otorgados: 1,
      estado: 'activa', email: 'custid@example.com',
      customer_id: 'cust_match', payment_id: 'pay_orig_cid', dodo_lic_id: null,
    })

    // Email distinto al de la licencia, pero customer_id coincide
    const body = JSON.stringify(payloadPagoPack('pay_pack_cid', 'otro@example.com', undefined, 'cust_match'))
    await onRequestPost(crearContexto({ id: 'wh-pack-cid', body, dbMock: db }))

    expect(db.state.licencias.get(clave)?.creditos).toBe(80 + CREDITOS_PACK_200)
    expect(db.state.compras.length).toBe(0)
  })

  it('email ambiguo (dos licencias con el mismo correo) → compras_sin_procesar, sin abonar a ninguna', async () => {
    const db     = crearDbMock()
    const clave1 = 'clave-amb-1'
    const clave2 = 'clave-amb-2'
    const emailCompartido = 'shared@example.com'

    db.state.licencias.set(clave1, {
      license_key: clave1, creditos: 100, iniciales_otorgados: 1,
      estado: 'activa', email: emailCompartido,
      customer_id: 'cust_a1', payment_id: 'pay_a1', dodo_lic_id: null,
    })
    db.state.licencias.set(clave2, {
      license_key: clave2, creditos: 200, iniciales_otorgados: 1,
      estado: 'activa', email: emailCompartido,
      customer_id: 'cust_a2', payment_id: 'pay_a2', dodo_lic_id: null,
    })

    // customer_id del payload no coincide con ninguna; email es ambiguo
    const body = JSON.stringify(payloadPagoPack('pay_pack_amb', emailCompartido, undefined, 'cust_zz'))
    await onRequestPost(crearContexto({ id: 'wh-pack-amb', body, dbMock: db }))

    // Ninguna licencia recibe créditos
    expect(db.state.licencias.get(clave1)?.creditos).toBe(100)
    expect(db.state.licencias.get(clave2)?.creditos).toBe(200)
    // La compra queda pendiente de revisión manual
    expect(db.state.compras.length).toBe(1)
    // El payload guardado deja rastro de por qué falló el email
    const payloadGuardado = JSON.parse(db.state.compras[0][1])
    expect(payloadGuardado.criterios?.email).toBe('ambiguo')
  })
})

describe('refund.succeeded', () => {
  it('la licencia del pago reembolsado queda revocada', async () => {
    const db    = crearDbMock()
    const clave = 'clave-refund'
    const payId = 'pay_refund'
    db.state.licencias.set(clave, {
      license_key: clave, creditos: 500, iniciales_otorgados: 1,
      estado: 'activa', email: 'r@example.com',
      customer_id: 'cust_r', payment_id: payId, dodo_lic_id: null,
    })

    const body = JSON.stringify(payloadReembolso(payId))
    await onRequestPost(crearContexto({ id: 'wh-refund-1', body, dbMock: db }))

    expect(db.state.licencias.get(clave)?.estado).toBe('revocada')
    // La fila y los créditos se conservan para auditoría
    expect(db.state.licencias.get(clave)?.creditos).toBe(500)
  })
})

describe('idiomaPorPais', () => {
  it.each([
    ['ES', 'es'], ['MX', 'es'], ['AR', 'es'],
    ['FR', 'fr'], ['BE', 'fr'],
    ['DE', 'de'], ['AT', 'de'],
    ['GB', 'en'], ['US', 'en'], [null, 'en'], [undefined, 'en'], ['', 'en'],
  ])('país %s → idioma %s', (pais, esperado) => {
    expect(idiomaPorPais(pais)).toBe(esperado)
  })
})

describe('correo de bienvenida en compra de licencia', () => {
  function crearEnvLoops() {
    return {
      LOOPS_API_KEY:      'loops_key',
      LOOPS_TX_COMPRA_ES: 'tx_es',
      LOOPS_TX_COMPRA_EN: 'tx_en',
      LOOPS_TX_COMPRA_FR: 'tx_fr',
      LOOPS_TX_COMPRA_DE: 'tx_de',
    }
  }

  it('compra desde España → fetch a Loops con transactionalId español y Idempotency-Key', async () => {
    const db        = crearDbMock()
    const payId     = 'pay_mail_es'
    const email     = 'es@example.com'
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.fetch    = fetchMock

    const body = JSON.stringify(payloadPagoLicencia(payId, email, 'ES'))
    const id   = 'wh-mail-es'
    await onRequestPost(crearContexto({ id, body, dbMock: db, envExtra: crearEnvLoops() }))

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe('https://app.loops.so/api/v1/transactional')
    const sent = JSON.parse(opts.body)
    expect(sent.transactionalId).toBe('tx_es')
    expect(sent.email).toBe(email)
    expect(opts.headers['Idempotency-Key']).toBe(id)
  })

  it('compra desde Alemania → se envía el correo en alemán', async () => {
    const db        = crearDbMock()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.fetch    = fetchMock

    const body = JSON.stringify(payloadPagoLicencia('pay_mail_de', 'de@example.com', 'DE'))
    await onRequestPost(crearContexto({ id: 'wh-mail-de', body, dbMock: db, envExtra: crearEnvLoops() }))

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.transactionalId).toBe('tx_de')
  })

  it('sin país de facturación → se envía el correo en inglés', async () => {
    const db        = crearDbMock()
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    global.fetch    = fetchMock

    const body = JSON.stringify(payloadPagoLicencia('pay_mail_nopais', 'nopais@example.com'))
    await onRequestPost(crearContexto({ id: 'wh-mail-nopais', body, dbMock: db, envExtra: crearEnvLoops() }))

    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent.transactionalId).toBe('tx_en')
  })

  it('Loops falla → el webhook responde 200 igualmente (el cobro no se rompe)', async () => {
    const db        = crearDbMock()
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
    global.fetch    = fetchMock

    const body = JSON.stringify(payloadPagoLicencia('pay_mail_err', 'err@example.com', 'FR'))
    const res  = await onRequestPost(crearContexto({ id: 'wh-mail-err', body, dbMock: db, envExtra: crearEnvLoops() }))

    expect(res.status).toBe(200)
  })
})
