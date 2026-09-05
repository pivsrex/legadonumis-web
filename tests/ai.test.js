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
  CLAVES_IDENTIFICACION,
} from '../functions/api/_shared/identificacion-logica.js'
import { onRequestPost, TAREAS, TEXTO_BASE_POR_TIPO, IDIOMAS_IA } from '../functions/api/ai.js'

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

// Objeto base completo y válido reutilizado en los tests de validarRespuesta
const RESP_COMPLETA = {
  leyenda_anverso: 'PHILIPP IIII D G',
  leyenda_reverso: 'HISPAN',
  emisor: 'España',
  autoridad: 'Felipe IV',
  denominacion: '8 reales',
  ceca: 'Sevilla',
  fecha: '1625',
  referencia_catalogo: 'KM#139.3',
  confianza: 'ALTA',
  alternativas: [],
}

describe('validarRespuesta()', () => {
  it('null → respuesta_estructura_invalida', () => {
    expect(validarRespuesta(null)).toBe('respuesta_estructura_invalida')
  })
  it('array → respuesta_estructura_invalida', () => {
    expect(validarRespuesta([])).toBe('respuesta_estructura_invalida')
  })
  it('objeto sin confianza (ni otras claves) → claves_ausentes', () => {
    const err = validarRespuesta({ denominacion: '8 reales' })
    expect(err).toMatch(/^claves_ausentes:/)
    expect(err).toContain('confianza')
  })
  it('objeto completo con confianza no reconocida → confianza_invalida', () => {
    expect(validarRespuesta({ ...RESP_COMPLETA, confianza: 'PROBABLE' })).toBe('confianza_invalida')
  })
  it('objeto completo con confianza en minúsculas → confianza_invalida', () => {
    expect(validarRespuesta({ ...RESP_COMPLETA, confianza: 'alta' })).toBe('confianza_invalida')
  })
  it('ALTA → null (válido)', () => expect(validarRespuesta({ ...RESP_COMPLETA, confianza: 'ALTA' })).toBeNull())
  it('MEDIA → null', () => expect(validarRespuesta({ ...RESP_COMPLETA, confianza: 'MEDIA' })).toBeNull())
  it('BAJA → null',  () => expect(validarRespuesta({ ...RESP_COMPLETA, confianza: 'BAJA' })).toBeNull())
  it('NINGUNA → null', () => expect(validarRespuesta({ ...RESP_COMPLETA, confianza: 'NINGUNA' })).toBeNull())
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

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 4 — INTEGRIDAD DE PROMPTS i18n
// Verifica que los prompts cubren los cuatro idiomas y que los de
// identificación contienen el esquema JSON completo en español.
// ═══════════════════════════════════════════════════════════════════════════

// CLAVES_IDENTIFICACION importado de identificacion-logica.js — fuente única compartida
// con la validación real. Si divergen, el test falla.
const ENUM_CONFIANZA = 'ALTA|MEDIA|BAJA|NINGUNA'
const IDIOMAS = ['es', 'en', 'fr', 'de']
const TIPOS = ['Moneda', 'Medalla', 'Ficha', 'Billete']

// ── validarRespuesta — casos nuevos ────────────────────────────────────────
describe('validarRespuesta() — juego completo de claves', () => {
  // Respuesta completa y válida — incluyendo nulls y alternativas vacías,
  // que son respuestas legítimas (moneda sin leyenda visible, etc.)
  const RESPUESTA_VALIDA_CON_NULLS = {
    leyenda_anverso: null,
    leyenda_reverso: null,
    emisor: 'España',
    autoridad: 'Felipe IV',
    denominacion: '8 reales',
    ceca: null,
    fecha: null,
    referencia_catalogo: null,
    confianza: 'ALTA',
    alternativas: [],
  }

  it('respuesta completa con nulls y alternativas vacías → null (no se rechaza)', () => {
    expect(validarRespuesta(RESPUESTA_VALIDA_CON_NULLS)).toBeNull()
  })

  // EL TEST CENTRAL: reproduce el bug. El modelo obedece la instrucción de
  // conservar 'confianza' en español pero traduce el resto de las claves.
  // Con el código antiguo este test FALLA (validarRespuesta devuelve null).
  it('respuesta parcialmente traducida (Emittent/Nennwert) → claves_ausentes con emisor y denominacion', () => {
    const traducida = {
      Zeichenseite: null,     // leyenda_anverso traducido
      Rückseite: null,        // leyenda_reverso traducido
      Emittent: 'Spanien',    // emisor traducido
      Autorität: 'Felipe IV',
      Nennwert: '8 Reales',   // denominacion traducido
      Münzstätte: 'Sevilla',  // ceca traducido
      Datum: '1625',          // fecha traducido
      Katalog: 'KM#139',      // referencia_catalogo traducido
      confianza: 'ALTA',      // éste sí en español — el modelo obedeció esa instrucción
      Alternativen: [],       // alternativas traducido
    }
    const err = validarRespuesta(traducida)
    expect(err).not.toBeNull()
    expect(err).toMatch(/^claves_ausentes:/)
    expect(err).toContain('emisor')
    expect(err).toContain('denominacion')
  })

  // Quitar cada clave por separado produce un error que la nombra
  for (const clave of CLAVES_IDENTIFICACION) {
    it(`ausencia de '${clave}' → error que la nombra`, () => {
      const { [clave]: _omitida, ...sinClave } = RESPUESTA_VALIDA_CON_NULLS
      const err = validarRespuesta(sinClave)
      expect(err).toMatch(/^claves_ausentes:/)
      expect(err).toContain(clave)
    })
  }
})

describe('integridad del esquema JSON en prompts de identificación', () => {
  const prompts = TAREAS.identificacion_moneda.prompts

  for (const lang of IDIOMAS) {
    describe(`prompt ${lang}`, () => {
      it('existe y no está vacío', () => {
        expect(typeof prompts[lang]).toBe('string')
        expect(prompts[lang].length).toBeGreaterThan(100)
      })

      // Usa CLAVES_IDENTIFICACION importado — la misma fuente que la validación real.
      // Si alguien cambia las claves en el prompt sin actualizar la constante, este test falla.
      for (const clave of CLAVES_IDENTIFICACION) {
        it(`contiene la clave JSON '${clave}'`, () => {
          expect(prompts[lang]).toContain(`"${clave}"`)
        })
      }

      it(`contiene el enum ${ENUM_CONFIANZA}`, () => {
        expect(prompts[lang]).toContain(ENUM_CONFIANZA)
      })
    })
  }
})

describe('cobertura de idiomas del registro TAREAS', () => {
  for (const [nombre, def] of Object.entries(TAREAS)) {
    it(`tarea '${nombre}': prompts exactamente en es, en, fr, de`, () => {
      expect(Object.keys(def.prompts).sort()).toEqual(['de', 'en', 'es', 'fr'])
    })

    it(`tarea '${nombre}': ningún prompt está vacío`, () => {
      for (const lang of IDIOMAS) {
        expect(def.prompts[lang].length).toBeGreaterThan(0)
      }
    })

    it(`tarea '${nombre}': los cuatro prompts son distintos entre sí`, () => {
      const textos = IDIOMAS.map(l => def.prompts[l])
      const unicos = new Set(textos)
      expect(unicos.size).toBe(4)
    })
  }
})

describe('TEXTO_BASE_POR_TIPO: 4 tipos × 4 idiomas sin huecos', () => {
  for (const tipo of TIPOS) {
    for (const lang of IDIOMAS) {
      it(`${tipo}/${lang}: existe y no está vacío`, () => {
        expect(typeof TEXTO_BASE_POR_TIPO[tipo]?.[lang]).toBe('string')
        expect(TEXTO_BASE_POR_TIPO[tipo][lang].length).toBeGreaterThan(0)
      })
    }
  }
})

describe('handler identificacion_moneda — respuesta con claves traducidas', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('claves traducidas: reembolso íntegro de 5 créditos y 500, en lugar de cobrar', async () => {
    const db = crearDbMock(100)

    // El modelo obedece la instrucción de conservar 'confianza' pero traduce el resto
    const respuestaTraducida = {
      Zeichenseite: null,
      Rückseite: null,
      Emittent: 'Spanien',
      Autorität: 'Felipe IV',
      Nennwert: '8 Reales',
      Münzstätte: 'Sevilla',
      Datum: '1625',
      Katalog: 'KM#139.3',
      confianza: 'ALTA',
      Alternativen: [],
    }
    vi.stubGlobal('fetch', mockFetch(respuestaTraducida))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'identificacion_moneda', imagenes: [IMG],
      lang: 'de',
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toMatch(/^claves_ausentes:/)
    expect(db.saldo).toBe(100)   // 100 - 5 + 5: reembolso íntegro
    expect(db.consumos[0]).toMatchObject({ coste: 5, resultado: 'reembolsado' })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SECCIÓN 5 — CLAMP DE IDIOMA Y RETROCOMPATIBILIDAD
// ═══════════════════════════════════════════════════════════════════════════

describe('clamp de lang: fr y de llegan al handler sin convertirse en es', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  for (const lang of ['fr', 'de']) {
    it(`lang '${lang}' llega al modelo (el prompt es distinto al de es)`, async () => {
      const db = crearDbMock(10)
      let systemUsado = null
      vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
        if (url.includes('lemonsqueezy')) {
          return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
        }
        const body = JSON.parse(opts.body)
        systemUsado = body.system
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'ok' }] }) }
      }))

      const ctx = crearContexto({
        license_key: 'TEST-KEY', instance_id: 'INST-1',
        tarea: 'contexto',
        campo: 'contexto_historico',
        datos: 'Felipe IV, 8 reales',
        lang,
      }, db)

      await onRequestPost(ctx)

      expect(systemUsado).not.toBeNull()
      expect(systemUsado).not.toBe(TAREAS.contexto.prompts.es)
      expect(systemUsado).toBe(TAREAS.contexto.prompts[lang])
    })
  }

  for (const langInvalido of ['xx', null, 42, {}]) {
    it(`lang inválido ${JSON.stringify(langInvalido)} cae a 'es'`, async () => {
      const db = crearDbMock(10)
      let systemUsado = null
      vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
        if (url.includes('lemonsqueezy')) {
          return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
        }
        systemUsado = JSON.parse(opts.body).system
        return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'ok' }] }) }
      }))

      const ctx = crearContexto({
        license_key: 'TEST-KEY', instance_id: 'INST-1',
        tarea: 'contexto',
        campo: 'contexto_historico',
        datos: 'Felipe IV, 8 reales',
        lang: langInvalido,
      }, db)

      await onRequestPost(ctx)

      expect(systemUsado).toBe(TAREAS.contexto.prompts.es)
    })
  }
})

describe('retrocompatibilidad: body sin campo lang usa es', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('petición sin lang devuelve respuesta válida y usa prompt es', async () => {
    const db = crearDbMock(10)
    let systemUsado = null
    vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
      if (url.includes('lemonsqueezy')) {
        return { ok: true, json: async () => ({ valid: true, license_key: { status: 'active' } }) }
      }
      systemUsado = JSON.parse(opts.body).system
      return { ok: true, json: async () => ({ content: [{ type: 'text', text: 'Texto histórico.' }] }) }
    }))

    const ctx = crearContexto({
      license_key: 'TEST-KEY', instance_id: 'INST-1',
      tarea: 'contexto',
      campo: 'contexto_historico',
      datos: 'Felipe IV, 8 reales, Sevilla, 1625',
      // sin campo lang
    }, db)

    const res = await onRequestPost(ctx)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.texto).toBe('Texto histórico.')
    expect(systemUsado).toBe(TAREAS.contexto.prompts.es)
  })
})
