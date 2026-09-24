// 5.0 Transversal (T1): las rutas de D1 con su h1, su título (D15) y su
// chrome; el foco de ruta (D12, useRouteFocus) en PUSH, POP, cambio solo de
// search, carga inicial y location.state.focus; la página genérica y el 404.
// `previewFlows` repite los flujos de foco contra pnpm preview (sin
// StrictMode): pnpm verify 5.0 --preview.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation } from './navegacion.mjs'

const RUIZ = '/especialistas/elena-ruiz-arellano'
const ROUTES = [
  ['/', 'Encuentra a tu especialista', 'Especialistas · Salvia', ['Especialistas', 'page'], 'Especialistas'],
  [RUIZ, 'Perfil del especialista', 'Perfil del especialista · Salvia', ['Especialistas', 'true'], null],
  [`${RUIZ}/confirmar`, 'Confirma tu cita', 'Confirma tu cita · Salvia', ['Especialistas', 'true'], null],
  [`${RUIZ}/datos`, 'Tus datos', 'Tus datos · Salvia', ['Especialistas', 'true'], null],
  ['/citas/ruiz-2029-04-24/confirmada', 'Tu cita está reservada', 'Cita reservada · Salvia', ['Especialistas', 'true'], null],
  ['/mis-citas', 'Mis citas', 'Mis citas · Salvia', ['Mis citas', 'page'], 'Mis citas'],
  ['/mis-citas/cortes-2029-05-16/reprogramar', 'Reprogramar cita', 'Reprogramar cita · Salvia', ['Mis citas', 'true'], null],
  ['/fuera-de-alcance', 'Esta sección no forma parte del caso de estudio', 'Fuera del caso de estudio · Salvia', null, ''],
  ['/no-existe', 'No encontramos esta página', 'No encontramos esta página · Salvia', null, ''],
]

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

// Títulos tras navegar en cliente vista → catálogo → vista: React 19 pone su
// <title> antes del estático de index.html y lo retira al desmontar.
async function titlesAfterClientNav(b, expect) {
  await b.metrics(1280, 900, 1)
  await b.go('/mis-citas')
  const seen = [await b.ev('document.title')]
  await clickLink(b, 'Especialistas', "document.querySelector('.c-header-desktop')")
  await waitFor(b, '/')
  seen.push(await b.ev('document.title'))
  await back(b, '/mis-citas')
  seen.push(await b.ev('document.title'))
  expect('document.title tras navegar en cliente (/mis-citas → / → Atrás)', seen, ['Mis citas · Salvia', 'Especialistas · Salvia', 'Mis citas · Salvia'])
}

export async function previewFlows(b, expect) {
  await pushByClick(b, expect)
  await pop(b, expect)
  await focusState(b, expect)
  await titlesAfterClientNav(b, expect)
}

export default async function run(b, expect) {
  // --- Rutas de D1: h1, título y chrome --------------------------------------------------------------------
  const desktop = {}
  const mobile = {}
  for (const [path] of ROUTES) {
    await b.metrics(1280, 900, 1)
    await b.go(path)
    desktop[path] = await b.ev(`(() => { const h = document.querySelector('h1'), a = document.querySelector('.c-header-desktop [aria-current]'); return { h1: h.textContent, id: h.id, tabIndex: h.tabIndex, h1s: document.querySelectorAll('h1').length, title: document.title, actual: a ? [a.textContent, a.getAttribute('aria-current')] : null } })()`)
    await b.metrics(375, 800, 1)
    await b.go(path)
    mobile[path] = await b.ev("(() => { const n = document.querySelector('.c-bottom-nav'); return n ? (n.querySelector('[aria-current]')?.textContent ?? '') : null })()")
  }
  expect(
    'rutas de D1 a 1280: h1 único (#contenido, tabIndex -1), título de D15 y pestaña actual con su aria-current (Figma; «true» en las subpáginas)',
    desktop,
    Object.fromEntries(ROUTES.map(([path, h1, title, actual]) => [path, { h1, id: 'contenido', tabIndex: -1, h1s: 1, title, actual }])),
  )
  expect(
    'rutas de D1 a 375: barra inferior solo en los destinos de primer nivel (con su actual) y en la genérica y el 404 (sin actual); ninguna en las tareas',
    mobile,
    Object.fromEntries(ROUTES.map(([path, , , , bar]) => [path, bar])),
  )

  const kitTitles = {}
  for (const path of ['/kit', '/kit/layout', '/kit/navegacion', '/kit/resultados', '/kit/fecha-hora', '/kit/citas']) {
    await b.metrics(1280, 900, 1)
    await b.go(path)
    kitTitles[path] = await b.ev('document.title')
  }
  expect('títulos del catálogo (2.4.2: /kit va a producción)', kitTitles, {
    '/kit': 'Kit del sistema · Salvia',
    '/kit/layout': 'Layout · aside al inicio · Kit · Salvia',
    '/kit/navegacion': 'Navegación · escritorio · Kit · Salvia',
    '/kit/resultados': 'Búsqueda y resultados · Kit · Salvia',
    '/kit/fecha-hora': 'Fecha y hora · Kit · Salvia',
    '/kit/citas': 'Citas y diálogos · Kit · Salvia',
  })
  expect('<title> estático de index.html: se conserva detrás del de React (document.title devuelve el primero)', await b.ev("[...document.head.querySelectorAll('title')].map((t) => t.textContent)"), ['Citas y diálogos · Kit · Salvia', 'Salvia'])

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

  // --- Resto de pintado en una navegación real hacia una vista -----------------------------------------------
  await b.metrics(1350, 900, 1)
  const { afterClient, afterReload, ...nav } = await clientNavigation(b, { from: '/kit', link: 'Especialistas', to: '/' })
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-cliente-1350.png', afterClient)
    await b.saveBase64('navegacion-recarga-1350.png', afterReload)
  }
  expect(
    'navegación en cliente /kit → / (clic real): sin restos en los píxeles, y el resto de pintado explicado o mitigado (✗ declarado: DESIGN.md, Pendientes, «Resto de pintado»)',
    { ...nav, explicado: false },
    { ruta: '/', sinRecarga: true, estado: null, pixelesDistintosDeLaRecarga: 0, cuatroSegundosDespues: 0, explicado: true },
  )
  await b.metrics(1280, 900, 1)
}
