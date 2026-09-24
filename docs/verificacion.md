# Verificación de las secciones del kit

Cómo se mide cada sección de la fase 4, con qué herramientas y qué trampas se
encontraron por el camino. Los scripts viven en `scripts/verify/` y comparan
cada medida con las cifras de su informe de sección: un ✗ es una regresión o
un cambio que hay que explicar, nunca un número que se ajusta sin más.

## Cómo se ejecuta

```bash
pnpm dev          # en otra terminal: el servidor tiene que estar en :5173
pnpm verify 4.7   # 4.1 a 4.7
pnpm verify 5.0   # bloques de la fase 5
pnpm verify 5.0 --preview   # flujos de foco contra pnpm build && pnpm preview (:4173)
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
| `run.mjs` | Lanzador: comprueba el servidor, abre Edge, ejecuta la sección e imprime la comparación. Con `--preview` va contra :4173 y ejecuta solo `previewFlows` de la sección |
| `5.0-transversal.mjs` | Rutas de D1 (h1, título, chrome), foco de ruta, página genérica y 404 (T1) |
| `cdp.mjs` | Arnés: Edge headless por CDP; teclado y ratón reales, capturas (`shot`, y `saveBase64` para guardar una ya tomada), `forced-colors`, barras de scroll, estilos de contraprueba, `tabTo` |
| `navegacion.mjs` | Navegación en cliente con clic real (`clientNavigation`): baja al final con la rueda y compara el viewport, píxel a píxel, con la página recargada, justo al llegar y 4 s después. La usan 4.6 y las vistas |
| `checks.mjs` | Funciones que se ejecutan dentro de la página: palabras partidas, desborde horizontal, texto al 200 %, tamaños, foco |
| `static.mjs` | Contrapruebas de ESLint y TypeScript sobre un archivo temporal (`src/views/VerifyTemp.tsx`), que se borra siempre |
| `icon-hashes.mjs` | Formato y hash FNV-1a del `d` de cada icono, frente a los que dio Figma |
| `4.1-acciones.mjs` · `4.2-identidad.mjs` · `4.3-formulario.mjs` · `4.4-navegacion.mjs` · `4.5-busqueda.mjs` · `4.6-fecha-hora.mjs` · `4.7-citas.mjs` | Una sección cada uno |

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
- **El arnés siempre navega con carga completa** (`Page.navigate`), así que
  nunca prueba la navegación en cliente de React Router. `navegacion.mjs` la
  prueba con un clic real, la rueda y la comparación con la recarga. Con
  ella apareció un resto de pintado de `/kit` (DESIGN.md, Pendientes): sin
  nodo en el DOM y reproducido también en Chrome real, sin CDP. **Ronda T0:**
  estable en `pnpm verify 4.6` (3 de 3, 4932 px a 1350 con barra clásica) y
  0 de 80 en pasadas aisladas, con Edge y perfil nuevos (anchos, barras,
  ventana visible y cuatro preparaciones previas). La causa es un estado
  que deja la sesión larga de 4.6, sin aislar. Lo que la lectura de 4.6
  dejó escrito como «intermitente» y como «la primera navegación de la
  sesión» era esa dependencia. Anterior a T0 y aún cierto: con `scrollTo` o
  un clic por script no sale; desaparece con el árbol de capas de CDP
  activo; hipótesis sin confirmar, el compositor reutiliza teselas de la
  página anterior; no lo corrigen un fondo en `c-app-layout` ni en `html`,
  ni quitar el desplazador del calendario; la prueba `/kit` →
  `/kit/resultados` de 8087662 no llegó a hacerse. La línea es un ✗ declarado
  (`explicado: false`): un 0 medido no la pasa a ✓ (T0).
- **La rueda con el viewport emulado.** Con `setDeviceMetricsOverride` a
  375 en una ventana de 1280, un `mouseWheel` en x = 600 (fuera del viewport
  emulado) sí desplaza la página: medido, baja al final (2014 de 2014), igual
  que en x = 187. `toBottom` usa el centro (`innerWidth / 2`) por claridad,
  no por un fallo (T0).
- **Capturas: píxeles, no bytes.** Dos PNG del mismo viewport pueden
  codificarse distinto; se comparan píxel a píxel en un canvas de la página
  (4.6).
- **Dos `pnpm verify` a la vez comparten el puerto 9400** de Edge: el segundo
  se conecta al navegador del primero y le navega la página (una pasada de 4.2
  falló así en 4.6). Las secciones se ejecutan una detrás de otra.
- **Git Bash convierte `/kit/…` en una ruta de Windows** cuando va como
  argumento de un script (`Page.navigate: Cannot navigate to invalid URL`).
  Con `MSYS_NO_PATHCONV=1` llega tal cual (4.6).
- **RAC pinta su número si `children` devuelve `null`** en `CalendarCell`
  (vuelve al contenido por defecto). La celda en blanco borra `children` en su
  `render` (4.6).
- **Una tabla con margen negativo dentro de un `overflow-x: auto`** sobresale
  lo que mida el margen y el navegador pinta barra vertical (`overflow-y` pasa
  a `auto`): el envoltorio del calendario reserva el margen con padding (4.6).
- **`pnpm dev` y la preview no ejecutan igual los efectos.** En desarrollo, `StrictMode`
  monta, desmonta y vuelve a montar cada componente nuevo, y repite sus efectos. Un fallo de
  orden puede quedar oculto: con el `close()` del diálogo en un efecto en vez de en el
  manejador, en desarrollo el foco llegaba al título del aviso (el efecto repetido corría con
  el diálogo ya cerrado) y en `pnpm preview` caía en `body`, porque con el diálogo abierto la
  página es `inert`. `pnpm verify` corre contra `pnpm dev`: los flujos de foco que dependen del
  orden de los efectos se miden también contra la preview (DESIGN.md, Pendientes, fase 5) (4.7).
- **Una container query mide la caja de contenido.** Con padding lateral en el velo, el umbral
  de `dialog` (32rem) se evaluaba sobre viewport − 32 y a 512 seguía en Stacked. El velo solo
  lleva padding vertical; el margen lateral lo resta el panel (4.7).
- **Un contenedor con `overflow: auto` pinta su propia barra clásica.** Cuando el velo del
  diálogo se desplaza (texto grande), resta 15 px al panel: el interior del botón a 320 con la
  letra a 32 es 128, no 143 (4.7).
- **Errores de consola de rutas aún inexistentes.** Un clic real en un enlace a una ruta de la
  fase 5 llega al 404 de React Router, que escribe 2 errores. `4.7-citas.mjs` los retira solo
  en ese paso y los comprueba aparte (DESIGN.md, Pendientes, fase 5) (4.7).
- **Codificación al editar desde PowerShell 5.1.** `Get-Content` lee un UTF-8 sin BOM como
  ANSI (tildes dobles, «Ã¡»); `Set-Content` escribe por defecto en la codificación ANSI del
  sistema, y con `-Encoding UTF8` añade BOM. Los scripts se editan con un editor, con Node o
  con la herramienta Edit, nunca con esos cmdlets (4.7).

- **`<title>` de React 19 y el de `index.html`.** React inserta el suyo antes
  del estático y `document.title` devuelve el primero: gana el de la vista.
  Medido en T1; si cambiara el orden, las comprobaciones de títulos de 5.0
  lo detectan (T1).
- **Recargar no es navegar.** Una recarga con `location.state.focus` es una
  carga inicial: el hook de foco no actúa y el foco queda en `body`. El
  respaldo al `h1` se prueba con Atrás hacia esa entrada (T1).
- **`pnpm verify --preview` mide el build.** Tras cambiar código hay que
  `pnpm build` y reiniciar la preview; si no, mide el build anterior (T1).

## Comprobaciones manuales

No se automatizan; se repiten a mano cuando cambia lo que prueban.

| Qué | Cómo | Sección |
|---|---|---|
| Hash de los iconos contra Figma | `use_figma` de solo lectura sobre `F.7 · Iconos` (frame `127:4003`): `exportAsync({ format: 'SVG_STRING' })` de cada `icon/*` y FNV-1a del `d`. El script compara con los valores de ese día, guardados en `icon-hashes.mjs` | 4.1 |
| Aviso de desarrollo de la región viva | Montar el `Notice` de región viva del kit ya abierto (`useState(true)`), recargar `/kit` y ver en la consola «Notice delivery="live" montado ya abierto…». Revertir | 4.2 |
| Anuncio real con lector de pantalla | NVDA y VoiceOver: región viva de `Notice`, ayuda de `Legend` por `aria-describedby`. Pendiente de la fase 7 | 4.2, 4.3 |
| Zona segura y Safari | iPhone real y Safari de macOS. Pendiente de la fase 7 | 3 |
| Inicio/Fin sin la intercepción de `Calendar` | Quitar el `onKeyDownCapture` del envoltorio, Tab al 24 en `/kit/fecha-hora`, ← al 23 y Fin: el foco va al 30 de abril (fin de mes de RAC), no al domingo 29. Medido al construirlo; revertir | 4.6 |
| Cierre del diálogo en un efecto | Quitar `dialog.current?.close()` de `confirm` en `Dialog.tsx`, `pnpm build` y `pnpm preview`: en `/kit/citas`, cancelar la cita de Molina deja el foco en `body` en vez de en «Cita cancelada». En `pnpm dev` no se reproduce (`StrictMode`). Medido al construirlo; revertir | 4.7 |
| Blank sin borrar `children` | Quitar `delete blank.children` en `CalendarDay.tsx`: las celdas de marzo y mayo vuelven a mostrar su número (26–31, 1–6). Medido al construirlo; revertir | 4.6 |
| Foco de ruta sin el hook | Quitar `useRouteFocus()` de `RootLayout` y `pnpm verify 4.7`: la llegada a `/kit/citas` y a la reprogramación dejan el foco en `body` (36/38). Medido al construirlo; revertir | T1 |
| `h1` sin `tabIndex` | Quitar `tabIndex={-1}` del `h1` en `PageHeader.tsx` y `pnpm verify 5.0`: los tres PUSH (clic en el header y en la barra, Intro) dejan el foco en `body`, no en el enlace pulsado: la vista nueva vuelve a montar el chrome y el enlace deja de existir. Medido al construirlo; revertir | T1 |
