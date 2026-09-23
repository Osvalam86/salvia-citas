// Lista cerrada de iconos (diseño §2.3): Phosphor Regular, los 19 usados.
// Cada nombre tiene su archivo en src/assets/icons/, extraído por MCP de los
// maestros de F.7. Icon.tsx falla al cargar si la lista y los archivos difieren.
export const ICON_NAMES = [
  'calendar-blank',
  'calendar-check',
  'calendar-dots',
  'caret-down',
  'caret-left',
  'caret-right',
  'caret-up',
  'check',
  'check-circle',
  'clock',
  'hourglass',
  'info',
  'magnifying-glass',
  'map-pin',
  'sliders-horizontal',
  'user',
  'warning-circle',
  'x',
  'x-circle',
] as const

export type IconName = (typeof ICON_NAMES)[number]
