// POST /api/balance  { license_key, instance_id }
// GET  /api/balance?license_key=...&instance_id=...  (compatibilidad versiones anteriores)
// Devuelve el saldo de créditos de una licencia activa.
//
// Fuente de verdad: D1 (tabla `licencias`). Ver d1/README.md.

import { normalizarClave } from './_shared/licencia.js'

export async function onRequestPost(context) {
  let license_key, instance_id
  try {
    const body = await context.request.json()
    license_key = body.license_key
    instance_id = body.instance_id
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const clave = normalizarClave(license_key)
  if (!clave || !instance_id) {
    return json({ error: 'missing_params' }, 400)
  }

  return responderSaldo(context.env.DB, clave)
}

export async function onRequestGet(context) {
  const params      = new URL(context.request.url).searchParams
  const license_key = params.get('license_key')
  const instance_id = params.get('instance_id')

  const clave = normalizarClave(license_key)
  if (!clave || !instance_id) {
    return json({ error: 'missing_params' }, 400)
  }

  return responderSaldo(context.env.DB, clave)
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function responderSaldo(db, licenseKey) {
  if (!db) return json({ error: 'db_no_configurada' }, 503)
  const credits = await getCredits(db, licenseKey)
  return json({ credits })
}

async function getCredits(db, licenseKey) {
  try {
    const row = await db
      .prepare('SELECT creditos FROM licencias WHERE license_key = ?1')
      .bind(licenseKey)
      .first()
    if (!row) {
      console.warn(`[balance] licencia no encontrada en D1 — …${licenseKey.slice(-4)}`)
    }
    return row?.creditos ?? 0
  } catch {
    return 0
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'app://legado',
    },
  })
}
