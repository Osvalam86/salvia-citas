# Auditoría automática · 7.3

Qué se midió en la fase 7 con herramientas automáticas, cómo, con qué resultado y qué queda
abierto. La prueba manual (teclado con lector de pantalla, Safari, Firefox, móviles reales) es
7.4; lo que depende de ella va marcado como «manual (7.4)», nunca como ✓.

- **Sección:** `pnpm verify 7.3` (`scripts/verify/7.3-auditoria.mjs`, `7.3-cd.mjs` y
  `7.3-comun.mjs`; docs/verificacion.md). Audita el build, nunca `pnpm dev`:
  `VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.3`.
- **Base de las cifras:** producción, 30 de septiembre de 2026 (despliegue de a8f4931; el
  build de la app no cambia desde 3423e78). Edge 154.0.4258.37 headless por CDP, Node 26.3.0,
  axe-core 4.13.0.
- **Resultado de la sección:** 30 expectativas, 25 ✓ y 5 ✗ declarados que cubren 6 defectos
  (§ Hallazgos).

## Método

**Viewports.** 375 × 812 con barra de scroll superpuesta (móvil) y 1440 × 900 con la clásica
de Windows (15 px), los dos de Figma; 320 × 812 con barra superpuesta para 2.5.8, 1.4.12 y el
ListBox (la misma altura que el móvil). La letra del navegador a 32 va por `Page.setFontSizes`
(mueve las media queries: a 375 activa el modo de texto grande y a 1440 saca el chrome móvil);
el texto al 200 % por inyección (`html { font-size: 200% }`), solo donde se pide (ListBox,
receta de 7.1). El resto de pintado de `/kit` repite la receta de 4.6: 375 y 1350 de ancho, 900
de alto, barra clásica.

**Inventario de estados** (`7.3-comun.mjs`). Las 16 cargas completas de 7.0 (las 9 rutas de D1
con el 404 y las 7 de `/kit`) y los estados con interacción: la hora elegida en el ListBox,
Missing (móvil y escritorio), sin horarios (Rodrigo), la hoja del calendario (con y sin «Mes
siguiente»), el calendario en línea con «Mes siguiente», la hoja de filtros, la carga con
`lenta`, los tres vacíos (consulta, colonia y filtros), «Avisarme» activado, el resumen de
errores, la reserva fallida, el diálogo de cancelar, los avisos «Cita cancelada» y «Cita
reprogramada» y el menú de cuenta. `lenta` solo entra en axe: el estado cambia a los 1,5 s.

**Bloques.**

