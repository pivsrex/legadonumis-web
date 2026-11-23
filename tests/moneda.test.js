/**
 * Tests de functions/api/moneda.js y de la constante PRECIOS en src/config.ts.
 *
 * Cubre:
 *   1. País de zona euro → EUR
 *   2. GB → GBP
 *   3. País fuera de euro y no GB → USD
 *   4. Sin país → USD
 *   5. Respuesta lleva Cache-Control: no-store
 *   6. PRECIOS tiene los valores esperados
 */
import { describe, it, expect } from 'vitest'
import { onRequestGet } from '../functions/api/moneda.js'

function crearCtx(pais) {
  return {
    request: {
      cf: pais !== undefined ? { country: pais } : undefined,
      headers: { get: () => null },
    },
  }
}

describe('onRequestGet — moneda por país', () => {
  it('ES → EUR', async () => {
    const res = await onRequestGet(crearCtx('ES'))
    expect(res.status).toBe(200)
    expect((await res.json()).currency).toBe('EUR')
  })

  it('DE → EUR', async () => {
    const res = await onRequestGet(crearCtx('DE'))
    expect((await res.json()).currency).toBe('EUR')
  })

  it('GB → GBP', async () => {
    const res = await onRequestGet(crearCtx('GB'))
    expect((await res.json()).currency).toBe('GBP')
  })

  it('US → USD', async () => {
    const res = await onRequestGet(crearCtx('US'))
    expect((await res.json()).currency).toBe('USD')
  })

  it('AR → USD', async () => {
    const res = await onRequestGet(crearCtx('AR'))
    expect((await res.json()).currency).toBe('USD')
  })

  it('sin país → USD', async () => {
    const res = await onRequestGet(crearCtx(undefined))
    expect((await res.json()).currency).toBe('USD')
  })

  it('respuesta tiene Cache-Control: no-store', async () => {
    const res = await onRequestGet(crearCtx('US'))
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})

describe('PRECIOS', () => {
  it('tiene USD=99, EUR=99, GBP=89', async () => {
    // Importación dinámica para leer src/config.ts compilado por vitest
    const { PRECIOS } = await import('../src/config.ts')
    expect(PRECIOS.USD).toBe(99)
    expect(PRECIOS.EUR).toBe(99)
    expect(PRECIOS.GBP).toBe(89)
  })
})
