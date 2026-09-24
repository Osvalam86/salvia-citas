---
name: theme-tokens
description: Extrae los tokens de diseño de un archivo de Figma (variables Y estilos de texto, vía MCP o export) y genera la configuración de theme/settings del proyecto normalizada en 3 niveles — colores, tipografía, espaciado, radios, sombras y breakpoints — en CSS custom properties, SCSS o Tailwind v4 (@theme). Usar SIEMPRE que se pida configurar el theme, crear el archivo de variables/settings/tokens de un proyecto, extraer variables o estilos de Figma, montar design tokens, preparar la capa de settings de ITCSS, o cuando el usuario comparta un link de Figma pidiendo la configuración inicial de estilos.
---

# Theme tokens: de Figma a settings normalizados

Convierte los tokens de un archivo de Figma — cualquiera sea el criterio de nombres del diseñador — en la configuración de theme del proyecto con una arquitectura idéntica en todos los stacks: **3 niveles** (primitivos descriptivos → semánticos por función → componente bajo demanda) con **CSS custom properties como capa primaria en todos los stacks** (accesibles desde JS/DOM).

Principio rector: **la skill renombra y organiza; no inventa diseño.** Todo valor de salida es trazable a un valor del archivo de Figma mediante el mapa de equivalencias.

## Proceso obligatorio

### Paso 0 — Contexto del proyecto
Lee `CLAUDE.md`/`DESIGN.md` si existen. Determina: método de estilado (CSS / SCSS / Tailwind v4), estructura de carpetas de estilos, y si ya existe un archivo de tokens (entonces el encargo es actualizar, no regenerar: diff, no reemplazo). Si el método de estilado no es claro, **pregunta**.
Si el proyecto usa BEMIT (existe `01-settings/` o se usa la skill `bemit-scss`), los archivos de salida son los de esa capa y se actualizan en su lugar.

### Paso 1 — Extracción desde Figma
Con el link/nodo del usuario, extrae vía MCP según `references/extraccion-figma.md`:
- **Variables** (colores, números, strings): colecciones, alias entre colecciones y **modos** definidos.
- **Estilos de texto** (el export nativo de Figma no los incluye; el MCP sí los expone): familia, tamaño, peso, line-height, letter-spacing, transform.
- **Efectos**: sombras y radios (variables o estilos de efecto).

Reporta el inventario extraído antes de normalizar: cuántas variables, colecciones, modos, estilos de texto. Si el archivo no define variables ni estilos (valores sueltos en capas), entra en **modo degradado**: infiere la paleta desde los nodos, decláralo explícitamente y pide confirmación del inventario antes de continuar.

### Paso 2 — Normalización a 3 niveles
Aplica `references/normalizacion.md`. Resumen de reglas duras:

1. **Primitivos descriptivos**: nombrados por lo que son (`blue-500`, `gray-100`, `font-size-lg`), nunca por rol. El paso numérico de color se asigna por luminosidad del valor real al step estándar más cercano.
2. **Semánticos por función**: `bg-*`, `surface-*`, `text-*`, `border-*`, `action-*`, `feedback-*` — apuntan a primitivos. Aquí se mapean los nombres de rol que traiga el diseñador (`primary`, `gris principal`).
3. **Sin valores inventados**: si Figma trae 4 tonos de azul, la salida tiene 4 primitivos de azul — no se completa la rampa. Si falta un semántico esencial sin candidato claro (p. ej. no hay color de error), se reporta el hueco; no se inventa.
4. **Mapa de equivalencias Figma→token obligatorio** en la salida: cada token con su nombre original de Figma y valor. Es el contrato auditable con el diseño.
5. **Colisiones y ambigüedades se preguntan**, no se resuelven en silencio (dos variables distintas con el mismo valor y roles confusos, alias circulares, modos incompletos).

### Paso 3 — Generación por stack
Carga solo el adaptador correspondiente:
- CSS puro → `references/salida-css.md`
- SCSS (ITCSS/BEMIT) → `references/salida-scss.md` — custom properties en `_tokens.scss` + mapas Sass solo para lo que se resuelve en compilación (breakpoints, claves de escala). Sin variables SCSS puente.
- Tailwind v4 → `references/salida-tailwind-v4.md` — `@theme` directo en CSS, sin config JS.

**Tipografía responsive**: si Figma define el mismo estilo de texto con valores distintos por breakpoint, aplica `references/tipografia-responsive.md`. Por defecto el token semántico se redefine por breakpoint; la tipografía fluida (`clamp()`) solo si el usuario la pide.

**Modos (light/dark)**: solo si el archivo de Figma trae modos definidos. Se implementan re-apuntando la capa semántica; los primitivos no cambian entre modos. Si Figma no trae modos, no se genera infraestructura de dark mode (se anota como no definido en diseño).

### Paso 4 — Autoverificación
Ejecuta `references/checklist-tokens.md`. Incluye el reporte de contraste: pares semánticos texto/fondo que no alcanzan 4.5:1 (o 3:1 en UI) se **reportan** con el criterio WCAG — nunca se corrigen en silencio alterando valores del diseño.

## Formato de salida (plantilla obligatoria)

```
## Inventario extraído
[colecciones, nº variables por tipo, modos, estilos de texto; modo degradado si aplica]

## Archivos generados
[los archivos de settings, completos y listos para producción]

## Mapa de equivalencias
[tabla: Token generado | Nombre original en Figma | Valor | Nivel]

## Huecos y reportes
[semánticos sin candidato, pares de contraste que fallan AA, ambigüedades resueltas por pregunta]

## Verificación
[checklist marcado ✓/✗/N/A]
```

## Prohibiciones

- Prohibido inventar valores, tonos, tamaños o escalas que no existan en el archivo de Figma.
- Prohibido usar primitivos directamente como API de consumo: los componentes consumen la capa semántica.
- Prohibido duplicar un valor literal en dos capas (SCSS/Tailwind siempre referencian la custom property o el token, según el adaptador).
- Prohibido nombrar primitivos por rol (`primary-500` como primitivo).
- Prohibido corregir en silencio valores que fallan contraste: se reportan.
- Prohibido generar dark mode si Figma no define modos.
- Prohibido generar variables SCSS puente (`$token: var(--token)`): los componentes consumen `var(--token)` directo.
- Prohibido generar tipografía fluida si el usuario no la pidió.
- Prohibido envolver los tokens en `@layer`.

## Referencias — cuándo leer cada una

| Archivo | Leer cuando |
|---|---|
| `references/extraccion-figma.md` | SIEMPRE, Paso 1 |
| `references/normalizacion.md` | SIEMPRE, Paso 2 |
| `references/salida-css.md` / `salida-scss.md` / `salida-tailwind-v4.md` | Solo el del stack |
| `references/tipografia-responsive.md` | Si un estilo de texto cambia por breakpoint o se pide tipografía fluida |
| `references/checklist-tokens.md` | SIEMPRE, Paso 4 |
| `references/ejemplos.md` | Ante dudas de formato del mapa o de los settings |
