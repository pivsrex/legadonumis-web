/**
 * Tests de functions/api/license/validate.js (D1-based).
 *
 * Cubre:
 *   1. Validación de entrada (body malformado, campos ausentes → 400).
 *   2. D1 responde de forma definitiva: vigente → valid:true; no-vigente → valid:false.
 *   3. Política fail-open: D1 lanza excepción → valid:true (RE-verificación de
 *      licencia ya confirmada; el cliente conserva su token anterior).
 */
import { describe, it, expect } from 'vitest'
import { onRequestPost } from '../functions/api/license/validate.js'

function crearDbMock({ estado = 'activa', throws = false } = {}) {
  return {
    prepare(sql) {
      return {
        bind(..._args) {
          return {
            async first() {
              if (throws) throw new Error('D1 error simulado')
              // JOIN activaciones → consulta de licenciaVigente
              if (sql.includes('JOIN activaciones')) {
                if (estado === 'activa') return { estado: 'activa' }
                return null
              }
              // device_fingerprint → consulta de huellaDeInstancia
              if (sql.includes('device_fingerprint')) return null
              return null
            },
          }
        },
      }
    },
  }
}

function crearContexto(bodyObj, db = crearDbMock()) {
  return {
    request: { json: async () => bodyObj },
    env: { DB: db },
  }
}

describe('onRequestPost — validación de entrada', () => {
  it('body no es JSON válido → 400, valid:false', async () => {
    const ctx = { request: { json: async () => { throw new Error('bad json') } }, env: { DB: crearDbMock() } }
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(400)
    expect((await res.json()).valid).toBe(false)
  })

  it('sin license_key → 400, valid:false', async () => {
    const res = await onRequestPost(crearContexto({ instance_id: 'inst-1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).valid).toBe(false)
  })

  it('sin instance_id → 400, valid:false', async () => {
    const res = await onRequestPost(crearContexto({ license_key: 'LK-1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).valid).toBe(false)
  })
})

describe('onRequestPost — D1 responde de forma definitiva', () => {
  it('licencia vigente (JOIN encuentra fila activa) → valid:true', async () => {
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', instance_id: 'inst-1' },
      crearDbMock({ estado: 'activa' }),
    ))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })

  it('licencia no vigente (JOIN no encuentra fila) → valid:false', async () => {
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', instance_id: 'inst-1' },
      crearDbMock({ estado: 'revocada' }),  // estado != 'activa' → JOIN devuelve null
    ))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(false)
  })
})

describe('onRequestPost — política fail-open (D1 no puede confirmar)', () => {
  it('D1 lanza excepción (error transitorio) → valid:true sin invalidar', async () => {
    const res = await onRequestPost(crearContexto(
      { license_key: 'LK-1', instance_id: 'inst-1' },
      crearDbMock({ throws: true }),
    ))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })
})
