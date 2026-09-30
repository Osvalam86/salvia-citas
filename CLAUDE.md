# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

**Salvia**: caso de estudio de maquetación y accesibilidad (WCAG 2.2 AA) — una
plataforma para agendar citas médicas. El producto es la excusa; lo que se
demuestra es el sistema de tokens, los componentes con estados, la
accesibilidad implementada y el responsive. El diseño está cerrado en Figma
(archivo `sVVjX11h3CrCOFNybb7gL1`, accesible por MCP).

Estado actual: fases 1 a 5 cerradas (la 6, absorbida en la 5).
Existen las capas `01-settings` a `07-utilities`, los objetos de layout
(`o-wrapper`, `o-layout`, `o-stack`, `o-cluster`), el shell `AppLayout`
(`c-app-layout`), React Router y el catálogo `/kit` y `/kit/layout`
(`src/views/`). Componentes en `src/components/`:

- 4.1 Acciones: `Icon` (19 SVG en `src/assets/icons/`), `Button`,
  `IconButton`, `Link`, `BackLink`.
- 4.2 Identidad y estado: `Avatar` (inicial y foto; fotos en `src/data/photos.ts`),
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
  `/kit/fecha-hora`. Resto de pintado tras navegar en cliente desde `/kit`
  desplazado: ✗ declarado en `pnpm verify 4.6`, seguimiento en la fase 7
  (DESIGN.md, Pendientes).
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
- Fase 5 · T2: datos en `src/data/` (47 especialistas, disponibilidad con
  semilla, búsqueda, almacén de citas con ids c1–c5, escenarios, Motivo,
  fotos), `scripts/check-data.mjs` (en `pnpm lint`, con `--contrapruebas`),
  guardas de D1 con `replace` y 404 por `RouteError`, `/kit/estados`.
- Fase 5 · V1a: la vista de Búsqueda (`src/views/Search.tsx`): formulario,
  filtros de escritorio al marcarlos, orden, lista, paginación / «Ver más»,
  carga con `lenta` y los tres vacíos; `EmptyState` (`c-empty-state`),
  `c-search-form`, `c-search-filters`, `c-results-header`,
  `tools.control-block-size()`; `Button` con `state`; `c-field` con línea
  base del valor; `pnpm verify 5.1` (y `--preview`).
- Fase 5 · V1b: hoja «Filtrar y ordenar» (`Sheet`, `c-sheet`: `<dialog>` modal a
  pantalla completa, borrador, «Ver N» con replace) y `FilterTrigger` en la
  cabecera móvil (`c-results-header--trigger`); conmutador «Avisarme» con
  almacén en memoria (D16, `src/data/notify.ts`); `c-button__label` (etiqueta
  que llena); `empty-state-compact`; página bloqueada bajo un diálogo modal
  (`html:has(dialog:modal)`, `04-elements`). `pnpm verify 5.1` ampliado.
- Fase 5 · V2a: la vista 2 en `/especialistas/:slug` (`src/views/Specialist.tsx`,
  02.1–02.3, 02.5, 02.6): `useSlotPicker` (D2, `src/hooks/`), `c-slot-picker`
  (fieldset con tira y semana en móvil, tarjeta con calendario en escritorio,
  umbral `slot-picker` 44.5625rem), `c-booking-summary` («Tu cita»), hoja del
  calendario `c-sheet--bottom`, bloque sin horarios con el conmutador
  «Avisarme si se libera un hueco» (D16), Missing en las dos plataformas;
  `PageHeader` con `back` y `profile`; `BookingBar` con `fullDay`; `Notice`
  Info con `headingLevel={null}`; `pnpm verify 5.2` (y `--preview`).
- Fase 5 · V2b: la confirmación previa en `/especialistas/:slug/confirmar`
  (`src/views/ConfirmBooking.tsx`, 02.4): `ActionBar` (`c-action-bar`),
  `AppointmentSummary` (`c-appointment-summary`, umbral
  `appointment-summary-compact`), `BookingDetails` (`c-booking-details`,
  compartido con «Tu cita»), `BookingSteps`, `c-booking-review` (columna de
  38rem desde lg), `PageHeader` con `steps`, `useFocusFallback` (nombre desde V4b),
  `src/data/booking.ts` (modalidad, duración, meta y política);
  `bookingStepLoader` devuelve la selección; desde lg, la misma pantalla con
  breadcrumb de tres niveles y el envío en línea. `pnpm verify 5.2` ampliado.
- Fase 5 · V3: la vista 3 en `/especialistas/:slug/datos`
  (`src/views/PatientData.tsx`, 03.1–03.6): `ErrorSummary`
  (`c-error-summary`), `c-patient-form` (tarjeta y rejilla de escritorio),
  validación, borrador (D17) y `submitBooking` en `src/data/patient.ts`, sesión
  en `src/data/session.ts`; `c-page-header` con `__title-group` y el
  breadcrumb a `space-4` desde lg; `AppointmentSummary` con `title` y
  `--aside`; `Link` con `onClick` en anclas; `id` opcional en los campos;
  `ActionBar` con nota opcional; `pnpm verify 5.3` (y `--preview`).
