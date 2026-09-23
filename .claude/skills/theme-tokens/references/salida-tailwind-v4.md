# Salida: Tailwind CSS v4

Todo en CSS, sin `tailwind.config.js`. Archivo `styles/theme.css` (importado tras `@import "tailwindcss";`).

## Namespaces de @theme (generan utilidades)
| Token | Namespace | Utilidades |
|---|---|---|
| Colores | `--color-*` | bg-*, text-*, border-*… |
| Familias | `--font-*` | font-* |
| Tamaños de texto | `--text-*` (+ `--text-{n}--line-height`) | text-* |
| Pesos | `--font-weight-*` | font-* |
| Tracking | `--tracking-*` | tracking-* |
| Espaciado | `--spacing-*` | p-*, m-*, gap-*… |
| Radios | `--radius-*` | rounded-* |
| Sombras | `--shadow-*` | shadow-* |
| Breakpoints | `--breakpoint-*` | variantes sm:, md:… |

## Estructura de salida
```css
@theme {
  /* Primitivos */
  --color-blue-600: #2455d4;
  --color-gray-900: #111827;
  --text-lg: 1.125rem;
  --text-lg--line-height: 1.75rem;
  --radius-md: 8px;
  --breakpoint-md: 48rem;

  /* Semánticos (generan también utilidades: bg-surface, text-default…) */
  --color-surface: var(--color-white);
  --color-text-default: var(--color-gray-900);
  --color-action-primary: var(--color-blue-600);
}
```
- Opcional para no inflar el CSS: primitivos que no deban generar utilidades pueden vivir en `:root` normal y ser referenciados desde `@theme` — decidirlo con el usuario si el proyecto es sensible a tamaño.
- Resetear escalas no usadas del default de Tailwind solo si el usuario quiere theme estricto: `--color-*: initial;` antes de declarar.

## Tipografía por breakpoint
`@theme` no admite media queries. La redefinición va después, sobre `:root`, con el valor en rem; las utilidades (`text-heading-1`) leen la variable y cambian sin tocar el markup.
```css
@media (min-width: 64rem) {
  :root {
    --text-heading-1: var(--text-3xl);
  }
}
```
No usar `@theme inline` para estos tokens: inline copia el valor en la utilidad y la redefinición deja de tener efecto.

Breakpoints siempre en rem (`--breakpoint-md: 48rem`), igual que los valores por defecto de Tailwind v4.

## Modos (solo si Figma los define)
```css
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
[data-theme="dark"] {
  --color-text-default: var(--color-gray-50);
}
```
Los semánticos se redefinen en el selector del modo; las utilidades (`text-default`) los recogen sin cambios en el markup.
