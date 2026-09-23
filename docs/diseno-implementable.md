# Salvia · Diseño implementable

Todo lo que el diseño cerrado en Figma decide y el código debe respetar. Es la
fuente de verdad de esta fase: cuando el código y este documento discrepen,
manda el documento. Si crees que se equivoca, dilo antes de desviarte.

Lo que **no** está aquí, a propósito: coordenadas de canvas, alturas resultantes
de frames, nombres de capa y convenciones del Plugin API de Figma. Son memoria
de cómo se dibujó, no decisiones de producto. Las medidas que sí aparecen son
las que fijan una construcción (fórmulas de alto, anchos de columna, tamaños de
icono), no las que se derivan del contenido.

Archivo de origen: `sVVjX11h3CrCOFNybb7gL1` — accesible por MCP.

---

## 1 · Qué es y qué demuestra

Plataforma para agendar consultas con especialistas médicos. El objetivo no es
el producto: es demostrar oficio de maquetación y accesibilidad implementada —
sistema de tokens, componentes con estados, accesibilidad resuelta y
comportamiento responsive.

Cuatro vistas, en móvil y escritorio:

1. Búsqueda de especialista
2. Perfil y selección de horario — la pieza que vende el proyecto
3. Datos del paciente
4. Confirmación y mis citas

**Fuera de alcance:** pagos, historial clínico, videoconsulta, login y registro.

**Sesión simulada.** La app arranca con Karla Sánchez con la sesión iniciada.
La variante Guest del header existe como estado del componente, sin pantalla.

**Destinos fuera de alcance.** Ayuda, Cuenta, Iniciar sesión, Crear cuenta,
Cerrar sesión y el aviso de privacidad llevan a una sola página genérica.
**Ningún `href="#"` en todo el proyecto.**

---

## 2 · Sistema

**Lectura del archivo por MCP.** El archivo tiene seis páginas: 📕 Cover ·
🎨 Foundations · 🧩 Components · 📐 Wireframes · 📱 Mobile (17 pantallas + 4
paneles) · 🖥 Desktop (15 pantallas). `get_metadata` sin `nodeId` solo lista las
páginas **ya cargadas**: Figma las carga bajo demanda, así que ese listado puede
omitir páginas enteras. Para inventariarlas, `use_figma` con
`figma.root.children` y `setCurrentPageAsync` en cada página antes de leerla.

### 2.1 Tokens

Tres colecciones en Figma, un solo modo (`Value`): no hay dark mode en diseño y
no se genera infraestructura para él. Los valores los extrae `theme-tokens` del
archivo; las decisiones de traducción están en `DESIGN.md`.

Reglas de consumo:

- **En componentes y pantallas solo se consumen roles**, nunca primitivos.
- Los roles de relleno y los de texto están separados en Figma por `scopes`.
  Ningún rol de relleno admite texto y al revés. El comentario de cada rol en
  la capa settings dice sobre qué propiedades CSS puede aplicarse.
- `color-accent` **no es interactivo**: marca momentos puntuales (hora
  seleccionada, destacado) con texto `color-text-primary` encima. El texto en
  ámbar usa `color-accent-text`.
- `color-scrim` se pinta siempre con alpha:
  `color-mix(in srgb, var(--color-scrim) 45%, transparent)`.
- `color-border` es decorativo (tarjetas, separadores); **no sirve como límite
  de un control** (2.27:1). El límite real es `color-border-strong`.
- `color-text-secondary` solo sobre `color-surface`. Sobre `color-surface-muted`
  da 4.29:1 y no pasa.

### 2.2 Tipografía

Ocho pasos. `link/md`, `link/sm`, `strike/md` y `strike/heading-sm` **no son
pasos**: son el mismo tamaño con decoración, y en código los cubren la regla
base de `a` y el estado que tacha.

| Paso | Familia | Uso |
|---|---|---|
| `display` | Fraunces SemiBold | `h1` de escritorio, título de portada |
| `heading/lg` | Fraunces SemiBold | `h1` de móvil |
| `heading/md` | Fraunces SemiBold | wordmark, `h2` de sección de Mis citas, título de hoja |
| `heading/sm` | Fraunces SemiBold | `h2` de bloque, `h3` de tarjeta, legend de sección |
| `body/md` | Inter Regular | cuerpo por defecto |
| `body/strong` | Inter Semi Bold | estado seleccionado, término, legend de grupo |
| `label` | Inter Semi Bold | etiqueta de campo, píldoras, recuentos |
| `caption` | Inter Regular | mensajes de campo, meta, ayuda |

- Mínimo 14 px. No se usa la excepción de texto grande de WCAG en ningún par.
- Horarios y días del calendario con `font-variant-numeric: tabular-nums`.
- Fraunces es variable con eje `opsz`: en Figma el tamaño óptico iguala al
  tamaño de fuente. En código, `font-optical-sizing: auto`.

### 2.3 Iconos

**Phosphor, peso Regular, solo los 19 usados.** Los maestros están en la página
🎨 Foundations, frame `F.7 · Iconos`, normalizados: sin relleno propio, vector
enlazado a `color-text-primary`, escala proporcional, rejilla 256.

Extraerlos por MCP, no exportarlos a mano. Van a `src/assets/icons/` como `.svg`
crudos (fuente de verdad, versionada) y se consumen desde un componente `Icon`
que inline los paths.

