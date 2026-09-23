# Ejemplos

Calibran el resultado esperado. Los tokens asumen una capa semántica generada por `theme-tokens`. No copies nombres ni valores a otros proyectos.

## Ejemplo 1 — AppBar (flujo completo)

**Contexto:** el spec de `figma-spec-json` (UI/AppBar, solo mobile) ya pasó sus bloqueantes: el círculo izquierdo es el botón "Abrir menú" y el derecho, el botón "Perfil". `semantic-markup` entregó la estructura. El proyecto ya tiene la base BEMIT; el token del fondo verde claro no existe.

**Markup recibido → con clases** (misma estructura; solo se agregó `class`):

```html
<header class="c-app-bar">
  <button type="button" class="c-icon-button" aria-label="Abrir menú">
    <svg class="c-icon-button__icon" aria-hidden="true" focusable="false"><!-- ícono --></svg>
  </button>
  <div class="c-app-bar__text">
    <p class="c-app-bar__label">ENTREGAR EN</p>
    <p class="c-app-bar__address">Av. Ámsterdam 241</p>
  </div>
  <button type="button" class="c-icon-button c-icon-button--accent" aria-label="Perfil">
    <svg class="c-icon-button__icon" aria-hidden="true" focusable="false"><!-- ícono --></svg>
  </button>
</header>
```

`06-components/_c-app-bar.scss`
```scss
@use '../02-tools' as tools;

.c-app-bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-block: var(--space-4);
  padding-inline: var(--space-5);
  background: var(--color-surface);

  &__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.0625rem; // valor propio de 1px, único uso
    min-inline-size: 0; // permite encoger con direcciones largas
  }

  &__label {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    line-height: 1.4;
    color: var(--color-text-muted);
  }

  &__address {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    line-height: 1.33;
    color: var(--color-text-default);
  }
}
```

`06-components/_c-icon-button.scss`
```scss
.c-icon-button {
  --_bg: var(--color-surface-raised);
  --_border: var(--color-border-default);

  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  inline-size: 2.25rem;
  block-size: 2.25rem;
  padding: 0;
  background: var(--_bg);
  border: 1px solid var(--_border);
  border-radius: 50%;

  &__icon {
    inline-size: 1.25rem;
    block-size: 1.25rem;
  }

  &--accent {
    --_bg: #dce8e0; // token faltante: --color-surface-accent
    --_border: transparent; // visible en forced-colors
  }
}
```

`06-components/_index.scss` (fragmento)
```scss
@use 'c-app-bar';
@use 'c-icon-button';
```

**Salida del reporte:**

```
## Tokens faltantes
| Token esperado | Dónde se usa | Valor del diseño aplicado temporalmente |
|---|---|---|
| --color-surface-accent | c-icon-button--accent, fondo | #dce8e0 |

## Decisiones
- Los botones circulares son el bloque c-icon-button (reutilizable), no elementos de c-app-bar.
- Sin container query: el diseño solo define mobile y no hay variación que adaptar. No se inventa.
- Sin estilos de hover: el diseño no los define. El foco es el global de 04-elements.
- c-app-bar__text con min-inline-size: 0 para que una dirección larga no desborde.

## Verificación
[checklist completo marcado]
```

Notas de calibración:
- El ancho de 390 del spec no aparece: es el lienzo mobile y el bloque es fluido.
- Radio 999 → `50%` (círculo). Borde de 1px en px.
- `line-height` sin unidad: 14/10 = 1.4 y 20/15 ≈ 1.33.
- `gap: 0.0625rem` es literal: un valor propio de un solo uso.
- `--_border: transparent` en la variante sin borde: en `forced-colors` el borde se vuelve visible y el botón conserva su límite.
- El texto "ENTREGAR EN" se deja como viene en el markup.

## Ejemplo 2 — Card de producto: subgrid + container query + estado por `:has()`

**Markup** (el padre reutiliza el objeto de layout; cada card ocupa 3 filas: media, cuerpo y acciones):

```html
<ul class="o-layout o-layout--auto-fit" role="list">
  <li class="c-product-card">
    <img class="c-product-card__media" src="…" alt="…">
    <div class="c-product-card__body">…</div>
    <a class="c-product-card__link" href="…">Ver producto</a>
  </li>
</ul>
```

`06-components/_c-product-card.scss`
```scss
@use '../02-tools' as tools;

.c-product-card {
  --_border: var(--color-border-default);

  container: product-card / inline-size;
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface-raised);
  border: 1px solid var(--_border);
  border-radius: var(--radius-md);

  &:has(:focus-visible) {
    --_border: var(--color-border-focus);
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    @include tools.container(product-card, sm) {
      flex-direction: row;
      justify-content: space-between;
    }
  }

  &--featured {
    --_border: var(--color-border-strong);
  }
}
```

Notas de calibración:
- No se creó `c-product-grid`: `o-layout--auto-fit` ya resuelve la cuadrícula. Reutilizar el objeto va antes que crear un componente.
- Subgrid: cada card hereda las filas del padre, así media, cuerpo y enlace quedan alineados entre cards aunque el texto varíe.
- La card declara `container: product-card`; su elemento `__body` lo consulta. La card no cambia sus propias propiedades con su container query.
- `:has(:focus-visible)` pesa (0,2,0) y gana al modificador (0,1,0): el borde de foco siempre prevalece.
- `.c-product-card__media`, `__link` y el resto de elementos no mostrados siguen el mismo patrón.
