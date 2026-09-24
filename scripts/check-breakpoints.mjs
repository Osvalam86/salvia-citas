// D7: el breakpoint vive en SCSS (mapa de @media) y en TS (useMediaQuery).
// Falla si los dos lados difieren. Va encadenado en pnpm lint.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const pairs = (source, pattern) => Object.fromEntries([...source.matchAll(pattern)].map((m) => [m[1], m[2]]))

const scss = pairs(read('src/styles/01-settings/_breakpoints.scss'), /^\s*([a-z0-9]+):\s*([\d.]+rem)/gm)
const ts = pairs(read('src/breakpoints.ts'), /^\s*([a-z0-9]+):\s*'([\d.]+rem)'/gm)

const keys = [...new Set([...Object.keys(scss), ...Object.keys(ts)])]
const diff = keys.filter((key) => scss[key] !== ts[key])

if (keys.length === 0 || diff.length > 0) {
  console.error('Breakpoints distintos entre _breakpoints.scss y src/breakpoints.ts (D7):')
  for (const key of diff) console.error(`  ${key}: SCSS ${scss[key] ?? '—'} · TS ${ts[key] ?? '—'}`)
  if (keys.length === 0) console.error('  no se encontró ninguno')
  process.exit(1)
}
console.log(`Breakpoints SCSS = TS: ${keys.map((key) => `${key} ${scss[key]}`).join(', ')}`)
