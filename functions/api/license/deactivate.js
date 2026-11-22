// DELETE /api/license/deactivate
// Libera la plaza de activación de un equipo eliminando la fila de D1.
// Body: { license_key, instance_id }
// Returns: { ok: boolean, error?: string }
//
// Idempotente: si la fila ya no existe (desactivación doble), responde ok:true
// igualmente. El cliente (electron/license.ts → deactivateWithServer) llama
// este endpoint best-effort y limpia su estado local independientemente del
// resultado, así que el único fallo real que reportar es un error de BD.

import { normalizarClave } from '../_shared/licencia.js'

export async function onRequestDelete(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ ok: false, error: 'invalid_body' }, 400) }

  const clave      = normalizarClave(body?.license_key)
  const instanceId = typeof body?.instance_id === 'string' ? body.instance_id.trim() : ''

  if (!clave || !instanceId) return json({ ok: false, error: 'missing_params' }, 400)

  const db = context.env.DB
  if (!db) return json({ ok: false, error: 'db_error' }, 503)

  try {
    await db
      .prepare('DELETE FROM activaciones WHERE instance_id = ?1 AND license_key = ?2')
      .bind(instanceId, clave)
      .run()
    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'db_error' }, 503)
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
