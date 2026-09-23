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

| Colección | Contenido |
|---|---|
| `Color · Primitives` | 33 primitivos, `familia/paso` |
| `Color · Roles` | 26 roles, nombres planos `color-*` |
| `Layout & Spacing` | `space/1–7`, `radius/sm\|md\|pill`, `layout/container-width\|aside-width\|gap` |

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
la escala con cuatro entradas que nadie puede recorrer.

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

| Paso | Tamaño | Interlineado | Razón | Tracking |
|---|---|---|---|---|
| `display` | 39 | 44 | 1.128 | −0.01em |
| `heading/lg` | 31 | 36 | 1.161 | −0.01em |
| `heading/md` | 25 | 32 | 1.28 | −0.005em |
| `heading/sm` | 20 | 28 | 1.4 | 0 |
| `body/md` | 16 | 24 | 1.5 | 0 |
| `body/strong` | 16 | 24 | 1.5 | 0 |
| `label` | 14 | 20 | 1.43 | 0 |
| `caption` | 14 | 20 | 1.43 | 0 |

Familias: Fraunces SemiBold (peso 600) en los cuatro primeros; Inter Regular
(400) y Semi Bold (600) en los cuatro últimos. Fraunces es variable con eje
`opsz`: `font-optical-sizing: auto`.

Escala de razón 1.25 desde 16. Mínimo 14 px; la excepción de texto grande de
WCAG no se usa en ningún par.

---

## Breakpoints

**No vienen de Figma.** El archivo tiene dos plataformas (375 y 1440) y ninguna
variable de breakpoint. Estos valores están derivados de los puntos de rotura
que el diseño sí declara.

`_breakpoints.scss`:

| Nombre | Valor | Razón |
|---|---|---|
| `lg` | 56rem (896px) | Único salto de página: aparece el patrón aside + principal, el header de escritorio sustituye a la barra inferior y el contenedor se centra. Aside 320 + gap 32 + Result Card Row rompiendo hacia 490 + respiro 48 = 890 |

---

## Contenedores

`_containers.scss`. Estos sí los declara el diseño:

| Nombre | Umbral | Qué cambia |
|---|---|---|
| `result-card` | 40rem | Row pasa a Stacked |
| `slot-picker` | 44rem | La tarjeta del selector apila calendario y horas |

---

## Constantes del sistema sin variable en Figma

Medidas en los maestros, no son tokens del archivo:

- Trazo normal 1px; trazo fuerte 2px (campo en error, marcador de casilla y
  radio).
- **Anillo de foco, uno solo para todo el sistema:** 2px de grosor, 2px de
  desfase, radio = radio del control + 4 (10 sobre `radius/sm`). Dentro del
  header y en controles de icono, desfase −4.
- Alto de control de texto: 50, por construcción (borde 1 + 12 + interlineado
  24 + 12 + borde 1). No es un alto fijo: es el resultado del padding.
- Fila de casilla y radio: 48 en las dos plataformas, también por padding.
- Velo de hojas y diálogos: `color-scrim` al 45 %
  (`rgb(from var(--color-scrim) r g b / 45%)`), nunca en la variable.

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

| Par | Ratio |
|---|---|
| Blanco sobre `color-accent` | 2.88 |
| `color-accent` como color de texto | 2.88 |
| `success/500` como color de texto sobre blanco | 3.37 |
| `color-text-secondary` sobre `color-surface-muted` | 4.29 |
| `color-border` como límite de un control | 2.27 |
| Anillo de foco sobre la hora seleccionada | 2.09 |
