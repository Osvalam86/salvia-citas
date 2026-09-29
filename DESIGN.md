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
- `Action Bar` (V2b, 02.4): su interior ya es una columna con la acción en
  FILL y la nota centrada; no cambia nada más. Medido con la letra a 24 y 32
  en 320 y a 20 en 375: estática al final del flujo, sin desborde.

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
| `empty-state-compact`  | la raíz de `c-empty-state` | 16.75rem (268) | Por debajo, marco con padding `space-4` | `tools.large-text` (18.75rem) menos el gutter (2rem): la raíz mide el viewport − 2rem. A 320 al 100 % mide 17,06rem con barra clásica y no se activa (con 18.75rem se activaría: 288 = 18rem, medido). Al 200 % a 320 el interior de la acción pasa de 45/60 a 77/92, el mismo límite que el CTA de Result Card (V1b) |
| `appointment-summary-compact` | la raíz de `c-appointment-summary` (sin padding) | 16.75rem (268) | Por debajo, tarjeta con padding `space-4` | El mismo valor y la misma derivación que `empty-state-compact`: la raíz mide el viewport − 2rem. Al 100 % a 320 mide 288 (273 con barra clásica, 17,06rem) y a 375, 343: no se activa y el padding sigue en 24 (02.4). Al 200 % a 320, con `space-5`, a la columna de los datos le quedaban 94 / 79 (superpuesta / clásica) y partía «10:30» (82), el dato principal de la pantalla; con `space-4`, 126 / 111 y cabe (V2b, contraprueba en `pnpm verify 5.2`) |
| `appointment-summary-wide` | la raíz de `c-appointment-summary` (sin padding) | 43.0625rem (689) | Datos en fila a `space-6`, padding `space-6` y gap `space-5`; con `--action`, el marco pasa de `__body` a `__card` y la acción va dentro con su ancho (04.4) | Criterio: que no parta un dato principal. Cuándo más ancho alcanzable («Miércoles 30 de mayo, 09:00», 221,4, entre las 1577 horas reservables hasta `MAX_DATE` y las citas sembradas) + Duración (84,4) + el nombre de clínica más largo («Consultorio Del Valle», 157,1), cada uno con icono 20 + 12, dos huecos de 32, padding 2 × 32 y bordes 2 = 688,9 (medido en V4a con las clases reales). La dirección, en caption, es secundaria y puede partir. Contraprueba en `pnpm verify 5.4`: a 688 en fila parte el nombre de la clínica; a 689, no. **Coste:** con el aside de la confirmación, la raíz mide viewport − 400; entre 1024 y 1088 de viewport (1103 con barra clásica) los datos van en columna y «Agregar a mi calendario» a ancho completo, un patrón móvil en escritorio (diseño §3.6), del mismo tipo que el de `appointment-card`; sin frame. Entre 1089 y ~1172 la dirección más larga va en dos líneas. 04.4 (848) no cambia |
| `empty-state`          | la raíz de `c-empty-state` (sin padding), en el hueco de la lista | 36rem (576) | Acción intrínseca | El mismo ancho en que Result Card pasa a Row con su CTA fijo. Figma solo da 343 (acción llena, 01.3) y 848 (intrínseca, 01.6) |
| `appointment-card` | el `li` de su sección                              | 40rem (640) | Stacked pasa a Row                  | Figma (descripción del maestro). Medido: a 640 al cuerpo de Row le quedan 342 y la línea más ancha, la ubicación con icono, mide 296; con 34rem (544) le quedaban 246 y partían la fecha y la ubicación |
| `dialog-compact`   | el velo (contenedor `dialog`)                      | 18.75rem (300) | Por debajo, el panel pierde el margen lateral y su padding baja a `space-4` | El valor de `tools.large-text` como container query: en rem sigue a la letra por los dos métodos, y con la letra a 16 solo se activa por debajo de 300 px (a 320 y 375 al 100 %, como Figma). Desde V1b la página no tiene barra con el diálogo abierto (§ Citas y diálogos): a 375 con la letra a 20 el velo mide 18.75rem con las dos barras y no es compacto (hasta V1b, con barra clásica medía 360 = 18rem y lo era). Medido a 320 con la letra a 32: sin el umbral, el interior del botón mide 47 y parte «cita»; con él, 143 con barra clásica (el velo, que se desplaza, pinta su propia barra de 15) y 158 con la superpuesta. Con la clásica aún parte «Mantener», más ancha que su interior; con la superpuesta, ninguna |
| `dialog`           | el velo                                            | 32rem (512) | Stacked pasa a Row                  | 480 de la variante Row + 16 + 16 de margen: es cuando cabe. El velo no lleva padding lateral: la query mide su caja de contenido, y el margen lo resta el panel |
| `slot-picker`      | la raíz de `c-slot-picker` (en escritorio, la celda de la rejilla que da ancho a la tarjeta) | 44.5625rem (713) | Por debajo, la tarjeta apila calendario y horas | Calendario 360 + hueco 32 + tres horas (3 × 77 + 2 × 12) + padding y bordes 66 = 713: el mínimo en que caben tres columnas (el contexto de Figma hablaba de 704 de interior, 770 de exterior). Con 44rem, entre 704 y 712 iban dos horas por fila (contraprueba en `pnpm verify 5.2`). **Coste:** el tramo 1024–1112 de viewport (1039–1127 con barra clásica) va apilado y no tiene frame en Figma. En móvil la raíz es el form y nunca alcanza el umbral (la columna mide como mucho 608) |

**Costes declarados de `appointment-card` (40rem).**

- En el tramo intermedio la columna mide como mucho 608: las citas van en Stacked hasta `lg`.
- Desde `lg`, con el aside de Mis citas, la columna mide viewport − 400: Row desde 1040 de
  viewport (1055 con barra clásica). Entre 1024 y 1039 (1054) van en Stacked con las acciones a
  ancho completo, un patrón móvil en escritorio (diseño §3.6). Sale de la cuenta de
  § Breakpoints. Medido en la vista montada (V4a, `pnpm verify 5.4`): a 1024 y 1039 (superpuesta)
  y 1054 (clásica), `li` de 624 / 639 / 639, Stacked, acciones de 590 / 605 / 605 y tarjeta de
  324; a 1040 y 1055, `li` de 640, Row, acciones de 224 y tarjeta de 212.
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
`--c-avatar-size`. Lo privado sigue en `--_*`. Hay tres clases:

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

**La fija un padre por CSS y el bloque no tiene variantes: sin `-default`.**
Sin modificadores, `-default` no protege nada: no hay ninguno que pueda
redeclarar la propiedad. El bloque la lee con un único valor por defecto y el
padre la fija en su elemento de mezcla. Hace falta cuando la mezcla perdería
en la cascada: el parcial del hijo se emite después (orden alfabético) y sus
propiedades ganan a las de la mezcla con la misma especificidad.

Caso: `--booking-details-direction`, `--booking-details-gap` y
`--booking-details-align` (`c-booking-details` las lee con `column`,
`var(--space-3)` y `stretch`), fijadas por `c-appointment-summary__details`
dentro de su `@container` `appointment-summary-wide` (04.4: datos en fila).

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
- **Destino del resumen de errores:** `c-field__label` y `c-legend` llevan
  `scroll-margin-block-start: var(--space-4)`: al desplazarse al inicio de la
  vista quedan a 16 del borde. Regla del kit (V3); no cambia nada visible.

---

## Controles con icono y etiqueta

**`flex-wrap: wrap` en todo control que pone iconos y etiqueta en fila: los
iconos bajan de línea antes de que la etiqueta parta palabras.** Con el texto
ampliado, el padding y los iconos crecen también (van en rem) y dejan a la
etiqueta sin ancho: al 200 % a 320, un botón con dos iconos le dejaba 46 px y
«Ver mes completo» salía letra a letra. Con la regla solo parte una palabra
más ancha que el interior del control entero. A tamaño normal no cambia nada:
todo cabe en una línea.

**Etiqueta que llena (V1b).** `UI/Button` envuelve su texto en `c-button__label`
con `flex-grow: 1` (Figma: Label en FILL en las acciones de bloque). En un botón
de ancho completo con icono, el icono queda junto al padding y el texto se centra
en el resto («Te avisaremos», 01.8: check a 25 del borde del CTA; Figma 24, ≠
dentro de ±1: el borde de 1 del botón va dentro en código). En un botón
intrínseco o sin icono no cambia nada. La etiqueta es flex con `space-2`: lo que
la pantalla pone junto al texto (la píldora del disparador) conserva el hueco y
baja con él. La regla del salto de línea no cambia: se decide sobre la base, no
sobre el crecimiento.

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

**Cabecera de resultados (V1a).** `align-items: last baseline`: el recuento
comparte línea base con el valor del select («Ordenar por»). `c-field` lleva
`align-self: last baseline` en el control; sin él, la línea base del campo
era la de sus iconos (el chevron, último de la celda) y el recuento caía 4 px
(cabecera de 83). Mide 79, no 78: la línea base del label (30 en su caja de
50) y la del select (31) difieren en 1 px, y Figma centra. El recuento mide al
menos `tools.control-block-size()` (borde + space-3 + interlineado de body-md
+ space-3 + borde): 50, y 98 con la letra a 32, como el control. Sin ese
mínimo, en el vacío de escritorio (sin «Ordenar por») la cabecera mediría 20
y el vacío subiría 30 (01.6). **No es la fuente única del 50:** `c-field` y
`c-button` llegan a él por su propio padding y no se tocan en V1a; `pnpm
verify 5.1` mide el recuento frente al control y detecta si divergen. Con la
letra a 32 en escritorio (el aside mide 640 y la columna 496), el orden baja
de línea: 98 + 32 + 154 = 284.

**Carga (V1a).** Con solo esqueletos, el `ul` entero va `aria-hidden` (si no,
el lector anuncia «lista, 0 elementos»); con tarjetas y esqueletos («Ver más»),
`aria-busy`. **Foco:** al llegar los datos, al nombre de la primera tarjeta
(la primera nueva con «Ver más») tras «Ver más», Page Link, «Ver todos los
especialistas», «Buscar en toda la Ciudad de México» (los dos con
`state.focus`) y «Limpiar filtros» del vacío (ref), siempre con
`preventScroll`: la tarjeta aparece donde estaba el botón o arriba, ya a la
vista. El foco se mueve en un efecto de layout, en el mismo commit que
desmonta el control pulsado: no pasa por `body` entre medias (tras V1b).
«Buscar», filtros y orden no lo mueven: su control sigue ahí y anuncia
la región del recuento. **Costes declarados:** «Buscar» con la misma consulta
no vuelve a anunciar si el recuento no cambia; con `?escenario=lenta`, los dos
enlaces y el botón del vacío desaparecen al navegar y el foco queda en `body`
1,5 s hasta que llega la primera tarjeta.

