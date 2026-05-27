// GET /api/balance?license_key=...&instance_id=...
// Devuelve el saldo de créditos de una licencia activa.

const DEV_KEY = 'LEGADO-DEV-2026-PIVSREX'

export async function onRequestGet(context) {
  const params      = new URL(context.request.url).searchParams
  const license_key = params.get('license_key')
  const instance_id = params.get('instance_id')

  if (!license_key || !instance_id) {
    return json({ error: 'missing_params' }, 400)
  }

  // Clave de desarrollo: créditos ilimitados sin tocar KV ni LemonSqueezy
  if (license_key === DEV_KEY) {
    return json({ credits: 9999 })
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
      'Access-Control-Allow-Origin': '*',
    },
  })
}
