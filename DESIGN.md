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
| `lg`   | 64rem (1024px) | Único salto de página: aparece el patrón aside + principal, el header de escritorio sustituye a la barra inferior y el contenedor se centra. En 1024 deja 624 de columna principal, por encima del umbral de Result Card Row (576) |

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
umbral de `result-card` (576). No se corrige nada: se declara.

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
`space-4` a cada lado deja 608 útiles, por encima del umbral de
`result-card` (576). Result Card pasa
a Row dentro del tramo, en cuanto su `li` alcanza el umbral (desde 608 de
viewport en resultados; 623 con barra clásica), sin esperar a `lg`. Medido: a
608 y a 609, Row con 214 salvo la modalidad larga, que baja de línea (242).
`appointment-card` (640) queda por encima: Appointment Card va en Stacked en
todo el tramo (§ Contenedores, costes). El umbral de `dialog` se mide
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

## Texto grande respecto al viewport

**No es un breakpoint de layout.** El único breakpoint sigue siendo `lg`. Esto
es una condición del usuario: en una media query, `rem` es la letra del
navegador, así que se alcanza por un viewport estrecho o por letra grande.
`tools.large-text` = `(max-width: 18.75rem)`, con `$large-text` en
`_breakpoints.scss`, fuera del mapa: React no lo consulta y no tiene espejo
en TS.

**Derivación.** Las tres etiquetas de la barra inferior caben en una línea
desde 300 px a 16 = 18,75rem (medido: «Especialistas» en `label` mide
88,8). Todo el chrome está en `rem`, así que la cuenta vale con cualquier
letra.

| Caso                              | Viewport     | Modo                                         |
| --------------------------------- | ------------ | -------------------------------------------- |
| 320–430 al 100 %                  | 20–26,88rem  | No                                           |
| 320 con la letra al 150 % / 200 % | 13,33 / 10rem | Sí                                          |
| 1024 con la letra al 200 %        | 32rem        | No (chrome móvil por `lg`, barra en tercios) |

**Qué hace cada barra.** El hueco del shell (`c-app-layout__bar`) pasa a
`position: static`: la barra queda al final del flujo, donde ya estaba en el
DOM, y no cambia el orden de lectura ni de tabulación. Fija, taparía casi
media pantalla (248–288 a 320 con la letra al 200 %). El `scroll-padding`
vale 0: la barra no tapa nada. `--app-layout-bar-size` sigue publicada, sin
uso.

- `UI/Bottom Nav`: una columna de filas. El Nav Item es una fila (12 +
  icono 24 + 12 = 48, como Menu Item) con 16 al inicio y 0 al final. La barra
  de actual pasa al inicio (`border-inline-start` de 2 `color-action`;
  `color-border` en hover): en una lista vertical, un borde superior en una
  fila intermedia se lee como separador. Anillo general. Con la letra al
  200 %, en la fila de «Especialistas» el icono baja de línea antes de que la
  palabra parta (regla de icono y etiqueta).
- **Cada barra futura (`UI/Booking Bar`, `Action Bar`) declara en su plan
  cómo se ve en este modo.** La regla del shell ya la saca de la posición
  fija; su interior lo decide su plan.
- `UI/Booking Bar` (4.6): una columna, resumen arriba y botón a ancho
  completo. Medido con `Page.setFontSizes` a 24 y 32 en 320 y a 20 en 375
  (§ Fecha y hora).

**Desviación de Figma: Nav Item con `padding-inline: 0`** (Figma: 8). En la
barra, el ítem llena su tercio con el texto centrado; el padding lateral solo
cuenta cuando la etiqueta no cabe. Con 8, «Especialistas» parte por debajo de
348 px (a 320 al 100 %, barra de 84); con 0, cabe desde 300.

**Límite declarado.** Con barra de scroll clásica (15 px), entre 300 y
315 px al 100 % la etiqueta no cabe y el modo no se activa. Solo ocurre en
una ventana de escritorio de ese ancho exacto. A 320 con zoom (la prueba de
1.4.10) cabe. Subir el umbral lo cubriría a cambio de activar el modo sin
necesidad en móviles con la letra al 125 %.

---

## Contenedores

**Regla: el contenedor se declara siempre en el elemento que aporta el ancho,
nunca en el componente que cambia de forma.** El ancho de un componente que se
reorganiza es el resultado de esa decisión, no su causa: si él mismo fuese el
contenedor, su padding y su propia variante falsearían la medida (una Row de
480 con padding 24 mide 430 de contenido y nunca alcanzaría su umbral). Con el
contenedor en el padre, el umbral es siempre un ancho exterior, sin aritmética
de padding.

Un contenedor puede tener varios umbrales: son claves de `$containers` sobre
el mismo `container-name`, sin un segundo nombre
(`tools.container(result-card, result-card-identity)`).

`_containers.scss`:

| Nombre                 | Contenedor                                         | Umbral      | Qué cambia                                      | Razón                                                                                                                                                                                  |
| ---------------------- | -------------------------------------------------- | ----------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `result-card-identity` | el `li` (contenedor `result-card`)                 | 14rem (224) | Por debajo, el avatar va encima del encabezado  | Al encabezado le quedan 8rem: bordes 2px + padding 2rem + avatar 3rem + hueco 0,75rem + 8rem. Al 100 % no ocurre (el `li` más estrecho mide 273); al 200 % a 320 sí (448 en px) |
| `result-card`          | el `li` de la lista de resultados                  | 36rem (576) | Stacked pasa a Row                              | Con 32rem, a 512 la disponibilidad partía en 3–4 líneas en una columna de 158; a 576 (222), en dos como mucho. El `li` no tiene padding                                             |
| `appointment-card` | el `li` de su sección                              | 40rem (640) | Stacked pasa a Row                  | Figma (descripción del maestro). Medido: a 640 al cuerpo de Row le quedan 342 y la línea más ancha, la ubicación con icono, mide 296; con 34rem (544) le quedaban 246 y partían la fecha y la ubicación |
| `dialog-compact`   | el velo (contenedor `dialog`)                      | 18.75rem (300) | Por debajo, el panel pierde el margen lateral y su padding baja a `space-4` | El valor de `tools.large-text` como container query: en rem sigue a la letra por los dos métodos, y con la letra a 16 solo se activa por debajo de 300 px (a 320 y 375 al 100 %, como Figma). Caso límite: a 375 con la letra a 20 y barra clásica, el velo mide 360 = 18rem y es compacto; con la superpuesta, 18.75rem, no. Medido a 320 con la letra a 32: el interior del botón pasa de 32 (partían «mi» y «cita») a 128 con barra clásica (el velo, que se desplaza, pinta su propia barra de 15) y a 158 con la superpuesta. Con la clásica aún parten «¿Cancelar», «Mantener» y «Cancelar», más anchas que su interior; con la superpuesta, ninguna |
| `dialog`           | el velo                                            | 32rem (512) | Stacked pasa a Row                  | 480 de la variante Row + 16 + 16 de margen: es cuando cabe. El velo no lleva padding lateral: la query mide su caja de contenido, y el margen lo resta el panel |
| `slot-picker`      | el elemento que da ancho a la tarjeta del selector | 44rem       | La tarjeta apila calendario y horas | —                                                                            |

