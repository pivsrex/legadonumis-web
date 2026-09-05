// Lógica pura de cobro e identificación de moneda.
// Importada tanto por ai.js (handler) como por los tests, para que
// los tests ejerciten el código real sin réplicas.

export const COSTE_IDENTIFICACION = 5

export const CONFIANZAS_VALIDAS = new Set(['ALTA', 'MEDIA', 'BAJA', 'NINGUNA'])

/** Claves que el prompt exige en el JSON de identificación, en español. */
export const CLAVES_IDENTIFICACION = [
  'leyenda_anverso', 'leyenda_reverso', 'emisor', 'autoridad', 'denominacion',
  'ceca', 'fecha', 'referencia_catalogo', 'confianza', 'alternativas',
]

/**
 * Devuelve los créditos a reembolsar según la confianza del resultado.
 * BAJA o NINGUNA → reembolso 4 (coste neto 1).
 * ALTA o MEDIA   → reembolso 0 (coste neto 5).
 */
export function calcularReembolso(resultado) {
  const c = resultado?.confianza
  return (c === 'BAJA' || c === 'NINGUNA') ? 4 : 0
}

/**
 * Valida la estructura del JSON devuelto por el modelo.
 * Devuelve null si es válido, o un string de error si no lo es.
 * Comprueba presencia (k in r), no contenido: el esquema admite null en casi
 * todos los campos, y una comprobación por truthiness rechazaría respuestas legítimas.
 */
export function validarRespuesta(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'respuesta_estructura_invalida'
  const faltan = CLAVES_IDENTIFICACION.filter(k => !(k in r))
  if (faltan.length) return `claves_ausentes:${faltan.join(',')}`
  if (!CONFIANZAS_VALIDAS.has(r.confianza)) return 'confianza_invalida'
  return null
}