Lista cerrada:

`caret-down` · `caret-left` · `caret-right` · `caret-up` · `check` ·
`check-circle` · `x` · `x-circle` · `warning-circle` · `info` · `map-pin` ·
`calendar-blank` · `calendar-check` · `calendar-dots` · `clock` · `hourglass` ·
`sliders-horizontal` · `magnifying-glass` · `user`

Reglas: 20 px junto a texto de 16; 24 px en la barra inferior y en los botones
de icono. El color se hereda del texto que acompañan (`currentColor`). Todos
son **decorativos**: `aria-hidden="true"` y `focusable="false"`. El nombre
accesible lo da el texto o el `aria-label` del control.

Un icono que debe centrarse en la primera línea de un texto que puede partir va
en una ranura de 20 × 24 (`block-size: 1lh` en código).

---

## 3 · Reglas transversales

### 3.1 Foco

Un único anillo para todo el sistema: `color-focus-ring`, 2 px, desfase 2 px.
Se mide contra el fondo real que lo rodea.

- El radio del anillo es el del control + 4 (10 sobre `radius-sm`).
- `outline-offset: -4px` dentro del header, en la barra inferior y en los ítems
  del menú de cuenta.
- En `UI/Time Slot` seleccionada el anillo cae sobre la superficie, no sobre el
  ámbar (6.02:1 frente a 2.09:1): el desfase positivo **no se reduce** ahí.
- `outline`, nunca `box-shadow`: el outline sobrevive en `forced-colors`.

### 3.2 Modo de alto contraste

- Un borde real va en el modelo `border-box`. Una variante sin borde visible
  lleva `border: 1px solid transparent`, que conserva el contorno en
  `forced-colors`.
- Un indicador superpuesto (barra de pestaña actual, `::after`,
  `box-shadow: inset`) no entra en el layout y en reposo no existe.
- Ningún estado se comunica solo con color. Ocupado o lleno = borde punteado +
  tachado. Seleccionado = color + borde + glifo + peso.

### 3.3 Estados y disponibilidad

- **Sin variante Disabled en ningún componente.** Los controles no disponibles
  conservan el foco con `aria-disabled="true"`: saber qué está ocupado es
  información.
- El envío **nunca se deshabilita**. La validación es al enviar.
- Estados documentados en el kit: Default · Hover · Focus.

### 3.4 Formularios

- Validación al enviar.
- Resumen de errores que recibe el foco, con un enlace por campo.
- `aria-invalid` + `aria-describedby` en cada campo con error.
- El placeholder solo muestra un ejemplo: todo requisito o formato va en el
  mensaje. En un select, el vacío es la opción real
  `<option value="">Elige una opción</option>`.
- Etiqueta de campo siempre visible, encima del control.

### 3.5 Layout

- **Patrón aside fijo + principal fluido.** Aside 320, gap 32. Sin retícula de
  12 columnas. La dirección la decide la función: a la derecha el aside de
  contexto o resumen; a la izquierda el que actúa sobre la lista (filtros),
  porque va antes que los resultados en el orden de lectura y del DOM.
- Contenedor de 1200 centrado.
- Dentro de la columna fluida, los bloques son fluidos: la medida de línea y los
  campos cortos se limitan con `max-inline-size` (en `ch` para texto).
- `min-block-size: 100dvh` en el cuerpo y `flex: 1` en `main`: toda pantalla
  ocupa al menos el viewport, con el contenido alineado arriba.
- Grid para la estructura de página, flex para cada caja.
- Los componentes se adaptan a su contenedor, no al viewport. Umbrales en
  `DESIGN.md`.

### 3.6 Jerarquía de acciones

- Acciones equivalentes llevan la misma jerarquía.
- **Ningún Primary dentro de una lista.** El estado lo llevan copy, icono, peso
  y etiqueta, no el estilo del botón.
- El rojo se reserva al diálogo destructivo, no a su disparador.
- En un diálogo destructivo el foco inicial va en la opción segura y el botón
  destructivo nombra la acción.
- Una acción de bloque en ancho completo es patrón móvil; en escritorio va en
  ancho intrínseco.

### 3.7 Encabezados

Cada vista tiene un `h1`. La columna de resultados tiene siempre un `h2`: con
lista, «Resultados» visualmente oculto y los nombres de tarjeta en `h3`; sin
resultados, el título del estado vacío.

---

## 4 · Componentes

34 componentes. Cada uno tiene su descripción completa en el archivo de Figma
(`node.description`), legible por MCP — cuando falte un detalle de anatomía,
está ahí. Aquí van las decisiones que el código debe respetar.

### 4.1 Acciones

**`UI/Button`** — `Style` (Primary / Secondary / Destructive) × `State`.
Primary: `color-action` + `color-on-action`. Secondary: `color-surface`, borde
`color-border-strong`, texto `color-text-primary`. Destructive: `color-error` +
`color-on-action`, **solo en el diálogo**. Ranuras de icono inicial y final
opcionales, 20 px, mismo rol que la etiqueta. Alto 50 por construcción:
borde 1 + 12 + interlineado 24 + 12 + borde 1.

**`UI/Icon Button`** — 48 × 48, icono de 24 centrado en tinta, sin borde
visible, `radius-sm`, hover `color-action-subtle`, anillo con el desfase
general (2 px) y radio 10.
Nombre accesible con `aria-label`. Solo variante Ghost.

