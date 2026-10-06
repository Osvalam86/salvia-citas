// 5.2 Perfil y selección de horario (V2a): la vista 2 contra sus pares de
// Figma (02.1, 02.3 a 375; 02.2, la hoja, a 375 × 812; 02.5 y 02.6 a 1440),
// los anchos (la fila de «Elige fecha», el umbral slot-picker y el tramo
// apilado), el texto ampliado y la letra del navegador, forced-colors, la
// estructura, el teclado (tira, ListBox, Intro y el botón por defecto), la URL
// (replace, push, guardas y parámetros que viajan), Missing y su regla de
// salida, los flujos de foco (semana, «Ver horarios del …», hoja, cruce de lg)
// y el conmutador «Avisarme» (D16). V2b: la confirmación previa (02.4) con
// sus anchos, texto ampliado, forced-colors, estructura, enlaces, guardas y
// foco, y la regresión exacta de 02.5 y 02.6 tras sacar BookingSteps,
// BookingDetails y el respaldo de foco (hoy useFocusFallback) de Specialist.tsx. `previewFlows`
// repite los flujos de foco contra pnpm preview (sin StrictMode): pnpm verify
// 5.2 --preview.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation, pixelDelta, resampleNote, viewport, viewRest } from './navegacion.mjs'

const RUIZ = '/especialistas/elena-ruiz-arellano'
const RODRIGO = '/especialistas/rodrigo-alcantara-vela'
const P021 = `${RUIZ}?fecha=2029-04-24&hora=10:30`
const P023 = `${RUIZ}?fecha=2029-04-23`
const Q011 = '/?q=Cardiolog%C3%ADa&especialidad=cardiologia'

const font = (b, px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
const focused = `(() => { const a = document.activeElement; if (!a || a === document.body) return 'BODY'; return a.tagName + ' ' + (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 40)) })()`
const describedBy = `(() => { const id = document.activeElement?.getAttribute('aria-describedby'); return id ? id.split(' ').map((i) => document.getElementById(i)?.textContent).join(' | ') : null })()`
const idx = 'history.state?.idx'
const settle = (b, ms = 250) => sleep(ms)
const clickSel = async (b, selector) => {
  const { x, y } = await b.ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  await settle(b)
}
const escape = async (b) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await settle(b)
}
const arrow = async (b, key, vk) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: vk })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: vk })
  await settle(b, 150)
}
const sheetOpen = (b) => b.ev(`Boolean(document.querySelector('dialog.c-sheet[open]'))`)
const openSheet = async (b) => {
  await b.ev(`document.querySelector('.c-slot-picker__month').focus(), true`)
  await b.enter()
  await settle(b, 300)
}
const rect = (selector) => `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round((r.y + scrollY) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] })()`

// Página entera en un viewport de su alto: la barra sticky queda al final del
// flujo, donde la dibuja Figma.
const fullPage = async (b, width, url) => {
  await b.metrics(width, 900)
  await b.go(url)
  const h = await b.ev('document.documentElement.scrollHeight')
  await b.metrics(width, h)
  await b.ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))')
  return h
}

// Cajas en coordenadas de página (x, y, ancho, alto), frente a Figma a ±1 px.
// null en una cifra: no se compara (ancho de un texto, que es contenido y no
// construcción: métrica de Inter Variable, como en 5.1).
const measure = async (b, parts) => {
  const out = {}
  for (const [k, s] of Object.entries(parts)) out[k] = await b.ev(rect(s))
  return out
}
const outside = (actual, expected) =>
  Object.entries(expected)
    .filter(([k, e]) => {
      const a = actual[k]
      if (e === null || a === null) return e !== a
      return e.some((v, i) => v !== null && Math.abs(v - a[i]) > 1)
    })
    .map(([k, e]) => `${k}: ${JSON.stringify(actual[k])} (Figma ${JSON.stringify(e)})`)

const MOBILE_PARTS = {
  header: '.c-header-mobile',
  retroceso: '.c-back-link',
  avatar: '.c-page-header__avatar',
  h1: 'main h1',
  especialidad: '.c-page-header__specialty',
  ubicacion: '.c-page-header__location',
  modalidad: '.c-page-header__tag',
  fieldset: '.c-slot-picker__dates',
  legend: '.c-slot-picker__legend',
  mes: '.c-slot-picker__month',
  semana: '.c-slot-picker__week-nav',
  etiquetaSemana: '.c-slot-picker__week-label',
  semanaSiguiente: '.c-slot-picker__week-next',
  tira: '.c-day-strip',
  chip2: '.c-day-chip:nth-child(2)',
  tituloHoras: '.c-slot-picker__times .c-slot-picker__heading',
  estado: '.c-slot-picker__status',
  lista: '.c-slot-list',
  hora1: '.c-time-slot',
  tarde: '.c-slot-list__group:nth-child(2)',
  vacio: '.c-empty-state__box',
  placa: '.c-empty-state__badge',
  tituloVacio: '.c-empty-state__title',
  ayuda: '.c-empty-state__help',
  accion1: '.c-empty-state__action',
  accion2: '.c-empty-state__action:nth-child(2)',
  barra: '.c-app-layout__bar',
}
// Figma 02.1 y 02.3 (223:4980, 236:5560), en coordenadas del frame de 375.
const mobileCommon = {
  header: [0, 0, 375, 64], retroceso: [16, 88, null, 48], avatar: [16, 148, 64, 64], h1: [96, 144, 263, 72],
  especialidad: [16, 228, 343, 24], ubicacion: [16, 264, null, 20], modalidad: [16, 292, null, 30],
  fieldset: [16, 354, 343, 184], legend: [16, 365, null, 28], mes: [141, 354, 218, 50], semana: [16, 420, 343, 48],
  etiquetaSemana: [16, 432, null, 24], semanaSiguiente: [311, 420, 48, 48], tira: [16, 476, 343, 62], chip2: [65.6, 476, 45.6, 62],
  tituloHoras: [16, 570, 343, 28], estado: [16, 606, 343, 24],
}
const FIGMA_MOBILE = {
  '02.1': { url: P021, alto: 1064, cajas: { ...mobileCommon, lista: [16, 646, 343, 312], hora1: [16, 678, 106.3, 50], tarde: [16, 814, 343, 144], vacio: null, barra: [0, 990, 375, 74] } },
  '02.3': {
    url: P023,
    alto: 1122,
    cajas: { ...mobileCommon, lista: null, vacio: [16, 646, 343, 370], placa: [41, 671, 48, 48], tituloVacio: [41, 743, 293, 56], ayuda: [41, 807, 293, 48], accion1: [41, 879, 293, 50], accion2: [41, 941, 293, 50], barra: [0, 1048, 375, 74] },
  },
}

const DESKTOP_PARTS = {
  header: '.c-header-desktop',
  breadcrumb: '.c-breadcrumb',
  avatar: '.c-page-header__avatar',
  h1: 'main h1',
  especialidad: '.c-page-header__specialty',
  ubicacion: '.c-page-header__location',
  modalidad: '.c-page-header__tag',
  tarjeta: '.c-slot-picker__card',
  columnaFecha: '.c-slot-picker__calendar',
  eligeFecha: '.c-slot-picker__calendar .c-slot-picker__heading',
  calendario: '.c-slot-picker__calendar .c-calendar',
  horas: '.c-slot-picker__times',
  lista: '.c-slot-list',
  hora1: '.c-time-slot',
  vacio: '.c-empty-state__box',
  tituloVacio: '.c-empty-state__title',
  accion1: '.c-slot-picker__action',
  accion2: '.c-slot-picker__action:nth-child(2)',
  pasos: '.c-booking-summary ol',
  resumen: '.c-booking-summary__card',
  aviso: '.c-booking-summary .c-notice',
  acciones: '.c-booking-summary__actions',
  envio: '.c-booking-summary__actions .c-button',
  main: 'main',
}
// Figma 02.5 y 02.6 (236:5881, 236:6276). Los pasos miden 312 en Figma (HUG)
// y llenan los 320 de la columna en código: se compara su y y su alto. Desde
// el parche de 02.6 (UI/Notice Info, 502:8952, clonada de 02.5), aviso y
// acciones miden lo mismo en los dos frames y los dos miden 1440 × 914.
const desktopCommon = {
  header: [0, 0, 1440, 82], breadcrumb: [120, 114, null, 28], avatar: [120, 167, 96, 96], h1: [240, 158, 1080, 44], especialidad: [240, 210, 1080, 24],
  ubicacion: [240, 247, 286, 20], modalidad: [542, 242, null, 30], tarjeta: [120, 304, 848, 558], columnaFecha: [153, 337, 360, 492], eligeFecha: [153, 337, 360, 28],
  calendario: [153, 381, 360, 448], pasos: [1000, 304, null, 24], resumen: [1000, 344, 320, 254], aviso: [1000, 614, 320, 158], acciones: [1000, 788, 320, 78], envio: [1000, 788, null, 50], main: [0, 82, 1440, 832],
}
const FIGMA_DESKTOP = {
  '02.5': { url: P021, alto: 914, cajas: { ...desktopCommon, horas: [545, 337, 390, null], lista: [545, 413, 390, 312], hora1: [545, 445, 122, 50], vacio: null } },
  '02.6': { url: P023, alto: 914, cajas: { ...desktopCommon, horas: [545, 337, 390, null], lista: null, vacio: [545, 413, 390, 342], tituloVacio: [570, 510, 340, 28], accion1: [570, 618, null, 50], accion2: [570, 680, null, 50] } },
}

