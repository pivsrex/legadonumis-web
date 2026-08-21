// DELETE /api/license/deactivate
// Libera la plaza de activación de un equipo en LemonSqueezy. La API key nunca sale del servidor.
// Body: { license_key, instance_id }
// Returns: { ok: boolean }
//
// Este endpoint faltaba por completo (no existía ni aquí ni en el repo
// anterior). El cliente (electron/license.ts → deactivateWithServer) ya
// llamaba a esta ruta desde el principio, pero al no existir, la petición
// fallaba silenciosamente (best-effort, el resultado se descarta) y
// deactivateLicense() limpiaba igualmente el estado local — el usuario veía
// "desactivado" con éxito, pero la instancia seguía contando contra el
// límite de activaciones de la licencia en LemonSqueezy. Sin esto,
// "desactivar aquí, activar en otro equipo" solo funcionaba mientras el
// límite de activaciones no se agotara con instancias fantasma nunca
// liberadas.

const LS_DEACTIVATE = 'https://api.lemonsqueezy.com/v1/licenses/deactivate'

export async function onRequestDelete(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ ok: false, error: 'invalid_body' }, 400) }

  const { license_key, instance_id } = body
  if (!license_key || !instance_id) {
    return json({ ok: false, error: 'missing_params' }, 400)
  }

  try {
    const res = await fetch(LS_DEACTIVATE, {
      method: 'POST',   // la API de LemonSqueezy usa POST para /deactivate, aunque el cliente nos llame con DELETE
      headers: {
        'Authorization': `Bearer ${context.env.LS_API_KEY}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ license_key, instance_id }),
    })
    const data = await res.json()
    return json({ ok: data.deactivated === true })
  } catch {
    // Sin red hacia LemonSqueezy: no se puede confirmar la liberación. El
    // cliente ya limpia su estado local de todos modos (deactivateLicense()
    // en electron/license.ts es best-effort a propósito), así que aquí solo
    // devolvemos el fallo real — no hay nada más seguro que responder.
    return json({ ok: false, error: 'network_error' }, 502)
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
