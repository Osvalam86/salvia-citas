// pnpm verify <sección> [--preview]: ejecuta la verificación de una sección
// contra el servidor de desarrollo (pnpm dev, :5173) y compara con las cifras
// de su informe. Con --preview va contra pnpm preview (:4173, el build de
// producción, sin StrictMode) y la sección ejecuta solo sus flujos de foco
// (DESIGN.md, Pendientes, «Flujos de foco contra la preview»). Capturas en
// scripts/verify/out/<sección>/ (no se versionan).
const SECTIONS = {
  '4.1': './4.1-acciones.mjs',
  '4.2': './4.2-identidad.mjs',
  '4.3': './4.3-formulario.mjs',
  '4.4': './4.4-navegacion.mjs',
  '4.5': './4.5-busqueda.mjs',
  '4.6': './4.6-fecha-hora.mjs',
  '4.7': './4.7-citas.mjs',
  '5.0': './5.0-transversal.mjs',
  '5.1': './5.1-busqueda.mjs',
}

const [section, flag] = process.argv.slice(2)
const preview = flag === '--preview'
if (!SECTIONS[section] || (flag && !preview)) {
  console.error(`Uso: pnpm verify <sección> [--preview]. Secciones: ${Object.keys(SECTIONS).join(', ')}`)
  process.exit(2)
}
// Antes de importar el arnés: cdp.mjs lee la base al cargarse.
if (preview) process.env.VERIFY_BASE ??= 'http://localhost:4173'
const base = process.env.VERIFY_BASE ?? 'http://localhost:5173'

try {
  await fetch(base)
} catch {
  console.error(preview ? `No responde la preview en ${base}: pnpm build && pnpm preview.` : 'No responde el servidor de desarrollo: arráncalo con pnpm dev.')
  process.exit(2)
}

const { createExpect, open } = await import('./cdp.mjs')
const { default: run, previewFlows } = await import(SECTIONS[section])
if (preview && !previewFlows) {
  console.error(`La sección ${section} no tiene flujos de foco para la preview.`)
  process.exit(2)
}

const browser = await open(preview ? `${section}-preview` : section)
const { expect, print } = createExpect()
let failed
try {
  await (preview ? previewFlows : run)(browser, expect)
  if (browser.consoleErrors.length) expect('consola sin errores', browser.consoleErrors, [])
} finally {
  browser.close()
  failed = print()
}
process.exit(failed ? 1 : 0)
