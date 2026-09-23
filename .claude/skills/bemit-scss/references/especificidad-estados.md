# Especificidad, estados y accesibilidad visual

## Presupuesto de especificidad

| Selector | Especificidad | Uso |
|---|---|---|
| `:where(...)` | (0,0,0) | 03-generic y 04-elements |
| `.c-card`, `.c-card__title`, `.c-card--featured` | (0,1,0) | Bloques, elementos, modificadores |
| `.c-button:hover`, `.c-tab[aria-selected='true']`, `.c-field:has(:user-invalid)` | (0,2,0) | Estados: techo máximo |
| `.u-*` con `!important` | — | Solo utilidades |

Prohibido: IDs, clases calificadas con elemento (`button.c-button`), selectores descendientes (`.c-card .c-button`), encadenar dos bloques, `!important` fuera de `u-`.

Cuidado: `:is()` y `:has()` toman la especificidad de su argumento más pesado. `:is(.a, #b)` pesa como un ID. Dentro de ellos, solo clases, atributos, pseudoclases y elementos.

## Custom properties locales

El bloque declara sus variables `--_` apuntando a tokens. Modificadores y estados **solo cambian variables**. Así todo queda en (0,1,0)–(0,2,0) y no hay guerras de cascada.

Cada modificador define el juego completo de variables que le afectan, incluidas las de estado. Los estados solo conmutan hacia la variable correspondiente:

```scss
.c-button {
  --_bg: var(--color-action-primary);
  --_bg-hover: var(--color-action-primary-hover);
  --_fg: var(--color-text-inverse);

  background: var(--_bg);
  color: var(--_fg);

  @include tools.hover { --_bg: var(--_bg-hover); }

  &--secondary {
    --_bg: var(--color-action-secondary);
    --_bg-hover: var(--color-action-secondary-hover);
  }
}
```

Si el hover redefiniera `--_bg` con un token fijo, la variante secundaria mostraría el hover de la primaria (el hover pesa más que el modificador). Por eso el estado apunta a `--_bg-hover` y cada variante lo define.

## Estados: atributo nativo o ARIA primero

El estado vive en un solo lugar (el atributo que ya pone `semantic-markup` o el JS) y el estilo lo lee. Se crea `is-`/`has-` solo si no hay equivalente.

| Estado del diseño | Selector |
|---|---|
| Hover | `@include tools.hover` |
| Foco | `:focus-visible` (nunca `:focus` solo) |
| Presionado momentáneo | `:active` |
| Toggle presionado | `[aria-pressed='true']` |
| Deshabilitado | `:disabled`; `[aria-disabled='true']` si debe seguir siendo enfocable |
| Expandido | `[aria-expanded='true']` |
| Seleccionado (tab, opción) | `[aria-selected='true']` |
| Página o paso actual | `[aria-current='page']`, `[aria-current='step']` |
| Marcado | `:checked` |
| Inválido | `:user-invalid` o `[aria-invalid='true']` |
| Cargando | `[aria-busy='true']` |
| Abierto (`details`, `dialog`) | `[open]` |
| Padre según hijo | `:has()`: `.c-field:has(:user-invalid)` |

Antipatrón eliminado: `.is-disabled { pointer-events: none }`. Bloquea el puntero pero no el teclado ni anuncia nada. Se usa el atributo nativo o ARIA.

El estado deshabilitado nunca depende solo de la opacidad: debe mantener un contraste mínimo legible o reportarse como hueco del diseño.

## Accesibilidad visual (obligatoria en cada componente)

**Foco**
- El foco global viene de `04-elements/_focus.scss`. Un componente puede ajustarlo (offset, color para fondos oscuros) pero nunca eliminarlo sin reemplazo igual o más visible.
- `outline`, no `box-shadow`: el outline sobrevive en `forced-colors`.
- Si el componente recorta el contenido (`overflow: hidden`), usa `outline-offset` negativo para que el foco no quede oculto.

**Modo de alto contraste (`forced-colors`)**
- Los límites esenciales se dibujan con `border`, no con `box-shadow` ni solo con fondo. Un botón relleno sin borde lleva `border: 1px solid transparent`, que se vuelve visible en alto contraste.
- Un estado que solo se comunica con color (seleccionado, actual) necesita un indicador adicional (borde, subrayado, ícono) o un ajuste en `@media (forced-colors: active)`.

**Tamaño de objetivo**
- Todo control interactivo mide al menos 24×24 px (`min-inline-size` y `min-block-size: 1.5rem`), criterio 2.5.8. Se apunta a 44×44 cuando el diseño lo permita.

**Movimiento**
- Toda `transition` o `animation` va dentro de `@include tools.motion-safe`.

**Texto**
- `line-height` sin unidad.
- Sin `block-size` fijo en contenedores de texto (criterios 1.4.4 y 1.4.12).
- Nada se revela solo con `:hover`: siempre se acompaña de `:focus-visible` o `:focus-within`.