**Fotos (V1a).** `sizes="(min-width: 38rem) 4rem, 3rem"`: Row desde 36rem de
`li`, que por debajo de `lg` es el viewport menos 2rem de gutter; desde `lg`,
siempre Row. Con barra clásica, entre 608 y 622 pide la de 192 sin
necesitarla. Eager en las dos primeras tarjetas del corte (caben sobre el
pliegue en 1440 × 900), lazy en el resto y en las de «Ver más».

**Diferencias con Figma medidas (V1a).** El recuento «Buscando…» mide 81 y no
79: métrica de Inter Variable frente al Inter de Figma; es el ancho de su
texto, no construcción, y `pnpm verify 5.1` compara su posición y su alto. El
vacío de 01.3 mide 336 y no 308: con el copy entre comillas (diseño §5.1) el
título ocupa 3 líneas (84) en vez de 2 (56).

**Hoja «Filtrar y ordenar» (V1b).** `c-sheet`: `<dialog>` con `showModal()`, a
pantalla completa y sin velo; `role` dialog nombrado por su título, que recibe el
foco al abrir (panel 01.0). Cabecera y pie fijos, cuerpo con scroll; con texto
grande se desplaza la hoja entera (cabecera y pie en el flujo), la misma regla
que las barras del shell. El formulario envuelve cuerpo y pie: «Ver N» es un
`submit` nativo, sin `form=`. Borrador propio, nacido de la URL al abrir:
«Limpiar» vacía los filtros sin tocar la URL y conserva el orden; «Cerrar» y
Escape descartan; «Ver N resultados» aplica con `replace` y `preventScrollReset`.
El foco vuelve al disparador en los tres casos (Chromium lo devuelve solo al
cerrar el `<dialog>`; el explícito es el respaldo). «Ver N» es el total del
borrador, al momento también con `lenta` (vista previa, no búsqueda). El fondo es
`inert` y la región del recuento no se oye: la hoja lleva una región oculta que
anuncia «N resultados» desde el primer cambio (vacía al abrir). Al cruzar `lg`
con la hoja abierta, el disparador deja de existir (D7): la hoja se cierra y el
foco va al `h1` (respaldo de D12; sin ello, `body`, medido).
Medidas: cabecera 64 y pie 82 con el trazo dentro (`calc(space − 1px)`), «Cerrar»
con `margin-inline-end: calc(space-1 − space-4)` para que su glifo termine en el
borde de la columna (Figma: 4 a la derecha).
**Coste declarado:** por debajo de 338 px de viewport (barra superpuesta) o de
353 (clásica), «Ver N resultados» (187 de ancho mínimo) baja de línea y el pie
mide 144 en vez de 82 (a 320 al 100 %, medido). Figma solo da 375.

**Fila del disparador (V1b).** `c-results-header--trigger` centra (Figma
`items-center`) con `--_align`: con `last baseline`, sin contador (01.3) la línea
base del botón queda 1 px por debajo de la del recuento centrado en su ranura, la
cabecera mide 51 y el vacío baja 1; con contador coinciden (medido). El contador
cuenta opciones marcadas: dos especialidades cuentan 2; una ventana de
disponibilidad cuenta 1; el orden no cuenta (no es un filtro). El disparador mide
231,3 y 201,4 (Figma 233 y 202: ancho de texto, métrica de Inter Variable).

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
En Figma solo existe 375. Con «Confirmar hora» (167,3), el umbral sube a 368 /
383 y a 375 con barra clásica la barra también va en dos filas (§
Reprogramación (V4b), C7).

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

### Vista 2 (V2a)

**Estado y URL.** `useSlotPicker` (D2, `src/hooks/`): la URL da el estado
inicial y recibe cada selección con replace y `preventScrollReset` (con
radios, cada flecha selecciona). Semana y mes visibles no van a la URL. La hora
se escribe codificada (`hora=10%3A30`, `URLSearchParams`); las guardas de
`/confirmar` y `/datos` aceptan las dos formas (medido). Los envíos hacen push
con los parámetros de V1 y `escenario` (D1, D8).

**Fieldset «Elige fecha» (≠ panel 02.0).** El panel pide los botones de semana
fuera del grupo; el `fieldset` envuelve legend (D14), «Ver mes completo», la
navegación de semana y la tira, porque la legend va primero y así el DOM sigue
el orden visual. Coste: el lector dice «Elige fecha, grupo» al entrar en esos
botones, y es verdad.

**Fila de «Elige fecha» (coste declarado).** Legend (104,9) y «Ver mes
completo» (217,6) caben en una fila desde 334,5 de ancho útil: 367 de viewport
con barra superpuesta y 382 con la clásica (el contexto de 02.1 anota 8 px de
holgura, «en código flex-wrap»). Por debajo, el botón baja con su ancho
intrínseco, sin FILL; a 360 (Android) y a 375 con barra clásica, dos filas.
Esa es la diferencia declarada del par de 375 con barra clásica. El botón
encoge (`flex: 0 1 auto`) con el texto ampliado: con `flex: none`, al 200 % a
320 desbordaba 145–160 px.

**Navegación de semana.** Etiqueta («23 – 29 de abril»; entre dos meses, «30
de abril – 6 de mayo») y dos columnas fijas de 48: el control que queda
conserva su sitio cuando se omite el otro (§4.5), también «Semana anterior» en
la semana de `maxValue` (x 259 en las dos semanas, medido). La región viva de
la semana es un texto oculto que solo se escribe desde esos botones: al aplicar
la hoja con un día de otra semana se anuncia solo el `role="status"` de horas
(el día elegido), no los dos. Si el botón pulsado desaparece en un límite, el
foco pasa al otro en el mismo commit.

**Rodrigo, fuera de Figma (≠ declarado).** Su perfil solo se alcanza por URL
(la Result Card Full no enlaza). Sin hueco publicado, el selector empieza hoy
(D2) y el bloque sin horarios dice «No hay horarios libres publicados. El
próximo cupo se abre en mayo.», solo con «Avisarme…». Su `maxValue` es el lunes
30 de abril, así que en esa semana los días 1–6 de mayo quedan fuera de rango:
`UI/Day Chip` con aspecto de día pasado del calendario (body/md secundario,
borde transparente, sin hover), radio `disabled` (no enfocable) y nombre con
solo la fecha. «Semana siguiente» se omite en la semana de `maxValue`,
simétrica a «Semana anterior». En forced-colors el borde transparente se ve
(§3.2) y el chip se distingue por el peso, como el pasado.

**Sin horarios.** Copy derivado del de Figma: «La agenda del domingo 29 está
completa» (Figma solo da hoy); «El horario libre más cercano es el lunes 30, a
las 09:00.» («mañana» solo si es el día siguiente a hoy; el mes, solo si
cambia); «Ver horarios del lunes 30». El botón desaparece y el foco va a la
primera hora libre: el ListBox recién montado pinta sus opciones en un segundo
commit y `SlotList` espera con un MutationObserver (antes de pintar), que se
desconecta al encontrarla, al desmontar la lista o si cambia de día. En
escritorio las acciones van intrínsecas (§3.6, Figma 02.6) aunque la columna
mida menos de 36rem.

**Missing.** «Continuar» sin hora: móvil, Booking Bar en Missing; escritorio,
la nota se sustituye por `warning-circle` + «Elige un horario primero». Foco y
`aria-describedby` a la primera hora libre; sin horas, a «Ver horarios del …»;
sin hueco, a «Avisarme…». Missing persiste hasta elegir hora, también si
cambia el día (el mensaje sigue siendo cierto), y el describedby sigue al
destino; al elegir hora pasa a Chosen y se retira. `/kit/fecha-hora` aplica la
misma regla. En None, la meta dice «Elige un horario» con el día con horas y
«Elige un día con horarios» con el día lleno (`fullDay`); «Cuándo» dice «Sin
horario elegido» en los dos.

**Intro.** En un radio de la tira, envío implícito del form, que sale por su
botón por defecto: el de la barra, asociado con `form=` (contraprueba: un
`type="submit"` dentro del form, antes, se lleva el envío). Equivale a
«Continuar», con su validación. En el ListBox y en el calendario Intro
selecciona y no envía (sus opciones no son `input`).

**Meta de la Booking Bar (≠ declarado).** «Presencial · 30 min» para todos los
médicos, también los de «Presencial y videoconsulta»: la videoconsulta está
fuera de alcance y toda reserva es presencial (la vista 3 quitó el fieldset de
Modalidad por lo mismo).

**Hoja «Elige una fecha» (`c-sheet--bottom`).** Anclada abajo, con el alto de
su contenido y como mucho el del viewport; velo en el `::backdrop` al 45 %.
Borrador propio (D2); foco inicial en el día seleccionado (panel 02.0);
«Cerrar», Escape y un clic en el velo descartan y devuelven el foco a «Ver mes
completo». El velo cierra solo si el botón se pulsa y se suelta en él:
arrastrar desde la hoja y soltar fuera no cierra. Aplicar el mismo día
conserva la hora; otro día la borra y la tira pasa a su semana. Al cruzar `lg`
abierta se cierra y el foco va al `h1`, como cualquier foco que cae en `body`
al cambiar de control (tira y calendario, barra y «Tu cita», Back Link y
breadcrumb).

**Encabezado del perfil.** `c-page-header--profile` lleva media query en `lg`
(excepción declarada: es layout de página y cambia con el chrome, como
`page-title`): en móvil avatar Medium y `h1` en fila; desde `lg`, avatar Large
a la izquierda y nombre, especialidad y meta en columna. El avatar cambia de
`Size` por `useMediaQuery` (la variante lleva también el paso de la inicial).

**Texto al 200 % a 320.** Sin desborde; la tira en 3 columnas y las horas en
1. Solo parten palabras más anchas que su interior: «completo» en «Ver mes
completo» (interior 158 / 143), «Avisarme», «horarios», «martes», «libera» y
«hueco» en las acciones del bloque (92 / 77, el límite de
`empty-state-compact`) y «Continuar» en la barra (152,6 en 143). «completa»
(175,4 en un título de 175 con barra clásica) es la trampa del margen de +0,5
del detector, como «experiencia» en 4.5.

**Par de 02.6.** Tras el parche de Figma (Policy → `UI/Notice Info`, instancia
502:8952, clonada de 02.5), 02.6 mide 1440 × 914, igual que 02.5 y que el
código: «Antes de continuar» 320 × 158 en y 310 dentro del Aside (de 562 de
alto), Main 832. El
par es igual, sin diferencia declarada (Pendientes, parche de Figma 02.6).

### Vista 2 (V2b)

**Confirmación previa (02.4).** `ConfirmBooking.tsx` en `/confirmar`. Solo
navega: no hay formulario, así que «Cambiar fecha u hora» y «Continuar con tus
datos» son `<a>` (`Button` con `href`). El retroceso «{médico}» y «Cambiar»
llevan el mismo `href` (panel 02.0): el perfil con la selección, los parámetros
de V1 y `escenario`; «Continuar», `/datos` con todo ello. `bookingStepLoader`
devuelve la fecha y la hora validadas (la hora, decodificada).

