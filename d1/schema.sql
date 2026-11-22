-- Esquema D1 para el saldo de créditos de Legado.
--
-- Sustituye al namespace KV `CREDITS` como fuente de verdad del saldo.
-- El motivo del cambio es la atomicidad: KV obliga a leer y escribir en dos
-- operaciones separadas, lo que permite que N peticiones concurrentes lean el
-- mismo saldo y se sirvan descontando un único crédito. En D1 el descuento es
-- una sola sentencia con guarda (`WHERE creditos >= ?`), así que la carrera
-- desaparece.
--
-- KV se sigue usando para el rate limiting de /api/subscribe, que es un uso
-- legítimo: claves efímeras con TTL donde una carrera no tiene consecuencias.

CREATE TABLE IF NOT EXISTS licencias (
  license_key          TEXT    PRIMARY KEY,
  creditos             INTEGER NOT NULL DEFAULT 0 CHECK (creditos >= 0),
  creada_en            INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  actualizada_en       INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Columna añadida agosto 2026. En bases de datos ya existentes hay que ejecutar
-- el ALTER TABLE manualmente (ver d1/README.md → Migración de esquema).
-- Las filas existentes quedan con iniciales_otorgados = 0: la próxima activación
-- de cada licencia les abonará 500 créditos. Ajustar a mano antes de desplegar.
ALTER TABLE licencias ADD COLUMN iniciales_otorgados INTEGER NOT NULL DEFAULT 0;

-- Registro de consumo. No es imprescindible para el funcionamiento, pero en un
-- producto de pago las reclamaciones por créditos son inevitables y sin esta
-- tabla no hay forma de reconstruir qué pasó. Las escrituras son best-effort:
-- si fallan, la petición sigue adelante.
CREATE TABLE IF NOT EXISTS consumos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT    NOT NULL,
  tarea       TEXT    NOT NULL,
  coste       INTEGER NOT NULL,
  resultado   TEXT    NOT NULL,  -- 'ok' | 'reembolsado'
  creado_en   INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_consumos_licencia
  ON consumos (license_key, creado_en);

-- Compras no procesadas: packs con variante no reconocida.
-- Si llega un order_created con variant_id desconocido y hay una license_key
-- en los custom_data, se registra aquí para permitir la reconciliación manual.
-- El campo payload contiene solo lo necesario: order_id, importe y email.
-- ⚠️  Esta tabla no se crea sola: hay que ejecutar el schema en la base de datos
--     ya existente (ver d1/README.md → Migración de esquema).
CREATE TABLE IF NOT EXISTS compras_sin_procesar (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT,
  variant_id  TEXT,
  evento      TEXT NOT NULL,
  payload     TEXT,
  creado_en   INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

-- Huella del equipo por activación (instance_id de LemonSqueezy), para atar
-- el token de licencia firmado a la máquina que activó (ver
-- electron/lib/device-fingerprint.ts y electron/lib/license-token.ts en el
-- repo de Legado). Se fija una sola vez en activate.js y nunca se actualiza
-- desde validate.js — si se actualizara con lo que mande el cliente en cada
-- revalidación, copiar license.json a otro equipo "sanaría" la copia la
-- siguiente vez que esa instalación tuviera red, porque el servidor le
-- firmaría un token nuevo atado a la máquina copiada sin darse cuenta. Solo
-- una activación real (con su propio instance_id nuevo) puede fijar una
-- huella nueva.
-- ⚠️  Esta tabla no se crea sola: hay que ejecutar el schema en la base de
--     datos ya existente (ver d1/README.md → Migración de esquema).
CREATE TABLE IF NOT EXISTS activaciones (
  instance_id        TEXT    PRIMARY KEY,
  license_key        TEXT    NOT NULL,
  device_fingerprint TEXT,
  creada_en          INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE INDEX IF NOT EXISTS idx_activaciones_licencia
  ON activaciones (license_key);

-- Columnas añadidas noviembre 2026 para la migración a Dodo Payments.
-- En bases de datos ya existentes hay que ejecutar los ALTER TABLE manualmente
-- (ver d1/README.md → Migración de esquema — Dodo Payments).
-- estado: 'activa' | 'revocada' — pasa a 'revocada' cuando llega un reembolso.
-- email: correo del comprador, llega en el aviso payment.succeeded.
-- customer_id: identificador de cliente en Dodo Payments, para consultas de soporte.
-- payment_id: pago que originó la licencia; con este campo se cosen los dos avisos
--   de una misma venta (license_key.created y payment.succeeded) y se procesa el
--   reembolso desde refund.succeeded.
-- dodo_lic_id: identificador lic_... que Dodo asigna a la licencia.
ALTER TABLE licencias ADD COLUMN estado      TEXT NOT NULL DEFAULT 'activa';
ALTER TABLE licencias ADD COLUMN email       TEXT;
ALTER TABLE licencias ADD COLUMN customer_id TEXT;
ALTER TABLE licencias ADD COLUMN payment_id  TEXT;
ALTER TABLE licencias ADD COLUMN dodo_lic_id TEXT;

-- Índice sobre payment_id: clave de costura entre los dos avisos de una misma
-- venta y clave de búsqueda al procesar un reembolso.
CREATE INDEX IF NOT EXISTS idx_licencias_payment
  ON licencias (payment_id);

-- Garantía de que un pago origina como mucho una licencia. Sin esto, si dos
-- avisos de la misma venta llegasen a crear filas distintas, los créditos
-- iniciales se repartirían entre ambas en lugar de sumarse en una sola. El
-- índice es PARCIAL a propósito (WHERE payment_id IS NOT NULL): las licencias
-- heredadas de LemonSqueezy no tienen payment_id y deben poder coexistir con
-- el campo vacío sin que haya conflicto entre ellas.
CREATE UNIQUE INDEX IF NOT EXISTS idx_licencias_payment_unico
  ON licencias (payment_id) WHERE payment_id IS NOT NULL;

-- Tabla de idempotencia para el receptor de Dodo Payments.
-- Dodo reintenta un aviso hasta 8 veces si no recibe 2xx, así que el mismo
-- aviso puede llegar varias veces y no puede abonar créditos dos veces.
-- ⚠️  Esta tabla no se crea sola: hay que ejecutar el schema en la base de datos
--     ya existente (ver d1/README.md → Migración de esquema — Dodo Payments).
CREATE TABLE IF NOT EXISTS webhooks_vistos (
  webhook_id TEXT    PRIMARY KEY,
  tipo       TEXT    NOT NULL,
  creado_en  INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);
