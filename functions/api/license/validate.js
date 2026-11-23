// POST /api/license/validate
// Re-verifica que una licencia sigue activa contra D1.
// Body: { license_key, instance_id }
// Returns: { valid: boolean, token?: string }
//
// Política de fallo (fail-open): solo se invalida una licencia cuando D1
// responde de forma definitiva que no está vigente. Si D1 no está disponible
// o la consulta falla, devuelve valid:true porque esto es RE-verificación de
// una licencia ya confirmada: el cliente conserva su token anterior (TTL
// 45 días) y sigue operando. No se firma token nuevo en casos de
// incertidumbre — solo cuando D1 confirma 'vigente'.
//
// La huella del equipo que se firma dentro del token se lee de D1 (tabla
// `activaciones`, grabada por `activate.js`) — este endpoint NO acepta una
// huella del cuerpo de la petición ni la usa aunque venga. Si lo hiciera,
// una instalación con un license.json copiado de otra máquina "sanaría" su
// copia en la primera revalidación con red: bastaría con dejar que este
// endpoint firmara la huella del equipo nuevo. Al firmar siempre la huella
// grabada en la activación original, una copia sigue sin verificar en el
// equipo nuevo pase lo que pase con la red.

import { normalizarClave, licenciaVigente, huellaDeInstancia } from '../_shared/licencia.js'
import { firmarTokenLicencia }                                  from '../_shared/license-token.js'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ valid: false }, 400) }

  const clave      = normalizarClave(body?.license_key)
  const instanceId = typeof body?.instance_id === 'string' ? body.instance_id.trim() : ''

  if (!clave || !instanceId) return json({ valid: false }, 400)

  // La base de datos usa siempre `clave` (minúsculas). El token debe contener
  // la clave TAL CUAL la mandó el cliente porque el cliente compara payload.lk
  // con la cadena que él guardó —que es la que él envió—, no con la versión
  // normalizada. Si se firmara `clave` aquí, la revalidación rompería el token
  // aunque la activación inicial hubiera funcionado bien.
  const claveOriginal = body.license_key.trim()

  const db     = context.env.DB
  const estado = await licenciaVigente(db, clave, instanceId)

  // 'indeterminado': D1 no disponible → fail-open, sin token nuevo.
  if (estado === 'indeterminado') {
    console.warn('[validate] D1 no disponible — fail-open')
    return json({ valid: true })
  }

  if (estado !== 'vigente') return json({ valid: false })

  const deviceFingerprint = await huellaDeInstancia(db, instanceId)
  // Firmar con claveOriginal, no con clave: ver comentario arriba.
  const token = await firmarTokenLicencia(claveOriginal, instanceId, deviceFingerprint, context.env)
  return json({ valid: true, token: token ?? undefined })
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
