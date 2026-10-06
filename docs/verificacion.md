# Verificación de las secciones del kit

Cómo se mide cada sección de la fase 4, con qué herramientas y qué trampas se
encontraron por el camino. Los scripts viven en `scripts/verify/` y comparan
cada medida con las cifras de su informe de sección: un ✗ es una regresión o
un cambio que hay que explicar, nunca un número que se ajusta sin más.

## Cómo se ejecuta

```bash
pnpm dev          # en otra terminal: el servidor tiene que estar en :5173
pnpm verify 4.7   # 4.1 a 4.7
pnpm verify 5.0   # bloques de la fase 5 (5.0, 5.1, 5.2, 5.3, 5.4)
pnpm verify 5.0 --preview   # flujos de foco contra pnpm build && pnpm preview (:4173)
VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.0             # despliegue (fase 7)
VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 5.0 --preview   # flujos de foco en producción
VERIFY_BASE=http://localhost:4173 pnpm verify 7.3                        # auditoría contra la preview
VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.3             # auditoría contra producción
```

7.0 se niega a correr fuera de `*.netlify.app`: `pnpm dev` y `pnpm preview` no
leen `public/_redirects` ni `netlify.toml`. 7.3 audita el build: se niega sin
`VERIFY_BASE` o con :5173 (StrictMode y el cliente de Vite), y no tiene
`--preview`: la base la da `VERIFY_BASE`.

Requisitos: Node ≥ 20 (usa el `WebSocket` y el `fetch` de Node) y Microsoft
Edge. El arnés no tiene dependencias; 7.3 usa `axe-core` (devDependency exacta,
4.13.0), que inyecta en la página por CDP. La ruta de Edge es la de Windows; en
otro sistema, `EDGE_PATH=/ruta/a/edge`. Otro servidor: `VERIFY_BASE=http://…`.

Salida: una línea ✓/✗ por comprobación y el recuento final; código de salida 1
si alguna no coincide. Las capturas van a `scripts/verify/out/<sección>/`, que
no se versiona.

## Estructura

