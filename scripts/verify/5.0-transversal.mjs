// 5.0 Transversal (T1): las rutas de D1 con su h1, su título (D15) y su
// chrome; el foco de ruta (D12, useRouteFocus) en PUSH, POP, cambio solo de
// search, carga inicial y location.state.focus; la página genérica y el 404.
// T2: guardas de D1 (404 lanzado, redirecciones con replace y Atrás), los
// enlaces de /kit/estados, las fotos de avatar y check-data --contrapruebas.
// 7.2: la carga diferida por ruta (consola y código del catálogo en /).
// `previewFlows` repite los flujos de foco contra pnpm preview (sin
// StrictMode): pnpm verify 5.0 --preview.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation, resampleNote, toBottom, viewRest } from './navegacion.mjs'

const RUIZ = '/especialistas/elena-ruiz-arellano'
const AVATARS = 'src/assets/avatars'
export const ROUTES = [
  ['/', 'Encuentra a tu especialista', 'Especialistas · Salvia', ['Especialistas', 'page'], 'Especialistas'],
  [RUIZ, 'Dra. Elena Ruiz Arellano', 'Dra. Elena Ruiz Arellano · Salvia', ['Especialistas', 'true'], null],
  [`${RUIZ}/confirmar?fecha=2029-04-24&hora=10:30`, 'Confirma tu cita', 'Confirma tu cita · Salvia', ['Especialistas', 'true'], null],
  [`${RUIZ}/datos?fecha=2029-04-24&hora=10:30`, 'Tus datos', 'Tus datos · Salvia', ['Especialistas', 'true'], null],
  ['/citas/c1/confirmada', 'Tu cita está reservada', 'Cita reservada · Salvia', ['Especialistas', 'true'], null],
  ['/mis-citas', 'Mis citas', 'Mis citas · Salvia', ['Mis citas', 'page'], 'Mis citas'],
  ['/mis-citas/c3/reprogramar', 'Dr. Iván Cortés Naranjo', 'Reprogramar cita · Dr. Iván Cortés Naranjo · Salvia', ['Mis citas', 'true'], null],
  ['/fuera-de-alcance', 'Esta sección no forma parte del caso de estudio', 'Fuera del caso de estudio · Salvia', null, ''],
  ['/no-existe', 'No encontramos esta página', 'No encontramos esta página · Salvia', null, ''],
]
// Las 7 vistas del catálogo con un marcador de contenido propio de cada una
// (único en src/ y en el build): su título, o un id donde el título es una
// plantilla (KitNav).
const KIT_VIEWS = {
  '/kit': ['Kit', 'Kit del sistema · Salvia'],
  '/kit/layout': ['KitLayout', 'Layout · aside al '],
  '/kit/navegacion': ['KitNav', 'kit-nav-variantes'],
  '/kit/resultados': ['KitResults', 'Búsqueda y resultados · Kit · Salvia'],
  '/kit/fecha-hora': ['KitDateTime', 'Fecha y hora · Kit · Salvia'],
  '/kit/citas': ['KitAppointments', 'Citas y diálogos · Kit · Salvia'],
  '/kit/estados': ['KitStates', 'Estados de demo · Kit · Salvia'],
}
const KIT_PATHS = Object.keys(KIT_VIEWS)

const focused = "(() => { const a = document.activeElement; return a.tagName + (a.id ? '#' + a.id : '') })()"
const linkPoint = (text, scope = 'document') => `(() => { const a = [...${scope}.querySelectorAll('a')].find((e) => e.textContent === ${JSON.stringify(text)}); a.scrollIntoView({ block: 'nearest' }); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`
const clickLink = async (b, text, scope) => {
  const { x, y } = await b.ev(linkPoint(text, scope))
  await b.click(x, y)
}
const waitFor = async (b, path) => {
  for (let i = 0; i < 50 && (await b.ev('location.pathname')) !== path; i++) await sleep(100)
  await sleep(300)
}
const back = async (b, path) => {
  await b.ev('history.back(), true')
  await waitFor(b, path)
}
// location.state de la entrada actual sin tocar la clave ni el índice de
// React Router: el Atrás posterior la lee como la de una navegación con state.
const setFocusState = (b, id) => b.ev(`history.replaceState({ ...history.state, usr: { focus: ${JSON.stringify(id)} } }, ''), true`)

