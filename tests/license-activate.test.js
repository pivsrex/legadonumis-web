/**
 * Tests de functions/api/license/activate.js (D1-based).
 *
 * Cubre:
 *   1. Validación de entrada (body malformado, clave vacía → 400).
 *   2. Clave conocida en D1 (activa) → nueva activación → ok:true.
 *   3. Clave conocida en D1 (revocada) → ok:false, error:'revoked'.
 *   4. Clave desconocida en D1, Dodo confirma → inserta fila → ok:true.
 *   5. Clave desconocida en D1, Dodo rechaza → ok:false, error:'invalid'.
 *   6. Reinstalación: misma huella de equipo → reusar instance_id → ok:true.
 *   7. Límite de equipos alcanzado → ok:false, error:'activation_limit'.
 *   8. D1 no configurada → 503, ok:false.
 *   9. D1 lanza error → 503, ok:false.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestPost } from '../functions/api/license/activate.js'

afterEach(() => { vi.unstubAllGlobals() })

/**
 * @param {{
 *   estadoLicencia?: 'activa'|'revocada'|null,
 *   huellaExistente?: string|null,
 *   instanceIdExistente?: string|null,
 *   numActivaciones?: number,
 *   throws?: boolean,
 *   throwsEnAbono?: boolean,
 * }} opciones
 */
function crearDbMock({
  estadoLicencia      = 'activa',
  huellaExistente     = null,
  instanceIdExistente = null,
  numActivaciones     = 0,
  throws              = false,
  throwsEnAbono       = false,
} = {}) {
  const activacionesInsertadas = []
  let abonosEjecutados = 0
  return {
    get activacionesInsertadas() { return activacionesInsertadas },
    get abonosEjecutados() { return abonosEjecutados },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (throws) throw new Error('D1 error simulado')
              // SELECT estado FROM licencias
              if (sql.includes('SELECT estado FROM licencias')) {
                if (estadoLicencia === null) return null
                return { estado: estadoLicencia }
              }
              // SELECT instance_id FROM activaciones WHERE ... device_fingerprint
              if (sql.includes('SELECT instance_id FROM activaciones') && sql.includes('device_fingerprint')) {
                const huella = args[1]
                if (huellaExistente && huella === huellaExistente && instanceIdExistente) {
                  return { instance_id: instanceIdExistente }
                }
                return null
              }
              // SELECT COUNT(*) AS count FROM activaciones
              if (sql.includes('COUNT(*)')) {
                return { count: numActivaciones }
              }
              return null
            },
            async run() {
              if (throws) throw new Error('D1 error simulado')
              // UPDATE de créditos iniciales (identificado por 'iniciales_otorgados = 1' en el SET)
              if (sql.includes('iniciales_otorgados = 1')) {
                if (throwsEnAbono) throw new Error('D1 error en abono simulado')
                abonosEjecutados++
                return { meta: { changes: 1 } }
              }
              if (sql.includes('INSERT INTO activaciones')) {
                activacionesInsertadas.push({ instanceId: args[0], clave: args[1], huella: args[2] })
              }
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

function crearContexto(bodyObj, db, envExtra = {}) {
  return {
    request: { json: async () => bodyObj },
    env: { DB: db, ...envExtra },
  }
}

describe('onRequestPost — validación de entrada', () => {
  it('body no es JSON válido → 400, ok:false', async () => {
    const ctx = {
      request: { json: async () => { throw new Error('bad json') } },
      env: { DB: crearDbMock() },
    }
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })

  it('sin license_key → 400, ok:false', async () => {
    const res = await onRequestPost(crearContexto({}, crearDbMock()))
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })

  it('license_key solo espacios (normalizarClave devuelve null) → 400, ok:false', async () => {
    const res = await onRequestPost(crearContexto({ license_key: '   ' }, crearDbMock()))
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })
})

describe('onRequestPost — clave conocida en D1', () => {
  it('licencia activa, primer equipo → ok:true, instanceId devuelto', async () => {
    const db = crearDbMock({ estadoLicencia: 'activa', numActivaciones: 0 })
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', device_fingerprint: 'fp-abc' },
      db,
    ))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.instanceId).toBe('string')
    expect(body.instanceId.length).toBeGreaterThan(0)
    expect(db.activacionesInsertadas).toHaveLength(1)
    expect(db.activacionesInsertadas[0].clave).toBe('lk-1')   // normalizarClave
    expect(db.activacionesInsertadas[0].huella).toBe('fp-abc')
  })

  it('licencia revocada → ok:false, error:revoked', async () => {
    const db = crearDbMock({ estadoLicencia: 'revocada' })
    const res = await onRequestPost(crearContexto({ license_key: 'LK-1' }, db))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('revoked')
  })
})

