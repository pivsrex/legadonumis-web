// POST /api/license/activate
// Registra un equipo en LemonSqueezy. La API key nunca sale del servidor.
// Body: { license_key }
// Returns: { ok: boolean, instanceId?: string, error?: string }

const LS_ACTIVATE = 'https://api.lemonsqueezy.com/v1/licenses/activate'
const INSTANCE_NAME = 'Legado-360024'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ ok: false, error: 'invalid_body' }, 400) }

  const { license_key } = body
  if (!license_key || typeof license_key !== 'string') {
    return json({ ok: false, error: 'missing_license_key' }, 400)
  }

  try {
    const res = await fetch(LS_ACTIVATE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.LS_API_KEY}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ license_key: license_key.trim().toUpperCase(), instance_name: INSTANCE_NAME }),
    })
    const data = await res.json()
    if (data.activated && data.instance?.id) {
      return json({ ok: true, instanceId: data.instance.id })
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
