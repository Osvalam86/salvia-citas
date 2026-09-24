# Verificación de las secciones del kit

Cómo se mide cada sección de la fase 4, con qué herramientas y qué trampas se
encontraron por el camino. Los scripts viven en `scripts/verify/` y comparan
cada medida con las cifras de su informe de sección: un ✗ es una regresión o
un cambio que hay que explicar, nunca un número que se ajusta sin más.

## Cómo se ejecuta

```bash
pnpm dev          # en otra terminal: el servidor tiene que estar en :5173
pnpm verify 4.5   # 4.1 a 4.5
```

Requisitos: Node ≥ 20 (usa el `WebSocket` y el `fetch` de Node) y Microsoft
Edge. Sin dependencias. La ruta de Edge es la de Windows; en otro sistema,
`EDGE_PATH=/ruta/a/edge`. Otro servidor: `VERIFY_BASE=http://…`.

Salida: una línea ✓/✗ por comprobación y el recuento final; código de salida 1
si alguna no coincide. Las capturas van a `scripts/verify/out/<sección>/`, que
no se versiona.

## Estructura

| Archivo | Qué hace |
|---|---|
| `run.mjs` | Lanzador: comprueba el servidor, abre Edge, ejecuta la sección e imprime la comparación |
| `cdp.mjs` | Arnés: Edge headless por CDP; teclado y ratón reales, capturas, `forced-colors`, barras de scroll, estilos de contraprueba, `tabTo` |
| `checks.mjs` | Funciones que se ejecutan dentro de la página: palabras partidas, desborde horizontal, texto al 200 %, tamaños, foco |
| `static.mjs` | Contrapruebas de ESLint y TypeScript sobre un archivo temporal (`src/views/VerifyTemp.tsx`), que se borra siempre |
| `icon-hashes.mjs` | Formato y hash FNV-1a del `d` de cada icono, frente a los que dio Figma |
| `4.1-acciones.mjs` · `4.2-identidad.mjs` · `4.3-formulario.mjs` · `4.4-navegacion.mjs` · `4.5-busqueda.mjs` | Una sección cada uno |

## Método

- **Teclado y ratón reales.** `Input.dispatchKeyEvent` e
  `Input.dispatchMouseEvent`, no `element.focus()` ni `click()`: el anillo
  depende de `:focus-visible`, que distingue teclado de ratón.
- **Texto al 200 %:** `html { font-size: 200% }` inyectado. Equivale a la
  ampliación solo de texto del navegador porque todo el proyecto mide en rem;
  cada medida comprueba que `html` vale 32px.
- **200 % y chrome que decide una media query.** La inyección en `html` no
  mueve una media query: en ella, `rem` es la letra del navegador. Con la letra
  real al 200 %, `lg` pasa a 2048 y a 1024 sale el chrome móvil. El 200 % se
  prueba sobre el chrome que de verdad aparece: el móvil a 320, nunca el de
  escritorio a 1024.
- **Palabras partidas:** para cada palabra, un `Range` sobre ella; si sus
  rectángulos caen en más de una línea, está partida. «Pudiendo caber» es la
  que cabía entera en el ancho de contenido del elemento, descontados sus
  iconos: esa es la que la regla prohíbe.
- **Barras de scroll:** la clásica de Windows mide 15 px (ancho útil 305 a 320);
  la superpuesta se simula con `Emulation.setScrollbarsHidden`. Las secciones
  que dependen del ancho útil se miden con las dos.
- **`forced-colors`:** `Emulation.setEmulatedMedia` con
  `forced-colors: active`; se leen los colores calculados y se guardan capturas.
- **Contrapruebas:** un estilo temporal (`b.style`, retirado con `b.unstyle`)
  demuestra que una regla actúa: sin ella, la medida cambia.

## Trampas encontradas

- **`Page.setFontSizes` y la inyección en `html` miden cosas distintas.** La
  inyección escala el texto pero no mueve una media query en `rem`; sirve para
  componentes. `Page.setFontSizes` es la letra del navegador y sí la mueve;
  hace falta para el chrome real (texto grande, `lg`). En 4.1 no se mantenía
  entre medidas: desde 4.4, cada medida comprueba la letra del `html` (16, 24
  o 32) en ese momento.
