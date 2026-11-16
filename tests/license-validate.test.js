/**
 * Tests de functions/api/license/validate.js.
 *
 * Cubre tres escenarios:
 *   1. Validación de entrada (body malformado, campos ausentes → 400).
 *   2. LS responde 2xx con JSON: licencia activa → valid:true; inactiva → valid:false.
 *   3. Política fail-open: 401, 500, cuerpo no parseable y sin red → valid:true,
 *      porque esto es RE-verificación de una licencia ya confirmada antes.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestPost } from '../functions/api/license/validate.js'

function crearContexto(bodyObj, envExtra = {}) {
  return {
    request: { json: async () => bodyObj },
    env: { LS_API_KEY: 'test-ls-key', ...envExtra },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('onRequestPost — validación de entrada', () => {
  it('body no es JSON válido → 400, valid:false', async () => {
    const ctx = { request: { json: async () => { throw new Error('bad json') } }, env: {} }
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

describe('onRequestPost — LS responde 2xx con JSON', () => {
  it('licencia activa → valid:true', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ valid: true, license_key: { status: 'active' } }),
    })))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })

  it('licencia inactiva (valid:false en LS) → valid:false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ valid: false, license_key: { status: 'inactive' } }),
    })))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(false)
  })

  it('valid:true pero status no "active" → valid:false', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ valid: true, license_key: { status: 'disabled' } }),
    })))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(false)
  })
})

describe('onRequestPost — política fail-open (LS no puede confirmar)', () => {
  it('401 (API key revocada) → valid:true sin invalidar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401 })))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })

  it('500 (error transitorio de LS) → valid:true sin invalidar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })

  it('respuesta ok pero cuerpo no es JSON válido → valid:true sin invalidar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => { throw new SyntaxError('Unexpected token') },
    })))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })

  it('sin red (fetch lanza excepción) → valid:true sin invalidar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network error') }))

    const res = await onRequestPost(crearContexto({ license_key: 'LK-1', instance_id: 'inst-1' }))
    expect(res.status).toBe(200)
    expect((await res.json()).valid).toBe(true)
  })
})
