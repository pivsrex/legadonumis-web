/**
 * Tests de functions/api/license/deactivate.js (D1-based).
 *
 * Cubre:
 *   1. Validación de entrada (body malformado, campos ausentes → 400).
 *   2. DELETE exitoso → ok:true.
 *   3. DELETE sobre fila inexistente (desactivación doble) → ok:true (idempotente).
 *   4. D1 lanza error → 503, ok:false.
 */
import { describe, it, expect } from 'vitest'
import { onRequestDelete } from '../functions/api/license/deactivate.js'

function crearDbMock({ throws = false } = {}) {
  const eliminadas = []
  const mock = {
    get eliminadas() { return eliminadas },
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async run() {
              if (throws) throw new Error('D1 error simulado')
              if (sql.includes('DELETE FROM activaciones')) {
                eliminadas.push({ instanceId: args[0], clave: args[1] })
              }
              return { meta: { changes: 1 } }
            },
          }
        },
      }
    },
  }
  return mock
}

function crearContexto(bodyObj, db = crearDbMock()) {
  return {
    request: { json: async () => bodyObj },
    env: { DB: db },
  }
}

describe('onRequestDelete — validación de entrada', () => {
  it('body no es JSON válido → 400, ok:false', async () => {
    const ctx = { request: { json: async () => { throw new Error('bad json') } }, env: { DB: crearDbMock() } }
    const res = await onRequestDelete(ctx)
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })

  it('sin license_key → 400, ok:false', async () => {
    const res = await onRequestDelete(crearContexto({ instance_id: 'inst-1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })

  it('sin instance_id → 400, ok:false', async () => {
    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1' }))
    expect(res.status).toBe(400)
    expect((await res.json()).ok).toBe(false)
  })
})

describe('onRequestDelete — D1 procesa la eliminación', () => {
  it('fila existe → DELETE ejecutado → ok:true, 200', async () => {
    const db = crearDbMock()
    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }, db))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(db.eliminadas).toHaveLength(1)
    expect(db.eliminadas[0].instanceId).toBe('inst-1')
    expect(db.eliminadas[0].clave).toBe('lk-1')   // normalizarClave hace trim+lowercase
  })

  it('fila ya no existe (desactivación doble) → ok:true, 200 (idempotente)', async () => {
    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1', instance_id: 'inst-inexistente' }))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

describe('onRequestDelete — fallo de D1', () => {
  it('D1 lanza error → 503, ok:false', async () => {
    const db = crearDbMock({ throws: true })
    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }, db))
    expect(res.status).toBe(503)
    expect((await res.json()).ok).toBe(false)
  })
})