async function figmaPairs(b, expect) {
  await b.overlayScrollbars(true)
  for (const [name, { url, alto, cajas }] of Object.entries(FIGMA_MOBILE)) {
    const h = await fullPage(b, 375, url)
    const actual = await measure(b, Object.fromEntries(Object.keys(cajas).map((k) => [k, MOBILE_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width: 375, height: h })
    expect(`${name} (375, barra superpuesta) a ±1 px de Figma, y el alto de página`, { fuera: outside(actual, cajas), alto: h }, { fuera: [], alto })
  }
  // 02.2: la hoja a 375 × 812, abierta desde 02.1.
  await b.metrics(375, 812)
  await b.go(P021)
  await openSheet(b)
  const hoja = await measure(b, { hoja: 'dialog.c-sheet', cabecera: '.c-sheet__header', titulo: '.c-sheet__title', cerrar: '.c-sheet__close', calendario: '.c-sheet .c-calendar', dia24: '.c-sheet [aria-selected="true"]', leyenda: '.c-sheet .c-calendar__legend', pie: '.c-sheet__footer', envio: '.c-sheet__fill' })
  const hojaFigma = { hoja: [0, 170, 375, 642], cabecera: [0, 170, 375, 64], titulo: [16, 186, null, 32], cerrar: [323, 178, 48, 48], calendario: [16, 258, 343, 448], dia24: [65.6, 566, 45.6, 50], leyenda: [16, 686, 343, 20], pie: [0, 730, 375, 82], envio: [16, 746, 343, 50] }
  await b.shot('02.2.png', { x: 0, y: 0, width: 375, height: 812 })
  expect('02.2 (375 × 812): la hoja inferior a ±1 px de Figma; velo color-scrim al 45 %', { fuera: outside(hoja, hojaFigma), velo: await b.ev(`getComputedStyle(document.querySelector('dialog.c-sheet'), '::backdrop').backgroundColor`) }, { fuera: [], velo: 'color(srgb 0 0 0 / 0.45)' })
  await escape(b)

  for (const [name, { url, alto, cajas }] of Object.entries(FIGMA_DESKTOP)) {
    const h = await fullPage(b, 1440, url)
    const actual = await measure(b, Object.fromEntries(Object.keys(cajas).map((k) => [k, DESKTOP_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width: 1440, height: h })
    expect(`${name} (1440) a ±1 px de Figma, y el alto de página`, { fuera: outside(actual, cajas), alto: h }, { fuera: [], alto })
  }
  await b.metrics(1280, 900)
}

// Fila de «Elige fecha» (opción 1 aprobada, DESIGN.md § Fecha y hora): una
// fila desde 334.5 de ancho útil (legend 104.9 + 12 + botón 217.6): 367 de
// viewport con barra superpuesta y 382 con la clásica. Por debajo, el botón
// baja con su ancho intrínseco. En el par de 375 con barra clásica, esa es la
// diferencia declarada.
async function widths(b, expect) {
  const row = `(() => { const l = document.querySelector('.c-slot-picker__legend').getBoundingClientRect(), m = document.querySelector('.c-slot-picker__month').getBoundingClientRect(); return { unaFila: Math.round(l.top) < Math.round(m.bottom) && Math.round(m.top) < Math.round(l.bottom), boton: Math.round(m.width * 10) / 10, xBoton: Math.round(m.x) } })()`
  const out = {}
  for (const [w, overlay] of [[367, true], [366, true], [382, false], [381, false], [375, false], [360, true]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(RUIZ)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(row)
  }
  expect('«Elige fecha» y «Ver mes completo»: una fila desde 367 (superpuesta) y 382 (clásica), con el botón al final; por debajo, baja a la izquierda con su ancho intrínseco', out, {
    '367 sup': { unaFila: true, boton: 217.6, xBoton: 133 },
    '366 sup': { unaFila: false, boton: 217.6, xBoton: 16 },
    '382 clás': { unaFila: true, boton: 217.6, xBoton: 133 },
    '381 clás': { unaFila: false, boton: 217.6, xBoton: 16 },
    '375 clás': { unaFila: false, boton: 217.6, xBoton: 16 },
    '360 sup': { unaFila: false, boton: 217.6, xBoton: 16 },
  })

  // Umbral slot-picker (44.5625rem = 713 de celda): la tarjeta va en fila con
  // tres horas por fila desde ahí; apilada por debajo (tramo 1024–1112, o
  // 1039–1127 con barra clásica, sin frame en Figma: coste declarado).
  const card = `(() => { const c = document.querySelector('.c-slot-picker__card'); const slots = [...document.querySelectorAll('.c-slot-list__group:first-child .c-time-slot')]; const t0 = Math.round(slots[0].getBoundingClientRect().top); return { celda: Math.round(document.querySelector('main .c-slot-picker').getBoundingClientRect().width), fila: getComputedStyle(c).flexDirection === 'row', horasPorFila: slots.filter((s) => Math.round(s.getBoundingClientRect().top) === t0).length } })()`
  const tramo = {}
  for (const [w, overlay] of [[1024, true], [1112, true], [1113, true], [1127, false], [1128, false], [1440, true]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(P021)
    tramo[`${w} ${overlay ? 'sup' : 'clás'}`] = { ...(await b.ev(card)), desborde: await b.run(overflow) }
  }
  expect('slot-picker: en fila desde 713 de celda (1113 de viewport; 1128 con barra clásica), con 3 horas por fila; apilada por debajo', tramo, {
    '1024 sup': { celda: 624, fila: false, horasPorFila: 3, desborde: 0 },
    '1112 sup': { celda: 712, fila: false, horasPorFila: 3, desborde: 0 },
    '1113 sup': { celda: 713, fila: true, horasPorFila: 3, desborde: 0 },
    '1127 clás': { celda: 712, fila: false, horasPorFila: 3, desborde: 0 },
    '1128 clás': { celda: 713, fila: true, horasPorFila: 3, desborde: 0 },
    '1440 sup': { celda: 848, fila: true, horasPorFila: 3, desborde: 0 },
  })
  // Contraprueba: con el umbral de antes (44rem = 704), entre 704 y 712 la
  // tarjeta iría en fila con dos horas por fila (la columna mide 246 y tres
  // piden 255).
  await b.overlayScrollbars(true)
  await b.metrics(1105, 900)
  await b.go(P021)
  await b.style('@container slot-picker (min-width: 44rem) { .c-slot-picker__card { flex-direction: row; align-items: flex-start } .c-slot-picker__times { flex: 1 1 0; min-inline-size: 0 } }')
  expect('contraprueba: con el umbral a 44rem, a 705 de celda la tarjeta va en fila con 2 horas por fila', await b.ev(card), { celda: 705, fila: true, horasPorFila: 2 })
  await b.unstyle()

  // «Semana anterior» y «Semana siguiente» en dos columnas fijas: el control
  // que queda conserva su x en los dos límites del rango.
  await b.metrics(375, 900)
  const xs = {}
  await b.go(RUIZ)
  xs['Ruiz, semana de hoy'] = { anterior: await b.ev(rect('.c-slot-picker__week-previous')), siguiente: await b.ev(rect('.c-slot-picker__week-next')) }
  await clickSel(b, '.c-slot-picker__week-next')
  xs['Ruiz, semana 2'] = { anterior: await b.ev(rect('.c-slot-picker__week-previous')), siguiente: await b.ev(rect('.c-slot-picker__week-next')) }
  await b.go(RODRIGO)
  await clickSel(b, '.c-slot-picker__week-next')
  xs['Rodrigo, semana de maxValue'] = { anterior: await b.ev(rect('.c-slot-picker__week-previous')), siguiente: await b.ev(rect('.c-slot-picker__week-next')) }
  expect('botones de semana en columnas fijas de 48: cada control conserva su x cuando se omite el otro', xs, {
    'Ruiz, semana de hoy': { anterior: null, siguiente: [311, 420, 48, 48] },
    'Ruiz, semana 2': { anterior: [259, 420, 48, 48], siguiente: [311, 420, 48, 48] },
    'Rodrigo, semana de maxValue': { anterior: [259, 420, 48, 48], siguiente: null },
  })
}

// Texto al 200 % a 320 con las dos barras (el chrome móvil, que es el que de
// verdad aparece) y letra del navegador a 24 y 32 a 320 y a 20 a 375.
// Pendiente «Ver mes completo» y «Avisarme si se libera un hueco» al 200 % a
// 320: solo parten palabras más anchas que su interior (158/143 el primero;
// 92/77 las acciones del bloque, el límite de empty-state-compact).
// «completa» (175,4 en un título de 175 con barra clásica) es la trampa del
// margen de +0,5 del detector, como «experiencia» en 4.5: no cabe.
const TEXT = '.c-slot-picker__month, .c-empty-state__action, .c-slot-picker__week-label, .c-legend__heading, .c-day-chip__weekday, .c-day-chip__day, .c-time-slot, .c-slot-picker__status, .c-page-header__title, .c-page-header__specialty, .c-page-header__location-text, .c-back-link, .c-booking-bar__title, .c-booking-bar__meta-text, .c-booking-bar__submit, .c-empty-state__title, .c-empty-state__help'
const inner = (selector) => `[...document.querySelectorAll(${JSON.stringify(selector)})].map((e) => { const cs = getComputedStyle(e); return Math.round(e.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) })`
const firstRow = (selector) => `(() => { const els = [...document.querySelectorAll(${JSON.stringify(selector)})]; if (!els.length) return 0; const t0 = Math.round(els[0].getBoundingClientRect().top); return els.filter((e) => Math.round(e.getBoundingClientRect().top) === t0).length })()`

async function zoom(b, expect) {
  const out = {}
  for (const overlay of [true, false]) {
    for (const [name, url] of [['02.1', P021], ['02.3', P023]]) {
      await b.overlayScrollbars(overlay)
      await b.metrics(320, 900)
      await b.go(url)
      const html = await b.run(text200)
      await settle(b, 300)
      const words = await b.run(splitWords, TEXT)
      out[`${overlay ? 'sup' : 'clás'} ${name}`] = { html, desborde: await b.run(overflow), interiores: await b.ev(inner('.c-slot-picker__month, .c-empty-state__action')), tira: await b.ev(firstRow('.c-day-chip')), horas: await b.ev(firstRow('.c-time-slot')), parten: words.split.sort(), pudiendoCaber: words.couldFit.sort() }
    }
  }
  expect('200 % a 320: sin desborde; tira en 3 columnas y horas en 1; solo parten palabras más anchas que su interior («completa»: trampa del +0,5)', out, {
    'sup 02.1': { html: '32px', desborde: 0, interiores: [158], tira: 3, horas: 1, parten: [], pudiendoCaber: [] },
    'sup 02.3': { html: '32px', desborde: 0, interiores: [158, 92, 92], tira: 3, horas: 0, parten: ['Avisarme', 'horarios', 'hueco', 'martes'], pudiendoCaber: [] },
    'clás 02.1': { html: '32px', desborde: 0, interiores: [143], tira: 3, horas: 1, parten: ['Continuar', 'completo'], pudiendoCaber: [] },
    'clás 02.3': { html: '32px', desborde: 0, interiores: [143, 77, 77], tira: 3, horas: 0, parten: ['Avisarme', 'Continuar', 'completa', 'completo', 'horarios', 'hueco', 'libera', 'martes'], pudiendoCaber: ['completa'] },
  })
  // Contraprueba: sin flex-wrap en la navegación de semana, la etiqueta se
  // queda con lo que dejan los botones (48 con barra superpuesta) y parte
  // «abril».
  await b.overlayScrollbars(true)
  await b.metrics(320, 900)
  await b.go(P021)
  await b.run(text200)
  await b.style('.c-slot-picker__week-nav { flex-wrap: nowrap }')
  expect('contraprueba: sin flex-wrap en la semana, al 200 % a 320 la etiqueta mide 48 y parte «abril»', { ancho: await b.ev(`Math.round(document.querySelector('.c-slot-picker__week-label').getBoundingClientRect().width)`), parten: (await b.run(splitWords, '.c-slot-picker__week-label')).split }, { ancho: 48, parten: ['abril'] })
  await b.unstyle()

  // Letra del navegador (modo de texto grande): la barra pasa al flujo; la
  // hoja se desplaza entera; ninguna palabra parte pudiendo caber.
  const large = {}
  for (const [w, px] of [[320, 24], [320, 32], [375, 20]]) {
    await b.overlayScrollbars(false)
    await b.metrics(w, 800)
    await font(b, px)
    await b.go(P021)
    const page = await b.ev(`({ html: getComputedStyle(document.documentElement).fontSize, barra: getComputedStyle(document.querySelector('.c-app-layout__bar')).position, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth })`)
    const words = await b.run(splitWords, TEXT)
    await openSheet(b)
    const sheet = await b.ev(`(() => { const d = document.querySelector('dialog.c-sheet'); return { hojaSeDesplaza: d.scrollHeight > d.clientHeight && getComputedStyle(d).overflowY === 'auto', alto: Math.round(d.getBoundingClientRect().height) } })()`)
    const sheetWords = await b.run(splitWords, '.c-sheet__title, .c-calendar__month, .c-calendar-day, .c-calendar__legend-item, .c-sheet__fill')
    await escape(b)
    large[`${w} letra ${px}`] = { ...page, pudiendoCaber: words.couldFit, ...sheet, hojaPudiendoCaber: sheetWords.couldFit }
  }
  await font(b, 16)
  expect('letra del navegador a 24 y 32 (320) y a 20 (375): barra estática, hoja desplazable entera, sin palabras partidas pudiendo caber', large, {
    '320 letra 24': { html: '24px', barra: 'static', desborde: 0, pudiendoCaber: [], hojaSeDesplaza: true, alto: 800, hojaPudiendoCaber: [] },
    '320 letra 32': { html: '32px', barra: 'static', desborde: 0, pudiendoCaber: [], hojaSeDesplaza: true, alto: 800, hojaPudiendoCaber: [] },
    '375 letra 20': { html: '20px', barra: 'static', desborde: 0, pudiendoCaber: [], hojaSeDesplaza: true, alto: 800, hojaPudiendoCaber: [] },
  })
  await b.metrics(1280, 900)
}

async function forced(b, expect) {
  await b.overlayScrollbars(true)
  await b.forcedColors(true)
  await b.metrics(375, 900)
  await b.go(RODRIGO)
  await clickSel(b, '.c-slot-picker__week-next')
  const chips = await b.ev(`(() => { const s = (e) => { const c = getComputedStyle(e); return c.borderTopStyle + ' ' + (c.borderTopColor === 'rgba(0, 0, 0, 0)' ? 'transparente' : 'visible') }; const l = [...document.querySelectorAll('.c-day-chip')]; return { lleno: s(l[0]), fueraDeRango: s(l[1]) } })()`)
  await b.shot('forced-rodrigo.png', { x: 0, y: 330, width: 375, height: 240 })
  await b.go(P021)
  await openSheet(b)
  const velo = await b.ev(`getComputedStyle(document.querySelector('dialog.c-sheet'), '::backdrop').backgroundColor`)
  await b.shot('forced-hoja.png', { x: 0, y: 0, width: 375, height: 900 })
  await escape(b)
  await b.forcedColors(false)
  // El fuera de rango lleva borde transparente, como el pasado del
  // calendario: en forced-colors se ve (regla §3.2, conserva el contorno) y se
  // distingue del disponible por el peso, como el pasado.
  expect('forced-colors: el día lleno conserva el punteado; el fuera de rango, el contorno de su borde transparente; el velo conserva el alfa', { ...chips, veloConAlfa: /\/ 0\.45\)$|, 0\.45\)$/.test(velo) }, { lleno: 'dashed visible', fueraDeRango: 'solid visible', veloConAlfa: true })
}

async function structure(b, expect) {
  await b.overlayScrollbars(true)
  const headings = `[...document.querySelectorAll('h1, h2, h3')].map((h) => h.tagName + ' ' + h.textContent.trim())`
  await b.metrics(375, 900)
  await b.go(P023)
  const mobile = {
    titulo: await b.ev('document.title'),
    encabezados: await b.ev(headings),
    legend: await b.ev(`document.querySelector('fieldset > legend > h2')?.textContent`),
    enElGrupo: await b.ev(`[...document.querySelectorAll('fieldset button')].map((e) => e.getAttribute('aria-label') || e.textContent.trim())`),
    estado: await b.ev(`document.querySelector('[role=status].c-slot-picker__status').textContent`),
    regionSemana: await b.ev(`document.querySelector('.c-slot-picker__week-nav [aria-live=polite]')?.textContent`),
    retroceso: await b.ev(`document.querySelector('.c-back-link').getAttribute('href')`),
  }
  expect('móvil (02.3): título, encabezados, legend con h2 (D14), botones de semana dentro del grupo (C1, ≠ panel 02.0), estado con el sufijo oculto y región de semana vacía', mobile, {
    titulo: 'Dra. Elena Ruiz Arellano · Salvia',
    encabezados: ['H1 Dra. Elena Ruiz Arellano', 'H2 Elige fecha', 'H2 Elige hora', 'H3 La agenda de hoy está completa'],
    legend: 'Elige fecha',
    enElGrupo: ['Ver mes completo', 'Semana siguiente'],
    estado: 'Lunes 23 de abril · sin horarios libres',
    regionSemana: '',
    retroceso: '/',
  })
  await b.metrics(1440, 900)
  await b.go(`${P021}&q=Cardiolog%C3%ADa&especialidad=cardiologia&escenario=lenta`)
  const desktop = {
    encabezados: await b.ev(headings),
    seccion: await b.ev(`(() => { const s = document.querySelector('section.c-booking-summary'); return { nombre: document.getElementById(s.getAttribute('aria-labelledby')).textContent, enElForm: Boolean(s.closest('form')), aside: document.querySelectorAll('main aside').length } })()`),
    pasos: await b.ev(`(() => { const o = document.querySelector('.c-booking-summary ol'); return o.getAttribute('aria-label') + ' · ' + o.querySelector('[aria-current=step] .c-step__label').textContent })()`),
    dl: await b.ev(`[...document.querySelectorAll('.c-booking-summary dl > div')].map((d) => [...d.children].map((c) => c.tagName + ' ' + c.textContent.trim()).join(' / '))`),
    aviso: await b.ev(`document.querySelector('.c-booking-summary .c-notice__title').tagName`),
    envio: await b.ev(`(() => { const e = document.querySelector('.c-booking-summary__actions .c-button'); return e.type + ' · ' + document.getElementById(e.getAttribute('aria-describedby')).textContent })()`),
    breadcrumb: await b.ev(`[...document.querySelectorAll('.c-breadcrumb li')].map((l) => l.textContent.replace('/', '').trim() + (l.querySelector('a') ? ' → ' + l.querySelector('a').getAttribute('href') : ''))`),
  }
  expect('escritorio (02.5): encabezados (el h2 oculto del mes es de RAC), «Tu cita» como section dentro del form, pasos, dl, «Antes de continuar» sin encabezado (panel 02.0), envío y breadcrumb con la consulta', desktop, {
    encabezados: ['H1 Dra. Elena Ruiz Arellano', 'H2 Elige fecha', 'H2 abril de 2029', 'H2 Elige hora', 'H2 Tu cita'],
    seccion: { nombre: 'Tu cita', enElForm: true, aside: 0 },
    pasos: 'Pasos de la reserva · Fecha y hora',
    dl: ['DT Cuándo / DD Martes 24 de abril, 10:30', 'DT Duración / DD 30 minutos', 'DT Dónde / DD Clínica Roma Norte / DD Av. Álvaro Obregón 123, Roma Norte'],
    aviso: 'P',
    envio: 'submit · Todavía no se reserva nada',
    breadcrumb: ['Especialistas → /?q=Cardiolog%C3%ADa&especialidad=cardiologia&escenario=lenta', 'Dra. Ruiz'],
  })
  await b.metrics(1280, 900)
}

// Teclado: la tira (radios: las flechas mueven y seleccionan, con replace), el
// ListBox (las flechas mueven sin seleccionar) y el orden de Tab. Intro (hueco
// B): en un radio hace el envío implícito del form, que llega al botón por
// defecto (el de la barra, por form=); en el ListBox selecciona la hora y no
// envía.
async function keyboard(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(RUIZ)
  const order = []
  await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
  for (let i = 0; i < 9; i++) {
    await b.tab()
    order.push(await b.ev(focused))
  }
  // Sin hora elegida, el ListBox recibe el foco en su primera opción (09:00,
  // llena y enfocable, §4.5); con hora, en la elegida.
  expect('orden de Tab en móvil: salto, header, retroceso, «Ver mes completo», semana, la tira (el marcado), la lista de horas y «Continuar»', order, [
    'A Saltar al contenido', 'A Salvia', 'A Ayuda', 'A Especialistas', 'BUTTON Ver mes completo', 'BUTTON Semana siguiente', 'INPUT ', 'DIV 09:00', 'BUTTON Continuar',
  ])

  const idx0 = await b.ev(idx)
  await b.ev(`document.querySelector('input[value="2029-04-24"]').focus(), true`)
  await arrow(b, 'ArrowRight', 39)
  await arrow(b, 'ArrowRight', 39)
  const tira = { marcado: await b.ev(`document.querySelector('.c-day-chip input:checked').value`), url: await b.ev('location.search'), mismoIdx: (await b.ev(idx)) === idx0, estado: await b.ev(`document.querySelector('.c-slot-picker__status').textContent`) }
  await b.ev(`document.querySelector('.c-slot-list [role=option]').focus(), true`)
  await arrow(b, 'ArrowRight', 39)
  const lista = { foco: await b.ev(focused), url: await b.ev('location.search') }
  expect('tira: dos flechas marcan el 26 y escriben fecha con replace; ListBox: la flecha mueve sin seleccionar', { tira, lista }, {
    tira: { marcado: '2029-04-26', url: '?fecha=2029-04-26', mismoIdx: true, estado: 'Jueves 26 de abril · 5 horarios libres' },
    lista: { foco: 'DIV 09:30', url: '?fecha=2029-04-26' },
  })

  // Intro: se cuentan los envíos y su submitter.
  const counter = `(() => { window.__envios = []; document.querySelector('main form').addEventListener('submit', (e) => window.__envios.push(e.submitter?.textContent.trim() ?? null)); return true })()`
  await b.go(RUIZ)
  await b.ev(counter)
  await b.ev(`document.querySelector('input[value="2029-04-24"]').focus(), true`)
  await b.enter()
  await settle(b)
  const radio = { envios: await b.ev('window.__envios'), foco: await b.ev(focused), barra: await b.ev(`document.querySelector('.c-booking-bar__meta').textContent`) }
  await b.go(RUIZ)
  await b.ev(counter)
  await b.ev(`document.querySelector('[data-key="11:00"]').focus(), true`)
  await b.enter()
  await settle(b)
  const option = { envios: await b.ev('window.__envios'), url: await b.ev('location.search') }
  expect('Intro en un radio: envío implícito por «Continuar» de la barra (Missing, foco en la primera libre); Intro en el ListBox: selecciona la hora, sin envío', { radio, option }, {
    radio: { envios: ['Continuar'], foco: 'DIV 10:30', barra: 'Elige un horario primero' },
    option: { envios: [], url: '?fecha=2029-04-24&hora=11%3A00' },
  })
  // Contraprueba: el botón por defecto es el primer submit del form en orden
  // del árbol; uno dentro del form, antes de la barra, cambia el destino.
  await b.go(RUIZ)
  await b.ev(counter)
  await b.ev(`(() => { const s = document.createElement('button'); s.type = 'submit'; s.textContent = 'Intruso'; document.querySelector('main form').prepend(s); return true })()`)
  await b.ev(`document.querySelector('input[value="2029-04-24"]').focus(), true`)
  await b.enter()
  await settle(b)
  expect('contraprueba: con un type="submit" dentro del form antes de la barra, Intro envía por él', await b.ev('window.__envios'), ['Intruso'])

  await b.metrics(1440, 900)
  await b.go(RUIZ)
  const desktopOrder = []
  await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
  for (let i = 0; i < 12; i++) {
    await b.tab()
    desktopOrder.push(await b.ev(focused))
  }
  expect('orden de Tab en escritorio: header, breadcrumb, calendario («Mes siguiente» y el día enfocado), la lista y «Continuar con tus datos»', desktopOrder.slice(6), [
    'A Especialistas', 'BUTTON Mes siguiente', 'DIV martes 24 de abril de 2029, 6 horarios libres, seleccionado', 'DIV 09:00', 'BUTTON Continuar con tus datos', 'BODY',
  ])
  await b.metrics(1280, 900)
}

// URL (D1): push al continuar, parámetros que viajan (escenario incluido,
// pendiente de V2a), guardas de V2 y de /confirmar y /datos (hora codificada
// y sin codificar, punto 4 del plan).
async function url(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  const out = {}
  await b.go(`${RUIZ}?q=Cardiolog%C3%ADa&escenario=ocupada&fecha=2029-04-24&hora=10:30`)
  const i0 = await b.ev(idx)
  await clickSel(b, '.c-booking-bar__submit')
  out.continuarMovil = { ruta: await b.ev('location.pathname + location.search'), push: (await b.ev(idx)) === i0 + 1 }
  await b.metrics(1440, 900)
  await b.go(`${RUIZ}?q=Cardiolog%C3%ADa&escenario=ocupada&fecha=2029-04-24&hora=10:30`)
  await clickSel(b, '.c-booking-summary__actions .c-button')
  out.continuarEscritorio = await b.ev('location.pathname + location.search')
  await b.metrics(375, 900)
  for (const [name, path] of [
    ['datos, hora codificada', `${RUIZ}/datos?fecha=2029-04-24&hora=10%3A30`],
    ['datos, hora sin codificar', `${RUIZ}/datos?fecha=2029-04-24&hora=10:30`],
    ['confirmar, hora codificada', `${RUIZ}/confirmar?fecha=2029-04-24&hora=10%3A30`],
    ['confirmar, hora sin codificar', `${RUIZ}/confirmar?fecha=2029-04-24&hora=10:30`],
    ['datos, hora ocupada (contraprueba)', `${RUIZ}/datos?fecha=2029-04-24&hora=10:00`],
  ]) {
    await b.send('Page.navigate', { url: (process.env.VERIFY_BASE ?? 'http://localhost:5173') + path })
    await sleep(900)
    out[name] = await b.ev('location.pathname')
  }
  // Guardas de V2: fecha fuera de rango y hora no libre se ignoran.
  await b.go(`${RUIZ}?fecha=2029-04-22&hora=10:30`)
  out.fechaFueraDeRango = { marcado: await b.ev(`document.querySelector('.c-day-chip input:checked').value`), hora: await b.ev(`document.querySelector('[aria-selected=true]')?.textContent ?? null`), url: await b.ev('location.search') }
  await b.go(`${RUIZ}?fecha=2029-04-24&hora=10:00`)
  out.horaOcupada = { marcado: await b.ev(`document.querySelector('.c-day-chip input:checked').value`), hora: await b.ev(`document.querySelector('[aria-selected=true]')?.textContent ?? null`) }
  expect('URL: «Continuar» hace push con los parámetros de V1 y escenario; las guardas aceptan la hora codificada y sin codificar; fecha fuera de rango y hora ocupada se ignoran sin tocar la URL', out, {
    continuarMovil: { ruta: `${RUIZ}/confirmar?q=Cardiolog%C3%ADa&escenario=ocupada&fecha=2029-04-24&hora=10%3A30`, push: true },
    continuarEscritorio: `${RUIZ}/datos?q=Cardiolog%C3%ADa&escenario=ocupada&fecha=2029-04-24&hora=10%3A30`,
    'datos, hora codificada': `${RUIZ}/datos`,
    'datos, hora sin codificar': `${RUIZ}/datos`,
    'confirmar, hora codificada': `${RUIZ}/confirmar`,
    'confirmar, hora sin codificar': `${RUIZ}/confirmar`,
    'datos, hora ocupada (contraprueba)': RUIZ,
    fechaFueraDeRango: { marcado: '2029-04-24', hora: null, url: '?fecha=2029-04-22&hora=10:30' },
    horaOcupada: { marcado: '2029-04-24', hora: null },
  })
  await b.metrics(1280, 900)
}

// Missing (hueco C): persiste hasta elegir hora, también si cambia el día; el
// aria-describedby sigue al destino; al elegir hora pasa a Chosen y se retira.
async function missing(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(RUIZ)
  const out = {}
  await clickSel(b, '.c-booking-bar__submit')
  out.enviar = { foco: await b.ev(focused), mensaje: await b.ev(describedBy), barra: await b.ev(`document.querySelector('.c-booking-bar__meta').textContent`) }
  await clickSel(b, 'input[value="2029-04-29"]')
  out.diaLleno = { barra: await b.ev(`document.querySelector('.c-booking-bar__meta').textContent`), describe: await b.ev(`[...document.querySelectorAll('[aria-describedby]')].filter((e) => !e.classList.contains('c-booking-bar__submit')).map((e) => e.textContent.trim())`) }
  await clickSel(b, '.c-empty-state__action')
  out.verHorarios = { foco: await b.ev(focused), mensaje: await b.ev(describedBy), semana: await b.ev(`document.querySelector('.c-slot-picker__week-label').textContent`) }
  await b.space()
  await settle(b)
  out.elegirHora = { barra: await b.ev(`document.querySelector('.c-booking-bar__summary').textContent`), describe: await b.ev(`[...document.querySelectorAll('[aria-describedby]')].filter((e) => !e.classList.contains('c-booking-bar__submit')).length`) }
  await b.go(RODRIGO)
  await clickSel(b, '.c-booking-bar__submit')
  out.rodrigo = { foco: await b.ev(focused), mensaje: await b.ev(describedBy) }
  expect('Missing: foco en la primera libre; al 29 (lleno) sigue y describe «Ver horarios del lunes 30»; tras él, foco en 09:00 del 30; al elegir hora, Chosen sin describedby; Rodrigo, a «Avisarme…»', out, {
    enviar: { foco: 'DIV 10:30', mensaje: 'Elige un horario primero', barra: 'Elige un horario primero' },
    diaLleno: { barra: 'Elige un horario primero', describe: ['Ver horarios del lunes 30'] },
    verHorarios: { foco: 'DIV 09:00', mensaje: 'Elige un horario primero', semana: '30 de abril – 6 de mayo' },
    elegirHora: { barra: 'lun 30 abr · 09:00Presencial · 30 min', describe: 0 },
    rodrigo: { foco: 'BUTTON Avisarme si se libera un hueco', mensaje: 'Elige un horario primero' },
  })
  await b.metrics(1440, 900)
  await b.go(P023)
  await clickSel(b, '.c-booking-summary__actions .c-button')
  expect('Missing en escritorio (02.6): la nota pasa a «Elige un horario primero» y el foco a «Ver horarios del martes 24»', { foco: await b.ev(focused), mensaje: await b.ev(describedBy), acciones: await b.ev(`document.querySelector('.c-booking-summary__actions').textContent`) }, {
    foco: 'BUTTON Ver horarios del martes 24',
    mensaje: 'Elige un horario primero',
    acciones: 'Continuar con tus datosElige un horario primero',
  })
  await b.metrics(1280, 900)
}

// Flujos de foco que dependen del orden de los efectos: se repiten contra la
// preview.
async function focusFlows(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  const out = {}
  // «Ver horarios del martes 24»: el botón desaparece y la lista nueva pinta
  // sus opciones en un segundo commit (SlotList espera con un MutationObserver).
  await b.go(P023)
  await clickSel(b, '.c-empty-state__action')
  out.verHorarios = await b.ev(focused)
  // Contraprueba: sin el observador, el foco cae en body.
  await b.go(P023)
  await b.ev(`window.MutationObserver = class { observe() {} disconnect() {} }, true`)
  await clickSel(b, '.c-empty-state__action')
  out.sinObservador = await b.ev(focused)
  // «Semana anterior» desaparece en la semana de hoy: foco a «Semana siguiente».
  await b.go(RUIZ)
  await clickSel(b, '.c-slot-picker__week-next')
  await b.ev(`document.querySelector('.c-slot-picker__week-previous').focus(), true`)
  await b.enter()
  await settle(b)
  out.semanaAnterior = { foco: await b.ev(focused), region: await b.ev(`document.querySelector('.c-slot-picker__week-nav [aria-live]').textContent`) }
  await b.go(RODRIGO)
  await b.ev(`document.querySelector('.c-slot-picker__week-next').focus(), true`)
  await b.enter()
  await settle(b)
  out.semanaMaxValue = await b.ev(focused)
  expect('foco: «Ver horarios del …» → primera libre (sin el observador, body); «Semana anterior» → «Semana siguiente» con la semana anunciada; en maxValue, → «Semana anterior»', out, {
    verHorarios: 'DIV 10:30',
    sinObservador: 'BODY',
    semanaAnterior: { foco: 'BUTTON Semana siguiente', region: '23 – 29 de abril' },
    semanaMaxValue: 'BUTTON Semana anterior',
  })

  // Hoja: foco inicial en el día; Cerrar, Escape y velo vuelven al disparador
  // y descartan; arrastrar desde la hoja al velo no cierra; aplicar otro día
  // de otra semana anuncia solo el estado de horas; el mismo día conserva la
  // hora; cruzar lg la cierra y lleva el foco al h1.
  const sheet = {}
  await b.metrics(375, 812)
  await b.go(P021)
  await openSheet(b)
  sheet.abrir = await b.ev(focused)
  await clickSel(b, '.c-sheet__close')
  sheet.cerrar = { abierta: await sheetOpen(b), foco: await b.ev(focused) }
  await openSheet(b)
  await escape(b)
  sheet.escape = { abierta: await sheetOpen(b), foco: await b.ev(focused) }
  await openSheet(b)
  await b.click(187, 80)
  await settle(b)
  sheet.velo = { abierta: await sheetOpen(b), foco: await b.ev(focused), url: await b.ev('location.search') }
  await openSheet(b)
  await b.mouse('mousePressed', 187, 400)
  await b.mouse('mouseMoved', 187, 80)
  await b.mouse('mouseReleased', 187, 80)
  await settle(b)
  sheet.arrastrar = { abierta: await sheetOpen(b) }
  // El borrador, desde una hoja recién abierta: el arrastre deja el foco
  // fuera de la rejilla.
  await escape(b)
  await openSheet(b)
  await arrow(b, 'ArrowDown', 40)
  await b.enter()
  await settle(b)
  sheet.borrador = { etiqueta: await b.ev(`document.querySelector('.c-sheet__fill').textContent`), url: await b.ev('location.search') }
  await clickSel(b, '.c-sheet__fill')
  sheet.aplicar = {
    foco: await b.ev(focused),
    url: await b.ev('location.search'),
    semana: await b.ev(`document.querySelector('.c-slot-picker__week-label').textContent`),
    regionSemana: await b.ev(`document.querySelector('.c-slot-picker__week-nav [aria-live]').textContent`),
    estado: await b.ev(`document.querySelector('.c-slot-picker__status').textContent`),
  }
  await b.go(P021)
  await openSheet(b)
  await clickSel(b, '.c-sheet__fill')
  sheet.mismoDia = await b.ev('location.search')
  await openSheet(b)
  await b.metrics(1100, 812)
  await settle(b, 400)
  sheet.cruceLg = { abierta: await sheetOpen(b), foco: await b.ev(focused) }
  expect('hoja 02.2: foco inicial en el día; Cerrar, Escape y velo devuelven el foco y descartan; arrastre al velo no cierra; aplicar otra semana solo cambia el estado (no la región de semana); mismo día conserva la hora; cruce de lg → h1', sheet, {
    abrir: 'DIV martes 24 de abril de 2029, 6 horarios libres, seleccionado',
    cerrar: { abierta: false, foco: 'BUTTON Ver mes completo' },
    escape: { abierta: false, foco: 'BUTTON Ver mes completo' },
    velo: { abierta: false, foco: 'BUTTON Ver mes completo', url: '?fecha=2029-04-24&hora=10:30' },
    arrastrar: { abierta: true },
    borrador: { etiqueta: 'Ver horarios del martes 1', url: '?fecha=2029-04-24&hora=10:30' },
    aplicar: { foco: 'BUTTON Ver mes completo', url: '?fecha=2029-05-01', semana: '30 de abril – 6 de mayo', regionSemana: '', estado: 'Martes 1 de mayo · 6 horarios libres' },
    mismoDia: '?fecha=2029-04-24&hora=10:30',
    cruceLg: { abierta: false, foco: 'H1 Dra. Elena Ruiz Arellano' },
  })

  // Cruce de lg con el foco en la tira (D7): el control deja de existir y el
  // foco va al h1 en el mismo commit.
  await b.metrics(375, 900)
  await b.go(RUIZ)
  await b.ev(`document.querySelector('input[value="2029-04-24"]').focus(), true`)
  await b.metrics(1100, 900)
  await settle(b, 400)
  expect('cruce de lg con el foco en la tira: al h1', await b.ev(focused), 'H1 Dra. Elena Ruiz Arellano')
  await b.metrics(1280, 900)
}

// Región del mes en la hoja 02.2 (7.6): el anunciador de RAC, en body, queda
// inerte bajo el <dialog> modal; la hoja lleva su región (Calendar,
// announceMonth). Un MutationObserver apunta cada texto de la región. a) botón,
// flechas hasta otro mes y botón de vuelta al mismo mes: se vacía al cruzar con
// las flechas y vuelve a anunciarse. b) en el mes de minValue y en el de
// maxValue el botón desaparece y RAC lleva el foco a un día: foco, no región.
// `full`: también la región al abrir y su ausencia en línea (no en --preview).
const MONTH_REGION = `document.querySelector('dialog.c-sheet .c-calendar [role=status]')`
const recordMonth = `(() => { const r = ${MONTH_REGION}; window.__mesObs?.disconnect(); window.__mes = []; window.__mesObs = new MutationObserver(() => window.__mes.push(r.textContent)); window.__mesObs.observe(r, { childList: true, characterData: true, subtree: true }); return true })()`
const shiftTab = async (b) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, modifiers: 8 })
  await settle(b, 150)
}
const pressMonth = async (b, label) => {
  await b.ev(`document.querySelector('dialog.c-sheet [aria-label="${label}"]').focus(), true`)
  await b.enter()
  await settle(b)
}
async function monthRegion(b, expect, full) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  const out = {}
  if (full) {
    await b.go(P021)
    await openSheet(b)
    out.alAbrir = await b.ev(`(() => { const r = ${MONTH_REGION}; return r && { enElDialogo: Boolean(r.closest('dialog:modal')), texto: r.textContent } })()`)
  }
  // a) «Mes siguiente», ↓ hasta junio, Mayús+Tab hasta «Mes anterior» e Intro.
  await b.go(P021)
  await openSheet(b)
  await b.ev(recordMonth)
  await pressMonth(b, 'Mes siguiente')
  await b.tab()
  for (let i = 0; i < 2; i++) await arrow(b, 'ArrowDown', 40)
  const grid = await b.ev(focused)
  await shiftTab(b)
  await shiftTab(b)
  await b.enter()
  await settle(b)
  out.a = { textos: await b.ev('window.__mes'), rejilla: grid, foco: await b.ev(focused) }
  // b) mayo → «Mes anterior» hacia abril (minValue).
  await b.go(P021)
  await openSheet(b)
  await pressMonth(b, 'Mes siguiente')
  await b.ev(recordMonth)
  await pressMonth(b, 'Mes anterior')
  out.bMin = { textos: await b.ev('window.__mes'), foco: await b.ev(focused), anterior: await b.ev(`Boolean(document.querySelector('dialog.c-sheet [aria-label="Mes anterior"]'))`) }
  // b) «Mes siguiente» hasta el mes de maxValue: el último clic se registra aparte.
  await b.go(P021)
  await openSheet(b)
  const months = []
  for (let i = 0; i < 6; i++) {
    const next = `document.querySelector('dialog.c-sheet [aria-label="Mes siguiente"]')`
    const last = await b.ev(`(() => { const s = document.querySelector('dialog.c-sheet .c-calendar__month').textContent; return s })()`)
    months.push(last)
    if (!(await b.ev(`Boolean(${next})`))) break
    await b.ev(recordMonth)
    await pressMonth(b, 'Mes siguiente')
  }
  out.bMax = { meses: months, textos: await b.ev('window.__mes'), foco: await b.ev(focused), siguiente: await b.ev(`Boolean(document.querySelector('dialog.c-sheet [aria-label="Mes siguiente"]'))`) }
  expect('región del mes en la hoja (a): «Mes siguiente» la escribe; al cruzar de mes con las flechas se vacía; «Mes anterior» de vuelta al mismo mes vuelve a escribirla', { textos: out.a.textos, rejillaEnJunio: /^DIV .* de junio de 2029/.test(out.a.rejilla), foco: out.a.foco }, {
    textos: ['mayo de 2029', '', 'mayo de 2029'],
    rejillaEnJunio: true,
    foco: 'BUTTON Mes anterior',
  })
  expect('región del mes en la hoja (b, minValue): «Mes anterior» hacia abril desaparece y RAC lleva el foco al día; la región se vacía y no nombra abril (foco, no región)', out.bMin, {
    textos: [''],
    foco: 'DIV martes 24 de abril de 2029, 6 horarios libres, seleccionado',
    anterior: false,
  })
  expect('región del mes en la hoja (b, maxValue): el último «Mes siguiente» desaparece y RAC lleva el foco a un día de julio; la región se vacía y no nombra julio', { meses: out.bMax.meses, textos: out.bMax.textos, siguiente: out.bMax.siguiente, focoEnJulio: /^DIV .* de julio de 2029/.test(out.bMax.foco) }, {
    meses: ['Abril 2029', 'Mayo 2029', 'Junio 2029', 'Julio 2029'],
    textos: [''],
    siguiente: false,
    focoEnJulio: true,
  })
  if (full) {
    await b.metrics(1440, 900)
    await b.go(P021)
    await b.ev(`document.querySelector('[aria-label="Mes siguiente"]').focus(), true`)
    await b.enter()
    await settle(b)
    out.enLinea = await b.ev(`document.querySelectorAll('.c-calendar [role=status]').length`)
    await b.metrics(1280, 900)
    expect('región del mes en la hoja: al abrir, dentro del diálogo modal y vacía', out.alAbrir, { enElDialogo: true, texto: '' })
    expect('región del mes: a 1440, con el calendario en línea y tras «Mes siguiente», ninguna región propia (anuncia RAC)', out.enLinea, 0)
  }
}

