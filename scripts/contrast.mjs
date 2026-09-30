// Verifica los pares de contraste de Foundations F.3 contra los tokens reales.
// Compila src/styles/01-settings/_tokens.scss, resuelve las cadenas de var()
// y compara cada ratio con el que declara Figma. Sale con código 1 si alguno
// no coincide o si un par «No usar» pasa a cumplir (señal de que el token cambió).
//
//   pnpm contrast

import { compile } from 'sass-embedded'
import { fileURLToPath } from 'node:url'
import { BOUNDARY_PAIRS as boundary, DO_NOT_USE as doNotUse, TEXT_PAIRS as text } from './contrast-pairs.mjs'

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