**Resumen.** `c-appointment-summary`: quién (avatar Small decorativo, nombre,
especialidad y modalidad) y `c-booking-details`, el `dl` que comparte con «Tu
cita» (02.5). Sin encabezado: 02.4 no lo tiene. La especialidad es la del área
(`AREAS`, «Cardiología»), no la línea del perfil: es la columna «Especialidad»
de la §6 del diseño. La etiqueta es «Presencial» para todos: la modalidad de la
cita, no la del médico. Modalidad, duración, meta de la Booking Bar y política
salen de `src/data/booking.ts`, así que no pueden divergir. «Who» lleva el
trazo dentro de sus 102 (`calc(space-4 − 1px)`), como Figma.

**Escritorio (sin frame).** La ruta existe en cualquier viewport (D1). Desde lg
es la misma pantalla con el chrome de escritorio: breadcrumb «Especialistas /
{médico} / Confirma tu cita», pasos y `h1`, y el contenido en una columna de
38rem alineada con el `h1` (`c-booking-review`). 38rem son los 608 útiles del
tramo intermedio (40rem menos el gutter `space-4` a cada lado): la pantalla
móvil conserva su medida. Sin barra (solo existen bajo lg): «Continuar con tus
datos» y la nota van al final de `main`, intrínsecos (§3.6), como «Cambiar».
Medido a 1024 y 1440: columna de 608 × 662, envío de 235 y nota de 182, como
en 02.5. Al cruzar lg cambian de control el retroceso y el envío (D7): el foco
que cae en `body` va al `h1` (`useFocusFallback`, compartido con V2a).

**Texto al 200 % a 320.** Con `appointment-summary-compact` (§ Contenedores),
la tarjeta tiene 190 / 175 de interior y la columna de datos, 126 / 111: solo
parten palabras más anchas que su elemento («Confirma» en el `h1`,
«identificación.» en el aviso y, con barra clásica, «Duración», «minutos»,
«Obregón», «Presencial», «Continuar» y «reprogramar»).

---

## Encabezado de página (c-page-header)

Desde V3, regla general: la raíz separa el retroceso de lo que sigue a `space-2`
por debajo de lg (Back Link; Figma 02.1, 03.1) y a `space-4` desde lg
(breadcrumb; Figma 02.5, 03.3, 04.4), con media query en lg (excepción ya
declarada: layout de página que cambia con el chrome). Título y subtítulo van a
`space-2` en `__title-group` (Figma 04.1: Title Group), que solo existe con
subtítulo; pasos y h1, a `space-4` en `__heading` (02.4). `--profile` pierde su
regla de lg, que era la misma. **Cambio declarado:** 02.4 desde lg baja 8 px
desde los pasos (h1 de 190 a 198 en `pnpm verify 5.2`); 01.1, 01.5 y el resto de
5.0, 5.1 y 5.2, idénticos antes y después.

---

## Datos del paciente (V3)

**Validación (opción A).** Al enviar (§3.4): el form lleva `noValidate` y
`required` solo en nombre, correo, motivo y privacidad. Los errores son estado
de la vista y solo cambian al enviar: una casilla marcada conserva su error
hasta el siguiente envío (el kit ya la pinta marcada con el mensaje en error).
Copy fuera de Figma: «Escribe tu nombre completo», «Escribe tu correo
electrónico», «Escribe 10 dígitos o deja el campo vacío» y «Corrige 1 campo
para continuar».

**Resumen de errores** (`ErrorSummary.tsx` ↔ `c-error-summary`). Un div sin
rol; el foco va a su h2 (`tabIndex -1`, anillo de destino programático: con
teclado se ve, con ratón no), en un efecto de layout, sin desplazar, y el
resumen se lleva al inicio de la vista. Cada enlace es `<a href="#id">` con el
nombre del campo: el clic enfoca el control por script y desplaza su etiqueta
(o la legend, en una casilla) al inicio, sin entrada de historial (contraprueba:
el ancla nativa añade una entrada y el hash). Con la página de 03.2 (1474 en una
vista de 812) los destinos caen en el máximo de desplazamiento: la etiqueta de
«Correo» queda a 44 y no a 16; todas por encima de la barra.

**Reserva fallida.** Aviso Error sin role; el foco llega a su título en el mismo
commit que desmonta «Confirmar cita». El pie pasa a «Elegir otra hora» (enlace
al perfil con la fecha, sin hora, con V1 y `escenario`), sin nota. **≠
declarado:** por D4 reservar no cambia la disponibilidad, así que tras «Esa hora
ya está ocupada» el 10:30 vuelve a aparecer libre en el selector; D4 no se
reabre. Tras el fallo el form no tiene submit asociado: Intro no envía.

**Envío válido.** `submitBooking` reserva (D13) y reinicia el borrador (D17);
replace a `/citas/:id/confirmada` con V1 y `escenario`, sin fecha ni hora.
**Costes declarados:** Atrás desde 04.1 va a /confirmar (móvil) o al perfil
(escritorio), no a /datos; una reserva nueva (c6…) da 404 al recargar su
confirmación, porque el almacén se reinicia con la semilla (D13); c1 (Ruiz) sí
aguanta. La vista no se suscribe al borrador: lo lee al montar y le escribe cada
cambio. Suscrita, el reinicio pintaba un frame con el form vacío antes de salir
(medido en dev y preview; contraprueba en docs/verificacion.md).

**Separación de la rejilla (excepción declarada).** `c-patient-form__fields`
lleva `padding-block-start: calc(space-4 − space-1)`. La legend es el primer
hijo del fieldset y no se agrupa con su ayuda (UI/Legend en Figma sí las
agrupa), así que un solo `gap` no puede dar 4 entre legend y ayuda y 16 entre
ayuda y campos: el fieldset separa a `space-1` y la rejilla suma lo que falta.

**Escritorio.** Tarjeta `c-patient-form__card` (borde `color-border`,
`space-6`, `radius-md`) con media query en lg (excepción: layout de página; en
móvil los fieldsets van sobre la página). Rejilla `auto-fit` con
`minmax(min(20rem, 100%), 1fr)`: dos columnas desde 672 de interior, es decir
desde 1138 de viewport (1153 con barra clásica). **Coste declarado:** una
columna entre 1024 y 1137 (sin frame). Casillas a 30rem (Figma 480). «Tu cita»
reutiliza `c-booking-summary` con `AppointmentSummary` (`title`, `--aside`:
padding 16; 02.4 sigue en 24).

**Texto al 200 % a 320.** Sin desborde; solo parten «completabas» (cuerpo del
aviso Error) y, con barra clásica, «Confirmar» (interior de 143, como
«Continuar» en V2a), las dos más anchas que su elemento.

---

## Confirmación y Mis citas (V4a)

**Confirmación** (`BookingConfirmed.tsx`, 04.1 y 04.4). `PageHeader` con `success`:
la insignia (48, `color-success-surface`, check de 24 en `color-success`, decorativa) va
en `__headline` junto al grupo del título, apilada a `space-4` por debajo de lg y en fila a
`space-5` desde lg (media query: la excepción ya declarada de `c-page-header`). Pasos,
barra («Ver mis citas») y el sitio de «Qué sigue» cambian con `useMediaQuery` (D7); desde lg
van en una columna que reutiliza `c-booking-summary` (un `div`, sin landmark).
«Agregar a mi calendario» es la `action` de `AppointmentSummary`: presentación, no control,
así que cambia de sitio por container query (`appointment-summary-wide`, § Contenedores) y
conserva el nodo y el foco al cruzar lg (medido).

**Interruptor del marco (`c-appointment-summary--action`).** Con `action`, quién y los datos
van en `__body` y la acción es su hermana dentro de `__card`. Dos variables valen 1 o 0 y
multiplican el borde y el padding del elemento que las lee: `border: calc(var(--_frame-card, 1)
* 1px)` y `padding: calc(var(--_frame-card, 1) * …)` en `__card`; lo mismo con
`--_frame-body` en `__body`.

| Variable | Dónde se fija | Por debajo de `appointment-summary-wide` | Desde el umbral |
| --- | --- | --- | --- |
| `--_frame-card` | raíz con `--action` (0); `__card` en su `@container` (1) | 0: `__card` sin borde ni padding | 1: el marco en `__card` |
| `--_frame-body` | raíz con `--action` (1); `__body` en su `@container` (0) | 1: el marco en `__body` | 0: `__body` sin borde ni padding |

Sin `--action`, `--_frame-card` no existe y vale 1 por su respaldo, y `__body` no se pinta:
02.4 y 03.3 no cambian (regresión exacta en `pnpm verify 5.4`). Razones: el marco cambia de
elemento según el ancho, y un `@container` solo aplica a descendientes de la raíz, así que la
decisión se toma en `__card` y en `__body`; el modificador y la container query cambian
variables `--_`, no redeclaran propiedades (la regla de estados de `bemit-scss`); y el
`1px` es la excepción de `border`, la única unidad `px` permitida, que el `calc` escala a 0 sin
otro literal. Con la acción fuera, a ancho completo por el estirado de `__card`; desde el
umbral, `c-appointment-summary__action` le da su ancho (`align-self: flex-start`).

**Correo y recordatorio de la nota y de «Qué sigue».** Salen de la cita (`contact`, que
`submitBooking` copia del borrador antes de reiniciarlo, D17), no de la sesión: si se editó el
correo en la vista 3, la confirmación nombra el editado. El cuerpo de «Qué sigue»
(`nextStepsText`, `src/data/booking.ts`) depende del recordatorio y del plazo contra `NOW`:
con recordatorio y 24 h o más, el de Figma; sin recordatorio, «Puedes cancelar o reprogramar
sin costo desde Mis citas hasta 24 horas antes. Llega 10 minutos antes con una
identificación.»; a menos de 24 h (Mariana, hoy a las 19:15), «Puedes gestionar tu cita desde
Mis citas. Llega 10 minutos antes con una identificación.». «Mis citas» con espacio de no
separación en las tres (diseño §8).

**`.ics`** (`src/data/calendar.ts`): URI `data:` con `download="cita-salvia-AAAA-MM-DD.ics"`;
`DTSTART`/`DTEND` en UTC con Z (Ciudad de México, UTC−6 todo el año), `DTSTAMP` desde
`NOW`, `UID` `{id}@salvia.example`, `SUMMARY` «Cita con {nombre}», `LOCATION` «{clínica},
{dirección}, Ciudad de México», líneas de 75 octetos como mucho y CRLF. Nombre accesible
«Agregar a mi calendario (archivo .ics)» con el sufijo en `u-sr-only` (diseño §5.4).

