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

    const token = await firmarTokenLicencia(license_key, instance_id, context.env)
    return json({ valid: true, token: token ?? undefined })
  } catch {
    // Sin red hacia LemonSqueezy → no invalidar (misma política que antes).
    // Sin token nuevo: el cliente conserva el que ya tenía.
    return json({ valid: true })
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