| Archivo | Qué hace |
|---|---|
| `run.mjs` | Lanzador: comprueba el servidor, abre Edge, ejecuta la sección e imprime la comparación. Con `--preview` va contra :4173 y ejecuta solo `previewFlows` de la sección. Si el puerto de Edge ya responde, sale con código 2 sin conectarse (7.3). Si la sección exporta `checkBase` (7.0, 7.3), la llama con `VERIFY_BASE` antes de abrir Edge; con una base que la sección no admite, sale con código 2 (7.3). Todas sus salidas van por `process.exitCode`: 0, 1 (alguna medida no coincide) o 2 (no se pudo medir) |
| `5.0-transversal.mjs` | Rutas de D1 (h1, título, chrome), foco de ruta, página genérica y 404 (T1); guardas, 404 lanzado, Atrás tras redirección, `/kit/estados`, fotos y `check-data --contrapruebas` (T2); scroll en cargas completas (`fullLoadScroll`, cierre de la fase 5, también en `--preview`). Exporta `ROUTES`, que usa 7.0. Desde 7.1, un único `<title>` por ruta en D1 y en `/kit/*` (también tras navegar en cliente, en `--preview`), con contraprueba |
| `7.0-despliegue.mjs` | Despliegue en Netlify (D12), solo con `VERIFY_BASE` en `*.netlify.app`. Estado HTTP con `fetch` de Node: rutas de D1 y `/kit/*` → 200; fuera de ellas → 404, con `/especialistas` y `/citas` con y sin barra; precisión de los comodines (`/kit-x`, `/mis-citasx`) y su coste declarado (rutas inventadas bajo ellos → 200). Caché: directivas de `/assets/*` e `index.html` sin `immutable`. Carga completa de 16 rutas (h1 y título de D15) sin peticiones a otro origen (D11); nada fuera de `#root` y del `<head>` con caja ni con `tabIndex ≥ 0`; el centro de «Continuar» de la Booking Bar a 375 es el botón. Datos sin criterio: el script `/.netlify/scripts/hud` y el comentario del `<head>`. Desde 7.1: `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` y `og-image.png` con 200, su tipo y los mismos bytes que `public/` (contraprueba: un icono que no existe da 404 y `text/html`); los tres `<link>` de `index.html`; `og:url` y `og:image` absolutas y `og:image` resoluble (200, `image/png`, 1200 × 630); el tipo con que se sirve el `.ico`, como dato. **Alcance de «nada fuera de #root»:** vale en cargas completas sin interacción; al interactuar, lo que React Aria monta en `body` queda fuera de `#root`. Medido en 7.3 sobre el inventario de estados: nada fuera de `#root` salvo el anunciador de región viva de React Aria (1 × 1, recortado, sin foco), que aparece al navegar de mes en el calendario; expuesto a 1440 e ignorado (`activeModalDialog`) dentro de la hoja modal (✗ declarado, 7.6). Los popovers del proyecto viven dentro de `#root` |
| `7.3-auditoria.mjs` | Auditoría automática (7.3), contra la preview o producción. Bloque A: axe-core sobre `document` con `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` y `wcag22aa`, en el inventario de estados (las 16 cargas de 7.0 y los estados con interacción: hojas, diálogo, menú, errores, reserva fallida, avisos, Missing, `lenta`, los tres vacíos, «Avisarme» y el ListBox) a 375 (barra superpuesta) y 1440 (clásica); con barra fija, arriba y con el scroll al final; con un `<dialog>` modal, solo arriba. Hijos de `body` fuera de `#root` con su caja, su foco y su nodo en el árbol de accesibilidad (ignorado o no). Contrapruebas: una imagen sin alt da `image-alt`; un div enfocable en `body` sale en «fuera de #root»; en `/` a 375 (arriba), target-size con la barra fija y nada sin ella. El falso positivo de posición (target-size en `/` y `/kit/navegacion` a 375 arriba, con su nodo y los Nav Item como relacionados) va declarado exacto en la expectativa; best-practice, aparte y como dato. Bloque B, en cada estado salvo `lenta` (cambia a los 1,5 s), sin transiciones y con el puntero aparcado: contraste renderizado (texto, valor o placeholder de los campos, límite de control con su relleno, e iconos como dato) con el fondo efectivo de los antepasados y lo tapado por otro elemento fuera de la cuenta; cada par con sus roles y su fila de F.3 (`scripts/contrast-pairs.mjs`, la misma lista que `pnpm contrast`) o «no documentado» (dato); los incomplete de color-contrast de axe, resueltos con su par calculado; el anillo de cada parada de Tab contra dos bandas de píxeles de la captura (un píxel por fuera y uno por dentro, en el tramo recto de cada lado), y la hora seleccionada contra la superficie. Contrapruebas: un h1 en `color-border` da 2,27; el anillo en `surface-muted` falla en todas las paradas; con desfase −2, la banda interior de la hora seleccionada es el ámbar a 2,09. Detalle en `out/7.3/auditoria.json`, una captura por pasada y una por parada con anillo ✗ o sobre la hora seleccionada. Al final llama a los bloques C y D (`7.3-cd.mjs`) |
| `7.3-comun.mjs` | Lo que comparten los bloques de 7.3: el inventario de estados, las acciones en la página (`find`, `waitFor`, `press`), los ayudantes que corren en ella (`window.__c`: pares de contraste, anillo y sus bandas de píxeles, y desde C, `obscured`, `targets` y `spacingLoss`) y el recorrido de las paradas de Tab |
| `7.3-cd.mjs` | Bloques C y D de 7.3, sobre el inventario sin `lenta`. C: 2.4.11 en cada parada de Tab a 375 y 1440 con la letra del navegador a 16 y a 32 (cinco puntos de la caja; dato: puntos parciales y píxeles del anillo bajo la barra fija o sticky), el anillo de lo que queda encima de la barra en el flujo (letra a 32 a 375), 2.5.8 a 320, 375 y 1440 y a 320 con la letra a 32 (exenciones «en línea» y «espaciado»), 1.4.12 con los cuatro valores inyectados a 320 y 1440 (recortes por un antepasado hidden o clip; solapes dentro de la misma capa fija) y 3.2.6 en las 16 cargas. D: el ListBox de horas a 320 con el texto al 200 % (inyección y letra, dos barras; flechas, anillo de cada opción, Inicio y Fin), el resto de pintado desde `/?q=Cardiología&pagina=9` desplazada a 375 y `/kit` con la receta de 4.6 a 375 y 1350, y la receta del hallazgo de 7.1 (inyección, 375 × 812 y 900), como dato. Contrapruebas: un h1 con alto fijo recortado con el espaciado, Inicio y Fin con la acción por defecto evitada, y un resto inyectado. Desde 7.6 (F1), las ocho combinaciones de Inicio y Fin que atiende RAC (sola, Mayús, Ctrl, Mayús+Ctrl) con `defaultPrevented` leído por un escuchador en burbuja en `window`, y Alt+Inicio como contraprueba (no se intercepta; el escuchador la evita después de leerla para no navegar). 320 × 812 con barra superpuesta. Detalle en `out/7.3/auditoria-cd.json` y capturas de lo parcial, de Inicio en el ListBox, de la receta de 7.1 y de los restos |
| `cdp.mjs` | Arnés: Edge headless por CDP; teclado y ratón reales, capturas (`shot`, y `saveBase64` para guardar una ya tomada), `forced-colors`, barras de scroll, estilos de contraprueba, `tabTo`. `open` falla si el puerto ya responde; `close` cierra con `Browser.close` y espera a que el puerto quede libre (7.3) |
| `5.1-busqueda.mjs` | Vista 1 (V1a): pares de Figma 01.1, 01.3–01.7, cabecera (línea base y alto frente al control), anchos intermedios, texto ampliado, forced-colors, orden de Tab, encabezados, lista en carga, fotos, «Ver horarios», sujeción de `pagina`, historial, scroll y foco de cada acción (también con `lenta`; en la paginación, el foco se lee en el MutationObserver al desmontarse el enlace pulsado, tras V1b). V1b: fila del disparador, hoja «Filtrar y ordenar» (01.2: pares, anchos, texto grande, forced-colors, teclado, borrador, página bloqueada y cruce de `lg`), acción del vacío con texto ampliado y conmutador «Avisarme» (01.8, 01.9) con su persistencia (D16) |
| `5.2-perfil.mjs` | Vista 2 (V2a): pares de Figma 02.1, 02.3 (375), 02.2 (la hoja, 375 × 812), 02.5 y 02.6 (1440); la fila de «Elige fecha» (367/382), el umbral `slot-picker` (713 de celda) con su contraprueba a 44rem y los botones de semana en columnas fijas; 200 % a 320 y letra del navegador; forced-colors; estructura; teclado (tira, ListBox, Tab, Intro y el botón por defecto); URL (push, parámetros y `escenario`, guardas con la hora codificada y sin codificar); Missing y su regla de salida; foco («Ver horarios del …» con y sin el observador, semana, hoja, cruce de `lg`); conmutador «Avisarme» (D16). V2b: 02.4 a ±1 px (375), anchos intermedios y escritorio (C1-A, con la contraprueba de los 38rem), 200 % a 320 con el umbral `appointment-summary-compact` y su contraprueba, padding al 100 %, letra del navegador, forced-colors, estructura, teclado, enlaces y escenario (con contraprueba), guardas, foco (llegada y cruce de lg, con contraprueba) y la regresión exacta de 02.5 y 02.6 frente a la línea base anterior al refactor; navegación en cliente 02.1 → 02.4. `previewFlows`: foco, Missing y el foco de 02.4 |
| `5.3-datos.mjs` | Vista 3 (V3): pares de Figma 03.1, 03.2, 03.5 (375) y 03.3, 03.4, 03.6 (1440); padding de `--aside` (16 en «Tu cita», 24 en 02.4); resumen de errores (foco en el h2 con clic e Intro, enlaces → control con la etiqueta a la vista y sobre la barra, historial +0, contraprueba del ancla nativa); reserva fallida (foco en el título en el mismo commit, pie, valores, Intro sin envío) y la posición del título; envío válido (replace) y la sonda del form reiniciado (MutationObserver y un muestreo por frame); borrador (D17) al ir al aviso de privacidad y tras «Elegir otra hora»; anchos y paso de la rejilla a dos columnas; 200 % a 320; letra del navegador; forced-colors; estructura y el h2 en el árbol AX; `noValidate` y botón por defecto con sus contrapruebas; volver a enviar; cruce de lg; orden de Tab; navegación en cliente 02.4 → 03.1. `previewFlows`: resumen, reserva fallida, sonda del envío válido y cruce de lg |
| `5.4-citas.mjs` | Vista 4 (V4a). Confirmación: pares 04.1 (375) y 04.4 (1440), la foto de Ruiz, el umbral `appointment-summary-wide` (689) con su contraprueba (a 688 parte el nombre de la clínica), la regresión exacta de 02.4 y 03.3 frente a la línea base de c5a813a, anchos y el tramo 1024–1104, 200 % a 320, letra del navegador, forced-colors, estructura, Tab, la descarga real del `.ics`, reservas reales (correo, recordatorio y plazo), cruce de lg y navegación 03.1 → 04.1. Mis citas: pares 04.2, 04.5, 04.8 y 04.9 con la foto de Ruiz, 04.7, el diálogo en la vista (04.3, 04.6), la sonda de cancelar, las tres próximas canceladas y el tramo de Appointment Card (1024/1039/1040 y 1054/1055). V4b: pares 02.7 (375) y 02.8 (1440), estructura y el envío en el árbol AX (las dos fechas), la sonda de «Confirmar hora» (MutationObserver y `requestAnimationFrame`, desde el `submit`), el POP entre las dos entradas de Mis citas con su contraprueba, la recarga y Atrás desde otra página, reprogramar y cancelar la misma cita, el contador de `takeNotice` (dev), Missing en escritorio con clic e Intro, C6 con c1 y c3, el barrido de la barra (C7: 368 / 383), la guarda en cliente, el cruce de lg con el mismo h1, la navegación en cliente Mis citas → «Reprogramar», anchos, 200 %, letra del navegador, forced-colors y Tab. `previewFlows`: cruces de lg, diálogo, sonda y cancelaciones; y en V4b, la sonda, el POP, la recarga y Atrás, reprogramar y cancelar, Missing y el cruce de lg |
| `cruce-lg.mjs` | Foco en el h1 al cruzar lg (`h1AcrossLg`, V4a): llegada en cliente por `useRouteFocus`, cruce en los dos sentidos por CDP y un MutationObserver que apunta el foco al final de cada lote de mutaciones (ninguno en body). Desde el cierre de la fase 5, el h1 es el mismo nodo (`nodoNuevo: false`). Lo usan 5.3 y 5.4, también en `--preview` |
| `navegacion.mjs` | Navegación en cliente con clic real (`clientNavigation`): baja al final con la rueda y compara el viewport, píxel a píxel, con la página recargada, justo al llegar y 4 s después. El destino puede llevar `search`. Con `park`, el puntero va a la esquina antes de cada captura (5.0 y 5.1; 4.6 no). Con `selector`, el elemento pulsado puede ser un botón que navega (V2b: «Continuar» de la Booking Bar). La usan 4.6 y las vistas. Cierre de la fase 5: `prepare` actúa sobre el origen antes del clic (4.6 baja `/kit` con la rueda); `pixelDelta` y `REST_DELTA` (64) separan el resto (delta > 64 en cualquier punto) del remuestreo de una foto; `viewRest` es lo que comparan las vistas |
| `checks.mjs` | Funciones que se ejecutan dentro de la página: palabras partidas, desborde horizontal, texto al 200 %, tamaños, foco |
| `static.mjs` | Contrapruebas de ESLint y TypeScript sobre un archivo temporal (`src/views/VerifyTemp.tsx`), que se borra siempre |
| `icon-hashes.mjs` | Formato y hash FNV-1a del `d` de cada icono, frente a los que dio Figma |
| `4.1-acciones.mjs` · `4.2-identidad.mjs` · `4.3-formulario.mjs` · `4.4-navegacion.mjs` · `4.5-busqueda.mjs` · `4.6-fecha-hora.mjs` · `4.7-citas.mjs` | Una sección cada uno. 4.7 mide desde V1b la página bloqueada bajo el velo (`html:has(dialog:modal)`, barra clásica) |

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
  ella apareció un resto de pintado de `/kit` (DESIGN.md, Pendientes, fase 7),
  sin nodo en el DOM y reproducido también en Chrome real, sin CDP. **Medido en
  el cierre de la fase 5 (corrige a T0):** origen arriba → 0; origen desplazado
  (rueda o `scrollTo`) → resto al llegar; que persista depende de la sesión
  (0 a los 4 s en pasadas aisladas, 12632 en la sesión de 4.6). Lo que T0 llamó
  «la sesión larga» y el «teclado previo» solo bajaban `/kit/fecha-hora`, y la
  carga completa de `/kit` heredaba ese scroll por la clave «default» de
  `<ScrollRestoration>` (siguiente trampa). «Con `scrollTo` o un clic por
  script no sale» era cierto con el origen arriba: con `/kit` en 1782 por
  `scrollTo`, sale (2 de 2). En las vistas, lo que se medía era otra cosa: el
  remuestreo de una foto ya decodificada en la página de origen (delta ≤ 39),
  probado en V2b con la foto bloqueada en el origen (0 de 5). Criterio desde el
  cierre: un píxel es resto si su delta pasa de 64 (`REST_DELTA`). El ruido de
  recarga contra recarga es 0 px (medido en 4.6, 01.1 y 02.4).
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
  falló así en 4.6). Las secciones se ejecutan una detrás de otra. Desde 7.3,
  el segundo sale con código 2 al arrancar.
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
  fase 5 llegaba al 404 de React Router, que escribe 2 errores. `4.7-citas.mjs` los retiraba solo
  en ese paso (4.7); el filtro se quitó en T1, al existir la ruta provisional, y desde V4b la ruta
  es la vista real (DESIGN.md, Pendientes).