**Costes declarados de `appointment-card` (40rem).**

- En el tramo intermedio la columna mide como mucho 608: las citas van en Stacked hasta `lg`.
- Desde `lg`, con el aside de Mis citas, la columna mide viewport − 400: Row desde 1040 de
  viewport (1055 con barra clásica). Entre 1024 y 1039 (1054) van en Stacked con las acciones a
  ancho completo, un patrón móvil en escritorio (diseño §3.6). Sale de la cuenta de
  § Breakpoints; se mide en la vista 4 (fase 5).
- En Row, la nota de Pending (485) va en dos líneas hasta un `li` de 783 y la tarjeta mide 260
  en vez de 240; desde 784, una línea y 240 (medido a 640, 782, 783 y 784).
- Stacked a 375 con barra clásica: el `li` mide 328, la nota de Pending va en tres líneas y la
  tarjeta mide 330 en vez de 310 (medido). En un móvil real la barra es superpuesta y mide 310,
  como Figma.

---

## Custom properties públicas

Un bloque puede publicar una propiedad sin guion bajo cuando alguien de fuera
tiene que fijar un valor que el bloque no deduce de sus props. El nombre es el
del bloque sin el prefijo `c-` más la propiedad: `--avatar-size`, no
`--c-avatar-size`. Lo privado sigue en `--_*`. Hay dos clases:

**La fija un padre por CSS, con un valor por defecto que depende de la
variante: lleva el patrón `-default`.**

- El valor por defecto va en `--_<propiedad>-default`; los modificadores solo
  cambian ese dato.
- La decisión `--_<propiedad>: var(--<bloque>-<propiedad>, var(--_<propiedad>-default))`
  se escribe una vez, en la raíz del bloque; ningún modificador la redeclara.
  Un modificador que escribiese `--_size: 8rem` ignoraría la pública sin que
  lo detecten el lint, el build ni el verify.
- `var()` en una custom property se resuelve en el elemento después de la
  cascada: la decisión de la raíz lee el `-default` que deja el modificador.
- El padre fija la pública en su elemento de mezcla.

```scss
.c-avatar {
  --_size-default: 3rem;
  --_size: var(--avatar-size, var(--_size-default));

  &--medium { --_size-default: 4rem; }
  &--large  { --_size-default: 6rem; }
}
```

Caso: `--avatar-size` (Result Card la fija en su mezcla: 48 en Stacked, 64 en
Row).

**La mide y la escribe un script: un solo valor por defecto en la lectura y
sin `-default`.** No hay variantes que cambien el respaldo.

Caso: `--app-layout-bar-size` (`AppLayout.tsx` la escribe en `:root` con un
`ResizeObserver` sobre el hueco de la barra; `c-app-layout` la lee con
`var(--app-layout-bar-size, 0)`).

---

## Constantes del sistema sin variable en Figma

Medidas en los maestros, no son tokens del archivo:

- Trazo normal 1px; trazo fuerte 2px (campo en error, marcador de casilla y
  radio).
- **Anillo de foco, uno solo para todo el sistema:** 2px de grosor, 2px de
  desfase, radio = radio del control + 4 (10 sobre `radius/sm`). Desfase −4
  en lo que toca el borde de su contenedor: Nav Link del header, Nav Item de
  la barra inferior e ítems del menú de cuenta (radio 0). El wordmark y los
  botones del header conservan el general.
- **`z-index: 1`**, el único del sistema: el panel del menú de cuenta (tapa
  el contenido) y el salto al contenido (va antes que el header en el DOM).
- **Salto al contenido** (2.4.1, sin dibujo en Figma): primer foco del shell,
  «Saltar al contenido», oculto hasta recibir el foco. Entonces es un
  Secondary superpuesto sobre el header (`space-2` arriba, `space-4` + zona
  segura al lado). Lleva el foco por script al `h1` de la vista
  (`id="contenido"`, `tabIndex={-1}`, el mismo destino que al cambiar de
  ruta), sin entrada de historial.
- **Destino de foco programático:** un elemento con `tabindex="-1"` que
  recibe el foco por script (el `h1` al cambiar de ruta, el resumen de
  errores, el título de un aviso, el nombre de la primera tarjeta nueva tras
  «Ver más») conserva el anillo global. Con teclado
  muestra dónde fue el foco; con ratón no aparece (`:focus-visible`). No se
  suprime.
- Alto de control de texto: 50, por construcción (borde 1 + 12 + interlineado
  24 + 12 + borde 1). No es un alto fijo: es el resultado del padding.
- Fila de casilla y radio: 48 en las dos plataformas, también por padding.
- Velo de hojas y diálogos: `color-scrim` al 45 %
  (`color-mix(in srgb, var(--color-scrim) 45%, transparent)`), nunca en la
  variable.
- Borde punteado de `UI/Status Tag` Cancelled, `UI/Time Slot` Full y
  `UI/Calendar Day` Full: `border-style: dashed` nativo de 1px. Figma dibuja
  el patrón [4, 3]; en código lo pone cada navegador. Es un borde real: sigue
  el radio y en `forced-colors` se mantiene discontinuo, que es lo que
  distingue el estado cuando el color desaparece.

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
etiqueta en fila la hereda. En 4.2 la heredan `UI/Status Tag`, `UI/Step` y
`UI/Notice`; esta última con una base de contenido (`8rem`, derivada en su
parcial), porque su cuerpo es un párrafo y sin base bajaría siempre de línea.
En 4.3, `UI/Checkbox` y `UI/Radio`, con la misma base `8rem` en la etiqueta y
en el texto del mensaje: al 200 % a 320 la caja sube a su propia línea, también
sobre etiquetas cortas que habrían cabido; es el precio de no partir palabras.
En 4.5 la heredan la ubicación y la disponibilidad de `UI/Result Card` (base
`8rem`) y `UI/Page Link`. El avatar de la tarjeta sigue la misma regla con un
umbral de contenedor (`result-card-identity`): sube antes de que el nombre
parta. En 4.6, la meta de `UI/Booking Bar` (reloj o aviso + texto, base
`8rem`) y `UI/Time Slot` (check + hora).

