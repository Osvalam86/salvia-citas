// Arnés de verificación: Edge headless por CDP, sin dependencias (WebSocket y
// fetch de Node). Teclado y ratón reales (Input.dispatch*), capturas,
// forced-colors emulado y barras de scroll ocultas para simular la
// superpuesta. Método y trampas conocidas: docs/verificacion.md.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const EDGE = process.env.EDGE_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const BASE = process.env.VERIFY_BASE ?? 'http://localhost:5173'
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let nextPort = 9400

export async function open(name) {
  const out = path.join(here, 'out', name)
  fs.mkdirSync(out, { recursive: true })
  const port = nextPort++
  const edge = spawn(
    EDGE,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      // Perfil fuera del repo: Vite vigila el proyecto y los archivos
      // bloqueados del perfil lo tumban (EBUSY).
      `--user-data-dir=${path.join(os.tmpdir(), `salvia-verify-edge-${name}`)}`,
      '--no-first-run',
      '--disable-extensions',
      '--window-size=1280,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let targets = []
  for (let i = 0; i < 50 && !targets.some((t) => t.type === 'page'); i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
    } catch {
      await sleep(200)
    }
  }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

  let id = 0
  const pending = new Map()
  const consoleErrors = []
  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args.map((a) => a.value ?? a.description).join(' '))
    }
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id
      pending.set(i, (m) => (m.error ? reject(new Error(`${method}: ${m.error.message}`)) : resolve(m.result)))
      ws.send(JSON.stringify({ id: i, method, params }))
    })
  await send('Runtime.enable')

  // Evalúa una expresión en la página y devuelve su valor serializado.
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'error en la página')
    return r.result.value
  }
  // Ejecuta una función de checks.mjs en la página con argumentos JSON.
  const run = (fn, ...args) => ev(`(${fn})(${args.map((a) => JSON.stringify(a)).join(', ')})`)

  // keyDown con `text` genera también el keypress: sin él, Intro y Espacio no
  // activan un <button> ni marcan una casilla.
  const key = async (k, code, vk, text) => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text, unmodifiedText: text } : {}) })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk })
  }
  const mouse = (type, x, y) =>
    send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 })

  const b = {
    send,
    ev,
    run,
    consoleErrors,
    tab: () => key('Tab', 'Tab', 9),
    enter: () => key('Enter', 'Enter', 13, '\r'),
    space: () => key(' ', 'Space', 32, ' '),
    arrowDown: () => key('ArrowDown', 'ArrowDown', 40),
    mouse,
    click: async (x, y) => {
      await mouse('mousePressed', x, y)
      await mouse('mouseReleased', x, y)
    },
    metrics: (width, height = 900, scale = 1) =>
      send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false }),
    forcedColors: (active) =>
      send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: active ? 'active' : 'none' }] }),
    // Barra clásica (15 px, la de Windows) o superpuesta (oculta: ancho útil completo).
    overlayScrollbars: (hidden) => send('Emulation.setScrollbarsHidden', { hidden }),
    // Espera a que la vista esté montada (con un perfil nuevo, la primera carga
    // tarda más) y a que las fuentes estén listas.
    go: async (url) => {
      await send('Page.navigate', { url: BASE + url })
      for (let i = 0; i < 100; i++) {
        await sleep(100)
        const ready = `location.pathname + location.search === ${JSON.stringify(url)} && document.readyState === 'complete' && Boolean(document.querySelector('main h1'))`
        if (await ev(ready)) break
      }
      await ev('document.fonts.ready.then(() => true)')
      await sleep(200)
    },
    // Estilo temporal de contraprueba; `unstyle` lo retira.
    style: (css) =>
      ev(`(() => { const s = document.createElement('style'); s.dataset.verify = ''; s.textContent = ${JSON.stringify(css)}; document.head.append(s); return true })()`),
    unstyle: () => ev(`document.querySelectorAll('style[data-verify]').forEach((s) => s.remove()), true`),
    rect: (expr, pad = 0) =>
      ev(`(() => { const r = (${expr}).getBoundingClientRect(); return { x: r.x + scrollX - ${pad}, y: r.y + scrollY - ${pad}, width: r.width + ${pad * 2}, height: r.height + ${pad * 2} } })()`),
    shot: async (file, clip) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...clip, scale: 1 } })
      fs.writeFileSync(path.join(out, file), Buffer.from(data, 'base64'))
      return path.join('scripts/verify/out', name, file)
    },
    // Tabula desde el principio de la página hasta que el foco llega al destino.
    tabTo: async (expr) => {
      await ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
      for (let i = 0; i < 250; i++) {
        await b.tab()
        if (await ev(`document.activeElement === (${expr})`)) return i + 1
      }
      throw new Error(`Tab no llega a ${expr}`)
    },
    close: () => {
      ws.close()
      edge.kill()
    },
  }
  return b
}

// Comparación con las cifras de los informes de sección.
export function createExpect() {
  const results = []
  const expect = (name, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected)
    results.push({ ok, name, actual, expected })
    return ok
  }
  const print = () => {
    for (const r of results) {
      const detail = r.ok ? JSON.stringify(r.actual) : `obtenido ${JSON.stringify(r.actual)} · esperado ${JSON.stringify(r.expected)}`
      console.log(`${r.ok ? '✓' : '✗'} ${r.name}: ${detail}`)
    }
    const failed = results.filter((r) => !r.ok).length
    console.log(`\n${results.length - failed}/${results.length} coinciden con el informe${failed ? ` · ${failed} NO` : ''}`)
    return failed
  }
  return { expect, print }
}