**`UI/Link`** — `link/md` en `color-text-link`, hover a `color-text-primary`,
padding vertical 12 y lateral 0, anillo con radio 10. Siempre subrayado.

**`UI/Back Link`** — igual que `UI/Link` más `caret-left`. Un retroceso siempre
es Back Link, no Link. Alto 48, padding lateral 0 para alinear con la columna.

### 4.2 Formulario

**`UI/Field/Text`** y **`UI/Field/Select`** — ejes `Content` (Empty / Filled) ×
`State` (Default / Hover / Focus / Error). Props `label`, `placeholder`,
`value`, `message`, `showMessage`.

- **Tamaño intrínseco, sin alto fijo ni mínimo.** Borde 1 + 12 + 24 + 12 +
  borde 1 = 50. Padding horizontal 16 (`space-4`).
- Borde en reposo `color-border-strong`; hover `color-action`.
- Error: borde 2 `color-error`, el padding se compensa restando 1 px,
  `warning-circle` de 20 dentro del control (antes del chevron en el select) y
  mensaje en `color-error-text`.
- Chevron `caret-down` de 20.
- Sin eje de plataforma: en móvil la instancia va a ancho completo.

**`UI/Checkbox`** — `Checked` × `State`, Error solo sin marcar.
**`UI/Radio`** — `Selected` × `State`, sin Error.

- Fila de alto intrínseco: padding vertical 12 y gap 12 → **48 en las dos
  plataformas**, también en los filtros de escritorio. Toda la fila es área de
  clic.
- Control de forma 24 × 24 con borde 2 incluido, alineado arriba.
- Casilla marcada: `color-action` con `check` de 20 en `color-on-action` y label
  en `body/strong` — igual que el radio seleccionado, porque es el mismo estado
  en un mismo panel.
- El error de la casilla va en color, icono y texto en la línea del mensaje: el
  borde ya mide 2 en reposo.
- Todo grupo de radios parte de una opción seleccionada; en filtros, una opción
  neutra («Cualquier fecha»).

**`UI/Legend`** — `Level` (Section / Group), prop `help` opcional. Section:
`heading/sm`, separación con el contenido 16. Group: `body/strong`, 4 hasta la
primera fila y filas sin separación.

**El fieldset es un patrón de pantalla, no un componente**: la legend y los
controles dentro de un `fieldset`.

### 4.3 Navegación

**`UI/Header/Desktop`** — `Session` (Guest / Signed-in). Alto 82, contenedor a
1200. Los enlaces ocupan todo el alto y su barra sustituye al borde inferior del
header. Guest: «Iniciar sesión» Secondary + «Crear cuenta» Primary. Signed-in:
botón Secondary con el nombre y `caret-down` que abre `UI/Menu`.

**`UI/Header/Mobile`** — alto 64, wordmark + «Ayuda».

**`UI/Nav Link`** — el actual lleva `body/strong`, tinta y barra de 2 px
`color-action` (tres señales + `aria-current="page"`); el resto `body/md` y
`color-text-secondary`, sin barra; en hover, barra `color-border`.

**`UI/Nav Item`** y **`UI/Bottom Nav`** — barra inferior de tres destinos:
Especialistas (`magnifying-glass`), Mis citas (`calendar-check`), Cuenta
(`user`). Item de alto 64: 8 + icono 24 + 4 + 20 + 8. Actual: label en tinta,
icono en tinta, barra **superior** de 2 px `color-action` y `aria-current`.
En código, `nav > ul > li > a`, fija al pie con `safe-area-inset-bottom` y
reserva de alto.

**`UI/Breadcrumb`** — dos variantes, `Levels=3` y `Levels=2`. Enlaces en
`link/sm` y `color-text-link`; el actual en `label` y tinta con `aria-current`;
separador «/» decorativo.

- **La búsqueda es la portada.** `/` es Especialistas y el wordmark apunta ahí.
  No existe el nivel «Inicio».
- **Sin breadcrumb en los destinos de primer nivel** (Búsqueda, Mis citas).
- Un valor de filtro no es un nivel de jerarquía: con dos especialidades
  marcadas, «Cardiología» mentiría.
- En móvil no hay breadcrumb: la barra inferior marca la ubicación. En su lugar,
  `UI/Back Link` donde la vista cuelga de otra.

**`UI/Menu`** y **`UI/Menu Item`** — disclosure, **no `role="menu"`**. Popover
no modal. 240 de ancho, dos ítems («Cuenta», «Cerrar sesión»), borde
`color-border-strong` (su único límite: no hay sombras en el sistema),
`radius-md`. Alineado a la derecha del disparador y 4 px por debajo. Al abrirse,
el caret del disparador pasa a `caret-up`.

**`UI/Step`** — `State` (Done / Current / Upcoming), props `number` y `label`.
Marcador de 24 con borde 2. Done relleno con check; Current con borde
`color-action` y `label`; Upcoming con `color-border-strong` y `caption`
secundario. La fila es patrón de pantalla: `ol` con `aria-current="step"`.

### 4.4 Búsqueda y resultados

**`UI/Result Card`** — `Layout` (Row / Stacked) × `State` (Available / Full /
Loading). La tarjeta **no es interactiva**, solo su CTA.

