/**
 * Tests de functions/api/license/deactivate.js.
 *
 * Este endpoint no existía (ver el comentario en el propio archivo): el
 * cliente lo llamaba desde siempre, pero la ruta no estaba implementada, así
 * que "desactivar aquí, activar en otro equipo" solo parecía funcionar en el
 * cliente sin liberar de verdad la plaza en LemonSqueezy.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestDelete } from '../functions/api/license/deactivate.js'

function crearContexto(bodyObj) {
  return {
    request: { json: async () => bodyObj },
    env: { LS_API_KEY: 'test-ls-key' },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('onRequestDelete — validación de entrada', () => {
  it('body no es JSON válido → 400, ok:false', async () => {
    const ctx = { request: { json: async () => { throw new Error('bad json') } }, env: {} }
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

describe('onRequestDelete — LemonSqueezy confirma la desactivación', () => {
  it('deactivated:true → ok:true, 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
      expect(url).toBe('https://api.lemonsqueezy.com/v1/licenses/deactivate')
      expect(opts.method).toBe('POST')
      expect(opts.headers.Authorization).toBe('Bearer test-ls-key')
      expect(JSON.parse(opts.body)).toEqual({ license_key: 'LK-1', instance_id: 'inst-1' })
      return { json: async () => ({ deactivated: true }) }
    }))

    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })
})

describe('onRequestDelete — LemonSqueezy rechaza o falla', () => {
  it('deactivated:false (instancia ya inválida) → ok:false, 200', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      json: async () => ({ deactivated: false, error: 'instance not found' }),
    })))

    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1', instance_id: 'inst-inexistente' }))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(false)
  })

  it('fetch lanza (sin red hacia LemonSqueezy) → 502, ok:false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))

    const res = await onRequestDelete(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(502)
    expect((await res.json()).ok).toBe(false)
  })
})
