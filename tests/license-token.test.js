/**
 * Tests de firmarTokenLicencia() (functions/api/_shared/license-token.js).
 *
 * Genera un par de claves ECDSA P-256 de prueba con node:crypto (nunca la
 * clave real de producción, que solo vive como secreto de Cloudflare Pages)
 * y comprueba que:
 *   1. Sin LICENSE_SIGNING_PRIVATE_KEY en el entorno, no se firma nada (null).
 *   2. Con la clave presente, el token producido tiene el payload correcto
 *      (incluida la huella del equipo) y su firma verifica con node:crypto
 *      usando dsaEncoding 'ieee-p1363' — el mismo formato que usa el cliente
 *      Electron (ver electron/lib/license-token.ts en el repo de Legado).
 *      Esto es la prueba de interoperabilidad real entre lo que firma el
 *      Worker (Web Crypto) y lo que verifica el cliente (node:crypto).
 *   3. `deviceFingerprint: null` (huella no grabada — ver validate.js) se
 *      firma igualmente como `dev: null`, sin lanzar.
 */
import { describe, it, expect } from 'vitest'
import { generateKeyPairSync, createPublicKey, verify as verificarFirma } from 'node:crypto'
import { firmarTokenLicencia } from '../functions/api/_shared/license-token.js'

const { publicKey: CLAVE_PUB_PRUEBA, privateKey: CLAVE_PRIV_PRUEBA } = generateKeyPairSync('ec', {
  namedCurve:           'P-256',
  publicKeyEncoding:  { type: 'spki',  format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

describe('firmarTokenLicencia()', () => {
  it('sin LICENSE_SIGNING_PRIVATE_KEY en el entorno → null', async () => {
    const token = await firmarTokenLicencia('LK-1', 'inst-1', 'huella-1', {})
    expect(token).toBeNull()
  })

  it('con la clave presente → token con payload correcto (incluida la huella) y firma verificable', async () => {
    const env = { LICENSE_SIGNING_PRIVATE_KEY: CLAVE_PRIV_PRUEBA }
    const antes = Math.floor(Date.now() / 1000)
    const token = await firmarTokenLicencia('LK-XYZ', 'inst-42', 'huella-del-equipo-42', env)
    const despues = Math.floor(Date.now() / 1000)

    expect(token).toBeTypeOf('string')
    const [payloadB64, sigB64] = token.split('.')
    expect(payloadB64).toBeTruthy()
    expect(sigB64).toBeTruthy()

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
    expect(payload.lk).toBe('LK-XYZ')
    expect(payload.iid).toBe('inst-42')
    expect(payload.dev).toBe('huella-del-equipo-42')
    expect(payload.iat).toBeGreaterThanOrEqual(antes)
    expect(payload.iat).toBeLessThanOrEqual(despues)
    // TTL de 45 días
    expect(payload.exp - payload.iat).toBe(45 * 86400)

    // Interoperabilidad real: verificar con node:crypto igual que hace el cliente.
    const ok = verificarFirma(
      'sha256',
      Buffer.from(payloadB64, 'utf8'),
      { key: createPublicKey(CLAVE_PUB_PRUEBA), dsaEncoding: 'ieee-p1363' },
      Buffer.from(sigB64, 'base64url'),
    )
    expect(ok).toBe(true)
  })

  it('deviceFingerprint null (huella no grabada) → se firma dev:null sin lanzar', async () => {
    const env = { LICENSE_SIGNING_PRIVATE_KEY: CLAVE_PRIV_PRUEBA }
    const token = await firmarTokenLicencia('LK-1', 'inst-1', null, env)
    expect(token).toBeTypeOf('string')
    const payload = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8'))
    expect(payload.dev).toBeNull()
  })

  it('el token no verifica contra una clave pública que no corresponda', async () => {
    const otraPar = generateKeyPairSync('ec', {
      namedCurve:           'P-256',
      publicKeyEncoding:  { type: 'spki',  format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })
    const env = { LICENSE_SIGNING_PRIVATE_KEY: CLAVE_PRIV_PRUEBA }
    const token = await firmarTokenLicencia('LK-1', 'inst-1', 'huella-1', env)
    const [payloadB64, sigB64] = token.split('.')

    const ok = verificarFirma(
      'sha256',
      Buffer.from(payloadB64, 'utf8'),
      { key: createPublicKey(otraPar.publicKey), dsaEncoding: 'ieee-p1363' },
      Buffer.from(sigB64, 'base64url'),
    )
    expect(ok).toBe(false)
  })
})
