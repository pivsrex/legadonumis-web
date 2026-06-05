// POST /api/balance  { license_key, instance_id }
// GET  /api/balance?license_key=...&instance_id=...  (compatibilidad versiones anteriores)
// Devuelve el saldo de créditos de una licencia activa.

export async function onRequestPost(context) {
  let license_key, instance_id
  try {
    const body = await context.request.json()
    license_key = body.license_key
    instance_id = body.instance_id
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  if (!license_key || !instance_id) {
    return json({ error: 'missing_params' }, 400)
  }

  const credits = await getCredits(license_key, context.env.CREDITS)
  return json({ credits })
}

export async function onRequestGet(context) {
  const params      = new URL(context.request.url).searchParams
  const license_key = params.get('license_key')
  const instance_id = params.get('instance_id')

  if (!license_key || !instance_id) {
    return json({ error: 'missing_params' }, 400)
  }

  const credits = await getCredits(license_key, context.env.CREDITS)
  return json({ credits })
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function getCredits(licenseKey, kv) {
  const stored = await kv.get(licenseKey)
  return stored !== null ? parseInt(stored) || 0 : 0
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