**Texto al 200 % a 320.** Sin desborde; parten el h1 («reservada»), el correo de la nota,
«calendario» y el final del aviso, más anchos que su elemento. Con barra clásica, «enviaremos»
mide 175,08 en un párrafo de 175 y el detector lo marca como «pudiendo caber» por su margen de
+0,5 (docs/verificacion.md, Trampas), como «experiencia» en 4.5.

**Mis citas** (`MyAppointments.tsx`, 04.2, 04.5, 04.7–04.9). `c-my-appointments`: secciones
con `h2` en `heading/md` y la lista a `space-4`; el aside «Agendar otra cita» solo desde lg
(`<aside aria-labelledby>`, tras las secciones en el DOM). El aviso «Cita cancelada» es estado
de la vista, no del almacén: `cancel()` y el aviso en el mismo manejador, un solo commit (sonda
en `pnpm verify 5.4` y `--preview`: ningún lote de mutaciones ni frame con la tarjeta en
Pasadas sin el aviso, ni al revés; el foco en su título en ese commit). Con 0 citas próximas,
subtítulo «No tienes citas próximas» y sin sección Próximas (sin `h2` vacío).

---

## Reprogramación (V4b)

**Vista** (`Reschedule.tsx`, 02.7 y 02.8). Compone `SlotPicker` (D3) y pone fuera lo propio: Back Link
«Mis citas» en móvil, breadcrumb «Mis citas / Dr. Cortés» y la pestaña «Mis citas» como sección en
escritorio (diseño §5.4), sin pasos ni barra inferior. En móvil, la placa Info «Tu cita actual»
(`calendar-check`) tras el encabezado; en escritorio, «El cambio»: una `section` con `aria-labelledby`
dentro del form, no un `<aside>`, porque contiene el envío (panel 02.0, como «Tu cita»; diseño §5.4 la
llama aside). Su primera fila es «Nueva cita» con la línea «Antes:» (`BookingDetails` con `whenTerm`,
`previous` y `whenId`), la sigue el aviso Info «Al confirmar» y «Confirmar hora» intrínseco sin nota; en
Missing, el mensaje de la reserva. La placa y «Al confirmar» van con `headingLevel={null}`: títulos
nominales de contexto, como «Antes de continuar» (encabezados de 02.7: H1 · H2 Elige fecha · H2 Elige
hora). Cortés va con la inicial «I», sin foto (§6). El día de la cita actual no se marca en el selector:
el selector nunca recibe la cita (medido: el 16 tiene las mismas clases y ARIA que el 15 y el 18).

**Las dos fechas antes del envío (panel 02.0).** El envío las lleva en `aria-describedby`. Medido en el
árbol AX: en móvil, el resumen de la barra y la placa («jue 17 may · 17:00 Presencial · 30 min Tu cita
actual Miércoles 16 de mayo · 09:30. Al confirmar, esa hora se libera.», `BookingBar` con
`describedBy`); en escritorio, la fila «Nueva cita» («Nueva cita Jueves 17 de mayo, 17:00 Antes:
miércoles 16 de mayo, 09:30»).

**Copy** (`rescheduleCopy` y `rescheduledText`, `src/data/appointments.ts`). Para c3 del 16 de mayo a
las 09:30 al 17 a las 17:00, los cinco literales de Figma: la placa (I374:7459;371:7347), «Nueva cita»
(357:6871), «Antes:» (357:7295), «Al confirmar» (I376:7520;371:7347) y el aviso (descripción del
maestro `UI/Notice`, 334:8516, y diseño §7.2), cada uno con su aserción y su contraprueba en
`check-data`. **Derivado, fuera de Figma** (como `cancelCopy`): la placa, «Antes:», «Al confirmar» y
el aviso para c1 y las reservas nuevas, con el mismo patrón; «Al confirmar» sin hora elegida («Al
confirmar la nueva hora, se libera la del {día} a las {hora}. Puedes volver a cambiarla hasta 24 horas
antes.»: en un día lleno, «tu cita pasa al …» mentiría); y a menos de 24 horas de `NOW` sin la segunda
frase, como «Qué sigue» (V4a).

**Envío.** «Confirmar hora» con hora elegida reprograma en el almacén, que deja el aviso de un solo uso
(D13), y hace replace a `/mis-citas` con `state.focus` «aviso» (D12). Sin diálogo: reprogramar no es
destructivo (diseño §5.4). La vista lee la cita del loader y no se suscribe al almacén: el cambio justo
antes de navegar no vuelve a pintarla. Medido con una sonda (MutationObserver y
`requestAnimationFrame`, `pnpm verify 5.4` y `--preview`): ninguna muestra de la reprogramación con la
fecha nueva; el primer lote de Mis citas ya trae la tarjeta del 17, el aviso y el foco en su título;
ninguna muestra en body tras el envío. Contraprueba (manual): suscrita, 2 muestras con la placa en la
fecha nueva.

**Aviso «Cita reprogramada»** (pieza sin frame n.º 2). Lo consume `myAppointmentsLoader` (D13): una
vez por navegación a `/mis-citas`, antes del primer commit. En Mis citas hay un solo aviso a la vez, en
el sitio de «Cita cancelada», con la key `${tipo}-${id}`: reprogramar c3 y después cancelarla da otro
`Notice` y el foco llega a «Cita cancelada» (contraprueba manual: con la key igual al id de la cita, el
foco queda en body). **Decisión de V4b:** es cerrable, como «Cita cancelada» (§7.2 no lo dice). El
título lleva `id="aviso"` (`Notice` con `titleId`): el destino de `state.focus`.

**Cada entrada del historial tiene su aviso.** Entre dos entradas de `/mis-citas` (Atrás y Adelante
tras reprogramar, o un PUSH a la misma URL) la vista no se vuelve a montar y `useRouteFocus` no actúa
(mismo pathname): el estado del aviso se reinicia en el render cuando cambia `location.key`, al aviso
del loader, que ya es ninguno. Si el foco estaba en su título, cae en body y `useFocusFallback` (el de
cruzar lg, ahora con cualquier disparador) lo lleva al `h1` en el mismo commit; en una tarjeta, no se
mueve (medido, con su contraprueba). **Límite declarado:** el respaldo no distingue «el foco estaba en
el aviso» de «ya estaba en body»; en los dos casos va al `h1`.

**Costes y diferencias declarados.**

- **Atrás tras reprogramar no cambia de página (C3).** Con replace, el historial queda [Mis citas, Mis
  citas con el aviso] y Atrás vuelve a Mis citas sin el aviso, con el foco en el `h1` si estaba en él.
- **Una cita puede volver a su propia hora (C6, ≠ declarado).** Por D4 reprogramar no cambia la
  disponibilidad: c1 al 24 a las 10:30 o c3 otra vez al 17 a las 17:00 nombran dos fechas iguales en
  «Antes:», «Al confirmar» y el aviso (medido con las dos).
- **Barra con «Confirmar hora» (C7).** El botón mide 167,3 (Figma 167) y el resumen necesita 152 (§
  Fecha y hora, valores derivados): una fila desde 335,3 de interior, 368 de viewport con barra
  superpuesta y 383 con la clásica; por debajo, el botón baja y la barra mide 134. A 375 con barra
  clásica, dos filas (el par de 02.7 se mide con la superpuesta). Es el coste de la Booking Bar a 320
  (§ Fecha y hora) con el botón más ancho: con «Continuar», desde ~327 / ~342.
- **Ubicación de 02.8.** Mide 261,1 frente a 260 de Figma (métrica de Inter): se comparan su y y su
  alto, y la x de la modalidad no.

**Cruce de lg.** El `h1` es el mismo nodo (su padre no cambia: el perfil existe en las dos plataformas)
y el foco en la barra o en «El cambio» va al `h1` (medido, con contraprueba). **Texto al 200 % a 320:**
sin desborde; con barra clásica parten «Confirmar» y «completo» (interior de 143), más anchas que su
elemento. Con la letra del navegador a 24 y 32 a 320 y a 20 a 375, la barra es estática y nada parte
pudiendo caber.

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
- **Copy (V4a).** `cancelCopy` (`src/data/appointments.ts`) es la única fuente del cuerpo
  del diálogo y del aviso «Cita cancelada», para Mis citas y el kit. El de Molina es el literal
  de Figma (04.3, 04.8); el de Ruiz, Cortés y las reservas nuevas es **derivado, fuera de
  Figma**: el mismo patrón, con «el Dr.» o «la Dra.» según el tratamiento, y sin prometer
  cancelación sin costo (diseño §5.4). Aserción en `check-data`.
- **Página bloqueada (V1b).** `:where(html):has(dialog:modal) { overflow: hidden }`
  en `04-elements/_base.scss`, que vale también para la hoja `c-sheet`. Con barra
  clásica, el velo y la hoja miden el viewport entero (antes, viewport − 15, con
  la barra de la página activa a su derecha); la página de fondo se ensancha
  15 px bajo el velo: a 1440 el contenedor centrado se desplaza 7,5 y a 375 la
  columna pasa de 328 a 343. Al cerrar vuelve y `scrollY` se conserva (medido
  en 4.7 y 5.1). Con barra superpuesta no cambia nada. Cambia el caso límite de
  `dialog-compact` (§ Contenedores).

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

## Decisiones de arquitectura (D1–D17)

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
| `/citas/:id/confirmada`          | V4 · confirmación                        | —                                                                      | Id que no está en el almacén → 404. Cita que no está Confirmada → redirige a `/mis-citas` (V4a: una cancelada, pasada o pendiente no está «reservada») |
| `/mis-citas`                     | V4 · Mis citas                           | Diálogo, avisos de cancelada y reprogramada, menú de cuenta            | —                                                                                                                  |
| `/mis-citas/:id/reprogramar`     | V4b · reprogramación (selector de la V2) | Los de la V2                                                           | Id desconocido → 404. Cita que no está Confirmada → redirige a `/mis-citas` (solo Confirmed ofrece «Reprogramar») |
| `/fuera-de-alcance`              | Página genérica                          | —                                                                      | —                                                                                                                  |
| `*`                              | 404                                      | —                                                                      | —                                                                                                                  |

**404.** Ruta `*` y `throw` con estado 404 desde la guarda de la ruta, con el
mismo `errorElement`: `h1` «No encontramos esta página» y «Ir a
Especialistas».

**Redirecciones con `replace`, no con `redirect`.** Medido en T2: `redirect`
añade una entrada de historial (`idx` 1 en carga completa) y Atrás vuelve a
la URL que redirige, que redirige otra vez, sin salida; `replace` la
sustituye (`idx` 0) y Atrás vuelve a la página anterior. `pnpm verify 5.0`
lo comprueba.

Parámetros en la URL: en V1, `q`, `ubicacion`, filtros, `orden` y `pagina`;
de V2 a V4, `fecha` y `hora`. Razón: varias piezas del diseño son `<a>` y
necesitan un `href` real (Page Link, «Ver todos los especialistas», el Back
Link «Tu cita», «Cambiar fecha u hora»), y con la selección en la URL cada
página aguanta una recarga sin almacén global.

