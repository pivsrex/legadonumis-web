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

Después, en el panel de Cloudflare Pages → el proyecto → **Settings → Functions
→ D1 database bindings**, añadir el binding en Production y en Preview:

| Variable | Base de datos     |
| -------- | ----------------- |
| `DB`     | `legado-creditos` |

El nombre de la variable tiene que ser exactamente `DB`: es el que leen
`ai.js`, `balance.js` y `webhook/lemonsqueezy.js` (`context.env.DB`). Si falta,
los endpoints responden `503 db_no_configurada` en vez de fallar de forma
silenciosa.

El binding KV `CREDITS` **se mantiene**, porque `subscribe.js` lo sigue usando
para rate limiting.

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
