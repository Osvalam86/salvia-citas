// Espejo en TS de src/styles/01-settings/_breakpoints.scss (D7): var() no
// funciona en @media, así que el valor vive en los dos lados.
// scripts/check-breakpoints.mjs falla (en pnpm lint) si difieren.
export const BREAKPOINTS = {
  lg: '64rem',
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

export const minWidth = (size: Breakpoint) => `(min-width: ${BREAKPOINTS[size]})`
