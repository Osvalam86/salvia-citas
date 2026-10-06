# Auditoría de accesibilidad · 7.3 automática y 7.4 manual

Qué se midió en la fase 7, cómo, con qué resultado y qué queda abierto. 7.3 es la auditoría
automática (Edge headless, el grueso de este documento). 7.4 es la prueba manual (NVDA con
Firefox y Chrome, teclado en Firefox, un Android y Google Calendar), recortada por tiempo: su
resultado va en la columna «Manual (7.4)» de la matriz y en § Prueba manual · 7.4; el guion,
con los literales del lector, en docs/auditoria-manual.md. Lo que 7.4 no midió dice «sin medir
en 7.4», nunca ✓.

- **Sección:** `pnpm verify 7.3` (`scripts/verify/7.3-auditoria.mjs`, `7.3-cd.mjs` y
  `7.3-comun.mjs`; docs/verificacion.md). Audita el build, nunca `pnpm dev`:
  `VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.3`.
- **Base de las cifras:** producción, 30 de septiembre de 2026 (despliegue de a8f4931; el
  build de la app no cambia desde 3423e78). Edge 154.0.4258.37 headless por CDP, Node 26.3.0,
  axe-core 4.13.0.
- **Resultado de la sección:** 30 expectativas, 25 ✓ y 5 ✗ declarados que cubren 6 defectos
  (§ Hallazgos).
- **7.6:** cada lote corrige un defecto y fija el recuento antes de medir (contra la preview).
  Lote 1 (F1): 27/31, 4 ✗ declarados con 5 defectos. Lote 2 (anunciador en la hoja): 29/32,
  3 ✗ declarados con 4 defectos. Lote 3 (disparador de filtros, sin expectativa en 7.3): 29/32. Lote 4 («entrada inválida», sin
  expectativa en 7.3): 29/32.

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
| Fuera de `#root` (A) | Solo el anunciador de región viva de React Aria (1 × 1, recortado, sin foco), al navegar de mes en el calendario: expuesto a 1440 e ignorado (`activeModalDialog`) dentro de la hoja modal. ✗ declarado. **7.6:** ✓, el anunciador ignorado como coste exacto y la región propia de la hoja en el árbol AX con «mayo de 2029» (vacía al abrir); en línea, ninguna |
| Contraste (B) | ✓ 34 pares: texto ≥ 4,5 y límites ≥ 3 (o su relleno ≥ 3), ninguno de los 6 «No usar». 423 textos tapados, fuera de la cuenta (detrás de un modal o una hoja, y la inicial bajo la foto) |
| Incomplete de axe (B) | ✓ 43 de 43 resueltos con su par: 41 iniciales tapadas por la foto (sin texto visible) y 2 cuerpos del diálogo sobre el panel (16,65) |
| Anillo contra vecinos (B) | Regla del proyecto (diseño §3.1): las dos bandas ≥ 3 en cada punto. 856 de 929 paradas la cumplen; las 73 restantes, en seis grupos (§ Hallazgos): 60 de coste medido (✓ exacto) y 13 defectos del kit (✗ declarado). La hora seleccionada, 6,02 contra la superficie en las dos bandas |
| 2.4.11 (C) | ✓ ninguna de las 1770 paradas con el componente tapado entero. Dato: 6 parciales y 30 con parte del anillo bajo la barra (F2) |
| Anillo sobre la barra en el flujo (C) | ✓ con la letra real a 32 (375, 27 estados), nada de lo que queda encima toca la barra: margen mínimo de 60 px. Receta de 7.1 (inyección): 3,9 px a 375 × 900, 60 de margen a 375 × 812 |
| 2.5.8 (C) | ✓ 2752 objetivos, ninguno por debajo de 24 × 24 sin exención; 2 exenciones «en línea» (§ Datos) |
| 1.4.12 (C) | ✓ 61 estados a 320 y 1440 con los cuatro valores: 0 recortes, 0 solapes, 0 desborde horizontal |
| 3.2.6 (C) | ✓ «Ayuda» siempre en el mismo orden relativo: a 375, «Salvia · Ayuda»; a 1440, «Salvia · Especialistas · Mis citas · Ayuda · Karla Sánchez»; antes de `main`. Las 12 cargas de `/kit` no tienen header (no aplica) |
| ListBox a 320 y 200 % (D) | ✓ sin desborde, sin opciones recortadas, sin palabras partidas (8 de 8); ✓ → sigue el orden del DOM y ↓ la geometría (4 de 4); ✗ declarado F2 (anillo de las opciones 7–10 con la inyección, 27 de 36 puntos); ✗ declarado F1 (Inicio, 2 de 4 fuera del viewport). **7.6:** F1 ✓, Fin e Inicio a la vista en 4 de 4 y las ocho combinaciones con `defaultPrevented` |
| Resto de pintado (D) | ✓ las vistas: desde `/?q=Cardiología&pagina=9` desplazada a 375 (34 tarjetas, «Ver horarios» de la última), 0 píxeles con delta > 64 al llegar y a los 4 s, en 3 de 3. `/kit`: a 1350, 12632 px con delta 230 al llegar y a los 4 s en 3 de 3; a 375, 0. ✗ declarado |