- Row: avatar 64 + cuerpo fluido con `Summary` (nombre en `heading/sm`,
  especialidad en `body/md`; meta con `map-pin` + ubicación en `caption`
  secundario y etiqueta de modalidad) y `Footer` (disponibilidad + CTA de 200
  fijo, con centros compartidos).
- Stacked: avatar 48 junto al encabezado, meta y footer apilados, CTA a ancho
  completo.
- Tarjeta `color-surface`, borde `color-border` decorativo, `radius-md`, sin
  sombra.
- Disponibilidad: Available = `calendar-check` + `body/strong` en tinta;
  Full = `calendar-blank` + `body/md` en `color-text-secondary`.
- **Los dos CTA en Secondary** («Ver horarios» como `<a>`, «Avisarme» como
  `<button>`), por la regla de lista.
- `Loading` tiene la misma geometría que `Available`: la llegada de datos no
  desplaza la lista.
- `text-wrap: pretty` en nombre, especialidad y ubicación.
- Avatar: foto con la inicial como respaldo. `<img alt="">` decorativa y
  `onerror` que vuelve a la inicial.

**`UI/Pagination`** y **`UI/Page Link`** (escritorio) — 9 páginas, 34 resultados
a 4 por página. Truncado: primera, última, actual y vecinas, «…» en los saltos.
«Anterior» se omite en la primera página y «Siguiente» en la última — **sin
variante no disponible**: un `aria-disabled` se vería activo. Sin resumen
propio: el recuento vive en la cabecera de resultados, que es la región
`aria-live`. Page Link no actual: `link/md`, sin relleno ni trazo; actual:
relleno y borde `color-action`, `body/strong`, `aria-current="page"`.

**`UI/Load More`** (móvil) — `Progress` (Partial / Complete). Partial: recuento
en `caption` + botón Secondary a ancho completo «Ver más especialistas»
(etiqueta estable). Complete: «Has visto los 34 especialistas». Al cargar, 4
tarjetas en `Loading` al final y el foco pasa al nombre de la primera nueva.

**`UI/Filter Trigger`** (móvil) — anatomía de Secondary, `sliders-horizontal` de
20, etiqueta fija «Filtrar y ordenar» y contador en píldora `color-action`.
`<button aria-haspopup="dialog">`, nombre completo con texto oculto («Filtrar y
ordenar, 1 filtro aplicado») y el número visible `aria-hidden`. El contador
cuenta filtros, no el orden, y se oculta si no hay ninguno.

### 4.5 Fecha y hora

**`UI/Time Slot`** — `Availability` (Available / Full) × `Selected` × `State`.
Alto 50, ancho fluido, contenido centrado. Available con borde
`color-border-strong`, hover `color-action-subtle` + borde `color-action`.
Selected: `color-accent`, borde 2 `color-action`, `check` de 20, `body/strong`.
Full: punteado (`4 3`) con `strike/md` secundario.

**`UI/Calendar Day`** — `Availability` (Available / Full / Past / Blank) ×
`Selected` × `State`. Props `date` y `showToday` (punto de 4 bajo el número).
Available sin borde visible. Full punteado y tachado, **seleccionable**. Past en
`body/md` secundario, sin borde ni hover. Blank es espaciador.

**`UI/Calendar`** — navegación con dos `UI/Icon Button` (`caret-left` /
`caret-right`), mes en `heading/sm`, cabecera L–D en `caption`, **siempre 6
filas** (alto estable) y leyenda «Sin horarios» / «Hoy» decorativa.

**`UI/Day Chip`** — la semana entera en 7 columnas, **sin scroll horizontal**.
Alto 62, `caption` + `body/strong`, con borde visible porque es un control
suelto. Sin recuento en el chip: el recuento va en el subtítulo y en el nombre
accesible, que empieza por el texto visible (criterio 2.5.3).

**Seleccionabilidad**, regla del sistema:

| Elemento | Comportamiento |
|---|---|
| Día lleno (tira y calendario) | seleccionable, lleva al estado sin horarios, **sin** `aria-disabled` |
| Hora llena | no seleccionable, enfocable, `aria-disabled="true"` |
| Día pasado | fuera de rango (`minValue` = hoy), **no** enfocable |

**Límite de rango:** en la semana de hoy se omite «Semana anterior», y en el mes
de `minValue`, «Mes anterior». El control de avance conserva su sitio. Mismo
criterio que la paginación.

**`UI/Booking Bar`** (móvil) — `Selection` (Chosen / None / Missing). Barra de
74 con borde superior. Resumen fluido + botón Primary intrínseco. `clock` en
Chosen; `warning-circle` + `color-error-text` en Missing. **La etiqueta del
envío la pone la pantalla**: «Continuar» en la reserva, «Confirmar hora» en la
reprogramación. Techo medido: con un botón de 167 el resumen queda en 160, el
mínimo que necesita.

### 4.6 Identidad y estado

**`UI/Avatar`** — `Size` (Small 48 / Medium 64 / Large 96), props `initial` y
`showPhoto`.

**`UI/Tag`** — etiqueta de modalidad de consulta. Píldora de 30. **Su semántica
es esa y no se presta para otra cosa.**

**`UI/Status Tag`** — `Status` (Confirmed / Pending / Past / Cancelled), sin
props: etiqueta y glifo portan el estado.

