// GET /api/moneda → { currency: 'EUR' | 'GBP' | 'USD' }
// Detecta la moneda del visitante por país (Cloudflare cf.country o CF-IPCountry).
// Cache-Control: no-store — crítico: si la CDN cachea, el primer visitante
// le fija la moneda a todos los demás que lleguen al mismo edge node.

const PAISES_EURO = new Set([
  'AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR',
  'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK',
  'AD', 'MC', 'SM', 'VA', 'ME', 'XK',
])

export async function onRequestGet(context) {
  const pais =
    context.request.cf?.country ??
    context.request.headers.get('CF-IPCountry') ??
    ''

  let currency
  if (pais === 'GB') currency = 'GBP'
  else if (PAISES_EURO.has(pais)) currency = 'EUR'
  else currency = 'USD'

  return new Response(JSON.stringify({ currency }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
