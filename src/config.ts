export const CURRENT_VERSION = '1.0.49'
// URL del checkout de Legado Pro.
// null = la web no ofrece compra: los botones de Pro llevan a la descarga gratuita.
// Cuando haya pasarela aprobada, basta poner aquí la dirección del checkout para
// que todos los botones de compra vuelvan a funcionar sin tocar nada más.
export const URL_COMPRA_PRO: string | null = null
export const MAC_URL = `https://github.com/pivsrex/Legado-releases/releases/download/v${CURRENT_VERSION}/Legado-${CURRENT_VERSION}-arm64.dmg`
export const WIN_URL = `https://github.com/pivsrex/Legado-releases/releases/download/v${CURRENT_VERSION}/Legado-Setup-${CURRENT_VERSION}.exe`

// Código de descuento del proveedor anterior (LemonSqueezy).
// No es canjeable cuando URL_COMPRA_PRO es null. Reemplazar por el de la nueva pasarela
// antes de volver a poner URL_COMPRA_PRO, o eliminar si la nueva no usa códigos.
export const DISCOUNT_CODE = 'EXNDAXNQ'
