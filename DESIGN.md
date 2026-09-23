# DESIGN.md · Contrato de la capa de estilos

Lo que las skills no pueden deducir por sí solas. **No define arquitectura de
carpetas, nomenclatura ni prefijos**: eso lo dicta `bemit-scss` y manda sobre
este documento.

---

## Método de estilado

SCSS con arquitectura BEMIT, mobile first con `min-width`. Estilos globales, sin
CSS Modules: el hash rompe la nomenclatura BEM, que es parte de lo que la pieza
demuestra.

Stack: React + Vite + TypeScript, `sass-embedded`. Accesibilidad compleja con
React Aria Components.

---

## Origen de los tokens

Archivo de Figma `sVVjX11h3CrCOFNybb7gL1`, accesible por MCP. Tres colecciones,
un solo modo (`Value`):

| Colección            | Contenido                                                                      |
| -------------------- | ------------------------------------------------------------------------------ |
| `Color · Primitives` | 33 primitivos, `familia/paso`                                                  |
| `Color · Roles`      | 26 roles, nombres planos `color-*`                                             |
| `Layout & Spacing`   | `space/1–7`, `radius/sm\|md\|pill`, `layout/container-width\|aside-width\|gap` |

Más 12 estilos de texto.

Traducción de nombres: `/` pasa a `-`. Los roles ya están nombrados en Figma
pensando en su custom property, así que `color-action` es `--color-action`.

---

## Decisiones de traducción (cerradas)

No se reabren al generar la capa settings.