**Límite medido.** Al 200 % a 320 con barra de scroll clásica (15 px), el
interior de un `UI/Button` a ancho completo mide 143 px (158 con barra
superpuesta), y parten las palabras que lo exceden por 2–3 px: «completo»
(«Ver mes completo») y «Avisarme» («Avisarme si se libera un hueco»). No hay
scroll horizontal ni pérdida de contenido, y ninguna palabra parte pudiendo
caber: la regla se cumple. El caso excede lo que exige WCAG (1.4.4 pide 200 %
sin pérdida; 1.4.10, 320 CSS px a zoom completo), así que el padding no se
toca.

El CTA de `UI/Result Card` al 200 % a 320 tiene un interior de 77 px (barra
clásica) o 92 (superpuesta), porque suma el padding de la tarjeta y el del
botón: parten «horarios» y «Avisarme», más anchas que ese interior.
«experiencia» (175,3) parte en un párrafo de 175 con barra clásica. Ninguna
cabía.

---

## Búsqueda y resultados

**Geometría de Loading.** El esqueleto replica las líneas del texto de Figma:
290 en Stacked (especialidad en dos líneas) y 214 en Row. Cuando el texto real
ocupa menos líneas, el esqueleto es más alto y la lista encoge al llegar los
datos: a 575, el esqueleto mide 290 y las tarjetas 266. Cuando ocupa más, la
lista crece: a 343, Joaquín mide 338, igual que en 01.1; desde 608 en Row,
Mariana mide 242 (la modalidad baja de línea). Solo coinciden con el texto de
Figma.

**Conmutador «Avisarme», desviación de la APG.** La APG pide que un botón
conmutador no cambie de etiqueta. Aquí cambia («Avisarme» → «Te avisaremos»,
con `aria-pressed`) porque las dos se leen coherentes con su estado: «Te
avisaremos, presionado» y «Avisarme, no presionado»; el caso que la APG evita
es «Silenciar» leído como «presionado». Pendiente de la fase 7 con lector.

**Load More: o foco o región viva.** Al terminar, el foco va al nombre de la
primera tarjeta nueva; el recuento de Load More no es región viva y el de la
cabecera no cambia (el total sigue siendo el mismo).

**Pagination.** La fila más ancha mide 669 (la actual en 4, 5 o 6). Cabe desde
una columna de 670, es decir, desde 1070 de viewport (1085 con barra clásica).
Entre `lg` y ese ancho va en dos filas (`flex-wrap`).

**Filter Trigger.** Chromium calcula el nombre como «Filtrar y ordenar , 1
filtro aplicado»: el texto oculto está fuera del flujo y se separa como un
bloque. No se pronuncia.

---

## Fecha y hora

**Componentes y excepciones a D5.** `DayStrip.tsx` ↔ `c-day-strip`: los
siete radios de `UI/Day Chip` con el mismo `name`. El `fieldset`, la legend
«Elige fecha», «Ver mes completo» y la navegación de semana son patrón de
pantalla (fase 5). `SlotList.tsx` ↔ `c-slot-list`: un `ListBoxItem` no existe
fuera de su `ListBox`, así que sin la lista no hay `UI/Time Slot`. Ninguno de
los dos es uno de los 34.

**Qué es RAC y qué es nativo.** Tira: radios nativos (Tab entra en el
marcado, las flechas mueven y seleccionan). Calendario: `Calendar` de RAC,
con `render` en la celda (spike R3). Horas: `ListBox` con `layout="grid"`,
camino B del spike. Booking Bar: nativa; su envío lleva `form=` porque vive en
el hueco de barra del shell, fuera de `main` y del `form`.

**Valores derivados.**

| Valor | Dónde | Derivación |
| --- | --- | --- |
| `2.0625rem` y un séptimo como tope | columna de la tira | «dom» ≈ 31 en caption + bordes 2. Sin el padding de `space-1`: el contenido va centrado y el padding de Figma solo cuenta en HUG. Caben 7 a 320 con las dos barras |
| `4.8125rem` y un tercio como tope | columna de horas | check 20 + 8 + hora 45 + bordes 4 = 77. `UI/Time Slot` va sin padding lateral por la misma razón. Caben 3 a 320 con las dos barras (83 y 88) |
| `9.5rem` | base del resumen de `UI/Booking Bar` | la línea más ancha es la meta: icono 20 + 4 + texto, 150 en Figma y ≈ 152 en el navegador (con 150 quedaba una franja de 2 px con la meta partida) |
| `calc(space-3 − 1px)` | padding superior de `UI/Booking Bar` | 74 con el borde dentro, como `c-header-mobile` |
| `0.3125rem` | punto de hoy | 6 desde el borde exterior − 1 de borde (Figma 02.2: y 40 en la celda de 50) |
| `21.75rem + 2 × space-1` | alto mínimo del envoltorio de la rejilla | cabecera L–D 20 + 8 hasta la primera semana (4 de padding del `th` + 4 de `border-spacing`) + 6 semanas × 50 + 5 huecos × 4 = 28 + 320 = **348**; + 4 + 4 de reserva del anillo = **356** |
| `7 × 1.4375rem + 8 × space-1` | ancho mínimo de la rejilla | número de dos cifras en body-strong (21) + bordes, y los 8 `border-spacing`. Al 100 % no se alcanza nunca |

**Alto de 6 semanas.** El `320` de la descripción de `UI/Calendar` (6 × 50
+ 5 × 4) es solo la rejilla de semanas; el mínimo va en un envoltorio que
contiene también la cabecera de días, así que suma los 28 de la cabecera. En
el envoltorio y no en la tabla: una tabla reparte el alto sobrante entre sus
filas.