// Conmutador «Avisarme si se libera un hueco» (D16): clave por médico. Se
// activa en la Result Card de Rodrigo (V1) y su perfil ya dice «Te
// avisaremos»; conmutarlo aquí deja el foco en el botón.
async function notify(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(Q011)
  const card = `[...document.querySelectorAll('main .c-result-card')].find((c) => c.textContent.includes('Rodrigo'))`
  await b.ev(`${card}.querySelector('button').click(), true`)
  await settle(b)
  await b.ev(`(() => { history.pushState(null, '', '${RODRIGO}'); dispatchEvent(new PopStateEvent('popstate')); return true })()`)
  for (let i = 0; i < 30 && !(await b.ev(`Boolean(document.querySelector('.c-empty-state__action'))`)); i++) await sleep(100)
  const fromV1 = await b.ev(`(() => { const e = document.querySelector('.c-empty-state__action'); return e.textContent.trim() + ' · ' + e.getAttribute('aria-pressed') })()`)
  await b.ev(`document.querySelector('.c-empty-state__action').focus(), true`)
  await b.enter()
  await settle(b)
  const toggled = { boton: await b.ev(`(() => { const e = document.querySelector('.c-empty-state__action'); return e.textContent.trim() + ' · ' + e.getAttribute('aria-pressed') })()`), foco: await b.ev(focused) }
  expect('«Avisarme si se libera un hueco» (D16): el aviso de la Result Card de Rodrigo llega a su perfil; conmutar deja el foco en el botón', { fromV1, toggled }, {
    fromV1: 'Te avisaremos · true',
    toggled: { boton: 'Avisarme si se libera un hueco · false', foco: 'BUTTON Avisarme si se libera un hueco' },
  })
}