**1 · `color-surface-elevated` no entra en código.** Alias de `neutral/50`
(#faf9f6). Ningún componente ni pantalla lo enlaza, y el sistema no tiene
elevación: cero sombras en todo el kit; el único límite de un popover es un
borde. Queda documentado en Foundations. Si algún día hace falta, vuelve con su
primitivo.

**2 · Solo entran los primitivos que algún rol consume: 20 de 33.** Los otros 13
existen únicamente en la documentación de Foundations. La rampa completa vive en
Figma; un primitivo entra a código cuando un rol lo necesita.

**3 · La escala tipográfica son 8 pasos, no 12.** `link/md`, `link/sm`,
`strike/md` y `strike/heading-sm` son el mismo paso con decoración: los cubren
la regla base de `a` y el estado que tacha. Crear tokens para ellos duplicaría
la escala con cuatro entradas que nadie puede recorrer. (`page-title` no
contradice esta decisión: es un paso derivado de dos de los 8, no un estilo
nuevo; ver «Tipografía».)

**4 · Los roles que hoy comparten valor no se fusionan.** `color-success` /
`color-success-text` (ambos `success/700`), `color-error` / `color-error-text`
(`red/500`), `color-warning-text` / `color-accent-text` (`accent/900`) y
`color-action` / `color-text-link` (`sage/700`). Distinta función, distinto
`scope`: deben poder divergir sin romper cada consumidor.

**5 · Un solo modo en Figma: no se genera infraestructura de dark mode.**
Tampoco `_themes.scss` con prefijo `t-`: no hay modos definidos en diseño.

---

## Tipografía · pares de Figma

`line-height` sin unidad. Las razones salen de estos pares, medidos en el
archivo:

| Paso          | Tamaño | Interlineado | Razón | Tracking |
| ------------- | ------ | ------------ | ----- | -------- |
| `display`     | 39     | 44           | 1.128 | −0.01em  |
| `heading/lg`  | 31     | 36           | 1.161 | −0.01em  |
| `heading/md`  | 25     | 32           | 1.28  | −0.005em |
| `heading/sm`  | 20     | 28           | 1.4   | 0        |
| `body/md`     | 16     | 24           | 1.5   | 0        |
| `body/strong` | 16     | 24           | 1.5   | 0        |
| `label`       | 14     | 20           | 1.43  | 0        |
| `caption`     | 14     | 20           | 1.43  | 0        |

Familias: Fraunces SemiBold (peso 600) en los cuatro primeros; Inter Regular
(400) y Semi Bold (600) en los cuatro últimos. Fraunces es variable con eje
`opsz`: `font-optical-sizing: auto`, que es el valor inicial y no se declara.

**Nombres de familia con sufijo.** Los tokens dicen `'Fraunces Variable'` e
`'Inter Variable'`, no `'Fraunces'` e `'Inter'`: es el nombre con el que
Fontsource registra las versiones variables (D11). La familia sin sufijo va
detrás como respaldo por si alguien la tiene instalada. No es un error de
transcripción desde Figma.

### Paso derivado `page-title`

No es un estilo de Figma. Todo `h1` de vista es `heading/lg` en móvil y
`display` en escritorio (§5.1–5.4: «Encuentra a tu especialista», el nombre
del médico, «Tus datos», «Tu cita está reservada», «Mis citas»; comprobado
por MCP en las 851 capas de texto de Mobile y las 842 de Desktop). Es el
**único** elemento que cambia de paso en su sitio: el resto de diferencias
entre páginas son componentes distintos (Back Link frente a breadcrumb, barra
inferior frente a header), y el avatar cambia de paso con su variante `Size`,
no con el breakpoint.

| Paso         | Por debajo de `lg`         | Desde `lg`              |
| ------------ | -------------------------- | ----------------------- |
| `page-title` | `heading/lg` (31/36, −1 %) | `display` (39/44, −1 %) |

El grupo `--text-page-title-*` apunta a los grupos `--text-heading-lg-*` y se
reapunta a `--text-display-*` dentro de `tools.respond-to(lg)` en
`_tokens.scss`. El componente hace `tools.text(page-title)` y no sabe nada del
breakpoint: es el uso de `@media` para «redefinir tokens por breakpoint» que
permite `bemit-scss`, y evita una media query dentro de cada componente.

### Encabezados

El `h1` de vista usa `page-title`. El resto:

`h1`–`h6` no llevan paso tipográfico en `04-elements`: el mismo elemento cambia
de paso según el contexto (`h2` es `heading/md` en las secciones de Mis citas,
`heading/sm` en un bloque y `body/strong` en el resumen de errores de la vista
3). Asignar un paso por elemento obligaría a desasignarlo en casi todos los
usos. El paso lo pone cada componente con `tools.text()` (D10).

Escala de razón 1.25 desde 16. Mínimo 14 px; la excepción de texto grande de
WCAG no se usa en ningún par.

---

## Breakpoints

**No vienen de Figma.** El archivo tiene dos plataformas (375 y 1440) y ninguna
variable de breakpoint. Estos valores están derivados de los puntos de rotura
que el diseño sí declara.

`_breakpoints.scss`:

| Nombre | Valor          | Razón                                                                                                                                                                                                                                            |
| ------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lg`   | 64rem (1024px) | Único salto de página: aparece el patrón aside + principal, el header de escritorio sustituye a la barra inferior y el contenedor se centra. En 1024 deja 624 de columna principal, con margen sobre el punto de rotura de Result Card Row (490) |

**Tokens por breakpoint: `_tokens.scss` importa `02-tools`.** Para redefinir
tokens bajo `lg` (hoy `page-title` y `--layout-column-max`) se usa `tools.respond-to(lg)`, así
que settings hace `@use '../02-tools' as tools`. Parece invertir ITCSS y no lo
hace: el orden de las capas gobierna la cascada del CSS **emitido**, no las
dependencias de compilación. `@use` es resolución de módulos en Sass, no
orden de salida; `_tokens.scss` sigue emitiendo su `:root` primero. No hay
ciclo: tools no importa `_tokens`. La alternativa, una `@media` escrita a mano
con `map.get` del mapa de breakpoints, duplicaría el criterio del breakpoint en
dos sitios, que es peor.

**Gutter de escritorio:** `space-5` (24) a cada lado del contenedor. De ahí,
con aside 320 y gap 32: **columna principal = viewport − 400** hasta que el
contenedor alcanza 1200.

**Las cuentas suponen una barra de scroll superpuesta** (móvil, macOS). Con
barra clásica (Windows, unos 15 px) el ancho útil es el mismo menos la barra: a
1024 la columna principal queda en 609, no en 624, y sigue por encima del
umbral de `result-card` (512). No se corrige nada: se declara.

---

## Tramo intermedio

Entre 640 y 1023 px el layout sigue siendo el de móvil. Sin límite, la columna
de contenido crecería con el viewport hasta 1023. La regla es una sola. El
token es el **ancho exterior** de la columna, con el gutter incluido:

| Token                 | Por debajo de `lg`                        | Desde `lg`                                                                                        |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `--layout-column-max` | 40rem (640; gutter `space-4`, 608 útiles) | `calc(var(--layout-container-width) + 2 * var(--space-5))` (1248; gutter `space-5`, 1200 útiles) |

La columna (`o-wrapper`) lleva `max-inline-size: var(--layout-column-max)`,
`margin-inline: auto` y el gutter por dentro (`border-box`): `space-4` bajo
`lg` y `space-5` desde `lg`. Así el contenido llega a 1200 en escritorio, como
exige § Breakpoints. Por debajo de 640 llena el ancho, como en móvil; por
encima se detiene y se centra.
El token se redefine en `_tokens.scss` con `tools.respond-to(lg)`, con el mismo
patrón que `page-title`: ningún componente lleva media query.

**40rem no viene de Figma: es un valor derivado.** Con el gutter móvil
`space-4` a cada lado deja 608 útiles, por encima de los umbrales de
`result-card` (512) y `appointment-card` (544, provisional). Las tarjetas pasan
a Row dentro del tramo, en cuanto su `li` alcanza el umbral (desde 544 de
viewport en resultados), sin esperar a `lg`. El umbral de `dialog` se mide
sobre el velo y no depende de la columna.

**Chrome que se queda en versión móvil hasta `lg`:**

| Pieza                                   | Razón                                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Barra inferior (con `UI/Header/Mobile`) | Patrón legítimo en tablet. Las pestañas del header de escritorio necesitan su ancho                                                           |
| Hoja «Filtrar y ordenar»                | El aside de 320 dejaría la columna principal en 368 a 768 de viewport (viewport − 400), por debajo del umbral de la tarjeta: peor que la hoja |
| `UI/Booking Bar`                        | Misma cuenta: la sección «Tu cita» de 320 no cabe con holgura                                                                                 |

Estos números salen de la misma cuenta que fija `lg` en 1024: por eso el
chrome cambia ahí y no antes. Es coherente con D7, porque los tres cambian de
control o de flujo y se renderiza solo uno.

**Las piezas a sangre alinean con la columna.** `UI/Header/Mobile`, la barra
inferior, `UI/Booking Bar`, el `Action Bar` de 02.4 y de la vista 3, y las
hojas (filtros y calendario) conservan el fondo y el borde a todo el ancho del
viewport. Su interior **reutiliza `o-wrapper`**: ninguna redeclara tope ni
gutter.

| Sin la regla, a 1023                                                                 | Con la regla                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| Wordmark, «Ayuda», ítems de la barra y «Continuar» a 16 del borde; contenido a ≈ 191 | Todo arranca en el mismo eje que el `h1`      |
| Tres ítems de la barra de ≈ 341 cada uno                                             | Tres ítems de ≈ 203, dentro de los 608 útiles |
| Calendario de la hoja con celdas de ≈ 140                                            | Celdas de ≈ 83, sin que la rejilla se deforme |

Razón: el fondo es superficie y el interior es contenido. Con la regla, la
superficie llega al borde y el contenido comparte eje. Por debajo de 640 la
regla no cambia nada, porque el tope no se alcanza. Desde `lg` no aplica: estas
piezas dejan de renderizarse, salvo el header, que ya se alinea con
`--layout-container-width`.

**Coste declarado:** en el tramo, las barras fijas muestran fondo vacío a ambos
lados de su contenido. Es intencional: una barra que se estrechase con su
interior dejaría el contenido que pasa por detrás visible bajo sus bordes.

---

## Contenedores

**Regla: el contenedor se declara siempre en el elemento que aporta el ancho,
nunca en el componente que cambia de forma.** El ancho de un componente que se
reorganiza es el resultado de esa decisión, no su causa: si él mismo fuese el
contenedor, su padding y su propia variante falsearían la medida (una Row de
480 con padding 24 mide 430 de contenido y nunca alcanzaría su umbral). Con el
contenedor en el padre, el umbral es siempre un ancho exterior, sin aritmética
de padding.

`_containers.scss`:

| Nombre             | Contenedor                                         | Umbral      | Qué cambia                          | Razón                                                                        |
| ------------------ | -------------------------------------------------- | ----------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `result-card`      | el `li` de la lista de resultados                  | 32rem (512) | Stacked pasa a Row                  | Justo sobre el punto de rotura medido de Row (490). El `li` no tiene padding |
| `appointment-card` | el `li` de su sección                              | 34rem (544) | Stacked pasa a Row                  | **Provisional:** verificar al construir el componente                        |
| `dialog`           | el velo                                            | 32rem (512) | Stacked pasa a Row                  | 480 de la variante Row + 16 + 16 de margen: es cuando cabe                   |
| `slot-picker`      | el elemento que da ancho a la tarjeta del selector | 44rem       | La tarjeta apila calendario y horas | —                                                                            |

---

## Constantes del sistema sin variable en Figma

Medidas en los maestros, no son tokens del archivo:

- Trazo normal 1px; trazo fuerte 2px (campo en error, marcador de casilla y
  radio).
- **Anillo de foco, uno solo para todo el sistema:** 2px de grosor, 2px de
  desfase, radio = radio del control + 4 (10 sobre `radius/sm`). Desfase −4
  dentro del header, en la barra inferior y en los ítems del menú de cuenta.
- Alto de control de texto: 50, por construcción (borde 1 + 12 + interlineado
  24 + 12 + borde 1). No es un alto fijo: es el resultado del padding.
- Fila de casilla y radio: 48 en las dos plataformas, también por padding.
- Velo de hojas y diálogos: `color-scrim` al 45 %
  (`color-mix(in srgb, var(--color-scrim) 45%, transparent)`), nunca en la
  variable.

---

## Controles con icono y etiqueta

**`flex-wrap: wrap` en todo control que pone iconos y etiqueta en fila: los
iconos bajan de línea antes de que la etiqueta parta palabras.** Con el texto
ampliado, el padding y los iconos crecen también (van en rem) y dejan a la
etiqueta sin ancho: al 200 % a 320, un botón con dos iconos le dejaba 46 px y
«Ver mes completo» salía letra a letra. Con la regla solo parte una palabra
más ancha que el interior del control entero. A tamaño normal no cambia nada:
todo cabe en una línea.

Hoy aplica a `UI/Button` y `UI/Back Link`; todo componente nuevo con icono y
etiqueta en fila la hereda.

---

## React Aria Components

- **Siempre se le pasa `className`.** Sin él, RAC emite sus propias clases
  (`react-aria-Button`) y el markup deja de ser BEMIT.
- RAC expone atributos `data-*` además del ARIA. Cuando hay equivalente ARIA
  real (`aria-selected`, `aria-current`, `aria-disabled`, `aria-pressed`,
  `aria-expanded`), **se estila el ARIA**, según la regla de la skill. Los
  `data-*` sin equivalente (`data-hovered`, `data-focus-visible`) sustituyen a
  un `is-`/`has-` inventado.
- RAC no aporta un solo estilo: la apariencia entera sale del SCSS.

---

## Contraste

Los 25 pares en uso ya pasan AA, verificados por script contra las variables del
archivo y documentados en Foundations `F.3`. **No son hallazgos nuevos.**

Mínimo en texto: 4.82:1 (éxito sobre su superficie). Mínimo en límites y
marcadores: 3.73:1 (marcador de aviso).

Seis pares están documentados como **«No usar»**, y el código no debe
reintroducirlos:

| Par                                                | Ratio |
| -------------------------------------------------- | ----- |
| Blanco sobre `color-accent`                        | 2.88  |
| `color-accent` como color de texto                 | 2.88  |
| `success/500` como color de texto sobre blanco     | 3.37  |
| `color-text-secondary` sobre `color-surface-muted` | 4.29  |
| `color-border` como límite de un control           | 2.27  |
| Anillo de foco sobre la hora seleccionada          | 2.09  |

---

## Decisiones de arquitectura (D1–D14)

Tomadas en la planeación de la fase de código. No se reabren sin acuerdo
explícito.

**D1 · Rutas y estado.** Las 32 pantallas son estados de 8 rutas:

| Ruta                             | Vista                            | Estado dentro de la ruta                                           |
| -------------------------------- | -------------------------------- | ------------------------------------------------------------------ |
| `/`                              | V1 · Búsqueda                    | Carga, vacío, hoja de filtros, conmutador «Avisarme»               |
| `/especialistas/:slug`           | V2 · reserva                     | Sin horarios, Missing, hoja del calendario                         |
| `/especialistas/:slug/confirmar` | V2 · confirmación previa (móvil) | —                                                                  |
| `/especialistas/:slug/datos`     | V3                               | Errores, reserva fallida                                           |
| `/citas/:id/confirmada`          | V4 · confirmación                | —                                                                  |
| `/mis-citas`                     | V4 · Mis citas                   | Diálogo, aviso de cancelada, aviso de reprogramada, menú de cuenta |
| `/mis-citas/:id/reprogramar`     | V2 · reprogramación              | Los mismos que la V2                                               |
| `/fuera-de-alcance`              | Página genérica                  | —                                                                  |

Parámetros en la URL: en V1, `q`, `ubicacion`, filtros, `orden` y `pagina`;
de V2 a V4, `fecha` y `hora`. Razón: varias piezas del diseño son `<a>` y
necesitan un `href` real (Page Link, «Ver todos los especialistas», el Back
Link «Tu cita», «Cambiar fecha u hora»), y con la selección en la URL cada
página aguanta una recarga sin almacén global.

La paginación y «Ver más» comparten `pagina`: en escritorio se muestra el
corte de esa página, en móvil los resultados de 1 a `pagina × 4`. Así un
cambio de tamaño no pierde la posición.

`/especialistas/:slug/confirmar` existe en cualquier viewport, pero solo el
«Continuar» de móvil lleva a ella.

Hasta la fase 5, `/` redirige a `/kit`.

**D2 · Estado del selector de la vista 2.** Un reducer `useSlotPicker` en la
composición, con cuatro valores: `{ date, time, visibleWeek, visibleMonth }`.
La tira, el calendario y el ListBox son vistas controladas de ese estado; el
texto de estado, «día lleno» y el estado de la Booking Bar se derivan. Reglas:

- Cambiar de fecha pone `time` a `null`: una hora pertenece a su día.
- Navegar de semana no cambia la fecha.
- La hoja del calendario tiene su propio borrador, que solo se aplica con «Ver
  horarios del martes 24». Cerrarla lo descarta.

Fechas con `CalendarDate` de `@internationalized/date`, declarado como
dependencia directa. Nunca `DateValue` (ver `spike-rac.md` § 2.5).

**D3 · Un solo SlotPicker, sin prop de modo.** Dos vistas lo componen. Todo lo
que cambia entre reserva y reprogramación está fuera del selector: copy y
etiqueta del envío, aside y pasos, breadcrumb, placa Info, destino tras el
envío. Lo que cambia dentro se deriva de los datos, no de un modo: el «Hoy» de
la leyenda aparece solo si el mes visible contiene hoy; «Semana anterior» y
«Mes anterior» dependen de `minValue`. Un `mode="reschedule"` metería copy de
vista dentro de un componente del kit.

**D4 · Datos de disponibilidad.** Un registro por médico,
`Record<ISODate, Slot[]>`. Los días declarados en §5.2 y §5.4 van literales.
«Lleno» se deriva de `slots.every(s => !s.available)` y nunca es un campo
propio, así tira, calendario y lista no pueden contradecirse.

Reloj: `TODAY` y `NOW` en `src/data/clock.ts`; `new Date()` y `today()`
prohibidos por lint. **`NOW` = lunes 23 de abril de 2029, 09:00** — anterior
al 19:15 de Mariana y al 10:30 de la cita de Ruiz, como exige el recordatorio
de 04.1. **`maxValue` = 90 días desde `TODAY`.**

Script de aserciones que falla si los datos dejan de cumplir los hechos
declarados: el 23 y el 29 de abril llenos; el 24 con 6 horas libres y la
primera a las 10:30; los días llenos de mayo exactamente los de la lista; el
17 de mayo con 8 libres; mayo con 5 semanas y abril con 6.

Huecos que el documento no cubre y se resuelven al llegar a ellos, proponiendo
antes un patrón explícito: horas del 25 al 28 de abril y del resto de mayo;
disponibilidad de Cortés en abril y de Ruiz en mayo. **Se generan los 30
cardiólogos que faltan hasta 34**: son datos, no diseño; el documento solo fija
los 4 de la primera página.

**D5 · Componentes React frente a parciales SCSS.** Estilos solo en
`src/styles/` por capas. Componentes en `src/components/NombreComponente.tsx`,
sin importar nunca SCSS. Correspondencia 1:1 por nombre: `ResultCard.tsx` ↔
`.c-result-card` ↔ `06-components/_c-result-card.scss`. Vistas en
`src/views/`, datos en `src/data/`. Un único punto de entrada: `main.scss`
importado en `main.tsx`. Colocalizar el SCSS junto al TSX rompería la regla de
que la carpeta es la capa y el orden de cascada de los `_index.scss`.

**D6 · Las variantes `Layout` de Figma son container queries, no props.**
Aplica a Result Card, Appointment Card y Dialog.

**D7 · Cambios móvil/escritorio.** Si solo cambia la presentación, CSS. Si
cambia el control o el flujo, `useMediaQuery(lg)` y se renderiza solo uno.
Aplica a tira frente a calendario, Booking Bar frente a sección, y paginación
frente a «Ver más». Renderizar los dos y ocultar uno duplicaría un `h2` y los
IDs. El valor del breakpoint queda duplicado entre SCSS y TS: añadir una
comprobación que falle si difieren.

**D8 · Estados de demo.** Carga, vacío y reserva fallida no tienen disparador
sin backend. Parámetro `?escenario=` (`ocupada`, `lenta`); el vacío se produce
de forma natural con una consulta sin coincidencias. Más una página de
desarrollo con enlaces a cada estado.

**D9 · Catálogo.** Ruta `/kit` en lugar de Storybook: cero dependencias y la
misma cascada global. **Va también en producción**, no solo en desarrollo: un
catálogo del sistema es parte de lo que la pieza demuestra.

**D10 · Tipografía.** Mixin `tools.text($paso)` que emite las propiedades
sueltas desde los tokens. Se descarta el shorthand `font` porque restablece
`font-variant-numeric` (rompe `tabular-nums`) y `font-optical-sizing`. No se
emite `font-optical-sizing`: `auto` ya es el valor inicial. Los elementos
`h1`–`h6` no llevan tamaño (ver «Encabezados»).

**D11 · Fuentes alojadas con Fontsource.** Fraunces variable con el eje `opsz`
(`opsz.css`) e Inter variable (`wght.css`, no el `opsz`: cambiaría el dibujo
respecto a Figma). Sin peticiones a terceros. Los paquetes registran las
familias como `'Fraunces Variable'` e `'Inter Variable'`; los tokens las
declaran con la familia sin sufijo como respaldo.

**D12 · Despliegue en Netlify.** Router con historial del navegador
(`createBrowserRouter`, modo datos) y fallback de SPA, sin el truco del
`404.html` de GitHub Pages. El modo datos aporta `<ScrollRestoration>`, que
hace falta: el foco se mueve al `h1` al navegar, y sin restauración de scroll
esa gestión pelea con la posición que recuerda el navegador.

**D13 · La cita de la Dra. Ruiz.** El 24 a las 10:30 ya está en Mis citas como
Confirmada, y el flujo de reserva reserva justo esa cita. Almacén en memoria
sembrado con las 5 citas de la §6; completar el flujo **reemplaza** la cita de
Ruiz en lugar de duplicarla. Todo se reinicia al recargar.

**D14 · Legend con encabezado.** `UI/Legend` recibe una prop opcional de nivel
de encabezado. La vista 2 la usa (`<legend><h2>Elige fecha</h2></legend>`); la
vista 3 no.

---

## Pendientes anotados

| Fase  | Pendiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4     | **`overflow-wrap: anywhere` en filas flex sin wrap.** Con `anywhere` (reset, fase 3) un ítem flex encoge por debajo de su palabra más larga, así que en una fila sin `flex-wrap` el texto parte **dentro de la palabra** en vez de desbordar. Comprobar cada componente al 200 % de texto y confirmar que ninguna palabra parte donde había un espacio disponible |
| 4     | **Anillo de `UI/Menu Item` y `UI/Nav Item` (4.4).** Medido en las variantes Focus: anillo hacia dentro (x = y = 2, tamaño − 4, trazo 2) con **radio 0**, en `UI/Menu Item` y en las dos de `UI/Nav Item`. Es el desfase −4 de § Constantes; el control no tiene radio, así que el outline sale recto sin declarar nada más. Comprobarlo al construir los dos |
| 5     | **Atrás tras un ancla nativa no restaura el scroll.** `<ScrollRestoration>` fija `history.scrollRestoration = 'manual'` y React Router no restaura tras una navegación que no inició (el porqué no está verificado). Se resuelve al decidir cómo navega el resumen de errores de la vista 3; si enfoca el campo por script, no crea entrada de historial y el caso desaparece |
| 5     | **Línea base en la cabecera de resultados.** `Search Row` y `Results Header` de escritorio alinean con MAX en Figma porque el archivo no tiene BASELINE (0 de 503 autolayouts horizontales en pantallas); este documento dice que el recuento y «Ordenar por» comparten línea base. Decidir `baseline` en código al construir la vista 1 |
| 7     | **Favicon.** No está en el diseño y «Salvia» no existe como marca gráfica. La pestaña va sin icono hasta entonces; es un hueco declarado, no un olvido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| —     | **Deuda conocida: lista de primitivos a mano.** La regla de Stylelint que prohíbe primitivos fuera de `01-settings` enumera las familias de color (`neutral`, `sage`, `accent`, `success`, `red`, más `white` y `black`) en una expresión regular. Si entra una familia nueva, hay que añadirla ahí. No se deriva de `_tokens.scss` porque exigiría un script propio; con `color-no-hex` y `color-named` activos, el riesgo es bajo                                                                                                                                                                                                                                                                                                                     |
| 7     | **Desplazamiento del subrayado.** Hueco del diseño: `link/md` no lo declara. La regla base de `a` usa el del navegador; se decide mirando cómo queda el subrayado con Inter a 16 sobre los descendentes reales                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 7     | **Fallback de SPA en Netlify.** `public/_redirects` con `/* /index.html 200` (D12). Sin él, recargar en `/mis-citas` da 404 en producción. Recupera la carpeta `public/` junto con el favicon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7     | **Zona segura en un iPhone real.** `viewport-fit=cover` y `env(safe-area-inset-*)` en `c-app-layout` (laterales) y en su hueco de barra (inferior) no se pudieron probar: en headless `env()` vale 0. Comprobar en vertical y horizontal con notch que el contenido no queda bajo el notch, que la franja bajo el indicador de inicio se pinta con la superficie y que la barra no queda bajo él |
| 7     | **Safari: foco y `scroll-padding`.** La verificación de 2.4.11 (fase 3) se hizo en Chromium (Edge headless, Tab real). Comprobar en Safari de macOS e iOS que al mover el foco con Tab y Shift+Tab el desplazamiento respeta `scroll-padding-block-end` (`--app-layout-bar-size`) y ningún elemento enfocado queda bajo la barra; repetir la contraprueba con el padding a 0 |
