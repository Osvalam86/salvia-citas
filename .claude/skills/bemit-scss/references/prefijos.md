# Prefijos y nomenclatura

## Árbol de decisión

Recorre en orden; el primer "sí" decide.

```
1. ¿Solo existe para querySelector?                         → js-  (sin CSS; no en React/Angular)
2. ¿Envuelve HTML que no controlas (CMS, Markdown)?          → s-
3. ¿Solo redefine tokens para un contexto (modo, marca)?     → t-
4. ¿Es una sobrescritura excepcional que necesita !important? → u-
5. ¿Es un estado dinámico sin atributo nativo/ARIA?          → is- / has-
6. ¿Sigue siendo útil sin colores, bordes, sombras ni tipo?  → o-
7. Tiene identidad visual propia                             → c-
```

Antes del paso 5: si el estado existe como atributo nativo o ARIA, se estiliza el atributo, no se crea clase (ver `especificidad-estados.md`).

## BEM dentro del prefijo

```
.c-card                 bloque
.c-card__title          elemento
.c-card--featured       modificador de bloque
.c-card__title--large   modificador de elemento
```

- **Nombres en inglés, kebab-case**, por función, no por apariencia: `c-card__meta`, no `c-card__gray-text`.
- **Un solo nivel de elemento.** Nunca `c-card__body__title`: es `c-card__title` aunque esté anidado en `c-card__body` en el DOM.
- **El modificador nunca va solo:** `class="c-card c-card--featured"`.
- **Los contenedores sin nombre del diseño** (`Frame`, `unnamed-container`) se nombran por su función de layout: `c-card__header`, `c-app-bar__text`.
- **Un bloque dentro de otro es otro bloque.** Un botón dentro de una card es `c-button`, no `c-card__button`. Si la card necesita posicionarlo, usa un elemento de la card en el mismo nodo: `class="c-button c-card__action"` (mezcla BEM). El elemento solo aporta colocación; el bloque aporta el diseño.

## Criterio por prefijo

### `o-` Objetos
Estructura pura. Si quitas colores, bordes, sombras y tipografía y sigue siendo útil, es objeto.
- Incluidos en el scaffold: `o-wrapper`, `o-layout` (grid), `o-stack` (flex en columna), `o-cluster` (flex en fila con wrap).
- Crear uno nuevo solo si el patrón se repite en 3 o más componentes o vistas.
- Nunca: `o-card` con borde o sombra (tiene diseño: es `c-`).

### `c-` Componentes
UI con identidad visual. Un archivo por bloque: `06-components/_c-card.scss`.
- Nunca: `c-flex` (es estructura: es `o-`).

### `u-` Utilidades
Excepcionales, con `!important`. Si un proyecto tiene más de un puñado, algo está mal.
- Válidas: `u-sr-only`, `u-sr-only-focusable`, `u-hidden`, alineaciones de texto puntuales.
- Nunca: `u-flex`, `u-color-primary`, `u-radius-md` (son sistema base: tokens, objetos o componente).

### `t-` Temas
Solo redefinen tokens semánticos. Nunca propiedades sueltas.
```scss
.t-dark {
  --color-bg-page: var(--color-gray-950);
  --color-text-default: var(--color-gray-50);
}
```

### `s-` Scope
Contenido no controlado. Única excepción a "sin margins": no hay contenedor flex/grid que gobernar.
```scss
.s-prose {
  > * + * {
    margin-block-start: var(--space-4);
  }

  > :is(h2, h3) {
    margin-block-start: var(--space-8);
  }
}
```

### `is-` / `has-` Estados
Solo sin equivalente nativo o ARIA (por ejemplo, `is-loading` sin `aria-busy` aplicable, `is-open` de un panel que no expone `aria-expanded`). Siempre encadenados al bloque: `.c-tab.is-loading`, nunca `.is-loading` solo en un componente.

### `js-` Hooks
Nunca llevan CSS. Se documentan en `_js-hooks.scss`. En React y Angular no se usan.

## Vistas

Una vista (página) no es un componente. Se compone con objetos (`o-wrapper`, `o-layout`, `o-stack`) y componentes existentes. Solo si la vista tiene un layout propio que no resuelven los objetos, se crea un componente de layout: `c-dashboard-layout`, con `grid-template-areas`.
