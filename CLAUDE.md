# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

**Salvia**: caso de estudio de maquetación y accesibilidad (WCAG 2.2 AA) — una
plataforma para agendar citas médicas. El producto es la excusa; lo que se
demuestra es el sistema de tokens, los componentes con estados, la
accesibilidad implementada y el responsive. El diseño está cerrado en Figma
(archivo `sVVjX11h3CrCOFNybb7gL1`, accesible por MCP).

Estado actual: fases 1 a 4 cerradas; fase 5 en curso (T0 y T1 hechos).
Existen las capas `01-settings` a `07-utilities`, los objetos de layout
(`o-wrapper`, `o-layout`, `o-stack`, `o-cluster`), el shell `AppLayout`
(`c-app-layout`), React Router y el catálogo `/kit` y `/kit/layout`
(`src/views/`). Componentes en `src/components/`:

- 4.1 Acciones: `Icon` (19 SVG en `src/assets/icons/`), `Button`,
  `IconButton`, `Link`, `BackLink`.
- 4.2 Identidad y estado: `Avatar` (solo inicial; fotos pendientes),
  `Tag`, `StatusTag`, `Step`, `Notice`.
- 4.3 Formulario: `FieldText`, `FieldSelect`, `Checkbox`, `Radio`, `Legend`.
- 4.4 Navegación: `HeaderDesktop`, `HeaderMobile`, `Wordmark`, `Breadcrumb`,
  `NavLink`, `NavItem`, `BottomNav`, `Menu`, `MenuItem`; salto al contenido
  en `AppLayout`; modo de texto grande (`tools.large-text`); `useDisclosure`
  y `useMediaQuery` en `src/hooks/`; demo del chrome real en
  `/kit/navegacion`.
- 4.5 Búsqueda y resultados: `ResultCard` (el `li` es el contenedor;
  Stacked/Row y Loading), `FilterTrigger`, `Pagination`, `PageLink` y
  `LoadMore`; `Avatar` con `--avatar-size` y la foto sobre la inicial; demo
  en `/kit/resultados`.
- 4.6 Fecha y hora: `Calendar` y `CalendarDay` (RAC), `DayChip` +
  `DayStrip` (radios nativos), `TimeSlot` + `SlotList` (ListBox de RAC),
  `BookingBar`; textos de fecha en `src/components/dates.ts`; reloj simulado
  en `src/data/clock.ts` (`TODAY`, `NOW`, `MAX_DATE`) con lint contra el reloj
  real; `I18nProvider` es-MX en la raíz; `Button` acepta `form`; demo en
  `/kit/fecha-hora`. Abierto: resto de pintado tras navegar en cliente
  (DESIGN.md; T0 lo acotó sin aislar la condición: estable en
  `pnpm verify 4.6`, 0 de 80 en pasadas aisladas; ✗ declarado).
- 4.7 Citas y diálogos: `AppointmentCard` (el `li` es el contenedor; Row
  desde 40rem) y `Dialog` (`<dialog>` nativo con `showModal()`, el elemento es
  el velo; umbrales `dialog-compact` y `dialog`). Una sola instancia del
  diálogo por lista; al cancelar, aviso Success con el foco en su título.
  Demo en `/kit/citas`.
- Fase 5 · T1: las 8 rutas de D1 y el 404 (`src/views/`, provisionales salvo
  la página genérica y el 404), `ViewLayout` (chrome por ruta, D7),
  `PageHeader` (`c-page-header`), `useRouteFocus` (D12), títulos (D15, también
  en `/kit`), `NavLink` con `current: 'page' | 'section'`, `pnpm verify 5.0`
  y el modo `--preview`.

Siguiente: fase 5 por bloques, cada uno con su commit y la skill `vista`:
T0 (ronda hecha, salida (c); el defecto sigue abierto) → T1 (hecho) → T2 (datos, guardas y 404, escenarios, fotos) → V1a → V1b →
V2a → V2b → V3 → V4a → V4b (reprogramación). La fase 6 está absorbida en
la 5.

## Comandos

Gestor: **pnpm** (≥11, Node ≥20), también en comprobaciones temporales.

```bash
pnpm dev        # servidor de desarrollo Vite
pnpm build      # tsc -b && vite build (el typecheck va dentro del build)
pnpm lint       # eslint . && stylelint "src/**/*.scss"
pnpm contrast   # reproduce los 31 pares de F.3 desde el SCSS compilado
pnpm verify 4.3 # verifica una sección contra su informe (con pnpm dev; docs/verificacion.md)
pnpm verify 5.0 --preview # flujos de foco contra pnpm build && pnpm preview
pnpm preview    # sirve dist/
```

No hay test runner configurado.

## Fuentes de verdad (léelas antes de escribir código)

1. **`docs/diseno-implementable.md`** — manda sobre el código. Reglas
   transversales (foco, forced-colors, estados, formularios, layout, jerarquía
   de acciones, encabezados), los 34 componentes, las 4 vistas, los datos
   simulados y las piezas sin frame en Figma. Si crees que se equivoca, dilo
   antes de desviarte. Cuando falte anatomía de un componente, está en el
   `node.description` del componente en Figma.