| Bloque | Qué mide | Alcance |
|---|---|---|
| A | axe-core por CDP sobre `document` (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`; best-practice aparte, como dato) y lo que queda fuera de `#root` (caja, foco y nodo en el árbol de accesibilidad) | 85 pasadas: el inventario a 375 y 1440; con barra fija, arriba y con el scroll al final; con un `<dialog>` modal, arriba |
| B | Contraste renderizado (texto, valor o placeholder de los campos, límite de control, iconos como dato) con el fondo efectivo; los incomplete de color-contrast de axe, resueltos con su par; el anillo de cada parada de Tab contra dos bandas de píxeles | 34 pares; 929 paradas en 61 recorridos; sin transiciones y con el puntero aparcado |
| C | 2.4.11 (cinco puntos de la caja del componente enfocado), el anillo sobre la barra en el flujo, 2.5.8, 1.4.12 y 3.2.6 | 1770 paradas (375 y 1440, letra a 16 y a 32); 2752 objetivos; 61 estados; 16 cargas × 2 anchos |
| D | ListBox de horas a 320 con el texto al 200 %; resto de pintado tras navegar en cliente | 8 combinaciones (02.1 y 02.7, inyección y letra, dos barras); 3 pasadas desde una vista desplazada y 3 por ancho en `/kit` |

Cada regla tiene su contraprueba en el script (una imagen sin alt da `image-alt`; un div
enfocable en `body` sale fuera de `#root`; target-size con la barra y sin ella; un h1 en
`color-border` da 2,27; el anillo en `surface-muted` falla en todas las paradas; con desfase −2
la hora seleccionada da ámbar a 2,09; un h1 con alto fijo sale recortado con el espaciado;
Inicio y Fin con la acción por defecto evitada; un resto inyectado supera el delta de 64).

## Resultados

| Prueba | Resultado |
|---|---|
| axe (A) | 0 violaciones salvo un falso positivo de posición, declarado exacto: target-size de «Ver horarios» (`/`) y de «Relleno 4» (`/kit/navegacion`) a 375, arriba, tapados por la barra inferior (sus relacionados son los tres Nav Item); 0 al final y sin la barra. Es el mismo aviso de «objetivos táctiles» de Lighthouse (96 en accesibilidad) |
| Fuera de `#root` (A) | Solo el anunciador de región viva de React Aria (1 × 1, recortado, sin foco), al navegar de mes en el calendario: expuesto a 1440 e ignorado (`activeModalDialog`) dentro de la hoja modal. ✗ declarado |
| Contraste (B) | ✓ 34 pares: texto ≥ 4,5 y límites ≥ 3 (o su relleno ≥ 3), ninguno de los 6 «No usar». 423 textos tapados, fuera de la cuenta (detrás de un modal o una hoja, y la inicial bajo la foto) |
| Incomplete de axe (B) | ✓ 43 de 43 resueltos con su par: 41 iniciales tapadas por la foto (sin texto visible) y 2 cuerpos del diálogo sobre el panel (16,65) |
| Anillo contra vecinos (B) | Regla del proyecto (diseño §3.1): las dos bandas ≥ 3 en cada punto. 856 de 929 paradas la cumplen; las 73 restantes, en seis grupos (§ Hallazgos): 60 de coste medido (✓ exacto) y 13 defectos del kit (✗ declarado). La hora seleccionada, 6,02 contra la superficie en las dos bandas |
| 2.4.11 (C) | ✓ ninguna de las 1770 paradas con el componente tapado entero. Dato: 6 parciales y 30 con parte del anillo bajo la barra (F2) |
| Anillo sobre la barra en el flujo (C) | ✓ con la letra real a 32 (375, 27 estados), nada de lo que queda encima toca la barra: margen mínimo de 60 px. Receta de 7.1 (inyección): 3,9 px a 375 × 900, 60 de margen a 375 × 812 |
| 2.5.8 (C) | ✓ 2752 objetivos, ninguno por debajo de 24 × 24 sin exención; 2 exenciones «en línea» (§ Datos) |
| 1.4.12 (C) | ✓ 61 estados a 320 y 1440 con los cuatro valores: 0 recortes, 0 solapes, 0 desborde horizontal |
| 3.2.6 (C) | ✓ «Ayuda» siempre en el mismo orden relativo: a 375, «Salvia · Ayuda»; a 1440, «Salvia · Especialistas · Mis citas · Ayuda · Karla Sánchez»; antes de `main`. Las 12 cargas de `/kit` no tienen header (no aplica) |
| ListBox a 320 y 200 % (D) | ✓ sin desborde, sin opciones recortadas, sin palabras partidas (8 de 8); ✓ → sigue el orden del DOM y ↓ la geometría (4 de 4); ✗ declarado F2 (anillo de las opciones 7–10 con la inyección, 27 de 36 puntos); ✗ declarado F1 (Inicio, 2 de 4 fuera del viewport) |
| Resto de pintado (D) | ✓ las vistas: desde `/?q=Cardiología&pagina=9` desplazada a 375 (34 tarjetas, «Ver horarios» de la última), 0 píxeles con delta > 64 al llegar y a los 4 s, en 3 de 3. `/kit`: a 1350, 12632 px con delta 230 al llegar y a los 4 s en 3 de 3; a 375, 0. ✗ declarado |

## Matriz WCAG 2.2 A y AA

Resultado: **✓ medido** (con cifra y prueba), **✓ revisado** (cumple por construcción, revisado
en el código, sin prueba automática), **N/A** (no hay contenido al que aplique), **✗ declarado**
(defecto conocido, con su pendiente) o **manual (7.4)** (depende de la prueba con lector o de
otros navegadores). 55 criterios vigentes; 4.1.1 es obsoleto en 2.2.

| Criterio | Nivel | Resultado | Evidencia |
|---|---|---|---|
| 1.1.1 Contenido no textual | A | ✓ medido | axe (`image-alt`, `svg-img-alt`, `role-img-alt`…) en 85 pasadas; los iconos, decorativos (`aria-hidden`, `pnpm verify 4.1`); los avatares con foto, con `alt` (4.2, 5.1) |
| 1.2.1 Solo audio y solo vídeo | A | N/A | No hay medios |
| 1.2.2 Subtítulos (grabado) | A | N/A | No hay medios |
| 1.2.3 Audiodescripción o alternativa | A | N/A | No hay medios |
| 1.2.4 Subtítulos (en directo) | AA | N/A | No hay medios |
| 1.2.5 Audiodescripción (grabado) | AA | N/A | No hay medios |
| 1.3.1 Información y relaciones | A | ✓ medido · manual (7.4) | axe (listas, tablas, `label`, landmarks, encabezados); estructura de encabezados y árbol de accesibilidad por vista (5.1–5.4); `Legend` con encabezado (D14). El anuncio con lector, 7.4 |
| 1.3.2 Secuencia con significado | A | ✓ medido | Orden de Tab = orden del DOM por vista (5.1–5.4); ListBox: → en el orden del DOM a 320 y 200 % (D) |
| 1.3.3 Características sensoriales | A | ✓ revisado | Ninguna instrucción depende de forma, posición o color (copy de §5 del diseño) |
| 1.3.4 Orientación | AA | ✓ revisado | Sin bloqueo de orientación en CSS ni en `index.html` |
| 1.3.5 Identificar el propósito de la entrada | AA | ✓ revisado | `autocomplete` `name`, `email` y `tel-national` en «Tus datos» (`PatientData.tsx`); axe `autocomplete-valid` sin violaciones |
| 1.4.1 Uso del color | A | ✓ medido | Estados con borde, tachado, glifo o peso además del color (diseño §3.2); `forced-colors` en 4.2–4.7 y 5.1–5.4 |
| 1.4.2 Control del audio | A | N/A | No hay audio |
| 1.4.3 Contraste (mínimo) | AA | ✓ medido | 34 pares renderizados, texto ≥ 4,5 (B); `pnpm contrast` (31 pares de F.3); 43 incomplete de axe resueltos |
| 1.4.4 Cambio de tamaño del texto | AA | ✓ medido | 200 % por inyección y letra del navegador a 24 y 32 en 4.1–4.7 y 5.1–5.4, sin pérdida; ListBox a 320 (D) |
| 1.4.5 Imágenes de texto | AA | ✓ revisado | El wordmark y todo el texto son texto HTML; no hay imágenes de texto |
| 1.4.10 Reajuste (reflow) | AA | ✓ medido | 320 sin scroll horizontal en 4.x y 5.x (al 100 % y al 200 %, dos barras); 1.4.12 a 320 sin desborde; ListBox a 320 |
| 1.4.11 Contraste no textual | AA | ✗ declarado | Límites de control ≥ 3 (B); anillo: 60 paradas de coste medido y 13 del kit con ✗ (grupos 1b y 4, 9 paradas con las dos bandas < 3): § Hallazgos |
| 1.4.12 Espaciado del texto | AA | ✓ medido | 61 estados a 320 y 1440 con los cuatro valores: 0 recortes, 0 solapes (C) |
| 1.4.13 Contenido con hover o foco | AA | ✓ revisado | No hay tooltips ni contenido al pasar; el menú de cuenta se abre con clic y se cierra con Escape (4.4) |
| 2.1.1 Teclado | A | ✓ medido | Flujos por teclado en 4.x y 5.x (Tab, Intro, Espacio, flechas, Escape); en el ListBox, Inicio y Fin mueven el foco (lo que falla es su visibilidad: F1, en 2.4.7) |
| 2.1.2 Sin trampas para el foco | A | ✓ medido | El diálogo cicla sus botones sin caer en la página y Escape lo cierra (4.7); las hojas se cierran con Escape (5.1, 5.2); los recorridos de Tab de B (929 paradas) y C (1770) avanzan hasta repetir una parada, sin tope |
| 2.1.4 Atajos de una tecla | A | N/A | No hay atajos de una tecla (el único manejador propio es Escape en el menú) |
| 2.2.1 Tiempo ajustable | A | N/A | No hay límites de tiempo (`lenta` es latencia simulada) |
| 2.2.2 Pausar, detener, ocultar | A | N/A | Nada se mueve más de 5 s ni se actualiza solo |
| 2.3.1 Tres destellos | A | N/A | No hay destellos |
| 2.4.1 Evitar bloques | A | ✓ medido | «Saltar al contenido» (4.4); axe `bypass` y landmarks |
| 2.4.2 Titulado de páginas | A | ✓ medido | Un `<title>` por ruta con el texto de D15, en D1 y `/kit` (5.0, 7.0) |
| 2.4.3 Orden del foco | A | ✓ medido | Orden de Tab por vista y foco de ruta, de errores y de avisos (5.0–5.4, `--preview`) |
| 2.4.4 Propósito de los enlaces | A | ✓ medido · manual (7.4) | axe `link-name`; nombres con destino (§5 del diseño). La lectura con lector, 7.4 |
| 2.4.5 Múltiples vías | AA | ✓ revisado | Navegación principal y búsqueda; las páginas de la reserva son pasos de un proceso (exentas) |
| 2.4.6 Encabezados y etiquetas | AA | ✓ medido | Esquema de encabezados por vista (5.1–5.4); etiquetas visibles encima del control (diseño §3.4, 4.3) |
| 2.4.7 Foco visible | AA | ✗ declarado | Anillo en las 929 paradas (B); tras Inicio en el ListBox a 320 con la letra a 32, la hora enfocada queda fuera de la vista (F1) |
| 2.4.11 Foco no tapado (mínimo) | AA | ✓ medido | 1770 paradas sin el componente tapado entero (C). Nota: F2, el anillo bajo la barra fija o sticky, no tapa el componente; incumple la regla del sistema (anillo entero): ✗ declarado del proyecto, 7.6 |
| 2.5.1 Gestos del puntero | A | N/A | No hay gestos de varios dedos ni de trayectoria |
| 2.5.2 Cancelación del puntero | A | ✓ revisado | Controles nativos y de React Aria: se activan al soltar |
| 2.5.3 Etiqueta en el nombre | A | ✓ medido · manual (7.4) | Day Chip: nombre = texto visible + oculto (4.6); el resto, con lector y control por voz, 7.4 |
| 2.5.4 Activación por movimiento | A | N/A | No hay |
| 2.5.7 Movimientos de arrastre | AA | N/A | No hay arrastre |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | ✓ medido | 2752 objetivos a 320, 375, 1440 y 320 con la letra a 32; 2 exenciones «en línea» (C) |
| 3.1.1 Idioma de la página | A | ✓ medido | `lang="es-MX"`; axe `html-has-lang` y `html-lang-valid` |
| 3.1.2 Idioma de las partes | AA | N/A | Todo el contenido está en español |
| 3.2.1 Al recibir el foco | A | ✓ revisado | Ningún control cambia de contexto al recibir el foco (sin `onFocus` que navegue o envíe); los recorridos de Tab de B y C no se cortan |
| 3.2.2 Al introducir datos | A | ✓ medido | Filtros y orden actualizan resultados sin mover el foco ni cambiar de página (5.1); los envíos van por botón |
| 3.2.3 Navegación coherente | AA | ✓ medido (dato de C, sin expectativa) | El header, en el mismo orden completo en las 10 cargas con header de cada ancho: «Salvia · Ayuda» a 375; «Salvia · Especialistas · Mis citas · Ayuda · Karla Sánchez» a 1440 (campo `orden` de 3.2.6) |
| 3.2.4 Identificación coherente | AA | ✓ revisado | Los mismos controles con el mismo nombre en todas las vistas (kit de componentes, D5) |
| 3.2.6 Ayuda coherente | A | ✓ medido | «Ayuda» en el mismo orden relativo en todas las cargas donde aparece (C) |
| 3.3.1 Identificación de errores | A | ✓ medido | Resumen de errores con el foco y mensajes por campo con `aria-invalid` y `aria-describedby` (5.3) |
| 3.3.2 Etiquetas o instrucciones | A | ✓ medido | Etiqueta visible en cada campo y ayuda del grupo (4.3, 5.3); axe `label` |
| 3.3.3 Sugerencia ante errores | AA | ✓ medido | Cada mensaje dice cómo corregir (5.3, diseño §5.3) |
| 3.3.4 Prevención de errores (legal, financiero, datos) | AA | ✓ revisado | Confirmación previa antes de reservar (02.4) y cancelación con diálogo (04.3); se puede reprogramar y cancelar |
| 3.3.7 Entrada redundante | A | ✓ medido | El borrador de «Tus datos» se conserva al salir y volver (D17, 5.3) |
| 3.3.8 Autenticación accesible (mínimo) | AA | N/A | No hay inicio de sesión (sesión simulada) |
| 4.1.1 Procesamiento | A | Obsoleto | Retirado en WCAG 2.2 |
| 4.1.2 Nombre, función, valor | A | ✓ medido · manual (7.4) | axe (`aria-*`, `button-name`, `link-name`, `listbox`…); estados ARIA del kit (4.x); el anuncio con lector, 7.4 |
| 4.1.3 Mensajes de estado | AA | ✗ declarado · manual (7.4) | Regiones vivas existen antes del mensaje (4.2, 5.1); el anunciador de React Aria queda inerte dentro de la hoja del calendario (✗ declarado). El anuncio real, 7.4 |

## Hallazgos

Los ✗ de la sección, cada uno declarado en su expectativa y con su fila en DESIGN.md, Pendientes.

| Defecto | Criterio | Cifra | Decisión |
|---|---|---|---|
| Anunciador de React Aria inerte dentro de la hoja del calendario | 4.1.3 | Ignorado por `activeModalDialog` al pasar de mes («mayo de 2029»); a 1440, en línea, expuesto | 7.6: región oculta propia en `c-sheet--bottom` |
| Anillo del Nav Item suelto de `/kit` (grupo 1b) | 1.4.11 | 2 paradas con un punto de 36 con las dos bandas < 3 (1,33 sobre la barra de actual y 2,75 sobre la etiqueta) | 7.6, solo del kit (D9) |
| Salto al contenido sobre el contenido de `/kit/*` (grupo 4) | 1.4.11 | 11 paradas, 7 con puntos de las dos bandas < 3: el catálogo no tiene header debajo | 7.6, solo del kit |
| F1 · Inicio y Fin en el ListBox | 2.4.7 | Inicio deja la hora fuera de la vista en 2 de 4 casos (letra a 32; y −217 y −172); la acción por defecto no se evita | 7.6: `onKeyDownCapture` en `SlotList`, como `Calendar` |
| F2 · Anillo bajo la barra fija o sticky | Regla del sistema (2.4.11 cumple) | 30 paradas con 3,9–5 px del anillo bajo la barra; en el ListBox con la inyección, 27 de 36 puntos | 7.6: `scroll-padding-block-end` = barra + desfase + grosor |
| Resto de pintado en `/kit` | — (pintado) | A 1350, 12632 px con delta 230 al llegar y a los 4 s, 3 de 3; a 375, 0; igual contra dev (4.6) | ✗ declarado de `/kit` (D9); Chrome real, 7.4 |

**Coste medido del anillo (✓, exacto en la expectativa).** 60 paradas que no cumplen la regla
§3.1 pero tienen en cada punto una banda ≥ 3: Nav Item y Nav Link con desfase −4 junto a la
barra de actual (1,33) o al borde de la barra (2,66), 50; chip de la tira y celda del calendario
junto al borde del vecino (1,4 y 1,01), 4; disparador del menú junto al borde del panel (1,4), 1;
enlaces en línea del kit junto al texto vecino, 5.

**Falso positivo de posición (✓, exacto en la expectativa).** target-size de axe en `/` y en
`/kit/navegacion` a 375, arriba: el objetivo mide 309 × 50 y 343 × 30 y está bajo la barra
inferior; al final del scroll y sin la barra, 0 (contraprueba). Explica el 96 de Lighthouse.

**Hallazgo de 7.1: ✓ en Chromium · Firefox (zoom solo de texto) en 7.4.** Con la letra real (`Page.setFontSizes` a 32, 375) la barra va en
el flujo y nada de lo que queda encima la toca: 60 px de margen mínimo en 27 estados. Con la
inyección en `html` (la receta de 7.1) la barra sigue sticky y el solape depende del alto: 3,9
px a 375 × 900 (27 de 36 puntos del anillo pintados) y 60 de margen a 375 × 812; un usuario no
alcanza esa condición en Chromium. Firefox con zoom solo de texto, 7.4.

## Datos (sin criterio)

- **best-practice de axe:** violaciones en 28 de 85 pasadas, sin incomplete. `region` (contenido
  fuera de landmarks) en 26: sobre todo `.c-app-layout__bar` con la Booking Bar o la Action Bar,
  **candidata de baja prioridad para 7.6, sin decidir**; también en `/kit/fecha-hora` y
  `/kit/layout`. `landmark-unique` en 2 (`/kit`, un `nav` sin nombre único).
- **Pares fuera de F.3:** límite `error` / `surface` (8,31: botón destructivo y campo con error),
  límite `scrim` / `surface` (21: botones sin estilo de las demos del kit), texto `text-link` /
  `surface-muted` (6,19: «Ir a Enlaces» en `/kit`) y texto `text-primary` / `#f0f0f0` (14,61: el
  fondo del navegador en esos botones del kit). Iconos: 13 pares, todos ≥ 3,73 salvo el check de
  la casilla sin marcar, que no se pinta a propósito (el estado lo da el borde de la caja).
- **Exenciones de 2.5.8 («en línea»):** «volver a Tipografía» (141,4 × 20, en 3 cargas) e «ir a
  Foco» (56,9 × 17, en 2), enlaces dentro de un texto del catálogo.
- **Casillas parciales en 2.4.11:** la caja de la casilla asoma 2 px bajo el viewport tras Tab
  (privacidad en «Tus datos» a 1440; casilla y radio de `/kit` a 375 con la letra a 32), y en la
  hoja de filtros a 1440 con la letra a 32 dos casillas quedan cortadas por el límite del cuerpo
  desplazable, encima del pie (2 de 5 puntos). Causa probable, sin verificar: el navegador
  desplaza a la vista el input oculto de 1 × 1, no la caja visible.
- **Anillo bajo la barra (F2), las 30 paradas:** en `out/7.3/auditoria-cd.json` y sus capturas
  (`foco-*.png`).

## Limitaciones conocidas

- Los seis defectos de § Hallazgos siguen abiertos (5 en 7.6; el resto de pintado de `/kit`,
  declarado, con Chrome real en 7.4).
- Solo Chromium (Edge headless). Safari, Firefox y los móviles reales, en 7.4; también la zona
  segura del iPhone, `last baseline`, `hyphens` y el envío implícito (DESIGN.md, Pendientes).
- Sin lector de pantalla: los anuncios (regiones vivas, `aria-describedby`, `alertdialog`,
  estado del conmutador, calendario) se verificaron en su estructura y en el árbol de
  accesibilidad de Chromium, no oídos. 7.4.
- El bloque B mide en reposo: sin transiciones ni animaciones y con el puntero aparcado (un
  borde intermedio de 1,45 en una pasada, sin reproducir: docs/verificacion.md, Trampas).
- `lenta` solo pasa por axe; su estado cambia a los 1,5 s.
