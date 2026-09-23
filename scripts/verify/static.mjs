// Contrapruebas estáticas: un archivo temporal en src/views/ que ESLint o
// TypeScript tienen que rechazar (o aceptar) línea a línea. El archivo se borra
// siempre, también si la comprobación falla.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const TEMP = 'src/views/VerifyTemp.tsx'

function withTemp(code, fn) {
  const file = path.join(root, TEMP)
  fs.writeFileSync(file, code)
  try {
    return fn()
  } finally {
    fs.rmSync(file, { force: true })
  }
}

const exec = (command) => spawnSync(command, { cwd: root, shell: true, encoding: 'utf8' })

// Líneas del archivo temporal con error de ESLint, y el mensaje de cada una.
export function lintLines(code) {
  return withTemp(code, () => {
    const r = exec(`pnpm exec eslint --format json ${TEMP}`)
    const [report] = JSON.parse(r.stdout)
    return report.messages.map((m) => `${m.line}: ${m.ruleId}`)
  })
}

// Líneas del archivo temporal con error de TypeScript.
export function typeErrorLines(code) {
  return withTemp(code, () => {
    const r = exec('pnpm exec tsc -p tsconfig.app.json --noEmit')
    const lines = (r.stdout + r.stderr)
      .split('\n')
      .map((l) => l.match(/VerifyTemp\.tsx\((\d+),\d+\): error/))
      .filter(Boolean)
      .map((m) => Number(m[1]))
    return [...new Set(lines)].sort((a, b) => a - b)
  })
}