## Matriz WCAG 2.2 A y AA

Resultado (7.3): **✓ medido** (con cifra y prueba), **✓ revisado** (cumple por construcción,
revisado en el código, sin prueba automática), **N/A** (no hay contenido al que aplique) o
**✗ declarado** (defecto conocido, con su pendiente). 55 criterios vigentes; 4.1.1 es obsoleto
en 2.2.

Manual (7.4): **✓** con su navegador (NF: NVDA 2026.2 con Firefox 157; NC: NVDA con Chrome 154;
Firefox o Android sin lector) y el paso de docs/auditoria-manual.md; **✓ parcial** dice qué
parte; **sin medir en 7.4** (recorte); **sin dispositivo** (Safari, iOS, VoiceOver); **—** (7.4
no lo prueba). Lo que 7.4 halló contra la regla del proyecto, no contra WCAG, va con su fila
de 7.6.

| Criterio | Nivel | Resultado | Evidencia | Manual (7.4) |
|---|---|---|---|---|
| 1.1.1 Contenido no textual | A | ✓ medido | axe (`image-alt`, `svg-img-alt`, `role-img-alt`…) en 85 pasadas; los iconos, decorativos (`aria-hidden`, `pnpm verify 4.1`); los avatares con foto, con `alt` (4.2, 5.1) | — |
| 1.2.1 Solo audio y solo vídeo | A | N/A | No hay medios | — |
| 1.2.2 Subtítulos (grabado) | A | N/A | No hay medios | — |
| 1.2.3 Audiodescripción o alternativa | A | N/A | No hay medios | — |
| 1.2.4 Subtítulos (en directo) | AA | N/A | No hay medios | — |
| 1.2.5 Audiodescripción (grabado) | AA | N/A | No hay medios | — |
| 1.3.1 Información y relaciones | A | ✓ medido | axe (listas, tablas, `label`, landmarks, encabezados); estructura de encabezados y árbol de accesibilidad por vista (5.1–5.4); `Legend` con encabezado (D14). El anuncio con lector, 7.4 | ✓ NF parcial: los encabezados de las 9 rutas con H, al 100 % y estrecho (N0.1); el h2 oculto de RAC no sale con H por `role="application"` (N3.1, explicado, sin ✗). NC: sin medir en 7.4. VoiceOver: sin dispositivo |
| 1.3.2 Secuencia con significado | A | ✓ medido | Orden de Tab = orden del DOM por vista (5.1–5.4); ListBox: → en el orden del DOM a 320 y 200 % (D) | — |
| 1.3.3 Características sensoriales | A | ✓ revisado | Ninguna instrucción depende de forma, posición o color (copy de §5 del diseño) | — |
| 1.3.4 Orientación | AA | ✓ revisado | Sin bloqueo de orientación en CSS ni en `index.html` | — |
| 1.3.5 Identificar el propósito de la entrada | AA | ✓ revisado | `autocomplete` `name`, `email` y `tel-national` en «Tus datos» (`PatientData.tsx`); axe `autocomplete-valid` sin violaciones | — |
| 1.4.1 Uso del color | A | ✓ medido | Estados con borde, tachado, glifo o peso además del color (diseño §3.2); `forced-colors` en 4.2–4.7 y 5.1–5.4 | — |
| 1.4.2 Control del audio | A | N/A | No hay audio | — |
| 1.4.3 Contraste (mínimo) | AA | ✓ medido | 34 pares renderizados, texto ≥ 4,5 (B); `pnpm contrast` (31 pares de F.3); 43 incomplete de axe resueltos | — |
| 1.4.4 Cambio de tamaño del texto | AA | ✓ medido | 200 % por inyección y letra del navegador a 24 y 32 en 4.1–4.7 y 5.1–5.4, sin pérdida; ListBox a 320 (D) | ✓ parcial, Firefox a 375 (K.7): con la letra a 32 y con el zoom solo de texto al 200 %, modo de texto grande activo y la barra en el flujo (`static`); a 16, `sticky`. 320, 430 y 375 × 812, sin medir. Chrome (C.3) y Android (A.2): sin medir en 7.4. Safari: sin dispositivo |
| 1.4.5 Imágenes de texto | AA | ✓ revisado | El wordmark y todo el texto son texto HTML; no hay imágenes de texto | — |
| 1.4.10 Reajuste (reflow) | AA | ✓ medido | 320 sin scroll horizontal en 4.x y 5.x (al 100 % y al 200 %, dos barras); 1.4.12 a 320 sin desborde; ListBox a 320 | — |
| 1.4.11 Contraste no textual | AA | ✗ declarado | Límites de control ≥ 3 (B); anillo: 60 paradas de coste medido y 13 del kit con ✗ (grupos 1b y 4, 9 paradas con las dos bandas < 3): § Hallazgos | — |
| 1.4.12 Espaciado del texto | AA | ✓ medido | 61 estados a 320 y 1440 con los cuatro valores: 0 recortes, 0 solapes (C) | — |
| 1.4.13 Contenido con hover o foco | AA | ✓ revisado | No hay tooltips ni contenido al pasar; el menú de cuenta se abre con clic y se cierra con Escape (4.4) | — |
| 2.1.1 Teclado | A | ✓ medido | Flujos por teclado en 4.x y 5.x (Tab, Intro, Espacio, flechas, Escape); en el ListBox, Inicio y Fin mueven el foco (lo que fallaba era su visibilidad: F1, en 2.4.7, corregido en 7.6) | ✓ Firefox: Intro en un radio de la tira hace el envío implícito (K.4 a) |
| 2.1.2 Sin trampas para el foco | A | ✓ medido | El diálogo cicla sus botones sin caer en la página y Escape lo cierra (4.7); las hojas se cierran con Escape (5.1, 5.2); los recorridos de Tab de B (929 paradas) y C (1770) avanzan hasta repetir una parada, sin tope | ✓ Firefox: con el diálogo abierto ningún elemento de la página recibe el foco (K.1); en la hoja del calendario, Tab sale a la interfaz y vuelve al diálogo (N3.8b). Safari: sin dispositivo |
| 2.1.4 Atajos de una tecla | A | N/A | No hay atajos de una tecla (el único manejador propio es Escape en el menú) | — |
| 2.2.1 Tiempo ajustable | A | N/A | No hay límites de tiempo (`lenta` es latencia simulada) | — |
| 2.2.2 Pausar, detener, ocultar | A | N/A | Nada se mueve más de 5 s ni se actualiza solo | — |
| 2.3.1 Tres destellos | A | N/A | No hay destellos | — |
| 2.4.1 Evitar bloques | A | ✓ medido | «Saltar al contenido» (4.4); axe `bypass` y landmarks | — |
| 2.4.2 Titulado de páginas | A | ✓ medido | Un `<title>` por ruta con el texto de D15, en D1 y `/kit` (5.0, 7.0) | — |
| 2.4.3 Orden del foco | A | ✓ medido | Orden de Tab por vista y foco de ruta, de errores y de avisos (5.0–5.4, `--preview`) | ✓ Firefox: foco devuelto al cerrar el diálogo (K.2); en la primera tarjeta tras «Siguiente» y «Ver más» (N1.6, N1.7; N1.7 también en Chrome); en la primera hora libre en Missing (K.4 a) |
| 2.4.4 Propósito de los enlaces | A | ✓ medido | axe `link-name`; nombres con destino (§5 del diseño). La lectura con lector, 7.4 | ✓ NF: los seis enlaces repetidos se oyen con su contexto por `aria-describedby` (N0.3, técnica ARIA1). NC: sin medir en 7.4. VoiceOver: sin dispositivo |
| 2.4.5 Múltiples vías | AA | ✓ revisado | Navegación principal y búsqueda; las páginas de la reserva son pasos de un proceso (exentas) | — |
| 2.4.6 Encabezados y etiquetas | AA | ✓ medido | Esquema de encabezados por vista (5.1–5.4); etiquetas visibles encima del control (diseño §3.4, 4.3) | — |
| 2.4.7 Foco visible | AA | ✓ medido (7.6) | Anillo en las 929 paradas (B); tras Inicio en el ListBox a 320 con la letra a 32, la hora enfocada quedaba fuera de la vista (F1, ✗ en 7.3); corregido en 7.6: a la vista en 4 de 4 y con las ocho combinaciones de Inicio y Fin (D) | Sin medir en 7.4 (K.8) |
| 2.4.11 Foco no tapado (mínimo) | AA | ✓ medido | 1770 paradas sin el componente tapado entero (C). Nota: F2, el anillo bajo la barra fija o sticky, no tapa el componente; incumple la regla del sistema (anillo entero): ✗ declarado del proyecto, 7.6 | Sin medir en 7.4 (K.6). Safari: sin dispositivo |
| 2.5.1 Gestos del puntero | A | N/A | No hay gestos de varios dedos ni de trayectoria | — |
| 2.5.2 Cancelación del puntero | A | ✓ revisado | Controles nativos y de React Aria: se activan al soltar | — |
| 2.5.3 Etiqueta en el nombre | A | ✓ medido | Day Chip: nombre = texto visible + oculto (4.6); el resto, con lector y control por voz, 7.4 | ✓ NF: el nombre de Day Chip y el del disparador de filtros empiezan por el texto visible (N1.12). Dato: Acceso por voz de Windows, «clic en mar 24», selecciona el chip |
| 2.5.4 Activación por movimiento | A | N/A | No hay | — |
| 2.5.7 Movimientos de arrastre | AA | N/A | No hay arrastre | — |
| 2.5.8 Tamaño del objetivo (mínimo) | AA | ✓ medido | 2752 objetivos a 320, 375, 1440 y 320 con la letra a 32; 2 exenciones «en línea» (C) | ✓ parcial, Android (Chrome 153): los tres enlaces de la barra inferior (A.3). Chips, horas y casillas: sin medir en 7.4 |
| 3.1.1 Idioma de la página | A | ✓ medido | `lang="es-MX"`; axe `html-has-lang` y `html-lang-valid` | — |
| 3.1.2 Idioma de las partes | AA | N/A | Todo el contenido está en español | — |
| 3.2.1 Al recibir el foco | A | ✓ revisado | Ningún control cambia de contexto al recibir el foco (sin `onFocus` que navegue o envíe); los recorridos de Tab de B y C no se cortan | — |
| 3.2.2 Al introducir datos | A | ✓ medido | Filtros y orden actualizan resultados sin mover el foco ni cambiar de página (5.1); los envíos van por botón | — |
| 3.2.3 Navegación coherente | AA | ✓ medido (dato de C, sin expectativa) | El header, en el mismo orden completo en las 10 cargas con header de cada ancho: «Salvia · Ayuda» a 375; «Salvia · Especialistas · Mis citas · Ayuda · Karla Sánchez» a 1440 (campo `orden` de 3.2.6) | — |
| 3.2.4 Identificación coherente | AA | ✓ revisado | Los mismos controles con el mismo nombre en todas las vistas (kit de componentes, D5) | — |
| 3.2.6 Ayuda coherente | A | ✓ medido | «Ayuda» en el mismo orden relativo en todas las cargas donde aparece (C) | — |
| 3.3.1 Identificación de errores | A | ✓ medido | Resumen de errores con el foco y mensajes por campo con `aria-invalid` y `aria-describedby` (5.3) | ✓ NF: «Corrige 3 campos para continuar», encabezado nivel 2, con el foco (N2.2). Regla del proyecto, no WCAG: «entrada inválida» antes del primer envío, NF y NC (corregido en 7.6 en el arnés, lote 4: `aria-required` y el correo como text) |
| 3.3.2 Etiquetas o instrucciones | A | ✓ medido | Etiqueta visible en cada campo y ayuda del grupo (4.3, 5.3); axe `label` | ✓ NF y NC: la ayuda del grupo se oye por `aria-describedby` al entrar (N2.1; con Chrome, en el bloque del hallazgo tras N2.2) |
| 3.3.3 Sugerencia ante errores | AA | ✓ medido | Cada mensaje dice cómo corregir (5.3, diseño §5.3) | — |
| 3.3.4 Prevención de errores (legal, financiero, datos) | AA | ✓ revisado | Confirmación previa antes de reservar (02.4) y cancelación con diálogo (04.3); se puede reprogramar y cancelar | — |
| 3.3.7 Entrada redundante | A | ✓ medido | El borrador de «Tus datos» se conserva al salir y volver (D17, 5.3) | — |
| 3.3.8 Autenticación accesible (mínimo) | AA | N/A | No hay inicio de sesión (sesión simulada) | — |
| 4.1.1 Procesamiento | A | Obsoleto | Retirado en WCAG 2.2 | — |
| 4.1.2 Nombre, función, valor | A | ✓ medido | axe (`aria-*`, `button-name`, `link-name`, `listbox`…); estados ARIA del kit (4.x); el anuncio con lector, 7.4 | ✓ NF parcial: nombre, función y estado oídos en N1–N3 (página actual y actual, contraído y expandido, conmutador pulsado, radio marcado, opción no disponible, «seleccionado» una vez). Dato: el `alertdialog` se lee «diálogo» (N2.3). NC: solo N1.7 y N1.9–N1.11. VoiceOver: sin dispositivo |
| 4.1.3 Mensajes de estado | AA | ✓ medido (7.6, en el arnés) | Regiones vivas existen antes del mensaje (4.2, 5.1); el anunciador de React Aria queda inerte dentro de la hoja del calendario (✗ declarado en 7.3), cubierto en 7.6 por la región propia de la hoja (5.2 y 7.3); de oído, tras el deploy. El anuncio real, 7.4 | ✓ NF y NC: el recuento (N1.8) y la región del borrador de la hoja (N1.10); ✓ NF: el aviso en región viva (N2.5). ✗ declarado, confirmado de oído: el anunciador inerte en la hoja (N3.8b). Regla del proyecto, no WCAG: el disparador se anuncia con el recuento anterior al aplicar, NF y NC (N1.11; corregido en 7.6 en el arnés, lote 3). `role="alert"`: N/A, sin instancia |