**Texto ampliado.** Tira y horas pasan a menos columnas antes de partir letras
(al 200 % a 320: 3 y 1). El calendario conserva sus 7 columnas y se desplaza
en horizontal dentro de su envoltorio (excepción 2D de 1.4.10); las flechas
llevan la celda enfocada a la vista (medido). El envoltorio reserva 4 px por
cada lado (padding + margen negativo) para que el anillo de las celdas del
borde no quede recortado; con esa reserva la tabla llena justo la caja de
padding y `overflow-x: auto` nunca pinta barra vertical.

**`UI/Booking Bar` a 320 al 100 %. Coste declarado:** fuera del modo de
texto grande, por debajo de ~327 px de viewport (barra de scroll superpuesta)
o ~342 (clásica) al resumen no le quedan 152 y el botón baja de línea: la
barra mide 134 en vez de 74. Barrido de 320 a 345 sin alturas intermedias.
En Figma solo existe 375.

**forced-colors.** Día y chip seleccionados en `SelectedItem` /
`SelectedItemText`: solo se distinguían por el relleno, que el modo
sustituye. Edge los respeta sin `forced-color-adjust` (medido). La hora
seleccionada conserva borde 2, check y peso.

**Lo que añade RAC y no se quita con su API pública.** Un `h2` oculto con el
mes («abril de 2029»), un botón oculto «Siguiente» (`tabIndex -1`) y la
cabecera de días con `aria-hidden` (el nombre de cada día ya la incluye). La
rejilla se nombra «abril de 2029», sin duplicar el mes. El anuncio del mes al
pulsar «Mes siguiente» lo hace la región viva propia de RAC.

**Teclado.** Inicio y Fin van al principio y al fin de la semana (APG) y
cambian de mes como las flechas; RAC los llevaría al principio y fin del mes,
y se interceptan. Sin salir de `minValue` ni `maxValue` (con estos datos el
recorte no se ejerce: hoy es lunes y el día 90 es domingo). Si «Mes anterior»
desaparece con el foco dentro, RAC lo lleva al día enfocado del mes nuevo; el
foco no se pierde.

---

## Citas y diálogos

**`UI/Dialog` es un `<dialog>` nativo con `showModal()`.** El elemento es el
velo y el contenedor `dialog`; el panel es su hijo. Capa superior sin
`z-index` y fondo `inert`. Un clic en el velo no cierra: es un `alertdialog`
destructivo y solo lo cierran sus dos botones y Escape (que equivale a
mantener).

- **Teclado.** Tab y Mayús+Tab pueden salir al marco del navegador
  (comportamiento nativo de `<dialog>` en Chromium), pero nunca llegan a la
  página.
- **forced-colors.** El velo conserva el alfa: Canvas al 45 %, no opaco. El
  panel, también en Canvas, solo se separa del fondo por su contorno: el borde
  transparente, forzado a CanvasText.

---

## Enlaces de navegación

Wordmark, `UI/Nav Link`, `UI/Nav Item` y `UI/Menu Item` van sin subrayado
(Figma: `textDecoration` NONE, medido). Son navegación, no enlaces dentro de
un texto: su contexto los identifica y 1.4.1 no aplica. Todo lo demás
(`UI/Link`, `UI/Back Link`, `UI/Breadcrumb`, enlaces en texto) conserva el
subrayado de la regla base de `a`.

---

## Iconos y roles de color

En un icono, `color` alimenta el relleno del path (`fill="currentColor"`): un
rol con scope `SHAPE_FILL` es válido ahí. `UI/Status Tag` pinta su icono con
`color-success` (Confirmed) y `color-warning` (Pending) sobre `.c-icon`, como
en Figma, no con el rol de texto de su etiqueta; F.3 valida `hourglass` a
3.73:1. La regla «un rol de relleno nunca va en `color`» vale para el texto.

Un icono con color propio vuelve a `currentcolor` en
`@media (forced-colors: active)`: Chromium no fuerza el color de un `svg`
que no lo hereda, y el icono conservaría el color de marca sobre el fondo del
sistema (medido en 4.2: el check de Realizada y el glifo de Info quedaban
casi invisibles). Primeros casos: Status Tag y Notice (4.2).

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

## Decisiones de arquitectura (D1–D15)

Tomadas en la planeación de la fase de código. No se reabren sin acuerdo
explícito.

**D1 · Rutas, estado y guardas.** Las 32 pantallas son estados de 8 rutas,
más la del 404:

| Ruta                             | Vista                                    | Estado dentro de la ruta                                               | Guarda                                                                                                             |
| -------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/`                              | V1 · Búsqueda                            | Carga, vacío (por consulta o por filtros), hoja de filtros, conmutador | Un parámetro con valor desconocido se ignora                                                                       |
| `/especialistas/:slug`           | V2 · reserva                             | Sin horarios, Missing, hoja del calendario                             | Slug desconocido → 404. `fecha` fuera de rango u `hora` no libre se ignoran (estado inicial de D2)                 |
| `/especialistas/:slug/confirmar` | V2 · confirmación previa (móvil)         | —                                                                      | Slug desconocido → 404. Sin `fecha` y `hora` libres → redirige a `/especialistas/:slug` con los mismos parámetros |
| `/especialistas/:slug/datos`     | V3                                       | Errores, reserva fallida                                               | Igual que `/confirmar`                                                                                             |
| `/citas/:id/confirmada`          | V4 · confirmación                        | —                                                                      | Id que no está en el almacén → 404                                                                                 |
| `/mis-citas`                     | V4 · Mis citas                           | Diálogo, avisos de cancelada y reprogramada, menú de cuenta            | —                                                                                                                  |
| `/mis-citas/:id/reprogramar`     | V4b · reprogramación (selector de la V2) | Los de la V2                                                           | Id desconocido → 404. Cita que no está Confirmada → redirige a `/mis-citas` (solo Confirmed ofrece «Reprogramar») |
| `/fuera-de-alcance`              | Página genérica                          | —                                                                      | —                                                                                                                  |
| `*`                              | 404                                      | —                                                                      | —                                                                                                                  |

**404.** Ruta `*` y `throw` con estado 404 desde la guarda de la ruta, con el
mismo `errorElement`: `h1` «No encontramos esta página» y «Ir a
Especialistas».

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

**Retroceso con la consulta conservada** (panel 02.0: nombran adónde llevan,
nunca `history.back()`). Los parámetros de V1 (`q`, `ubicacion`, filtros,
`orden`, `pagina`) viajan sin cambios, junto a `fecha` y `hora`, de V2 a V4;
no comparten nombre. El Back Link y el breadcrumb «Especialistas» de V2, V3
y la confirmación reconstruyen `/?…` con ellos, y el nivel del médico,
`/especialistas/:slug?…`. Al abrir una página desde un enlace sin ellos,
llevan a `/`. La reprogramación no los lleva: su retroceso es `/mis-citas`.

El catálogo sigue en `/kit` (D9).

**D2 · Estado del selector de la vista 2.** Un reducer `useSlotPicker` en la
composición, con cuatro valores: `{ date, time, visibleWeek, visibleMonth }`.
La tira, el calendario y el ListBox son vistas controladas de ese estado; el
texto de estado, «día lleno» y el estado de la Booking Bar se derivan. Reglas:

- Cambiar de fecha pone `time` a `null`: una hora pertenece a su día.
- Navegar de semana no cambia la fecha.
- La hoja del calendario tiene su propio borrador, que solo se aplica con «Ver
  horarios del martes 24». Cerrarla lo descarta.
- **Estado inicial sin parámetros.** `date` nunca es `null`: en la reserva,
  el primer día con horas libres desde hoy (el 24 con estos datos); en la
  reprogramación, el primer día con horas libres de la semana de la cita
  actual (el martes 15 de mayo). `time` empieza en `null`. Figma 02.1
  equivale a `?fecha=2029-04-24&hora=10:30`; 02.7 y 02.8, a
  `?fecha=2029-05-17&hora=17:00`.

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
**Ningún día publicado es `[]`**: `[].every()` es `true` y daría por lleno un
día sin horas. El domingo se publica con la franja de mañana y todas sus
horas ocupadas, de modo que «La agenda … está completa» y la leyenda «Sin
horarios» dicen la verdad. Los domingos declarados (29 de abril; 6, 13, 20 y
27 de mayo) salen de la regla, no de una excepción.

**Generación.** Plantilla de Figma (09:00–11:30 y 16:00–18:30 cada 30 min)
de lunes a sábado; domingo, 09:00–11:30. Mariana va desfasada un cuarto de
hora (09:15–11:45 y 16:15–19:45), por su 19:15. La ocupación sale de un
generador con semilla (mulberry32 sobre slug + fecha + hora), nunca de
`Math.random`: las capturas deben ser estables. Los días declarados se
escriben encima. Franjas: Mañana antes de las 12:00 y Tarde desde las 12:00.
Reservar o reprogramar no cambia la disponibilidad (declarado).

**`publishedUntil`** por médico: límite de la generación y del selector
(`maxValue = min(MAX_DATE, publishedUntil)`). **Full** (Result Card) se
deriva: ningún hueco libre entre `NOW` y `publishedUntil`. «Próximo cupo en
{mes}» también: el mes del día siguiente a `publishedUntil`. Rodrigo:
`publishedUntil` el 30 de abril, con abril entero ocupado.

**Orden «Disponibilidad más próxima».** Clave: el primer hueco libre; para
un Full, el día siguiente a `publishedUntil` a las 00:00. Los generados
tienen abril ocupado y su primer hueco a partir del 2 de mayo: no empatan
con Rodrigo. Entre iguales, por nombre (colación es-MX). «Años de
experiencia»: descendente. «Cercanía»: `distanceKm`, un dato del médico.

Reloj: `TODAY` y `NOW` en `src/data/clock.ts`; `new Date()` y `today()`
prohibidos por lint. **`NOW` = lunes 23 de abril de 2029, 09:00** — anterior
al 19:15 de Mariana y al 10:30 de la cita de Ruiz, como exige el recordatorio
de 04.1. **`maxValue` = 90 días desde `TODAY`.**
Una hora está libre solo si empieza **después** de `NOW`: la de las 09:00
del 23 cuenta como pasada.

**Universo.**

- Área Cardiología: 34 (los 4 de 01.1 y 30 generados).
- Los 4 médicos de Mis citas que no son de cardiología.
- Generados en Pediatría, Ginecología, Medicina interna y Traumatología
  (Dermatología ya tiene a Molina).
- Oftalmología, Medicina general y Nutrición clínica no tienen opción de
  filtro: se alcanzan por consulta o sin filtro.
- `q` busca una subcadena, sin distinguir mayúsculas ni acentos, en el
  nombre, la línea de especialidad y el área. Ejemplo: «Cardiología»
  encuentra a Rodrigo por el área, aunque su línea diga «Electrofisiología».
- Líneas de especialidad literales de Figma en los fijos; «· N años» en los
  generados.

Los 4 fijos de 01.1 (Figma, `specialty` de cada Result Card):

| Médico                     | Línea de especialidad                    | Área del filtro |
| -------------------------- | ---------------------------------------- | --------------- |
| Dra. Mariana Cifuentes Poza | Cardiología pediátrica · 15 años        | Cardiología     |
| Dra. Elena Ruiz Arellano   | Cardiología · 12 años de experiencia     | Cardiología     |
| Dr. Joaquín Bermúdez Lara  | Cardiología intervencionista · 8 años    | Cardiología     |
| Dr. Rodrigo Alcántara Vela | Electrofisiología · 20 años              | Cardiología     |

Cortés, en su perfil (02.7, 02.8): «Oftalmología · 9 años de experiencia»,
área Oftalmología (§6).

**Ubicación.** Las opciones se derivan de las colonias de las clínicas, en
orden alfabético, con «Ciudad de México» como inicial (toda la ciudad,
`ubicacion` ausente), que es el valor que muestra Figma.

**Motivo de consulta:** «Primera consulta», «Seguimiento», «Revisión de
estudios», «Segunda opinión», «Otro motivo».

**`scripts/check-data.mjs`**, encadenado en `pnpm lint` (importa el TS de
`src/data/`), falla si deja de cumplirse cualquiera de estos hechos:

- Ruiz: el 23 y el 29 de abril llenos; el 24 con 6 horas libres y la
  primera a las 10:30.
- Cortés: los días llenos de mayo son exactamente los de la lista; el 15 de
  mayo con al menos una libre; el 17 con 8 libres; el 16 a las 09:30
  ocupada.
- Primer hueco libre: Mariana, hoy a las 19:15; Joaquín, el 26 a las 17:00.
- Rodrigo es Full con «mayo».
- Mayo tiene 5 semanas y abril 6.
- Ningún día publicado es `[]` y ninguna hora libre empieza en o antes de
  `NOW`.
- La búsqueda de 01.1 da 34 y su primera página es la de Figma, en su
  orden.
- Cada opción de cada filtro, sin consulta, da ≥1 resultado; cada
  ubicación, sin consulta, da ≥1.

**D5 · Componentes React frente a parciales SCSS.** Estilos solo en
`src/styles/` por capas. Componentes en `src/components/NombreComponente.tsx`,
sin importar nunca SCSS. Correspondencia 1:1 por nombre: `ResultCard.tsx` ↔
`.c-result-card` ↔ `06-components/_c-result-card.scss`. Vistas en
`src/views/`, datos en `src/data/`. Un único punto de entrada: `main.scss`
importado en `main.tsx`. Colocalizar el SCSS junto al TSX rompería la regla de
que la carpeta es la capa y el orden de cascada de los `_index.scss`.

Excepciones declaradas al 1:1: `c-kit` y `c-kit-bar` son bloques de las
vistas del catálogo; `c-field` es un solo bloque para `FieldText.tsx` y
`FieldSelect.tsx` (`UI/Field/Text` y `UI/Field/Select`), que comparten toda
la anatomía (etiqueta, control de 50, iconos y mensaje) y solo cambian el
control; `Legend.tsx` pinta dos bloques, `c-legend` y `c-legend-help`, porque
la ayuda va fuera de `<legend>` y un elemento BEM no puede vivir fuera de su
bloque; `c-wordmark` (`Wordmark.tsx`) no es uno de los 34 componentes: lo
comparten los dos headers. `c-filter-trigger` se mezcla sobre `c-button` en
el mismo nodo y solo aloja `__count`: la anatomía es la del botón.
`c-day-strip` (`DayStrip.tsx`) y `c-slot-list` (`SlotList.tsx`) son los
contenedores de `UI/Day Chip` y `UI/Time Slot`, sin ser de los 34 (§ Fecha y
hora). Los hooks (`useDisclosure`, `useMediaQuery`) viven
en `src/hooks/`, y el espejo del breakpoint (D7) en `src/breakpoints.ts`,
comprobado en `pnpm lint`.

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
`lenta`: cada búsqueda y cada «Ver más» tardan 1500 ms. `ocupada`: el envío
válido de V3 devuelve la reserva fallida. Vacío de ejemplo: la consulta de
01.3, «Neurocirugía pediátrica». La página de estados es `/kit/estados`,
con el catálogo (D9).

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

**Foco de ruta (`useRouteFocus` en la ruta raíz).** Al cambiar `pathname`
(no en la carga inicial), `focus({ preventScroll: true })` en `#contenido`:
el scroll lo decide `<ScrollRestoration>` (arriba en PUSH, posición
guardada en POP). Un cambio solo de `search` no mueve el foco: lo decide la
vista. Una navegación puede nombrar otro destino en `location.state.focus`
(volver de reprogramar → título del aviso). **Si ese destino no existe, el
foco va al `h1`:** `history.state` sobrevive a la recarga y a Atrás, pero el
aviso del almacén no (D13). Contraprueba en T1: volver de reprogramar,
recargar `/mis-citas` y comprobar que el foco no se pierde.

