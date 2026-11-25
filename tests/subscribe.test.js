/**
 * Tests de functions/api/subscribe.js.
 *
 * Cubre:
 *   - Llega "language" válido → se envía ese idioma a Loops
 *   - Llega solo "lang" válido (sin "language") → se envía ese idioma a Loops
 *   - Llega un idioma no soportado → se envía 'en' a Loops
 *   - No llega ningún campo de idioma → se envía 'en' a Loops
 *   - Sin email → 400
 *   - Loops ya tiene el contacto (already exist) → success:true igualmente
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { onRequestPost } from '../functions/api/subscribe.js'

afterEach(() => { vi.restoreAllMocks() })

// ── Helper ───────────────────────────────────────────────────────────────────

function crearCtx(bodyObj, { loopsOk = true, loopsMessage = undefined } = {}) {
  const loopsResponse = loopsOk
    ? { success: true }
    : { success: false, message: loopsMessage ?? 'API error' }

  global.fetch = vi.fn().mockResolvedValue({
    json: async () => loopsResponse,
  })

  return {
    request: {
      headers: { get: () => '1.2.3.4' },
      json: async () => bodyObj,
    },
    env: {
      LOOPS_API_KEY: 'test-key',
      CREDITS: null,   // sin rate-limit en tests
    },
  }
}

function languageSentToLoops() {
  const [, options] = global.fetch.mock.calls[0]
  return JSON.parse(options.body).language
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('subscribe — campo de idioma', () => {
  it('llega "language" válido → se envía ese idioma a Loops', async () => {
    const ctx = crearCtx({ email: 'a@example.com', language: 'fr' })
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
    expect(languageSentToLoops()).toBe('fr')
  })

  it('llega solo "lang" válido (sin "language") → se envía ese idioma a Loops', async () => {
    const ctx = crearCtx({ email: 'b@example.com', lang: 'de' })
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
    expect(languageSentToLoops()).toBe('de')
  })

  it('llega un idioma no soportado → se envía "en" a Loops', async () => {
    const ctx = crearCtx({ email: 'c@example.com', language: 'pt' })
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
    expect(languageSentToLoops()).toBe('en')
  })

  it('no llega ningún campo de idioma → se envía "en" a Loops', async () => {
    const ctx = crearCtx({ email: 'd@example.com' })
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
    expect(languageSentToLoops()).toBe('en')
  })

  it('"language" tiene prioridad sobre "lang" cuando vienen los dos', async () => {
    const ctx = crearCtx({ email: 'e@example.com', language: 'es', lang: 'fr' })
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
    expect(languageSentToLoops()).toBe('es')
  })
})

describe('subscribe — casos de error', () => {
  it('sin email → 400, no se llama a Loops', async () => {
    global.fetch = vi.fn()
    const ctx = {
      request: {
        headers: { get: () => '1.2.3.4' },
        json: async () => ({ language: 'en' }),
      },
      env: { LOOPS_API_KEY: 'test-key', CREDITS: null },
    }
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('Loops responde "already exist" → success:true igualmente', async () => {
    const ctx = crearCtx(
      { email: 'f@example.com', language: 'en' },
      { loopsOk: false, loopsMessage: 'Contact already exists' },
    )
    const res = await onRequestPost(ctx)
    expect(res.status).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})
