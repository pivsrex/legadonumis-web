// POST /api/license/activate
// Registra un equipo en LemonSqueezy. La API key nunca sale del servidor.
// Body: { license_key }
// Returns: { ok: boolean, instanceId?: string, token?: string, error?: string }
//
// Tras confirmar con LemonSqueezy que la licencia es válida, garantiza que
// exista la fila en D1 y abona los 500 créditos iniciales si aún no se han
// otorgado. Es la red de seguridad por si el webhook license_key_created no
// llegó a procesarse (caída, configuración incompleta, nombre de evento erróneo, etc.).
//
// También firma un token de licencia offline-verificable (ver
// `_shared/license-token.js`) — es el único momento, junto con
// `license/validate.js`, en que se emite uno.

import { CREDITOS_INICIALES } from '../_shared/creditos.js'
import { firmarTokenLicencia } from '../_shared/license-token.js'

const LS_ACTIVATE   = 'https://api.lemonsqueezy.com/v1/licenses/activate'
const INSTANCE_NAME = 'Legado-360024'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ ok: false, error: 'invalid_body' }, 400) }

  const { license_key } = body
  if (!license_key || typeof license_key !== 'string') {
    return json({ ok: false, error: 'missing_license_key' }, 400)
  }

  const keyNorm = license_key.trim().toUpperCase()

  try {
    const res = await fetch(LS_ACTIVATE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.LS_API_KEY}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ license_key: keyNorm, instance_name: INSTANCE_NAME }),
    })
    const data = await res.json()

    if (data.activated && data.instance?.id) {
      // LemonSqueezy confirmó la licencia. Garantizar créditos iniciales en D1.
      // Best-effort: si falla el registro, la activación ya se completó en LS
      // y iniciales_otorgados = 0 permite que el próximo intento lo reintente.
      const db = context.env.DB
      if (db) {
        try {
          // 1. Asegurar que existe la fila.
          await db
            .prepare(`INSERT INTO licencias (license_key, creditos, iniciales_otorgados)
                      VALUES (?1, 0, 0)
                      ON CONFLICT (license_key) DO NOTHING`)
            .bind(keyNorm)
            .run()
          // 2. Abonar créditos iniciales si aún no se han otorgado (guarda atómica).
          //    Si el webhook ya puso iniciales_otorgados = 1, esta sentencia no hace nada.
          //    Si dos activaciones llegan a la vez, solo una pasará el WHERE.
          await db
            .prepare(`UPDATE licencias
                         SET creditos = creditos + ?2, iniciales_otorgados = 1
                       WHERE license_key = ?1 AND iniciales_otorgados = 0`)
            .bind(keyNorm, CREDITOS_INICIALES)
            .run()
        } catch {
          console.error('[activate] Error al abonar créditos iniciales — se reintentará en la próxima activación')
        }
      }
      const token = await firmarTokenLicencia(keyNorm, data.instance.id, context.env)
      return json({ ok: true, instanceId: data.instance.id, token: token ?? undefined })
    }

    return json({ ok: false, error: data.error ?? 'invalid' })
  } catch {
    return json({ ok: false, error: 'network_error' }, 502)
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
