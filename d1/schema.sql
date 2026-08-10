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
  license_key    TEXT    PRIMARY KEY,
  creditos       INTEGER NOT NULL DEFAULT 0 CHECK (creditos >= 0),
  creada_en      INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  actualizada_en INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

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
