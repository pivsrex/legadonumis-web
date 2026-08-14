# Paso a producción — LemonSqueezy

Bloqueado hasta que LemonSqueezy apruebe la cuenta.
Todo lo probado (licencias, créditos iniciales, compra de packs) se hizo en modo test.
Al pasar a producción hay configuración que no se copia sola.

## Checklist (en orden)

### 1 · Crear webhook de producción en LemonSqueezy

Los webhooks de prueba y producción son listas separadas — no se copian solos.

- URL: `https://legadonumis.com/api/webhook/lemonsqueezy`
- Eventos: `license_key_created` y `order_created`

### 2 · Actualizar secreto de firma en Cloudflare — CRÍTICO

Cada webhook tiene su propio secreto HMAC. El nuevo webhook generará uno distinto.
Si no se actualiza `LS_WEBHOOK_SECRET` en Cloudflare Pages → Production, todas las
compras reales se rechazarán con 401 y el cliente no recibirá créditos.

1. Copiar el secreto del webhook nuevo.
2. Actualizar en Cloudflare Pages → Settings → Variables and Secrets → entorno **Production**.
3. Volver a desplegar para que el worker tome el valor nuevo.
4. Comprobación: compra real → historial de entregas en LS debe mostrar 200, no 401.

### 3 · Limpiar licencias de prueba de la BD de producción

Las compras en modo test escribieron en `legado-creditos` (BD real). No hacen daño
pero ensucian consultas de soporte. Borrar una por una, comprobando la clave:

```bash
npx wrangler d1 execute legado-creditos --remote \
  --command="SELECT license_key, creditos, iniciales_otorgados FROM licencias"

# Borrar cada clave de prueba individualmente:
npx wrangler d1 execute legado-creditos --remote \
  --command="DELETE FROM licencias WHERE license_key = 'LA-CLAVE-AQUI'"
```

Claves de prueba conocidas a agosto 2026: `ECF4D918-…` y `B80D4E29-…`.
Verificar que ninguna sea ya de un cliente real antes de borrar.

### 4 · Verificar resto de configuración en modo real

- `LS_API_KEY`: si LemonSqueezy entrega clave distinta al aprobar, actualizarla;
  si no, la activación de licencias fallará con error de red/autenticación.
- `LS_VARIANT_PACK_200` (`1913239`): los IDs de variante no cambian entre modos,
  pero confirmarlo en el panel.

## Prueba end-to-end a ejecutar después

1. Comprar licencia Pro → fila en D1 con 500 créditos e `iniciales_otorgados = 1`.
2. Activar en la app → no se abonan otros 500.
3. Comprar pack → saldo sube a 700.
4. En LS, historial de entregas: las dos peticiones con respuesta 200.
