# Salida: SCSS (ITCSS/BEMIT)

Regla central: **la fuente de verdad son las custom properties CSS** y los componentes las consumen con `var(--token)` directo. No se generan variables SCSS puente (`$color: var(--color)`): duplican nombres sin aportar nada en runtime.

Sass solo recibe lo que se resuelve en compilación, donde `var()` no funciona: breakpoints y claves de escala para loops.

## Archivos (capa `01-settings/`)

Si el proyecto tiene la estructura de `bemit-scss`, estos archivos ya existen: se actualizan con un diff, no se regeneran.

| Archivo | Contenido | Emite CSS |
|---|---|---|
| `_tokens.scss` | Primitivos + semánticos en `:root`, redefiniciones por breakpoint y modos | Sí (único) |
| `_breakpoints.scss` | Mapa `$breakpoints` en rem | No |
| `_scales.scss` | `$space-keys`: las claves de los `--space-*` generados | No |

`_containers.scss` no lo genera esta skill: son umbrales de componente, no de diseño.

### `_tokens.scss`
```scss
@use 'sass:map';
@use 'breakpoints' as bp;

:root {
  // ===== Nivel 1: primitivos =====
  // Color
  --color-blue-600: #2455d4;
  --color-gray-900: #111827;
  // Tipografía
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  // Espaciado
  --space-2: 0.5rem;
  --space-4: 1rem;
  // Radios (px: excepción aceptada)
  --radius-md: 8px;

  // ===== Nivel 2: semánticos =====
  --color-text-default: var(--color-gray-900);
  --color-action-primary: var(--color-blue-600);
  --text-heading-1-size: var(--font-size-2xl);
}

// ===== Redefinición por breakpoint (solo semánticos) =====
@media (min-width: map.get(bp.$breakpoints, lg)) {
  :root {
    --text-heading-1-size: var(--font-size-3xl);
  }
}
```
- Settings no usa `02-tools`: la media query lee el mapa directamente. Así se respeta la dirección de las capas ITCSS.
- Solo se redefinen semánticos por breakpoint; los primitivos son fijos.
- Sin `@layer`.

### `_breakpoints.scss`
```scss
$breakpoints: (
  sm: 26.25rem,  // 420px
  md: 48rem,     // 768px
  lg: 64rem,     // 1024px
  xl: 90rem,     // 1440px
);
```
Se conservan las claves existentes del proyecto; solo cambian los valores si Figma los define. Siempre en rem.

### `_scales.scss`
```scss
// Debe coincidir con los --space-* de _tokens.scss
$space-keys: (2, 4);
```
Se regenera cada vez que cambia la escala de espaciado, con exactamente las claves emitidas.

## Reglas
- Si el proyecto ya tiene nombres de breakpoints, mixins o prefijos, mandan sobre este formato.
- Nunca `darken()`/`lighten()` ni `color.adjust()` sobre tokens para derivar estados: hover y active vienen del diseño o se reportan como hueco.
- Los componentes consumen solo semánticos con `var(--…)`; nunca primitivos.
