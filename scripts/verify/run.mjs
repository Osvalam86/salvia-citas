// pnpm verify <sección>: ejecuta la verificación de una sección del kit contra
// el servidor de desarrollo (pnpm dev, :5173) y compara con las cifras de su
// informe. Capturas en scripts/verify/out/<sección>/ (no se versionan).
import { createExpect, open } from './cdp.mjs'

const SECTIONS = {
  '4.1': './4.1-acciones.mjs',
  '4.2': './4.2-identidad.mjs',
  '4.3': './4.3-formulario.mjs',
  '4.4': './4.4-navegacion.mjs',
  '4.5': './4.5-busqueda.mjs',
  '4.6': './4.6-fecha-hora.mjs',
  '4.7': './4.7-citas.mjs',
}

const section = process.argv[2]
if (!SECTIONS[section]) {
  console.error(`Uso: pnpm verify <sección>. Secciones: ${Object.keys(SECTIONS).join(', ')}`)
  process.exit(2)
}

try {
  await fetch(process.env.VERIFY_BASE ?? 'http://localhost:5173')
} catch {
  console.error('No responde el servidor de desarrollo: arráncalo con pnpm dev.')
  process.exit(2)
}

const { default: run } = await import(SECTIONS[section])
const browser = await open(section)
const { expect, print } = createExpect()
let failed
try {
  await run(browser, expect)
  if (browser.consoleErrors.length) expect('consola sin errores', browser.consoleErrors, [])
} finally {
  browser.close()
  failed = print()
}
process.exit(failed ? 1 : 0)