La paginación y «Ver más» comparten `pagina`: en escritorio se muestra el
corte de esa página, en móvil los resultados de 1 a `pagina × 4`. Así un
cambio de tamaño no pierde la posición.

**Historial y scroll de la vista 1 (V1a).** Push: «Buscar», Page Link, «Ver
todos los especialistas» y «Buscar en toda la Ciudad de México». Replace:
filtros, «Limpiar filtros» (aside y vacío), «Ordenar por» y «Ver más» (con
radios, cada flecha selecciona y un push por tecla llenaría el historial). Con
`preventScrollReset` (`<ScrollRestoration>` sube arriba en toda navegación sin
él, también si solo cambia `search`): «Buscar», filtros, «Limpiar filtros»,
orden y «Ver más». Page Link y los enlaces del vacío dejan que suba.

**`pagina` fuera de rango** se sujeta a la última página, sin tocar la URL.
Con `?escenario=lenta`, la paginación muestra la página cargada hasta que
llegan los datos: «Siguiente» hacia la última y «Anterior» hacia la primera
no desaparecen con el foco dentro.

`/especialistas/:slug/confirmar` existe en cualquier viewport, pero solo el
«Continuar» de móvil lleva a ella. Desde lg (V2b, sin frame): la misma
pantalla con el chrome de escritorio, breadcrumb «Especialistas / {médico} /
Confirma tu cita», columna de 38rem y acciones intrínsecas; sin barra, el envío
va al final de `main` (§ Fecha y hora, Vista 2 (V2b)).

**Retroceso con la consulta conservada** (panel 02.0: nombran adónde llevan,
nunca `history.back()`). Los parámetros de V1 (`q`, `ubicacion`, filtros,
`orden`, `pagina`) y `escenario` (D8) viajan sin cambios, junto a `fecha` y
`hora`, de V2 a V4; no comparten nombre. «Ver horarios» ya los lleva en su
`href` (`carriedParams` en `src/data/search.ts`, V1a). El Back Link y el breadcrumb «Especialistas» de V2, V3
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
  actual (el martes 15 de mayo): desde el lunes de esa semana y nunca antes
  de hoy; si la semana no tiene ninguno, el siguiente día con horas libres, y
  sin ninguno, la regla de la reserva (`rescheduleStartDate`, V4b, aserción en
  `check-data`). `useSlotPicker` lo recibe en la opción `initialDate`: un
  dato, no un modo (D3). `time` empieza en `null`. Figma 02.1
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
Implementado en V4b: `SlotPicker.tsx`, extraído de `Specialist.tsx` sin tocar
el DOM (`pnpm verify 5.2` y `--preview` idénticos a eff1632), lleva el form,
la tira, la hoja, el calendario, las horas y el bloque sin horarios; la vista
pone el estado (`useSlotPicker`), `missing`, el envío y la sección de
escritorio (`aside`).

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
escriben encima. Franjas: Mañana antes de las 12:00 y Tarde desde las 12:00 (`slotGroups`; sin
aserción, la cubren los pares de 02.1 y 02.5).
Reservar o reprogramar no cambia la disponibilidad (declarado).

**`publishedUntil`** por médico: límite de la generación y del selector
(`maxValue = min(MAX_DATE, publishedUntil)`, `bookableUntil` en
`availability.ts`; sin aserción en `check-data`: lo ejerce `pnpm verify 5.2`
en la semana de `maxValue` de Rodrigo). **Full** (Result Card) se
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

Clínicas: una por colonia (Condesa, Del Valle, Doctores, Nápoles, Pedregal,
Polanco, Roma Norte). «Clínica Doctores» y «Clínica Pedregal» sustituyen a
dos instituciones reales (diseño §6).

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

**Fotos de avatar (valor propio).** Recorte cuadrado por foto: de los ojos a
la barbilla, el 30 % del lado; los ojos al 40 % desde arriba; centrado en la
cara. Razón: una regla por la cabeza entera (pelo incluido) dejaba a Ruiz,
con el pelo recogido, más pequeña que Mariana a 48 y 64 px; midiendo la cara,
las tres quedan iguales (comparado renderizado). WebP simple (solo el trozo
VP8) a calidad 0,9, de 96 y 192 px.

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
- Slugs únicos. Citas: reservar con Ruiz reutiliza c1; una reserva nueva
  toma el siguiente id del contador (c6); cancel y reschedule cambian la
  cita; el aviso de reprogramada es de un solo uso; `ocupada` no toca el
  almacén; `lenta` tarda entre 1500 y 1700 ms.
- V4a: la reserva guarda el correo y el recordatorio del borrador; la c1 sembrada usa el
  respaldo (sesión y recordatorio); el orden de Próximas y Pasadas, también tras cancelar c2
  (04.8); el subtítulo con 3, 1 y 0; el copy de cancelar (Molina literal, Ruiz derivado);
  «Qué sigue» por recordatorio y por plazo (el límite de 24 h justas cuenta como «con plazo»);
  el `.ics` de c1 en UTC, CRLF y líneas de 75 octetos.

`--contrapruebas`: una mutación por aserción que la rompe (salvo las semanas,
un hecho del calendario).

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
hora). `c-page-header` (`PageHeader.tsx`) es el encabezado de página de las
vistas, sin ser de los 34: en T1 solo lleva `__title` (`page-title`); su API
crece vista por vista (V1a: `__subtitle`; V2a: `back`, el retroceso, y
`profile`, el perfil del médico con `--profile`). `c-empty-state` (`EmptyState.tsx`)
es el estado vacío de pantalla, sin ser de los 34: placa, título con
`headingLevel` (h2 en V1, h3 en el «sin horarios» de V2a), ayuda y acciones.
`c-search-form`, `c-search-filters` y `c-results-header` son patrones de la
vista 1 (`Search.tsx`), sin componente propio; `c-booking-summary`, de la
vista 2 (`Specialist.tsx`; `c-slot-picker` también hasta V4b, y desde V4b es
1:1 con `SlotPicker.tsx`, que componen la reserva y la reprogramación, D3), y `c-booking-review`,
de la confirmación previa (`ConfirmBooking.tsx`, V2b); `c-patient-form`, de la
vista 3 (`PatientData.tsx`), que reutiliza `c-booking-summary`.
`c-error-summary` (`ErrorSummary.tsx`) es el resumen de errores de la vista 3,
sin ser de los 34. Patrones de la reserva
con componente, sin ser de los 34 (V2b): `c-action-bar` (`ActionBar.tsx`, 02.4
y vista 3), `c-appointment-summary` (`AppointmentSummary.tsx`) y
`c-booking-details` (`BookingDetails.tsx`, el `dl` de «Tu cita» y de 02.4);
`BookingSteps.tsx` es la fila de pasos, sin bloque (`o-cluster`). La API de
`c-page-header` suma en V2b `steps`, los pasos sobre el `h1`
(`__heading`), y en V3 `__title-group`, título y subtítulo; la de
`AppointmentSummary`, `title` y `--aside`. `c-sheet` (`Sheet.tsx`)
es la hoja a pantalla completa (01.2), sin ser de los 34; su variante
inferior, `c-sheet--bottom`, es la del calendario (02.2, V2a).
`c-my-appointments` es el patrón de Mis citas (`MyAppointments.tsx`, V4a), sin componente
propio: secciones, título de sección y aside; la raíz se mezcla con `o-layout`. En V4a,
`c-page-header` suma `success` (`__headline` y `__badge`), `AppointmentSummary` suma
`action` (`--action`, `__body`, mezclas `__action` y `__details`) y `c-booking-details`
publica sus tres propiedades de fila (§ Custom properties públicas). En V4b, `BookingDetails` suma
`whenTerm`, `previous` (`c-booking-details__previous`) y `whenId`; `BookingBar`, `describedBy`; `Notice`,
`titleId`. Los hooks (`useDisclosure`, `useMediaQuery`, `useFocusFallback`, que hasta V4b se llamaba
`useLgFocusFallback`) viven
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
(volver de reprogramar → título del aviso) o, si solo cambia `search`, un
destino que resuelve la vista (V1a: `primer-resultado`, la primera tarjeta). **Si ese destino no existe, el
foco va al `h1`:** `history.state` sobrevive a la recarga y a Atrás, pero el
aviso del almacén no (D13). Medido en V4b (`pnpm verify 5.4` y `--preview`):
la recarga de `/mis-citas` tras reprogramar es una carga inicial, el hook no
actúa y el foco queda en `body` (con `state.focus` conservado); el respaldo
al `h1` se prueba con Atrás desde otra página hacia esa entrada.
**Coste asumido en POP:** el scroll se restaura y el foco va al `h1`, que
puede quedar fuera de la pantalla; el siguiente Tab sube arriba. Se acepta
porque sin mover el foco pasaría lo mismo, y así se anuncia la página.
Implementado en `useRouteFocus` (`src/hooks/`), llamado en la ruta raíz: su
`useEffect` corre después del efecto de layout de `<ScrollRestoration>`.

**D13 · La cita de la Dra. Ruiz.** El 24 a las 10:30 ya está en Mis citas como
Confirmada, y el flujo de reserva reserva justo esa cita. Almacén en memoria
sembrado con las 5 citas de la §6; completar el flujo **reemplaza** la cita de
Ruiz en lugar de duplicarla. Todo se reinicia al recargar.
La reserva **reutiliza el id sembrado** de la cita de Ruiz
(`c1`): así `/citas/:id/confirmada` aguanta una recarga, porque el almacén se
reinicia con la semilla y ese id sigue en ella. **Ids opacos:** c1–c5 para
las sembradas (Ruiz, Molina, Cortés, Ibarra, Serrano) y un contador para las
nuevas (c6…), de modo que la URL no lleva una fecha que pueda contradecir la
página. Reservar con Ruiz en otra fecha u hora conserva c1.
Los avisos que cruzan una navegación (reprogramada) son de un solo uso y
viven en el almacén, no en `history.state`: tras recargar, el almacén se
reinicia y el aviso no debe volver. Lo consume el loader de `/mis-citas`
(`myAppointmentsLoader`, V4b), no el render: una vez por navegación y antes
del primer commit (§ Reprogramación (V4b)).
**Contacto de la reserva (V4a).** Una reserva guarda el correo y el
recordatorio del borrador de D17 (`contact`), que la confirmación nombra. La
c1 sembrada no lo tiene: al recargar su confirmación, **respaldo declarado**,
el correo de la sesión y el recordatorio pedido (`contactOf`), como una
reserva anterior de Karla. Así 04.1 se mide por URL directa.

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
El catálogo también lleva título (2.4.2, va a producción): «Kit del sistema ·
Salvia» y «{h1} · Kit · Salvia». Medido en T1: React 19 coloca su `<title>`
antes del estático de `index.html` y lo retira al desmontar, así que
`document.title` es el de la vista; `<title>Salvia</title>` se queda en
`index.html` como respaldo sin JS.

