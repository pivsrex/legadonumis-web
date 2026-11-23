// POST /api/license/activate
// Registra un equipo en D1. Consulta Dodo Payments solo si la clave no existe
// aún en la base de datos local (clave desconocida, fail-CLOSED).
// Body: { license_key, device_fingerprint }
// Returns: { ok: boolean, instanceId?: string, token?: string, error?: string }
//
// También firma un token de licencia offline-verificable (ver
// `_shared/license-token.js`) — es el único momento, junto con
// `license/validate.js`, en que se emite uno.
//
// La huella del equipo se graba en D1 en el momento de la activación y
// validate.js la lee de ahí. Ver d1/schema.sql (tabla activaciones) sobre
// por qué la huella no puede actualizarse fuera de una activación real.

import { CREDITOS_INICIALES }                              from '../_shared/creditos.js'
import { normalizarClave, LIMITE_EQUIPOS, preguntarADodo } from '../_shared/licencia.js'
import { firmarTokenLicencia }                             from '../_shared/license-token.js'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ ok: false, error: 'invalid_body' }, 400) }

  const clave = normalizarClave(body?.license_key)
  if (!clave) return json({ ok: false, error: 'missing_license_key' }, 400)

  // La base de datos usa siempre `clave` (minúsculas). El token debe contener
  // la clave TAL CUAL la mandó el cliente porque el cliente compara payload.lk
  // con la cadena que él guardó —que es la que él envió—, no con la versión
  // normalizada. Si se firmara `clave` aquí, la activación respondería ok pero
  // la app se quedaría en Básico porque los strings no coincidirían.
  const claveOriginal = body.license_key.trim()

  const deviceFingerprint = typeof body?.device_fingerprint === 'string' && body.device_fingerprint
    ? body.device_fingerprint
    : null

  const db = context.env.DB
  if (!db) return json({ ok: false, error: 'db_error' }, 503)

  try {
    // 1. Buscar la fila de licencia en D1.
    let fila = await db
      .prepare('SELECT estado FROM licencias WHERE license_key = ?1')
      .bind(clave)
      .first()

    // 2. Clave desconocida → preguntar a Dodo (fail-CLOSED).
    if (!fila) {
      const valida = await preguntarADodo(clave, context.env)
      if (!valida) return json({ ok: false, error: 'invalid' })

      // Dodo confirmó la licencia; insertar fila base.
      await db
        .prepare(
          `INSERT INTO licencias (license_key, creditos, iniciales_otorgados, estado)
           VALUES (?1, 0, 0, 'activa')
           ON CONFLICT (license_key) DO NOTHING`,
        )
        .bind(clave)
        .run()

      fila = { estado: 'activa' }
    }

    // 3. Licencia revocada.
    if (fila.estado !== 'activa') return json({ ok: false, error: 'revoked' })

    // 4. ¿El mismo equipo ya activó? Detectar por huella (reinstalación).
    if (deviceFingerprint) {
      const filaExistente = await db
        .prepare(
          'SELECT instance_id FROM activaciones WHERE license_key = ?1 AND device_fingerprint = ?2 LIMIT 1',
        )
        .bind(clave, deviceFingerprint)
        .first()

      if (filaExistente) {
        // Intentar abonar créditos iniciales por si el webhook no llegó a hacerlo
        // antes de que este equipo activara por primera vez. Best-effort: si falla,
        // la plaza ya está grabada y la activación no puede fallar por esto.
        await abonarInicialesSiProcede(db, clave)
        // Firmar con claveOriginal, no con clave: ver comentario al inicio del handler.
        const token = await firmarTokenLicencia(claveOriginal, filaExistente.instance_id, deviceFingerprint, context.env)
        return json({ ok: true, instanceId: filaExistente.instance_id, token: token ?? undefined })
      }
    }

    // 5. Comprobar límite de activaciones.
    const { count } = await db
      .prepare('SELECT COUNT(*) AS count FROM activaciones WHERE license_key = ?1')
      .bind(clave)
      .first()

    if (count >= LIMITE_EQUIPOS) return json({ ok: false, error: 'activation_limit' })

    // 6. Nueva activación: nuevo instance_id + grabar huella.
    const instanceId = crypto.randomUUID()
    await db
      .prepare(
        `INSERT INTO activaciones (instance_id, license_key, device_fingerprint)
         VALUES (?1, ?2, ?3)`,
      )
      .bind(instanceId, clave, deviceFingerprint)
      .run()

    // 7. Abonar créditos iniciales si aún no se han otorgado. La plaza ya está
    // grabada en el paso 6; si esto falla, la activación no puede revertirse,
    // así que no se puede lanzar — el webhook o la próxima activación lo reintentará.
    await abonarInicialesSiProcede(db, clave)

    // Firmar con claveOriginal, no con clave: ver comentario al inicio del handler.
    const token = await firmarTokenLicencia(claveOriginal, instanceId, deviceFingerprint, context.env)
    return json({ ok: true, instanceId, token: token ?? undefined })
  } catch {
    return json({ ok: false, error: 'db_error' }, 503)
  }
}

// Abona los créditos iniciales si aún no se han otorgado (guarda atómica).
// Si el webhook ya lo hizo, esta sentencia no hace nada.
// NUNCA lanza: se llama después de grabar la plaza en activaciones o de
// confirmar que ya existe, así que un fallo aquí no puede deshacer la
// activación — solo retrasar el abono hasta la próxima activación.
async function abonarInicialesSiProcede(db, clave) {
  try {
    await db
      .prepare(
        `UPDATE licencias
            SET creditos = creditos + ?2, iniciales_otorgados = 1
          WHERE license_key = ?1 AND iniciales_otorgados = 0`,
      )
      .bind(clave, CREDITOS_INICIALES)
      .run()
  } catch {
    console.error('[activate] Error al abonar créditos iniciales — se reintentará en la próxima activación')
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