- **Codificación al editar desde PowerShell 5.1.** `Get-Content` lee un UTF-8 sin BOM como
  ANSI (tildes dobles, «Ã¡»); `Set-Content` escribe por defecto en la codificación ANSI del
  sistema, y con `-Encoding UTF8` añade BOM. Los scripts se editan con un editor, con Node o
  con la herramienta Edit, nunca con esos cmdlets (4.7).

- **`<title>` de React 19 y el de `index.html`.** React inserta el suyo antes
  del estático, sin sustituirlo, y `document.title` devuelve el primero: gana
  el de la vista, pero quedan dos en el head (T1; en la línea base de 7.1, las
  16 rutas). Desde 7.1 no hay `<title>` de React: `useDocumentTitle` escribe
  `document.title` en el estático, y 5.0 cuenta uno por ruta. Su contraprueba
  antepone un `<title>` al del head: da 2 y `document.title` pasa a ser el
  suyo (7.1).
- **Recargar no es navegar.** Una recarga con `location.state.focus` es una
  carga inicial: el hook de foco no actúa y el foco queda en `body`. El
  respaldo al `h1` se prueba con Atrás hacia esa entrada (T1).
- **`pnpm verify --preview` mide el build.** Tras cambiar código hay que
  `pnpm build` y reiniciar la preview; si no, mide el build anterior (T1).
  Para saber qué build midió una pasada, se comprueba el cambio en el CSS o el
  JS compilado, no la fecha de dist (V4a).