**D16 · Avisos en memoria.** El conmutador «Avisarme» → «Te avisaremos» (diseño
§7.3) guarda su estado en `src/data/notify.ts`: almacén en memoria con clave por
médico, vacío al arrancar y reiniciado al recargar, como las citas (D13). Cruza
vistas: sobrevive a ir al perfil y volver (medido en `pnpm verify 5.1`).
Descartados: estado de la vista (se pierde al volver del perfil), URL (no es un
criterio de búsqueda) y `localStorage` (rompe el «todo se reinicia»).
«Avisarme si se libera un hueco» (V2a) usa la misma clave: el aviso es del
médico, no del día. El aviso activado desde la Result Card de Rodrigo se ve
también en su perfil (al que solo se llega por URL), medido en `pnpm verify
5.2`. `check-data`: vacío al empezar, dos toques vuelven al inicio y un
médico no toca a otro, cada uno con su contraprueba.

**D17 · Borrador de los datos del paciente.** Almacén en memoria
(`src/data/patient.ts`) que nace de la sesión (`src/data/session.ts`): nombre y
correo rellenos; teléfono, motivo y casillas vacíos (Figma 03.1). Cruza vistas
(el aviso de privacidad, «Elegir otra hora» → perfil → /datos) para que «Tus
datos se conservan» (03.5) diga la verdad; se reinicia al recargar y tras una
reserva correcta: `submitBooking` reserva y reinicia solo si sale bien. Los
errores no van en el borrador: son estado de la vista. La vista no se suscribe
(lo lee al montar y le escribe cada cambio; § Datos del paciente). Descartados:
estado de la vista (se pierde al salir), URL (datos personales en la URL) y
`localStorage` (rompe el «todo se reinicia»). `check-data`: nace de la sesión,
se reinicia con una reserva correcta y no con `ocupada`, cada una con su
contraprueba; la validación, con los escenarios de 03.2 y 03.5 y el teléfono.

---

## Pendientes anotados

