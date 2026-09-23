// Verifica los pares de contraste de Foundations F.3 contra los tokens reales.
// Compila src/styles/01-settings/_tokens.scss, resuelve las cadenas de var()
// y compara cada ratio con el que declara Figma. Sale con código 1 si alguno
// no coincide o si un par «No usar» pasa a cumplir (señal de que el token cambió).
//
//   pnpm contrast

import { compile } from 'sass-embedded'
import { fileURLToPath } from 'node:url'

const tokensPath = fileURLToPath(new URL('../src/styles/01-settings/_tokens.scss', import.meta.url))
const { css } = await compile(tokensPath)

const decls = new Map()
for (const [, name, value] of css.matchAll(/(--[\w-]+):\s*([^;]+);/g)) decls.set(name, value.trim())

// Valores que existen en Figma pero no entran en código (DESIGN.md, decisiones 1 y 2).
// Solo sirven para reproducir las filas de F.3 que los usan.
const figmaOnly = {
  '--color-surface-elevated': '#faf9f6',
  '--color-success-500': '#2e9e6d',
}

function resolve(name, seen = new Set()) {
  if (seen.has(name)) throw new Error(`Alias circular en ${name}`)
  seen.add(name)
  const raw = decls.get(name) ?? figmaOnly[name]
  if (raw === undefined) throw new Error(`Token inexistente: ${name}`)
  const alias = raw.match(/^var\((--[\w-]+)\)$/)
  return alias ? resolve(alias[1], seen) : raw
}

function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map((h) => {
    const c = parseInt(h, 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function ratio(fg, bg) {
  const [a, b] = [luminance(resolve(fg)), luminance(resolve(bg))].sort((x, y) => y - x)
  return (a + 0.05) / (b + 0.05)
}

// [descripción en F.3, primer plano, fondo, ratio declarado]
const text = [
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
const boundary = [
  ['Borde de campo y de control / superficie', 'border-strong', 'surface', 8.41],
  ['Control marcado / superficie', 'action', 'surface', 8.01],
  ['Anillo de foco / superficie', 'focus-ring', 'surface', 6.02],
  ['Icono y borde de Por confirmar / su superficie', 'warning', 'warning-surface', 3.73],
  ['Icono y borde de Confirmada / su superficie', 'success', 'success-surface', 4.82],
  ['Borde del aviso de error / su superficie', 'error', 'error-surface', 6.31],
  ['Borde del aviso informativo / su superficie', 'border-strong', 'surface-muted', 6.5],
]
// [descripción, primer plano, fondo, ratio, umbral]
const doNotUse = [
  ['Blanco sobre acento 500', 'on-action', 'accent', 2.88, 4.5],
  ['Acento 500 como texto sobre blanco', 'accent', 'surface', 2.88, 4.5],
  ['Éxito 500 como texto sobre blanco', 'success-500', 'surface', 3.37, 4.5],
  ['Texto secundario / superficie apagada', 'text-secondary', 'surface-muted', 4.29, 4.5],
  ['color-border como límite de control', 'border', 'surface', 2.27, 3],
  ['Anillo de foco sobre la hora seleccionada', 'focus-ring', 'accent', 2.09, 3],
]

const token = (n) => `--color-${n}`
const inCode = (n) => decls.has(token(n))
let failures = 0

function row(label, fg, bg, expected, threshold, mustPass) {
  const got = ratio(token(fg), token(bg))
  const matches = Math.abs(got - expected) < 0.01
  const passes = got >= threshold
  const ok = matches && passes === mustPass
  if (!ok) failures++
  const note = inCode(fg) && inCode(bg) ? '' : '  (solo Figma: no entra en código)'
  console.log(
    `${ok ? '✓' : '✗'} ${got.toFixed(2).padStart(5)}:1 (F.3: ${expected.toFixed(2)})  ${label}${note}`,
  )
}

console.log('Texto · ≥ 4.5:1')
for (const [l, fg, bg, r] of text) row(l, fg, bg, r, 4.5, true)
console.log('\nLímites y marcadores · ≥ 3:1')
for (const [l, fg, bg, r] of boundary) row(l, fg, bg, r, 3, true)
console.log('\nNo usar · deben seguir sin pasar')
for (const [l, fg, bg, r, t] of doNotUse) row(l, fg, bg, r, t, false)

console.log(failures ? `\n${failures} discrepancia(s) con F.3` : '\nLos 31 pares coinciden con F.3')
process.exit(failures ? 1 : 0)
