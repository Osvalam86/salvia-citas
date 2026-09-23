# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

**Salvia**: caso de estudio de maquetación y accesibilidad (WCAG 2.2 AA) — una
plataforma para agendar citas médicas. El producto es la excusa; lo que se
demuestra es el sistema de tokens, los componentes con estados, la
accesibilidad implementada y el responsive. El diseño está cerrado en Figma
(archivo `sVVjX11h3CrCOFNybb7gL1`, accesible por MCP).

Estado actual: fase de código recién arrancada. El diseño está cerrado; no hay
implementación todavía. La plantilla de Vite (`App.tsx`, `App.css`,
`index.css`) se retira al construir la capa de estilos.

## Comandos

Gestor: **pnpm** (≥11, Node ≥20).

```bash
pnpm dev        # servidor de desarrollo Vite
pnpm build      # tsc -b && vite build (el typecheck va dentro del build)
pnpm lint       # eslint .
pnpm preview    # sirve dist/
```

No hay test runner configurado.

`eslint-plugin-jsx-a11y` está instalado pero **aún no está en
`eslint.config.js`**.

## Fuentes de verdad (léelas antes de escribir código)

1. **`docs/diseno-implementable.md`** — manda sobre el código. Reglas
   transversales (foco, forced-colors, estados, formularios, layout, jerarquía
   de acciones, encabezados), los 34 componentes, las 4 vistas, los datos
   simulados y las piezas sin frame en Figma. Si crees que se equivoca, dilo
   antes de desviarte. Cuando falte anatomía de un componente, está en el
   `node.description` del componente en Figma.
2. **`DESIGN.md`** — contrato de la capa de estilos: decisiones de traducción de
   tokens **cerradas** (no se reabren), pares tipográficos, breakpoint único
   (`lg` 56rem), container queries (`result-card` 40rem, `slot-picker` 44rem),
   constantes sin variable en Figma, reglas de React Aria y pares de contraste
   prohibidos.
3. **Skills del proyecto en `.claude/skills/`** — `bemit-scss` (arquitectura
   ITCSS, nomenclatura y prefijos; manda sobre `DESIGN.md` en eso),
   `semantic-markup` (marcado y ARIA) y `theme-tokens` (generar la capa
   settings desde Figma). `bemit-scss` trae un scaffold de `styles/` en
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
- Señala los defectos reales de lo que construyas. No des por bueno lo que no
  lo está.
- Cuando el usuario señale un defecto concreto, arregla ese, sin aprovechar
  para cambiar otras cosas.
- Un valor que no viene del diseño se reporta como hueco, no se inventa en
  silencio.

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
| 5    | Vistas 1 → 4, par móvil/escritorio por vista                                                         |
| 6    | Las tres piezas sin frame: página genérica, aviso Success de reprogramación, conmutador «Avisarme»   |
| 7    | Auditoría (teclado, lector de pantalla, contraste en navegador) y despliegue                         |

## Calidad

- `eslint-plugin-jsx-a11y` activo: un `aria-*` mal puesto debe fallar el lint.
- Stylelint con patrón de nombres BEMIT cuando exista la capa de estilos.
- Ninguna entrega con un ítem en ✗ del checklist de `bemit-scss`.
