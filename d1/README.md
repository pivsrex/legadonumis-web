# Créditos en D1

El saldo de créditos vive en D1, no en Workers KV.

## Por qué se cambió

KV obliga a leer y escribir en dos operaciones separadas:

```js
const current = await kv.get(licenseKey)   // lee
await kv.put(licenseKey, String(current - 1))  // escribe
```

Entre ambas no hay nada que impida que otra petición lea el mismo valor. Con N
peticiones concurrentes, las N leen el mismo saldo y las N escriben el mismo
resultado: se sirven N peticiones y se cobra **una**. KV es además de
consistencia eventual entre regiones, así que la ventana no son milisegundos.

En D1 el descuento es una sola sentencia con guarda:

```sql
UPDATE licencias
   SET creditos = creditos - ?1
 WHERE license_key = ?2 AND creditos >= ?1
```

Si `meta.changes` es 0, no había saldo y no se ha modificado nada. El `CHECK
(creditos >= 0)` de la tabla es el cinturón de seguridad.

KV se mantiene para el rate limiting de `/api/subscribe`: claves efímeras con
TTL donde una carrera no tiene consecuencias. Ese uso es correcto.

## Puesta en marcha

```bash
# 1. Crear la base de datos
npx wrangler d1 create legado-creditos

# 2. Aplicar el esquema
npx wrangler d1 execute legado-creditos --remote --file=./d1/schema.sql

# 3. Comprobar
npx wrangler d1 execute legado-creditos --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Después, en el panel de Cloudflare Pages → el proyecto → **Settings → Bindings**,
añadir el binding en los dos entornos. **Cada entorno apunta a una base de datos
distinta**, para que las pruebas no toquen los saldos de clientes reales:

| Entorno    | Variable | Base de datos             |
| ---------- | -------- | ------------------------- |
| Production | `DB`     | `legado-creditos`         |
| Preview    | `DB`     | `legado-creditos-preview` |

La de preview se crea igual que la de producción y con el mismo `schema.sql`.

El nombre de la variable tiene que ser exactamente `DB` en ambos: es el que leen
`ai.js`, `balance.js` y `webhook/lemonsqueezy.js` (`context.env.DB`). Si falta,
los endpoints responden `503 db_no_configurada` en vez de fallar de forma
silenciosa.

El binding KV `CREDITS` **se mantiene**, porque `subscribe.js` lo sigue usando
para rate limiting.

## Firma de tokens de licencia (secreto `LICENSE_SIGNING_PRIVATE_KEY`)

`functions/api/license/{activate,validate}.js` firman un token offline-verificable
cada vez que confirman una licencia real contra LemonSqueezy (ver
`functions/api/_shared/license-token.js`). El cliente (Electron) verifica ese
token con `node:crypto` contra una clave PÚBLICA embebida en
`electron/lib/license-token.ts`, en vez de confiar en un booleano local sin
firmar — así un `license.json` editado a mano ya no basta para desbloquear el
Pro.

**Puesta en marcha (una sola vez, no se repite en cada deploy):**

1. Generar el par de claves ECDSA P-256 (guardar ambas en un sitio seguro,
   fuera del repo):
   ```bash
   node -e "
   const { publicKey, privateKey } = require('crypto').generateKeyPairSync('ec', {
     namedCurve: 'P-256',
     publicKeyEncoding:  { type: 'spki',  format: 'pem' },
     privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
   });
   console.log(publicKey, privateKey);
   "
   ```
2. Clave **privada** → Cloudflare Pages → proyecto → Settings → Variables and
   Secrets → `LICENSE_SIGNING_PRIVATE_KEY`, pegada tal cual (con las líneas
   `-----BEGIN/END PRIVATE KEY-----`). **En los dos entornos** (Production y
   Preview) — los secretos no se heredan entre entornos, igual que `LS_API_KEY`.
   Usar pares de claves distintos en Production y Preview si se quiere poder
   probar sin arriesgar la clave real.
3. Clave **pública** → pegar en la constante `LICENSE_PUBLIC_KEY_PEM` de
   `electron/lib/license-token.ts` (repo de Legado) y hacer un release nuevo
   del cliente. Publicarla no es un riesgo — solo sirve para verificar firmas,
   nunca para crearlas.
4. Volver a desplegar el sitio para que el Worker recoja el secreto nuevo.

**Si `LICENSE_SIGNING_PRIVATE_KEY` falta o está mal formada**: `firmarTokenLicencia()`
registra un error y devuelve `null`; `validate.js`/`activate.js` responden sin
`token`. El cliente entonces no puede renovar su token — los usuarios con uno
vigente siguen funcionando hasta que expire (TTL 45 días), pero nadie nuevo
puede activarse como Pro hasta que se corrija. Comprobar en los logs de Pages
Functions si hay quejas de activación.

**Rotar la clave** (si se sospecha que la privada se filtró): generar un par
nuevo, actualizar el secreto en Cloudflare y publicar un release del cliente
con la nueva clave pública. Los tokens ya emitidos con la clave vieja seguirán
verificando hasta su expiración (máx. 45 días) en clientes que no se hayan
actualizado — no hay forma de revocarlos antes sin lista de revocación, que
no existe todavía.

### Aviso sobre el desplegable del panel

Al elegir la base de datos en el formulario de binding, seleccionarla con el
ratón puede mostrarla en el campo sin registrarla por dentro: al guardar
aparece "Required" y el cambio se descarta en silencio. Seleccionarla con las
flechas del teclado y confirmar con Enter sí la registra. Conviene recargar la
página después para comprobar que ha quedado guardada.

### Secretos por entorno

Los secretos **no se heredan** de Production a Preview: son listas separadas.
Para poder probar la IA en despliegues de preview hay que añadir en Preview,
como mínimo, `ANTHROPIC_API_KEY` y `LS_API_KEY`. Lo recomendable es usar una
clave de Anthropic distinta de la de producción, para poder revocarla o
limitar su gasto sin tocar el servicio real.

### Apuntar la app al entorno de pruebas

Legado resuelve el origen del servidor en `electron/lib/api-base.ts`. Por
defecto es producción; se redirige exportando `LEGADO_API_BASE` al arrancar:

```bash
LEGADO_API_BASE=https://abc123.legadonumis-web.pages.dev npm run dev
LEGADO_API_BASE=http://localhost:8788 npm run dev   # wrangler pages dev
```

Solo se aceptan orígenes https, o http contra localhost. Cualquier otro valor
se ignora y se usa producción.

La base de datos de preview arranca vacía, así que ninguna licencia tendrá
saldo. Para poder probar hay que sembrar una:

```sql
INSERT INTO licencias (license_key, creditos) VALUES ('LA-CLAVE-DE-PRUEBA', 500);
```

La validación de licencia sigue yendo contra LemonSqueezy real, así que la
clave tiene que ser una válida y activa.

## Migración de saldos existentes

No hay usuarios en producción, así que no hay saldos que migrar. Si hubiera
licencias de prueba en KV que merezca la pena conservar:

```bash
# Listar las claves (las de rate limiting llevan prefijo rl:)
npx wrangler kv key list --binding=CREDITS --remote

