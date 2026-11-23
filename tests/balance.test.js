/**
 * Tests de functions/api/balance.js.
 *
 * Cubre:
 *   1. POST con clave en MAYÚSCULAS y fila guardada en minúsculas → saldo correcto (no 0).
 *   2. GET  con clave en MAYÚSCULAS → lo mismo.
 *   3. Licencia inexistente → credits:0 y aviso en consola.
 *   4. Sin license_key → 400.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestPost, onRequestGet } from '../functions/api/balance.js'

afterEach(() => { vi.restoreAllMocks() })

// El mock solo devuelve la fila si la clave llega exactamente en minúsculas.
// Así, que el test devuelva el saldo correcto prueba que la normalización ocurrió.
function crearDbMock({ creditos = 500, claveBd = null } = {}) {
  return {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              if (claveBd !== null && args[0] !== claveBd) return null
              return { creditos }
            },
          }
        },
      }
    },
  }
}

function crearCtxPost(bodyObj, db) {
  return {
    request: { json: async () => bodyObj },
    env: { DB: db },
  }
}

function crearCtxGet(params, db) {
  const url = new URL('https://example.com/api/balance')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return {
    request: { url: url.toString() },
    env: { DB: db },
  }
}

describe('onRequestPost', () => {
  it('clave en MAYÚSCULAS, fila en minúsculas → devuelve el saldo correcto', async () => {
    const db = crearDbMock({ creditos: 500, claveBd: 'abcd-1234' })
    const res = await onRequestPost(crearCtxPost(
      { license_key: 'ABCD-1234', instance_id: 'inst-1' },
      db,
    ))
    expect(res.status).toBe(200)
    expect((await res.json()).credits).toBe(500)
  })

  it('sin license_key → 400', async () => {
    const db = crearDbMock()
    const res = await onRequestPost(crearCtxPost({ instance_id: 'inst-1' }, db))
    expect(res.status).toBe(400)
  })

  it('licencia inexistente → credits:0 y aviso en consola', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const db = crearDbMock({ claveBd: 'otra-clave' })   // no coincide con 'abcd-1234'
    const res = await onRequestPost(crearCtxPost(
      { license_key: 'abcd-1234', instance_id: 'inst-1' },
      db,
    ))
    expect(res.status).toBe(200)
    expect((await res.json()).credits).toBe(0)
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0][0]).toMatch(/\[balance\]/)
  })
})

describe('onRequestGet', () => {
  it('clave en MAYÚSCULAS, fila en minúsculas → devuelve el saldo correcto', async () => {
    const db = crearDbMock({ creditos: 500, claveBd: 'abcd-1234' })
    const res = await onRequestGet(crearCtxGet(
      { license_key: 'ABCD-1234', instance_id: 'inst-1' },
      db,
    ))
    expect(res.status).toBe(200)
    expect((await res.json()).credits).toBe(500)
  })

  it('sin license_key → 400', async () => {
    const db = crearDbMock()
    const res = await onRequestGet(crearCtxGet({ instance_id: 'inst-1' }, db))
    expect(res.status).toBe(400)
  })
})
