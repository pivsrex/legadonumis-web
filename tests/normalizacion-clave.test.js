/**
 * Prueba de red: todo endpoint que toque license_key debe importar normalizarClave.
 *
 * Por qué existe: las claves se guardan en minúsculas en D1 y los clientes
 * pueden mandarlas en cualquier caja. Un endpoint que consulte sin normalizar
 * no da error — simplemente no encuentra nada — y el síntoma aparece lejos
 * del fallo (saldo en 0, activación "ok" pero app en Básico, etc.). Es una
 * prueba tosca a propósito: basta con que alguien añada un endpoint nuevo y
 * se olvide de importar normalizarClave para que salte.
 */
import { describe, it, expect } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const API_DIR  = fileURLToPath(new URL('../functions/api', import.meta.url))
const RAIZ_REPO = fileURLToPath(new URL('..', import.meta.url))
const EXCLUIDO = 'functions/api/webhook/lemonsqueezy.js'   // código retirado, pendiente de borrar

async function recogerJsRecursivo(dir) {
  const entradas = await readdir(dir, { withFileTypes: true })
  const archivos = []
  for (const e of entradas) {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) {
      archivos.push(...await recogerJsRecursivo(ruta))
    } else if (e.name.endsWith('.js')) {
      archivos.push(ruta)
    }
  }
  return archivos
}

describe('normalizarClave — cobertura de endpoints', () => {
  it('todo fichero que usa license_key importa normalizarClave', async () => {
    const archivos = await recogerJsRecursivo(API_DIR)

    const infractores = []
    for (const ruta of archivos) {
      const relativa = relative(RAIZ_REPO, ruta).replace(/\\/g, '/')
      if (relativa === EXCLUIDO) continue

      const contenido = await readFile(ruta, 'utf8')
      if (contenido.includes('license_key') && !contenido.includes('normalizarClave')) {
        infractores.push(relativa)
      }
    }

    expect(
      infractores,
      `Los siguientes ficheros usan license_key sin importar normalizarClave:\n${infractores.join('\n')}`,
    ).toHaveLength(0)
  })
})