- **`focus()` por script centra el elemento** en Chromium. Una medida de
  desplazamiento al enfocar (`scroll-padding`) va con Tab real (4.4).
- **Intro no activa un `<button>`** si el `keyDown` no lleva `text: '\r'`: sin
  el carácter no hay `keypress`. Lo mismo con Espacio y las casillas (4.2).
- **El panel del navegador integrado** no emula `forced-colors`, no hace
  capturas de una región ampliada y a veces deja de pintar (capturas en blanco).
  Sirve para inspeccionar; las medidas de sección van por CDP.
- **Carreras de navegación:** tras `Page.navigate`, el documento anterior sigue
  respondiendo un momento. `go` espera a la URL de destino y a su `h1`.
- **El perfil de Edge fuera del repo:** Vite vigila el proyecto, y los archivos
  bloqueados del perfil lo tumban (`EBUSY`). El perfil va a la carpeta temporal
  del sistema.
- **Chromium no fuerza el color de un `svg`** que declara el suyo
  (`preserve-parent-color`): en `forced-colors` el icono vuelve a
  `currentcolor` (DESIGN.md § Iconos y roles de color).
- **Las cifras cambian cuando cambia el diseño del componente.** Ejemplo: la
  contraprueba de alto fijo de 4.1 daba 67 px de texto fuera por arriba y 66
  por abajo; tras añadir `flex-wrap` a `c-button` el contenido arranca arriba y
  se sale solo por abajo. Lo que la contraprueba prueba, que el texto se sale,
  no cambió; la expectativa se actualizó con su porqué en el script.

- **Estado en `window` tras navegar:** `go` hace una navegación completa y lo
  borra. Lo que se guarda en la página se lee después del último `go` (4.4,
  trazado de `caret-up`). Además, `?raw` de Vite devuelve un módulo JS, no el
  SVG.
- **Bordes en forced-colors:** en un enlace, un borde se fuerza a `LinkText`,
  no a `CanvasText` (4.4).
- **`hyphens: auto` no hace nada en Edge sobre Windows**, ni con `lang`: todo
  corte sale de `overflow-wrap: anywhere` (4.4).
- **Selectores globales:** un elemento nuevo del shell puede capturar un
  `querySelector` de otra sección. El salto al contenido lleva `c-button`, y 4.1
  acota sus botones a `main`. Por lo mismo, 4.5 tiene su propia página
  (`/kit/resultados`): sus botones, etiquetas y avatares cambiarían los
  recuentos de 4.1 y 4.2 en `/kit`.
- **En una container query, `rem` sigue la letra del html.** A diferencia de
  una media query, la inyección en `html` y `Page.setFontSizes` mueven el
  umbral igual (4.5: 447/448 con los dos métodos).
- **El árbol AX no sigue el orden del DOM:** en `getFullAXTree` se filtra por
  nombre, no por posición (4.5).
- **Margen de +0,5 del detector de palabras:** una palabra 0,3 px más ancha
  que su elemento sale como «pudiendo caber» («experiencia», 175,3 en 175). Se
  declara con la cifra; no se relaja la regla (4.5).

## Comprobaciones manuales

No se automatizan; se repiten a mano cuando cambia lo que prueban.

| Qué | Cómo | Sección |
|---|---|---|
| Hash de los iconos contra Figma | `use_figma` de solo lectura sobre `F.7 · Iconos` (frame `127:4003`): `exportAsync({ format: 'SVG_STRING' })` de cada `icon/*` y FNV-1a del `d`. El script compara con los valores de ese día, guardados en `icon-hashes.mjs` | 4.1 |
| Aviso de desarrollo de la región viva | Montar el `Notice` de región viva del kit ya abierto (`useState(true)`), recargar `/kit` y ver en la consola «Notice delivery="live" montado ya abierto…». Revertir | 4.2 |
| Anuncio real con lector de pantalla | NVDA y VoiceOver: región viva de `Notice`, ayuda de `Legend` por `aria-describedby`. Pendiente de la fase 7 | 4.2, 4.3 |
| Zona segura y Safari | iPhone real y Safari de macOS. Pendiente de la fase 7 | 3 |