# Para cada licencia, leer el saldo e insertarlo
npx wrangler kv key get --binding=CREDITS --remote "LA-CLAVE"
npx wrangler d1 execute legado-creditos --remote \
  --command="INSERT INTO licencias (license_key, creditos) VALUES ('LA-CLAVE', 500)
             ON CONFLICT (license_key) DO UPDATE SET creditos = excluded.creditos"
```

## Migración de esquema

Cuando se añade una tabla nueva a `schema.sql`, **hay que aplicarla manualmente**
a la base de datos ya existente. El esquema no se ejecuta solo al desplegar.

```bash
# Producción
npx wrangler d1 execute legado-creditos --remote --file=./d1/schema.sql

# Preview (si procede)
npx wrangler d1 execute legado-creditos-preview --remote --file=./d1/schema.sql
```

`CREATE TABLE IF NOT EXISTS` hace que el comando sea seguro de relanzar: las
tablas que ya existen no se tocan.

### Columna `iniciales_otorgados` en `licencias` (añadida agosto 2026)

Registra si ya se otorgaron los 500 créditos de bienvenida a una licencia.
Impide que el webhook y el endpoint de activación los abonen dos veces.

**Antes de desplegar**, ejecutar el ALTER TABLE en ambas bases de datos:

```bash
npx wrangler d1 execute legado-creditos --remote \
  --command="ALTER TABLE licencias ADD COLUMN iniciales_otorgados INTEGER NOT NULL DEFAULT 0"

