# Salida: CSS puro

Archivo: `styles/settings/tokens.css` (o la capa de settings del proyecto). Sin `@layer`: el orden de importación gobierna la cascada.

```css
:root {
  /* ===== Nivel 1: primitivos ===== */
  --color-blue-600: #2455d4;
  --color-gray-900: #111827;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;
  --space-4: 1rem;
  --radius-md: 8px;
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.06);

  /* ===== Nivel 2: semánticos ===== */
  --color-text-default: var(--color-gray-900);
  --color-action-primary: var(--color-blue-600);
  --text-heading-1-size: var(--font-size-2xl);
}

/* ===== Redefinición por breakpoint (lg = 64rem) ===== */
@media (min-width: 64rem) {
  :root {
    --text-heading-1-size: var(--font-size-3xl);
  }
}
```

## Modos (solo si Figma los define)
```css
:root { color-scheme: light dark; }
[data-theme="dark"] {
  --color-text-default: var(--color-gray-50);
  --color-action-primary: var(--color-blue-400);
}
```
- Selector `[data-theme]` (control por JS) como mecanismo primario; opcional sincronía con `prefers-color-scheme` si el proyecto lo pide. Solo se redefinen semánticos.

## Reglas
- Primitivos y semánticos en el mismo archivo, secciones separadas y comentadas por categoría (colores/tipografía/espaciado/radios/sombras).
- Breakpoints: las custom properties no funcionan en media queries. Se documentan en un comentario de cabecera (clave → valor en rem) y se escriben como valor literal en rem en cada `@media`.
- Los componentes consumen solo el nivel 2.
