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
  **Halo, solo sin header (7.6 · lote 6; desviación declarada de «nunca
  `box-shadow`» en el foco).** Cuando el salto va seguido directamente de
  `c-app-layout__main` (las páginas sin header: `/kit/*`), con el foco lleva
  `box-shadow: 0 0 0 var(--space-2) var(--color-surface)`. Ahí se superpone
  al contenido y la banda exterior del anillo caía sobre texto (11 paradas,
  grupo 4 del anillo contra vecinos, 7 con las dos bandas por debajo de 3).
  El anillo sigue siendo el `outline`; la sombra es fondo, se pinta bajo el
  fondo y el borde del propio enlace (un `::before` con `z-index` negativo
  quedaría encima de ellos) y la caja no cambia. Con header no hay halo: el
  anillo ya cae sobre la superficie del header, y el halo taparía el borde
  inferior del header móvil (64 de alto; el salto llega a 58 y el halo a 66):
  200 px del borde sin pintar en la raíz a 375 (medido en 7.6; a 1440, con el
  header de 82, no lo alcanza). Selector
  `.c-app-layout__skip:focus:where(:has(+ .c-app-layout__main))`: el `:where`
  deja la especificidad en (0,2,0). **En forced-colors el halo desaparece**
  (el navegador fuerza `box-shadow: none`) y queda el anillo del sistema, que
  en `/kit` vuelve a tocar el h1: coste declarado, el bloque B de 7.3 no corre
  en forced-colors.
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
- **Desplazamiento del subrayado: `text-underline-offset: 0.2em`** en la regla
  base de `a` (`04-elements/_links.scss`, 7.1). Valor fuera de Figma:
  `link/md` no lo declara. La regla base alcanza a todo `<a>`, también a
  `c-page-link` y `c-breadcrumb__link`.
  Elegido entre `auto`, `0.125em` y `0.2em` con capturas de enlaces
  subrayados reales (link/md a 16 y link/sm a 14, al 100 % y al 200 %,
  partidos en dos líneas a 320 y con foco de teclado). Es el único de los
  tres que deja de atravesar los descendentes a 16, a 14 y al 200 %: con
  `auto` el subrayado cae 1 fila por encima del fondo de la «p» y la «g», y
  con `0.125em` en la misma fila, y el navegador lo interrumpe alrededor del
  trazo. Con `0.2em` queda justo debajo. No toca la línea siguiente al partir
  y queda a ≥ 16 px del anillo de foco (16 a 17 al 100 %, 28 a 31 al 200 %).
  El grosor es el del navegador.
- **Favicon, icono de Apple e imagen OG** (7.1). No son tokens: vienen de
  Figma, Foundations, frame F.8 (`534:6514`), y de Cover, frame `534:6532`.
  «S» del wordmark (`heading/md`, Fraunces SemiBold dibujada a 25) en
  contornos, `color-on-action` sobre `color-action` (8,01:1, par de F.3). La
  letra ocupa el 62,5 % del lado en 16 y 32 y el 50 % en 180. Radios: 6 en 32
  (`radius/sm`) y 3 en 16 (la mitad, el SVG de 32 reducido). El de 180 va sin
  radio y opaco. Valor derivado de los tokens, sin variable propia. En
  `public/`: `favicon.svg` tal cual lo exporta Figma (fondo `#3B5740`, letra
  `fill="white"`, que es `#ffffff`), `apple-touch-icon.png` (180),
  `og-image.png` (1200 × 630) y `favicon.ico`, generado con
  `scripts/favicon-ico.mjs` a partir de los PNG de 16 y 32 de la carpeta de
  exportación de Figma (esos PNG no se versionan). Sin manifest.

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

**Un cuerpo de rejilla por mes (7.6).** `CalendarGridBody` lleva como `key` el
año y el mes de `focusedValue` (el mes visible): al cambiar de mes, con los
botones o con las flechas, se monta un `tbody` con celdas nuevas. Sin ella, RAC
reutiliza cada celda por posición (las 35 de mayo eran nodos de abril), y
NVDA con Firefox anunció en mayo el estado que la celda tenía en abril («no
disponible», «seleccionado»; fila de Pendientes). Con la key, de oído en
Firefox, ya no (una pasada tras el deploy del lote 7). La `table`, su nombre, la cabecera y la
región del mes de la hoja siguen siendo los mismos nodos; el foco sigue en un
día de la rejilla en cada paso y Fin (`weekEdge`) no cambia (`pnpm verify 4.6`
y `5.2`).

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

Desde el cierre de la fase 5, `__heading` existe en toda vista sin perfil, con pasos o
sin ellos: en V3 y V4a los pasos solo van bajo lg, y así el h1 no cambia de padre ni se
vuelve a montar al cruzar lg (`nodoNuevo: false` en `pnpm verify 5.3` y `5.4`;
contraprueba manual: sin el envoltorio, `true`). Geometría de las 9 rutas (D1 y el
404, a 375 y 1440 con las dos barras), idéntica a la línea base: 4006 elementos, 0
distintos. `useFocusFallback` se queda: lo siguen necesitando la barra y el retroceso
(D7).

---

## Datos del paciente (V3)

**Validación (opción A).** Al enviar (§3.4): el form lleva `noValidate` y
`aria-required` (desde 7.6; antes `required`) solo en nombre, correo, motivo y
privacidad. Los errores son estado
de la vista y solo cambian al enviar: una casilla marcada conserva su error
hasta el siguiente envío (el kit ya la pinta marcada con el mensaje en error).
Copy fuera de Figma: «Escribe tu nombre completo», «Escribe tu correo
electrónico», «Escribe 10 dígitos o deja el campo vacío» y «Corrige 1 campo
para continuar».

**Obligatorio sin validez nativa (7.6, desviación declarada de `semantic-markup`,
que pide el nativo antes que ARIA).** `FieldText`, `FieldSelect` y `Checkbox`
reciben `required` y escriben `aria-required="true"`, no `required`; el correo
es `type="text"` con `inputMode="email"`, `autoComplete="email"`,
`autoCapitalize="none"` y sin corrector, y `email` sale de la unión `type` de
`FieldText`. **Razón:** el `required` nativo deja un campo vacío en `:invalid`
desde la carga, y un `type="email"` con un valor a medias también, y el navegador
expone esa validez al lector aunque el form tenga `noValidate`: «requerido
entrada inválida» en el motivo y la privacidad con NVDA en Firefox 157 y en
Chrome 154, en el fieldset en Firefox y en el correo al teclear la primera letra
(7.4). `aria-invalid="false"` no lo anula en Firefox. Choca con la validación al
enviar (§3.4): «entrada inválida» solo con error, que marca `aria-invalid`.
**Coste:** sin validación nativa de respaldo (no la había: `noValidate`) y sin
el tipo email semántico. El teclado de correo y el autocompletado se conservan
con `inputMode` y `autoComplete`. Medido en `pnpm verify 5.3`: con la carga
completa nada es `:invalid`, ningún obligatorio es inválido en el árbol AX y
los textbox son requeridos (CDP no lista `required` en el combobox ni en el
checkbox, tampoco con el nativo: ahí se comprueba `aria-required`). Lo que oye
NVDA, tras el deploy.

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

## Política a menos de 24 horas (cierre de la fase 5)

`policyText` (`src/data/booking.ts`) da el cuerpo de «Antes de continuar» en 02.4, en «Tu cita» de
02.5 y 02.6 y en «Tu cita» de 03.3. Con 24 horas o más contra `NOW` (`inFreeWindow`, ≥), o sin hora
elegida, `BOOKING_POLICY`: el literal de Figma, leído por MCP (02.4 I374:7444;371:7347, 02.5
I376:7505;371:7347, 03.3 I376:7543;371:7347 y, como cruce, 02.6 I502:8952;371:7347; `policyFigma` en
`check-data`). A menos de 24 horas, `LATE_POLICY`: la frase de «Qué sigue» aprobada en V4a. `nextStepsText`
y `rescheduleCopy` usan el mismo plazo, con sus literales sin cambiar.

**Costes declarados.**

- Antes de reservar a menos de 24 horas ya no se informa de que no hay gratuidad: el texto omite la
  promesa y no afirma ningún coste.
- En 02.5 y 02.6 el cuerpo cambia al elegir hora y no se anuncia (aviso Info sin role).
- Al elegir una hora a menos de 24 horas, «Tu cita» encoge 24 px (562 → 538) y «Continuar con tus datos»
  sube 24 px (y 788 → 764), en None (02.5) y en Missing (02.6), a 1440. Es un cambio iniciado por la
  persona, no un fallo de WCAG. El aviso mide 134 con `LATE_POLICY` y 158 con la general: medido en 02.4 a
  375 (aviso de 343 de ancho) y en 03.3 a 1440 (320 de ancho); solo ahí. Los pares no se mueven: se miden
  con el 24 a las 10:30.
- «Reprogramar» a menos de 24 horas se mantiene en Mis citas: la política limita el coste, no la acción,
  y ningún texto de Mis citas promete la gratuidad (diseño §5.4, «Plazo de 24 horas»).

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

