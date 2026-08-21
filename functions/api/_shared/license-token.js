// Firma de tokens de licencia offline-verificables.
//
// Por qué existe: hasta ahora el cliente (Electron) guardaba el estado de
// licencia en un JSON local sin firmar (`activated: true/false`). Cualquiera
// con el .dmg podía extraer el app.asar (no está cifrado, solo minificado) y
// ver exactamente qué campo leer — o simplemente editar el JSON a mano — para
// desbloquear el Pro sin licencia real. Ver `electron/lib/license-token.ts`
// en el repo de Legado para el lado que verifica.
//
// La firma es ECDSA P-256 + SHA-256, en formato IEEE P1363 (r‖s), que es el
// que produce `crypto.subtle.sign` en Workers. El cliente verifica con
// `node:crypto` pidiendo `dsaEncoding: 'ieee-p1363'` para leer el mismo
// formato. Es asimétrica a propósito: la clave privada nunca sale de aquí
// (vive como secreto de Cloudflare Pages), así que ni leyendo el 100% del
// código del cliente se puede fabricar un token válido — solo se puede leer
// la clave pública, que solo sirve para verificar, nunca para firmar.
//
// TTL generoso (45 días) para que un token emitido justo antes de una caída
// de red siga siendo válido durante todo el período de gracia de 30 días que
// ya maneja `electron/license.ts`, más el intervalo de revalidación de 7 días.
// No son sistemas independientes: el TTL del token solo debe ser más largo
// que la suma de ambos para no cortar el acceso antes de lo que la política
// de gracia existente promete.

const TOKEN_TTL_DIAS = 45

let cachedPrivateKey = null
let cachedPrivateKeyPem = null

async function importarClavePrivada(pem) {
  if (cachedPrivateKey && cachedPrivateKeyPem === pem) return cachedPrivateKey
  const cuerpo = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const der = Uint8Array.from(atob(cuerpo), (c) => c.charCodeAt(0))
  cachedPrivateKey = await crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  cachedPrivateKeyPem = pem
  return cachedPrivateKey
}

function base64urlDesdeBuffer(buffer) {
  const bytes = new Uint8Array(buffer)
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDesdeTexto(texto) {
  return base64urlDesdeBuffer(new TextEncoder().encode(texto))
}

/**
 * Firma un token de licencia para (licenseKey, instanceId).
 * Devuelve `null` si falta el secreto `LICENSE_SIGNING_PRIVATE_KEY` en el
 * entorno — los llamadores deben tratar eso como "no se pudo emitir token"
 * y no como error fatal (el cliente conserva su token anterior).
 */
export async function firmarTokenLicencia(licenseKey, instanceId, env) {
  const pem = env.LICENSE_SIGNING_PRIVATE_KEY
  if (!pem) {
    console.error('[license-token] Falta el secreto LICENSE_SIGNING_PRIVATE_KEY — no se emite token')
    return null
  }

  const ahora = Math.floor(Date.now() / 1000)
  const payload = {
    lk:  licenseKey,
    iid: instanceId,
    iat: ahora,
    exp: ahora + TOKEN_TTL_DIAS * 86400,
  }

  try {
    const clavePrivada = await importarClavePrivada(pem)
    const payloadB64 = base64urlDesdeTexto(JSON.stringify(payload))
    const firma = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      clavePrivada,
      new TextEncoder().encode(payloadB64),
    )
    return `${payloadB64}.${base64urlDesdeBuffer(firma)}`
  } catch (e) {
    console.error('[license-token] Error firmando token', e)
    return null
  }
}