// --- V2b: confirmación previa (/confirmar, Figma 02.4) ----------------------------------------------------------

const CONFIRM = `${RUIZ}/confirmar?fecha=2029-04-24&hora=10:30`
const CONFIRM_PARTS = {
  header: '.c-header-mobile',
  retroceso: '.c-back-link',
  pasos: '.c-page-header__heading ol',
  paso3: '.c-page-header__heading ol li:nth-child(3)',
  h1: 'main h1',
  tarjeta: '.c-appointment-summary__card',
  quien:'.c-appointment-summary__who',
  avatar: '.c-appointment-summary .c-avatar',
  nombre: '.c-appointment-summary__name',
  especialidad: '.c-appointment-summary__specialty',
  modalidad: '.c-appointment-summary .c-tag',
  dl: '.c-appointment-summary dl',
  fila3: '.c-appointment-summary dl > div:nth-child(3)',
  cambiar: '.c-booking-review .c-button',
  aviso: '.c-booking-review .c-notice',
  main: 'main',
  barra: '.c-app-layout__bar',
  continuar: '.c-action-bar .c-button',
  nota: '.c-action-bar__note',
}
// Figma 02.4 (236:5722), en coordenadas del frame de 375 × 986. Los pasos
// miden 312 en Figma (HUG) y llenan la columna en código: se compara su y, su
// alto y la x del tercero.
const FIGMA_024 = {
  header: [0, 0, 375, 64], retroceso: [16, 88, null, 48], pasos: [16, 144, null, 24], paso3: [264, 144, null, 24], h1: [16, 184, 343, 36],
  tarjeta: [16, 252, 343, 344], quien: [41, 277, 293, 102], avatar: [41, 277, 48, 48], nombre: [105, 277, 229, 24], especialidad: [105, 301, 229, 24],
  modalidad: [105, 333, null, 30], dl: [41, 395, 293, 176], fila3: [41, 507, 293, 64], cambiar: [16, 612, 343, 50], aviso: [16, 694, 343, 158],
  main: [0, 64, 375, 820], barra: [0, 884, 375, 102], continuar: [16, 896, 343, 50], nota: [16, 954, 343, 20],
}