## Decisiones de arquitectura (D1–D18)

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
esa gestión pelea con la posición que recuerda el navegador. Con `getKey`
(`RootLayout`, cierre de la fase 5), las cargas completas se guardan por
`pathname + search` y la navegación en cliente por `location.key`: con la
clave «default» de React Router, toda carga completa en la misma pestaña
heredaba el scroll de la anterior (4.4 cargaba `/kit/navegacion` en 766, el
máximo, con el foco en body). **Matiz:** una URL que se vuelve a escribir en
la misma pestaña restaura su posición anterior, como una recarga.

**Fallback en Netlify (7.0).** `public/_redirects`: las rutas de D1, `/kit` y
`/kit/*` sirven `index.html` con 200; el resto, con 404
(`/* /index.html 404`), y React Router pinta el 404 de D1. Medido en
`/especialistas` y `/citas`: `/x/*` casa también con `/x` y `/x/`, así que
esas dos, con y sin barra final, llevan su 404 antes de los comodines.
**Coste declarado:** los comodines dan 200 a un slug o id desconocido y a
rutas más profundas inventadas (`/especialistas/no-existe`, `/kit/a/b`,
`/citas/c1/x/y`); la app pinta el 404, pero el estado HTTP es 200. Caché
`immutable` solo en `/assets/*`; `index.html` queda con la de Netlify
(`max-age=0, must-revalidate`). Medido en `pnpm verify 7.0` (9/9 contra
producción, 27e0eff).

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

**D15 · Títulos de página** (2.4.2), con `useDocumentTitle` (`src/hooks/`)
en cada vista: «Especialistas · Salvia», «{Nombre del médico} · Salvia», «Confirma tu cita ·
Salvia», «Tus datos · Salvia», «Cita reservada · Salvia» (Figma, panel
04.0), «Mis citas · Salvia», «Reprogramar cita · {Nombre del médico} ·
Salvia», «Fuera del caso de estudio · Salvia» y «No encontramos esta página ·
Salvia».
El catálogo también lleva título (2.4.2, va a producción): «Kit del sistema ·
Salvia» y «{h1} · Kit · Salvia». **Un solo `<title>` (7.1):** el hook
escribe `document.title` en un efecto de layout, así que reutiliza el
estático de `index.html` («Salvia», el respaldo sin JS) y el título cambia en
el mismo commit que el `h1`, antes del foco de ruta. Hasta 7.1 cada vista
ponía un `<title>` de React 19, que se colocaba antes del estático sin
sustituirlo: dos en el head (medido en T1 y en la línea base de 7.1, las 16
rutas), y el HTML solo admite uno. `pnpm verify 5.0` cuenta uno por ruta, en
D1 y en `/kit/*`, con contraprueba.

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

**D18 · División del JS (7.2).** Un chunk por librería, estático:
`build.rolldownOptions.output.codeSplitting` en `vite.config.ts` con tres grupos,
`react` (React, React DOM y scheduler, prioridad 3, para que ningún otro grupo lo
arrastre con sus dependencias), `react-router` y `react-aria` (React Aria, React
Stately e @internationalized). La app se queda en la entrada; Rolldown añade
`rolldown-runtime` (0,58 kB, el interop CommonJS que comparten los chunks). La
entrada los importa de forma estática y Vite los precarga con `modulepreload`
en `index.html`: se piden en paralelo, sin ronda extra. Build: `react` 218,84 kB
(gzip 68,25), `react-aria` 190,35 (57,86), `index` 170,71 (54,25) y
`react-router` 96,33 (31,66); ninguno pasa de 500 kB y desaparece el aviso de
Vite (antes, un solo `index` de 677,05, gzip 211,68). El CSS no cambia.

**Descartada: carga diferida por ruta** (`lazy` por objeto de React Router, solo
el componente, con loaders y guardas estáticos; rama `7.2-lazy`, 3816c6f, que se
conserva como registro). Bajaba el JS de la carga de `/` (430 331 B
decodificados frente a 677 057), pero añade una ronda: el chunk de la ruta se
pide cuando la entrada ya se ha ejecutado. Medido en HTTP/2 (branch deploy
frente a producción; 562,5 ms de latencia, 1474,56 / 675 kbit/s, mediana de 5):
carga completa hasta el h1, +291 ms en `/` y +622 en el perfil; con la CPU ×4,
+317 y +647; primera visita en cliente, de +627 a +1234 ms sin indicador.
**«Menos JS en `/`» no se alcanza:** con la división estática, la carga descarga
lo mismo (676 837 B en 5 archivos).

Medido 7.2 (3423e78) frente a producción, con el mismo perfil y el umbral de
+50 ms: carga completa, +29 y +8 ms en `/` (sin límite de CPU y ×4) y +8 y +9 en
el perfil; primera visita en cliente, entre −2 y 0 ms.

**Caché:** con un cambio que solo toca la app (medido con un literal de texto),
los tres chunks de librería y el runtime conservan su hash y solo cambia `index`.
Un cambio que use otra exportación de una librería no se ha medido.

