// POST /api/webhook/dodo
// Recibe eventos de Dodo Payments (Standard Webhooks) y gestiona licencias y
// créditos en D1.
//
// Eventos gestionados:
//   license_key.created  → Inicializa o completa la fila de licencia y abona créditos iniciales
//   payment.succeeded    → Guarda email/customer en la licencia, o suma créditos a un pack
//   refund.succeeded     → Marca la licencia como 'revocada'
//
// La firma sigue la especificación Standard Webhooks (HMAC-SHA256, cabeceras
// webhook-id / webhook-timestamp / webhook-signature). Ver verificarFirma().

import { CREDITOS_INICIALES, CREDITOS_PACK_200 } from '../_shared/creditos.js'
import { normalizarClave } from '../_shared/licencia.js'

export async function onRequestPost(context) {
  const rawBody = await context.request.text()

  const webhookId        = context.request.headers.get('webhook-id') ?? ''
  const webhookTimestamp = context.request.headers.get('webhook-timestamp') ?? ''
  const webhookSignature = context.request.headers.get('webhook-signature') ?? ''

  const valida = await verificarFirma(
    webhookId, webhookTimestamp, rawBody, webhookSignature,
    context.env.DODO_WEBHOOK_SECRET,
  )
  if (!valida) return new Response('Unauthorized', { status: 401 })

  const db = context.env.DB
  if (!db) return new Response('DB not configured', { status: 503 })

  let payload
  try { payload = JSON.parse(rawBody) } catch { return new Response('Bad JSON', { status: 400 }) }

  const tipo = payload.type ?? ''

  // Idempotencia: si el mismo aviso ya fue procesado, responder 200 sin hacer nada.
  // INSERT ... ON CONFLICT DO NOTHING + meta.changes evita la carrera que dejaría
  // un SELECT+INSERT.
  let rIdem
  try {
    rIdem = await db
      .prepare(`INSERT INTO webhooks_vistos (webhook_id, tipo) VALUES (?1, ?2) ON CONFLICT DO NOTHING`)
      .bind(webhookId, tipo)
      .run()
  } catch {
    return new Response('DB error', { status: 500 })
  }
  if (rIdem.meta.changes === 0) return new Response('ok')

  try {
    if (tipo === 'license_key.created') return await manejarLicenciaCreada(payload.data, db)
    if (tipo === 'payment.succeeded')   return await manejarPagoExitoso(payload.data, db, context.env.DODO_PRODUCT_CREDITOS_200)
    if (tipo === 'refund.succeeded')    return await manejarReembolso(payload.data, db)

    console.warn('[dodo-webhook] tipo no gestionado:', tipo)
    return new Response('ok')
  } catch {
    return new Response('DB error', { status: 500 })
  }
}

// ── Gestores de eventos ───────────────────────────────────────────────────────

async function manejarLicenciaCreada(data, db) {
  const clave      = normalizarClave(data?.key)
  const paymentId  = data?.payment_id  ?? null
  const customerId = data?.customer_id ?? null
  const dodoLicId  = data?.id          ?? null

  if (!clave) return new Response('ok')

  // Paso 1: completar fila pendiente si payment.succeeded llegó antes.
  const rPendiente = await db
    .prepare(
      `UPDATE licencias
          SET license_key = ?1, customer_id = ?2, dodo_lic_id = ?3, estado = 'activa'
        WHERE payment_id = ?4 AND license_key IS NULL`,
    )
    .bind(clave, customerId, dodoLicId, paymentId)
    .run()

  // Paso 2: si no había fila pendiente, insertar o completar por license_key.
  if (rPendiente.meta.changes === 0) {
    await db
      .prepare(
        `INSERT INTO licencias (license_key, creditos, iniciales_otorgados, estado, customer_id, payment_id, dodo_lic_id)
         VALUES (?1, 0, 0, 'activa', ?2, ?3, ?4)
         ON CONFLICT (license_key) DO UPDATE SET
           customer_id = COALESCE(excluded.customer_id, licencias.customer_id),
           payment_id  = COALESCE(excluded.payment_id,  licencias.payment_id),
           dodo_lic_id = COALESCE(excluded.dodo_lic_id, licencias.dodo_lic_id)`,
      )
      .bind(clave, customerId, paymentId, dodoLicId)
      .run()
  }

  // Paso 3: abonar créditos iniciales (guarda atómica; idempotente).
  await db
    .prepare(
      `UPDATE licencias
          SET creditos = creditos + ?2, iniciales_otorgados = 1
        WHERE license_key = ?1 AND iniciales_otorgados = 0`,
    )
    .bind(clave, CREDITOS_INICIALES)
    .run()

  console.log(`[dodo-webhook] license_key.created procesado — …${clave.slice(-4)}`)
  return new Response('ok')
}

