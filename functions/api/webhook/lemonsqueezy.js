// POST /api/webhook/lemonsqueezy
// Recibe eventos de LemonSqueezy y gestiona créditos en KV.
//
// Eventos gestionados:
//   license_key.created  → Inicializa 500 créditos para la nueva licencia
//   order_created        → Si es un pack de créditos, añade créditos a la licencia indicada
//
// Para packs de créditos el checkout URL debe incluir:
//   ?checkout[custom][license_key]={license_key_del_usuario}

const CREDITOS_INICIALES = 500
// PACK_200 y PACK_600 se leen de variables de entorno de Cloudflare (LS_VARIANT_PACK_200 y LS_VARIANT_PACK_600).
// Configurar en el dashboard de Cloudflare Pages → Settings → Environment variables.

export async function onRequestPost(context) {
  const rawBody  = await context.request.text()
  const signature = context.request.headers.get('X-Signature') ?? ''

  // Verificar firma HMAC-SHA256
  const valid = await verifySignature(rawBody, signature, context.env.LS_WEBHOOK_SECRET)
  if (!valid) return new Response('Unauthorized', { status: 401 })

  let payload
  try { payload = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  const eventName = payload.meta?.event_name ?? ''
  const kv        = context.env.CREDITS

  // ── Licencia nueva: inicializar créditos ─────────────────────────────
  if (eventName === 'license_key.created') {
    const licenseKey = payload.data?.attributes?.key
    if (licenseKey) {
      const existing = await kv.get(licenseKey)
      // Solo inicializar si aún no tiene créditos (evitar reinicios accidentales)
      if (existing === null) {
        await kv.put(licenseKey, String(CREDITOS_INICIALES))
      }
    }
    return new Response('ok')
  }

  // ── Compra de pack de créditos ────────────────────────────────────────
  if (eventName === 'order_created') {
    const variantId  = String(payload.data?.attributes?.first_order_item?.variant_id ?? '')
    const licenseKey = payload.meta?.custom_data?.license_key

    if (!licenseKey) return new Response('ok') // Pack sin licencia vinculada: ignorar

    const PACK_200 = context.env.LS_VARIANT_PACK_200 ?? ''
    const PACK_600 = context.env.LS_VARIANT_PACK_600 ?? ''

    let addCredits = 0
    if (PACK_200 && variantId === PACK_200) addCredits = 200
    if (PACK_600 && variantId === PACK_600) addCredits = 600

    if (addCredits > 0) {
      const current = parseInt(await kv.get(licenseKey) || '0') || 0
      await kv.put(licenseKey, String(current + addCredits))
    }

    return new Response('ok')
  }

  // Otros eventos: ignorar
  return new Response('ok')
}

// ── HMAC-SHA256 verification ─────────────────────────────────────────────────

async function verifySignature(body, signature, secret) {
  if (!secret || !signature) return false
  try {
    const enc     = new TextEncoder()
    const key     = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const sigBytes = hexToBytes(signature)
    return await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(body))
  } catch {
    return false
  }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