- **`redirect` añade una entrada; `replace`, no.** En un loader, `redirect`
  empuja una entrada nueva también en carga completa, y Atrás cae en la URL
  que redirige (T2).
- **El WebP del canvas de Chromium lleva perfil ICC.** `toDataURL('image/webp')`
  escribe VP8X + ICCP + VP8. Para un WebP sin metadatos, se conserva solo el
  trozo VP8 en el formato simple (T2).
- **Navegar en cliente sin enlace:** `pushState` y un `popstate` hacen que
  React Router pase por las guardas como en un POP (`clientGo` en 5.0) (T2).
- **Hover residual tras la rueda.** Tras el clic, el puntero se queda donde se
  pulsó; al bajar con la rueda, Chromium deja `:hover` en lo que pasó bajo él.
  En `/kit` → `/` salían 188 px distintos de la recarga, exactamente en la caja
  de «Videoconsulta» (68,259 → 91,282, en `:hover`, borde `color-action`); con un
  `mouseMoved` al mismo punto, el hover pasa al radio que queda debajo y el
  diff se mueve con él (68,415 → 91,438). `clientNavigation({ park: true })`
  aparca el puntero en la esquina antes de cada captura (V1a).
- **Línea base con una sonda.** La sonda de alto 0 en una fila `baseline` mide
  mal un clon con `align-self: last baseline` (el control de `c-field`): va a
  otro grupo de alineación. El clon lleva `align-self: baseline` (V1a).
- **`sizes` y la caché de imágenes.** Cambiar `sizes` después de la carga no
  baja de resolución, y una imagen nueva con el mismo `srcset` reutiliza la de
  192 de la caché. La contraprueba usa una sonda con URL sin caché (y sin
  archivo): `currentSrc` dice qué candidata eligió el navegador (V1a).
- **`scrollTo` se limita al máximo de la página.** Una prueba de «el scroll no
  cambia» compara con el `scrollY` real antes de actuar, no con el pedido (V1a).
- **Tab en un `<dialog>` modal cambia con el navegador y el modo.** En
  headless cambió entre versiones de Edge: al cerrar 4.7 (versión no
  anotada), el foco salía a `body` («el marco del navegador, que en headless
  es body») y la línea pasaba; con Edge 153.0.4234.48 da la vuelta entre los
  dos botones del diálogo (37/38 con la secuencia fija, igual en el commit
  anterior a V1a). Con ventana, la 153 sale a la interfaz del navegador
  (pestañas, barra de direcciones, botones de la barra) y vuelve al diálogo.
  En todos los casos, nunca cae en la página. 4.7 mide la regla (ningún
  elemento de la página fuera del diálogo) y acepta las dos secuencias.
- **El ancho de un texto no es construcción.** «Buscando…» mide 81 en el
  navegador y 79 en Figma (métrica de Inter Variable): en los pares se compara
  la posición y el alto del recuento, no su ancho (V1a).
- **El navegador integrado no emite `change` de `matchMedia` al redimensionar.** Con
  `resize_window`, `matchMedia('(min-width: 64rem)').matches` cambia pero la vista no
  vuelve a pintarse (también sin la hoja abierta). El cruce de `lg` se mide por CDP
  (`setDeviceMetricsOverride` sí lo emite) (V1b).
- **Capturas con la letra del navegador ampliada.** Una captura de la hoja con la letra a
  32 salió con la letra a 16, aunque las medidas de esa pasada daban `html` 32px; no se
  sabe si es `captureBeyondViewport` o `Page.setFontSizes`. Esas capturas no son prueba;
  cuentan las medidas. Además, el recorte de una hoja va en coordenadas del documento:
  `b.rect(SHEET)` suma el scroll (V1b).
- **Un `<dialog>` modal devuelve el foco solo al cerrar** (Chromium: al elemento que lo
  tenía antes de `showModal()`). Una contraprueba que devuelve el foco antes de `close()`
  sigue pasando: no discrimina el orden (V1b).
- **`Range` sobre un botón con `c-button__label`.** La etiqueta crece hasta llenar el
  interior, así que `selectNodeContents(boton)` mide su caja, no lo pintado. 4.5 suma
  icono + hueco + texto (V1b).
- **La clave «default» de `<ScrollRestoration>`.** React Router guarda la posición por
  `location.key`, y toda carga completa lleva «default»: una carga completa de otra URL en la
  misma pestaña heredaba el scroll de la anterior. 4.4 cargaba `/kit/navegacion` en 766 (el
  máximo) con el foco en body y daba 61/62. Corregido con `getKey` en `RootLayout` (DESIGN.md,
  D12). Qué producía esa carga previa con un `pnpm dev` de días quedó sin medir; el perfil
  persistente no transmite `sessionStorage` al reabrir (cierre de la fase 5).
- **La página bloqueada cambia medidas con barra clásica.** Con un diálogo abierto, `html`
  no tiene barra: el velo gana 15 px. En 4.7, la contraprueba de la rueda retira también el
  bloqueo, y el texto grande a 320 y 375 con barra clásica mide como con la superpuesta
  (salvo cuando el velo se desplaza y pinta su propia barra) (V1b).
- **El muestreo cada 100 ms no ve un hueco de ~1 ms.** Con un `useEffect`, el foco quedaba en
  `body` entre el commit que desmonta el enlace y el efecto, que corre en otra tarea
  0,4–1,7 ms después. Un `Runtime.evaluate` cada 100 ms lo pillaba en 3 de 10 pasadas. Un
  MutationObserver sí lo ve siempre: su callback corre al vaciarse la pila del commit, después
  de los efectos de layout y antes de cualquier otra tarea, así que lee el foco en ese hueco
  de forma determinista (tras V1b).

- **El ListBox de RAC recién montado pinta sus opciones en un segundo commit.** Tras «Ver
  horarios del martes 24», el efecto de layout que enfoca la primera hora libre corre antes de
  que existan las opciones y el foco cae en `body` (medido). `SlotList` espera con un
  MutationObserver, que corre antes de pintar. Con StrictMode, la lista nueva desmonta y vuelve a
  montar sus efectos después del efecto de quien pidió el foco: la limpieza cortaba la espera en
  desarrollo, así que el efecto de montaje la rearma. Contraprueba en `pnpm verify 5.2` y
  `--preview`: sin el observador, `body` (V2a).
