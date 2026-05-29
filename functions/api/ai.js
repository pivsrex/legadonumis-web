// POST /api/ai
// Proxy hacia Anthropic. Valida licencia con LemonSqueezy y descuenta 1 crédito.
// Body: { license_key, instance_id, model, max_tokens, messages }

const DEV_KEY     = 'LEGADO-DEV-2026-PIVSREX'
const LS_VALIDATE = 'https://api.lemonsqueezy.com/v1/licenses/validate'
const ANTHROPIC   = 'https://api.anthropic.com/v1/messages'

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ error: 'invalid_body' }, 400) }

  const { license_key, instance_id, model, max_tokens, messages, system } = body

  if (!license_key || !instance_id || !model || !messages) {
    return json({ error: 'missing_params' }, 400)
  }

  const isDev = license_key === DEV_KEY

  // Validar licencia con LemonSqueezy (omitir para clave de desarrollo)
  if (!isDev) {
    const valid = await validateLicense(license_key, instance_id, context.env.LS_API_KEY)
    if (!valid) return json({ error: 'invalid_license' }, 403)

    // Comprobar saldo de créditos
    const credits = await getCredits(license_key, context.env.CREDITS)
    if (credits <= 0) return json({ error: 'no_credits' }, 402)
  }

  // Llamar a Anthropic
  const antRes = await fetch(ANTHROPIC, {
    method: 'POST',
    headers: {
      'content-type':      'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key':         context.env.ANTHROPIC_API_KEY,
    },
    body: JSON.stringify({ model, max_tokens, messages, ...(system ? { system } : {}) }),
  })

  const data = await antRes.json()

  if (!antRes.ok) {
    const msg = data?.error?.message ?? `Anthropic error ${antRes.status}`
    return json({ error: msg }, antRes.status)
  }

  // Descontar 1 crédito (no bloquear respuesta si falla)
  if (!isDev) {
    deductCredit(license_key, context.env.CREDITS).catch(() => {})
  }

  const texto = data?.content?.[0]?.text ?? ''
  return json({ texto })
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function validateLicense(licenseKey, instanceId, lsApiKey) {
  try {
    const res = await fetch(LS_VALIDATE, {
      method: 'POST',
      headers: {
        'Accept':        'application/json',
        'Content-Type':  'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${lsApiKey}`,
      },
      body: new URLSearchParams({ license_key: licenseKey, instance_id: instanceId }),
    })
    if (!res.ok) return false
    const d = await res.json()
    return d.valid === true && d.license_key?.status === 'active'
  } catch {
    return false
  }
}

async function getCredits(licenseKey, kv) {
  const stored = await kv.get(licenseKey)
  return stored !== null ? parseInt(stored) || 0 : 0
}

async function deductCredit(licenseKey, kv) {
  const current = await getCredits(licenseKey, kv)
  if (current > 0) await kv.put(licenseKey, String(current - 1))
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