// PUSH con clic real en la pestaña del header: foco al h1, arriba y sin anillo.
async function pushByClick(b, expect) {
  await b.metrics(1280, 900, 1)
  await b.go('/')
  await clickLink(b, 'Mis citas', "document.querySelector('.c-header-desktop')")
  await waitFor(b, '/mis-citas')
  expect('PUSH con clic (header, 1280): foco en el h1, arriba y sin anillo (:focus-visible solo con teclado)', await b.ev(`({ ruta: location.pathname, foco: ${focused}, scrollY: scrollY, anillo: document.activeElement.matches(':focus-visible') })`), { ruta: '/mis-citas', foco: 'H1#contenido', scrollY: 0, anillo: false })
}

// POP: el scroll se restaura y el foco va al h1 sin moverlo (coste asumido en
// D12: el h1 puede quedar fuera de la pantalla).
async function pop(b, expect) {
  await b.metrics(1280, 900, 1)
  await b.go('/kit')
  await b.ev("[...document.querySelectorAll('a')].find((e) => e.textContent === 'Ver citas y diálogos').scrollIntoView({ block: 'center' }), true")
  await sleep(200)
  const before = await b.ev('Math.round(scrollY)')
  await clickLink(b, 'Ver citas y diálogos')
  await waitFor(b, '/kit/citas')
  await back(b, '/kit')
  const after = await b.ev(`({ scrollY: Math.round(scrollY), foco: ${focused} })`)
  expect(`POP (Atrás a /kit, desde scrollY ${before}): scroll restaurado y foco en el h1 sin desplazar`, { bajada: before > 1000, restaurado: after.scrollY === before, foco: after.foco }, { bajada: true, restaurado: true, foco: 'H1#contenido' })
  return before
}

// state.focus: destino existente (fuera de React) y destino que ya no existe.
async function focusState(b, expect) {
  await b.metrics(1280, 900, 1)
  const run = async (id) => {
    await b.go('/fuera-de-alcance')
    await b.ev("(() => { const d = document.createElement('div'); d.id = 'destino-prueba'; d.tabIndex = -1; d.textContent = 'destino de prueba'; document.body.append(d); return true })()")
    await setFocusState(b, id)
    await clickLink(b, 'Ir a Especialistas', "document.querySelector('main')")
    await waitFor(b, '/')
    await back(b, '/fuera-de-alcance')
    return b.ev(focused)
  }
  expect('location.state.focus con destino (Atrás a una entrada con state): el foco va a ese destino', await run('destino-prueba'), 'DIV#destino-prueba')
  expect('location.state.focus sin destino (el aviso ya no existe): respaldo al h1 (D12)', await run('no-existe'), 'H1#contenido')
}

// Títulos tras navegar en cliente vista → vista → Atrás: useDocumentTitle
// reescribe el único <title>, el estático de index.html (7.1).
async function titlesAfterClientNav(b, expect) {
  await b.metrics(1280, 900, 1)
  await b.go('/mis-citas')
  const read = "[document.title, document.querySelectorAll('title').length]"
  const seen = [await b.ev(read)]
  await clickLink(b, 'Especialistas', "document.querySelector('.c-header-desktop')")
  await waitFor(b, '/')
  seen.push(await b.ev(read))
  await back(b, '/mis-citas')
  seen.push(await b.ev(read))
  expect('document.title tras navegar en cliente (/mis-citas → / → Atrás), siempre en un único <title>', seen, [['Mis citas · Salvia', 1], ['Especialistas · Salvia', 1], ['Mis citas · Salvia', 1]])
}

// Carga completa que acepta una redirección de la guarda: espera a que el
// documento nuevo (su entrada de navegación es la URL pedida) tenga su h1.
const land = async (b, url) => {
  await b.send('Page.navigate', { url: new URL(url, await b.ev('location.origin')).href })
  for (let i = 0; i < 100; i++) {
    await sleep(100)
    const ready = await b.ev(`(() => { const n = performance.getEntriesByType('navigation')[0]; return Boolean(n && decodeURIComponent(n.name).endsWith(${JSON.stringify(url)}) && document.readyState === 'complete' && document.querySelector('main h1')) })()`).catch(() => false)
    if (ready) break
  }
  await sleep(300)
  return b.ev("({ ruta: location.pathname + location.search, h1: document.querySelector('main h1').textContent, idx: history.state?.idx })")
}

