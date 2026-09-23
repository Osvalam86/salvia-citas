# Arquitectura BEMIT

## Capas

El número de carpeta es el orden de la cascada. Especificidad y alcance crecen de 01 a 07.

```
styles/
├── 01-settings/     Tokens (emite :root) + mapas Sass (no emiten CSS)
├── 02-tools/        Funciones y mixins (no emite CSS)
├── 03-generic/      Reset con :where()
├── 04-elements/     Elementos HTML sin clase, con :where()
├── 05-objects/      o-  Estructura sin diseño visual
├── 06-components/   c-  UI con diseño + t- s- is-/has- js-
├── 07-utilities/    u-  Sobrescrituras excepcionales con !important
├── vendors/         Ajustes a librerías de terceros (sin número)
└── main.scss
```

| Capa | Contenido | Emite CSS |
|---|---|---|
| `01-settings` | `_tokens.scss` (custom properties, lo genera `theme-tokens`), `_breakpoints.scss`, `_containers.scss`, `_scales.scss` | Solo `_tokens.scss` |
| `02-tools` | `_functions.scss` (`rem()`), `_mixins.scss`, `_index.scss` con `@forward` | No |
| `03-generic` | Reset | Sí |
| `04-elements` | `body`, encabezados, enlaces, foco global | Sí |
| `05-objects` | `_o-*.scss`, uno por objeto | Sí |
| `06-components` | `_c-*.scss`, uno por componente, y los transversales `_states`, `_themes`, `_scopes`, `_js-hooks` | Sí |
| `07-utilities` | `_u-*.scss` | Sí |
| `vendors` | `_<libreria>.scss` | Sí |

**Regla settings/tools:** settings = valores; tools = lo que usa esos valores. Un mapa va en settings; el mixin que lo lee, en tools.

**Regla de settings:** solo `_tokens.scss` emite CSS. Ningún otro archivo de settings produce salida.

## Importación

### `main.scss`
```scss
@use '01-settings/tokens';
@use '03-generic' as generic;
@use '04-elements' as elements;
@use '05-objects' as objects;
@use '06-components' as components;
@use '07-utilities' as utilities;
@use 'vendors';
```
- Las carpetas numeradas no son identificadores Sass válidos: `as` es obligatorio al usarlas como módulo.
- `02-tools` no se importa en `main.scss`: no emite CSS.
- `vendors` va al final para tener la última palabra sobre las librerías.

### `_index.scss` por capa
- Capas que emiten CSS (03–07, vendors): `@use` de cada parcial, en orden. Agregar un parcial = una línea en su índice.
- `02-tools/_index.scss`: `@forward` de funciones y mixins, para importar todo con una sola línea.
- En `06-components`, los componentes `c-` van primero en orden alfabético; `states`, `themes`, `scopes` y `js-hooks` al final.

### En cada parcial
```scss
@use '../02-tools' as tools;              // tools.rem(), tools.container()...
@use '../01-settings/scales';            // solo si hace loops con escalas
```
Nunca `as *`. El namespace hace explícito el origen.

## Ubicación y conexión por stack

Detecta el stack por `package.json` y los archivos de configuración. Crea `styles/` en esta ubicación y conecta `main.scss` como indica la tabla. Si el stack no encaja en ninguna fila, pregunta.

| Stack | Detección | Ubicación | Conexión |
|---|---|---|---|
| HTML + Vite / estático | `index.html` + `vite.config.*` sin framework | `src/styles/` | `import './styles/main.scss'` en el entry JS, o `<link>` al CSS compilado |
| React + Vite | `react` + `vite` | `src/styles/` | `import './styles/main.scss'` en `src/main.(jsx\|tsx)` |
| Next.js App Router | `next` + carpeta `app/` | `src/styles/` (o `styles/` si no hay `src/`) | `import '../styles/main.scss'` en el layout raíz (`app/layout.(jsx\|tsx)`) |
| Next.js Pages Router | `next` + `pages/_app` | `src/styles/` o `styles/` | Import en `pages/_app.(jsx\|tsx)` |
| Angular | `angular.json` | `src/styles/` | `"styles": ["src/styles/main.scss"]` en `angular.json` |
| Eleventy / Nunjucks / Vituum | `.eleventy.*` o `vituum` | Carpeta de assets de entrada del pipeline (normalmente `src/styles/`) | Según el pipeline: plugin Sass o Vite |

Requisitos comunes:
- Compilador: Dart Sass (`sass` o `sass-embedded`). Nunca `node-sass` (LibSass está deprecado).
- **Next.js:** BEMIT usa estilos globales. No uses CSS Modules para clases BEMIT: el hash rompe la nomenclatura.
- **Angular:** los estilos BEMIT viven en `src/styles/` globales. Los `styleUrls` de los componentes quedan vacíos; el encapsulado duplicaría y aislaría las clases.
- **React y Angular:** las clases van en `className` / `class`. Los hooks `js-` no se usan: se usan refs.

## Archivos transversales de `06-components`

| Archivo | Prefijo | Contenido |
|---|---|---|
| `_states.scss` | `is-` `has-` | Solo estados genéricos sin equivalente nativo/ARIA. Los estados de un componente van en su parcial |
| `_themes.scss` | `t-` | Solo redefinición de tokens semánticos. Solo si el diseño define modos |
| `_scopes.scss` | `s-` | Contenido no controlado (CMS, Markdown). Única capa con margins |
| `_js-hooks.scss` | `js-` | Documentación en comentarios. Nunca CSS |