- **`splitWords` con ancestros en el selector.** Cada elemento que casa mide las palabras de sus
  descendientes contra su propio interior: con `.c-booking-bar *`, «Continuar» (152,6, más ancha
  que los 143 del botón) salía «pudiendo caber» en la fila de 241. El selector lleva las hojas
  del árbol (título, texto de la meta, botón) (V2a).
- **Efectos pasivos tras un evento discreto.** Es comportamiento documentado de React 18 y
  posteriores: tras una entrada discreta (clic, tecla), los `useEffect` del commit que provoca se
  vacían en síncrono al terminar el commit, antes de cualquier otra tarea. En V3 se observó en dev y
  en la preview: con el foco de `Notice` en `useEffect`, la sonda (MutationObserver) sigue viendo
  el título enfocado en el mismo commit tras «Confirmar cita», así que esa contraprueba no
  discrimina `useEffect` de `useLayoutEffect`. No está verificado que sea lo que separa este caso
  del de V1b (allí el disparador era la llegada de datos y la sonda sí veía `body`) (V3).
- **`value` y `checked` no mutan el DOM.** React los cambia como propiedades, no como atributos: un
  MutationObserver no ve un commit que solo reinicia valores. Para saber si un estado llega a
  pintarse, una muestra por frame con `requestAnimationFrame` (corre antes de cada pintado) (V3).
- **Borde transparente en forced-colors.** Un borde `transparent` se fuerza a un color de
  sistema y se ve (§3.2: conserva el contorno). El chip fuera de rango de V2a, como el día pasado
  del calendario, se distingue por el peso, no por la ausencia de borde (V2a).

- **La mezcla pierde frente al parcial del hijo.** `.c-appointment-summary__details` con
  `flex-direction: row` no ganaba a `.c-booking-details { flex-direction: column }`: misma
  especificidad y el parcial del hijo va después (orden alfabético). Se resuelve con propiedades
  públicas del hijo (DESIGN.md § Custom properties públicas) (V4a).
- **Sin scroll no hay barra clásica.** Una página que cabe en el viewport (04.4 a 900)
  no pinta barra aunque sea clásica: el caso de 1103/1104 se mide con 600 de alto (V4a).
- **`captureBeyondViewport` saca el foco.** Una captura con el menú de cuenta abierto lo
  cierra (salir del grupo cierra el disclosure): se lee el estado antes de capturar (V4a).
- **Importar un módulo de la app en dev.** `import('/src/data/appointments.ts')` puede dar
  otra instancia que la que usa la app si Vite le añadió `?t=`: se importa la URL exacta
  de `performance.getEntriesByType('resource')` (V4a).
- **Un nodo que se vuelve a montar no conserva un parche.** Anular `focus` en el `h1` no
  sirve si el `h1` se vuelve a montar al cruzar lg: la contraprueba lo anula en el prototipo
  para `#contenido` (V4a).
- **El último lote de mutaciones no es el foco final.** Tras cancelar sin `close()` en el
  manejador, el último lote lo dejaba en el botón del diálogo aún abierto; el foco final, leído
  después, era `body`. La sonda de cancelar lee los dos (V4a).

- **Un clic que mueve el foco deja un lote con `body`.** Al pulsar «Confirmar hora» con el foco en
  una hora, el navegador saca el foco de la hora (`focusout` hacia el botón) y el MutationObserver
  corre entre el blur y el focus, con `activeElement` en `body`: un lote, antes del envío y ajeno a
  él. La sonda de «Confirmar hora» cuenta el foco en `body` desde el evento `submit` (V4b).
- **React Router cambia la URL antes del commit.** En una navegación con loader, `location` ya es el
  destino mientras el DOM sigue siendo la página de origen. Una sonda identifica la página por su
  `h1`, no por `location.pathname` (V4b).
- **Coordenadas de Figma relativas al padre.** `get_metadata` da x e y respecto al padre, no al
  frame: en 02.8, «Nueva cita» está en y 61 dentro de la tarjeta (y 304), así que su y absoluta es
  365, no 382 (y «Antes:», 409, no 426). Se corrigió la expectativa del script, no el código (V4b).
- **El ancho de un texto no es construcción (otra vez).** La ubicación de 02.8 mide 261,1 en el
  navegador y 260 en Figma; con ±1 px fallaba su ancho y la x de la modalidad que la sigue. Se
  comparan su y y su alto (V4b), como «Buscando…» en V1a.
- **El título de un `Notice` sin encabezado es un `<p>`.** Con `headingLevel={null}`,
  `.c-notice__text p` devuelve el título; el cuerpo se lee con `p:not(.c-notice__title)` (cierre
  de la fase 5).
- **Bloquear fotos con `setBlockedURLs('*.webp')` dejó el origen sin montar.** En 6 pasadas la
  página de origen no tenía el enlace; causa probable, sin verificar: en dev la foto se importa como
  módulo (`…webp?import`) y el patrón lo bloquea también. Con `Fetch.enable` limitado a
  `resourceType: 'Image'` y `Fetch.failRequest`, la vista monta y la foto falla (cierre de la fase 5).

