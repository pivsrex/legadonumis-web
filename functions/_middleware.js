// Detección de idioma para Cloudflare Pages.
// Solo redirige en la raíz exacta /; el resto pasa siempre sin tocarse.
// Cuando el usuario elige idioma en el conmutador (navega a /en/, /fr/, /de/)
// guardamos su preferencia en una cookie para que la próxima visita a / no
// lo lleve a donde dice el navegador sino a donde él eligió.

const SUPPORTED = ['en', 'fr', 'de']
const LANG_HOME  = { en: '/en/', fr: '/fr/', de: '/de/' }

// User-Agents cuya experiencia depende de ver el contenido canónico (ES).
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|linkedinbot|duckduckbot|ia_archiver|googlebot|bingbot|yandex/i

export async function onRequest({ request, next }) {
  const url  = new URL(request.url)
  const path = url.pathname

  // Navegación explícita a portada de idioma → registrar preferencia y pasar
  const explicitLang = path.match(/^\/(en|fr|de)\/$/)?.[1]
  if (explicitLang) {
    const res = await next()
    const out = new Response(res.body, res)
    out.headers.append(
      'Set-Cookie',
      `lang=${explicitLang}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`
    )
    return out
  }

  // Solo actuar en la raíz exacta
  if (path !== '/') return next()

  // Los bots ven la versión española canónica sin redirección
  const ua = request.headers.get('User-Agent') ?? ''
  if (BOT_RE.test(ua)) return next()

  // Cookie de preferencia (elección manual) > Accept-Language (sugerencia del navegador)
  const cookies    = request.headers.get('Cookie') ?? ''
  const cookieLang = cookies.match(/(?:^|;\s*)lang=([a-z]{2})/)?.[1]

  let target = null

  if (cookieLang && SUPPORTED.includes(cookieLang)) {
    target = cookieLang
  } else {
    // de-AT,de;q=0.9,en;q=0.8  →  de
    const primary = (request.headers.get('Accept-Language') ?? '')
      .split(',')[0]
      .trim()
      .split(/[-_]/)[0]
      .toLowerCase()
    if (SUPPORTED.includes(primary)) target = primary
  }

  // Español u otro idioma no soportado: servir portada ES sin redirigir
  if (!target) return next()

  return Response.redirect(`${url.origin}${LANG_HOME[target]}`, 302)
}