async function confirmPairs(b, expect) {
  await b.overlayScrollbars(true)
  const h = await fullPage(b, 375, CONFIRM)
  const actual = await measure(b, CONFIRM_PARTS)
  await b.shot('02.4.png', { x: 0, y: 0, width: 375, height: h })
  expect('02.4 (375, barra superpuesta) a ±1 px de Figma, y el alto de página', { fuera: outside(actual, FIGMA_024), alto: h }, { fuera: [], alto: 986 })
  // Contraprueba: sin el −1px, el trazo de «Who» se suma a su padding.
  await b.style('.c-appointment-summary__who { padding-block-end: var(--space-4) }')
  expect('contraprueba: sin el −1px, «Who» mide 103 (Figma 102)', (await b.ev(rect(CONFIRM_PARTS.quien)))[3], 103)
  await b.unstyle()
  await b.metrics(1280, 900)
}

// Refactor de V2b (BookingSteps, BookingDetails y el respaldo de foco salen de
// Specialist.tsx): las cajas de «Tu cita» en 02.5 y 02.6, exactas (sin el
// ±1), frente a la línea base medida antes del cambio (b58cad4).
const V2A_BASE = {
  header: [0, 0, 1440, 82], breadcrumb: [120, 114, 1200, 28], h1: [240, 158, 1080, 44], tarjeta: [120, 304, 848, 558], pasos: [1000, 304, 320, 24],
  paso1: [1000, 304, 118.7, 24], paso3: [1247, 304, 63.5, 24], resumen: [1000, 344, 320, 254], tituloResumen: [1017, 361, 286, 28], dl: [1017, 405, 286, 176],
  fila1: [1017, 405, 286, 44], fila2: [1017, 461, 286, 44], fila3: [1017, 517, 286, 64], dd3b: [1049, 561, 254, 20], aviso: [1000, 614, 320, 158],
  acciones: [1000, 788, 320, 78], envio: [1000, 788, 234.7, 50], nota: [1000, 846, 182.1, 20], main: [0, 82, 1440, 832],
}
const V2A_PARTS = {
  header: '.c-header-desktop', breadcrumb: '.c-breadcrumb', h1: 'main h1', tarjeta: '.c-slot-picker__card', pasos: '.c-booking-summary ol',
  paso1: '.c-booking-summary ol li:nth-child(1)', paso3: '.c-booking-summary ol li:nth-child(3)', resumen: '.c-booking-summary__card',
  tituloResumen: '.c-booking-summary__card h2', dl: '.c-booking-summary__card dl', fila1: '.c-booking-summary__card dl > div:nth-child(1)',
  fila2: '.c-booking-summary__card dl > div:nth-child(2)', fila3: '.c-booking-summary__card dl > div:nth-child(3)',
  dd3b: '.c-booking-summary__card dl > div:nth-child(3) dd:last-child', aviso: '.c-booking-summary .c-notice', acciones: '.c-booking-summary__actions',
  envio: '.c-booking-summary__actions .c-button', nota: '.c-booking-summary__actions p', main: 'main',
}