**En producción (fdc8337, 29 sep).** Sirve `index-DgeRHP-Q.js` con los cuatro
`modulepreload` (`rolldown-runtime`, `react`, `react-router` y `react-aria`) e
`index-D1ACGvU6.css`. `pnpm verify 7.0` 14/14 y los `--preview` de 5.0 a 5.4,
8/8, 16/16, 6/6, 5/5 y 12/12, las cifras de 7.0 (fila del fallback en
Pendientes). `/.netlify/scripts/hud` en 0 de 16 cargas y `favicon.ico` como
`image/vnd.microsoft.icon`. El comentario «hosted on Netlify» no está en
`index.html` (lo inyecta Netlify); medido en 7.2, aparece en producción y no en
los branch deploys. Lighthouse de Osvaldo, dato sin criterio: en producción
(incógnito, móvil, mediana de tres, 29 sep, 21:53–21:55), rendimiento 98,
accesibilidad 96, buenas prácticas 100 y SEO 100, FCP y LCP 1,9 s; antes de 7.2
(b4c3274, incógnito, una pasada), móvil el 29 sep a las 18:07, 98 / 96 / 100 / 100,
FCP y LCP 1,9 s, y escritorio el 29 sep a las 18:08, 100 / 100 / 100 / 100. El
96 de accesibilidad: Lighthouse marca «objetivos táctiles» (2.5.8) en «Ver
horarios» y en la barra inferior. Hipótesis sin medir: falso positivo por la
barra fija; se mide en 7.3.

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
| 5 · V3 ✓ | **`noValidate` en el formulario de la vista 3. Cerrado en V3:** `required` solo en nombre, correo, motivo y privacidad; con `noValidate`, el resumen recibe el foco. Contraprueba en `pnpm verify 5.3`: sin él, el navegador bloquea el envío, el foco va a `#correo` y no hay resumen. **Desde 7.6** los obligatorios llevan `aria-required` y el correo es text (§ Datos del paciente, desviación declarada): la contraprueba inyecta `required` en los cuatro en los dos brazos y, sin `noValidate`, el navegador bloquea en `#motivo` (el correo «karla@» ya no es inválido) |
| 7 · 7.4 ✓ | **Ayuda de `UI/Legend` por `aria-describedby`, con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 con Firefox 157.0 y con Chrome 154, Windows 11 26H2; docs/auditoria-manual.md, N2.1 y el hallazgo tras N2.2): al entrar en el grupo se oye «Datos del paciente agrupación … Todos los campos son obligatorios salvo los marcados como opcionales». Con Chrome, «Datos del paciente agrupación Todos los campos son obligatorios salvo los marcados como opcionales». El «entrada inválida» del grupo antes de enviar (solo Firefox) es una fila de 7.6 (hallazgo de 7.4) |
| 7 · sin dispositivo | **Ayuda de `UI/Legend` con VoiceOver.** Sin Mac ni iPhone en 7.4; la mitad NVDA, cerrada en 7.4 |
| Skill ✓ | **Parche para `bemit-scss`: reset de `fieldset` y `legend`. Cerrado.** (`assets/scaffold/styles/03-generic/_reset.scss`). Antes: nada. Después: `:where(fieldset) { border: 0; padding: 0; min-inline-size: 0 }` y `:where(legend) { padding: 0 }`. Razón: el borde, el padding y el `min-inline-size: min-content` del navegador hacen que un `fieldset` no encoja por debajo de su contenido y rompa a 320; el padding de la `legend` desalinea el texto con la columna. Aplicado en `src/styles` y en la skill del repo |
| 7 · 7.4 ✓ | **Anuncio real de `UI/Notice` en región viva, con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N2.5): el Success de `/kit` (`role="status"`) se oye al aparecer con el foco quieto en el disparador, «Aviso activado Te avisaremos por correo si se libera un hueco con la Dra. Ruiz. Cerrar aviso»: también lee «Cerrar aviso». Error con `role="alert"`: N/A, ninguna ruta lo monta en región viva (los Error van con foco: «Esa hora ya está ocupada encabezado nivel 2», N2.4b). NVDA + Chrome, sin medir en 7.4 |
| 7 · sin dispositivo | **Anuncio de `UI/Notice` en región viva con VoiceOver.** Sin Mac ni iPhone en 7.4 |
| 5 · T1 ✓ | **Ruta `/fuera-de-alcance`. Cerrado en T1:** `h1` de §7.1 y «Ir a Especialistas» (`UI/Link` a `/`). (Era de la fase 6, absorbida en la 5.) Destino de Ayuda, Cuenta, Iniciar sesión, Crear cuenta y «Cerrar sesión» (botón que navega). Hasta entonces, el kit llega al 404 de React Router |
| 7 · 7.4 ✓ | **Menú de cuenta y navegación con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N1.1–N1.4): «Karla Sánchez botón contraído» → «expandido» → tras Escape, «contraído» con el foco en el botón; la página actual en las dos navs («Especialistas … enlace página actual») y la sección actual, «Mis citas visitado enlace actual» (`aria-current="true"`). NVDA + Chrome, sin medir en 7.4 |
| 7 · sin dispositivo | **Menú de cuenta y navegación con VoiceOver.** Sin Mac ni iPhone en 7.4 |
| 7 | **`hyphens: auto` en Nav Item, en Chrome Android: sin medir en 7.4** (A.4, recorte). Sin efecto en Edge sobre Windows (medido) |
| 7 · sin dispositivo | **`hyphens: auto` en Nav Item, en Safari (iOS y macOS).** Sin Mac ni iPhone en 7.4 |
| 7 · 7.4 ✓ | **Texto grande con la letra real de Firefox, a 375. Cerrado en 7.4** (Firefox 157.0, Windows 11 26H2, 1 oct 2026; docs/auditoria-manual.md, K.7 b–c; RDM 375 × 900, `/fuera-de-alcance`, una pasada por medida): con la letra del navegador a 32 y el zoom al 100 %, `letraRaiz` 32px, `modoTextoGrande` true, `posicionBarra` static (`barraInicio` 832, `scrollY` 0); a 16, 16px, false, sticky (836). Los anchos 320 y 430, sin medir en 7.4 |
| 7 | **Texto grande con el ajuste real de Chrome (escritorio) y de Chrome Android: sin medir en 7.4** (C.3 y A.2, recorte). Que la barra pase al flujo en 320–430 con la letra grande y no al 100 % |
| 7 · sin dispositivo | **Texto grande con la letra real de Safari.** Sin Mac ni iPhone en 7.4 |
| 7 ✓ | **Dos `<title>` en el head. Cerrado en 7.1** con `useDocumentTitle` (D15): escribe `document.title` en el `<title>` estático de `index.html` y se quitan los `<title>` de React. En la línea base (97fed8a) las 16 rutas (9 de D1 y 7 de `/kit`) tenían 2; con el hook, 1. `pnpm verify 5.0` lo cuenta en D1, en `/kit/*` y tras navegar en cliente, con contraprueba (un `<title>` antepuesto da 2 y `document.title` pasa a ser el suyo): 29/29 en dev y 8/8 en `--preview` contra producción (411a7d0) |
| 7 ✓ | **Favicon. Cerrado en 7.1:** «S» del wordmark sobre `color-action` (Figma F.8 `534:6514`), con icono de Apple e imagen OG (Cover `534:6532`); valor derivado en § Constantes. `pnpm verify 7.0` 14/14 contra producción (411a7d0): los cuatro archivos con 200, su tipo y los mismos bytes que `public/` (`.ico` servido como `image/vnd.microsoft.icon`), contraprueba de un icono que no existe (404, `text/html`), los tres `<link>` y las 15 `<meta>` con su texto aprobado; `og:image` resuelve (200, `image/png`, 1200 × 630) |
| —     | **Deuda conocida: lista de primitivos a mano.** La regla de Stylelint que prohíbe primitivos fuera de `01-settings` enumera las familias de color (`neutral`, `sage`, `accent`, `success`, `red`, más `white` y `black`) en una expresión regular. Si entra una familia nueva, hay que añadirla ahí. No se deriva de `_tokens.scss` porque exigiría un script propio; con `color-no-hex` y `color-named` activos, el riesgo es bajo                                                                                                                                                                                                                                                                                                                     |
| 7 ✓ | **Desplazamiento del subrayado. Cerrado en 7.1:** `text-underline-offset: 0.2em` en la regla base de `a`, valor fuera de Figma con su razón medida en § Constantes. `pnpm verify 4.1` (49/49) y `4.4` (64/64): 3,2 px a 16 y 2,8 px a 14, con contraprueba (`auto` inyectado da `auto`); el resto de secciones, iguales a la línea base |
| 7 ✓ | **Fallback de SPA en Netlify. Cerrado en 7.0** con 404 real (D12): rutas de D1 y `/kit/*` con 200, el resto con 404, y `/especialistas` y `/citas` (con y sin barra) con su regla antes de los comodines; `pnpm verify 7.0` 9/9 contra producción (27e0eff), estado HTTP con `fetch`. Coste de los comodines declarado en D12 y medido. Los `--preview` de 5.0 a 5.4 contra producción: 8/8, 16/16, 6/6, 5/5 y 12/12. `public/` vuelve con `_redirects`; el favicon, en 7.1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 7 · sin dispositivo | **Zona segura en un iPhone real.** `viewport-fit=cover` y `env(safe-area-inset-*)` en `c-app-layout` (laterales) y en su hueco de barra (inferior) no se pudieron probar: en headless `env()` vale 0. Comprobar en vertical y horizontal con notch que el contenido no queda bajo el notch, que la franja bajo el indicador de inicio se pinta con la superficie y que la barra no queda bajo él. Sin iPhone en 7.4; el dato de Android (A.5), sin medir |
| 5 · V1a ✓ | **Título del vacío cuando `q` no es un área. Cerrado en V1a:** «No encontramos especialistas para «{q}»» (y «… en {colonia}»), con `q` tal como se escribió; cambio frente a Figma declarado en diseño §5.1. El foco tras «Buscar en toda la Ciudad de México» va al nombre de la primera tarjeta (`state.focus`, D12) |
| 5 · V1a ✓ | **Lista en carga completa. Cerrado en V1a:** con solo esqueletos, el `ul` entero va `aria-hidden` (medido: el árbol solo tiene la lista de la barra inferior; contraprueba sin él: una lista de 0) |
| 5 · V1a ✓ | **Foco al cambiar de página. Cerrado en V1a:** ni el `h1` (obligaría a recorrer el formulario) ni el `h2` «Resultados» (visualmente oculto: su anillo no se vería, 2.4.7), sino el nombre de la primera tarjeta, el destino de «Ver más» |
| 5 · V1a ✓ | **Foto de la tarjeta. Cerrado en V1a:** `ResultCard` expone `photoSizes` y `photoLoading` (Avatar, `sizes`); la vista da `(min-width: 38rem) 4rem, 3rem` y eager solo en las dos primeras tarjetas (§ Búsqueda y resultados, fotos) |
| 5 · V2a ✓ | **El enlace de V2 a V3 conserva `escenario`. Cerrado en V2a:** «Continuar con tus datos» y «Continuar» llevan los parámetros de V1 y `escenario` a `/datos` y `/confirmar` (medido en `pnpm verify 5.2`). El salto `/confirmar` → `/datos` es de V2b y repite la prueba. **V2b ✓:** `/confirmar` → `/datos` con `escenario` y los parámetros de V1 (clic real, push, foco en su `h1`); un parámetro ajeno no viaja y, sin `escenario` en la URL, el `href` no lo lleva (contraprueba, `pnpm verify 5.2`) |
| Figma ✓ | **Figma 02.6: Policy → UI/Notice Info. Cerrado:** Osvaldo aplicó el parche (instancia 502:8952, clonada de 02.5). Validado por MCP: Notice 320 × 158 en y 310, Aside 562, Main 832 y frame 1440 × 914, igual que 02.5. Antes, 02.6 dibujaba «Antes de continuar» sin borde (156; frame de 912) y el par medía +2 px, ≠ declarado (C4). `pnpm verify 5.2` espera 914 en los dos frames |
| 7 · 7.4 ✓ | **Envío implícito con Intro en un radio, en Firefox. Cerrado en 7.4** (1 oct 2026; Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, K.4 a): a 200 % (chrome móvil), → en la tira e Intro dan Missing, con el foco en la 09:00 del miércoles 25 y la URL sin hora (`fecha=2029-04-25`); sin envío implícito el foco se habría quedado en el radio. El caso con hora (K.4 b, a `/confirmar`), sin medir en 7.4 |
| 7 · sin dispositivo | **Envío implícito con Intro en un radio, en Safari.** Sin Mac ni iPhone en 7.4 |
| 7 · sin dispositivo | **`last baseline` en Safari.** Cabecera de resultados y `c-field` (V1a) solo se midieron en Edge. Si no se soporta, la declaración se ignora y el recuento se centra en la cabecera: comprobar en Safari de macOS e iOS. Sin Mac ni iPhone en 7.4; el dato de Firefox (K.9), sin medir |
| 7 · 7.4 ✓ | **Resultados con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N1.5–N1.8; N1.7 también con Chrome 154): «Avisarme botón conmutador sin pulsar Dr. Rodrigo Alcántara Vela» → «pulsado», «Te avisaremos» (anuncia el estado y la etiqueta nueva, la desviación de la APG); tras «Ver más especialistas», el foco en «Dra. Adriana Zamora Nieto encabezado nivel 3»; `aria-busy`: silencio durante la carga, y Firefox dice «lista procesando» al llegar el foco (Chrome no); «34 resultados» al terminar la carga con `lenta` |
| 7 · sin dispositivo | **Resultados con VoiceOver.** Sin Mac ni iPhone en 7.4 |
| 5 · V2a ✓ | **Foco al desaparecer «Semana anterior». Cerrado en V2a:** el foco pasa a «Semana siguiente» en el mismo commit y la región de la semana la anuncia; lo simétrico en la semana de `maxValue` (medido en `pnpm verify 5.2` y `--preview`) |
| 7 | **Resto de pintado tras navegar en cliente (defecto 2 de 4.6, ✗ declarado; medido en el cierre de la fase 5).** Son dos fenómenos. (1) **En las vistas, remuestreo de una foto ya decodificada en la página de origen:** la misma foto con otro filtrado, delta ≤ 39 y ningún píxel > 64 (01.1: 2793 px; 02.4: 1484). Probado en V2b: con la foto bloqueada en el origen, 0 de 5; V1b no tiene contraprueba propia, porque aislada da 0. (2) **En 4.6, un resto real:** avatares de `/kit` bajo la última Booking Bar, delta 230. **Condición:** origen arriba → 0; origen desplazado (rueda o `scrollTo`) → resto al llegar; que persista depende de la sesión (0 a los 4 s en pasadas aisladas, 2 de 2; 12632 en la sesión de 4.6). El «teclado previo» que T0 no aisló solo bajaba `/kit/fecha-hora`, y la carga completa de `/kit` heredaba ese scroll por la clave «default» de `<ScrollRestoration>` (D12); con `getKey`, desde un origen arriba mide 0 (receta: 18632 px sin `getKey`, 0 con él, 3 de 3 cada una). **Corrige a T0:** con `scrollTo` sí sale (`/kit` en 1782: 2 de 2). Pasadas: la ronda de 60, 16 de comprobación acotada (10, 5 y 1) y 17 contrapruebas del tramo 4 y del cierre. **Criterio del arnés:** delta > 64 en cualquier punto de la página (`navegacion.mjs`); las vistas pasan a ✓, con contrapruebas (un resto inyectado sobre la foto de «Who» y 4.6). **Alcance de las vistas:** medido desde 01.1 desplazada a 1350 (`scrollY` 561, el máximo de 01.1; «Ver horarios» de la tarjeta 3, la última con enlace): 0 al llegar y a los 4 s, en 3 de 3; a 375 solo se midió 4.6 con `/kit` desplazado (0); no medido con desplazamientos mayores. La prueba discrimina porque en `/kit` el resto aparece al llegar también en pasadas aisladas. **✗ declarado** en `pnpm verify 4.6` (origen desplazado, `/kit` en 1600: al llegar 12632 px > 64, delta 230; a los 4 s, 12632 en la sesión). Mecanismo sin aislar (compositor). **Fase 7:** comprobar en Chrome real con `/kit` desplazado, y una vista con un desplazamiento del orden del de `/kit`. **Medido en 7.3 contra producción (a8f4931):** las vistas, 0 (desde `/?q=Cardiología&pagina=9` desplazada a 375, 34 tarjetas, «Ver horarios» de la última, 3 de 3, con contraprueba); `/kit` con la receta de 4.6 y el origen fijado en 1600 con `scrollTo` (el clic sale del enlace centrado: 5751 a 1350 y 7085 a 375), a 1350, 12632 px con delta 230 al llegar y a los 4 s en 3 de 3, y a 375, 0; `pnpm verify 4.6` contra dev, lo mismo (1350: 12632; 375: 0). El resto es real en el build: ✗ declarado de `/kit` (D9: va a producción) en `pnpm verify 4.6` y `7.3`. Chrome real, sin medir en 7.4 (tramo C, recorte) |
| 5 · T1 ✓ | **Foco al cambiar de ruta. Cerrado en T1** (`useRouteFocus`, D12): PUSH, POP, `search`, carga inicial y `state.focus` medidos en `pnpm verify 5.0` y en `--preview`; 4.7 pasa a ✓ con la contraprueba manual (sin el hook, foco en `body`). D12 y § Constantes dicen que al navegar el foco va al `h1` de la vista (`id="contenido"`), pero no está implementado: solo lo hace el salto al contenido. Tras un clic en un enlace del catálogo el foco queda en `body` (medido en 4.7, `/kit` → `/kit/citas`; ✗ declarado en `pnpm verify 4.7`). Se implementa con las vistas |
| 5 · cierre ✓ | **El h1 se vuelve a montar al cruzar lg en la confirmación (V4a) y en la vista 3. Cerrado en el cierre de la fase 5** con `__heading` siempre presente en `PageHeader` (§ Encabezado de página, opción A): el mismo h1 al cruzar, sin ningún lote en body (`nodoNuevo: false` en `pnpm verify 5.3` y `5.4`, dev y `--preview`); contraprueba manual: sin el envoltorio, `nodoNuevo: true` en 03.1 y 04.1. Geometría de las 9 rutas idéntica a la línea base (4006 elementos, 0 distintos). `useFocusFallback` se queda (barra y retroceso, D7): sin él, con el foco en el h1 se queda en el h1 y con «Ver mis citas», body. El posible nuevo anuncio del h1 al cruzar ya no aplica |
| 5 · V4a ✓ | **Appointment Card entre 1024 y 1055 de viewport. Cerrado en V4a como coste medido** (§ Contenedores, costes): Stacked con acciones a ancho completo a 1024 y 1039 (superpuesta) y 1054 (clásica), `li` de 624 / 639 / 639 y acciones de 590 / 605 / 605; Row desde 1040 (1055), `li` de 640 y acciones de 224. En `pnpm verify 5.4`, con capturas del tramo |
| 5 · T1 ✓ | **Filtro de consola en `4.7-citas.mjs`. Cerrado en T1:** «Reprogramar» llega a la ruta provisional con el foco en su `h1` y sin errores. El clic en «Reprogramar» llegaba al 404 de React Router y se filtraban sus 2 errores de consola; el filtro se retiró en T1. Desde V4b la ruta es la vista real y `pnpm verify 4.7` mide el foco en su h1 sin errores de consola |
| 5 · V4a ✓ | **Origen del correo de 04.1. Cerrado en V4a:** de la cita (`contact`, copiado del borrador antes de reiniciarlo), con el respaldo declarado de la c1 sembrada (D13). Medido con una reserva real: con «karla@otro.mx», la nota lo nombra; aserción y contraprueba en `check-data`. Arrastra el recordatorio: «Qué sigue» ya no promete uno que no se pidió (§ Confirmación y Mis citas) |
| 7 · 7.4 ✓ | **Anuncio del h2 del resumen de errores con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N2.2): «Corrige 3 campos para continuar encabezado nivel 2», con el foco; Tab: «lista con 3 elementos Correo electrónico misma página enlace». NVDA + Chrome, sin medir en 7.4 |
| 7 · sin dispositivo | **Anuncio del h2 del resumen de errores con VoiceOver.** Sin Mac ni iPhone en 7.4 |
| 5 · V4a ✓ | **Próximas vacía. Cerrado en V4a:** sin sección Próximas, como el kit (sin `h2` vacío). Medido cancelando las tres en `pnpm verify 5.4` y `--preview`: encabezados `H1 Mis citas`, `H2 Cita cancelada`, `H2 Pasadas`; las cinco en Pasadas; el foco en el título de cada aviso |
| 5 · V4a ✓ | **Subtítulo con 0 citas. Cerrado en V4a:** «No tienes citas próximas» (copy fuera de Figma, aprobado); «Tienes 1 cita próxima» en singular (`upcomingText`, aserción en `check-data` con 3, 1 y 0). El kit conserva su comportamiento (sin subtítulo con 0): el kit demuestra el componente, no el copy de la vista; unificarlo cambiaría las cifras de 4.7 |
| 5 · cierre ✓ | **`BOOKING_POLICY` a menos de 24 horas. Cerrado en el cierre de la fase 5** con `policyText` (§ Política a menos de 24 horas): 02.4, 02.5/02.6 y 03.3 dan `LATE_POLICY` con Mariana hoy a las 19:15 y la general con la c1 (`pnpm verify 5.2` y `5.3`; contraprueba contra 8c76f11: la promesa en las tres). `BOOKING_POLICY` comprobado contra Figma por MCP (`policyFigma`). Costes declarados en esa sección. «Reprogramar» a menos de 24 horas se mantiene en Mis citas (diseño §5.4, «Plazo de 24 horas») |
| 7 · 7.4 ✓ | **`.ics` en Google Calendar y descarga en Chrome. Cerrado en 7.4** (1 oct 2026; Chrome 154, Windows 11 26H2, Google Calendar web en GMT−06; docs/auditoria-manual.md, I.1 e I.3): descarga `cita-salvia-2029-04-24.ics`; «Se importó 1 de 1 evento.»: «Cita con Dra. Elena Ruiz Arellano», «Martes, 24 abril 2029 · 10:30 – 11:00am», la ubicación con las comas sin barras invertidas y el plegado deshecho («Ciuda…», truncada por la interfaz). Importado en el calendario principal |
| 7 | **`.ics` en Outlook y descarga en Firefox: sin medir en 7.4** (I.4 e I.1, recorte); tampoco el contenido en el Bloc de notas (I.2) ni Chrome Android (I.5) |
| 7 · sin dispositivo | **`.ics` en Safari de iOS y macOS (descarga o Calendario).** Sin Mac ni iPhone en 7.4 |
| 5 · T1 → V4b ✓ | **Flujos de foco contra la preview. Cerrado en V4b.** Método hecho en T1 (`pnpm verify 5.N --preview`; 5.0: 5/5); cada bloque mide los suyos. `pnpm verify` corre contra `pnpm dev`, con `StrictMode`, que vuelve a ejecutar los efectos y puede ocultar un fallo de orden (docs/verificacion.md, Trampas). Medir contra `pnpm preview` los flujos de foco de las vistas que dependen del orden de los efectos: cierre del diálogo → título del aviso, «Ver más», resumen de errores, reserva fallida. **V2b:** 02.4 (llegada desde «Continuar» y cruce de lg en los dos sentidos, con su contraprueba) en `pnpm verify 5.2 --preview`, 6/6. **V3:** resumen de errores, reserva fallida, la sonda del envío válido (ningún frame con el form reiniciado) y el cruce de lg en `pnpm verify 5.3 --preview`, 4/4. **V4a:** confirmación (cruce de lg con su contraprueba y el h1 que se vuelve a montar), diálogo en la vista, sonda de cancelar (MutationObserver y `requestAnimationFrame`; contraprueba con `close()` en un efecto: `BODY`) y las tres próximas canceladas en `pnpm verify 5.4 --preview`, 6/6; el h1 de la vista 3 en `5.3 --preview`, 5/5. **V4b:** la sonda de «Confirmar hora», el POP entre las dos entradas de Mis citas (con su contraprueba), la recarga y Atrás desde otra página (respaldo al h1), reprogramar y cancelar la misma cita, Missing en escritorio y el cruce de lg en `pnpm verify 5.4 --preview`, 12/12 |
| 5 · V4b ✓ | **Aviso «Cita reprogramada» (pieza sin frame n.º 2). Cerrado en V4b** (§ Reprogramación (V4b)): tras «Confirmar hora», replace a Mis citas con el aviso y el foco en su título en el primer commit; ninguna muestra de la reprogramación con la fecha nueva ni en body tras el envío (sonda en `pnpm verify 5.4` y `--preview`); de un solo uso (loader, D13) |
| 5 · V4b ✓ | **Costes declarados de la reprogramación** (§ Reprogramación (V4b)): Atrás tras reprogramar vuelve a Mis citas sin el aviso, sin cambiar de página (C3); una cita puede volver a su propia hora y nombrar dos fechas iguales (C6, medido con c1 y c3); la barra con «Confirmar hora» va en una fila desde 368 / 383 y en dos a 375 con barra clásica (C7) |
| 7 · 7.4 ✓ | **Ciclo de Tab del diálogo en Firefox. Cerrado en 7.4 en lo medido** (1 oct 2026; Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, K.1): con el diálogo de Molina abierto, el registro de `focusin` da «Mantener mi cita» → «Cancelar cita» → «foco sale de la página»: ningún elemento de la página recibe el foco. El número de pulsaciones no se reconstruye con el registro (pudo ser un solo Tab antes de Escape). La salida a la interfaz de Firefox no se observó en el diálogo; en la hoja del calendario, Tab sale a la interfaz y vuelve al diálogo (N3.8b) |
| 7 · sin dispositivo | **Ciclo de Tab del diálogo en Safari.** Sin Mac ni iPhone en 7.4 |
| 7 · 7.4 ✓ | **Foco devuelto al disparador tras `close()` en Firefox. Cerrado en 7.4** (1 oct 2026; Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, K.2): con Escape y con «Mantener mi cita», el foco vuelve a «Cancelar cita» de Molina («BUTTON Cancelar cita · Martes 8 de mayo · 17:00») |
| 7 · sin dispositivo | **Foco devuelto al disparador tras `close()` en Safari.** Sin Mac ni iPhone en 7.4 |
| 7 · 7.4 ✓ | **`alertdialog` con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N2.3): «¿Cancelar esta cita? diálogo Martes 8 de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer.» · «Mantener mi cita botón»; el foco inicial no corta el anuncio. Dato: NVDA dice «diálogo», no «diálogo de alerta». NVDA + Chrome, sin medir en 7.4 |
| 7 · sin dispositivo | **`alertdialog` con VoiceOver.** Sin Mac ni iPhone en 7.4 |
| 7 · 7.4 ✓ | **Calendario y horas con NVDA. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N3.1–N3.4, N3.7 y N3.8): el `h2` oculto de RAC no sale con H porque la raíz del calendario lleva `role="application"` (contraprueba: sin el rol, «abril de 2029 encabezado nivel 2»), y el rótulo se oye al entrar con Tab («abril de 2029 tabla»); «seleccionado» una vez; hoy se anuncia dos veces («hoy» del nombre y «fecha actual» de `aria-current="date"`: redundante, dato a decidir en 7.6); el mes se anuncia al navegar en línea («mayo de 2029»); en la hoja, no (fila de 7.6 del anunciador). La hora llena se lee «no disponible» y el grupo «Tarde» al cruzar con ↓ (spike-rac § 4) |
| 7 | **Calendario con lector: lo que 7.4 no midió** (recorte): las celdas en blanco con las órdenes de tabla (spike-rac § 4.3, N3.5), los botones de mes (§ 4.6, N3.6) y la rejilla del ListBox en Firefox (§ 4.7, K.8; ✓ en Chromium en 7.3) |
| 7 · sin dispositivo | **Calendario y horas con VoiceOver, con el botón «Siguiente» oculto de RAC por gestos.** Sin Mac ni iPhone en 7.4; TalkBack (A.6), sin medir |
| 7 ✓ | **Carga diferida por ruta. Cerrado en 7.2 con división estática por librería, no con carga diferida** (D18). Ningún chunk pasa de 500 kB y desaparece el aviso (antes, 677,05 kB en un solo `index`). La carga diferida, medida en HTTP/2 frente a producción: +291 / +317 ms hasta el h1 en `/`, +622 / +647 en el perfil (sin límite de CPU / ×4) y de +627 a +1234 ms en la primera visita en cliente; descartada. La división estática: +29 ms como máximo, dentro del umbral de +50. «Menos JS en `/`» no alcanzado. `pnpm verify` 4.1–4.7 y 5.0–5.4 en dev y 5.0–5.4 en `--preview`, iguales a la línea base de b4c3274. En producción (fdc8337): `pnpm verify 7.0` 14/14 y `--preview` 8/8, 16/16, 6/6, 5/5 y 12/12 (D18) |
| 7 ✓ | **`run.mjs` y el puerto 9400. Cerrado en 7.3:** `pnpm verify` sale con código 2 si el puerto de Edge ya responde, sin conectarse (contraprueba con un Edge a mano en el 9400), y `close` cierra con `Browser.close` y espera al puerto. `run.mjs` usa `process.exitCode` en todas sus salidas (`process.exit` tras un `fetch` tumbaba Node 26.3.0 en Windows con 127): sin argumentos, `4.1 --preview`, sin servidor y puerto ocupado, 2; 4.6 con su ✗ declarado, 1; el resto, 0; ninguna pasada colgada. Serie completa (4.1–4.7 y 5.0–5.4 en dev, 5.0–5.4 `--preview` y 7.0 en producción) idéntica byte a byte a fdc8337. El defecto de `kill()` de 7.2, no reproducido con Edge 154.0.4258.37: `Browser.close` queda como defensa y su contraprueba no discrimina (docs/verificacion.md, Trampas) |
| 7 · sin dispositivo | **Safari: foco y `scroll-padding`.** La verificación de 2.4.11 (fase 3) se hizo en Chromium (Edge headless, Tab real). Comprobar en Safari de macOS e iOS que al mover el foco con Tab y Shift+Tab el desplazamiento respeta `scroll-padding-block-end` (`--app-layout-bar-size`) y ningún elemento enfocado queda bajo la barra; repetir la contraprueba con el padding a 0. Sin Mac ni iPhone en 7.4; la mitad de Firefox (K.6), sin medir |
| 5 · cierre ✓ | **`pnpm verify 4.4`, «Header/Desktop Signed-in … control a 16», con un `pnpm dev` de larga duración. Cerrado en el cierre de la fase 5.** Causa: `<ScrollRestoration>` guardaba toda carga completa bajo la clave «default», así que una carga completa de otra URL en la misma pestaña heredaba el scroll de la anterior. Receta: `/kit` al final (`scrollY` 5982) y después `/kit/navegacion…` → 766 (el máximo) con el foco en body, sin `getKey`; 0 con él (D12). El perfil persistente no transmite ese estado (al reabrir, `sessionStorage` vacío), lo que cuadra con el 62/62 de V1b al reiniciar solo el servidor. Con servidor nuevo, 62/62 con perfil persistente y nuevo. **Sin medir:** qué producía la carga previa con un servidor de días (no había ninguno arrancado); su disparador queda como hipótesis. **Causa compartida en parte con el resto de pintado:** la misma clave «default» era lo que volvía estable a 4.6 (la carga completa de `/kit` heredaba el scroll; fila de la fase 7) |
| 5 · V2a ✓ | **Variante inferior de `c-sheet`. Cerrado en V2a:** `c-sheet--bottom` sobre el mismo bloque (D5); 02.2 a ±1 px (§ Fecha y hora, Vista 2) |
| 7 · 7.4 ✓ | **Atrás con la hoja de filtros abierta en Chrome Android. Cerrado en 7.4** (1 oct 2026; POCO F7, Android 16, HyperOS 3.0.303.0, Chrome 153.0.8010.52, navegación por gestos; docs/auditoria-manual.md, A.1 a): el gesto cierra la hoja, la URL sigue en `/?q=Cardiología` y la página se desplaza; un segundo Atrás va a `/`. El foco tras cerrar, sin medir (táctil, sin USB) |
| 7 | **Atrás con la hoja abierta: lo que 7.4 no midió** (recorte): la hoja del calendario en Android (A.1 b) y el botón Atrás en escritorio estrecho (K.5) |
| 7 · sin dispositivo | **Atrás con la hoja abierta en Safari de iOS.** Sin Mac ni iPhone en 7.4 |
| 7 · 7.4 ✓ | **Hoja de filtros con NVDA: ✓ el foco en el título y las dos regiones; ✗ del proyecto el nombre del disparador al aplicar (fila de 7.6)** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2, y Chrome 154; docs/auditoria-manual.md, N1.9–N1.11): el foco en el título al abrir («Filtrar y ordenar diálogo» → «Filtrar y ordenar encabezado nivel 2»), la región del borrador («11 resultados» al marcar Videoconsulta) y la del recuento al aplicar («11 resultados»). El nombre del disparador al aplicar se anuncia con el recuento anterior: fila de 7.6 (hallazgo de 7.4) |
| 7 · sin dispositivo | **Hoja de filtros con VoiceOver.** Sin Mac ni iPhone en 7.4 |
| 7 · 7.4 ✓ | **Foco devuelto por la hoja de filtros al aplicar, en Firefox. Cerrado en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N1.11): tras «Ver 11 resultados», el foco en el disparador (NVDA+Tab: «Filtrar y ordenar , 2 filtros aplicados botón enfocado»); también en Chrome 154 |
| 7 | **Foco devuelto por las hojas en Firefox: lo que 7.4 no midió** (K.3, recorte): Escape y «Cerrar» en la de filtros, y los tres cierres de la del calendario |
| 7 · sin dispositivo | **Foco devuelto por la hoja en Safari.** Sin Mac ni iPhone en 7.4 |
| 5 · tras V1b ✓ | **Foco en `body` un instante al cambiar de página con `lenta`. Cerrado:** «Siguiente» 8 → 9 y «Anterior» 2 → 1 se desmontan en el commit que trae los datos, y el `useEffect` de foco corría en otra tarea, 0,4–1,7 ms después. Sonda con MutationObserver (dev y preview, 40 pasadas): al terminar el commit, el foco estaba en `body` en 40 de 40, con un frame pintado entre medias en 7. El muestreo de 100 ms de 5.1 lo veía en 3 de 10 pasadas (V1b). Con `useLayoutEffect`, el foco llega a la tarjeta en el mismo commit: sonda, `H3` en 40 de 40 y ningún frame con `body`. 5.1 lo mide ahora en el desmontaje (`focoAlDesmontar`): 10 de 10 en `pnpm verify 5.1` (el único ✗ es el declarado del resto de pintado) y 10 de 10 en `--preview` (16/16). Contraprueba con `useEffect`: `focoAlDesmontar` `BODY` en 10 de 10 pasadas, en las dos líneas (49/52) |
| 7 · 7.6 ✓ | **Anunciador de React Aria inerte dentro de la hoja del calendario: cerrado en 7.6 con la región propia de la hoja, en el arnés y de oído en Firefox y en Chrome.** **De oído** (6 oct 2026, NVDA con Firefox y con Chrome, versiones sin anotar; en 7.4 eran NVDA 2026.2, Firefox 157.0 y Chrome 154; `scripts/verify/out/7.6/nvda.txt`): en la hoja, a 200 %, «Mes siguiente botón» + Intro → «mayo de 2029», una vez. Con el build del lote 6, una pasada en Firefox y una en Chrome; con el del lote 7, una más en Firefox. **Dato de la fecha seleccionada** (caso c, sin región): Espacio en el 25 de mayo, «viernes 25 de mayo de 2029, 7 horarios libres, seleccionado» con el build del lote 6 y «…, seleccionado · seleccionado» con el del lote 7 (Firefox, una pasada cada uno). `Calendar` con `announceMonth` (solo en `DateSheet`) monta un `role="status"` oculto dentro de la hoja, vacío al abrir. Cuando cambia el mes visible escribe «mayo de 2029» (`monthAnnouncement`, el texto que RAC anuncia en línea) si el foco no está en la rejilla, la misma condición que usa RAC. Si el mes cambia con el foco en la rejilla (las flechas, o el botón que desaparece en el mes de `minValue` o de `maxValue` y RAC lleva el foco a un día) la región se vacía: anuncia el foco, que ya nombra el mes, y volver con el botón al mismo mes vuelve a anunciarse. Medido en `pnpm verify 5.2` (dev y `--preview`): a) `['mayo de 2029', '', 'mayo de 2029']`; b) hacia abril y hacia julio, `['']` con el foco en un día de ese mes; al abrir, vacía y dentro del `<dialog>`; a 1440, en línea, ninguna región propia. Contrapruebas manuales (5.2, 51/54): escribiendo siempre el mes, b anuncia «abril de 2029» y «julio de 2029» además del foco, y a escribe «junio de 2029» al cruzar con las flechas; sin vaciar, a da `['mayo de 2029']` y la vuelta no se anuncia. `pnpm verify 7.3`: la región propia está en el árbol de accesibilidad con «mayo de 2029», y el anunciador de RAC bajo la hoja queda como coste exacto en «fuera de #root». **Declarado:** la fecha seleccionada que RAC anuncia por el mismo anunciador (`useCalendarBase`) no se cubre: la selección se hace con el foco en la celda, cuyo nombre ya lleva «seleccionado» (N3.3) y que además tiene `aria-selected`. Una segunda región repetiría lo que está en el elemento enfocado, con un texto que no viene del diseño. Lo que oye NVDA, al principio de la fila, como dato. **Antes:** (hallazgo de 7.3). RAC monta su anunciador de región viva en `body`; con la hoja (`<dialog>` con `showModal()`) abierta queda ignorado en el árbol de accesibilidad (`activeModalDialog`) y lo que anuncia («mayo de 2029» al pasar de mes) no llega al lector. A 1440, con el calendario en línea, está expuesto (contraprueba en `pnpm verify 7.3`). Propuesta: una región oculta propia dentro de `c-sheet--bottom`, el patrón de la hoja de filtros, que anuncie el mes visible. ✗ declarado en `pnpm verify 7.3`. **Confirmado de oído en 7.4** (1 oct 2026; NVDA 2026.2 + Firefox 157.0, Windows 11 26H2; docs/auditoria-manual.md, N3.8b): en la hoja, «Mes siguiente botón» + Intro y no se oye «mayo de 2029», en dos pasadas; en línea, sí (N3.8) |
| 7 · 7.6 ✓ | **Anillo contra vecinos: los dos defectos del kit, cerrados en 7.6 (lote 6); coste medido final, 68.** Composición: grupo 1, 50 (Nav Item y Nav Link junto a la barra de actual o al borde de la barra; con las dos `A Especialistas` del Nav Item suelto de `/kit` y sin sus dos `A Mis citas`); 2, 4; 3, 1; 5, 5; 6, 8. Los grupos 1b y 4 quedan en 0, y el dato de paradas con las dos bandas por debajo de 3 baja de 9 a 0. (1b) `inline-size: 6.8125rem` (109, el tercio de la barra a 375 medido en 4.4) en los `li` de la demo (`c-kit__nav-item`): la etiqueta ya no llega al anillo, que va hacia dentro. (4) El halo del salto al contenido, solo sin header (§ Constantes, Salto al contenido). **Predicción errada, anotada:** se predijo 70 y son 68. Las dos `A Mis citas` del Nav Item suelto eran coste del grupo 1 (banda interior sobre su etiqueta, 1,70 y 1,72; exterior 3,84 y 3,12) y con el ancho pasan a cumplir la regla (6,02 y 6,02). Contrapruebas con el arnés: sin el ancho, vuelven el 1b con 2 paradas y las dos `Mis citas` al coste (30/33); sin el halo, vuelve el grupo 4 con 11 (31/33). `pnpm verify 7.3`: 32/33, 1 ✗ declarado (el resto de pintado de `/kit`). **Antes:** (hallazgo de 7.3). Regla del proyecto (diseño §3.1): el anillo a ≥ 3:1 contra las dos bandas (un píxel por fuera y uno por dentro) en cada punto. En producción, 73 ✗ en 929 paradas de Tab (61 recorridos), en seis grupos, declarados exactos en `pnpm verify 7.3`: el coste medido (1, 2, 3 y 5, 60 paradas) en una expectativa ✓ y los defectos del kit (1b y 4, 13 paradas) en un ✗ declarado. **7.6 · lote 5 (F2):** coste medido de 60 a 68 con el grupo (6), el anillo que termina en el borde superior de la barra tras el desplazamiento: 8 paradas (Columna 2, 12 y 22 de `/kit/layout` a 375, Columna 13 y 24 a 1440, Relleno 11 y «Último elemento de la página» de `/kit/navegacion` a 375, y `#correo` en el resumen de errores a 375), con la banda exterior sobre el borde de la barra (2,66) o sobre la barra de actual (1,33) y la interior en 6,02; ninguna con las dos bandas < 3 (el dato sigue en 9). No es ✗ de 1.4.11 (fila F2). (1) Nav Item y Nav Link con desfase −4, junto a la barra de actual (1,33) o al borde de la barra (2,66): 50 paradas, en cada punto una banda ≥ 3 (6,02 contra la superficie interior); coste medido. (1b) El Nav Item suelto de `/kit` (a 375 y 1440): 2 paradas, cada una con 1 punto de 36 con las dos bandas < 3 (1,33 exterior sobre la barra de actual, 2,75 interior sobre la etiqueta, que en la demo suelta llega al anillo), ✗ de 1.4.11; candidato a 7.6, solo del kit (D9: va a producción). (2) Chip de la tira y celda del calendario junto al borde del vecino (1,4 y 1,01): 4 paradas; coste medido. (3) Disparador del menú junto al borde del panel abierto (1,4): 1; coste medido. (4) Salto al contenido sobre el contenido de `/kit/*` (el catálogo no tiene header debajo): 11 paradas, 7 con puntos de las dos bandas < 3; candidato a 7.6, solo del kit. (5) Enlaces en línea del kit junto al texto vecino (hasta 1,08): 5; coste medido. En los grupos de coste, ningún punto con las dos bandas < 3. Detalle en docs/auditoria.md |
| 7 · 7.6 ✓ | **Inicio y Fin en el ListBox de horas (hallazgo de 7.3, F1). Cerrado en 7.6** con un escuchador nativo en captura sobre la raíz del ListBox (`SlotList`), que evita la acción por defecto; RAC sigue moviendo el foco. Nativo porque `ListBox` (RAC 1.21.1) no tipa ni reenvía `onKeyDownCapture`, y sin envoltorio: el DOM no cambia. Solo en las combinaciones que RAC atiende (`withShiftSel` de `useSelectableCollection`): la tecla sola, con Mayús, con Ctrl y con Mayús+Ctrl; en Mac, Alt en vez de Ctrl (`/^Mac/i` sobre `navigator.platform`, el respaldo tipado del `isMac` de RAC). Antes: en selección simple RAC no llama a `preventDefault` y la página se desplazaba (a 320 con la letra a 32, la 09:00 en y −217 en 02.1 y −172 en 02.7). `pnpm verify 7.3` contra la preview (9e1dfcb + el lote): Fin e Inicio a la vista en 4 de 4 (02.1 y 02.7, inyección y letra); las ocho combinaciones en 02.1 a 320 con la inyección, `defaultPrevented` y 18:30 / 09:00 a la vista; contraprueba: Alt+Inicio (la página de inicio del navegador en Windows) no se intercepta y el foco no se mueve. La línea base, con el mismo arnés, daba ✗. 7.3: 27/31. **Medido solo en Chromium** (Edge 154 headless); **Firefox, sin medir** (K.8 no se hizo en 7.4). **Sin dispositivo:** la mitad Mac (Alt+Inicio y Fin) |
| 7 · 7.6 ✓ | **Anillo bajo la barra fija o sticky: cerrado en 7.6, la regla del anillo entero se cumple en las 1770 paradas.** `scroll-padding-block-end`: 0 sin barra; con barra, `calc(var(--app-layout-bar-size, 0rem) + tools.$focus-ring-reach)` (4 px = desfase 2 + grosor 2), detectada con `:where(html:has(.c-app-layout__bar))`; 0 con texto grande. `$focus-ring-width` y `$focus-ring-offset` (2px) en `_mixins.scss` con su excepción de lint (los px del outline no escalan) y el mixin compila igual. El Day Chip va en el mismo cambio: `inset: -1px` en `c-day-chip__input` (el borde de 1px del chip, con su excepción), porque el navegador desplaza a la vista el radio y el anillo lo pinta el chip, que sobresalía 1 px. CSS compilado frente al de 7.6 · lote 4: solo cambian esas declaraciones. `pnpm verify 7.3` contra la preview (`index-qUsD0WEL.js`, `index-DAMcZ5Fe.css`): 0 paradas con parte del anillo bajo la barra (base: 30, con 3,9–5 px) y en el ListBox a 320 con la inyección las opciones 7–10 se pintan enteras (36/36; base 27/36). `pnpm verify 4.4`: `scrollPadding` 68px en las tres expectativas con barra. Contraprueba (sonda dirigida, `/kit/fecha-hora` a 1440 con la letra a 32): con `inset: 0` inyectado, el anillo del chip vuelve a quedar 1 px bajo la barra, y con el `scroll-padding` de antes, 4. **Coste medido (no ✗ de 1.4.11):** el anillo termina exactamente en el borde superior de la barra, y su banda exterior cae sobre el borde (`color-border`, 2,66) o, en `/kit/navegacion`, sobre la barra de actual del Nav Item (`color-action`, 1,33); la interior, en la superficie (6,02), y ningún punto tiene las dos bandas por debajo de 3. Son 8 paradas de Tab (grupo 6 del anillo contra vecinos) y, con la inyección, las opciones 7–10 del ListBox en 02.1 y 02.7. Es la misma vecindad que el grupo 1 («al borde de la barra»). No se añade un píxel para la banda exterior: sería ajustar el producto al medidor. **Antes:** (hallazgo de 7.3, F2). El `scroll-padding-block-end` es el alto de la barra (`--app-layout-bar-size`): al enfocar, el componente queda justo en su borde y los 4 px del anillo (desfase 2 + grosor 2) caen bajo ella. 30 paradas de Tab con 3,9–5 px del anillo bajo la barra y el componente visible (a 16, el correo de «Tus datos» a 375 y las demos de `/kit/layout` y `/kit/navegacion`; a 1440 con la letra a 32, con el chrome móvil, «Buscar», «Ver mes completo» y otros) y, en el ListBox a 320 con la inyección, las opciones 7–10 con 27 de 36 puntos del anillo pintados. 2.4.11 AA se cumple (el componente se ve); es la regla del sistema (anillo entero, fase 3). Propuesta, valor nuevo: `scroll-padding-block-end` = alto de la barra + desfase + grosor del anillo. ✗ declarado en `pnpm verify 7.3` (ListBox); las 30 paradas, dato en docs/auditoria.md |
| 7 · 7.6 · declarado | **Disparador de filtros al aplicar: el nombre, cerrado en 7.6 (en el arnés y de oído en Firefox); el recuento al cerrar la hoja no se oye en Firefox, fila abierta y declarada.** **De oído** (6 oct 2026, NVDA con Firefox, zoom 200 %, versiones sin anotar; en 7.4 eran NVDA 2026.2 y Firefox 157.0; `scripts/verify/out/7.6/nvda.txt`, paso 1 y segunda tanda): tras «Ver 11 resultados botón» + Intro, «cliqueable misma página enlace Saltar al contenido · principal región Filtrar y ordenar , 2 filtros aplicados botón abre diálogo», y después **no se oye «11 resultados»**: dos pasadas con el build del lote 6 y dos con el del lote 7, la segunda de cada par con 5 s de espera. El nombre, «2 filtros aplicados» en las cuatro. En el arnés, desde el lote 7, la región cambia con el diálogo ya cerrado (abajo), pero NVDA no la anuncia; **la causa, sin aislar**. **Declarado:** desviación de la regla de los dos mensajes al aplicar, no ✗ de WCAG: el recuento se oye en la hoja al cambiar un filtro («11 resultados · marcado» al marcar Videoconsulta, en las cuatro pasadas) y está en el nombre del botón «Ver 11 resultados». NVDA + Chrome, sin medir en 7.6. **Lote 3.** `Sheet` avisa al padre antes de cerrar (`onSubmit()` → `close()` → foco), y `FilterSheet` escribe la URL con `flushSync` (opción de `setSearchParams` en React Router; `useSearchUpdate` la acepta). Así el disparador ya pinta «2 filtros aplicados» cuando recibe el foco. Sin pintar en el acto (la hoja del calendario), el orden no cambia nada: React aplica tras el manejador. `pnpm verify 5.1` (dev y `--preview`), con Intro en «Ver 11 resultados» tras marcar Videoconsulta sobre Cardiología: el disparador recibe el foco una vez, como «Filtrar y ordenar, 2 filtros aplicados», y la región dice «11 resultados». Contrapruebas manuales (52/53): con el orden anterior, y con el orden nuevo sin `flushSync`, «1 filtro aplicado». No hizo falta un recuento local. **Lote 7 (A).** Con el lote 3, el `flushSync` pintaba también la región del recuento (34 → 11) antes de `close()`, con la página inert bajo el modal; la hipótesis era que por eso no se oía. Cambio en `Search.tsx`: al abrir la hoja se congela el texto de la región (`heldCount`) y se suelta con `setSheet('closed')`, fuera del `flushSync` y con el diálogo cerrado; con «Cerrar» o Escape no cambia de texto, y al cruzar lg (`'lost'`) se suelta. `pnpm verify 5.1` (dev y `--preview`), con la región leída dentro de `close()` (envuelto en el prototipo) y en el `focusin` del disparador: «34 resultados» en los dos, con el nombre «2 filtros aplicados», y «11 resultados» después. Contraprueba con el arnés (el texto congelado quitado): «11 resultados» dentro de `close()` y en el `focusin` (53/54). La expectativa del lote 3 no cambia. De oído no cambió nada: la hipótesis no se confirma (arriba). El cambio sigue en el código (d42afbd); conservarlo o revertirlo, sin decidir. **Antes:** (hallazgo de 7.4). Tras «Ver 11 resultados», NVDA dice «Filtrar y ordenar, 1 filtro aplicado» con dos aplicados; NVDA+Tab después, «2 filtros aplicados»; la región del recuento, «11 resultados» (1 oct 2026; NVDA 2026.2 con Firefox 157.0 y con Chrome 154, Windows 11 26H2; docs/auditoria-manual.md, N1.11). Causa: `Sheet.tsx` devuelve el foco (línea 100) antes de `onSubmit()` (línea 101), así que el disparador recibe el foco con el nombre anterior y el cambio no se vuelve a anunciar. Criterio: regla del proyecto (los dos mensajes al aplicar, fila «Hoja de filtros con lector»), no ✗ de WCAG: el nombre se corrige y el recuento llega por la región de estado. Propuesta de corrección sin decidir |
| 7 · 7.6 ✓ | **«entrada inválida» antes del primer envío: cerrado en 7.6, en el arnés y de oído en Firefox y en Chrome.** **De oído** (6 oct 2026, build del lote 6, zoom 100 %, NVDA con Firefox y con Chrome, una pasada en cada uno, versiones sin anotar; en 7.4 eran NVDA 2026.2, Firefox 157.0 y Chrome 154; `scripts/verify/out/7.6/nvda.txt`, paso 2). Firefox, antes de enviar: «Datos del paciente agrupación Todos los campos son obligatorios salvo los marcados como opcionales», sin «entrada inválida»; «Nombre completo edición requerido tiene auto completado»; «Correo electrónico edición requerido tiene auto completado»; «Motivo de consulta cuadro combinado Elige una opción contraído requerido Nos ayuda a preparar tu consulta»; «Acepto el aviso de privacidad casilla de verificación sin marcar requerido Solo usamos tus datos para esta cita»; al escribir «k» en el correo, «k · selección eliminada». Tras «Confirmar cita»: «Corrige 3 campos para continuar encabezado nivel 2 · lista con 3 elementos»; el correo y el motivo, con «requerido entrada inválida» y su mensaje. Chrome, antes de enviar: el motivo y la privacidad con «requerido», sin «entrada inválida»; tras enviar, «Corrige 2 campos para continuar encabezado nivel 2» y el motivo con «requerido entrada inválida Elige el motivo de tu consulta». **3 y 2 no es un defecto:** en Firefox se escribió «k» en el correo (inválido); en Chrome no se cambió ningún campo, como pedía el paso (motivo y privacidad). **Lote 4.** Con `aria-required` en vez de `required` en `FieldText`, `FieldSelect` y `Checkbox`, y el correo como text con `inputMode="email"`, `autoComplete="email"`, `autoCapitalize="none"` y sin corrector (§ Datos del paciente, desviación declarada de `semantic-markup`). `pnpm verify 5.3` (27/27): al cargar, `form :invalid` da `[]` y ningún obligatorio es inválido en el árbol AX; tras enviar con errores, inválidos correo, motivo y privacidad; contraprueba: `required` inyectado en el select vuelve a dar `FIELDSET` y `SELECT #motivo` en `:invalid` y el select inválido en el árbol. La de `noValidate` inyecta `required` en los cuatro en los dos brazos (sin él, el foco va a `#motivo`). **Antes:** (hallazgo de 7.4). En `/especialistas/elena-ruiz-arellano/datos`, sin enviar, NVDA dice «requerido entrada inválida» en «Motivo de consulta» y en «Acepto el aviso de privacidad» (Firefox 157 y Chrome 154), en el fieldset «Datos del paciente» (solo Firefox) y en el correo al teclear la primera letra («k · entrada inválida», Firefox). Es la validez nativa de `required` y `type=email`, que el navegador expone aunque el form tenga `noValidate`; la app solo pone `aria-invalid` con error. `aria-invalid="false"` puesto a mano en el select no lo anula en Firefox (una pasada). Contraprueba: con la carga completa, `form :invalid` da los dos fieldsets, el select y la casilla, todos con `aria-invalid` null (1 oct 2026; NVDA 2026.2 con Firefox 157.0 y con Chrome 154, Windows 11 26H2; docs/auditoria-manual.md, hallazgo tras N2.2). Criterio: regla del proyecto (validación al enviar, diseño §3.4), no ✗ de WCAG. Propuesta de corrección sin decidir |
| 7 · 7.6 ✓ | **Estado arrastrado en las celdas del calendario, en Firefox: cerrado en 7.6, en el arnés y de oído en Firefox (una pasada).** **De oído con el build del lote 7** (6 oct 2026, NVDA con Firefox, zoom 200 %, versiones sin anotar; `scripts/verify/out/7.6/nvda.txt`, segunda tanda): en la hoja, «Mes siguiente» + Intro → «mayo de 2029»; Tab: «mayo de 2029 tabla · jueves 24 de mayo de 2029, 8 horarios libres fila 4 columna 4 · botón»; → del 24 al 29, ningún «no disponible»; Espacio en el 25, «seleccionado», y «seleccionado» solo en el 25; ↓ desde el 29 cruza a junio con el foco en la rejilla y NVDA dice solo el día («martes 5 de junio de 2029, 9 horarios libres fila 2 · botón»), sin nada de más. Chrome ya leía limpio con el build del lote 6. **Antes:** (hallazgo de la tanda tras el deploy del lote 6, 6 oct 2026, NVDA con Firefox, versiones sin anotar; `nvda.txt`, paso 3.) En la hoja del calendario, tras «Mes siguiente», Tab a la rejilla y → del 24 al 29 de mayo, NVDA dice «botón no disponible» en el 24, 25, 26 y 27 y «seleccionado» en el 29 con el 25 seleccionado; en Chrome, la misma secuencia, ninguno. El DOM lo explica: RAC reutiliza las celdas por posición y las 35 de mayo son los mismos nodos que en abril (el 24–29 de mayo ocupan los `td` que eran del 19 al 24 de abril: el 19–22, pasados y fuera de rango; el 24, seleccionado), en línea y en la hoja. Que Firefox conservara el estado viejo de la celda era la hipótesis, confirmada de oído con la corrección; Chromium no lo arrastraba. Corrección: `key` por mes en `CalendarGridBody` (§ Fecha y hora). `pnpm verify 4.6` (en línea, 1440) y `5.2` (la hoja, 375; dev y `--preview`): con el botón y con las flechas, hacia abril con ↑ y hacia junio con ↓, 0 celdas reutilizadas en cada cambio de mes, el foco en un día de la rejilla en cada paso, Fin al domingo 29 y, en la hoja, la región del mes con «mayo de 2029» con el botón y vacía con las flechas. Contraprueba con el arnés (sin la key): 35 reutilizadas en cada cambio de mes, con el foco igual (4.6 52/54; 5.2 54/55). `pnpm verify 7.3`: 32/33, idéntica. **El riesgo del plan:** entre el desmontaje de la celda enfocada y el foco de la nueva, el foco pasa un instante por `body` en el mismo commit (sin medir); de oído, al cruzar a junio con ↓, NVDA no dijo nada de más (una pasada, Firefox) |
| 7 · 7.3 ✓ en Chromium · 7.4 ✓ en Firefox | **Anillo de foco sobre la barra inferior en el flujo (hallazgo de 7.1). Cerrado en Chromium en 7.3 con dos cifras** (`pnpm verify 7.3`). Con la letra real del navegador (`Page.setFontSizes` a 32, 375) la barra va en el flujo y nada de lo que queda encima la toca: margen mínimo de 60 px en los 27 estados (60 en `/fuera-de-alcance`, «Ir a Especialistas»). Con la inyección en `html` (la receta de 7.1) la barra no pasa al flujo: sigue sticky (la que es static es la `c-bottom-nav` de dentro, no el hueco de la barra) y el solape depende del alto del viewport: a 375 × 900 el anillo acaba en 695,9 y la barra empieza en 692 (3,9 px; 27 de 36 puntos pintados; `elementFromPoint` en la franja, `c-nav-item`); a 375 × 812, 60 px de margen. Esa condición no la alcanza un usuario en Chromium (la letra real activa el modo de texto grande) y es el mecanismo de F2. Firefox con zoom solo de texto, en 7.4 (abajo). Lo que anotó 7.1: en `/fuera-de-alcance` a 375 con el `html` a 32 por inyección, la barra empezaba en y 732 y el anillo de «Ir a Especialistas» (Tab real) acababa en 736, con su franja inferior sobre `c-nav-item` y el `border-top` de la barra; al 100 %, la barra empezaba en 836. **Firefox, cerrado en 7.4** (Firefox 157.0, Windows 11 26H2, 1 oct 2026; docs/auditoria-manual.md, K.7; RDM 375 × 900, `/fuera-de-alcance`, una pasada por medida): el zoom solo de texto mueve la media query en rem, activa el modo de texto grande y la barra pasa al flujo, así que la condición de 7.1 (texto ampliado con la barra sticky) no se alcanza. Al 200 % solo de texto, `letraRaiz` 32px, `modoTextoGrande` true, `posicionBarra` static, `barraInicio` 832, `scrollY` 0; con la letra a 16 y el zoom al 100 %, 16px, false, sticky, 836. `ANILLO`, sin medir (en RDM `document.activeElement` era `body` al evaluar; con la barra static el solape no aplica); 375 × 812, sin medir |