**D13 · La cita de la Dra. Ruiz.** El 24 a las 10:30 ya está en Mis citas como
Confirmada, y el flujo de reserva reserva justo esa cita. Almacén en memoria
sembrado con las 5 citas de la §6; completar el flujo **reemplaza** la cita de
Ruiz en lugar de duplicarla. Todo se reinicia al recargar.
La reserva **reutiliza el id sembrado** de la cita de Ruiz
(`ruiz-2029-04-24`): así `/citas/:id/confirmada` aguanta una recarga, porque
el almacén se reinicia con la semilla y ese id sigue en ella.
Los avisos que cruzan una navegación (reprogramada) son de un solo uso y
viven en el almacén, no en `history.state`: tras recargar, el almacén se
reinicia y el aviso no debe volver.

**D14 · Legend con encabezado.** `UI/Legend` recibe una prop opcional de nivel
de encabezado. La vista 2 la usa (`<legend><h2>Elige fecha</h2></legend>`) y
la vista 3 también, en «Datos del paciente» y «Antes de confirmar» (reabierta
en la fase 5 por el panel 03.0: sin ella, sus secciones quedaban fuera de la
navegación por encabezados, mientras que el resumen y «Tu cita» sí estaban).
Sin cambio visual; se verifica con el esquema de encabezados.

**D15 · Títulos de página** (2.4.2), con `<title>` de React 19 en cada vista:
«Especialistas · Salvia», «{Nombre del médico} · Salvia», «Confirma tu cita ·
Salvia», «Tus datos · Salvia», «Cita reservada · Salvia» (Figma, panel
04.0), «Mis citas · Salvia», «Reprogramar cita · {Nombre del médico} ·
Salvia», «Fuera del caso de estudio · Salvia» y «No encontramos esta página ·
Salvia».

---

## Pendientes anotados