## Hallazgos

Los ✗ de la sección, cada uno declarado en su expectativa y con su fila en DESIGN.md, Pendientes.

| Defecto | Criterio | Cifra | Decisión |
|---|---|---|---|
| Anunciador de React Aria inerte dentro de la hoja del calendario | 4.1.3 | Ignorado por `activeModalDialog` al pasar de mes («mayo de 2029»); a 1440, en línea, expuesto. Confirmado de oído en 7.4 (NVDA + Firefox, N3.8b: en la hoja no se oye; en línea, sí, N3.8) | ✓ 7.6 en el arnés: región propia en la hoja (`Calendar`, `announceMonth`), vacía al abrir y al cruzar de mes con el foco en la rejilla; foco y no región cuando el botón desaparece (5.2 y 7.3). La fecha seleccionada, declarada en la fila. De oído, tras el deploy |
| Anillo del Nav Item suelto de `/kit` (grupo 1b) | 1.4.11 | 2 paradas con un punto de 36 con las dos bandas < 3 (1,33 sobre la barra de actual y 2,75 sobre la etiqueta) | 7.6, solo del kit (D9) |
| Salto al contenido sobre el contenido de `/kit/*` (grupo 4) | 1.4.11 | 11 paradas, 7 con puntos de las dos bandas < 3: el catálogo no tiene header debajo | 7.6, solo del kit |
| F1 · Inicio y Fin en el ListBox | 2.4.7 | Inicio deja la hora fuera de la vista en 2 de 4 casos (letra a 32; y −217 y −172); la acción por defecto no se evita | ✓ 7.6: escuchador nativo en captura en `SlotList` (ListBox no reenvía `onKeyDownCapture`), en las combinaciones que RAC atiende; 4 de 4 a la vista |
| F2 · Anillo bajo la barra fija o sticky | Regla del sistema (2.4.11 cumple) | 30 paradas con 3,9–5 px del anillo bajo la barra; en el ListBox con la inyección, 27 de 36 puntos | 7.6: `scroll-padding-block-end` = barra + desfase + grosor |
| Resto de pintado en `/kit` | — (pintado) | A 1350, 12632 px con delta 230 al llegar y a los 4 s, 3 de 3; a 375, 0; igual contra dev (4.6) | ✗ declarado de `/kit` (D9); Chrome real, sin medir en 7.4 (tramo C, recorte) |