// Navegación en cliente sin enlace: React Router atiende el popstate como un
// POP y pasa por las guardas (redirección o 404) y por el foco de ruta.
const clientGo = async (b, path) => {
  await b.ev(`(history.pushState({ usr: null, key: 'verify', idx: (history.state?.idx ?? 0) + 1 }, '', ${JSON.stringify(path)}), dispatchEvent(new PopStateEvent('popstate', { state: history.state })), true)`)
  await sleep(600)
  return b.ev(`({ ruta: location.pathname + location.search, h1: document.querySelector('main h1').textContent, foco: ${focused} })`)
}

// Guardas en una navegación en cliente: el foco va al h1 del destino final.
async function guardFocus(b, expect) {
  await b.metrics(1280, 900, 1)
  await b.go('/kit/estados')
  const redirected = await clientGo(b, `${RUIZ}/datos`)
  // Atrás tras la redirección: vuelve a /kit/estados, no a /datos (que
  // redirigiría otra vez). Con redirect en vez de replace, la redirección
  // añade una entrada y Atrás cae en /datos (D1, medido en T2).
  await back(b, '/kit/estados')
  expect('Atrás tras una redirección de la guarda: vuelve a la página anterior, no a la URL que redirige', await b.ev('location.pathname'), '/kit/estados')
  await b.go('/kit/estados')
  const missing = await clientGo(b, '/especialistas/no-existe')
  expect('guardas en navegación en cliente: la redirección y el 404 llevan el foco al h1 del destino', { redireccion: redirected, noExiste: missing }, {
    redireccion: { ruta: RUIZ, h1: 'Dra. Elena Ruiz Arellano', foco: 'H1#contenido' },
    noExiste: { ruta: '/especialistas/no-existe', h1: 'No encontramos esta página', foco: 'H1#contenido' },
  })
}

// V4a (D1 ampliada): solo en dev, porque cancela por el módulo del almacén
// (/src/data/appointments.ts, que la preview no sirve).
async function confirmedGuard(b, expect) {
  await b.metrics(1280, 900, 1)
  // La c1 cancelada en el almacén deja de tener
  // confirmación. En la misma carga (el almacén se reinicia al recargar), a
  // /citas/c1/confirmada en cliente: replace a /mis-citas; Atrás vuelve a
  // /kit/estados. Antes de cancelar, la misma navegación llega a la
  // confirmación (caso válido).
  await b.go('/kit/estados')
  const valid = await clientGo(b, '/citas/c1/confirmada')
  await b.go('/kit/estados')
  // La URL exacta del módulo que cargó la app (Vite puede añadirle ?t=): otra
  // URL daría otra instancia del almacén.
  await b.ev(`(() => { const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/src/data/appointments.ts')); return import(url).then((m) => (m.appointmentStore.cancel('c1'), true)) })()`)
  const i0 = await b.ev('history.state?.idx')
  const cancelled = { ...(await clientGo(b, '/citas/c1/confirmada')), entradas: (await b.ev('history.state?.idx')) - i0 }
  await back(b, '/kit/estados')
  cancelled.atras = await b.ev('location.pathname')
  expect('guarda de la confirmación en cliente: c1 Confirmada llega; c1 cancelada → replace a /mis-citas (la entrada empujada se sustituye) y Atrás vuelve a /kit/estados', { valid, cancelled }, {
    valid: { ruta: '/citas/c1/confirmada', h1: 'Tu cita está reservada', foco: 'H1#contenido' },
    cancelled: { ruta: '/mis-citas', h1: 'Mis citas', foco: 'H1#contenido', entradas: 1, atras: '/kit/estados' },
  })
}

// Scroll en cargas completas (cierre de la fase 5, getKey de RootLayout): otra
// URL en la misma pestaña, tras dejar /kit al final, carga arriba (antes, 766 =
// el máximo de /kit/navegacion, la causa de 4.4 a 61/62); una recarga de la
// misma URL conserva su posición. Contraprueba manual sin getKey:
// docs/verificacion.md.
async function fullLoadScroll(b, expect) {
  await b.metrics(1440, 900, 1)
  await b.go('/kit')
  await toBottom(b)
  const kitY = await b.ev('scrollY')
  await b.go('/kit/navegacion?sesion=iniciada&actual=especialistas')
  const otra = await b.ev(`({ scrollY, foco: document.activeElement === document.body ? 'BODY' : document.activeElement.tagName })`)
  await b.ev('window.scrollTo(0, 400), true')
  await sleep(200)
  await b.send('Page.reload')
  await sleep(300)
  for (let i = 0; i < 50 && !(await b.ev(`document.readyState === 'complete' && Boolean(document.querySelector('main h1'))`)); i++) await sleep(100)
  await sleep(300)
  expect('carga completa de otra URL en la misma pestaña tras /kit al final: arriba; recarga de la misma URL: conserva su scroll (400)', { kitAlFinal: kitY > 0, otra, recarga: await b.ev('scrollY') }, { kitAlFinal: true, otra: { scrollY: 0, foco: 'BODY' }, recarga: 400 })
  await b.metrics(1280, 900, 1)
}