| Fase  | Pendiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 ✓   | **`overflow-wrap: anywhere` en filas flex sin wrap. Cerrado en 4.7.** Con `anywhere` (reset, fase 3) un ítem flex encoge por debajo de su palabra más larga, así que en una fila sin `flex-wrap` el texto parte **dentro de la palabra** en vez de desbordar. Comprobado componente a componente de 4.1 a 4.7 al 200 % con las dos barras. **En 4.6**, a 320 al 100 % y al 200 % con las dos barras: ninguna palabra partida en días y números del calendario, mes, leyenda, chips (día de la semana y número), etiquetas de franja y horas; los números y horas llevan `white-space: nowrap` y las filas que los contienen pasan a menos columnas (tira, horas) o se desplazan (calendario) en vez de encoger. La Booking Bar (título, meta y botón), con la letra del navegador a 20, 24 y 32: sin palabras partidas. **En 4.7**, `UI/Appointment Card` a 320: sin palabras partidas al 100 %; al 200 % solo parten palabras más anchas que su elemento (interior de la tarjeta 175/190, de la acción 77/92), y la fila del avatar lleva `flex-wrap` (contraprueba: sin él, al nombre le quedan 55 y parten los 16 nombres). `UI/Dialog` con la letra a 24 y a 32 y al 200 % a 320: ninguna palabra partida pudiendo caber; con barra clásica a 32 parten «¿Cancelar», «Mantener» y «Cancelar», más anchas que su interior (226 y 128, con `dialog-compact`) |
| 5 · T2 | **Fotos de avatar. Decidido:** solo Mariana, Ruiz y Rodrigo (las que llevan foto en Figma), rostros generados por Osvaldo con IA (Gemini); el resto con inicial. Los originales quedan fuera del repo y de su historial. WebP cuadrado sin metadatos, `<slug>-96.webp` y `<slug>-192.webp` en `src/assets/avatars/`, con `srcset`; recorte por foto (las tres caras al mismo tamaño y altura en el círculo), con captura a 48 y 64 antes de cerrar T2. `NOTICE` las excluye de MIT y CC BY |
| 5 · V3 | **Atrás tras un ancla nativa no restaura el scroll.** Decidido (diseño §5.3): el resumen de errores enfoca el campo por script, sin entrada de historial; se mide en V3. `<ScrollRestoration>` fija `history.scrollRestoration = 'manual'` y React Router no restaura tras una navegación que no inició (el porqué no está verificado). Se resuelve al decidir cómo navega el resumen de errores de la vista 3; si enfoca el campo por script, no crea entrada de historial y el caso desaparece |
| 5 · V1a | **Línea base en la cabecera de resultados.** El panel 01.0 fija `align-items: last baseline`; se mide en V1a. `Search Row` y `Results Header` de escritorio alinean con MAX en Figma porque el archivo no tiene BASELINE (0 de 503 autolayouts horizontales en pantallas); este documento dice que el recuento y «Ordenar por» comparten línea base. Decidir `baseline` en código al construir la vista 1 |
| 5 · V2a / V2b | **«Ver mes completo» y «Avisarme si se libera un hueco» al 200 % a 320.** Medirlos en la vista 2 móvil montada, con las dos barras de scroll: su interior real es más estrecho que el del kit (143 px con barra clásica, donde ya parten «completo» y «Avisarme» por 2–3 px). Si parten, se decide entonces, con la vista delante: copy más corto o padding |
| 5 · T2 | **Opciones de Motivo de consulta.** Decididas en D4; se implementan en T2. El diseño solo fija «Primera consulta» (valor de `UI/Field/Select` en la vista 3). El resto de opciones son datos: se proponen con la capa de datos, no se inventan en el componente |
| 5 · V3 | **`noValidate` en el formulario de la vista 3.** La validación es al enviar (§3.4), no la nativa del navegador: los campos llevan `required` por propósito y semántica, y el `<form>` necesita `noValidate` para que el navegador no muestre sus burbujas ni bloquee el envío antes que el resumen de errores |
| 7     | **Ayuda de `UI/Legend` por `aria-describedby`.** Comprobar con NVDA y VoiceOver que la ayuda del fieldset («Todos los campos son obligatorios salvo…») se anuncia al entrar en el grupo, a través de `aria-describedby` en el `fieldset` |
| Skill ✓ | **Parche para `bemit-scss`: reset de `fieldset` y `legend`. Cerrado.** (`assets/scaffold/styles/03-generic/_reset.scss`). Antes: nada. Después: `:where(fieldset) { border: 0; padding: 0; min-inline-size: 0 }` y `:where(legend) { padding: 0 }`. Razón: el borde, el padding y el `min-inline-size: min-content` del navegador hacen que un `fieldset` no encoja por debajo de su contenido y rompa a 320; el padding de la `legend` desalinea el texto con la columna. Aplicado en `src/styles` y en la skill del repo |
| 7     | **Anuncio real de `UI/Notice` en región viva.** Comprobar con NVDA y VoiceOver que Success (`role="status"`) y Error (`role="alert"`) se anuncian al aparecer sin mover el foco, y si se lee también «Cerrar aviso». En 4.2 solo se verificó la estructura: la región existe vacía antes del mensaje y el contenido se inserta dentro |
| 5 · T1 | **Ruta `/fuera-de-alcance`.** (Era de la fase 6, absorbida en la 5.) Destino de Ayuda, Cuenta, Iniciar sesión, Crear cuenta y «Cerrar sesión» (botón que navega). Hasta entonces, el kit llega al 404 de React Router |
| 7     | **Menú de cuenta y navegación con lector.** Que NVDA y VoiceOver anuncien «expandido/contraído» en el disparador y la página actual en las dos navs |
| 7     | **`hyphens: auto` en Nav Item.** Sin efecto en Edge sobre Windows (medido). Comprobar en Safari (iOS y macOS) y en Chrome Android |
| 7     | **Texto grande con el ajuste real del navegador.** Comprobar el modo con el tamaño de letra del navegador en escritorio (Chrome, Firefox, Safari) y en Android (Chrome, ajuste de tamaño de texto o zoom de página): que la barra pase al flujo en 320–430 con la letra grande y no al 100 % |
| 7     | **Favicon.** No está en el diseño y «Salvia» no existe como marca gráfica. La pestaña va sin icono hasta entonces; es un hueco declarado, no un olvido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| —     | **Deuda conocida: lista de primitivos a mano.** La regla de Stylelint que prohíbe primitivos fuera de `01-settings` enumera las familias de color (`neutral`, `sage`, `accent`, `success`, `red`, más `white` y `black`) en una expresión regular. Si entra una familia nueva, hay que añadirla ahí. No se deriva de `_tokens.scss` porque exigiría un script propio; con `color-no-hex` y `color-named` activos, el riesgo es bajo                                                                                                                                                                                                                                                                                                                     |
| 7     | **Desplazamiento del subrayado.** Hueco del diseño: `link/md` no lo declara. La regla base de `a` usa el del navegador; se decide mirando cómo queda el subrayado con Inter a 16 sobre los descendentes reales                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 7     | **Fallback de SPA en Netlify.** `public/_redirects` con `/* /index.html 200` (D12). Sin él, recargar en `/mis-citas` da 404 en producción. Recupera la carpeta `public/` junto con el favicon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7     | **Zona segura en un iPhone real.** `viewport-fit=cover` y `env(safe-area-inset-*)` en `c-app-layout` (laterales) y en su hueco de barra (inferior) no se pudieron probar: en headless `env()` vale 0. Comprobar en vertical y horizontal con notch que el contenido no queda bajo el notch, que la franja bajo el indicador de inicio se pinta con la superficie y que la barra no queda bajo él |
| 5 · V1a | **Título del vacío cuando `q` no es un área o especialidad.** El copy de 01.3 pone la consulta en minúsculas porque es una especialidad; `q` también busca por nombre (`q=Molina` daría «especialistas en molina»). Decidir la forma del título en V1a. Además, el foco tras «Buscar en toda la Ciudad de México» (vacío por colonia) es un cambio solo de `search` (D12): lo decide el plan de V1a |
| 5 · V1a | **Lista en carga completa.** Solo tiene `li aria-hidden`, y el lector anuncia «lista, 0 elementos». La vista decide cómo exponerla |
| 5 · V1a | **Foco al cambiar de página.** ¿`h1` por la regla de ruta, o `h2` «Resultados»? |
| 5 · V1a | **Foto de la tarjeta.** `sizes` (48 o 64 según el contenedor) y `loading="lazy"` por debajo del pliegue: `ResultCard` aún no lo expone |
| 7     | **Resultados con lector.** Conmutador «Avisarme» (desviación de la APG), foco tras «Ver más» y soporte real de `aria-busy` en NVDA y VoiceOver |
| 5 · V2a | **Foco al desaparecer «Semana anterior».** Mismo caso que «Mes anterior» en la navegación de semana, pero sin RAC: si el botón tenía el foco y deja de existir, el foco cae en `body`. Decidir el destino al construir el selector de la vista 2 |
| 5 · cierre | **Resto de pintado tras navegar en cliente (defecto 2 de 4.6, abierto; T0 cerró en la salida (c)).** De `/kit` a `/kit/fecha-hora` con el enlace del catálogo, al bajar al final se ven los avatares de `/kit` bajo la última Booking Bar; sin nodo en el DOM. Osvaldo lo reprodujo en su Chrome real (Windows, barra clásica), **sin CDP**: no es un defecto del arnés. **Ronda T0:** se reproduce de forma estable en `pnpm verify 4.6` (3 de 3: 4932 píxeles en x 68–304 · y 849–879 a 1350 con barra clásica, iguales a los 4 s; 0 a 375) y no en pasadas aisladas con Edge y perfil nuevos: 0 de 40 (dev a 1350 con las dos barras, dev a 375, Edge con ventana a 1350) y 0 de 40 con una preparación previa, una variable cada vez (letra del navegador a 24 y 32 y vuelta a 16; forced-colors; barras alternadas; 30 cargas completas). **Condición previa sin aislar.** La hipótesis de 4.6 («la primera navegación en cliente de la sesión») no se sostiene: lo dispara algún estado que deja la sesión larga. **Anterior a T0, sigue siendo cierto:** con `scrollTo` o un clic por script no sale; desaparece con el árbol de capas de CDP activo; hipótesis sin confirmar: el compositor de Chromium reutiliza teselas de la página anterior; no lo corrigen un fondo en `c-app-layout` ni en `html`, ni quitar el desplazador del calendario; la prueba `/kit` → `/kit/resultados` de 8087662 no llegó a hacerse. Candidatas sin probar: el barrido de 52 cargas a 320–345 con cambio de viewport que precede a la comprobación, y el perfil persistente de 4.6. La comprobación sigue en su sitio como ✗ declarado (`explicado: false`) y cada vista la repite en su navegación real (`navegacion.mjs`). Al cerrar la fase 5: probar las dos candidatas; si sigue sin aislar, Osvaldo decide entre límite declarado (seguimiento en la fase 7) u otra ronda |
| 5 · T1 | **Foco al cambiar de ruta.** D12 y § Constantes dicen que al navegar el foco va al `h1` de la vista (`id="contenido"`), pero no está implementado: solo lo hace el salto al contenido. Tras un clic en un enlace del catálogo el foco queda en `body` (medido en 4.7, `/kit` → `/kit/citas`; ✗ declarado en `pnpm verify 4.7`). Se implementa con las vistas |
| 5 · V4a | **Appointment Card entre 1024 y 1055 de viewport.** Medir en la vista 4 montada el paso Stacked → Row (1040, y 1055 con barra clásica), con acciones a ancho completo en el tramo (§ Contenedores, costes) |
| 5 · T1 | **Filtro de consola en `4.7-citas.mjs`.** El clic en «Reprogramar» llega al 404 de React Router y se filtran sus 2 errores de consola. Retirar el filtro cuando exista `/mis-citas/:id/reprogramar` |
| 5 · V4a | **Próximas vacía.** Si se cancelan todas las citas próximas, la sección no tiene diseño. En `/kit/citas` la sección desaparece (sin `h2` vacío); la vista 4 decide |
| 5 · V4a | **Subtítulo con 0 citas.** «Tienes 0 citas próximas» no existe en el diseño (sí «Tienes N citas próximas»; el singular «Tienes 1 cita próxima» es derivado). En el kit el subtítulo desaparece con 0; la vista 4 decide |
| 5 · T1 → V4b | **Flujos de foco contra la preview.** Método (`pnpm verify 5.N --preview`) en T1; cada bloque mide los suyos. `pnpm verify` corre contra `pnpm dev`, con `StrictMode`, que vuelve a ejecutar los efectos y puede ocultar un fallo de orden (docs/verificacion.md, Trampas). Medir contra `pnpm preview` los flujos de foco de las vistas que dependen del orden de los efectos: cierre del diálogo → título del aviso, «Ver más», resumen de errores, reserva fallida |
| 7     | **Foco devuelto al disparador tras `close()` en Safari y Firefox.** `UI/Dialog` lo devuelve de forma explícita (`returnFocus`) además del nativo; solo se midió en Edge |
| 7     | **`alertdialog` con lector.** Que NVDA y VoiceOver anuncien el título y el cuerpo al abrir (`aria-labelledby` y `aria-describedby`), y que el foco inicial en «Mantener mi cita» no tape el anuncio |
| 7     | **Calendario y horas con lector** (spike-rac § 4, más lo medido en 4.6): el `h2` oculto de RAC en la navegación por encabezados, el botón «Siguiente» oculto con VoiceOver por gestos, el posible doble anuncio de `aria-current="date"` junto al segmento «hoy» del nombre y el anuncio del mes al navegar |
| 7     | **Carga diferida por ruta.** 4.6 lleva el JS de 393 a 595 kB (gzip 121 → 183) y Vite avisa del chunk de más de 500 kB. Medido en 8087662 y en 4.6 |
| 7     | **Safari: foco y `scroll-padding`.** La verificación de 2.4.11 (fase 3) se hizo en Chromium (Edge headless, Tab real). Comprobar en Safari de macOS e iOS que al mover el foco con Tab y Shift+Tab el desplazamiento respeta `scroll-padding-block-end` (`--app-layout-bar-size`) y ningún elemento enfocado queda bajo la barra; repetir la contraprueba con el padding a 0 |
