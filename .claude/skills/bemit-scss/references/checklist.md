# Checklist de verificación

Marca cada ítem como ✓ (cumple), ✗ (corregir antes de entregar) o N/A. No se entrega con ✗.

## Markup
- [ ] Estructura, elementos, orden, atributos y ARIA idénticos a los recibidos; solo se agregó `class`
- [ ] Modificadores siempre junto a su clase base
- [ ] Un solo nivel de elemento BEM (sin `__a__b`)
- [ ] Bloques anidados como bloques propios (mezcla BEM para colocarlos)

## Arquitectura
- [ ] Cada bloque en su parcial con prefijo en el nombre (`_c-card.scss`)
- [ ] Parcial registrado en el `_index.scss` de su capa
- [ ] Prefijo decidido con el árbol de `prefijos.md`; ningún `u-` que sea sistema base
- [ ] Sin CSS en clases `js-`

## Sass
- [ ] Solo `@use`/`@forward` con namespace; `as` en carpetas numeradas
- [ ] Solo funciones por módulo (`map.get`, `math.div`…); sin `/` para dividir
- [ ] Declaraciones antes de lo anidado
- [ ] Anidamiento de un nivel; sin `@extend` ni placeholders

## Valores
- [ ] Valores de diseño con `var(--token)` semántico; sin variables SCSS puente
- [ ] Literales solo para valores propios usados en 1–2 lugares, en rem
- [ ] Tokens faltantes: literal + `// token faltante: --nombre` y reportados
- [ ] rem en todo; px solo en radius, bordes, outline y outline-offset
- [ ] Media y container queries en rem y vía mixin

## Layout
- [ ] Separación entre hermanos solo con `gap`; ningún margin salvo `margin-inline: auto` o `s-`
- [ ] Grid para página y cuadrículas; subgrid para alinear interiores; flex para el resto
- [ ] Componentes con container query: el bloque declara `container: <nombre> / inline-size` y sus elementos consultan
- [ ] El contenedor recibe ancho del contexto (no es *hug* ni de ancho fijo)
- [ ] Media queries solo para layout de página, tokens por breakpoint o preferencias del usuario
- [ ] Propiedades lógicas; sin alto fijo en contenedores de texto

## Especificidad y estados
- [ ] Máximo (0,1,0) en bloques, elementos y modificadores; (0,2,0) en estados
- [ ] Sin IDs, clases calificadas, descendientes ni `!important` fuera de `u-`
- [ ] Modificadores y estados cambian custom properties `--_`, no redeclaran propiedades
- [ ] Estados desde atributos nativos o ARIA; `is-`/`has-` solo sin equivalente

## Accesibilidad visual
- [ ] Foco visible presente en todo lo interactivo (global o ajustado), con outline
- [ ] Límites esenciales con `border`; estados solo de color con indicador extra o ajuste en `forced-colors`
- [ ] Controles interactivos ≥ 24×24 px
- [ ] Transiciones y animaciones dentro de `tools.motion-safe`
- [ ] Nada se revela solo con `:hover`

## Soporte
- [ ] Toda propiedad cumple el umbral (≥ 90 % y 2 últimas versiones de Chrome/Safari/Firefox) o usa `@supports` con fallback