// Carga diferida por ruta (7.2, D12): en la carga completa de cada ruta de D1 y
// de /kit, ningún aviso ni error de consola desde antes del primer script (sin
// el HydrateFallback de la raíz, React Router avisa), y ningún JS de la carga
// de / lleva código del catálogo: ninguno contiene el marcador de una de las 7
// vistas (KIT_VIEWS). Por contenido y no por nombre: un import estático funde
// la vista en index-*.js y no queda ningún Kit*-*.js. Cada marcador se
// comprueba también en la carga de su propia vista, para que la guarda no
// quede vacía si cambia un título. Contrapruebas manuales: docs/verificacion.md.
const CONSOLE_PROBE = `(() => {
  const log = (window.__consola = [])
  for (const type of ['warn', 'error']) {
    const original = console[type]
    console[type] = (...args) => { log.push(type + ': ' + args.map(String).join(' ')); return original.apply(console, args) }
  }
})()`
// Vistas del catálogo cuyo marcador está en algún JS de la carga actual, con
// el archivo que lo lleva.
const kitCodeLoaded = (b) =>
  b.ev(`(async () => {
    const scripts = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\\.(m?js|tsx?)(\\?|$)/.test(new URL(n).pathname))
    const texts = await Promise.all(scripts.map((n) => fetch(n).then((r) => r.text())))
    const found = {}
    for (const [view, marker] of ${JSON.stringify(Object.values(KIT_VIEWS))}) {
      const files = scripts.filter((n, i) => texts[i].includes(marker)).map((n) => new URL(n).pathname)
      if (files.length) found[view] = files
    }
    return found
  })()`)
async function lazyRoutes(b, expect) {
  await b.metrics(1280, 900, 1)
  // Sin Page.enable, el script no se inyecta (window.__consola sin definir).
  await b.send('Page.enable')
  const { identifier } = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: CONSOLE_PROBE })
  const avisos = {}
  const propio = {}
  let raiz
  for (const path of [...ROUTES.map(([p]) => p), ...KIT_PATHS]) {
    await b.go(path)
    const log = await b.ev('window.__consola')
    if (log.length) avisos[path] = log
    if (path === '/') raiz = await kitCodeLoaded(b)
    if (KIT_VIEWS[path]) propio[path] = Boolean((await kitCodeLoaded(b))[KIT_VIEWS[path][0]])
  }
  await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier })
  expect(
    'carga diferida (7.2): 0 avisos y errores de consola en la carga completa de las 16 rutas de D1 y /kit; ningún JS de la carga de / con código del catálogo (marcador de cada una de las 7 vistas); cada marcador, presente en la carga de su vista',
    { avisos, codigoDelCatalogoEnLaCargaDeRaiz: raiz, marcadorEnSuVista: propio },
    { avisos: {}, codigoDelCatalogoEnLaCargaDeRaiz: {}, marcadorEnSuVista: Object.fromEntries(KIT_PATHS.map((p) => [p, true])) },
  )
}

export async function previewFlows(b, expect) {
  await lazyRoutes(b, expect)
  await pushByClick(b, expect)
  await pop(b, expect)
  await focusState(b, expect)
  await titlesAfterClientNav(b, expect)
  await guardFocus(b, expect)
  await fullLoadScroll(b, expect)
}

