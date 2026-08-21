// POST /api/license/validate
// Re-verifica que una licencia sigue activa. La API key nunca sale del servidor.
// Body: { license_key, instance_id }
// Returns: { valid: boolean, token?: string }
//
// Cuando `valid` es true se firma un token offline-verificable (ver
// `_shared/license-token.js`) para que el cliente pueda confirmar
// criptográficamente su estado de Pro sin depender de un booleano local sin
// firmar. Si LemonSqueezy no responde (catch de abajo) se mantiene la
// política de fail-open existente — `valid: true` sin token nuevo — porque
// esto es RE-verificación de una licencia ya confirmada antes: el cliente
// sigue usando su token anterior, que todavía no habrá expirado (TTL 45
// días). No se firma aquí un token para una licencia que este servidor no
// ha podido confirmar — eso sí sería fabricar una credencial de la nada.
//
// La huella del equipo que se firma dentro del token se lee de D1 (tabla
// `activaciones`, grabada por `activate.js`) — este endpoint NO acepta una
// huella del cuerpo de la petición ni la usa aunque venga. Si lo hiciera,
// una instalación con un license.json copiado de otra máquina "sanaría" su
// copia en la primera revalidación con red: bastaría con dejar que este
// endpoint firmara la huella del equipo nuevo. Al firmar siempre la huella
// grabada en la activación original, una copia sigue sin verificar en el
// equipo nuevo pase lo que pase con la red.

import { firmarTokenLicencia } from '../_shared/license-token.js'

const LS_VALIDATE = 'https://api.lemonsqueezy.com/v1/licenses/validate'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ valid: false }, 400) }

  const { license_key, instance_id } = body
  if (!license_key || !instance_id) {
    return json({ valid: false }, 400)
  }

  try {
    const res = await fetch(LS_VALIDATE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.LS_API_KEY}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ license_key, instance_id }),
    })
    const data = await res.json()
    const valid = data.valid === true && data.license_key?.status === 'active'
    if (!valid) return json({ valid: false })

    const deviceFingerprint = await leerHuellaGrabada(instance_id, context.env)
    const token = await firmarTokenLicencia(license_key, instance_id, deviceFingerprint, context.env)
    return json({ valid: true, token: token ?? undefined })
  } catch {
    // Sin red hacia LemonSqueezy → no invalidar (misma política que antes).
    // Sin token nuevo: el cliente conserva el que ya tenía.
    return json({ valid: true })
  }
}

// Lee la huella grabada en la activación original de esta instancia. `null`
// si D1 no está configurado, la fila no existe (BD antigua sin migrar,
// instancia activada antes de este cambio) o la consulta falla — en
// cualquiera de esos casos firmarTokenLicencia() emitirá un token con
// `dev: null`, que el cliente rechaza en cualquier equipo. Es el fallo
// seguro: preferible a atar el token a un equipo por error.
async function leerHuellaGrabada(instanceId, env) {
  const db = env.DB
  if (!db) return null
  try {
    const row = await db
      .prepare('SELECT device_fingerprint FROM activaciones WHERE instance_id = ?1')
      .bind(instanceId)
      .first()
    return row?.device_fingerprint ?? null
  } catch {
    return null
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
