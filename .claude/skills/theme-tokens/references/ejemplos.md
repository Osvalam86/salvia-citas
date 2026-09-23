# Ejemplo entrada → salida (calibración)

> **ADVERTENCIA:** el stack del ejemplo (Tailwind v4) es ilustrativo; en ejecución real decide el Paso 0. Lo que el ejemplo fija: nivel de detalle del inventario, criterio de normalización, formato del mapa y de los huecos.

**Encargo:** "Configura el theme de este proyecto" + link de Figma. Paso 0: proyecto Next.js con Tailwind v4.

**Extracción (Paso 1):** colección "Colores" sin modos: `Primario/Azul = #2455D4`, `Primario/Azul oscuro = #1A3FA0`, `Gris/Principal = #1F2937`, `Gris/Secundario = #6B7280`, `Gris/Claro = #E5E7EB`, `Blanco = #FFFFFF`, `Rojo error = #DC2626`. Text Styles: `H1 Desktop` (Source Sans Pro 32/40 600), `Body` (16/24 400), `Caption` (14/20 400). Sin variables de espaciado (valores 8/16/24/32 observados en autolayouts — inferidos, confirmados por el usuario). Radios: 8px. Sin sombras. Sin modos → sin dark mode.

## Salida (extracto)

### Inventario extraído
7 variables de color (1 colección, sin modos), 3 estilos de texto, 0 variables de espaciado (4 valores inferidos de autolayout — confirmados), 1 radio, 0 sombras, 0 breakpoints (se usan los del proyecto: 40/48/64/80rem — supuesto declarado).

### Archivos generados — `styles/theme.css`
```css
@theme {
  /* Primitivos — color */
  --color-blue-600: #2455d4;
  --color-blue-800: #1a3fa0;
  --color-gray-800: #1f2937;
  --color-gray-500: #6b7280;
  --color-gray-200: #e5e7eb;
  --color-white: #ffffff;
  --color-red-600: #dc2626;

  /* Primitivos — tipografía */
  --font-sans: "Source Sans Pro", ui-sans-serif, system-ui, sans-serif;
  --text-3xl: 2rem;      --text-3xl--line-height: 2.5rem;
  --text-base: 1rem;     --text-base--line-height: 1.5rem;
  --text-sm: 0.875rem;   --text-sm--line-height: 1.25rem;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;

  /* Primitivos — espaciado y radios */
  --spacing-2: 0.5rem; --spacing-4: 1rem; --spacing-6: 1.5rem; --spacing-8: 2rem;
  --radius-md: 8px;

  /* Semánticos */
  --color-text-default: var(--color-gray-800);
  --color-text-muted: var(--color-gray-500);
  --color-border-default: var(--color-gray-200);
  --color-surface: var(--color-white);
  --color-action-primary: var(--color-blue-600);
  --color-action-primary-hover: var(--color-blue-800);
  --color-feedback-danger: var(--color-red-600);
}
```

### Mapa de equivalencias
| Token generado | Nombre original Figma | Valor | Nivel |
|---|---|---|---|
| --color-blue-600 | Primario/Azul | #2455D4 | 1 |
| --color-blue-800 | Primario/Azul oscuro | #1A3FA0 | 1 |
| --color-gray-800 | Gris/Principal | #1F2937 | 1 |
| --color-action-primary | Primario/Azul (rol) | → blue-600 | 2 |
| --color-action-primary-hover | Primario/Azul oscuro (rol por nombre) | → blue-800 | 2 |
| --text-3xl (+lh) | H1 Desktop | 32/40 | 1 |
| --spacing-2..8 | (inferido de autolayouts — confirmado) | 8/16/24/32 | 1 |
| --color-feedback-success | — sin candidato en Figma | — | hueco |

### Huecos y reportes
- Sin candidatos: feedback-success/warning/info, border-focus, text-disabled, action-primary-disabled, sombras. Pedirlos al diseñador o definirlos contigo antes de que los componentes los necesiten.
- Contraste: `text-muted` (#6B7280) sobre `surface` (#FFF) = 4.83:1 ✓; `action-primary` como texto sobre blanco = 5.9:1 ✓. Sin fallos AA en los pares presentes.
- "Azul oscuro" asignado a hover por convención de nombre; confirmado contigo (ambigüedad → pregunta).
