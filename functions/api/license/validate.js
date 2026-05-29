// POST /api/license/validate
// Re-verifica que una licencia sigue activa. La API key nunca sale del servidor.
// Body: { license_key, instance_id }
// Returns: { valid: boolean }

const LS_VALIDATE = 'https://api.lemonsqueezy.com/v1/licenses/validate'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ valid: false }, 400) }

  const { license_key, instance_id } = body
  if (!license_key || !instance_id) {
    return json({ valid: false }, 400)
  }

  try {
    const res = await fetch(LS_VALIDATE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${context.env.LS_API_KEY}`,
        'Accept':        'application/json',
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ license_key, instance_id }),
    })
    const data = await res.json()
    return json({ valid: data.valid === true && data.license_key?.status === 'active' })
  } catch {
    // Sin red → no invalidar (misma política que antes)
    return json({ valid: true })
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
