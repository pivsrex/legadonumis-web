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

// Campos de identificación cuyo contenido cuenta como aportación al usuario.
// Excluye confianza, para_confirmar, razonamiento, certezas y alternativas
// (estas últimas se comprueban por separado).
const CAMPOS_APORTACION = [
  'emisor', 'autoridad', 'denominacion',
  'ceca', 'fecha', 'referencia_catalogo', 'ambito', 'epoca',
]

/**
 * Devuelve los créditos a reembolsar según el contenido del resultado.
 * Se reembolsan 4 créditos (coste neto 1) solo cuando la respuesta no aporta
 * nada: todos los campos de identificación son null o vacíos Y no hay alternativas.
 * En cualquier otro caso, reembolso 0 (coste neto 5).
 * La confianza global no interviene en este cálculo.
 */
export function calcularReembolso(resultado) {
  if (!resultado || typeof resultado !== 'object') return 4
  const tieneContenido = CAMPOS_APORTACION.some(k => {
    const v = resultado[k]
    return typeof v === 'string' && v.trim().length > 0
  })
  const tieneAlternativas = Array.isArray(resultado.alternativas) && resultado.alternativas.length > 0
  return (tieneContenido || tieneAlternativas) ? 0 : 4
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