| Estado | Glifo | Superficie | Borde | Texto |
|---|---|---|---|---|
| Confirmed | `check-circle` | `color-success-surface` | `color-success` | `color-success-text` |
| Pending | `hourglass` | `color-warning-surface` | `color-warning` | `color-warning-text` |
| Past | `check` | `color-surface-muted` | `color-border-strong` | tinta |
| Cancelled | `x-circle` | `color-surface` | `color-border-strong` punteado | secundario |

**`UI/Notice`** — `Tone` (Success / Error / Info), props `title`, `body`,
`showAction`, `showDismiss`, `icon`.

- Anatomía: ranura de icono 20 × 24 · contenido (título en `body/strong` con el
  color del tono + cuerpo en `body/md` y tinta) · acción opcional (`UI/Link`) ·
  cierre opcional (`UI/Icon Button`). Padding 16, `radius-md`, borde 1 del tono,
  relleno de la superficie del tono.
- **Info no es un estado, es la voz por defecto del producto.** Su tono es el
  neutro y no estrena ningún rol: relleno `color-surface-muted`, borde
  `color-border-strong`, icono y título en tinta.
- En código, **o foco o región viva, nunca las dos**: moverle el foco y además
  anunciarlo lee el aviso dos veces.
  - Cuando el disparador desaparece (cierre del diálogo de cancelar), el foco
    pasa al título del aviso y el aviso va **sin `role`**: el foco entrega el
    mensaje.
  - Cuando el aviso aparece sin mover el foco, lleva su `role`: Success
    `role="status"`, Error `role="alert"`.
  - **Info no lleva `role`, no recibe foco y no se anuncia** — es contenido
    estático.
- Info nunca lleva cierre ni acción, y su título es nominal, sin verbo de
  resultado.
- El glifo de Info es contextual (por ejemplo `calendar-check` en la placa de
  reprogramación); los de Success y Error portan el tono y no se cambian.

### 4.7 Citas y diálogos

**`UI/Appointment Card`** — `Layout` (Stacked / Row) × `Status`. Props `when`,
`name`, `specialty`, `location`, `pendingNote`.

- Anatomía: cabecera (`when` como `h3` en `heading/sm`, o tachado y secundario
  en Cancelled · status tag · nota solo en Pending) · datos (quién + lugar) ·
  acciones, **todas Secondary**.
- Acciones por estado: Confirmed «Reprogramar» + «Cancelar cita»; Pending
  «Cancelar cita»; Past «Agendar seguimiento»; Cancelled «Agendar de nuevo».
- Una pendiente se cancela pero no se reprograma.
- «Agendar seguimiento» y «Agendar de nuevo» llevan al perfil de ese médico.
- Stacked: acciones apiladas (a dos columnas «Cancelar cita» partiría).

**`UI/Dialog`** — `Layout` (Stacked 343 / Row 480), props `title` y `body`, con
los dos botones expuestos. `color-surface`, `radius-md`, padding y gap 24, sin
trazo visible (`border: 1px solid transparent`). Stacked: botones apilados a
ancho completo con «Mantener» arriba. Row: botones intrínsecos a la derecha.

Diálogos sobre pantallas largas: velo al 45 %, diálogo centrado, ancho fluido
con margen de 16 en móvil y 480 en escritorio.

---

## 5 · Vistas

### 5.1 Vista 1 · Búsqueda de especialista

**Estados:** lista con resultados · hoja de filtros (móvil) · vacío · carga ·
aviso activado.

**Esqueleto móvil:** header · main (padding 24/16/32/16, gap 32) · barra
inferior. Título de página en `heading/lg` + subtítulo `body/md` secundario.
Formulario de búsqueda apilado: campo de texto, select de ubicación y «Buscar»
Primary, los tres a ancho completo. Resultados: cabecera (disparador de filtros
+ recuento en `label` tinta, separados, **región `aria-live`**) · lista ·
`UI/Load More`.

**Esqueleto escritorio:** header Signed-in · main · contenedor de 1200.
Encabezado de página: breadcrumb `Levels=2` + título en `display` + subtítulo.
Cuerpo: aside `Filtros` de 320 **a la izquierda** + resultados fluidos.
Cabecera de resultados con el recuento y «Ordenar por» (`UI/Field/Select` a
288) compartiendo línea base. Paginación alineada a la izquierda. Sin pie de
página.

**Filtros:**

- En escritorio se aplican al marcarlos, **sin botón de aplicar**. El recuento
  es la región `aria-live` que anuncia el total. «Limpiar filtros» devuelve cada
  grupo a su opción inicial y deja el foco en el botón.
- En móvil, hoja «Filtrar y ordenar» a pantalla completa (su contenido no cabe
  en el viewport): cabecera fija de 64 con título y botón de cierre, cuerpo con
  scroll, pie fijo con «Limpiar» Secondary intrínseco y «Ver 34 resultados»
  Primary fluido.
- Grupos: Ordenar por · Especialidad · Modalidad · Disponibilidad. En escritorio
  «Ordenar por» no va en el aside, va en la cabecera de resultados.

**Vacío:** una consulta nueva limpia los filtros, así que el vacío lo causa solo
la consulta y el copy lo nombra. Bloque en el sitio de la lista con el marco de
la tarjeta, alineado a la izquierda: placa de 48 `color-surface-muted` con
`magnifying-glass`, título `heading/sm` (`h2`), ayuda `body/md` secundaria y
«Ver todos los especialistas» Secondary (enlace a la búsqueda sin consulta).

