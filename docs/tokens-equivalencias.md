# Mapa de equivalencias Figma → tokens

Contrato auditable entre el archivo `sVVjX11h3CrCOFNybb7gL1` y
`src/styles/01-settings/_tokens.scss`. Una fila por token. Extraído por MCP
(`use_figma`, variables locales y estilos de texto). Un solo modo, `Value`.

Traducción de nombres (DESIGN.md): `/` → `-`, prefijo `--color-` en los
primitivos de color. Los roles conservan su nombre de Figma.

Verificación: `pnpm contrast` reproduce los 31 pares de F.3 a partir del SCSS
compilado.

## Inventario

| Origen | En Figma | En código | Fuera, y por qué |
|---|---|---|---|
| Color · Primitives | 33 | 20 | 13 que ningún rol consume (decisión 2) |
| Color · Roles | 26 | 25 | `color-surface-elevated` (decisión 1) |
| Layout & Spacing | 13 | 13 | — |
| Estilos de texto | 12 | 8 grupos | `link/md`, `link/sm`, `strike/md`, `strike/heading-sm` (decisión 3) |
| Estilos de efecto | 0 | 0 | El sistema no tiene sombras |
| Modos | 1 | — | Sin dark mode (decisión 5) |

## Nivel 1 · Primitivos de color

| Token | Figma | Valor | Lo consume |
|---|---|---|---|
| `--color-white` | `white` | #ffffff | surface, on-action |
| `--color-black` | `black` | #000000 | scrim |
| `--color-neutral-200` | `neutral/200` | #e6e2d8 | surface-muted |
| `--color-neutral-400` | `neutral/400` | #b3ac98 | border |
| `--color-neutral-600` | `neutral/600` | #6e6858 | text-secondary |
| `--color-neutral-700` | `neutral/700` | #524d41 | border-strong |
| `--color-neutral-900` | `neutral/900` | #201e19 | text-primary |
| `--color-sage-100` | `sage/100` | #e2eae3 | action-subtle |
| `--color-sage-600` | `sage/600` | #486b4d | focus-ring |
| `--color-sage-700` | `sage/700` | #3b5740 | action, text-link |
| `--color-sage-800` | `sage/800` | #2c4230 | action-hover |
| `--color-accent-100` | `accent/100` | #f7e3d0 | warning-surface |
| `--color-accent-500` | `accent/500` | #d9834b | accent |
| `--color-accent-700` | `accent/700` | #b15e30 | warning |
| `--color-accent-900` | `accent/900` | #7a3e1e | accent-text, warning-text |
| `--color-success-100` | `success/100` | #d7f0e4 | success-surface |
| `--color-success-700` | `success/700` | #1f7350 | success, success-text |
| `--color-red-100` | `red/100` | #f6dada | error-surface |
| `--color-red-500` | `red/500` | #922626 | error, error-text |
| `--color-red-700` | `red/700` | #6c1b1b | error-hover |

Fuera de código (solo Foundations): `sage/50`, `sage/200`–`500`, `sage/900`,
`neutral/50`, `neutral/100`, `neutral/300`, `neutral/500`, `neutral/800`,
`accent/300`, `success/500`.

## Nivel 2 · Roles de color

