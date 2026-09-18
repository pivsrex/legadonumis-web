# legadonumis.com en cuatro idiomas — qué se hizo y qué queda

14 de septiembre de 2026. La web pasa de es/en a **es · en · fr · de**.

## Cómo se añade un idioma a partir de ahora

Todo cuelga de `src/langs.ts`, que es el registro único:

```ts
{ code: 'fr', nombre: 'Français', home: '/fr/', locale: 'fr_FR', descarga: '/fr/telechargement.html' }
```

Añadir un idioma son cuatro pasos: una entrada ahí, `src/content/<code>.ts`,
`src/pages/<code>/index.astro` y las cuatro páginas estáticas en `public/<code>/`.
`Layout.astro`, `Navbar.tsx` y `Footer.tsx` se adaptan solos —hreflang, `og:locale`,
conmutador y enlaces del pie salen del registro—, así que no hay que tocarlos.

## Qué cambió

**Contenido nuevo**: `src/content/fr.ts` y `de.ts`, las 148 claves de la interfaz
`Content`, con el vocabulario alineado al de la app (`pièce`/`Exemplar`,
`fiche`/`Datenblatt`, **Legado Basique** / **Legado Basis**, `Réglages`/`Optionen`,
`valeur intrinsèque`/`innerer Wert`). El eslogan conserva la metáfora del museo del
original español: *Le musée numérique de votre collection* / *Das digitale Museum
Ihrer Sammlung*.

**Páginas**: `src/pages/{fr,de}/index.astro`. Las cuatro portadas se generaron desde
la misma plantilla, así que ya no pueden divergir por descuido.

**Conmutador de idioma** (`Navbar.tsx`): el pill con el globo muestra ahora el idioma
actual y abre un desplegable con los cuatro en su nombre nativo, con el activo en
dorado. Reutiliza el patrón `.lg-dl` del menú de descarga, de modo que el toggle lo
sigue manejando el script global de `Layout.astro` y no añade JavaScript nuevo. Sin
JavaScript, el botón lleva al pie.

**Pie** (`Footer.tsx`): los cuatro idiomas como enlaces normales. Esto arregla algo
que ya fallaba con dos: por debajo de 768 px el nav oculta `.lg-nav-btns` entero, así
que **en móvil no había ningún conmutador de idioma**. Ahora lo hay.

**SEO** (`Layout.astro`): las cuatro `hreflang` más `x-default` en todas las páginas,
y `og:locale` por idioma. `public/sitemap.xml` pasa de 8 a 16 URL, con los
`xhtml:link` alternos en las portadas.

**Páginas estáticas**: `public/fr/` y `public/de/` con las cuatro de siempre
(descarga, privacidad, términos, reembolso), generadas desde las inglesas con
`~/work/paginas.py`. Los bloques `<script>` y `<style>` quedan byte a byte idénticos
a los ingleses; solo cambian los textos, los enlaces internos y el `lang`.

**Tabla comparativa**: la fila «Versiones en español e inglés» decía algo que ya no
es cierto. Actualizada a los cuatro idiomas en los cuatro ficheros de contenido.

**Redirección tras descargar Básico** (`Layout.astro`): estaba cableada a dos idiomas
(`isEn ? '/en/download.html' : '/descarga.html'`). Ahora sale de un mapa de cuatro.

## Ajustes posteriores (14 sep)

**Títulos del showcase en alemán, en infinitivo.** El alemán de marketing rehúye el
imperativo de cortesía en los titulares. Los seis que iban en forma de *Sie* pasan a
infinitivo: «Direkt auf die Bilder zeichnen», «Druckfertige Etiketten entwerfen»,
«Ihre Sammlung auf die Karte bringen», «Die eigenen Daten sichtbar machen», «Die
nächsten Erwerbungen planen», «Die Sammlung mit der eigenen Bibliothek verbinden».
El cuerpo de texto sigue en *Sie*, como la app. El francés y el español conservan el
imperativo, que en esas lenguas sí funciona en un titular.

**Botones de la tabla comparativa alineados.** Los dos botones de descarga se
desalineaban en cuanto el bloque de precio de Pro crecía: `minHeight: 88` se quedaba
corto con «Einmalige Zahlung · Ohne Abonnement» partido en dos líneas, y el botón de
Pro bajaba unos diez píxeles respecto al de Básico. Ahora `Comparison.tsx` tiene dos
constantes, `ALTO_PRECIO = 104` y `ALTO_BOTON = 58`, aplicadas a las dos columnas, y
los botones llevan `width: 100%` con `box-sizing: border-box`. Además
`comp_price_launch` pasa a dos líneas explícitas en francés y alemán —el inglés ya lo
estaba—, con «Sans abonnement» / «Ohne Abonnement» debajo de la línea de pago único.
Medido en el navegador: en los cuatro idiomas los dos botones comparten `top`, alto
(60 px) y ancho (203 px), y el bloque de precio mide 104 sin desbordar.