**Carga:** cuatro tarjetas `Loading` (el tamaño de página), sin paginación ni
«Ver más» porque el total no se conoce; el disparador conserva su contador y el
recuento dice «Buscando…», el mismo texto que anuncia la región `aria-live`. En
escritorio se conservan el orden y los filtros: lo que ya se sabe no parpadea.

**Datos de la lista** (orden «Disponibilidad más próxima», filtro Especialidad =
Cardiología, de ahí el «1» del disparador; «34 resultados», «Mostrando 4 de 34
especialistas»):

1. Mariana — hoy, 19:15 · Clínica Condesa · «Presencial y videoconsulta»
2. Elena Ruiz Arellano — mar 24 abr, 10:30 · Clínica Roma Norte (con foto)
3. Joaquín — jue 26 abr · **sin foto**, para mostrar el respaldo de inicial
4. Rodrigo — **lleno**

### 5.2 Vista 2 · Perfil y selección de horario

La pieza que vende el proyecto.

**Modelo en código:**

| Pieza | Implementación |
|---|---|
| Tira de días | radios nativos en `fieldset` con legend visible «Elige fecha» |
| Calendario | rejilla de fecha APG — React Aria `Calendar` |
| Horas | `listbox` de selección única con un `group` por franja — React Aria `ListBox` con `layout="grid"`; las flechas mueven y no seleccionan |
| Subtítulo de hora | `role="status"` |

**Móvil:** header · main · `UI/Booking Bar`. **Sin barra inferior**: es una
tarea enfocada y el pie lo ocupa la barra de reserva. `UI/Back Link`
«Especialistas» antes del `h1`.

Perfil: avatar Medium y nombre (`h1`, `heading/lg`) en la misma fila;
especialidad, ubicación y etiqueta de modalidad debajo a todo el ancho.

Fecha: cabecera con legend Section «Elige fecha» + «Ver mes completo»
(Secondary con `calendar-dots`, `aria-haspopup="dialog"`). Debajo, navegación de
semana con la etiqueta a la izquierda y los botones a la derecha, y la tira.
En código, `<legend><h2>Elige fecha</h2></legend>` para que las dos secciones
sean `h2`.

Horas: cabecera («Elige hora» `heading/sm` + estado `body/md` secundario) y un
grupo por franja con etiqueta en `body/strong` y rejilla de filas de 3.

**Calendario en móvil:** hoja inferior (no pantalla completa), sin marco propio,
`radius-md` arriba, con cabecera, cuerpo y pie («Ver horarios del martes 24»
Primary a ancho completo). Sin asa de arrastre: no hay gesto implementado.

**Escritorio:** perfil en la cabecera (avatar Large + `h1` en `display` +
especialidad + meta), tarjeta de pantalla con el selector (columna de calendario
de 360 fija + horas fluidas, filas de 3) y **sección** derecha «Tu cita» con la
cita elegida, duración, lugar, política y «Continuar». En código es una
`section` con `aria-labelledby` **dentro del `form`**, no un `aside`: contiene
el envío. La tarjeta apila calendario y horas cuando su interior se estrecha.

**«Continuar»:** siempre Primary activo con validación al enviar. Sin hora, la
barra pasa a `Missing`, el foco va al primer accionable de la sección de horas y
`aria-describedby` apunta al mensaje.

**Estado sin horarios:** selecciona el día lleno. Copy: «La agenda de hoy está
completa» / «El horario libre más cercano es mañana, martes 24, a las 10:30».
Bloque con placa `color-surface-muted` y `calendar-blank`, título `h3`, ayuda y
**dos acciones Secondary**: «Ver horarios del martes 24» (`<button>`: marca el
día y lleva el foco a la primera hora libre) y «Avisarme si se libera un hueco».
El subtítulo visible dice solo la fecha; la región `role="status"` anuncia
«Lunes 23 de abril · sin horarios libres» con un sufijo oculto.

**Pantalla de confirmación previa (móvil):** equivalente del aside de
escritorio. Back Link «Dra. Ruiz» + pasos + `h1` «Confirma tu cita» + tarjeta de
resumen (quién + `dl` con Cuándo `calendar-check`, Duración `clock`, Dónde
`map-pin`) + «Cambiar fecha u hora» Secondary + aviso Info de política + pie con
«Continuar con tus datos» Primary y la nota «Todavía no se reserva nada»
(`aria-describedby`).

**Datos (año 2029, hoy lunes 23 de abril):**

- Tira lun 23 – dom 29. El 23 y el 29 llenos; el 24 seleccionado.
- Franjas del 24 — Mañana: 09:00, 09:30 y 10:00 llenas, **10:30 seleccionada**,
  11:00 libre, 11:30 llena. Tarde: 16:00–17:30 libres, 18:00 y 18:30 llenas.
  Son 6 libres y la próxima cita es el 24 a las 10:30, como en la vista 1.
- Abril de 2029 empieza en domingo (6 semanas); del 1 al 22, pasados.

### 5.3 Vista 3 · Datos del paciente