| Token | Figma | Alias | Scopes en Figma → propiedad CSS |
|---|---|---|---|
| `--color-surface` | `color-surface` | white | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-surface-muted` | `color-surface-muted` | neutral/200 | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-border` | `color-border` | neutral/400 | STROKE_COLOR → `border-color` (decorativo) |
| `--color-border-strong` | `color-border-strong` | neutral/700 | STROKE_COLOR → `border-color` |
| `--color-text-primary` | `color-text-primary` | neutral/900 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-text-secondary` | `color-text-secondary` | neutral/600 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-text-link` | `color-text-link` | sage/700 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-action` | `color-action` | sage/700 | FRAME_FILL, SHAPE_FILL, STROKE_COLOR → `background-color`, `border-color` |
| `--color-action-hover` | `color-action-hover` | sage/800 | FRAME_FILL, SHAPE_FILL, STROKE_COLOR → `background-color`, `border-color` |
| `--color-action-subtle` | `color-action-subtle` | sage/100 | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-on-action` | `color-on-action` | white | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-accent` | `color-accent` | accent/500 | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-accent-text` | `color-accent-text` | accent/900 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-success` | `color-success` | success/700 | FRAME_FILL, SHAPE_FILL, STROKE_COLOR → `background-color`, `border-color` |
| `--color-success-surface` | `color-success-surface` | success/100 | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-success-text` | `color-success-text` | success/700 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-warning` | `color-warning` | accent/700 | FRAME_FILL, SHAPE_FILL, STROKE_COLOR → `background-color`, `border-color` |
| `--color-warning-surface` | `color-warning-surface` | accent/100 | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-warning-text` | `color-warning-text` | accent/900 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-error` | `color-error` | red/500 | FRAME_FILL, SHAPE_FILL, STROKE_COLOR → `background-color`, `border-color` |
| `--color-error-hover` | `color-error-hover` | red/700 | FRAME_FILL, SHAPE_FILL, STROKE_COLOR → `background-color`, `border-color` |
| `--color-error-surface` | `color-error-surface` | red/100 | FRAME_FILL, SHAPE_FILL → `background-color` |
| `--color-error-text` | `color-error-text` | red/500 | SHAPE_FILL, TEXT_FILL → `color` |
| `--color-focus-ring` | `color-focus-ring` | sage/600 | STROKE_COLOR → `outline-color` |
| `--color-scrim` | `color-scrim` | black | FRAME_FILL → `background-color`, siempre al 45 % con `color-mix` |
| — | `color-surface-elevated` | neutral/50 | Fuera de código (decisión 1) |

## Nivel 1 · Espaciado, radios y layout

| Token | Figma | Valor Figma | Valor código |
|---|---|---|---|
| `--space-1` | `space/1` | 4 | 0.25rem |
| `--space-2` | `space/2` | 8 | 0.5rem |
| `--space-3` | `space/3` | 12 | 0.75rem |
| `--space-4` | `space/4` | 16 | 1rem |
| `--space-5` | `space/5` | 24 | 1.5rem |
| `--space-6` | `space/6` | 32 | 2rem |
| `--space-7` | `space/7` | 48 | 3rem |
| `--radius-sm` | `radius/sm` | 6 | 6px |
| `--radius-md` | `radius/md` | 12 | 12px |
| `--radius-pill` | `radius/pill` | 999 | 999px |
| `--layout-container-width` | `layout/container-width` | 1200 | 75rem |
| `--layout-aside-width` | `layout/aside-width` | 320 | 20rem |
| `--layout-gap` | `layout/gap` | 32 | 2rem |

`layout/gap` y `space/6` valen lo mismo pero en Figma son variables
independientes (no hay alias): se mantienen separadas, igual que los roles que
comparten valor (decisión 4).

## Tipografía

### Primitivos

| Token | Origen | Valor |
|---|---|---|
| `--font-family-heading` | Fraunces (display, heading/*) | `'Fraunces Variable', 'Fraunces', ui-serif, Georgia, serif` |
| `--font-family-base` | Inter (body/*, label, caption) | `'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif` |
| `--font-weight-regular` | Inter Regular | 400 |
| `--font-weight-semibold` | Fraunces SemiBold · Inter Semi Bold | 600 |
| `--font-size-sm` | 14 | 0.875rem |
| `--font-size-base` | 16 | 1rem |
| `--font-size-lg` | 20 | 1.25rem |
| `--font-size-xl` | 25 | 1.5625rem |
| `--font-size-2xl` | 31 | 1.9375rem |
| `--font-size-3xl` | 39 | 2.4375rem |
| `--line-height-sm` | 20 / 14 | 1.4285714286 |
| `--line-height-base` | 24 / 16 | 1.5 |
| `--line-height-lg` | 28 / 20 | 1.4 |
| `--line-height-xl` | 32 / 25 | 1.28 |
| `--line-height-2xl` | 36 / 31 | 1.1612903226 |
| `--line-height-3xl` | 44 / 39 | 1.1282051282 |
| `--letter-spacing-tight` | −1 % | −0.01em |
| `--letter-spacing-snug` | −0.5 % | −0.005em |
| `--letter-spacing-normal` | 0 % | 0 |

Las familias llevan el sufijo « Variable» porque así las registra Fontsource
(D11 en `DESIGN.md`); la familia sin sufijo queda de respaldo.

Cada interlineado en px aparece con un único tamaño, así que el interlineado
comparte clave con su tamaño. Se emite sin unidad y sin redondear (DESIGN.md
redondea a 3 decimales para la tabla; la diferencia es < 0.01 px).

### Nivel 2 · Grupos por estilo de texto

Cada grupo emite `-family`, `-weight`, `-size`, `-line-height` y `-tracking`.

| Grupo | Estilo Figma | Familia | Peso | Tamaño | Interlineado | Tracking |
|---|---|---|---|---|---|---|
| `--text-display-*` | `display` | heading | semibold | 3xl | 3xl | tight |
| `--text-heading-lg-*` | `heading/lg` | heading | semibold | 2xl | 2xl | tight |
| `--text-heading-md-*` | `heading/md` | heading | semibold | xl | xl | snug |
| `--text-heading-sm-*` | `heading/sm` | heading | semibold | lg | lg | normal |
| `--text-body-md-*` | `body/md` | base | regular | base | base | normal |
| `--text-body-strong-*` | `body/strong` | base | semibold | base | base | normal |
| `--text-label-*` | `label` | base | semibold | sm | sm | normal |
| `--text-caption-*` | `caption` | base | regular | sm | sm | normal |
| — | `link/md` | = body/md + `underline` | | | | regla base de `a` |
| — | `link/sm` | = caption + `underline` | | | | regla base de `a` |
| — | `strike/md` | = body/md + `line-through` | | | | en el estado |
| — | `strike/heading-sm` | = heading/sm + `line-through` | | | | en el estado |

## Compilación (no son tokens de Figma)

| Mapa | Clave | Valor | Origen |
|---|---|---|---|
| `$breakpoints` | `lg` | 64rem | DESIGN.md § Breakpoints |
| `$containers` | `dialog` | 32rem | DESIGN.md § Contenedores |
| `$containers` | `result-card` | 32rem | DESIGN.md § Contenedores |
| `$containers` | `appointment-card` | 34rem | DESIGN.md § Contenedores (provisional) |
| `$containers` | `slot-picker` | 44rem | DESIGN.md § Contenedores |
| `$space-keys` | — | 1–7 | Claves de `--space-*` |