**Coste medido del anillo (✓, exacto en la expectativa).** 60 paradas que no cumplen la regla
§3.1 pero tienen en cada punto una banda ≥ 3: Nav Item y Nav Link con desfase −4 junto a la
barra de actual (1,33) o al borde de la barra (2,66), 50; chip de la tira y celda del calendario
junto al borde del vecino (1,4 y 1,01), 4; disparador del menú junto al borde del panel (1,4), 1;
enlaces en línea del kit junto al texto vecino, 5.

**Falso positivo de posición (✓, exacto en la expectativa).** target-size de axe en `/` y en
`/kit/navegacion` a 375, arriba: el objetivo mide 309 × 50 y 343 × 30 y está bajo la barra
inferior; al final del scroll y sin la barra, 0 (contraprueba). Explica el 96 de Lighthouse.

**Hallazgo de 7.1: ✓ en Chromium (7.3) · ✓ en Firefox (7.4).** Con la letra real (`Page.setFontSizes` a 32, 375) la barra va en
el flujo y nada de lo que queda encima la toca: 60 px de margen mínimo en 27 estados. Con la
inyección en `html` (la receta de 7.1) la barra sigue sticky y el solape depende del alto: 3,9
px a 375 × 900 (27 de 36 puntos del anillo pintados) y 60 de margen a 375 × 812; un usuario no
alcanza esa condición en Chromium. En Firefox 157.0 (7.4, K.7 a; RDM 375 × 900, una pasada) el zoom solo de texto mueve la media
query en rem: al 200 %, `letraRaiz` 32px, modo de texto grande activo y la barra `static`
(`barraInicio` 832); a 16, `sticky` (836). La condición de 7.1 (texto ampliado con la barra
sticky) no se alcanza. `ANILLO` y 375 × 812, sin medir.

