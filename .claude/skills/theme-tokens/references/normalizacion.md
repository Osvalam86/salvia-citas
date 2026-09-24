# Normalización a 3 niveles

Entrada: inventario extraído (nombres del diseñador, cualquiera sea su criterio). Salida: tokens normalizados + mapa de equivalencias. La skill renombra y organiza; no inventa valores.

## Nivel 1 — Primitivos (descriptivos)
- **Colores**: agrupar por matiz (hue). Nombre = familia descriptiva + paso por luminosidad: `--color-blue-600`. El paso se asigna aproximando la luminosidad relativa del valor real a la escala estándar (50≈más claro … 950≈más oscuro); con pocos tonos, usar pasos separados (100/500/700), no consecutivos. Neutros → `gray-*` (o `neutral-*` si hay dos familias de grises). Blanco/negro → `--color-white`/`--color-black`.
- Si el diseñador ya nombró descriptivo (`blue/500`), conservar su escala tal cual (kebab-case).
- Nombres de rol en Figma (`primary`, `gris principal`) NO generan primitivos con ese nombre: su valor produce el primitivo descriptivo y el rol se preserva en el nivel 2.
- **Tipografía**: `--font-family-{base|heading|mono}`, `--font-size-{xs..4xl}` (escala por orden real de tamaños existentes), `--font-weight-{regular|medium|semibold|bold}` (solo los pesos presentes), `--line-height-*`, `--letter-spacing-*`.
- **Espaciado**: `--space-{1..n}` sobre los valores reales encontrados, orden ascendente; si siguen una base (4/8px) documentarla. **Radios**: `--radius-{sm|md|lg|full}`. **Sombras**: `--shadow-{sm|md|lg}` por elevación creciente. **Breakpoints**: claves `sm|md|lg|xl`; son valores de compilación (`var()` no funciona en `@media`), su forma de salida depende del stack.
- Unidades: rem para tamaños, espaciados y breakpoints (base 16 salvo projectContext); px solo en radios, bordes y hairlines; sombras tal cual diseño.

## Nivel 2 — Semánticos (por función; los consumen los componentes)
Set objetivo (crear solo los que tengan candidato real en el diseño; sin candidato → hueco reportado):
- Fondos/superficies: `--color-bg-page`, `--color-surface`, `--color-surface-raised`
- Texto: `--color-text-default`, `--color-text-muted`, `--color-text-inverse`, `--color-text-link`, `--color-text-disabled`
- Bordes: `--color-border-default`, `--color-border-strong`, `--color-border-focus`
- Acción: `--color-action-primary(-hover|-active|-disabled)`, `--color-action-secondary…`
- Feedback: `--color-feedback-{danger|success|warning|info}` (+ `-bg` suave y `-text` si existen)
- Tipografía compuesta: cada Text Style de Figma → grupo semántico `--text-{heading-1|body|caption}-…` apuntando a primitivos tipográficos.
- Marca: `--brand-primary` (alias del primitivo de marca) cuando ayude a multi-proyecto.

Mapeo de nombres del diseñador: por alias de Figma primero (si `primary → blue/600` existe como alias, esa ES la relación), después por nombre (`error`, `danger`, `rojo` → feedback-danger), después por uso observado. Ambigüedad real → preguntar.

## Nivel 3 — Componente
NO generar por adelantado. Solo si el encargo lo pide o el archivo trae colecciones de componente explícitas.

## Modos

**Modos por breakpoint no son temas.** Si una colección tiene modos nombrados por dispositivo o tamaño (`Mobile`/`Desktop`, `sm`/`lg`), no genera `[data-theme]`: es tipografía o espaciado responsive y se aplica `tipografia-responsive.md`.

Los modos de Figma se normalizan re-apuntando el nivel 2: mismos nombres semánticos, valores/alias distintos por modo. Los primitivos son idénticos en todos los modos (si el archivo trae "primitivos por modo", tratarlos como semánticos mal ubicados y documentarlo en el mapa).

## Mapa de equivalencias (obligatorio)
| Token generado | Nombre original Figma | Valor | Nivel |
Una fila por token, incluidos los huecos («— sin candidato en Figma»). Es el contrato de auditoría con el diseñador: debe permitir reconstruir la decisión de cada nombre.