**Campos:** Nombre completo y Correo llegan rellenos con los datos de Karla
(la sesión está iniciada). Teléfono y Motivo, vacíos. **Teléfono es el único
opcional**, marcado en su etiqueta, de modo que la ayuda de la legend («Todos
los campos son obligatorios salvo los marcados como opcionales») dice la verdad.

**No hay fieldset de Modalidad:** la modalidad es dato del médico, no del
paciente, y ya se ve en su etiqueta.

**Consentimiento:** el reaseguro vive en el mensaje de la casilla («Solo usamos
tus datos para esta cita») y el aviso de privacidad se alcanza con `UI/Link`
«Leer el aviso de privacidad» **antes** de la casilla: dentro de su etiqueta,
pulsarlo cambiaría el estado.

**Resumen de errores — patrón de pantalla, no componente** (el número de enlaces
varía): contenedor `color-surface` con borde 2 `color-error`, `radius-md`,
padding 16; encabezado con icono en ranura 20 × 24 + `h2` en `body/strong`
`color-error-text`; lista de `UI/Link`, uno por campo, **con el nombre del
campo, no el mensaje**. Título «Corrige 3 campos para continuar». Recibe el
foco al enviar.

Escenario de error: correo `karla@`, motivo sin elegir, privacidad sin marcar.

**Móvil:** Back Link «Tu cita» + pasos (paso 1 Done) + `h1` «Tus datos». Dos
fieldsets: «Datos del paciente» y «Antes de confirmar». Pie con «Confirmar cita»
Primary a ancho completo y la nota «Martes 24 de abril, 10:30 · Dra. Ruiz».

**Escritorio:** el médico baja al aside, así que el `h1` es «Tus datos». Columna
de formulario de 848 con el resumen de errores **sobre** la tarjeta, no dentro
(pertenece al formulario entero). Dentro de la tarjeta, **rejilla de dos
columnas**: Nombre + Correo, Teléfono + Motivo. En código, una sola rejilla con
`auto-fit` y `minmax(20rem, 1fr)` que colapsa a una columna; el orden del DOM
coincide con el visual. Las filas de casilla se quedan a una columna: son
bloques de texto, no campos. El aside lleva pasos, resumen, política y
«Confirmar cita» intrínseco con la nota «Recibirás un correo de confirmación».

**Sin «Cambiar fecha u hora» en escritorio:** el nivel «Dra. Ruiz» del
breadcrumb lleva al mismo sitio.

**Reserva fallida (estado de servidor):** si el envío pasó la validación,
Motivo está relleno («Primera consulta») y las dos casillas marcadas. Aviso
Error **sin cierre y sin acción**, sobre la tarjeta: «Esa hora ya está ocupada»
/ «Alguien reservó el martes 24 a las 10:30 mientras completabas tus datos. Tus
datos se conservan.». **El pie deja de ofrecer el envío:** «Confirmar cita» pasa
a «Elegir otra hora» Primary y la nota se retira, porque nombraba una cita que
ya no está reservada. No se rompe la regla del envío nunca deshabilitado: no hay
botón gris, hay un botón distinto. Como el disparador desaparece, el foco se
perdería: **va al título del aviso, y el aviso va sin `role`** (§4.6).

### 5.4 Vista 4 · Confirmación y mis citas

**Confirmación (móvil):** sin Back Link (la reserva ya se envió) ni barra
inferior. Pasos (Done · Done · Current) · insignia de éxito (placa
`color-success-surface` con `check` en `color-success`, **único uso de la
familia success** fuera de los avisos) · `h1` «Tu cita está reservada» + nota
con el correo. Resumen sin la fila de modalidad (la dice la etiqueta) +
«Agregar a mi calendario» Secondary (`<a download>` a un `.ics`). Aviso Info
«Qué sigue». Pie solo con «Ver mis citas» Primary.

**Confirmación (escritorio):** el resumen pasa a la columna principal y el aside
lleva pasos, «Qué sigue» y «Ver mis citas». En la confirmación la cita es el
contenido: en el aside dejaba la columna principal vacía.

**Mis citas:** destino de primer nivel, con barra inferior en móvil y pestaña
actual en el header de escritorio. **Secciones, no pestañas**: Próximas y
Pasadas (`h2` en `heading/md`), con la fecha de cada tarjeta en `h3`. Las
canceladas van en Pasadas. Próximas en orden ascendente; Pasadas, descendente.
En escritorio, tarjetas Row y `<aside>` «Agendar otra cita» — legítimo porque no
contiene envío.

**Cancelar:** diálogo destructivo con foco inicial en «Mantener mi cita». Al
cerrarse, la cita pasa a Pasadas como Cancelled, aparece un aviso Error tras el
`h1` y **el foco va al título del aviso**, no al `h3` de la tarjeta. El
subtítulo baja a «Tienes N citas próximas».

**Menú de cuenta:** popover no modal, sin velo. Ver `UI/Menu`.

**«Por confirmar» se mantiene:** la confirmación manual es del proveedor
(consultorio independiente), no de la plataforma. La tarjeta lo explica en una
línea: «El consultorio confirma en menos de 24 horas. Te avisaremos por correo».

**Plazo de 24 horas:** la cita de la Dra. Ruiz es al día siguiente, dentro del
plazo de «cancelar sin costo». Por eso el flujo de cancelación usa la cita
pendiente del Dr. Molina y **ningún texto de Mis citas promete la cancelación
gratuita**.

**Reprogramar** — modo de la vista 2, no pantalla nueva:

