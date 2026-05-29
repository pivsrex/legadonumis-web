// POST /api/ai
// Proxy hacia Anthropic. Valida licencia y descuenta 1 crédito ANTES de llamar a Anthropic.
// Body: { license_key, instance_id, messages, system? }
// Nota: model y max_tokens se ignoran del cliente; se fijan aquí para controlar costes.

const LS_VALIDATE = 'https://api.lemonsqueezy.com/v1/licenses/validate'
const ANTHROPIC   = 'https://api.anthropic.com/v1/messages'
const MODEL       = 'claude-haiku-4-5-20251001'
const MAX_TOKENS  = 600

export async function onRequestPost(context) {
  let body
  try { body = await context.request.json() }
  catch { return json({ error: 'invalid_body' }, 400) }

  const { license_key, instance_id, messages, system } = body

  if (!license_key || !instance_id || !messages) {
    return json({ error: 'missing_params' }, 400)
  }

  // Validar licencia
  const valid = await validateLicense(license_key, instance_id, context.env.LS_API_KEY)
  if (!valid) return json({ error: 'invalid_license' }, 403)

  // Descontar crédito ANTES de llamar a Anthropic
  const deducted = await deductCredit(license_key, context.env.CREDITS)
  if (!deducted) return json({ error: 'no_credits' }, 402)

  // Llamar a Anthropic
  let antRes, data
  try {
    antRes = await fetch(ANTHROPIC, {
      method: 'POST',
      headers: {
        'content-type':      'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key':         context.env.ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({ model: MODEL, max_tokens: MAX_TOKENS, messages, ...(system ? { system } : {}) }),
    })
    data = await antRes.json()
  } catch (e) {
    // Error de red: reembolsar crédito
    await refundCredit(license_key, context.env.CREDITS)
    return json({ error: 'network_error' }, 502)
  }

  if (!antRes.ok) {
    // Error de Anthropic: reembolsar crédito
    await refundCredit(license_key, context.env.CREDITS)
    const msg = data?.error?.message ?? `Anthropic error ${antRes.status}`
    return json({ error: msg }, antRes.status)
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

// Descuenta 1 crédito. Devuelve true si había saldo, false si no.
async function deductCredit(licenseKey, kv) {
  const current = await getCredits(licenseKey, kv)
  if (current <= 0) return false
  await kv.put(licenseKey, String(current - 1))
  return true
}

// Reembolsa 1 crédito si Anthropic falla tras el descuento.
async function refundCredit(licenseKey, kv) {
  try {
    const current = await getCredits(licenseKey, kv)
    await kv.put(licenseKey, String(current + 1))
  } catch { /* ignorar: el usuario contactará si nota el crédito perdido */ }
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
