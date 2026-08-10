// POST /api/webhook/lemonsqueezy
// Recibe eventos de LemonSqueezy y gestiona créditos en D1.
//
// Eventos gestionados:
//   license_key.created  → Inicializa 500 créditos para la nueva licencia
//   order_created        → Si es un pack de créditos, añade créditos a la licencia indicada
//
// Para packs de créditos el checkout URL debe incluir:
//   ?checkout[custom][license_key]={license_key_del_usuario}
//
// Ambas operaciones son UPSERT atómicos. LemonSqueezy reintenta los webhooks que
// no responden 2xx, así que la inicialización tiene que ser idempotente: un
// segundo `license_key.created` para la misma licencia no debe reponer el saldo
// ni pisar lo que el usuario ya haya consumido.

const CREDITOS_INICIALES  = 500
const VARIANT_PACK_200    = '1913239'

export async function onRequestPost(context) {
  const rawBody  = await context.request.text()
  const signature = context.request.headers.get('X-Signature') ?? ''

  // Verificar firma HMAC-SHA256
  const valid = await verifySignature(rawBody, signature, context.env.LS_WEBHOOK_SECRET)
  if (!valid) return new Response('Unauthorized', { status: 401 })

  let payload
  try { payload = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  const eventName = payload.meta?.event_name ?? ''
  const db        = context.env.DB

  if (!db) return new Response('DB not configured', { status: 503 })

  // ── Licencia nueva: inicializar créditos ─────────────────────────────
  if (eventName === 'license_key.created') {
    const licenseKey = payload.data?.attributes?.key
    if (licenseKey) {
      try {
        // DO NOTHING en conflicto: si la licencia ya existe se respeta su saldo.
        await db
          .prepare(`INSERT INTO licencias (license_key, creditos)
                    VALUES (?1, ?2)
                    ON CONFLICT (license_key) DO NOTHING`)
          .bind(licenseKey, CREDITOS_INICIALES)
          .run()
      } catch {
        // Devolver 500 para que LemonSqueezy reintente en vez de perder el alta.
        return new Response('DB error', { status: 500 })
      }
    }
    return new Response('ok')
  }

  // ── Compra de pack de créditos ────────────────────────────────────────
  if (eventName === 'order_created') {
    const variantId  = String(payload.data?.attributes?.first_order_item?.variant_id ?? '')
    const licenseKey = payload.meta?.custom_data?.license_key

    if (!licenseKey) return new Response('ok') // Pack sin licencia vinculada: ignorar

    let addCredits = 0
    if (variantId === VARIANT_PACK_200) addCredits = 200

    if (addCredits > 0) {
      try {
        await db
          .prepare(`INSERT INTO licencias (license_key, creditos)
                    VALUES (?1, ?2)
                    ON CONFLICT (license_key) DO UPDATE
                      SET creditos = creditos + ?2,
                          actualizada_en = strftime('%s','now')`)
          .bind(licenseKey, addCredits)
          .run()
      } catch {
        return new Response('DB error', { status: 500 })
      }
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