| Fase  | Pendiente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4 ✓   | **`overflow-wrap: anywhere` en filas flex sin wrap. Cerrado en 4.7.** Con `anywhere` (reset, fase 3) un ítem flex encoge por debajo de su palabra más larga, así que en una fila sin `flex-wrap` el texto parte **dentro de la palabra** en vez de desbordar. Comprobado componente a componente de 4.1 a 4.7 al 200 % con las dos barras. **En 4.6**, a 320 al 100 % y al 200 % con las dos barras: ninguna palabra partida en días y números del calendario, mes, leyenda, chips (día de la semana y número), etiquetas de franja y horas; los números y horas llevan `white-space: nowrap` y las filas que los contienen pasan a menos columnas (tira, horas) o se desplazan (calendario) en vez de encoger. La Booking Bar (título, meta y botón), con la letra del navegador a 20, 24 y 32: sin palabras partidas. **En 4.7**, `UI/Appointment Card` a 320: sin palabras partidas al 100 %; al 200 % solo parten palabras más anchas que su elemento (interior de la tarjeta 175/190, de la acción 77/92), y la fila del avatar lleva `flex-wrap` (contraprueba: sin él, al nombre le quedan 55 y parten los 16 nombres). `UI/Dialog` con la letra a 24 y a 32 y al 200 % a 320: ninguna palabra partida pudiendo caber; con barra clásica a 32 parten «¿Cancelar», «Mantener» y «Cancelar», más anchas que su interior (226 y 128, con `dialog-compact`) |
| 5 · T2 ✓ | **Fotos de avatar. Cerrado en T2:** Mariana, Ruiz y Rodrigo, rostros generados con IA (Gemini); el resto con inicial. `<slug>-96.webp` y `-192.webp` en `src/assets/avatars/` (`src/data/photos.ts`, `srcset` con descriptores de ancho); recorte en D4; originales fuera del repo (`.avatares-originales/`, ignorada). `LICENSE-DOCS` las excluye de MIT y CC BY |
| 5 · V3 ✓ | **Atrás tras un ancla nativa no restaura el scroll. Cerrado en V3:** el resumen de errores enfoca el control por script y desplaza su etiqueta, sin entrada de historial (historial +0 en `pnpm verify 5.3`; contraprueba: el ancla nativa añade una entrada y el hash), así que el caso desaparece. El porqué de `<ScrollRestoration>` tras una navegación que no inició sigue sin verificar |
| 5 · V1a ✓ | **Línea base en la cabecera de resultados. Cerrado en V1a** (§ Búsqueda y resultados, cabecera): `last baseline`, con `align-self: last baseline` en el control de `c-field` y el recuento a `tools.control-block-size()`; cabecera de 79 (Figma 78, 1 px entre las dos líneas base) y 50 en el vacío. El panel 01.0 fija `align-items: last baseline`; `Search Row` y `Results Header` de escritorio alinean con MAX en Figma porque el archivo no tiene BASELINE (0 de 503 autolayouts horizontales en pantallas) |
| 5 · V1b ✓ | **Fila del disparador en 01.1, 01.3 y 01.4. Cerrado en V1b:** a ±1 px con `c-results-header--trigger` (centrado; § Búsqueda y resultados). Recuento a 15 y pegado a la derecha; con `last baseline`, 01.3 medía 51 (contraprueba en `pnpm verify 5.1`). Al 200 % a 320 y con la letra a 24 y 32, con las dos barras, el recuento baja de línea sin partir palabras que quepan y la lista no se solapa |
| 5 · V1b ✓ | **Hoja de filtros con replace y `preventScrollReset`. Cerrado en V1b:** «Ver N resultados» deja el mismo `idx` y el mismo `scrollY`, también con la página bloqueada bajo la hoja (medido en `pnpm verify 5.1`) |
| 5 · V1b ✓ | **Acción del vacío al 200 % a 320. Cerrado en V1b** con `empty-state-compact` (16.75rem, § Contenedores): interior de 77/92 (antes 45/60); al 100 % a 320 y 375 el marco sigue en 24 |
| 5 · V2a ✓ | **«Ver mes completo» y «Avisarme si se libera un hueco» al 200 % a 320. Cerrado en V2a como límite medido:** en la vista montada, interior de 158 / 143 (superpuesta / clásica) el primero y 92 / 77 las acciones del bloque sin horarios; solo parten palabras más anchas que su interior (§ Fecha y hora, Vista 2). El copy y el padding no cambian |
| 5 · T2 ✓ | **Opciones de Motivo de consulta. Cerrado en T2:** `src/data/reasons.ts` (D4). El diseño solo fija «Primera consulta» (valor de `UI/Field/Select` en la vista 3). El resto de opciones son datos: se proponen con la capa de datos, no se inventan en el componente |
| 5 · V3 ✓ | **Action Bar con envío. Cerrado en V3:** «Confirmar cita» es un `submit` con `form=` en `c-action-bar`, fuera del `form`. Intro en un campo envía por él, el botón por defecto (contraprueba: un `submit` anterior dentro del form se lleva el envío); la nota «Martes 24 de abril, 10:30 · Dra. Ruiz» va por `aria-describedby`. En la reserva fallida la barra lleva «Elegir otra hora» sin nota (74 de alto) y el form se queda sin submit: Intro no envía |
| 5 · V3 ✓ | **`noValidate` en el formulario de la vista 3. Cerrado en V3:** `required` solo en nombre, correo, motivo y privacidad; con `noValidate`, el resumen recibe el foco. Contraprueba en `pnpm verify 5.3`: sin él, el navegador bloquea el envío, el foco va a `#correo` y no hay resumen |
| 7     | **Ayuda de `UI/Legend` por `aria-describedby`.** Comprobar con NVDA y VoiceOver que la ayuda del fieldset («Todos los campos son obligatorios salvo…») se anuncia al entrar en el grupo, a través de `aria-describedby` en el `fieldset` |
| Skill ✓ | **Parche para `bemit-scss`: reset de `fieldset` y `legend`. Cerrado.** (`assets/scaffold/styles/03-generic/_reset.scss`). Antes: nada. Después: `:where(fieldset) { border: 0; padding: 0; min-inline-size: 0 }` y `:where(legend) { padding: 0 }`. Razón: el borde, el padding y el `min-inline-size: min-content` del navegador hacen que un `fieldset` no encoja por debajo de su contenido y rompa a 320; el padding de la `legend` desalinea el texto con la columna. Aplicado en `src/styles` y en la skill del repo |
| 7     | **Anuncio real de `UI/Notice` en región viva.** Comprobar con NVDA y VoiceOver que Success (`role="status"`) y Error (`role="alert"`) se anuncian al aparecer sin mover el foco, y si se lee también «Cerrar aviso». En 4.2 solo se verificó la estructura: la región existe vacía antes del mensaje y el contenido se inserta dentro |
| 5 · T1 ✓ | **Ruta `/fuera-de-alcance`. Cerrado en T1:** `h1` de §7.1 y «Ir a Especialistas» (`UI/Link` a `/`). (Era de la fase 6, absorbida en la 5.) Destino de Ayuda, Cuenta, Iniciar sesión, Crear cuenta y «Cerrar sesión» (botón que navega). Hasta entonces, el kit llega al 404 de React Router |
| 7     | **Menú de cuenta y navegación con lector.** Que NVDA y VoiceOver anuncien «expandido/contraído» en el disparador y la página actual en las dos navs |
| 7     | **`hyphens: auto` en Nav Item.** Sin efecto en Edge sobre Windows (medido). Comprobar en Safari (iOS y macOS) y en Chrome Android |
| 7     | **Texto grande con el ajuste real del navegador.** Comprobar el modo con el tamaño de letra del navegador en escritorio (Chrome, Firefox, Safari) y en Android (Chrome, ajuste de tamaño de texto o zoom de página): que la barra pase al flujo en 320–430 con la letra grande y no al 100 % |
| 7     | **Dos `<title>` en el head.** React 19 inserta el suyo antes del estático de `index.html` y los dos conviven (medido en T1); el HTML solo admite uno. Decidir en la auditoría: quitar el estático (sin título antes de que cargue el JS) o fijarlo con un hook que escriba `document.title` y quitar los `<title>` de React |
| 7     | **Favicon.** No está en el diseño y «Salvia» no existe como marca gráfica. La pestaña va sin icono hasta entonces; es un hueco declarado, no un olvido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| —     | **Deuda conocida: lista de primitivos a mano.** La regla de Stylelint que prohíbe primitivos fuera de `01-settings` enumera las familias de color (`neutral`, `sage`, `accent`, `success`, `red`, más `white` y `black`) en una expresión regular. Si entra una familia nueva, hay que añadirla ahí. No se deriva de `_tokens.scss` porque exigiría un script propio; con `color-no-hex` y `color-named` activos, el riesgo es bajo                                                                                                                                                                                                                                                                                                                     |
| 7     | **Desplazamiento del subrayado.** Hueco del diseño: `link/md` no lo declara. La regla base de `a` usa el del navegador; se decide mirando cómo queda el subrayado con Inter a 16 sobre los descendentes reales                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 7     | **Fallback de SPA en Netlify.** `public/_redirects` con `/* /index.html 200` (D12). Sin él, recargar en `/mis-citas` da 404 en producción. Recupera la carpeta `public/` junto con el favicon                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7     | **Zona segura en un iPhone real.** `viewport-fit=cover` y `env(safe-area-inset-*)` en `c-app-layout` (laterales) y en su hueco de barra (inferior) no se pudieron probar: en headless `env()` vale 0. Comprobar en vertical y horizontal con notch que el contenido no queda bajo el notch, que la franja bajo el indicador de inicio se pinta con la superficie y que la barra no queda bajo él |
| 5 · V1a ✓ | **Título del vacío cuando `q` no es un área. Cerrado en V1a:** «No encontramos especialistas para «{q}»» (y «… en {colonia}»), con `q` tal como se escribió; cambio frente a Figma declarado en diseño §5.1. El foco tras «Buscar en toda la Ciudad de México» va al nombre de la primera tarjeta (`state.focus`, D12) |
| 5 · V1a ✓ | **Lista en carga completa. Cerrado en V1a:** con solo esqueletos, el `ul` entero va `aria-hidden` (medido: el árbol solo tiene la lista de la barra inferior; contraprueba sin él: una lista de 0) |
| 5 · V1a ✓ | **Foco al cambiar de página. Cerrado en V1a:** ni el `h1` (obligaría a recorrer el formulario) ni el `h2` «Resultados» (visualmente oculto: su anillo no se vería, 2.4.7), sino el nombre de la primera tarjeta, el destino de «Ver más» |
| 5 · V1a ✓ | **Foto de la tarjeta. Cerrado en V1a:** `ResultCard` expone `photoSizes` y `photoLoading` (Avatar, `sizes`); la vista da `(min-width: 38rem) 4rem, 3rem` y eager solo en las dos primeras tarjetas (§ Búsqueda y resultados, fotos) |
| 5 · V2a ✓ | **El enlace de V2 a V3 conserva `escenario`. Cerrado en V2a:** «Continuar con tus datos» y «Continuar» llevan los parámetros de V1 y `escenario` a `/datos` y `/confirmar` (medido en `pnpm verify 5.2`). El salto `/confirmar` → `/datos` es de V2b y repite la prueba. **V2b ✓:** `/confirmar` → `/datos` con `escenario` y los parámetros de V1 (clic real, push, foco en su `h1`); un parámetro ajeno no viaja y, sin `escenario` en la URL, el `href` no lo lleva (contraprueba, `pnpm verify 5.2`) |
| Figma ✓ | **Figma 02.6: Policy → UI/Notice Info. Cerrado:** Osvaldo aplicó el parche (instancia 502:8952, clonada de 02.5). Validado por MCP: Notice 320 × 158 en y 310, Aside 562, Main 832 y frame 1440 × 914, igual que 02.5. Antes, 02.6 dibujaba «Antes de continuar» sin borde (156; frame de 912) y el par medía +2 px, ≠ declarado (C4). `pnpm verify 5.2` espera 914 en los dos frames |
| 7 | **Envío implícito con Intro en un radio en Firefox y Safari.** En Edge, Intro en un radio de la tira envía por el botón por defecto del form (el de la Booking Bar, por `form=`; § Fecha y hora, Vista 2). Comprobar que Firefox y Safari hacen el mismo envío implícito |
| 7 | **`last baseline` en Safari.** Cabecera de resultados y `c-field` (V1a) solo se midieron en Edge. Si no se soporta, la declaración se ignora y el recuento se centra en la cabecera: comprobar en Safari de macOS e iOS |
| 7     | **Resultados con lector.** Conmutador «Avisarme» (desviación de la APG), foco tras «Ver más» y soporte real de `aria-busy` en NVDA y VoiceOver |
| 5 · V2a ✓ | **Foco al desaparecer «Semana anterior». Cerrado en V2a:** el foco pasa a «Semana siguiente» en el mismo commit y la región de la semana la anuncia; lo simétrico en la semana de `maxValue` (medido en `pnpm verify 5.2` y `--preview`) |
| 5 · cierre | **Resto de pintado tras navegar en cliente (defecto 2 de 4.6, abierto; T0 cerró en la salida (c)).** De `/kit` a `/kit/fecha-hora` con el enlace del catálogo, al bajar al final se ven los avatares de `/kit` bajo la última Booking Bar; sin nodo en el DOM. Osvaldo lo reprodujo en su Chrome real (Windows, barra clásica), **sin CDP**: no es un defecto del arnés. **Ronda T0:** se reproduce de forma estable en `pnpm verify 4.6` (3 de 3: 4932 píxeles en x 68–304 · y 849–879 a 1350 con barra clásica, iguales a los 4 s; 0 a 375) y no en pasadas aisladas con Edge y perfil nuevos: 0 de 40 (dev a 1350 con las dos barras, dev a 375, Edge con ventana a 1350) y 0 de 40 con una preparación previa, una variable cada vez (letra del navegador a 24 y 32 y vuelta a 16; forced-colors; barras alternadas; 30 cargas completas). **Condición previa sin aislar.** La hipótesis de 4.6 («la primera navegación en cliente de la sesión») no se sostiene: lo dispara algún estado que deja la sesión larga. **Anterior a T0, sigue siendo cierto:** con `scrollTo` o un clic por script no sale; desaparece con el árbol de capas de CDP activo; hipótesis sin confirmar: el compositor de Chromium reutiliza teselas de la página anterior; no lo corrigen un fondo en `c-app-layout` ni en `html`, ni quitar el desplazador del calendario; la prueba `/kit` → `/kit/resultados` de 8087662 no llegó a hacerse. Candidatas sin probar: el barrido de 52 cargas a 320–345 con cambio de viewport que precede a la comprobación, y el perfil persistente de 4.6. La comprobación sigue en su sitio como ✗ declarado (`explicado: false`) y cada vista la repite en su navegación real (`navegacion.mjs`). **V1a:** `/kit/estados` → 01.1 en `pnpm verify 5.1`, 0 píxeles, ✗ declarado por la misma regla. **Tras V1b** (`pnpm dev` recién arrancado, Edge headless a 1350): 2793 px en 445,129 → 508,192, iguales a los 4 s, en 20 de 20 pasadas, 10 con el foco de la búsqueda en `useEffect` y 10 en `useLayoutEffect`: no depende de ese cambio. La caja es la foto de la Dra. Ruiz en la primera tarjeta; a simple vista, las dos capturas son iguales. Sin medir si es el mismo resto o una resolución distinta de la foto tomada de la caché (docs/verificacion.md, Trampas, «`sizes` y la caché de imágenes»). Al cerrar la fase 5, junto a las dos candidatas. En el cierre de V1b, con un `pnpm dev` de días, medía 0: el servidor recién arrancado no lo evita, al revés que la hipótesis de sesión larga. Desde V1a, 5.0 y 5.1 aparcan el puntero antes de cada captura (`park`): la portada tiene casillas al final y el puntero dejaba en `:hover` la que pasaba bajo él al bajar con la rueda (188 px en `/kit` → `/`, justo la caja de «Videoconsulta»); 4.6 no lo usa y sigue en 4932 px. **V2a:** desde que `/kit/fecha-hora` muestra la segunda variante None (90 px más de página), 4.6 mide 18632 px en 67,759 → 1267,879, iguales a los 4 s, en 2 de 2 pasadas: el mismo resto (avatares de `/kit` bajo la última Booking Bar), que ahora tapa la barra «Confirmar hora» entera; 01.1 → perfil en `pnpm verify 5.2`, 0 píxeles, ✗ declarado por la misma regla. **V2b:** 02.1 → 02.4 con «Continuar» (clic real, 375, barra clásica), 1484 px en 41,191 → 88,238, iguales a los 4 s: la foto de la Dra. Ruiz en «Who» (48 × 48); a simple vista, las dos capturas son iguales. Una sonda da la misma candidata (`elena-ruiz-arellano-96.webp`) tras navegar en cliente y tras recargar: no es la resolución elegida por la caché. ✗ declarado por la misma regla. **V3:** 02.4 → 03.1 con «Continuar con tus datos» (clic real, 375) en `pnpm verify 5.3`, 0 píxeles, ✗ declarado por la misma regla (`explicado: false`). **V4a:** 03.1 → 04.1 con el envío real (375, barra clásica) en `pnpm verify 5.4`, 0 píxeles, ✗ declarado por la misma regla. **V4b:** Mis citas → «Reprogramar» de la Dra. Ruiz (clic real, 375, barra clásica) en `pnpm verify 5.4`, 0 píxeles, ✗ declarado por la misma regla. **Hipótesis para el cierre de la fase 5 (sin investigar):** los restos medidos en vistas reales caen sobre la foto de la Dra. Ruiz (V1b, primera tarjeta, 2793 px; V2b, «Who», 1484 px) y los de 4.6, sobre avatares; descartada la resolución de la caché, apunta a la decodificación o el pintado de imágenes al navegar en cliente. Al cerrar la fase 5: probar las dos candidatas y esta hipótesis; si sigue sin aislar, Osvaldo decide entre límite declarado (seguimiento en la fase 7) u otra ronda |
| 5 · T1 ✓ | **Foco al cambiar de ruta. Cerrado en T1** (`useRouteFocus`, D12): PUSH, POP, `search`, carga inicial y `state.focus` medidos en `pnpm verify 5.0` y en `--preview`; 4.7 pasa a ✓ con la contraprueba manual (sin el hook, foco en `body`). D12 y § Constantes dicen que al navegar el foco va al `h1` de la vista (`id="contenido"`), pero no está implementado: solo lo hace el salto al contenido. Tras un clic en un enlace del catálogo el foco queda en `body` (medido en 4.7, `/kit` → `/kit/citas`; ✗ declarado en `pnpm verify 4.7`). Se implementa con las vistas |
| 5 · cierre | **El h1 se vuelve a montar al cruzar lg en la confirmación (V4a) y en la vista 3.** Su padre cambia: por debajo de lg los pasos van en `c-page-header__heading` junto al título; desde lg no hay pasos y `__heading` no existe. Con el foco en el h1, el nodo se desmonta y el foco lo recoge `useFocusFallback` en el mismo commit: medido en `pnpm verify 5.3` y `5.4` (y `--preview`), el h1 nuevo sin ningún lote de mutaciones en body; sin el hook, body (comprobación manual en docs/verificacion.md). En 02.4 los pasos existen en las dos plataformas y el h1 es el mismo nodo. La reprogramación (V4b) no le afecta: su h1 es el mismo nodo al cruzar (medido en `pnpm verify 5.4`, `nodoNuevo: false`). Opción estructural: `__heading` siempre presente en `PageHeader` (repasaría 5.0–5.3). El posible nuevo anuncio del h1 con lector al cruzar va a la fase 7 |
| 5 · V4a ✓ | **Appointment Card entre 1024 y 1055 de viewport. Cerrado en V4a como coste medido** (§ Contenedores, costes): Stacked con acciones a ancho completo a 1024 y 1039 (superpuesta) y 1054 (clásica), `li` de 624 / 639 / 639 y acciones de 590 / 605 / 605; Row desde 1040 (1055), `li` de 640 y acciones de 224. En `pnpm verify 5.4`, con capturas del tramo |
| 5 · T1 ✓ | **Filtro de consola en `4.7-citas.mjs`. Cerrado en T1:** «Reprogramar» llega a la ruta provisional con el foco en su `h1` y sin errores. El clic en «Reprogramar» llegaba al 404 de React Router y se filtraban sus 2 errores de consola; el filtro se retiró en T1. Desde V4b la ruta es la vista real y `pnpm verify 4.7` mide el foco en su h1 sin errores de consola |
| 5 · V4a ✓ | **Origen del correo de 04.1. Cerrado en V4a:** de la cita (`contact`, copiado del borrador antes de reiniciarlo), con el respaldo declarado de la c1 sembrada (D13). Medido con una reserva real: con «karla@otro.mx», la nota lo nombra; aserción y contraprueba en `check-data`. Arrastra el recordatorio: «Qué sigue» ya no promete uno que no se pidió (§ Confirmación y Mis citas) |
| 7 | **Anuncio del h2 del resumen de errores.** Comprobar con NVDA y VoiceOver que al recibir el foco se anuncia «Corrige N campos para continuar», encabezado de nivel 2. En el árbol de accesibilidad de Chromium, medido en `pnpm verify 5.3`: heading, nivel 2, enfocado |
| 5 · V4a ✓ | **Próximas vacía. Cerrado en V4a:** sin sección Próximas, como el kit (sin `h2` vacío). Medido cancelando las tres en `pnpm verify 5.4` y `--preview`: encabezados `H1 Mis citas`, `H2 Cita cancelada`, `H2 Pasadas`; las cinco en Pasadas; el foco en el título de cada aviso |
| 5 · V4a ✓ | **Subtítulo con 0 citas. Cerrado en V4a:** «No tienes citas próximas» (copy fuera de Figma, aprobado); «Tienes 1 cita próxima» en singular (`upcomingText`, aserción en `check-data` con 3, 1 y 0). El kit conserva su comportamiento (sin subtítulo con 0): el kit demuestra el componente, no el copy de la vista; unificarlo cambiaría las cifras de 4.7 |
| 5 · cierre | **`BOOKING_POLICY` a menos de 24 horas.** «Antes de continuar» en 02.4 y 02.5 promete «cancelar o reprogramar sin costo hasta 24 horas antes» también en una cita a menos de 24 h (Mariana, hoy a las 19:15, la primera hora del listado). La confirmación ya lo resuelve (`nextStepsText`, V4a); la política de la vista 2 no se tocó en V4a. **V4b:** una reserva nueva a menos de 24 horas (Mariana, hoy a las 19:15) ofrece «Reprogramar» en Mis citas aunque la política dice «hasta 24 horas antes»; «Al confirmar» de la reprogramación ya omite «Puedes volver a cambiarla…» a menos de 24 h. No se arregla en V4b |
| 7 | **`.ics` en Safari y en los calendarios.** La descarga con `<a download>` y URI `data:` se midió en Edge (`pnpm verify 5.4`). Comprobar en Safari de iOS y macOS que descarga o abre Calendario, y la importación en Google Calendar y Outlook (hora en UTC con Z, `LOCATION` con comas escapadas) |
| 5 · T1 → V4b ✓ | **Flujos de foco contra la preview. Cerrado en V4b.** Método hecho en T1 (`pnpm verify 5.N --preview`; 5.0: 5/5); cada bloque mide los suyos. `pnpm verify` corre contra `pnpm dev`, con `StrictMode`, que vuelve a ejecutar los efectos y puede ocultar un fallo de orden (docs/verificacion.md, Trampas). Medir contra `pnpm preview` los flujos de foco de las vistas que dependen del orden de los efectos: cierre del diálogo → título del aviso, «Ver más», resumen de errores, reserva fallida. **V2b:** 02.4 (llegada desde «Continuar» y cruce de lg en los dos sentidos, con su contraprueba) en `pnpm verify 5.2 --preview`, 6/6. **V3:** resumen de errores, reserva fallida, la sonda del envío válido (ningún frame con el form reiniciado) y el cruce de lg en `pnpm verify 5.3 --preview`, 4/4. **V4a:** confirmación (cruce de lg con su contraprueba y el h1 que se vuelve a montar), diálogo en la vista, sonda de cancelar (MutationObserver y `requestAnimationFrame`; contraprueba con `close()` en un efecto: `BODY`) y las tres próximas canceladas en `pnpm verify 5.4 --preview`, 6/6; el h1 de la vista 3 en `5.3 --preview`, 5/5. **V4b:** la sonda de «Confirmar hora», el POP entre las dos entradas de Mis citas (con su contraprueba), la recarga y Atrás desde otra página (respaldo al h1), reprogramar y cancelar la misma cita, Missing en escritorio y el cruce de lg en `pnpm verify 5.4 --preview`, 12/12 |
| 5 · V4b ✓ | **Aviso «Cita reprogramada» (pieza sin frame n.º 2). Cerrado en V4b** (§ Reprogramación (V4b)): tras «Confirmar hora», replace a Mis citas con el aviso y el foco en su título en el primer commit; ninguna muestra de la reprogramación con la fecha nueva ni en body tras el envío (sonda en `pnpm verify 5.4` y `--preview`); de un solo uso (loader, D13) |
| 5 · V4b ✓ | **Costes declarados de la reprogramación** (§ Reprogramación (V4b)): Atrás tras reprogramar vuelve a Mis citas sin el aviso, sin cambiar de página (C3); una cita puede volver a su propia hora y nombrar dos fechas iguales (C6, medido con c1 y c3); la barra con «Confirmar hora» va en una fila desde 368 / 383 y en dos a 375 con barra clásica (C7) |
| 7     | **Ciclo de Tab del diálogo en Firefox y Safari.** Comprobar que Tab y Mayús+Tab dentro de `UI/Dialog` recorren sus botones y, como mucho, salen a la interfaz del navegador, sin caer nunca en la página. En Edge con ventana, medido (docs/verificacion.md, comprobaciones manuales); en headless, `pnpm verify 4.7` |
| 7     | **Foco devuelto al disparador tras `close()` en Safari y Firefox.** `UI/Dialog` lo devuelve de forma explícita (`returnFocus`) además del nativo; solo se midió en Edge |
| 7     | **`alertdialog` con lector.** Que NVDA y VoiceOver anuncien el título y el cuerpo al abrir (`aria-labelledby` y `aria-describedby`), y que el foco inicial en «Mantener mi cita» no tape el anuncio |
| 7     | **Calendario y horas con lector** (spike-rac § 4, más lo medido en 4.6): el `h2` oculto de RAC en la navegación por encabezados, el botón «Siguiente» oculto con VoiceOver por gestos, el posible doble anuncio de `aria-current="date"` junto al segmento «hoy» del nombre y el anuncio del mes al navegar |
| 7     | **Carga diferida por ruta.** 4.6 lleva el JS de 393 a 595 kB (gzip 121 → 183) y Vite avisa del chunk de más de 500 kB. Medido en 8087662 y en 4.6 |
| 7     | **Safari: foco y `scroll-padding`.** La verificación de 2.4.11 (fase 3) se hizo en Chromium (Edge headless, Tab real). Comprobar en Safari de macOS e iOS que al mover el foco con Tab y Shift+Tab el desplazamiento respeta `scroll-padding-block-end` (`--app-layout-bar-size`) y ningún elemento enfocado queda bajo la barra; repetir la contraprueba con el padding a 0 |
| 5 · cierre | **`pnpm verify 4.4`, «Header/Desktop Signed-in … control a 16», con un `pnpm dev` de larga duración.** Contra el servidor de desarrollo que llevaba días arrancado, `/kit/navegacion?sesion=iniciada&actual=especialistas` cargaba en el Edge del arnés con `scrollY` 766 (el máximo) y el foco en `body`, y la medida daba −750 (61/62): 6 de 6 pasadas, en 7b1ceaa, 745f442, 0439ec3 y con V1b, y también sin `c-button__label`. En el navegador integrado cargaba en 0. Con `pnpm dev` recién arrancado: 62/62 en 3 de 3 (V1b). No es de la app ni de un commit: es un estado del servidor, sin aislar. Al cerrar la fase 5, junto a la ronda de T0: comprobar si reaparece con un servidor de larga duración y si comparte causa con el resto de pintado |
| 5 · V2a ✓ | **Variante inferior de `c-sheet`. Cerrado en V2a:** `c-sheet--bottom` sobre el mismo bloque (D5); 02.2 a ±1 px (§ Fecha y hora, Vista 2) |
| 7 | **Atrás con la hoja abierta** (filtros y calendario). En Chrome Android ≥ 120 el gesto Atrás dispara `cancel` en un `<dialog>` modal (CloseWatcher) y cerraría la hoja. Comprobar Atrás con la hoja abierta en Android (Chrome, Safari iOS) y el botón Atrás en escritorio estrecho |
| 7 | **Hoja de filtros con lector.** Foco en el título al abrir, la región oculta del borrador («N resultados») y los dos mensajes al aplicar (el nombre del disparador con «N filtros aplicados» y la región del recuento) |
| 7 | **Foco devuelto por la hoja en Safari y Firefox.** En Chromium lo devuelve el propio `<dialog>` al cerrar (la contraprueba de orden no discrimina); `Sheet` lo devuelve también de forma explícita |
| 5 · tras V1b ✓ | **Foco en `body` un instante al cambiar de página con `lenta`. Cerrado:** «Siguiente» 8 → 9 y «Anterior» 2 → 1 se desmontan en el commit que trae los datos, y el `useEffect` de foco corría en otra tarea, 0,4–1,7 ms después. Sonda con MutationObserver (dev y preview, 40 pasadas): al terminar el commit, el foco estaba en `body` en 40 de 40, con un frame pintado entre medias en 7. El muestreo de 100 ms de 5.1 lo veía en 3 de 10 pasadas (V1b). Con `useLayoutEffect`, el foco llega a la tarjeta en el mismo commit: sonda, `H3` en 40 de 40 y ningún frame con `body`. 5.1 lo mide ahora en el desmontaje (`focoAlDesmontar`): 10 de 10 en `pnpm verify 5.1` (el único ✗ es el declarado del resto de pintado) y 10 de 10 en `--preview` (16/16). Contraprueba con `useEffect`: `focoAlDesmontar` `BODY` en 10 de 10 pasadas, en las dos líneas (49/52) |