- **Badge «Powered by Netlify».** Activado por defecto en los proyectos Free creados desde el 19 de
  agosto de 2026; se desactiva en *Project configuration → General → Powered by Netlify badge*, sin
  volver a desplegar ([documentación](https://docs.netlify.com/manage/projects/powered-by-netlify-badge/)).
  Activo, el script `/.netlify/scripts/hud` estaba en la página y pintaba un iframe «Powered by
  Netlify» `position: fixed`, `z-index` 2147483645 y `tabIndex` 0, de 197 × 64 en 178,748 a 375,
  encima de «Continuar» de la Booking Bar: `elementFromPoint` daba `IFRAME` y `pnpm verify 5.2
  --preview` daba 4/6 (foco en `IFRAME` en Missing y en la llegada a 02.4). Desactivado, el script
  no aparece en ninguna de las 16 cargas de 7.0; el comentario «hosted on Netlify» del `<head>` sigue
  (7.0).
- **Netlify normaliza `Cache-Control` sin espacios** (`public,max-age=31536000,immutable`): se comparan
  las directivas, no el texto (7.0).
- **En `_redirects`, `/x/*` casa también con `/x` y con `/x/`.** Medido: `/especialistas`,
  `/especialistas/`, `/citas` y `/citas/` daban 200; con sus reglas 404 antes de los comodines, 404
  (7.0).
- **Un Edge de una pasada anterior, vivo en el 9400.** En la línea base de 7.2,
  `edge.kill()` no cerró el Edge headless que escucha en el 9400: al terminar la
  serie quedaba uno vivo por pasada, y desde la segunda cada pasada se conectó al
  navegador de la primera (misma sesión y `sessionStorage`). Síntomas: 5.0 cargaba
  otra URL en 766 con el foco en body (el caso que corrigió `getKey`), el resto de
  pintado de 4.6 no salía, había ✗ de Tab en 5.2–5.4 y los `--preview` no medían
  (`Target does not support metrics override`). Entre 7.1 y 7.2 cambiaron Edge
  (153 → 154.0.4258.37) y Node (26.3.0): sin aislar. Las series de 7.2 corrieron
  con un lanzador fuera del repo que, tras cada pasada, cierra los Edge de su
  carpeta temporal y comprueba que el 9400 queda libre (7.2).
  **7.3:** `open` falla si el puerto ya responde y `run.mjs` sale con
  código 2 (contraprueba con un Edge a mano en el 9400: código 2 y ese Edge sigue
  en `about:blank`); `close` cierra con `Browser.close` y espera al puerto. El
  defecto de `kill()` **no se reprodujo** con Edge 154.0.4258.37 y Node 26.3.0:
  0 Edge vivos en las 18 pasadas de la línea base (arnés de fdc8337, TEMP y TMP
  propios por pasada) y en 2 de 4.2 con el TEMP del sistema; la causa de 7.2
  sigue sin aislar. `Browser.close` queda como defensa; su contraprueba no
  discrimina con Edge 154.0.4258.37. Serie con el arnés nuevo (4.1–4.7 y 5.0–5.4
  en dev, 5.0–5.4 con `--preview` y 7.0 contra producción), idéntica byte a byte
  a la de fdc8337.
- **`process.exit` justo después de un `fetch` con respuesta, en Windows.** Con
  Node 26.3.0, tras el `fetch` a `/json/version` de un puerto ocupado,
  `process.exit(2)` tumbó el proceso con un assert de libuv (`src\win\async.c`,
  línea 94) y salió con 127. `run.mjs` devuelve el código desde `main` y lo
  asigna a `process.exitCode`, en todas sus salidas. Medido: sin argumentos, 2;
  `4.1 --preview` (sin `previewFlows`), 2; sin servidor, 2; puerto ocupado, 2;
  4.6 con su ✗ declarado, 1; el resto de la serie, 0; ninguna pasada colgada al
  terminar. El `process.exit` de «sin `previewFlows`» daba 2 en 3 de 3: ahí el
  assert no se reprodujo (7.3).
- **Un Edge lanzado a mano sin `--disable-extensions`** inicia sesión con la
  cuenta de Windows y sincroniza sus extensiones en el perfil temporal. Para una
  contraprueba se lanza con los mismos flags que `cdp.mjs` (7.3).
- **`pnpm lint` en paralelo con una pasada que usa `static.mjs`.** El hook de
  Stop ejecutó `pnpm lint` mientras corría `pnpm verify 4.1` y encontró
  `src/views/VerifyTemp.tsx`, el temporal de las contrapruebas de ESLint: el
  lint falló con los errores que la contraprueba provoca a propósito. No se
  lanza lint mientras corre una pasada que usa `static.mjs`; al terminar, el
  archivo no existe (`git status`) (7.3).
- **Un borde de 1,45 que no se reprodujo.** En una pasada del bloque B de 7.3, un botón
  «Siguiente» de las muestras de `/kit` dio un límite `#d6d6d6` de 1,45 sobre la superficie;
  en las tres pasadas siguientes no salió, y en reposo ningún control de 12 rutas tiene ese
  borde. Hipótesis sin verificar: un hover a medias (transición) al desplazar la página bajo
  el puntero. Por eso el bloque B mide sin transiciones ni animaciones y con el puntero
  aparcado (7.3).
- **`clientNavigation` centra el enlace antes del clic.** El origen que deja `prepare` no es el
  scroll del clic: con `/kit` fijado en 1600, «Ver fecha y hora» se pulsa con el scroll en 5751
  (1350) y 7085 (375). El de 4.6 es el mismo. 7.3 lee el del clic con un escuchador en captura
  (7.3).
- **Una carga completa de una URL ya visitada restaura su scroll** (D12, «Matiz»), también
  dentro de una pasada: las pasadas 2 y 3 de `/kit` salían desde 7367 y no desde 1600 hasta
  fijarlo con `scrollTo` y comprobarlo; la receta de 7.1 da el mismo solape con coordenadas
  distintas (7.3).
- **`elementsFromPoint` en la última fracción de píxel del viewport** devuelve una lista vacía:
  un punto de la caja en y 899,6 con 900 de alto no «choca» con nada. 7.3 lo cuenta como fuera
  del viewport (7.3).
- **La receta de 7.1 depende del alto del viewport.** Con la inyección en `html` la barra sigue
  sticky (la static es la `c-bottom-nav` de dentro); a 375 × 900 el anillo de «Ir a
  Especialistas» solapa 3,9 px con ella y a 375 × 812 queda 60 px por encima (7.3).
- **Solapes entre capas.** Una barra fija o sticky pasa por encima del contenido también sin
  espaciado: en 1.4.12, comparar las líneas de texto de capas distintas daba 45 «solapes» que no
  lo eran; se comparan solo dentro de la misma capa, y lo que queda fuera de un contenedor con
  scroll no cuenta (7.3).
- **Inicio con `keyDown` y con `rawKeyDown`** da lo mismo en el ListBox de horas: `defaultPrevented`
  falso y la página se desplaza. No es el arnés (hallazgo F1, DESIGN.md Pendientes) (7.3).
  La causa, en RAC 1.21.1: Inicio y Fin son atajos de `useKeyboard` (`withShiftSel`); en
  selección simple sin `selectOnFocus` el manejador devuelve `false` y el atajo no llama a
  `preventDefault`. Corregido en `SlotList` (7.6).
- **`ListBox` de RAC no reenvía `onKeyDownCapture`** (ni lo tipa: `GlobalDOMEvents` y
  `filterDOMProps` no incluyen los de teclado). Para interceptar una tecla antes que RAC sin
  cambiar el DOM, un escuchador nativo en captura sobre la raíz (`listRef`) (7.6).
- **Una tecla con Alt en una contraprueba** (Alt+Inicio) lleva a la página de inicio del
  navegador en Windows: el escuchador de la pasada la evita después de leer `defaultPrevented`
  (7.6).

## Comprobaciones manuales

No se automatizan; se repiten a mano cuando cambia lo que prueban.

| Qué | Cómo | Sección |
|---|---|---|
| Hash de los iconos contra Figma | `use_figma` de solo lectura sobre `F.7 · Iconos` (frame `127:4003`): `exportAsync({ format: 'SVG_STRING' })` de cada `icon/*` y FNV-1a del `d`. El script compara con los valores de ese día, guardados en `icon-hashes.mjs` | 4.1 |
| Aviso de desarrollo de la región viva | Montar el `Notice` de región viva del kit ya abierto (`useState(true)`), recargar `/kit` y ver en la consola «Notice delivery="live" montado ya abierto…». Revertir | 4.2 |
| Anuncio real con lector de pantalla | NVDA 2026.2 con Firefox 157.0 (Windows 11 26H2, 1 oct 2026; docs/auditoria-manual.md, N2.5 y N2.1): la región viva del `Notice` Success de `/kit` se oye con el foco quieto en el disparador («Aviso activado Te avisaremos por correo si se libera un hueco con la Dra. Ruiz. Cerrar aviso»), y la ayuda de `Legend` al entrar en el grupo («Datos del paciente agrupación … Todos los campos son obligatorios salvo los marcados como opcionales»). Con Chrome 154, la ayuda de `Legend` también («Datos del paciente agrupación Todos los campos son obligatorios salvo los marcados como opcionales»); la región viva, sin medir en 7.4. VoiceOver, sin dispositivo (DESIGN.md, Pendientes) | 4.2, 4.3 |
| Zona segura y Safari | Sin dispositivo en 7.4: sin Mac ni iPhone (DESIGN.md, Pendientes, «7 · sin dispositivo») | 3 |
| Inicio/Fin sin la intercepción de `Calendar` | Quitar el `onKeyDownCapture` del envoltorio, Tab al 24 en `/kit/fecha-hora`, ← al 23 y Fin: el foco va al 30 de abril (fin de mes de RAC), no al domingo 29. Medido al construirlo; revertir | 4.6 |
| Cierre del diálogo en un efecto | Quitar `dialog.current?.close()` de `confirm` en `Dialog.tsx`, `pnpm build` y `pnpm preview`: en `/kit/citas`, cancelar la cita de Molina deja el foco en `body` en vez de en «Cita cancelada». En `pnpm dev` no se reproduce (`StrictMode`). Medido al construirlo; revertir | 4.7 |
| Blank sin borrar `children` | Quitar `delete blank.children` en `CalendarDay.tsx`: las celdas de marzo y mayo vuelven a mostrar su número (26–31, 1–6). Medido al construirlo; revertir | 4.6 |
| Foco de ruta sin el hook | Quitar `useRouteFocus()` de `RootLayout` y `pnpm verify 4.7`: la llegada a `/kit/citas` y a la reprogramación dejan el foco en `body` (36/38). Medido al construirlo; revertir | T1 |
| `h1` sin `tabIndex` | Quitar `tabIndex={-1}` del `h1` en `PageHeader.tsx` y `pnpm verify 5.0`: los tres PUSH (clic en el header y en la barra, Intro) dejan el foco en `body`, no en el enlace pulsado: la vista nueva vuelve a montar el chrome y el enlace deja de existir. Medido al construirlo; revertir | T1 |
| Ciclo de Tab del diálogo con ventana | Edge real con ventana (153.0.4234.48, Chromium 153.0.8010.53, Windows 11 25H2): abrir el diálogo de Molina en `/kit/citas` y recorrer con Tab y Mayús+Tab. Resultado de Osvaldo: recorren los dos botones, salen a la interfaz del navegador (pestañas, barra de direcciones, botones de la barra) y vuelven a los botones; nunca caen en la página. Firefox 157.0 (Windows 11 26H2, 1 oct 2026; docs/auditoria-manual.md, K.1), en `/mis-citas` con un registro de `focusin`: «Mantener mi cita» → «Cancelar cita» → «foco sale de la página», ningún elemento de la página recibe el foco (el número de pulsaciones no se reconstruye con el registro: pudo ser un solo Tab antes de Escape); la salida a la interfaz, sin observar en el diálogo (en la hoja del calendario, Tab sale a la interfaz y vuelve, N3.8b). Safari, sin dispositivo | 4.7 |
| Sin `preventScrollReset` | Quitar `preventScrollReset` de los filtros y de «Ver más» en `Search.tsx`: la última casilla del aside (desde `scrollY` 300, 1440) y «Ver más» (desde 1294, 375) dejan `scrollY` en 0. Medido al construirlo; revertir | V1a |
| Sin `state.focus` ni la ref | Quitar `state={{ focus: FIRST_RESULT }}` de los dos enlaces del vacío y `pendingFocus.current = 0` de «Limpiar filtros»: las tres acciones dejan el foco en `body` (1440). Medido al construirlo; revertir | V1a |
| Cruce de `lg` sin el efecto | Quitar el `focus` del efecto de `sheet === 'lost'` en `Search.tsx`, abrir la hoja a 1000 y pasar a 1100 por CDP: el foco cae en `body`; con el efecto, en `H1#contenido`. Medido al construirlo; revertir | V1b |
| Foco devuelto antes de `close()` en la hoja | Mover `returnFocus.current?.focus()` y `onSubmit()` antes de `dialog.current?.close()` en `Sheet.tsx`, `pnpm build` y `pnpm verify 5.1 --preview`: sigue en 14/14, porque Chromium devuelve el foco al cerrar. No discrimina; el orden se conserva por Safari y Firefox (fase 7). Medido; revertir | V1b |
| Foco de la búsqueda en un `useEffect` | Cambiar `useLayoutEffect` por `useEffect` en el efecto de foco de `Search.tsx` y `pnpm verify 5.1`: «Siguiente» 8 → 9 y «Anterior» 2 → 1 con `lenta` dan `focoAlDesmontar` `BODY` en 10 de 10 pasadas, en las dos líneas (49/52). Medido; revertir | tras V1b |
| Envío sin los parámetros de V1 | Cambiar `new URLSearchParams(carried)` por `new URLSearchParams()` en el `submit` de `Specialist.tsx` y, a 1440, «Continuar con tus datos» desde `…?q=Cardiología&escenario=ocupada&fecha=2029-04-24&hora=10:30`: llega a `/datos?fecha=2029-04-24&hora=10%3A30`, sin `q` ni `escenario`, y `?escenario=ocupada` no llega a la vista 3. Medido al construirlo; revertir | V2a |
| Guarda con `redirect` | Cambiar `replace` por `redirect` en `bookingStepLoader` y `pnpm verify 5.0`: `idx` 1 en la redirección y Atrás cae en la reserva, no en `/kit/estados`. Medido al construirlo; revertir | T2 |
| Vista suscrita al borrador | Volver a `useSyncExternalStore` en `PatientData.tsx` (con `subscribe` en el almacén de `src/data/patient.ts`) y `pnpm verify 5.3`: la sonda del envío válido ve `[confirmada, "", false]`, un frame y un commit con el form vacío antes de la confirmación. Medido; revertir | V3 |
| Foco de `Notice` en un `useEffect` | Cambiar `useLayoutEffect` por `useEffect` en `Notice.tsx`, `pnpm build` y `pnpm verify 5.3 --preview`: la sonda de la reserva fallida sigue viendo el título enfocado en el mismo commit (4/4). No discrimina (Trampas, efectos pasivos tras un evento discreto); el efecto de layout se conserva por la regla de V1b. Medido; revertir | V3 |
| Guarda de la confirmación con `redirect` | Cambiar `replace` por `redirect` en `confirmedLoader` y `pnpm verify 5.0`: `/citas/c5`, `c4` y `c2/confirmada` llegan a `/mis-citas` con `idx` 1 en vez de 0, y en cliente, con c1 cancelada, la redirección deja 2 entradas y Atrás cae en la confirmación, que vuelve a redirigir a `/mis-citas` (25/28). Medido; revertir | V4a |
| Cierre del diálogo en un efecto, en Mis citas | Quitar `dialog.current?.close()` de `confirm` en `Dialog.tsx`, `pnpm build` y `pnpm verify 5.4 --preview`: la sonda de cancelar da el foco en el botón del diálogo aún abierto en el commit del aviso y `BODY` al leer (3/6); con `close()`, el título del aviso (6/6). Medido; revertir | V4a |
| Confirmación sin `useFocusFallback` | Quitar `useFocusFallback(isDesktop)` de `BookingConfirmed.tsx` (con ese nombre desde V4b) y cruzar lg (375 → 1100) por CDP. Desde el cierre de la fase 5 (h1 estable): con el foco en el h1, se queda en `H1#contenido` (el mismo nodo); con el foco en «Ver mis citas» de la barra, `BODY`; con el hook, en `H1#contenido`. Hasta entonces el h1 se volvía a montar al cruzar y los dos casos daban `BODY`. La contraprueba de `pnpm verify 5.4` lo emula anulando `focus()` en el prototipo para `#contenido` (en el nodo no sirve: el nodo es nuevo); durante el cruce, la única llamada que bloquea es la del hook. Medido; revertir | V4a |
| Key del aviso igual al id de la cita | Cambiar la key de los dos avisos de Mis citas por el id de la cita (`c3` en los dos) en `MyAppointments.tsx`, reprogramar c3 (clic real, 375) y cancelarla: el foco queda en `BODY` (al aparecer, al final del lote y al leer), porque React reutiliza el `Notice` y ni su efecto de foco ni `useFocusFallback` (su disparador es la key) vuelven a correr; con `${tipo}-${id}`, «H2#aviso Cita cancelada». Medido; revertir | V4b |
| Reprogramación suscrita al almacén | Leer la cita con `useAppointments()` en `Reschedule.tsx` en vez de con el loader y repetir la sonda de «Confirmar hora» (375): 2 muestras de la reprogramación con la placa en la fecha nueva (`conFechaNueva` 2); con el loader, 0. Medido; revertir | V4b |
| Aviso consumido en un `useEffect` | Quitar el loader de `/mis-citas` y consumir `takeNotice` en un `useEffect` de `MyAppointments.tsx`: la sonda sigue viendo el aviso y el foco en su título en el primer lote de Mis citas, en dev y en la preview (build `index-B7nyNHbf.js`). No discrimina: sin loader la navegación termina dentro del clic y React vacía el efecto pasivo en síncrono (Trampas, efectos pasivos tras un evento discreto). El loader se conserva porque saca el efecto del render y corre una vez por navegación. Medido; revertir | V4b |
| Cierre del diálogo en un efecto, con `Notice` en layout | Repetida en V3 contra la preview, con el foco de `Notice` en `useLayoutEffect`: con `close()`, el foco llega a «Cita cancelada» y la sonda lo ve ya en el commit; sin él, `body`. Revertido | V3 |
| Sin el envoltorio `__heading` | Volver a `steps ? <div className="c-page-header__heading">… : headline` en `PageHeader.tsx` y cruzar lg con `h1AcrossLg` en 03.1 y 04.1: `nodoNuevo: true` en los dos sentidos; con el envoltorio, `false`. Medido; revertir | 5 · cierre |
| Sin `getKey` en `ScrollRestoration` | Quitar `getKey` en `RootLayout.tsx`: `/kit` al final y carga completa de `/kit/navegacion…` → `scrollY` 766 y foco en body (con `getKey`, 0); 12 Tab en `/kit/fecha-hora`, `/kit` y «Ver fecha y hora» a 1350 → 18632 px con delta 230, en 3 de 3 (con `getKey`, 0 en 3 de 3). Medido; revertir | 5 · cierre |
| Foto bloqueada en el origen (V2b) | Cargar 02.1 con la petición Image de `elena-ruiz-arellano-96.webp` fallida (`Fetch`, solo el tipo Image), desbloquear y pulsar «Continuar» → 02.4 a 375: 0 píxeles distintos de la recarga en 5 de 5 (sin bloquear, 471 con delta 1 en 3 de 3). El remuestreo viene de la foto ya decodificada en el origen | 5 · cierre |
| Badge de Netlify activo | Activar *Powered by Netlify badge* y cargar 02.1 a 375 en producción: iframe «Powered by Netlify» 197 × 64 en 178,748, `tabIndex` 0, `elementFromPoint` en su centro = `IFRAME` (navegador integrado de Claude, Chromium) y `pnpm verify 5.2 --preview` 4/6 (Edge headless). Es la contraprueba de las dos comprobaciones de lo inyectado de 7.0, que se escribieron después: 7.0 no se ejecutó con el badge activo. Medido en el deploy de c2b1932, con el badge por defecto; desactivar | 7.0 |