**Página 404 en cuatro idiomas, sin scroll.** Cloudflare Pages sirve el mismo
`404.html` para cualquier ruta, también dentro de `/en/`, `/fr/` y `/de/`, así que la
página no puede tener un idioma fijo. Se renderiza en español —que es lo que ve un
rastreador sin JavaScript— y un script la reescribe: primero mira el prefijo de la
ruta (`/de/lo-que-sea` es un 404 alemán), y si no hay prefijo, el idioma del
navegador; si tampoco, se queda en español. El botón de volver apunta a la portada
del idioma que corresponda.

Se muestra **un solo idioma**, no los cuatro apilados: antes convivían español e
inglés, y con cuatro habría hecho falta scroll, que es justo lo que había que evitar.
Para que quepa sin scroll se redujo la tira de la moneda (220 → 150 px) y la moneda
(210 → 140 px), y el titular pasó de `clamp(28px, 4vw, 44px)` a
`clamp(24px, 3.4vw, 38px)`. Por debajo de 620 px de alto se ocultan la moneda y el
logotipo, que es lo primero que sobra. Comprobado sin scroll en 1440×900, 1280×720,
1440×620 y 390×844.

**Biblioteca en la página de descarga.** La tarjeta de Legado Pro enumeraba las
funciones de pago y se había quedado sin la Biblioteca. Añadido «referencias directas
a bibliografía» en los cuatro idiomas. Las versiones francesa y alemana se
regeneraron con `~/work/paginas.py`, cuyo diccionario está indexado por el texto
inglés: al cambiar el inglés hay que cambiar también la clave.

**Octavo testimonio.** `tm8_quote` en los cuatro ficheros de contenido y en la
interfaz `Content`. La animación del carrusel pasa de 70 s a 80 s para conservar el
mismo ritmo de lectura por tarjeta (eran 10 s con siete; siguen siendo 10 s con ocho).

## Qué queda pendiente

1. ~~Los PDF de la guía en francés y alemán.~~ **Hecho (15 sep).** Los cuatro están en
   `public/assets/` con los nombres que enlazan las páginas de descarga:
   `guia-rapida.pdf`, `quick-start-guide.pdf`, `guide-rapide-legado.pdf` y
   `kurzanleitung-legado.pdf`. Sustituyen a los de agosto, anteriores a la revisión de
   las guías.
2. **Imágenes Open Graph.** `fr` y `de` usan `og-image-en.jpg` de momento, porque solo
   hay versión española e inglesa. Conviene hacer las dos que faltan.
3. **Revisión legal.** Los textos de privacidad, términos y reembolso son traducción
   fiel de los ingleses. Vendiendo a consumidores en Francia y Alemania, merece la
   pena que alguien con criterio legal los mire — sobre todo la cláusula de ley
   aplicable y la de reembolso frente al derecho de desistimiento de la UE.
4. **Detección de idioma.** No la hay: un visitante alemán aterriza en español. Se
   puede resolver con una Function de Cloudflare que mire `Accept-Language` y
   redirija; es trabajo aparte y no bloquea nada.

## Despliegue a producción

**No hay despliegue automático desde `main`**; hay que lanzarlo a mano con wrangler.

### Comando exacto (17 sep 2026)

```bash
cd /ruta/a/legadonumis-web2
npm run build
npx wrangler pages deploy dist --project-name legadonumis-web --branch main
```

El nombre del proyecto en Cloudflare es **`legadonumis-web`**. Puedes confirmarlo con
`npx wrangler pages project list`.

### Trampa de la carpeta functions/

`wrangler pages deploy dist` sube el contenido de `dist/`, pero las Pages Functions se
recogen de la carpeta `functions/` del **directorio desde el que ejecutas el comando**,
no de dentro de `dist/`. Si lo lanzas desde otro directorio, el sitio se publica sin el
middleware y wrangler no avisa de error — simplemente no lo sube.

Señal de que fue bien: la salida de wrangler debe incluir la línea
`✨ Uploading Functions bundle`. Si no aparece, el middleware no está en producción.

### Verificación mínima tras desplegar

```bash
# 302 → /de/
curl -sI -H 'Accept-Language: de-AT,de;q=0.9' https://legadonumis.com/ | grep -Ei 'HTTP|location'

# Cookie lang=es prevalece sobre Accept-Language → 200 sin Location
curl -sI -H 'Accept-Language: de-AT,de;q=0.9' -H 'Cookie: lang=es' https://legadonumis.com/ | grep -Ei 'HTTP|location'

# Ruta interna: 200, sin tocar
curl -sI -H 'Accept-Language: de-AT,de;q=0.9' https://legadonumis.com/en/privacy | grep 'HTTP'

# Bot: 200 sin redirección
curl -sI -A 'Googlebot/2.1' https://legadonumis.com/ | grep -Ei 'HTTP|location'

# Las portadas de idioma no deben escribir cookie (cacheables en el borde)
curl -sI https://legadonumis.com/de/ | grep -i 'set-cookie'   # sin resultados
curl -sI https://legadonumis.com/en/ | grep -i 'set-cookie'   # sin resultados
```

## Nota sobre el build

`npm run build` falla dentro de la carpeta conectada porque Vite necesita borrar
`node_modules/.vite` y el montaje no permite `unlink` (`EPERM`). No es un problema del
código: compila sin avisos en una copia del proyecto. En tu Mac, directamente, funciona.