- Fase 5 · V4a: la confirmación en `/citas/:id/confirmada` (`src/views/BookingConfirmed.tsx`,
  04.1, 04.4) y Mis citas en `/mis-citas` (`src/views/MyAppointments.tsx`, 04.2, 04.3,
  04.5–04.9): `PageHeader` con `success` (`__headline`, `__badge`), `AppointmentSummary`
  con `action` y el umbral `appointment-summary-wide` (43.0625rem), propiedades públicas de
  `c-booking-details`, `c-my-appointments`; contacto de la reserva, `cancelCopy`,
  `groupAppointments`, `upcomingText` y `PENDING_NOTE` en `src/data/appointments.ts`,
  `nextStepsText` en `booking.ts`, el `.ics` en `src/data/calendar.ts`; guarda de D1
  ampliada (cita no Confirmada → `/mis-citas`); el kit toma el copy de `cancelCopy`;
  `pnpm verify 5.4` (y `--preview`) y `scripts/verify/cruce-lg.mjs` en 5.3 y 5.4.
- Fase 5 · V4b: la reprogramación en `/mis-citas/:id/reprogramar` (`src/views/Reschedule.tsx`,
  02.7, 02.8) y el aviso «Cita reprogramada» (pieza sin frame n.º 2): `SlotPicker`
  (`c-slot-picker` 1:1, sin prop de modo, D3), `useSlotPicker` con `initialDate`,
  `rescheduleStartDate`, `rescheduleCopy` y `rescheduledText`; «El cambio» con
  `BookingDetails` (`whenTerm`, `previous`, `whenId`), `BookingBar` con `describedBy`,
  `Notice` con `titleId`; loader de `/mis-citas` que consume el aviso (D13), aviso
  unificado con key `${tipo}-${id}` y reinicio por entrada del historial;
  `useFocusFallback` (antes el hook de cruzar lg); `pnpm verify 5.4` ampliado (y
  `--preview`), 5.0 con 56 contrapruebas.

- Fase 5 · cierre: `c-page-header__heading` en toda vista sin perfil (el h1 no se
  vuelve a montar al cruzar lg); `policyText`, `inFreeWindow` y `LATE_POLICY` en
  `src/data/booking.ts` (política a menos de 24 h, `policyFigma` contra Figma);
  `getKey` de `ScrollRestoration` en `RootLayout` (cargas completas por URL);
  criterio del resto de pintado con delta > 64 y `prepare` en
  `scripts/verify/navegacion.mjs`; `check-data` con 62 contrapruebas.

- Fase 7 · 7.0: despliegue continuo desde `main` en Netlify
  (https://salvia-citas.netlify.app): `netlify.toml` (lint, contrast y build;
  Node 22; pnpm por `packageManager`; caché inmutable solo en `/assets/*`),
  `public/_redirects` con 404 real (D12) y `pnpm verify 7.0` contra producción;
  el badge «Powered by Netlify», desactivado (verificacion.md, Trampas).
- Fase 7 · 7.1: un solo `<title>` con `useDocumentTitle` (`src/hooks/`, D15);
  `text-underline-offset: 0.2em` en la regla base de `a` (§ Constantes);
  favicon (`favicon.svg`, `favicon.ico` con `scripts/favicon-ico.mjs`), icono
  de Apple e imagen OG en `public/`, con sus `<link>` y `<meta>` en
  `index.html`; `pnpm verify` 4.1 y 4.4 (subrayado), 5.0 (un `<title>` por
  ruta) y 7.0 (iconos, OG y `<meta>`).
- Fase 7 · 7.2: un chunk por librería (`react`, `react-router`, `react-aria`)
  con `codeSplitting` de Rolldown en `vite.config.ts`, precargados con
  `modulepreload` (D18); la carga diferida por ruta, medida en HTTP/2 y
  descartada (rama `7.2-lazy`).

Siguiente en la fase 7: 7.3, con los pendientes de la fase 7 de DESIGN.md.

## Comandos

Gestor: **pnpm** (≥11, Node ≥22.18), también en comprobaciones temporales.

```bash
pnpm dev        # servidor de desarrollo Vite
pnpm build      # tsc -b && vite build (el typecheck va dentro del build)
pnpm lint       # eslint, stylelint, breakpoints y check-data (aserciones de D4)
pnpm contrast   # reproduce los 31 pares de F.3 desde el SCSS compilado
pnpm verify 4.3 # verifica una sección contra su informe (con pnpm dev; docs/verificacion.md)
pnpm verify 5.0 --preview # flujos de foco contra pnpm build && pnpm preview
VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.0 # despliegue; solo contra *.netlify.app
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

- Nunca `Get-Content` ni `Set-Content` para leer o escribir archivos del repo
  (mojibake en UTF-8 sin BOM, docs/verificacion.md). Solo la herramienta de
  edición o Node.
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
| 5    | Vistas 1 → 4, par móvil/escritorio por vista, y las tres piezas sin frame (página genérica en T1, conmutador «Avisarme» en V1b y V2a, aviso de reprogramación en V4b) |
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
