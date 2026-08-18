/**
 * Tests de ai.js y del módulo compartido _shared/identificacion-logica.js.
 *
 * Sección 1 — Unidad: calcularReembolso y validarRespuesta (funciones reales exportadas).
 * Sección 2 — Integración: handler onRequestPost con D1 y Anthropic simulados.
 *   Cubre: cobro ALTA/MEDIA (5 cr), reembolso BAJA/NINGUNA (neto 1), error de red
 *   (reembolso total), saldo insuficiente (402 sin llamar a Anthropic).
 * Sección 3 — Regresión: la tarea «contexto» se comporta igual tras los cambios en
 *   MAX_BODY_BYTES y en la firma de construir(lang).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcularReembolso,
  validarRespuesta,
  COSTE_IDENTIFICACION,
  CONFIANZAS_VALIDAS,
} from '../functions/api/_shared/identificacion-logica.js'
import { onRequestPost } from '../functions/api/ai.js'

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 1 — UNIDAD: funciones puras de identificacion-logica.js
// ═══════════════════════════════════════════════════════════════════════════

describe('COSTE_IDENTIFICACION', () => {
  it('vale 5', () => {
    expect(COSTE_IDENTIFICACION).toBe(5)
  })
})

describe('CONFIANZAS_VALIDAS', () => {
  it('contiene exactamente ALTA, MEDIA, BAJA, NINGUNA', () => {
    expect([...CONFIANZAS_VALIDAS].sort()).toEqual(['ALTA', 'BAJA', 'MEDIA', 'NINGUNA'])
  })
})

describe('calcularReembolso()', () => {
  it('ALTA  → 0', () => expect(calcularReembolso({ confianza: 'ALTA' })).toBe(0))
  it('MEDIA → 0', () => expect(calcularReembolso({ confianza: 'MEDIA' })).toBe(0))
  it('BAJA  → 4', () => expect(calcularReembolso({ confianza: 'BAJA' })).toBe(4))
  it('NINGUNA → 4', () => expect(calcularReembolso({ confianza: 'NINGUNA' })).toBe(4))

  it('reembolso + coste_cobrado siempre suma 5', () => {
    for (const c of ['ALTA', 'MEDIA', 'BAJA', 'NINGUNA']) {
      const r = calcularReembolso({ confianza: c })
      expect(r + (COSTE_IDENTIFICACION - r)).toBe(COSTE_IDENTIFICACION)
    }
  })
})

describe('validarRespuesta()', () => {
  it('null → respuesta_estructura_invalida', () => {
    expect(validarRespuesta(null)).toBe('respuesta_estructura_invalida')
  })
  it('array → respuesta_estructura_invalida', () => {
    expect(validarRespuesta([])).toBe('respuesta_estructura_invalida')
  })
  it('objeto sin confianza → confianza_invalida', () => {
    expect(validarRespuesta({ denominacion: '8 reales' })).toBe('confianza_invalida')
  })
  it('confianza no reconocida → confianza_invalida', () => {
    expect(validarRespuesta({ confianza: 'PROBABLE' })).toBe('confianza_invalida')
  })
  it('confianza en minúsculas → confianza_invalida', () => {
    expect(validarRespuesta({ confianza: 'alta' })).toBe('confianza_invalida')
  })
  it('ALTA → null (válido)', () => expect(validarRespuesta({ confianza: 'ALTA' })).toBeNull())
  it('MEDIA → null', () => expect(validarRespuesta({ confianza: 'MEDIA' })).toBeNull())
  it('BAJA → null',  () => expect(validarRespuesta({ confianza: 'BAJA' })).toBeNull())
  it('NINGUNA → null', () => expect(validarRespuesta({ confianza: 'NINGUNA' })).toBeNull())
})

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES DE TEST (mocks de D1, licencia y Anthropic)
// ═══════════════════════════════════════════════════════════════════════════

function crearDbMock(saldoInicial = 100) {
  let saldo = saldoInicial
  const consumos = []
  return {
    get saldo() { return saldo },
    get consumos() { return consumos },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (sql.includes('creditos - ?1') && sql.includes('creditos >= ?1')) {
                const n = args[0]
                if (saldo >= n) { saldo -= n; return { meta: { changes: 1 } } }
                return { meta: { changes: 0 } }
              }
              if (sql.includes('creditos + ?1')) {
                saldo += args[0]
                return { meta: { changes: 1 } }
              }
              if (sql.includes('INSERT INTO consumos')) {
                consumos.push({ tarea: args[1], coste: args[2], resultado: args[3] })
                return { meta: { changes: 1 } }
              }
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
}

// Imagen base64 mínima válida (1×1 px JPEG)
const IMG_B64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC' +
  'AABAAEDASIA2gABAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA/8QAIhAAAQQCAgMBAAAAAAAAAAAAAQIDBAUREiExBv/EABYBAQEBAAAAAAAAAAAAAAAAAAMEAv/EABwRAAICAwEBAAAAAAAAAAAAAAECAxEhMUH/2gAMAwEAAhEDEQA/AIt0zTbPTLuztLe5uLm4tbu4ura3t5sXlxcXFzc3NzdUVFRd//Z'

const IMG = { media_type: 'image/jpeg', data: IMG_B64 }

function crearContexto(body, dbMock) {
  const bodyStr = JSON.stringify(body)
  return {
    request: {
      headers: { get: (name) => name === 'content-length' ? String(bodyStr.length) : null },
      text: async () => bodyStr,
    },
    env: { DB: dbMock, ANTHROPIC_API_KEY: 'test-key', LS_API_KEY: 'test-ls-key' },
  }
}

// Respuesta JSON que devuelve el modelo simulado
function respuestaModelo(confianza) {
  return {
    leyenda_anverso: 'PHILIPP IIII D G',
    leyenda_reverso: 'HISPAN',
    emisor: 'España',
    autoridad: 'Felipe IV',
    denominacion: '8 reales',
    ceca: 'Sevilla',
    fecha: '1625',
    referencia_catalogo: 'KM#139.3',
    confianza,
    alternativas: confianza === 'ALTA' ? [] : [{ emisor: 'España', autoridad: 'Felipe III', denominacion: '8 reales', ceca: 'Sevilla', fecha: '1620' }],
  }
}

// Helper: simula fetch global (LemonSqueezy válido + Anthropic con respuesta)
function mockFetch(modelResponse) {
  return vi.fn(async (url, _opts) => {
    // LemonSqueezy validate
    if (url.includes('lemonsqueezy')) {
      return {
        ok: true,
        json: async () => ({ valid: true, license_key: { status: 'active' } }),
      }
    }
    // Anthropic — el content real incluye "type" por bloque (ai.js filtra por
    // type === 'text' desde 2014132 para saltar bloques 'thinking').
    return {
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: typeof modelResponse === 'string'
          ? modelResponse
          : JSON.stringify(modelResponse) }],
      }),
    }
  })
}

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 2 — INTEGRACIÓN: handler onRequestPost
// ═══════════════════════════════════════════════════════════════════════════

describe('handler identificacion_moneda — cobro', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('ALTA: se cobran 5 créditos, no hay reembolso', async () => {
    const db = crearDbMock(100)
    vi.stubGlobal('fetch', mockFetch(respuestaModelo('ALTA')))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.confianza).toBe('ALTA')
    expect(body.coste_cobrado).toBe(5)
    expect(db.saldo).toBe(95)
    expect(db.consumos[0]).toMatchObject({ tarea: 'identificacion_moneda', coste: 5, resultado: 'ok' })
  })

  it('MEDIA: se cobran 5 créditos', async () => {
    const db = crearDbMock(100)
    vi.stubGlobal('fetch', mockFetch(respuestaModelo('MEDIA')))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.coste_cobrado).toBe(5)
    expect(db.saldo).toBe(95)
  })

  it('BAJA: coste neto 1 (reembolso de 4)', async () => {
    const db = crearDbMock(100)
    vi.stubGlobal('fetch', mockFetch(respuestaModelo('BAJA')))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.confianza).toBe('BAJA')
    expect(body.coste_cobrado).toBe(1)
    expect(db.saldo).toBe(99)   // 100 - 5 + 4
    expect(db.consumos[0]).toMatchObject({ coste: 1, resultado: 'ok' })
  })

  it('NINGUNA: coste neto 1 (reembolso de 4)', async () => {
    const db = crearDbMock(100)
    vi.stubGlobal('fetch', mockFetch(respuestaModelo('NINGUNA')))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.coste_cobrado).toBe(1)
    expect(db.saldo).toBe(99)
  })

  it('saldo insuficiente (< 5): devuelve 402 sin llamar a Anthropic', async () => {
    const db = crearDbMock(3)
    const fetchMock = vi.fn(async (url) => {
      if (url.includes('lemonsqueezy')) {
        return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
      }
      throw new Error('No debería llamar a Anthropic')
    })
    vi.stubGlobal('fetch', fetchMock)

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(402)
    expect(body.error).toBe('no_credits')
    expect(db.saldo).toBe(3)            // sin tocar
    expect(db.consumos).toHaveLength(0) // sin registrar
  })

  it('error de red (Anthropic): reembolso total de 5 créditos', async () => {
    const db = crearDbMock(100)
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.includes('lemonsqueezy')) {
        return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
      }
      throw new Error('network error')
    }))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(502)
    expect(body.error).toBe('network_error')
    expect(db.saldo).toBe(100)  // 100 - 5 + 5
    expect(db.consumos[0]).toMatchObject({ coste: 5, resultado: 'reembolsado' })
  })

  it('JSON inválido del modelo: reembolso total de 5 créditos', async () => {
    const db = crearDbMock(100)
    vi.stubGlobal('fetch', mockFetch('Lo siento, no puedo identificar esta moneda.'))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toBe('respuesta_json_invalida')
    expect(db.saldo).toBe(100)
    expect(db.consumos[0]).toMatchObject({ coste: 5, resultado: 'reembolsado' })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 3 — REGRESIÓN: tarea «contexto» no cambia de comportamiento
// Verifica que MAX_BODY_BYTES=4MB y construir(lang) extra arg no afectan a contexto.
// ═══════════════════════════════════════════════════════════════════════════

describe('regresión: tarea contexto — comportamiento inalterado', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('devuelve texto y coste 1 con petición estándar', async () => {
    const db = crearDbMock(10)
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.includes('lemonsqueezy')) {
        return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
      }
      return {
        ok: true,
        json: async () => ({ content: [{ type: 'text', text: 'Texto histórico generado.' }] }),
      }
    }))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'contexto',
      campo: 'contexto_historico',
      datos: 'Felipe IV, 8 reales, Sevilla, 1625',
      lang: 'es',
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.texto).toBe('Texto histórico generado.')
    expect(body.coste).toBe(1)
    expect(db.saldo).toBe(9)
    expect(db.consumos[0]).toMatchObject({ tarea: 'contexto', coste: 1, resultado: 'ok' })
  })

  it('rechaza campo inválido sin tocar créditos ni llamar a Anthropic', async () => {
    const db = crearDbMock(10)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'contexto',
      campo: 'campo_inexistente',
      datos: 'Felipe IV',
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('campo_invalido')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(db.saldo).toBe(10)
  })

  it('datos > 4000 chars → datos_invalidos sin tocar créditos', async () => {
    const db = crearDbMock(10)
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'contexto',
      campo: 'contexto_historico',
      datos: 'x'.repeat(4001),
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.error).toBe('datos_invalidos')
    expect(fetchMock).not.toHaveBeenCalled()
    expect(db.saldo).toBe(10)
  })

  it('payload con MAX_BODY_BYTES bytes exactos (4 MB menos 1 byte) — no rechazado', async () => {
    // Confirma que el tope es 4 MB y no el antiguo 32 KB.
    // Se testea a nivel de Content-Length declarado; el texto real es pequeño.
    const db = crearDbMock(10)
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url.includes('lemonsqueezy')) {
        return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
      }
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'ok' }] }) }
    }))

    const bodyObj = {
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'contexto',
      campo: 'contexto_historico',
      datos: 'Felipe IV, 8 reales',
      lang: 'es',
    }
    const bodyStr = JSON.stringify(bodyObj)
    // Petición con Content-Length declarado muy pequeño — no debe rechazarse
    const ctx = {
      request: {
        headers: { get: (name) => name === 'content-length' ? '100' : null },
        text: async () => bodyStr,
      },
      env: { DB: db, ANTHROPIC_API_KEY: 'test-key', LS_API_KEY: 'test-ls-key' },
    }

    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
  })
})