describe('onRequestPost — clave desconocida en D1 (Dodo Payments)', () => {
  it('Dodo confirma la licencia → fila insertada → ok:true', async () => {
    const db = crearDbMock({ estadoLicencia: null })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ valid: true }),
    })))

    const res = await onRequestPost(crearContexto({ license_key: 'NUEVA-LK', device_fingerprint: 'fp-xyz' }, db))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.instanceId).toBe('string')
  })

  it('Dodo rechaza la licencia → ok:false, error:invalid', async () => {
    const db = crearDbMock({ estadoLicencia: null })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ valid: false }),
    })))

    const res = await onRequestPost(crearContexto({ license_key: 'INVALIDA' }, db))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('invalid')
  })

  it('Dodo no responde (fetch lanza) → ok:false, error:invalid', async () => {
    const db = crearDbMock({ estadoLicencia: null })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('sin red') }))

    const res = await onRequestPost(crearContexto({ license_key: 'INVALIDA' }, db))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('invalid')
  })
})

describe('onRequestPost — reinstalación (misma huella)', () => {
  it('huella ya registrada → reusar instance_id existente → ok:true sin nueva fila', async () => {
    const db = crearDbMock({
      estadoLicencia:     'activa',
      huellaExistente:    'fp-conocida',
      instanceIdExistente: 'inst-ya-existe',
    })

    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', device_fingerprint: 'fp-conocida' },
      db,
    ))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.instanceId).toBe('inst-ya-existe')
    expect(db.activacionesInsertadas).toHaveLength(0)   // no inserción nueva
  })
})

describe('onRequestPost — límite de equipos', () => {
  it('ya hay 2 activaciones → activation_limit → ok:false', async () => {
    const db = crearDbMock({ estadoLicencia: 'activa', numActivaciones: 2 })
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', device_fingerprint: 'fp-nueva' },
      db,
    ))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error).toBe('activation_limit')
  })
})

describe('onRequestPost — fallos de infraestructura', () => {
  it('DB no configurada → 503, ok:false', async () => {
    const ctx = {
      request: { json: async () => ({ license_key: 'LK-1' }) },
      env: {},
    }
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(503)
    expect((await res.json()).ok).toBe(false)
  })

  it('D1 lanza error → 503, ok:false', async () => {
    const db = crearDbMock({ throws: true })
    const res = await onRequestPost(crearContexto({ license_key: 'LK-1' }, db))
    expect(res.status).toBe(503)
    expect((await res.json()).ok).toBe(false)
  })
})

describe('onRequestPost — abono de créditos iniciales (best-effort)', () => {
  it('el abono falla → la activación responde ok:true igualmente, con su instanceId', async () => {
    // La plaza ya quedó grabada en activaciones antes del abono; si el abono
    // lanzara hasta el try/catch exterior, el usuario vería db_error con la
    // plaza gastada. abonarInicialesSiProcede() no debe poder tumbar la activación.
    const db = crearDbMock({ estadoLicencia: 'activa', numActivaciones: 0, throwsEnAbono: true })
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', device_fingerprint: 'fp-abc' },
      db,
    ))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.instanceId).toBe('string')
    expect(db.activacionesInsertadas).toHaveLength(1)   // la plaza sí se grabó
    expect(db.abonosEjecutados).toBe(0)                 // el abono falló
  })

  it('reinstalación con créditos pendientes → se abonan al reutilizar la instancia', async () => {
    // Si iniciales_otorgados = 0 cuando el equipo reinstala y reutiliza su
    // instancia, el abono debe ejecutarse en ese camino (paso 4), no solo en
    // activaciones nuevas (paso 7).
    const db = crearDbMock({
      estadoLicencia:      'activa',
      huellaExistente:     'fp-conocida',
      instanceIdExistente: 'inst-ya-existe',
    })
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', device_fingerprint: 'fp-conocida' },
      db,
    ))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.instanceId).toBe('inst-ya-existe')
    expect(db.activacionesInsertadas).toHaveLength(0)   // no inserción nueva
    expect(db.abonosEjecutados).toBe(1)                 // abono ejecutado
  })
})