export default async function run(b, expect) {
  // --- Rutas de D1: h1, título y chrome --------------------------------------------------------------------
  const desktop = {}
  const mobile = {}
  for (const [path] of ROUTES) {
    await b.metrics(1280, 900, 1)
    await b.go(path)
    desktop[path] = await b.ev(`(() => { const h = document.querySelector('h1'), a = document.querySelector('.c-header-desktop [aria-current]'); return { h1: h.textContent, id: h.id, tabIndex: h.tabIndex, h1s: document.querySelectorAll('h1').length, title: document.title, titles: document.querySelectorAll('title').length, actual: a ? [a.textContent, a.getAttribute('aria-current')] : null } })()`)
    await b.metrics(375, 800, 1)
    await b.go(path)
    mobile[path] = await b.ev("(() => { const n = document.querySelector('.c-bottom-nav'); return n ? (n.querySelector('[aria-current]')?.textContent ?? '') : null })()")
  }
  expect(
    'rutas de D1 a 1280: h1 único (#contenido, tabIndex -1), título de D15 en un único <title> y pestaña actual con su aria-current (Figma; «true» en las subpáginas)',
    desktop,
    Object.fromEntries(ROUTES.map(([path, h1, title, actual]) => [path, { h1, id: 'contenido', tabIndex: -1, h1s: 1, title, titles: 1, actual }])),
  )
  expect(
    'rutas de D1 a 375: barra inferior solo en los destinos de primer nivel (con su actual) y en la genérica y el 404 (sin actual); ninguna en las tareas',
    mobile,
    Object.fromEntries(ROUTES.map(([path, , , , bar]) => [path, bar])),
  )

  const kitTitles = {}
  for (const path of KIT_PATHS) {
    await b.metrics(1280, 900, 1)
    await b.go(path)
    kitTitles[path] = await b.ev("[...document.querySelectorAll('title')].map((t) => t.textContent)")
  }
  expect('títulos del catálogo (2.4.2: /kit va a producción), cada uno en un único <title>', kitTitles, {
    '/kit': ['Kit del sistema · Salvia'],
    '/kit/layout': ['Layout · aside al inicio · Kit · Salvia'],
    '/kit/navegacion': ['Navegación · escritorio · Kit · Salvia'],
    '/kit/resultados': ['Búsqueda y resultados · Kit · Salvia'],
    '/kit/fecha-hora': ['Fecha y hora · Kit · Salvia'],
    '/kit/citas': ['Citas y diálogos · Kit · Salvia'],
    '/kit/estados': ['Estados de demo · Kit · Salvia'],
  })
  // El <title> que queda es el estático de index.html, reescrito: el mismo nodo
  // que el HTML servido, en el head. Contraprueba: un segundo <title> antes de él
  // (lo que hacía el <title> de React 19 hasta 7.1) da 2 y document.title pasa
  // a ser el primero, que es lo que la cuenta tiene que detectar.
  expect(
    'un único <title>, el estático de index.html reescrito por useDocumentTitle; contraprueba: con un <title> de React delante, 2 y document.title es el suyo',
    await b.ev(`(() => {
      const unico = [...document.querySelectorAll('title')].map((t) => t.parentElement.tagName)
      const extra = document.createElement('title'); extra.textContent = 'Título de React'; document.head.prepend(extra)
      const con = { n: document.querySelectorAll('title').length, documentTitle: document.title }
      extra.remove()
      return { unico, contraprueba: con, trasRetirarla: document.title }
    })()`),
    { unico: ['HEAD'], contraprueba: { n: 2, documentTitle: 'Título de React' }, trasRetirarla: 'Estados de demo · Kit · Salvia' },
  )

  await lazyRoutes(b, expect)

  // --- Foco de ruta -------------------------------------------------------------------------------------------
  await pushByClick(b, expect)

  await b.metrics(375, 800, 1)
  await b.go('/')
  await clickLink(b, 'Mis citas', "document.querySelector('.c-bottom-nav')")
  await waitFor(b, '/mis-citas')
  expect('PUSH con clic (barra inferior, 375): foco en el h1 y arriba', await b.ev(`({ foco: ${focused}, scrollY: scrollY })`), { foco: 'H1#contenido', scrollY: 0 })

  await b.metrics(1280, 900, 1)
  await b.go('/')
  await b.tabTo("[...document.querySelectorAll('.c-header-desktop a')].find((e) => e.textContent === 'Mis citas')")
  await b.enter()
  await waitFor(b, '/mis-citas')
  expect('PUSH con teclado (Intro en la pestaña): foco en el h1 con el anillo global (destino programático)', await b.ev(`({ foco: ${focused}, anillo: document.activeElement.matches(':focus-visible'), outline: getComputedStyle(document.activeElement).outlineStyle + ' ' + getComputedStyle(document.activeElement).outlineWidth })`), { foco: 'H1#contenido', anillo: true, outline: 'solid 2px' })

  const before = await pop(b, expect)
  // Contraprueba: el mismo focus() sin preventScroll desplaza la página. Por
  // eso el hook lo lleva; sin él pelearía con <ScrollRestoration> (D12).
  await b.ev('document.activeElement.blur(), true')
  await b.ev("document.getElementById('contenido').focus(), true")
  expect('contraprueba: focus() sin preventScroll desplaza la página desde la posición restaurada', (await b.ev('Math.round(scrollY)')) < before, true)

  await b.go('/kit/resultados')
  const pageLink = "[...document.querySelectorAll('.c-pagination a')].find((e) => e.textContent === 'Página 2')"
  const { x, y } = await b.ev(`(() => { const a = ${pageLink}; a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  for (let i = 0; i < 30 && !(await b.ev('location.search')).includes('pagina=2'); i++) await sleep(100)
  await sleep(300)
  expect('cambio solo de search (Page Link «2» en /kit/resultados): el foco no va al h1', await b.ev(`({ busqueda: location.search, foco: document.activeElement.textContent })`), { busqueda: '?pagina=2', foco: 'Página 2' })

  await b.go('/mis-citas')
  expect('carga inicial (go /mis-citas): el hook no mueve el foco', await b.ev(focused), 'BODY')

  await focusState(b, expect)

  // Recarga con state.focus: es una carga inicial; el hook no actúa y el foco
  // se queda en body, sin errores (la consola la comprueba run.mjs).
  await b.go('/mis-citas')
  await setFocusState(b, 'no-existe')
  await b.ev('location.reload(), true')
  await sleep(300)
  for (let i = 0; i < 50 && !(await b.ev("document.readyState === 'complete' && Boolean(document.querySelector('main h1'))").catch(() => false)); i++) await sleep(100)
  await sleep(300)
  expect('recarga de /mis-citas con location.state.focus: carga inicial, foco en body y el state conservado', await b.ev(`({ foco: ${focused}, state: history.state?.usr?.focus })`), { foco: 'BODY', state: 'no-existe' })

  await titlesAfterClientNav(b, expect)

  // --- Salto al contenido en una ruta de la fase 5 -----------------------------------------------------------
  await b.go('/mis-citas')
  await b.tab()
  const skip = await b.ev(focused)
  await b.enter()
  expect('salto al contenido en /mis-citas: primer Tab y, con Intro, foco en el h1', { skip, foco: await b.ev(focused) }, { skip: 'A', foco: 'H1#contenido' })

  // --- Página genérica y 404 ------------------------------------------------------------------------------------
  const exits = {}
  for (const path of ['/fuera-de-alcance', '/no-existe']) {
    await b.metrics(1280, 900, 1)
    await b.go(path)
    await clickLink(b, 'Ir a Especialistas', "document.querySelector('main')")
    await waitFor(b, '/')
    exits[path] = await b.ev(`({ ruta: location.pathname, foco: ${focused} })`)
  }
  expect('«Ir a Especialistas» en la genérica y el 404: navegación en cliente a / y foco en su h1', exits, {
    '/fuera-de-alcance': { ruta: '/', foco: 'H1#contenido' },
    '/no-existe': { ruta: '/', foco: 'H1#contenido' },
  })

  const zoom = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 800, 1)
    for (const path of ['/fuera-de-alcance', '/no-existe']) {
      await b.go(path)
      await b.run(text200)
      const words = await b.run(splitWords, 'main h1, main a')
      zoom[`${overlay ? 'superpuesta' : 'clásica'} ${path}`] = {
        letra: await b.ev('getComputedStyle(document.documentElement).fontSize'),
        h1: await b.ev("Math.round(document.querySelector('main h1').clientWidth)"),
        partidas: words.split,
        pudiendoCaber: words.couldFit,
        desborde: await b.run(overflow),
      }
    }
  }
  await b.overlayScrollbars(false)
  // «encontramos» en page-title al 200 % (62 px) mide más que el h1 entero:
  // parte sin poder caber, lo que la regla permite (DESIGN.md § Controles con
  // icono y etiqueta, límite medido). Ninguna parte pudiendo caber.
  const zoomOk = (h1, partidas = []) => ({ letra: '32px', h1, partidas, pudiendoCaber: [], desborde: 0 })
  expect('genérica y 404 al 200 % a 320 con las dos barras: ninguna palabra partida pudiendo caber, sin desborde', zoom, {
    'clásica /fuera-de-alcance': zoomOk(241),
    'clásica /no-existe': zoomOk(241, ['encontramos']),
    'superpuesta /fuera-de-alcance': zoomOk(256),
    'superpuesta /no-existe': zoomOk(256, ['encontramos']),
  })

  // --- T2: guardas de D1 y 404 lanzado desde la guarda ------------------------------------------------------------
  // En carga completa: la redirección sustituye (idx 0, sin entrada nueva).
  await b.metrics(1280, 900, 1)
  const guards = {}
  for (const path of [
    '/especialistas/no-existe',
    '/especialistas/no-existe/datos',
    `${RUIZ}/datos`,
    `${RUIZ}/confirmar?fecha=2029-04-24&hora=09:00`,
    '/citas/c9/confirmada',
    '/citas/c5/confirmada',
    '/citas/c4/confirmada',
    '/citas/c2/confirmada',
    '/mis-citas/c2/reprogramar',
    '/mis-citas/c9/reprogramar',
  ]) {
    guards[path] = await land(b, path)
  }
  const notFound = (ruta) => ({ ruta, h1: 'No encontramos esta página', idx: 0 })
  expect('guardas (D1): slug o id desconocidos → 404 en su URL; sin hora libre → a la reserva con los mismos parámetros; cita no Confirmada → Mis citas', guards, {
    '/especialistas/no-existe': notFound('/especialistas/no-existe'),
    '/especialistas/no-existe/datos': notFound('/especialistas/no-existe/datos'),
    [`${RUIZ}/datos`]: { ruta: RUIZ, h1: 'Dra. Elena Ruiz Arellano', idx: 0 },
    [`${RUIZ}/confirmar?fecha=2029-04-24&hora=09:00`]: { ruta: `${RUIZ}?fecha=2029-04-24&hora=09:00`, h1: 'Dra. Elena Ruiz Arellano', idx: 0 },
    '/citas/c9/confirmada': notFound('/citas/c9/confirmada'),
    '/citas/c5/confirmada': { ruta: '/mis-citas', h1: 'Mis citas', idx: 0 },
    '/citas/c4/confirmada': { ruta: '/mis-citas', h1: 'Mis citas', idx: 0 },
    '/citas/c2/confirmada': { ruta: '/mis-citas', h1: 'Mis citas', idx: 0 },
    '/mis-citas/c2/reprogramar': { ruta: '/mis-citas', h1: 'Mis citas', idx: 0 },
    '/mis-citas/c9/reprogramar': notFound('/mis-citas/c9/reprogramar'),
  })
  // Contraprueba de cada guarda: su caso válido pasa (tabla de rutas, arriba:
  // /confirmar y /datos con las 10:30 del 24, /citas/c1 y /mis-citas/c3).
  await b.go('/especialistas/no-existe')
  expect('404 lanzado por la guarda: título de D15 y chrome sin pestaña actual', await b.ev("({ title: document.title, actual: document.querySelector('.c-header-desktop [aria-current]') })"), { title: 'No encontramos esta página · Salvia', actual: null })

  await guardFocus(b, expect)
  await confirmedGuard(b, expect)

  // --- T2: /kit/estados -------------------------------------------------------------------------------------------
  await b.go('/kit/estados')
  const stateLinks = await b.ev("[...document.querySelectorAll('main .c-kit__section a')].map((a) => a.getAttribute('href'))")
  const landed = {}
  for (const href of stateLinks) landed[href] = (await land(b, decodeURIComponent(href))).h1
  expect(
    `/kit/estados: los ${stateLinks.length} enlaces llegan a su vista (solo /no-existe al 404)`,
    Object.entries(landed).filter(([, h1]) => h1 === 'No encontramos esta página').map(([href]) => href),
    ['/no-existe'],
  )

  // --- T2: fotos de avatar ------------------------------------------------------------------------------------------
  // WebP simple (RIFF, WEBP y un único trozo VP8: sin EXIF, XMP ni ICCP) y
  // tamaño leído de la cabecera del fotograma VP8.
  const webp = {}
  for (const file of fs.readdirSync(AVATARS).sort()) {
    const buffer = fs.readFileSync(path.join(AVATARS, file))
    const chunks = []
    for (let offset = 12; offset + 8 <= buffer.length; offset += 8 + buffer.readUInt32LE(offset + 4) + (buffer.readUInt32LE(offset + 4) % 2)) chunks.push(buffer.toString('ascii', offset, offset + 4))
    webp[file] = `${buffer.readUInt16LE(26) & 0x3fff}×${buffer.readUInt16LE(28) & 0x3fff} ${chunks.join(' ')}`
  }
  expect('fotos: 6 WebP (96 y 192 por persona), cuadradas y sin metadatos (solo el trozo VP8)', webp, Object.fromEntries(
    ['elena-ruiz-arellano', 'mariana-cifuentes-poza', 'rodrigo-alcantara-vela'].flatMap((slug) => [[`${slug}-192.webp`, '192×192 VP8 '], [`${slug}-96.webp`, '96×96 VP8 ']]),
  ))
  const photoState = "[...document.querySelectorAll('#estados-fotos-lista img')].map((i) => i.width + ' ' + i.currentSrc.split('/').pop().replace(/-[\\w]{8}\\.webp$/, '.webp').replace(/\\?.*$/, '') + ' ' + (i.complete && i.naturalWidth > 0))"
  const photos = {}
  for (const scale of [1, 2]) {
    await b.metrics(1280, 900, scale)
    await b.go('/kit/estados')
    await b.ev("Promise.all([...document.querySelectorAll('#estados-fotos-lista img')].map((i) => i.decode().catch(() => null))).then(() => true)")
    photos[`${scale}x`] = await b.ev(photoState)
    await b.shot(`fotos-${scale}x.png`, await b.rect("document.getElementById('estados-fotos-lista')", 8))
  }
  await b.metrics(1280, 900, 1)
  expect('fotos en /kit/estados: Small (48) y Medium (64) cargadas; el srcset elige 96 en 1x y 192 en 2x para Medium', photos, {
    '1x': ['48 mariana-cifuentes-poza-96.webp true', '64 mariana-cifuentes-poza-96.webp true', '48 elena-ruiz-arellano-96.webp true', '64 elena-ruiz-arellano-96.webp true', '48 rodrigo-alcantara-vela-96.webp true', '64 rodrigo-alcantara-vela-96.webp true'],
    '2x': ['48 mariana-cifuentes-poza-96.webp true', '64 mariana-cifuentes-poza-192.webp true', '48 elena-ruiz-arellano-96.webp true', '64 elena-ruiz-arellano-192.webp true', '48 rodrigo-alcantara-vela-96.webp true', '64 rodrigo-alcantara-vela-192.webp true'],
  })

  // --- T2: datos (check-data con sus contrapruebas) -----------------------------------------------------------------
  const contra = spawnSync(process.execPath, ['scripts/check-data.mjs', '--contrapruebas'], { encoding: 'utf8' })
  const lines = contra.stdout.split('\n').filter((l) => l.startsWith('✓') || l.startsWith('✗'))
  // 24 desde V1a: los tres ejemplos de vacío (consulta, colonia y filtros); 27
  // desde V1b: los tres del almacén de avisos (D16); 32 desde V2a: día
  // inicial de Ruiz, hueco más cercano, Rodrigo sin hueco, nombres cortos y
  // forma de los nombres; 33 desde V2b: el resumen de 02.4; 40 desde V3: la
  // sesión, la validación (03.2, 03.5 y el teléfono) y el borrador (D17); 48
  // desde V4a; 56 desde V4b: el día inicial de la reprogramación, los cinco
  // literales de c3 (uno por literal), sin hora y a menos de 24 h; 61 en el
  // cierre de la fase 5: la política de «Antes de continuar» (plazo, sin hora,
  // literal de V4a y la misma frase en «Qué sigue» y en la política); 62
  // con el literal de Figma de la política (policyFigma).
  expect('check-data --contrapruebas: cada mutación rompe su aserción (weeks sin mutación: hecho del calendario)', { salida: contra.status, rompen: lines.filter((l) => l.startsWith('✓')).length, siguenPasando: lines.filter((l) => l.startsWith('✗')) }, { salida: 0, rompen: 62, siguenPasando: [] })

  await fullLoadScroll(b, expect)

  // --- Resto de pintado en una navegación real hacia una vista -----------------------------------------------
  await b.metrics(1350, 900, 1)
  // park: desde V1a, / tiene casillas al final y el puntero dejaba una en hover.
  const { afterClient, afterReload, ...nav } = await clientNavigation(b, { from: '/kit', link: 'Especialistas', to: '/', park: true })
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-cliente-1350.png', afterClient)
    await b.saveBase64('navegacion-recarga-1350.png', afterReload)
  }
  expect(
    `navegación en cliente /kit → / (clic real): sin resto de pintado, ningún píxel con delta > 64 al llegar ni 4 s después (${resampleNote(nav)})`,
    viewRest(nav),
    { ruta: '/', sinRecarga: true, estado: null, sobre64: 0, cuatroSegundosSobre64: 0 },
  )
  await b.metrics(1280, 900, 1)
}