async function manejarPagoExitoso(data, db, productoCreditosId) {
  const paymentId   = data?.payment_id      ?? null
  const email       = data?.customer?.email ?? null
  const customerId  = data?.customer?.id    ?? null
  const metadata    = data?.metadata        ?? {}
  const productCart = data?.product_cart    ?? []

  // Comprobar si es compra de pack de créditos.
  const itemCreditos = productoCreditosId
    ? productCart.find(item => item.product_id === productoCreditosId)
    : null

  if (itemCreditos) {
    const cantidad = itemCreditos.quantity ?? 1

    // Buscar la licencia a recargar: 1) metadata.license_key, 2) email del cliente.
    let clave = normalizarClave(metadata.license_key)

    if (!clave && email) {
      const fila = await db
        .prepare(`SELECT license_key FROM licencias WHERE email = ?1 AND license_key IS NOT NULL LIMIT 1`)
        .bind(email)
        .first()
      clave = fila?.license_key ?? null
    }

    if (!clave) {
      console.warn(`[dodo-webhook] pack sin licencia identificable — payment_id: ${paymentId}, email: ${email}`)
      await db
        .prepare(
          `INSERT INTO compras_sin_procesar (license_key, variant_id, evento, payload)
           VALUES (NULL, NULL, ?1, ?2)`,
        )
        .bind('payment.succeeded', JSON.stringify({ payment_id: paymentId, email }))
        .run()
      return new Response('ok')
    }

    await db
      .prepare(
        `UPDATE licencias
            SET creditos = creditos + ?1, actualizada_en = strftime('%s','now')
          WHERE license_key = ?2`,
      )
      .bind(CREDITOS_PACK_200 * cantidad, clave)
      .run()

    console.log(`[dodo-webhook] pack ${cantidad}×200 abonado — …${clave.slice(-4)}`)
    return new Response('ok')
  }

  // Compra de licencia: guardar email y customer_id por payment_id.
  // Si la fila ya existe (license_key.created llegó antes), añadir el email.
  // Si no existe, crear placeholder con license_key = NULL para que
  // license_key.created la complete cuando llegue.
  const rExistente = await db
    .prepare(`UPDATE licencias SET email = ?1, customer_id = ?2 WHERE payment_id = ?3`)
    .bind(email, customerId, paymentId)
    .run()

  if (rExistente.meta.changes === 0) {
    await db
      .prepare(
        `INSERT INTO licencias (license_key, creditos, iniciales_otorgados, estado, email, customer_id, payment_id)
         VALUES (NULL, 0, 0, 'activa', ?1, ?2, ?3)`,
      )
      .bind(email, customerId, paymentId)
      .run()
  }

  return new Response('ok')
}

async function manejarReembolso(data, db) {
  const paymentId = data?.payment_id ?? null
  if (!paymentId) return new Response('ok')

  await db
    .prepare(`UPDATE licencias SET estado = 'revocada' WHERE payment_id = ?1`)
    .bind(paymentId)
    .run()

  return new Response('ok')
}

// ── Verificación de firma Standard Webhooks ───────────────────────────────────

async function verificarFirma(webhookId, webhookTimestamp, rawBody, signatureHeader, secretEnv) {
  if (!secretEnv || !signatureHeader || !webhookId || !webhookTimestamp) return false

  // Rechazar si el timestamp se aleja más de 5 minutos en cualquier dirección.
  const ahora = Math.floor(Date.now() / 1000)
  const ts = parseInt(webhookTimestamp, 10)
  if (isNaN(ts) || Math.abs(ahora - ts) > 300) return false

  // Decodificar secreto: quitar prefijo whsec_ y base64-decodificar.
  let secretBytes
  try {
    const secretStr = secretEnv.startsWith('whsec_') ? secretEnv.slice(6) : secretEnv
    secretBytes = Uint8Array.from(atob(secretStr), c => c.charCodeAt(0))
  } catch {
    return false
  }

  let clave
  try {
    clave = await crypto.subtle.importKey(
      'raw', secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['sign'],
    )
  } catch {
    return false
  }

  const enc = new TextEncoder()
  const contenido = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const sigBytes = await crypto.subtle.sign('HMAC', clave, enc.encode(contenido))
  const firmaEsperada = btoa(String.fromCharCode(...new Uint8Array(sigBytes)))

  // La cabecera puede traer varias firmas separadas por espacio: v1,<b64> v1,<b64>
  for (const parte of signatureHeader.split(' ')) {
    const sep = parte.indexOf(',')
    if (sep === -1) continue
    const prefijo = parte.slice(0, sep)
    const firma   = parte.slice(sep + 1)
    if (prefijo === 'v1' && tiempoConstanteIgual(firmaEsperada, firma)) return true
  }
  return false
}

function tiempoConstanteIgual(a, b) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}
