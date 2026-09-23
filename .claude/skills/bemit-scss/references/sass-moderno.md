# Sass moderno

Compilador: Dart Sass reciente (`sass` o `sass-embedded`). La sintaxis siempre es SCSS.

## Módulos

- `@use` para consumir y `@forward` para reexportar. `@import` está deprecado y desaparece en Dart Sass 3.
- Siempre con namespace explícito: `@use '../02-tools' as tools;`. Nunca `as *`.
- Las carpetas cuyo nombre no es un identificador válido (`03-generic`) requieren `as`.
- Los `@use` van al inicio del archivo, antes de cualquier regla.
- Miembros privados de un módulo con prefijo `-` o `_`: no se exportan.

## Funciones integradas: siempre por módulo

| Deprecado | Moderno |
|---|---|
| `map-get($m, $k)` / `map-has-key` / `map-merge` | `map.get` / `map.has-key` / `map.merge` (`@use 'sass:map'`) |
| `$a / $b` (división) | `math.div($a, $b)` (`@use 'sass:math'`) |
| `unit()` / `unitless()` / `percentage()` / `round()` | `math.unit` / `math.is-unitless` / `math.percentage` / `math.round` |
| `str-index()` / `unquote()` | `string.index` / `string.unquote` (`@use 'sass:string'`) |
| `darken()` / `lighten()` / `mix()` | `color.adjust` / `color.scale` / `color.mix`, pero con tokens esto no se usa |
| `nth()` / `length()` | `list.nth` / `list.length` (`@use 'sass:list'`) |
| `@elseif` | `@else if` |
| `$var: x !global` para crear una variable nueva | Declararla en el módulo |

Los colores de estado (hover, active) nunca se derivan con funciones de color: vienen del diseño como token. Si faltan, se reportan.

## Orden de declaraciones

Dentro de una regla, primero las declaraciones y después lo anidado. Las versiones actuales de Sass emiten en orden de fuente, así que mezclarlas altera la cascada.

```scss
.c-card {
  // 1. Custom properties locales
  --_bg: var(--color-surface);

  // 2. Declaraciones (incluye @include de mixins que solo emiten declaraciones)
  display: grid;
  background: var(--_bg);

  // 3. Anidado: pseudoclases, estados, elementos, modificadores, queries
  @include tools.hover { --_bg: var(--color-surface-raised); }
  &__title { font-weight: 600; }
  &--featured { --_bg: var(--color-surface-raised); }
  @include tools.container(card, md) { grid-template-columns: auto 1fr; }
}
```

Orden sugerido de lo anidado: pseudoclases y estados → elementos (`&__`) → modificadores (`&--`) → queries.

## Anidamiento

- Máximo un nivel de selector: `&__elemento`, `&--modificador`, `&:pseudoclase`, `&[atributo]`.
- Dentro de ese nivel solo se permiten `@include` de queries o estados (`tools.container`, `tools.hover`…). Nunca otro selector.
- Nunca selectores descendientes (`.c-card .title`) ni anidamiento de elementos dentro de elementos (`&__body { &__title {} }`).
- `&__` genera selectores planos; no suma especificidad.

## Lo que no se usa

- `@extend` y placeholders (`%`): alteran el orden de la cascada y la especificidad entre módulos. Se usa un mixin.
- Variables SCSS para valores de diseño: se usa `var(--token)`.
- La función global `if()`: se usa `@if`.
- El API JS legacy de Sass (`render`, `renderSync`). En Vite 5, `css.preprocessorOptions.scss.api: 'modern-compiler'`; en Vite 6 o superior ya es el predeterminado.

## Herramientas del scaffold (`02-tools`)

| Herramienta | Uso |
|---|---|
| `tools.rem($px)` | px o número sin unidad → rem. Para traducir medidas del diseño |
| `tools.respond-to($bp)` | `@media (min-width)` con el mapa de breakpoints. Solo layout de página y tokens por breakpoint |
| `tools.container($name, $size)` | `@container <name> (min-width)` con el mapa de contenedores |
| `tools.focus-ring($offset)` | Outline de foco con `--color-border-focus` |
| `tools.motion-safe` | Envuelve transiciones y animaciones en `prefers-reduced-motion: no-preference` |
| `tools.hover` | `:hover` solo en dispositivos con hover real |
| `tools.visually-hidden($important)` | Ocultar visualmente conservando el contenido para lectores de pantalla |

Una herramienta nueva se agrega solo si se usa en 2 o más parciales.

## Loops

Sass genera modificadores a partir de los **nombres** de las escalas; los valores viven en los tokens.

```scss
@use '../01-settings/scales';

@each $key in scales.$space-keys {
  &--gap-#{$key} { --_gap: var(--space-#{$key}); }
}
```

`$space-keys` debe coincidir con los `--space-*` que existen en `_tokens.scss`.
