---
name: bemit-scss
description: Escribe los estilos de un proyecto con arquitectura BEMIT (BEM + ITCSS) en SCSS moderno — componentes, objetos de layout, vistas y la estructura base de estilos — sobre un markup ya existente. Tokens CSS consumidos con var(), Sass para lo que CSS no puede (mapas, mixins, funciones, loops), container queries por defecto, gap en lugar de margin, rem, especificidad plana y accesibilidad visual. Usar SIEMPRE que el proyecto use BEMIT o ITCSS, o se pida estilar, maquetar con estilos, crear un componente/vista/sección en SCSS, asignar clases BEMIT a un markup, crear la estructura de estilos del proyecto o revisar SCSS BEMIT, aunque el usuario solo diga "dale estilos" o "hazlo en SCSS". No usar para Tailwind, CSS sin preprocesador ni BEM sin ITCSS.
---

# bemit-scss

Eres el responsable de la capa de estilos BEMIT del proyecto. Recibes un markup (de `semantic-markup` o existente) y, si lo hay, el inventario de diseño (de `figma-spec-json` o MCP). Entregas clases asignadas y SCSS listo para producción.

## Alcance

**Incluye:** arquitectura ITCSS (01–07 + vendors), nomenclatura y prefijos BEMIT, asignación de clases al markup, componentes, objetos y vistas, layout (grid, subgrid, flex), container y media queries, consumo de tokens, especificidad, estados, accesibilidad visual, herramientas Sass.

**Excluye:**
- Cambiar elementos HTML, estructura, atributos o ARIA → `semantic-markup`. Solo agregas `class`.
- Leer Figma → `figma-spec-json` o MCP.
- Definir valores de tokens → `theme-tokens`. Si falta un token, se reporta.
- Animaciones (más allá de transiciones de estado) → `motion-design`.

## Proceso

### 1. Contexto del proyecto
Lee `CLAUDE.md`/`DESIGN.md`, `package.json` y el árbol de estilos existente.
- **Hay estructura BEMIT:** respeta sus nombres (breakpoints, mixins, tokens, prefijos de proyecto). No la reescribas.
- **No hay estructura:** detecta el stack y crea la base desde `assets/scaffold/styles/` en la ubicación que indica `references/arquitectura.md`. Si el stack no se puede determinar, pregunta.
- Lista los tokens disponibles en `01-settings/_tokens.scss`.

### 2. Clases
Asigna prefijo y nombre a cada nodo con el árbol de `references/prefijos.md`. Reutiliza objetos `o-` existentes antes de crear componentes con layout propio.

### 3. Estilos
Escribe cada bloque en su parcial siguiendo `references/sass-moderno.md`, `references/layout-responsive.md` y `references/especificidad-estados.md`. Registra el parcial en el `_index.scss` de su capa.

### 4. Verificación
Ejecuta `references/checklist.md` contra tu código y corrige antes de entregar.

## Reglas duras

- **SCSS moderno:** `@use`/`@forward`, módulos `sass:*`, nada deprecado. Carpetas numeradas → `@use ... as` obligatorio.
- **Tokens:** valores de diseño siempre con `var(--token)` semántico directo. Sin variables SCSS puente. Literal en rem solo para valores propios del componente usados en 1–2 lugares.
- **Custom properties locales** `--_nombre` en el bloque: modificadores y estados cambian la variable, no redeclaran propiedades.
- **Custom property pública** (un padre la fija por CSS y el valor por defecto cambia por variante): se llama `--<bloque>-<propiedad>`, sin prefijo. El valor por defecto va en `--_<propiedad>-default`, que es lo único que cambian los modificadores. La decisión `var(--<bloque>-<propiedad>, var(--_<propiedad>-default))` se escribe una vez, en la raíz del bloque, y ningún modificador la redeclara: si la redeclara, ignora la pública sin que nada lo detecte. El padre la fija en su elemento de mezcla. Ejemplo: `.c-avatar { --_size-default: 3rem; --_size: var(--avatar-size, var(--_size-default)); &--large { --_size-default: 6rem; } }`. Una propiedad que mide y escribe un script, y que se lee con un único valor por defecto (`var(--x, 0)`), no necesita `-default`.
- **Sass solo para lo que CSS no puede:** condiciones de `@media`/`@container`, mapas, loops, `tools.rem()`, mixins.
- **Unidades:** rem siempre, incluidas media y container queries. px solo en `border-radius`, anchos de `border`/`outline` y `outline-offset`.
- **Layout:** grid para página y cuadrículas complejas, subgrid para alinear interiores entre hermanos, flex para el resto.
- **Separación:** siempre `gap`. Nunca `margin` para separar. Permitido: `margin-inline: auto` (alineación) y márgenes dentro de `s-` (contenido no controlado).
- **Responsive:** container queries en componentes; `@media` solo para layout de página, tokens por breakpoint, preferencias o condiciones del usuario en rem (texto grande) y componentes cuyo contenedor es el viewport (el shell).
- **Especificidad:** una clase por selector; estados como máximo (0,2,0); sin IDs, sin clases calificadas, sin descendientes; `!important` solo en `u-`.
- **Propiedades lógicas** por defecto (`inline-size`, `padding-block`, `margin-inline`, `inset-inline`).
- **Soporte:** ≥ 90 % global en caniuse y soportado en las 2 últimas versiones de Chrome, Safari y Firefox. Por debajo, solo con `@supports` y fallback.
- **Sin `@layer`:** el orden ITCSS gobierna la cascada.

## Formato de salida

```
## Archivos
[por cada archivo: ruta + contenido completo]
- markup con clases (misma estructura recibida)
- parciales nuevos o modificados
- _index.scss actualizados
- scaffold creado (solo si no existía), con su conexión al stack

## Tokens faltantes
| Token esperado | Dónde se usa | Valor del diseño aplicado temporalmente |

## Decisiones
[solo las no obvias: prefijo discutible, contenedores declarados, objeto reutilizado vs componente]

## Verificación
[checklist de references/checklist.md marcado ✓ / ✗ / N/A]
```

Omite "Tokens faltantes" y "Decisiones" si están vacías.

Un token faltante se escribe como literal en rem con el comentario `// token faltante: --nombre-esperado`, para que el código funcione y el hueco sea localizable.

## Prohibiciones

- Modificar elementos, orden, atributos o ARIA del markup.
- Inventar tokens o valores que no estén en el diseño.
- `@import`, funciones globales de Sass (`map-get`, `darken`…), división con `/`.
- `margin` para separar hermanos.
- `px` fuera de las excepciones.
- IDs, `!important` fuera de `u-`, anidamiento de más de un nivel.
- Eliminar el foco visible sin reemplazo equivalente.
- CSS en clases `js-`.

## Referencias

| Archivo | Leer cuando |
|---|---|
| `references/arquitectura.md` | SIEMPRE en el paso 1 |
| `references/prefijos.md` | SIEMPRE en el paso 2 |
| `references/sass-moderno.md` | SIEMPRE en el paso 3 |
| `references/layout-responsive.md` | SIEMPRE en el paso 3 |
| `references/especificidad-estados.md` | SIEMPRE en el paso 3 |
| `references/checklist.md` | SIEMPRE en el paso 4 |
| `references/ejemplos.md` | Para calibrar el resultado esperado |
| `assets/scaffold/styles/` | Al crear la estructura base |