2. **`DESIGN.md`** — contrato de la capa de estilos: decisiones de traducción de
   tokens **cerradas** (no se reabren), pares tipográficos, breakpoint único
   (`lg` 64rem) y gutter de escritorio, container queries (umbrales y
   derivación en § Contenedores), constantes sin variable en Figma, reglas de
   React Aria y pares de contraste prohibidos.
3. **Skills del proyecto en `.claude/skills/`** — `bemit-scss` (arquitectura
   ITCSS, nomenclatura y prefijos; manda sobre `DESIGN.md` en eso),
   `semantic-markup` (marcado y ARIA), `theme-tokens` (generar la capa
   settings desde Figma), `seccion-kit` (plan y cierre de cada sección de
   la fase 4) y `vista` (plan y cierre de cada bloque de la fase 5).
   `bemit-scss` trae un scaffold de `styles/` en
   `assets/scaffold/`.

## Arquitectura y reglas que cruzan archivos

- **Stack:** React 19 + Vite + TypeScript, SCSS con `sass-embedded`, React Aria
  Components (RAC) para la accesibilidad compleja.
- **Estilos globales BEMIT, sin CSS Modules** (el hash rompe BEM). Mobile first
  con `min-width`; los componentes se adaptan a su contenedor, no al viewport.
- **RAC siempre recibe `className`** (si no, emite `react-aria-*` y rompe
  BEMIT). Se estila el atributo ARIA cuando existe equivalente (`aria-selected`,
  `aria-current`, `aria-pressed`…); los `data-*` sin equivalente
  (`data-hovered`, `data-focus-visible`) sustituyen a clases `is-`/`has-`.
- **Tokens:** componentes y vistas consumen solo roles (`--color-*`), nunca
  primitivos. Un solo modo: nada de dark mode ni `_themes.scss`.
- **Sin variante Disabled:** lo no disponible usa `aria-disabled="true"` y
  conserva el foco; el envío nunca se deshabilita (validación al enviar, con
  resumen de errores que recibe el foco).
- **Foco:** un único anillo `outline` (nunca `box-shadow`) 2px / desfase 2px.
- **Iconos:** Phosphor Regular, lista cerrada de 19, extraídos por MCP a
  `src/assets/icons/*.svg` y servidos inline por un componente `Icon`; siempre
  decorativos (`aria-hidden`, `focusable="false"`).
- **Enlaces:** ningún `href="#"`. Los destinos fuera de alcance (Ayuda, Cuenta,
  login, privacidad…) van a una única página genérica.
- **Datos simulados:** año 2029, hoy lunes 23 de abril, sesión iniciada como
  Karla Sánchez. Las citas de ejemplo están en la §6 del documento de diseño.

## Cómo trabajamos

- **Paso a paso, con confirmación explícita antes de avanzar.** No encadenes
  fases sin confirmación del usuario.
- En fases largas, un commit por bloque cerrado y verificado.
- Señala los defectos reales de lo que construyas. No des por bueno lo que no
  lo está.
- Cuando el usuario señale un defecto concreto, arregla ese, sin aprovechar
  para cambiar otras cosas.
- Un valor que no viene del diseño se reporta como hueco, no se inventa en
  silencio. Todo valor o decisión que no esté en `DESIGN.md` o `docs/` se
  presenta como propuesta con su razón **antes** de escribir código, nunca
  como custom property local ni como comentario.
- Los comandos permitidos (pnpm build, lint, contrast, verify; git status,
  diff, log) se ejecutan sueltos, sin tuberías ni filtros de salida, para que
  no pidan permiso.

## Decisiones de proyecto

- **pnpm siempre.** Su configuración vive en `pnpm-workspace.yaml`, no en
  `package.json`.
- Routing con React Router.
- Datos simulados en `src/data/`, tipados, sin backend ni mocks de red.

## Orden de fases

| Fase | Qué cierra                                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------- |
| 1    | `theme-tokens` → capa settings, con el mapa de equivalencias. Activar jsx-a11y en `eslint.config.js` |
| 2    | tools, generic, elements (reset, foco global, `a` subrayado)                                         |
| 3    | objects de layout                                                                                    |
| 4    | Los 34 componentes del kit, con sus estados y su accesibilidad                                       |
| 5    | Vistas 1 → 4, par móvil/escritorio por vista, y las tres piezas sin frame (página genérica en T1, conmutador «Avisarme» en V1b y V2b, aviso de reprogramación en V4b) |
| 6    | Absorbida en la 5: las piezas sin frame las necesitan las vistas que las usan                        |
| 7    | Auditoría (teclado, lector de pantalla, contraste en navegador) y despliegue                         |

## Calidad

- `eslint-plugin-jsx-a11y` strict activo: un `aria-*` mal puesto falla el lint.
  `role="list"` en `ul`/`ol` está permitido a propósito (el reset lo exige).
- Stylelint (`stylelint.config.mjs`) con patrón BEMIT y lo mecánico del
  checklist: sin primitivos, hex ni colores con nombre fuera de `01-settings`;
  sin IDs; especificidad ≤ (0,2,0); `!important` solo en `u-`; un nivel de
  anidamiento; `px` solo en bordes, outline y radios.
- `DESIGN.md` § «Pendientes anotados» lista lo que queda abierto y en qué fase.
- Ninguna entrega con un ítem en ✗ del checklist de `bemit-scss`.
