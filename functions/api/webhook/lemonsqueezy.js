// POST /api/webhook/lemonsqueezy
// Recibe eventos de LemonSqueezy y gestiona créditos en D1.
//
// Eventos gestionados:
//   license_key.created  → Inicializa créditos para la nueva licencia
//   order_created        → Si es un pack de créditos, añade créditos a la licencia indicada
//
// Para packs de créditos el checkout URL debe incluir:
//   ?checkout[custom][license_key]={license_key_del_usuario}
//
// Las operaciones sobre licencias usan una guarda atómica para que dos llamadas
// simultáneas no puedan otorgar los créditos iniciales dos veces.

import { CREDITOS_INICIALES } from '../_shared/creditos.js'

const VARIANT_PACK_200_DEFECTO = '1913239'

export async function onRequestPost(context) {
  const rawBody   = await context.request.text()
  const signature = context.request.headers.get('X-Signature') ?? ''

  // Verificar firma HMAC-SHA256
  const valid = await verifySignature(rawBody, signature, context.env.LS_WEBHOOK_SECRET)
  if (!valid) return new Response('Unauthorized', { status: 401 })

  let payload
  try { payload = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  const eventName = payload.meta?.event_name ?? ''
  const db        = context.env.DB

  if (!db) return new Response('DB not configured', { status: 503 })

  // ── Identificador de variante del pack: env o respaldo ───────────────────
  const variantPackId = context.env.LS_VARIANT_PACK_200
  if (!variantPackId) {
    console.warn('[webhook] LS_VARIANT_PACK_200 no definido en env — usando respaldo:', VARIANT_PACK_200_DEFECTO)
  }
  const VARIANT_PACK_200 = variantPackId ?? VARIANT_PACK_200_DEFECTO

  // ── Licencia nueva: inicializar créditos ─────────────────────────────────
  if (eventName === 'license_key.created') {
    const licenseKey = payload.data?.attributes?.key
    if (licenseKey) {
      try {
        // 1. Asegurar que existe la fila (sin créditos aún).
        await db
          .prepare(`INSERT INTO licencias (license_key, creditos, iniciales_otorgados)
                    VALUES (?1, 0, 0)
                    ON CONFLICT (license_key) DO NOTHING`)
          .bind(licenseKey)
          .run()
        // 2. Abonar créditos iniciales si aún no se han otorgado (guarda atómica).
        //    Si la fila ya tenía iniciales_otorgados = 1 (p. ej. por una activación
        //    previa o por un segundo disparo del webhook), esta sentencia no hace nada.
        await db
          .prepare(`UPDATE licencias
                       SET creditos = creditos + ?2, iniciales_otorgados = 1
                     WHERE license_key = ?1 AND iniciales_otorgados = 0`)
          .bind(licenseKey, CREDITOS_INICIALES)
          .run()
      } catch {
        // Devolver 500 para que LemonSqueezy reintente en vez de perder el alta.
        return new Response('DB error', { status: 500 })
      }
    }
    return new Response('ok')
  }

  // ── Compra de pack de créditos ────────────────────────────────────────────
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
    } else {
      // Variante no reconocida: registrar para poder reconciliar manualmente.
      console.warn(
        `[webhook] order_created con variante no reconocida — variant_id: ${variantId}, esperado: ${VARIANT_PACK_200}, license_key: …${licenseKey.slice(-4)}`
      )
      try {
        const resumen = JSON.stringify({
          order_id: payload.data?.id,
          total:    payload.data?.attributes?.total,
          email:    payload.data?.attributes?.user_email,
        })
        await db
          .prepare(`INSERT INTO compras_sin_procesar (license_key, variant_id, evento, payload)
                    VALUES (?1, ?2, ?3, ?4)`)
          .bind(licenseKey, variantId, eventName, resumen)
          .run()
      } catch {
        // Best-effort: si falla el registro la respuesta sigue siendo ok.
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
    const enc      = new TextEncoder()
    const key      = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
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
