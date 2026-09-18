// Detección de idioma para Cloudflare Pages.
// Solo actúa en la raíz exacta /; el resto pasa siempre sin tocarse.
// La cookie lang la escribe el conmutador de idioma (Navbar.tsx) cuando el
// usuario elige manualmente; el middleware solo la lee.

// Idiomas reconocidos en la cookie. Incluye ES para que el usuario pueda
// fijar explícitamente la portada española y el middleware la respete.
const COOKIE_LANGS  = ['es', 'en', 'fr', 'de']

// Idiomas que, cuando son el destino, provocan una redirección desde /.
// ES no está aquí: es el contenido por defecto, no redirige.
const REDIRECT_HOME = { en: '/en/', fr: '/fr/', de: '/de/' }

// User-Agents cuya experiencia depende de ver el contenido canónico (ES).
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|duckduckbot|ia_archiver|googlebot|bingbot|yandex/i

export async function onRequest({ request, next }) {
  const url  = new URL(request.url)
  const path = url.pathname

  // Solo actuar en la raíz exacta
  if (path !== '/') return next()

  // Los bots ven la versión española canónica sin redirección
  const ua = request.headers.get('User-Agent') ?? ''
  if (BOT_RE.test(ua)) return next()

  // Cookie de preferencia (elección manual) > Accept-Language (sugerencia del navegador)
  const cookies    = request.headers.get('Cookie') ?? ''
  const cookieLang = cookies.match(/(?:^|;\s*)lang=([a-z]{2})/)?.[1]

  let target = null

  if (cookieLang && COOKIE_LANGS.includes(cookieLang)) {
    // Elección manual registrada. Si el usuario eligió ES, target queda null
    // y se sirve la portada española sin redirigir.
    target = REDIRECT_HOME[cookieLang] ? cookieLang : null
  } else {
    // de-AT,de;q=0.9,en;q=0.8  →  de
    const primary = (request.headers.get('Accept-Language') ?? '')
      .split(',')[0]
      .trim()
      .split(/[-_]/)[0]
      .toLowerCase()
    if (REDIRECT_HOME[primary]) target = primary
  }

  // Español, cookie ES explícita u idioma no soportado: servir portada ES sin redirigir
  if (!target) return next()

  return Response.redirect(`${url.origin}${REDIRECT_HOME[target]}`, 302)
}