## Prueba manual · 7.4

Guion, literales del Visor de voz y cifras en docs/auditoria-manual.md. Ejecutada por Osvaldo
el 1 de octubre de 2026, contra producción con el build `index-DgeRHP-Q.js` (el de 7.3).

**Entornos.**

| Tramo | Hora (GMT−6) | Equipo y sistema | Navegador y lector | Notas |
|---|---|---|---|---|
| NF1–NF3 | 10:55–13:35 y 16:45–17:00 | PC de escritorio, Windows 11 26H2 (26300.9550) | Firefox 157.0, NVDA 2026.2 (2026.2.0.57664) | 1920 × 919 al 100 %; estrecho = zoom 200 %, 960 × 460, dpr 2; Adblock Plus (permitido en el sitio) y React DevTools |
| NC (recortado) | 17:13–17:20 | El mismo | Chrome 154 (`Chrome/154.0.0.0`), NVDA 2026.2 | Solo los hallazgos: N1.7, N1.9–N1.11 y la validación nativa de N2; 1920 × 911, barra 15; `js` sin leer |
| K (recortado) | 17:22–17:41 | El mismo | Firefox 157.0, sin lector | K.1, K.2, K.4 (a) y K.7; registro de `focusin` y `focusout` en consola |
| A (recortado) | 17:45–17:54 | POCO F7 (25053PC47G), Android 16 (BP2A.250605.031.A3), HyperOS 3.0.303.0 | Chrome 153.0.8010.52 | A.1 (a) y A.3 en parte; navegación por gestos; sin depuración USB; `js` sin leer |
| I (recortado) | 17:50 | PC | Chrome 154; Google Calendar web, zona GMT−06 | I.1 en Chrome e I.3 |

