# Extracción desde Figma

## Vía MCP (preferida — el usuario pasa el link)
1. **Variables**: `get_variable_defs` sobre el nodo/página raíz del link. Devuelve definiciones con colección, tipo (COLOR/FLOAT/STRING/BOOLEAN), valores por modo y alias entre variables. Registrar: nombre original exacto, colección, modos y cadena de alias (un alias en Figma suele ser ya la relación primitivo→semántico del diseñador: consérvala).
2. **Estilos de texto**: no viajan en el export de variables. Obtenerlos vía `search_design_system` (estilos publicados) y/o `get_design_context` sobre nodos representativos (h1–h6, body, caption). Capturar: familia, tamaño, peso, line-height, letter-spacing, textTransform. Cada estilo de texto de Figma se descompone en primitivos tipográficos + un token compuesto de nivel semántico (ver normalizacion.md).
3. **Efectos**: sombras (effect styles o variables) y radios (variables numéricas o valores de nodos clave).
4. **Breakpoints**: rara vez son variables; buscar en páginas/frames nombrados por tamaño o en documentación del archivo. Si no existen, usar los del proyecto (CLAUDE.md o el `_breakpoints.scss` existente) o, en su defecto, 40/48/64/80rem (640/768/1024/1280px) — declarándolo como supuesto, no como extracción.
5. **Estilos de texto por breakpoint**: detectar pares del mismo estilo con valores distintos por dispositivo — por nombre (`H1/Desktop` + `H1/Mobile`, `Heading 1 - lg`) o por modos de una colección tipográfica. Registrar para cada estilo sus valores por breakpoint y el ancho del lienzo donde se definió cada uno.

## Vía export/JSON (fallback)
Si el usuario entrega un export de variables (JSON) o el spec del plugin: mismas reglas; los estilos de texto habrá que pedirlos por MCP o screenshot+confirmación.

## Modo degradado (sin variables ni estilos definidos)
Inferir la paleta y tipografía recorriendo nodos de las vistas principales. OBLIGATORIO: declarar el modo degradado, presentar el inventario inferido (valores + dónde aparecen) y esperar confirmación del usuario antes de normalizar. Los nombres originales del mapa de equivalencias serán "(inferido de <nodo>)".

## Modos de color
Si una colección trae ≥2 modos (Light/Dark u otros): extraer los valores de cada modo por variable. Verificar completitud: variables sin valor en algún modo se reportan como hueco. Los modos SOLO generan infraestructura de salida si existen aquí.
