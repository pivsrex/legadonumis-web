# Proceso de release y pruebas de previsualización

## Bases de datos D1 por entorno

El proyecto usa **dos bases de datos D1 separadas** — una por entorno de Cloudflare Pages.
Las pruebas nunca tocan saldos de clientes reales porque los entornos no comparten datos.

| Entorno    | Binding | UUID de la base de datos                       |
| ---------- | ------- | ---------------------------------------------- |
| Production | `DB`    | `97e41879-40b0-4eb1-b232-69c4d64ae717`         |
| Preview    | `DB`    | `acfd13eb-8623-4ac2-b985-75467d189ff4`         |

Los UUIDs se pueden consultar en cualquier momento con:

```bash
npx wrangler d1 list
```

o en Cloudflare Dashboard → Pages → legadonumis-web → Settings → Bindings.

---

## Probar cambios del worker en una previsualización

Cada rama de feature genera una previsualización independiente en
`https://<branch-sanitized>.legadonumis-web.pages.dev`.
Esa previsualización usa la base de datos de preview — **que arranca sin licencias**.

Sin una fila en `licencias` con la clave del tester, el worker devuelve `no_credits`
y la app muestra «Credits available: 0», aunque el tester tenga saldo en producción.

### Procedimiento antes de cada prueba de previsualización

**Paso 1 — Verificar si la clave ya existe en preview:**

```bash
npx wrangler d1 execute acfd13eb-8623-4ac2-b985-75467d189ff4 --remote \
  --command="SELECT license_key, creditos FROM licencias WHERE license_key = '<CLAVE>';"
```

**Paso 2 — Si no existe, insertar la clave con créditos suficientes:**

```bash
npx wrangler d1 execute acfd13eb-8623-4ac2-b985-75467d189ff4 --remote \
  --command="INSERT INTO licencias (license_key, creditos, iniciales_otorgados) VALUES ('<CLAVE>', 100, 1);"
```

`100` créditos alcanzan para 20 identificaciones (coste 5 cada una). Ajustar según lo
extenso que sea la sesión de prueba. La clave tiene que ser real y activa en
LemonSqueezy; el worker la valida contra LS en cada petición.

**Paso 3 — Arrancar Legado apuntando a la previsualización:**

```bash
cd "/path/to/Legado"
LEGADO_API_BASE=https://<branch-sanitized>.legadonumis-web.pages.dev npm run dev
```

Sustituyendo `<branch-sanitized>` por el nombre de la rama con `/` reemplazado por `-`
(p. ej. `fix/ia-identificacion-lang` → `fix-ia-identificacion-lang`).

### Créditos de esta rama (fix/ia-identificacion-lang)

URL de previsualización activa:

```
https://fix-ia-identificacion-lang.legadonumis-web.pages.dev
```

Comando exacto para insertar la clave del tester en la base de datos de preview
(reemplazar `<CLAVE>` por la que usa la app en producción):

```bash
npx wrangler d1 execute acfd13eb-8623-4ac2-b985-75467d189ff4 --remote \
  --command="INSERT INTO licencias (license_key, creditos, iniciales_otorgados) VALUES ('<CLAVE>', 100, 1);"
```

---

## Notas de seguridad

- **No copiar el binding de producción al entorno de preview.** Un worker con un
  bug escribiendo en datos reales es peor que no poder probar.
- Las claves de licencia son datos de cliente: no incluirlas en commits ni en
  documentación de texto plano. Usar siempre `<CLAVE>` como placeholder.
- Los créditos sembrados en preview no tienen ningún impacto económico: son datos
  de prueba en una base aislada.

---

## Consultas de diagnóstico rápidas (preview)

```bash
# Ver todas las licencias en preview
npx wrangler d1 execute acfd13eb-8623-4ac2-b985-75467d189ff4 --remote \
  --command="SELECT license_key, creditos FROM licencias;"

# Ver los últimos consumos en preview
npx wrangler d1 execute acfd13eb-8623-4ac2-b985-75467d189ff4 --remote \
  --command="SELECT * FROM consumos ORDER BY creado_en DESC LIMIT 20;"

# Reponer créditos en preview
npx wrangler d1 execute acfd13eb-8623-4ac2-b985-75467d189ff4 --remote \
  --command="UPDATE licencias SET creditos = creditos + 100 WHERE license_key = '<CLAVE>';"
```

Para los mismos comandos en producción, sustituir el UUID por
`97e41879-40b0-4eb1-b232-69c4d64ae717`.