npx wrangler d1 execute legado-creditos-preview --remote \
  --command="ALTER TABLE licencias ADD COLUMN iniciales_otorgados INTEGER NOT NULL DEFAULT 0"
```

Las filas ya existentes quedan con `iniciales_otorgados = 0`, lo que haría que
la próxima activación de cada licencia les abonase 500 créditos. **Ajustar a mano
las filas que ya los tienen antes de desplegar**:

| license_key | Estado real | Acción |
|---|---|---|
| `ECF4D918-…` | 500 otorgados por el webhook, 1 consumido (499 actuales) | Marcar como otorgados |
| `B80D4E29-…` | 500 otorgados manualmente, 200 del pack (700 actuales) | Marcar como otorgados |

```bash
npx wrangler d1 execute legado-creditos --remote --command="UPDATE licencias SET iniciales_otorgados = 1"
```

Este UPDATE afecta a todas las filas presentes. Si en ese momento existe alguna
licencia que aún no haya recibido sus 500 (caso poco probable pero posible),
habría que abonárselos a mano. Verificar con `SELECT * FROM licencias` antes.

### Tabla `compras_sin_procesar` (añadida agosto 2026)

Registra compras de packs cuyo `variant_id` no coincidió con ningún pack
conocido pero traían una `license_key` en los `custom_data`. Permite
reconciliar manualmente el cobro y abonar los créditos con:

```bash
npx wrangler d1 execute legado-creditos --remote \
  --command="SELECT * FROM compras_sin_procesar ORDER BY creado_en DESC LIMIT 20"

# Una vez identificado el problema, abonar manualmente:
npx wrangler d1 execute legado-creditos --remote \
  --command="UPDATE licencias SET creditos = creditos + 200 WHERE license_key = 'XXX'"
```

---

## Consultas útiles

```bash
# Saldo de una licencia
npx wrangler d1 execute legado-creditos --remote \
  --command="SELECT * FROM licencias WHERE license_key = 'XXX'"

# Consumo de los últimos 7 días por tarea
npx wrangler d1 execute legado-creditos --remote \
  --command="SELECT tarea, resultado, COUNT(*) n, SUM(coste) creditos
               FROM consumos
              WHERE creado_en > strftime('%s','now') - 604800
              GROUP BY tarea, resultado"

# Reponer créditos manualmente (soporte)
npx wrangler d1 execute legado-creditos --remote \
  --command="UPDATE licencias SET creditos = creditos + 50 WHERE license_key = 'XXX'"
```

## Añadir una tarea nueva a /api/ai

Todo está en el registro `TAREAS` de `functions/api/ai.js`. Una entrada define
modelo, `max_tokens`, coste en créditos, validación de la entrada y construcción
del mensaje:

```js
identificacion: {
  modelo:    'claude-sonnet-5',
  maxTokens: 1500,
  coste:     12,
  prompts:   { es: SYSTEM_IDENT_ES, en: SYSTEM_IDENT_EN },
  validar(body) { /* nº de imágenes, tamaño, formato */ },
  construir(ok) { /* bloques image + text */ },
}
```

Dos cosas que **no** se deben tocar al añadir tareas:

1. El cliente nunca envía `system`, `model` ni `messages`. Solo `tarea` y datos.
2. `MAX_BODY_BYTES` está en 32 KB porque hoy todas las tareas son de texto. Al
   añadir imágenes hay que subirlo **y** acotar número y tamaño de imágenes
   dentro del `validar` de esa tarea. Subir el tope global sin acotar por tarea
   reabre el agujero de entrada sin límite.
