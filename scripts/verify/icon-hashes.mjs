// Iconos de src/assets/icons: formato limpio y hash FNV-1a (32 bits) del
// atributo d, comparado con el que dio Figma el 2026-09-23 (maestros de F.7,
// exportAsync SVG_STRING). Volver a leer Figma es manual: docs/verificacion.md.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../src/assets/icons')
const FORMAT = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24"><path d="([^"]+)" fill="currentColor"\/><\/svg>\n$/

export const FIGMA = {
  'calendar-blank': '1082 4102d710',
  'calendar-check': '1911 8022a576',
  'calendar-dots': '3349 4a7f9e6e',
  'caret-down': '803 8d76aa7f',
  'caret-left': '818 f980bec0',
  'caret-right': '832 c1a61817',
  'caret-up': '813 3e15ecbc',
  check: '618 1a0248cb',
  'check-circle': '1763 92ff71b2',
  clock: '1365 1d7c2410',
  hourglass: '923 bc841c91',
  info: '1909 f29ad27f',
  'magnifying-glass': '1295 41538e9d',
  'map-pin': '1595 fb06f29a',
  'sliders-horizontal': '2411 16c01f5e',
  user: '1803 ae25c953',
  'warning-circle': '1745 0ce3dcf1',
  x: '1053 7c87eef8',
  'x-circle': '2353 e3412915',
}

export function fnv(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function iconHashes() {
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.svg'))
      .map((f) => {
        const m = fs.readFileSync(path.join(dir, f), 'utf8').match(FORMAT)
        return [f.slice(0, -4), m ? `${m[1].length} ${fnv(m[1])}` : 'FORMATO-INVALIDO']
      })
      .sort(([a], [b]) => (a < b ? -1 : 1)),
  )
}
