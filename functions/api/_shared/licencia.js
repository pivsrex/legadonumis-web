// Normalización de clave de licencia compartida por todo el sistema.
// TODOS los puntos de entrada —avisos de webhook, activación, validación,
// desactivación e IA— deben pasar la clave por esta función antes de usarla
// como clave primaria o de búsqueda en D1. Si un sitio normaliza distinto que
// otro se acaban teniendo dos filas para la misma licencia y los créditos en
// la que no toca.
export function normalizarClave(valor) {
  if (typeof valor !== 'string' || !valor.trim()) return null
  return valor.trim().toLowerCase()
}

export const LIMITE_EQUIPOS = 2  // "Licencia para dos dispositivos"

// Comprueba si una instancia activa tiene licencia vigente en D1.
// Devuelve 'vigente' | 'no-vigente' | 'indeterminado'.
// 'indeterminado' solo ocurre si D1 no está disponible → el llamador decide
// si falla abierto (validate.js) o cerrado (activate.js).
export async function licenciaVigente(db, clave, instanceId) {
  if (!db) return 'indeterminado'
  try {
    const row = await db
      .prepare(
        `SELECT l.estado FROM licencias l
         JOIN activaciones a ON a.license_key = l.license_key
         WHERE a.instance_id = ?1 AND a.license_key = ?2`,
      )
      .bind(instanceId, clave)
      .first()
    if (row && row.estado === 'activa') return 'vigente'
    return 'no-vigente'
  } catch {
    return 'indeterminado'
  }
}

export async function huellaDeInstancia(db, instanceId) {
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

// Consulta la API pública de Dodo Payments para verificar una clave desconocida.
// Fail-CLOSED: sin confianza previa, cualquier error devuelve false.
export async function preguntarADodo(clave, env) {
  const base = env?.DODO_API_BASE ?? 'https://live.dodopayments.com'
  try {
    const res = await fetch(`${base}/licenses/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ license_key: clave }),
    })
    if (!res.ok) return false
    let data
    try { data = await res.json() } catch { return false }
    return data.valid === true
  } catch {
    return false
  }
}