async function refactorV2a(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  for (const [name, url] of [['02.5', P021], ['02.6', P023]]) {
    const h = await fullPage(b, 1440, url)
    const boxes = await measure(b, V2A_PARTS)
    out[name] = { alto: h, distintas: Object.entries(V2A_BASE).filter(([k, v]) => JSON.stringify(boxes[k]) !== JSON.stringify(v)).map(([k]) => `${k}: ${JSON.stringify(boxes[k])}`) }
  }
  expect('refactor de V2b: las cajas de 02.5 y 02.6 son las de la línea base (exactas, sin ±1)', out, { '02.5': { alto: 914, distintas: [] }, '02.6': { alto: 914, distintas: [] } })
  await b.metrics(1280, 900)
}

// Anchos: la columna y el interior de la barra comparten eje en el tramo; desde
// lg, breadcrumb de tres niveles, sin barra, columna de 38rem y acciones
// intrínsecas (C1-A).
async function confirmWidths(b, expect) {
  const mobile = `(() => { const x = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().x) : null }; return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: x('main h1'), tarjeta: x('.c-appointment-summary'), continuar: x('.c-action-bar .c-button'), anchoContinuar: Math.round(document.querySelector('.c-action-bar .c-button').getBoundingClientRect().width) } })()`
  const out = {}
  for (const [w, overlay] of [[320, true], [320, false], [360, true], [800, true], [1023, false]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(CONFIRM)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(mobile)
  }
  expect('02.4 en anchos intermedios: sin desborde; h1, tarjeta y «Continuar» en el mismo eje, también en el tramo (la barra reutiliza o-wrapper)', out, {
    '320 sup': { desborde: 0, h1: 16, tarjeta: 16, continuar: 16, anchoContinuar: 288 },
    '320 clás': { desborde: 0, h1: 16, tarjeta: 16, continuar: 16, anchoContinuar: 273 },
    '360 sup': { desborde: 0, h1: 16, tarjeta: 16, continuar: 16, anchoContinuar: 328 },
    '800 sup': { desborde: 0, h1: 96, tarjeta: 96, continuar: 96, anchoContinuar: 608 },
    '1023 clás': { desborde: 0, h1: 200, tarjeta: 200, continuar: 200, anchoContinuar: 608 },
  })

  const desktop = `(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)] }; return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, barra: Boolean(document.querySelector('.c-app-layout__bar')), migas: [...document.querySelectorAll('.c-breadcrumb li')].map((l) => l.textContent.replace('/', '').trim()), h1: r('main h1'), columna: r('.c-booking-review'), cambiar: r('.c-booking-review > div > .c-button'), aviso: r('.c-booking-review .c-notice'), continuar: r('.c-booking-review__actions .c-button'), nota: r('.c-booking-review__note') } })()`
  const wide = {}
  for (const w of [1024, 1440]) {
    await b.overlayScrollbars(true)
    await b.metrics(w, 900)
    await b.go(CONFIRM)
    wide[w] = await b.ev(desktop)
  }
  await b.shot('02.4-1440.png', { x: 0, y: 0, width: 1440, height: 900 })
  // Sin frame: cifras medidas. Breadcrumb 114–142, pasos a 158, h1 a 198; la
  // columna a 32 del h1 (tarjeta 344, «Cambiar» a 16, aviso a 32 en dos
  // líneas: 110, acciones a 32); envío y nota con las medidas de 02.5 (234,7
  // y 182,1). Desde V3, el breadcrumb queda a space-4 de lo que sigue: regla
  // general de c-page-header desde lg (Figma 02.5, 03.3 y 04.4); hasta V3 iba
  // a space-2 y todo lo de debajo estaba 8 px más arriba (pasos a 150).
  expect('02.4 desde lg (C1-A, sin frame): breadcrumb de tres niveles a space-4 de los pasos, sin barra, columna de 38rem alineada con el h1, «Cambiar» y «Continuar» intrínsecos y la nota debajo', wide, {
    1024: { desborde: 0, barra: false, migas: ['Especialistas', 'Dra. Ruiz', 'Confirma tu cita'], h1: [24, 198, 976, 44], columna: [24, 274, 608, 662], cambiar: [24, 634, 216, 50], aviso: [24, 716, 608, 110], continuar: [24, 858, 235, 50], nota: [24, 916, 182, 20] },
    1440: { desborde: 0, barra: false, migas: ['Especialistas', 'Dra. Ruiz', 'Confirma tu cita'], h1: [120, 198, 1200, 44], columna: [120, 274, 608, 662], cambiar: [120, 634, 216, 50], aviso: [120, 716, 608, 110], continuar: [120, 858, 235, 50], nota: [120, 916, 182, 20] },
  })
  // Contraprueba: sin el tope, la columna llena los 1200 del contenedor.
  await b.style('.c-booking-review { max-inline-size: none }')
  expect('contraprueba: sin los 38rem, la columna mide 1200 a 1440', (await b.ev(desktop)).columna[2], 1200)
  await b.unstyle()
  await b.metrics(1280, 900)
}

// 200 % a 320 con las dos barras y letra del navegador a 24 y 32 (320) y a 20
// (375): el chrome móvil. Solo parten palabras más anchas que su interior.
const TEXT_024 = '.c-back-link, .c-step__label, .c-page-header__title, .c-appointment-summary__name, .c-appointment-summary__specialty, .c-tag, .c-booking-details__term span, .c-booking-details__value, .c-booking-details__address, .c-booking-review .c-button, .c-notice__text > *, .c-action-bar .c-button, .c-action-bar__note'

async function confirmZoom(b, expect) {
  const out = {}
  for (const overlay of [true, false]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900)
    await b.go(CONFIRM)
    const html = await b.run(text200)
    await settle(b, 300)
    const words = await b.run(splitWords, TEXT_024)
    out[overlay ? 'sup' : 'clás'] = {
      html,
      desborde: await b.run(overflow),
      interiores: await b.ev(inner('.c-booking-review .c-button, .c-action-bar .c-button')),
      tarjeta: (await b.ev(inner('.c-appointment-summary__card')))[0],
      padding: await b.ev(`getComputedStyle(document.querySelector('.c-appointment-summary__card')).paddingLeft`),
      columnaDatos: (await b.ev(inner('.c-booking-details__value')))[0],
      parten: words.split.sort(),
      pudiendoCaber: words.couldFit.sort(),
    }
  }
  // appointment-summary-compact (16.75rem): la raíz mide 8 / 7,53rem y la
  // tarjeta pasa a padding space-4 (32 al 200 %). Interior 190 / 175 y
  // columna de datos 126 / 111 (tras icono 40 y hueco 24): «10:30» (82) cabe.
  // Solo parten palabras más anchas que su elemento: el h1 y el aviso fuera
  // de la tarjeta; con barra clásica, además, «Duración», «minutos»,
  // «Obregón» y «Presencial» (antes, 17 palabras; con superpuesta, 10).
  expect('02.4 al 200 % a 320: tarjeta compacta (padding space-4), sin desborde, «10:30» no parte; solo parten palabras más anchas que su interior', out, {
    sup: { html: '32px', desborde: 0, interiores: [158, 158], tarjeta: 190, padding: '32px', columnaDatos: 126, parten: ['Confirma', 'identificación.'], pudiendoCaber: [] },
    clás: { html: '32px', desborde: 0, interiores: [143, 143], tarjeta: 175, padding: '32px', columnaDatos: 111, parten: ['Confirma', 'Continuar', 'Duración', 'Obregón', 'Presencial', 'identificación.', 'minutos', 'reprogramar'], pudiendoCaber: [] },
  })
  // Contraprueba: con el padding space-5 de siempre, a la columna le quedan
  // 79 con barra clásica y «10:30» parte.
  await b.overlayScrollbars(false)
  await b.metrics(320, 900)
  await b.go(CONFIRM)
  await b.run(text200)
  await b.style('.c-appointment-summary__card { padding: var(--space-5) }')
  await settle(b, 300)
  expect('contraprueba: sin el umbral compacto, al 200 % a 320 (barra clásica) la columna mide 79 y «10:30» parte', { columnaDatos: (await b.ev(inner('.c-booking-details__value')))[0], parte1030: (await b.run(splitWords, '.c-booking-details__value')).split.includes('10:30') }, { columnaDatos: 79, parte1030: true })
  await b.unstyle()

  // Al 100 % la raíz supera el umbral: padding 24 (Figma), también a 320 con
  // barra clásica (273 = 17,06rem).
  const normal = {}
  for (const [w, overlay] of [[320, true], [320, false], [375, true]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(CONFIRM)
    normal[`${w} ${overlay ? 'sup' : 'clás'}`] = { raiz: await b.ev(`Math.round(document.querySelector('.c-appointment-summary').getBoundingClientRect().width)`), padding: await b.ev(`getComputedStyle(document.querySelector('.c-appointment-summary__card')).paddingLeft`) }
  }
  expect('al 100 %, la tarjeta conserva el padding de Figma (24) a 320 con las dos barras y a 375', normal, {
    '320 sup': { raiz: 288, padding: '24px' },
    '320 clás': { raiz: 273, padding: '24px' },
    '375 sup': { raiz: 343, padding: '24px' },
  })

  const large = {}
  for (const [w, px] of [[320, 24], [320, 32], [375, 20]]) {
    await b.overlayScrollbars(false)
    await b.metrics(w, 800)
    await font(b, px)
    await b.go(CONFIRM)
    const page = await b.ev(`({ html: getComputedStyle(document.documentElement).fontSize, barra: getComputedStyle(document.querySelector('.c-app-layout__bar')).position, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, barraAlFinal: Math.round(document.querySelector('.c-app-layout__bar').getBoundingClientRect().bottom + scrollY) === document.documentElement.scrollHeight })`)
    large[`${w} letra ${px}`] = { ...page, pudiendoCaber: (await b.run(splitWords, TEXT_024)).couldFit }
  }
  await font(b, 16)
  expect('02.4 con la letra del navegador a 24 y 32 (320) y a 20 (375): Action Bar estática al final del flujo, sin desborde ni palabras partidas pudiendo caber', large, {
    '320 letra 24': { html: '24px', barra: 'static', desborde: 0, barraAlFinal: true, pudiendoCaber: [] },
    '320 letra 32': { html: '32px', barra: 'static', desborde: 0, barraAlFinal: true, pudiendoCaber: [] },
    '375 letra 20': { html: '20px', barra: 'static', desborde: 0, barraAlFinal: true, pudiendoCaber: [] },
  })
  await b.metrics(1280, 900)
}

async function confirmForced(b, expect) {
  await b.overlayScrollbars(true)
  await b.forcedColors(true)
  await b.metrics(375, 900)
  await b.go(CONFIRM)
  const border = (s, side = 'Top') => `(() => { const c = getComputedStyle(document.querySelector(${JSON.stringify(s)})); return c.border${side}Style + ' ' + c.border${side}Width + ' ' + (c.border${side}Color === 'rgba(0, 0, 0, 0)' ? 'transparente' : 'visible') })()`
  const out = {
    tarjeta: await b.ev(border('.c-appointment-summary__card')),
    quien: await b.ev(border('.c-appointment-summary__who', 'Bottom')),
    aviso: await b.ev(border('.c-booking-review .c-notice')),
    barra: await b.ev(border('.c-action-bar')),
    continuar: await b.ev(border('.c-action-bar .c-button')),
    cambiar: await b.ev(border('.c-booking-review .c-button')),
  }
  await b.shot('forced-02.4.png', { x: 0, y: 0, width: 375, height: 900 })
  await b.forcedColors(false)
  expect('02.4 en forced-colors: tarjeta, separador de «Who», aviso, barra y los dos botones conservan su contorno', out, {
    tarjeta: 'solid 1px visible', quien: 'solid 1px visible', aviso: 'solid 1px visible', barra: 'solid 1px visible', continuar: 'solid 1px visible', cambiar: 'solid 1px visible',
  })
}

async function confirmStructure(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(CONFIRM)
  const common = {
    titulo: await b.ev('document.title'),
    encabezados: await b.ev(`[...document.querySelectorAll('h1, h2, h3, h4')].map((h) => h.tagName + ' ' + h.textContent.trim())`),
    pasos: await b.ev(`(() => { const o = document.querySelector('.c-page-header ol'); return o.getAttribute('aria-label') + ' · ' + [...o.querySelectorAll('li')].map((l) => (l.getAttribute('aria-current') ?? '-') + ' ' + l.querySelector('.c-step__label').textContent).join(' | ') })()`),
    quien: await b.ev(`(() => { const w = document.querySelector('.c-appointment-summary__who'); return { avatar: w.querySelector('.c-avatar').getAttribute('aria-hidden'), foto: w.querySelector('img')?.getAttribute('alt'), texto: [...w.querySelectorAll('p, .c-tag')].map((e) => e.tagName + ' ' + e.textContent) } })()`),
    dl: await b.ev(`[...document.querySelectorAll('.c-appointment-summary dl > div')].map((d) => [...d.children].map((c) => c.tagName + ' ' + c.textContent.trim()).join(' / '))`),
    aviso: await b.ev(`(() => { const n = document.querySelector('.c-booking-review .c-notice'); return { titulo: n.querySelector('.c-notice__title').tagName, role: n.getAttribute('role') } })()`),
    continuar: await b.ev(`(() => { const e = document.querySelector('.c-action-bar .c-button'); return e.tagName + ' · ' + document.getElementById(e.getAttribute('aria-describedby')).textContent + ' · fuera de main: ' + !e.closest('main') })()`),
  }
  expect('02.4: título (D15), un solo encabezado, pasos (Fecha y hora actual), «Who» con avatar decorativo, dl, aviso Info sin encabezado ni role, «Continuar» enlace descrito por la nota', common, {
    titulo: 'Confirma tu cita · Salvia',
    encabezados: ['H1 Confirma tu cita'],
    pasos: 'Pasos de la reserva · step Fecha y hora | - Tus datos, pendiente | - Listo, pendiente',
    quien: { avatar: 'true', foto: '', texto: ['P Dra. Elena Ruiz Arellano', 'P Cardiología', 'SPAN Presencial'] },
    dl: ['DT Cuándo / DD Martes 24 de abril, 10:30', 'DT Duración / DD 30 minutos', 'DT Dónde / DD Clínica Roma Norte / DD Av. Álvaro Obregón 123, Roma Norte'],
    aviso: { titulo: 'P', role: null },
    continuar: 'A · Todavía no se reserva nada · fuera de main: true',
  })
  await b.metrics(1440, 900)
  await b.go(CONFIRM)
  expect('02.4 desde lg: «Continuar con tus datos» al final de main, descrito por la nota', await b.ev(`(() => { const e = document.querySelector('.c-booking-review__actions .c-button'); return e.tagName + ' · ' + document.getElementById(e.getAttribute('aria-describedby')).textContent + ' · en main: ' + Boolean(e.closest('main')) })()`), 'A · Todavía no se reserva nada · en main: true')

  await b.metrics(375, 900)
  await b.go(CONFIRM)
  const order = []
  await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
  for (let i = 0; i < 7; i++) {
    await b.tab()
    order.push(await b.ev(focused))
  }
  expect('orden de Tab en 02.4: salto, header, retroceso, «Cambiar fecha u hora» y «Continuar con tus datos» (la barra va tras main)', order, [
    'A Saltar al contenido', 'A Salvia', 'A Ayuda', 'A Dra. Ruiz', 'A Cambiar fecha u hora', 'A Continuar con tus datos', 'BODY',
  ])
  await b.metrics(1280, 900)
}

// URL (D1): los enlaces llevan la selección, los parámetros de V1 y el
// escenario; un parámetro ajeno no viaja. Pendiente de V2a: el salto
// /confirmar → /datos repite la prueba de escenario.
async function confirmUrl(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  const carried = 'q=Cardiolog%C3%ADa&especialidad=cardiologia&pagina=2&escenario=ocupada'
  const hrefs = `({ retroceso: document.querySelector('.c-back-link').getAttribute('href'), cambiar: document.querySelector('.c-booking-review .c-button').getAttribute('href'), continuar: document.querySelector('.c-action-bar .c-button').getAttribute('href') })`
  await b.go(`${RUIZ}/confirmar?${carried}&foo=1&fecha=2029-04-24&hora=10%3A30`)
  const links = await b.ev(hrefs)
  const i0 = await b.ev(idx)
  await clickSel(b, '.c-action-bar .c-button')
  const datos = { ruta: await b.ev('location.pathname + location.search'), push: (await b.ev(idx)) === i0 + 1, foco: await b.ev(focused) }
  await b.go(CONFIRM)
  const sinEscenario = await b.ev(hrefs)
  const profile = `${RUIZ}?${carried}&fecha=2029-04-24&hora=10%3A30`
  expect('enlaces de 02.4: retroceso y «Cambiar» con el mismo href al perfil con la selección; «Continuar» a /datos (push, foco en su h1) con los parámetros de V1 y escenario; foo no viaja; sin escenario en la URL, el href no lo lleva (contraprueba)', { links, datos, sinEscenario }, {
    links: { retroceso: profile, cambiar: profile, continuar: `${RUIZ}/datos?${carried}&fecha=2029-04-24&hora=10%3A30` },
    datos: { ruta: `${RUIZ}/datos?${carried}&fecha=2029-04-24&hora=10%3A30`, push: true, foco: 'H1 Tus datos' },
    sinEscenario: { retroceso: `${RUIZ}?fecha=2029-04-24&hora=10%3A30`, cambiar: `${RUIZ}?fecha=2029-04-24&hora=10%3A30`, continuar: `${RUIZ}/datos?fecha=2029-04-24&hora=10%3A30` },
  })

  // Retroceso: push al perfil, foco en su h1 y la hora de la URL marcada (D2).
  await b.go(CONFIRM)
  const i1 = await b.ev(idx)
  await clickSel(b, '.c-back-link')
  const back = { ruta: await b.ev('location.pathname + location.search'), push: (await b.ev(idx)) === i1 + 1, foco: await b.ev(focused), hora: await b.ev(`document.querySelector('[aria-selected=true]')?.textContent ?? null`), barra: await b.ev(`document.querySelector('.c-booking-bar__title').textContent`) }
  expect('retroceso «Dra. Ruiz»: push al perfil con la selección, foco en su h1 y las 10:30 marcadas', back, {
    ruta: `${RUIZ}?fecha=2029-04-24&hora=10%3A30`, push: true, foco: 'H1 Dra. Elena Ruiz Arellano', hora: '10:30', barra: 'mar 24 abr · 10:30',
  })

  // Guardas propias de /confirmar (las de 5.0 cubren hora pasada y slug en /datos).
  const guards = {}
  for (const [name, path] of [['sin hora', `${RUIZ}/confirmar?fecha=2029-04-24`], ['slug desconocido', '/especialistas/no-existe/confirmar?fecha=2029-04-24&hora=10:30']]) {
    await b.send('Page.navigate', { url: (process.env.VERIFY_BASE ?? 'http://localhost:5173') + path })
    await sleep(900)
    guards[name] = { ruta: await b.ev('location.pathname + location.search'), h1: await b.ev(`document.querySelector('h1')?.textContent`), idx: await b.ev(idx) }
  }
  expect('guardas de /confirmar: sin hora, replace al perfil con los mismos parámetros (idx 0); slug desconocido, 404', guards, {
    'sin hora': { ruta: `${RUIZ}?fecha=2029-04-24`, h1: 'Dra. Elena Ruiz Arellano', idx: 0 },
    'slug desconocido': { ruta: '/especialistas/no-existe/confirmar?fecha=2029-04-24&hora=10:30', h1: 'No encontramos esta página', idx: 0 },
  })
  await b.metrics(1280, 900)
}

// Flujos de foco (también contra la preview): llegada desde el perfil y cruce
// de lg en los dos sentidos.
async function confirmFocus(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  const out = {}
  await b.go(P021)
  await clickSel(b, '.c-booking-bar__submit')
  out.llegada = { ruta: await b.ev('location.pathname'), foco: await b.ev(focused) }
  // El retroceso deja de existir: al h1.
  await b.go(CONFIRM)
  await b.ev(`document.querySelector('.c-back-link').focus(), true`)
  await b.metrics(1100, 900)
  await settle(b, 400)
  out.aEscritorio = await b.ev(focused)
  // Y de vuelta, desde el breadcrumb.
  await b.ev(`document.querySelector('.c-breadcrumb a').focus(), true`)
  await b.metrics(375, 900)
  await settle(b, 400)
  out.aMovil = await b.ev(focused)
  // «Cambiar fecha u hora» sigue existiendo: el foco se queda.
  await b.ev(`document.querySelector('.c-booking-review .c-button').focus(), true`)
  await b.metrics(1100, 900)
  await settle(b, 400)
  out.cambiarSeQueda = await b.ev(focused)
  // Contraprueba: con el foco del h1 anulado, el cruce deja el foco en body.
  await b.metrics(375, 900)
  await b.go(CONFIRM)
  await b.ev(`document.getElementById('contenido').focus = () => {}, document.querySelector('.c-action-bar .c-button').focus(), true`)
  await b.metrics(1100, 900)
  await settle(b, 400)
  out.sinRespaldo = await b.ev(focused)
  expect('foco en 02.4: llegada desde «Continuar» → h1; cruce de lg desde el retroceso o el breadcrumb → h1; «Cambiar», que no cambia de control, conserva el foco; sin el respaldo, body (contraprueba)', out, {
    llegada: { ruta: `${RUIZ}/confirmar`, foco: 'H1 Confirma tu cita' },
    aEscritorio: 'H1 Confirma tu cita',
    aMovil: 'H1 Confirma tu cita',
    cambiarSeQueda: 'A Cambiar fecha u hora',
    sinRespaldo: 'BODY',
  })
  await b.metrics(1280, 900)
}

export async function previewFlows(b, expect) {
  await focusFlows(b, expect)
  await monthRegion(b, expect, false)
  await missing(b, expect)
  await confirmFocus(b, expect)
}

// «Antes de continuar» a menos de 24 h (cierre de la fase 5): cuerpo del aviso
// según la hora elegida (policyText, src/data/booking.ts).
const POLICY = `[...document.querySelectorAll('.c-notice')].find((n) => n.querySelector('.c-notice__title')?.textContent === 'Antes de continuar')?.querySelector('.c-notice__text p:not(.c-notice__title)').textContent ?? null`
const MARIANA = '/especialistas/mariana-cifuentes-poza'
const clickText = async (b, selector, text) => {
  const { x, y } = await b.ev(`(() => { const e = [...document.querySelectorAll(${JSON.stringify(selector)})].find((n) => n.textContent.includes(${JSON.stringify(text)})); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  await sleep(300)
}

// 02.4 (375 y 1440) con Mariana hoy a las 19:15 y con la c1; 02.5 (1440) con
// clics reales: sin hora → 19:15 de hoy → otro día sin hora → su primera hora
// libre. El cambio en 02.5 no se anuncia (aviso Info sin role): se comprueba.
async function latePolicy(b, expect) {
  await b.overlayScrollbars(false)
  const out = {}
  for (const width of [375, 1440]) {
    await b.metrics(width, 900, 1)
    await b.go(`${MARIANA}/confirmar?fecha=2029-04-23&hora=19%3A15`)
    out[`02.4 ${width} Mariana 19:15`] = await b.ev(POLICY)
    await b.go(`${RUIZ}/confirmar?fecha=2029-04-24&hora=10%3A30`)
    out[`02.4 ${width} Ruiz 24 10:30`] = await b.ev(POLICY)
  }
  await b.metrics(1440, 900, 1)
  await b.go(`${MARIANA}?fecha=2029-04-23`)
  out['02.5 sin hora (23)'] = await b.ev(POLICY)
  await clickText(b, 'main .c-slot-list [role=option]', '19:15')
  out['02.5 clic en 19:15 (23)'] = { politica: await b.ev(POLICY), url: await b.ev('location.search'), role: await b.ev(`[...document.querySelectorAll('.c-notice')].find((n) => n.querySelector('.c-notice__title')?.textContent === 'Antes de continuar').getAttribute('role')`) }
  await clickText(b, 'main .c-calendar-day', '25')
  out['02.5 clic en el 25 (sin hora)'] = await b.ev(POLICY)
  const first = await b.ev(`document.querySelector('main .c-slot-list [role=option]:not([aria-disabled=true])')?.textContent.trim() ?? null`)
  await clickText(b, 'main .c-slot-list [role=option]:not([aria-disabled=true])', first)
  out['02.5 clic en la primera hora del 25'] = { hora: first, politica: await b.ev(POLICY) }
  await b.metrics(1280, 900, 1)
  const late = 'Puedes gestionar tu cita desde Mis citas. Llega 10 minutos antes con una identificación.'
  const general = 'Puedes cancelar o reprogramar sin costo hasta 24 horas antes. Llega 10 minutos antes con una identificación.'
  expect('«Antes de continuar» a menos de 24 h: 02.4 (375 y 1440) y 02.5 con clics reales, en los dos sentidos; sin hora, la general; el aviso sin role (el cambio no se anuncia)', out, {
    '02.4 375 Mariana 19:15': late,
    '02.4 375 Ruiz 24 10:30': general,
    '02.4 1440 Mariana 19:15': late,
    '02.4 1440 Ruiz 24 10:30': general,
    '02.5 sin hora (23)': general,
    '02.5 clic en 19:15 (23)': { politica: late, url: '?fecha=2029-04-23&hora=19%3A15', role: null },
    '02.5 clic en el 25 (sin hora)': general,
    '02.5 clic en la primera hora del 25': { hora: first, politica: general },
  })
}

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.overlayScrollbars(false)
  await font(b, 16)
  await figmaPairs(b, expect)
  await widths(b, expect)
  await zoom(b, expect)
  await forced(b, expect)
  await structure(b, expect)
  await keyboard(b, expect)
  await url(b, expect)
  await missing(b, expect)
  await focusFlows(b, expect)
  await monthRegion(b, expect, true)
  await notify(b, expect)

  // V2b
  await refactorV2a(b, expect)
  await confirmPairs(b, expect)
  await confirmWidths(b, expect)
  await confirmZoom(b, expect)
  await confirmForced(b, expect)
  await confirmStructure(b, expect)
  await confirmUrl(b, expect)
  await confirmFocus(b, expect)

  // Cierre de la fase 5
  await latePolicy(b, expect)

  // Navegación real hacia la vista: «Ver horarios» de la primera tarjeta de
  // 01.1. Resto de pintado con el criterio del cierre de la fase 5 (delta > 64,
  // navegacion.mjs); el remuestreo de una foto se informa y no cuenta.
  await b.overlayScrollbars(false)
  await b.metrics(1350, 900, 1)
  const to = `/especialistas/mariana-cifuentes-poza?q=Cardiolog%C3%ADa&especialidad=cardiologia`
  const { afterClient, afterReload, ...nav } = await clientNavigation(b, { from: Q011, link: 'Ver horarios', to, park: true })
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-cliente-1350.png', afterClient)
    await b.saveBase64('navegacion-recarga-1350.png', afterReload)
  }
  expect(
    `navegación en cliente 01.1 → perfil («Ver horarios», clic real): sin resto de pintado, ningún píxel con delta > 64 al llegar ni 4 s después (${resampleNote(nav)})`,
    viewRest(nav),
    { ruta: to, sinRecarga: true, estado: null, sobre64: 0, cuatroSegundosSobre64: 0 },
  )

  // V2b: 02.1 → 02.4 con «Continuar» de la Booking Bar (un botón: solo existe
  // bajo lg), a 375 con barra clásica. El mismo criterio; aquí el remuestreo de
  // la foto de «Who» se probó con la foto bloqueada en el origen (0 de 5).
  await b.metrics(375, 900, 1)
  const toConfirm = `${RUIZ}/confirmar?fecha=2029-04-24&hora=10%3A30`
  const { afterClient: clientShot, afterReload: reloadShot, ...confirmArrival } = await clientNavigation(b, { from: P021, link: 'Continuar', selector: 'button', to: toConfirm, park: true })
  if (confirmArrival.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-confirmar-cliente-375.png', clientShot)
    await b.saveBase64('navegacion-confirmar-recarga-375.png', reloadShot)
  }
  expect(
    `navegación en cliente 02.1 → 02.4 («Continuar», clic real, 375): sin resto de pintado, ningún píxel con delta > 64 al llegar ni 4 s después (${resampleNote(confirmArrival)})`,
    viewRest(confirmArrival),
    { ruta: toConfirm, sinRecarga: true, estado: null, sobre64: 0, cuatroSegundosSobre64: 0 },
  )
  // Contraprueba del criterio: un resto sobre la foto (un avatar de /kit, «E»,
  // encima de la de Ruiz en «Who») supera el delta de 64 aunque caiga dentro
  // del img. La página es 02.4 recargada y al final, como reloadShot.
  await b.ev(`(() => { const r = document.querySelector('.c-appointment-summary img').getBoundingClientRect(), a = document.createElement('span'); a.className = 'c-avatar c-avatar--small'; a.textContent = 'E'; a.dataset.verify = ''; a.style.cssText = 'position:fixed;z-index:1;left:' + r.left + 'px;top:' + r.top + 'px'; document.body.append(a); return true })()`)
  await sleep(100)
  const injected = await b.ev(pixelDelta(await viewport(b), reloadShot))
  await b.ev(`document.querySelectorAll('[data-verify]').forEach((e) => e.remove()), true`)
  expect('contraprueba: un resto inyectado sobre la foto de «Who» (02.4) supera el delta de 64', { hayResto: injected.sobre64 > 0, deltaMax: injected.deltaMax > 64 }, { hayResto: true, deltaMax: true })
  await b.metrics(1280, 900, 1)
}
