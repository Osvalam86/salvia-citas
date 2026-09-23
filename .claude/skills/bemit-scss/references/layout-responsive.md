# Layout y responsive

## Qué usar

| Caso | Herramienta |
|---|---|
| Layout de página, regiones, sidebars | Grid (`o-layout` o componente de layout con `grid-template-areas`) |
| Cuadrículas de tarjetas y galerías | Grid; `repeat(auto-fit, minmax(min(X, 100%), 1fr))` |
| Alinear el interior de elementos hermanos (títulos, precios o CTAs de cards a la misma altura) | Subgrid |
| Apilar o alinear en un eje (auto-layout de Figma) | Flex (`o-stack`, `o-cluster` o el propio componente) |

Traducción del auto-layout de Figma: dirección → `flex-direction`; espaciado → `gap`; padding → `padding`; *fill container* → `flex: 1` o `inline-size: 100%` según el eje; *hug contents* → sin dimensión.

## Separación: solo `gap`

- Todo contenedor con hijos separados es flex o grid y usa `gap`.
- Si un contenedor necesita separaciones distintas entre hijos, se agrupan en subcontenedores (que ya existen en el diseño) o se usa grid con filas.
- Los elementos no llevan margin (el reset los pone en 0).
- Permitido:
  - `margin-inline: auto` para centrar o empujar.
  - Márgenes dentro de `s-`.

## Subgrid

```scss
.c-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  gap: var(--space-6);
}

.c-product-card {
  display: grid;
  grid-row: span 3;               // media, cuerpo, acciones
  grid-template-rows: subgrid;
  gap: var(--space-3);
}
```
El padre define la cuadrícula; cada tarjeta ocupa N filas y las hereda. El número de filas es el número de zonas del diseño.

## Container queries (por defecto en componentes)

Un componente se adapta al ancho de su contenedor, no al del viewport.

```scss
.c-card {
  container: card / inline-size;   // el bloque declara el contenedor

  &__body {                        // sus elementos lo consultan
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    @include tools.container(card, md) {
      flex-direction: row;
    }
  }
}
```

Reglas:
1. **El bloque declara el contenedor y sus elementos lo consultan.** Un elemento no puede consultar su propio tamaño: el bloque no cambia sus propias propiedades con su container query.
2. **`container-name` obligatorio**, igual al nombre del bloque sin prefijo (`card`, `app-bar`). Así no se depende del ancestro más cercano.
3. **El contenedor necesita un ancho que venga del contexto:** bloque, celda de grid, flex item con `flex: 1` o `inline-size` definido. `inline-size` containment anula el ancho intrínseco: un contenedor con ancho *hug* (`inline-flex`, `inline-block`, flex item sin base, `fit-content`) colapsa a 0.
4. **Si el padre tiene ancho fijo, la container query nunca cambia de estado.** En ese caso se reporta como decisión; no hay container query útil.
5. **Umbrales en `01-settings/_containers.scss`**, en rem. Se ajustan al contenido real del componente, no a los breakpoints de viewport.
6. **Unidades de contenedor** (`cqi`) disponibles para tamaños relativos dentro del componente, siempre con límite en rem: `clamp(1rem, 4cqi, 1.5rem)`.

Si el bloque necesita cambiar su propio layout según su ancho, se declara el contenedor en un elemento interno que envuelve el contenido (que ya existe en el markup) o en el padre. Nunca se agrega un wrapper que no esté en el markup.

## Media queries (solo estos casos)

| Uso | Ejemplo |
|---|---|
| Layout de página y objetos `o-` | `@include tools.respond-to(md) { grid-template-columns: … }` |
| Redefinir tokens por breakpoint | Tipografía que cambia en desktop: se redefine `--text-*` en `:root` dentro de la media query (en `_tokens.scss`, lo hace `theme-tokens`). El componente no cambia |
| Preferencias del usuario | `prefers-reduced-motion`, `prefers-color-scheme`, `hover`, `pointer`, `forced-colors` |

Siempre mobile-first (`min-width`), en rem, con el mixin. Nunca un valor en px ni una media query escrita a mano.

## Dimensiones

- Propiedades lógicas: `inline-size`, `block-size`, `min-inline-size`, `max-inline-size`, `padding-inline/block`, `inset-inline/block`, `margin-inline`.
- Nunca `height` fijo en contenedores de texto: rompe con texto al 200 %. Se usa `min-block-size`.
- Anchos fijos del diseño en contenedores con texto → `max-inline-size` + ancho fluido.
- Relaciones de aspecto de media → `aspect-ratio`.
- Viewport en móviles: `100dvh`/`100svh` en lugar de `100vh` cuando se necesite el alto real.

## Soporte

Umbral: ≥ 90 % global en caniuse **y** soportado en las 2 últimas versiones de Chrome, Safari y Firefox.
- Cumplen y se usan directo: grid, subgrid, flex `gap`, container size queries, unidades `cqi`, `:has()`, `:is()`, `:where()`, `:focus-visible`, `clamp()`, `min()`, `max()`, propiedades lógicas, `aspect-ratio`, `dvh`/`svh`.
- Mejora progresiva (si no se soporta, no rompe nada): `text-wrap: balance` en encabezados.
- Cualquier otra propiedad reciente se verifica en caniuse antes de usarla. Si no cumple, solo con `@supports` y fallback funcional; si no hay fallback, no se usa.