**Recorte.** El guion completo no cabía en el tiempo disponible. Sin medir en 7.4: N3.5, N3.6,
el resto de NC1–NC3, K.3, K.4 (b), K.5, K.6, K.8, K.9, todo el tramo C (resto de pintado en
Chrome real y letra real de Chrome), A.1 (b), A.2, A.4–A.6, I.1 en Firefox, I.2, I.4 e I.5.

**Resultado.** Con NVDA + Firefox, la estructura (N0), la navegación, la búsqueda, la hoja de
filtros, el formulario, el diálogo, los avisos y el calendario se oyen como dice el guion,
salvo dos hallazgos contra la regla del proyecto y el ✗ ya declarado del anunciador inerte.
Firefox hace el envío implícito, devuelve el foco del diálogo y no lo deja salir a la página.
En Android, Atrás cierra la hoja de filtros sin bloquear la página. Google Calendar importa el
`.ics` con la hora y la ubicación correctas.

| Hallazgo de 7.4 | Criterio | Literal o cifra | Decisión |
|---|---|---|---|
| El disparador de filtros se anuncia con el recuento anterior al aplicar | Regla del proyecto (los dos mensajes al aplicar), no WCAG: el nombre se corrige y el recuento llega por la región de estado | «Filtrar y ordenar, 1 filtro aplicado» tras aplicar 2; NVDA+Tab después, «2 filtros aplicados» (N1.11, NF y NC). `Sheet.tsx` devuelve el foco antes de `onSubmit()` | ✓ 7.6 en el arnés (lote 3): `onSubmit()` antes de `close()` y `flushSync` en la hoja de filtros; 5.1 mide el nombre en el `focusin` («2 filtros aplicados»). De oído, tras el deploy |
| «entrada inválida» antes del primer envío | Regla del proyecto (validación al enviar, diseño §3.4), no WCAG | El select de motivo y la casilla de privacidad, en Firefox y Chrome; el fieldset, solo en Firefox (N2.1, bloque del hallazgo). Es la validez nativa de `required`, expuesta pese a `noValidate`; `aria-invalid="false"` no la anula en Firefox | ✓ 7.6 en el arnés (lote 4): `aria-required` en vez de `required` y el correo como text con `inputMode="email"`; 5.3 mide `form :invalid` vacío al cargar y ningún obligatorio inválido en el árbol AX. De oído, tras el deploy |
| Anunciador de React Aria inerte en la hoja | 4.1.3 (✗ declarado en 7.3) | No se oye «mayo de 2029» en la hoja (N3.8b, dos pasadas); en línea, sí (N3.8) | Confirmado de oído; 7.6, ya con fila |

