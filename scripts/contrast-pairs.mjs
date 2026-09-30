// Pares de contraste de Foundations F.3 (Figma): los 31 que reproduce
// `pnpm contrast` (scripts/contrast.mjs) y que `pnpm verify 7.3` busca en lo
// renderizado. Los roles van sin el prefijo `--color-`.

// [descripción en F.3, primer plano, fondo, ratio declarado]
export const TEXT_PAIRS = [
  ['Texto primario / superficie', 'text-primary', 'surface', 16.65],
  ['Texto primario / superficie elevada', 'text-primary', 'surface-elevated', 15.82],
  ['Texto secundario / superficie', 'text-secondary', 'surface', 5.55],
  ['Texto sobre acción', 'on-action', 'action', 8.01],
  ['Texto sobre acción en hover', 'on-action', 'action-hover', 10.89],
  ['Texto primario / hover del Secondary', 'text-primary', 'action-subtle', 13.57],
  ['Enlace / superficie', 'text-link', 'surface', 8.01],
  ['Texto acento / superficie', 'accent-text', 'surface', 8.28],
  ['Texto primario / hora seleccionada', 'text-primary', 'accent', 5.79],
  ['Texto primario / superficie apagada', 'text-primary', 'surface-muted', 12.87],
  ['Texto de éxito / su superficie', 'success-text', 'success-surface', 4.82],
  ['Cuerpo del aviso de éxito / su superficie', 'text-primary', 'success-surface', 13.86],
  ['Texto de aviso / su superficie', 'warning-text', 'warning-surface', 6.65],
  ['Texto de error / su superficie', 'error-text', 'error-surface', 6.31],
  ['Cuerpo del aviso de error / su superficie', 'text-primary', 'error-surface', 12.65],
  ['Texto de error / superficie', 'error-text', 'surface', 8.31],
  ['Texto sobre destructivo', 'on-action', 'error', 8.31],
  ['Texto sobre destructivo en hover', 'on-action', 'error-hover', 11.6],
]
export const BOUNDARY_PAIRS = [
  ['Borde de campo y de control / superficie', 'border-strong', 'surface', 8.41],
  ['Control marcado / superficie', 'action', 'surface', 8.01],
  ['Anillo de foco / superficie', 'focus-ring', 'surface', 6.02],
  ['Icono y borde de Por confirmar / su superficie', 'warning', 'warning-surface', 3.73],
  ['Icono y borde de Confirmada / su superficie', 'success', 'success-surface', 4.82],
  ['Borde del aviso de error / su superficie', 'error', 'error-surface', 6.31],
  ['Borde del aviso informativo / su superficie', 'border-strong', 'surface-muted', 6.5],
]
// [descripción, primer plano, fondo, ratio, umbral, tipo de uso]
export const DO_NOT_USE = [
  ['Blanco sobre acento 500', 'on-action', 'accent', 2.88, 4.5, 'texto'],
  ['Acento 500 como texto sobre blanco', 'accent', 'surface', 2.88, 4.5, 'texto'],
  ['Éxito 500 como texto sobre blanco', 'success-500', 'surface', 3.37, 4.5, 'texto'],
  ['Texto secundario / superficie apagada', 'text-secondary', 'surface-muted', 4.29, 4.5, 'texto'],
  ['color-border como límite de control', 'border', 'surface', 2.27, 3, 'límite'],
  ['Anillo de foco sobre la hora seleccionada', 'focus-ring', 'accent', 2.09, 3, 'anillo'],
]