- **Salta la vista 3.** Los datos del paciente y el consentimiento ya existen;
  volver a pedirlos sería pedir lo que el sistema tiene y el copy de «Antes de
  confirmar» mentiría.
- Sin pasos. El envío vive en el selector y se llama **«Confirmar hora»**.
- Coste declarado: el botón es el punto de no retorno. Se compensa nombrando las
  dos fechas antes del envío. Sin diálogo: reprogramar no es destructivo.
- La pantalla cuelga de Mis citas: breadcrumb `Levels=2` «Mis citas / Dr.
  Cortés», Back Link «Mis citas» en móvil y pestaña actual «Mis citas» en
  escritorio. Las tres señales dicen lo mismo.
- Móvil: placa Info `Current Appointment` tras el encabezado, con
  `calendar-check` y el cuerpo «Miércoles 16 de mayo · 09:30. Al confirmar, esa
  hora se libera.»
- Escritorio: aside «El cambio», sin pasos, con la fila «Nueva cita» en tres
  líneas («Nueva cita» / «Jueves 17 de mayo, 17:00» / «Antes: miércoles 16 de
  mayo, 09:30»), política «Al confirmar» y acción **sin nota**.
- **El día de la cita actual no se marca en el selector:** aparece como un día
  disponible más. Lo dicen la placa y el aside.
- Datos: semana 14–20 de mayo (lun 14 y dom 20 llenos, jue 17 seleccionado);
  Mayo 2029 (31 días, empieza en martes, sin días pasados; llenos 6, 7, 9, 13,
  14, 20, 21, 23, 27 y 28). Horas del 17 — Mañana: 09:00 libre, 09:30 y 10:00
  llenas, 10:30–11:30 libres. Tarde: 16:00 llena, 16:30 libre, **17:00
  seleccionada**, 17:30 y 18:00 libres, 18:30 llena. **8 libres.**
- Mayo restituye «Semana anterior» y «Mes anterior», que abril ocultaba, y el
  calendario **oculta el ítem «Hoy» de su leyenda**.

---

## 6 · Datos

Año 2029. Hoy = **lunes 23 de abril**. Persona con sesión: **Karla Sánchez**,
`karla.sanchez@ejemplo.com`. Marca: **Salvia**.

**Citas de Karla:**

| Sección | Médico | Especialidad | Lugar | Cuándo | Estado |
|---|---|---|---|---|---|
| Próximas | Dra. Elena Ruiz Arellano | Cardiología | Clínica Roma Norte | mar 24 abr · 10:30 | Confirmada (con foto) |
| Próximas | Dr. Andrés Molina Paz | Dermatología | Consultorio Del Valle | mar 8 may · 17:00 | Por confirmar |
| Próximas | Dr. Iván Cortés Naranjo | Oftalmología | Clínica Polanco | mié 16 may · 09:30 | Confirmada (sin foto, inicial «I») |
| Pasadas | Dr. Tomás Ibarra Solís | Medicina general | Clínica Roma Norte | lun 12 mar · 09:00 | Realizada |
| Pasadas | Dra. Paula Serrano Vidal | Nutrición clínica | Consultorio Nápoles | jue 22 feb · 12:30 | Cancelada (inicial «P») |

Cinco especialidades y cuatro colonias distintas: la lista no se lee como un
duplicado de maquetación. La cita Realizada no es de la Dra. Ruiz porque
«Agendar seguimiento» con ella duplicaría la cita del 24.

Fotos de avatar: rostros generados por IA, sin bata, fondo neutro, encuadre de
cabeza y hombros, luz homogénea.

---

## 7 · Las tres piezas que no tienen frame en Figma

Su copy está cerrado; el diseño no las dibujó porque serían clones con otro
texto.

**1 · Página genérica de destinos fuera de alcance.** Título «Esta sección no
forma parte del caso de estudio» con enlace de vuelta. Destino de Ayuda, Cuenta,
Iniciar sesión, Crear cuenta, Cerrar sesión y el aviso de privacidad.

**2 · Aviso Success de reprogramación.** `UI/Notice` Tone=Success, título «Cita
reprogramada», cuerpo «Tu cita pasó al jueves 17 de mayo, 17:00.». El médico no
se nombra porque el aviso aparece sobre su propia tarjeta. El foco va a su
título y la tarjeta cambia de fecha sin salir de Próximas.

**3 · Conmutador «Avisarme» → «Te avisaremos».** El CTA de `UI/Result Card`
`State=Full` es un conmutador: `aria-pressed`, la etiqueta cambia, aparece
`check` y **el foco se queda en el botón**. El mismo conmutador gobierna
«Avisarme si se libera un hueco» en el estado sin horarios de la vista 2.
Se resuelve en el control y no con un aviso de página: un aviso dentro de un
ítem de lista habría que colocarlo lejos del control o dentro de la tarjeta.

---

## 8 · Notas de código sueltas

- «Mis citas» dentro del aviso «Qué sigue» va con espacio de no separación
  (`Mis&nbsp;citas`): es el nombre de un destino.
- `text-wrap: balance` en títulos de bloque con riesgo de palabra huérfana.
- El tachado nunca es una clase: es `text-decoration: line-through` en el
  estado que corresponde.
- El subrayado de enlace lo da la regla base `a { text-decoration: underline }`.
