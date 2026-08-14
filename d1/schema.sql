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
