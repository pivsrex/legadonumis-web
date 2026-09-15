/* Registro de idiomas del sitio. Añadir uno nuevo es añadir una entrada aquí,
   crear src/content/<code>.ts y src/pages/<code>/index.astro, y copiar las
   cuatro páginas estáticas a public/<code>/. Layout, Navbar y Footer se
   adaptan solos. */

export const LANGS = [
  { code: 'es', nombre: 'Español',  home: '/',    locale: 'es_ES', descarga: '/descarga.html' },
  { code: 'en', nombre: 'English',  home: '/en/', locale: 'en_US', descarga: '/en/download.html' },
  { code: 'fr', nombre: 'Français', home: '/fr/', locale: 'fr_FR', descarga: '/fr/telechargement.html' },
  { code: 'de', nombre: 'Deutsch',  home: '/de/', locale: 'de_DE', descarga: '/de/download.html' },
] as const

export type Lang = (typeof LANGS)[number]['code']

export const SITIO = 'https://legadonumis.com'

export const lang = (code: Lang) => LANGS.find((l) => l.code === code)!
export const canonicalDe = (code: Lang) => SITIO + lang(code).home