**Datos sin fila.** El h2 oculto de RAC no sale con H porque la raíz del calendario lleva
`role="application"` (N3.1, contraprueba quitando el rol). Hoy se anuncia dos veces, «hoy» del
nombre y «fecha actual» de `aria-current="date"` (N3.4): redundante, a decidir en 7.6. El
`alertdialog` se lee «diálogo» (N2.3). «lista procesando» al llegar el foco tras «Ver más», solo
en Firefox (N1.7). Los cuerpos de los avisos con foco no se leen solos (N2.4, N2.4b).

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

- De los seis defectos de § Hallazgos, F1 (lote 1) y el anunciador inerte (lote 2, en el arnés) se
  cerraron en 7.6; el resto sigue abierto (3 en 7.6; el resto de pintado de `/kit`,
  declarado, sin medir en Chrome real en 7.4), y los dos hallazgos de 7.4, en 7.6.
- Lo automático, solo Chromium (Edge headless). 7.4 añadió NVDA con Firefox 157 (y con Chrome
  154 solo para los hallazgos), teclado en Firefox, un Android con Chrome 153 y Google Calendar,
  con el recorte de § Prueba manual · 7.4.
- Sin dispositivo (sin Mac ni iPhone): Safari de macOS e iOS, VoiceOver y la zona segura del
  iPhone; `last baseline` solo se mide en Safari (DESIGN.md, Pendientes, «7 · sin dispositivo»).
- Con lector, solo NVDA, y casi todo con Firefox: lo que NVDA dice con Chrome solo se oyó en
  los hallazgos.
- El bloque B mide en reposo: sin transiciones ni animaciones y con el puntero aparcado (un
  borde intermedio de 1,45 en una pasada, sin reproducir: docs/verificacion.md, Trampas).
- `lenta` solo pasa por axe; su estado cambia a los 1,5 s.
