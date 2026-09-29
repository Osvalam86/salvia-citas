// 5.4 Confirmación y Mis citas (V4a): la confirmación contra sus pares de
// Figma (04.1 a 375, 04.4 a 1440), la foto de la Dra. Ruiz, el umbral
// appointment-summary-wide con su contraprueba y la regresión exacta de 02.4 y
// 03.3 frente a la línea base anterior a V4a (c5a813a).
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { H1_ACROSS_LG, h1AcrossLg } from './cruce-lg.mjs'
import { clientNavigation, pixelDelta, pixelDiff, resampleNote, toBottom, viewport, viewRest } from './navegacion.mjs'

const C1 = '/citas/c1/confirmada'
const RUIZ = '/especialistas/elena-ruiz-arellano'
const settle = (ms = 250) => sleep(ms)
const idx = 'history.state?.idx'
const font = (b, px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
const focused = `(() => { const a = document.activeElement; if (!a || a === document.body) return 'BODY'; return a.tagName + ' ' + (a.id ? '#' + a.id : (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 40))) })()`
const clickSel = async (b, selector) => {
  const { x, y } = await b.ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  await settle()
}
const MOTIVO = `(() => { const s = document.getElementById('motivo'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, 'Primera consulta'); s.dispatchEvent(new Event('change', { bubbles: true })); return true })()`
const CONFIRM_024 = '/especialistas/elena-ruiz-arellano/confirmar?fecha=2029-04-24&hora=10:30'
const DATOS_033 = '/especialistas/elena-ruiz-arellano/datos?fecha=2029-04-24&hora=10:30'

const rect = (selector) => `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round((r.y + scrollY) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] })()`
const measure = async (b, parts) => {
  const out = {}
  for (const [k, s] of Object.entries(parts)) out[k] = await b.ev(rect(s))
  return out
}
// Página entera en un viewport de su alto: la barra sticky queda al final del
// flujo, donde la dibuja Figma.
const fitPage = async (b, width) => {
  const h = await b.ev('document.documentElement.scrollHeight')
  await b.metrics(width, h)
  await b.ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))')
  return h
}
// Cajas frente a Figma a ±1 px. null en una cifra: no se compara (ancho de un
// texto, métrica de Inter Variable, como en 5.1 a 5.3).
const outside = (actual, expected) =>
  Object.entries(expected)
    .filter(([k, e]) => {
      const a = actual[k]
      if (e === null || a === null) return e !== a
      return e.some((v, i) => v !== null && Math.abs(v - a[i]) > 1)
    })
    .map(([k, e]) => `${k}: ${JSON.stringify(actual[k])} (Figma ${JSON.stringify(e)})`)

// Foto de avatar: caja, carga y candidata (96 a DPR 1), decorativa.
const photo = (selector) =>
  `(() => { const img = document.querySelector(${JSON.stringify(selector)} + ' img'); if (!img) return null; const r = img.getBoundingClientRect(); return { caja: [Math.round(r.x), Math.round(r.y + scrollY), Math.round(r.width), Math.round(r.height)], cargada: img.complete && img.naturalWidth > 0, candidata: img.currentSrc.split('/').pop().replace(/-[\\w]{8}\\.webp$/, '.webp'), alt: img.getAttribute('alt'), oculto: img.closest('[aria-hidden="true"]') !== null } })()`

const CONFIRM_PARTS = {
  header: '.c-header-mobile, .c-header-desktop',
  breadcrumb: '.c-breadcrumb',
  pasos: 'ol[aria-label="Pasos de la reserva"]',
  insignia: '.c-page-header__badge',
  titulo: '.c-page-header__title-group',
  h1: 'main h1',
  nota: '.c-page-header__subtitle',
  marco: '.c-appointment-summary__body',
  tarjeta: '.c-appointment-summary__card',
  quien: '.c-appointment-summary__who',
  avatar: '.c-appointment-summary .c-avatar',
  dl: '.c-booking-details',
  fila1: '.c-booking-details > div:nth-child(1)',
  fila2: '.c-booking-details > div:nth-child(2)',
  fila3: '.c-booking-details > div:nth-child(3)',
  calendario: '.c-appointment-summary__action',
  aviso: 'main .c-notice--info',
  verCitas: 'main .c-booking-summary__actions .c-button',
  main: 'main',
  barra: '.c-app-layout__bar',
  boton: '.c-action-bar .c-button',
}
// Figma 04.1 (277:5908), en coordenadas del frame de 375 × 1070. El marco del
// resumen (Appointment Summary) es __body en código; los pasos miden 313 (HUG)
// y llenan la columna: y y alto.
const FIGMA_041 = {
  header: [0, 0, 375, 64], breadcrumb: null, pasos: [16, 88, null, 24], insignia: [16, 128, 48, 48], titulo: [16, 192, 343, 92], h1: [16, 192, 343, 36], nota: [16, 236, 343, 48],
  marco: [16, 316, 343, 344], quien: [41, 341, 293, 102], avatar: [41, 341, 48, 48], dl: [41, 459, 293, 176], fila3: [41, 571, 293, 64],
  calendario: [16, 676, 343, 50], aviso: [16, 758, 343, 206], verCitas: null, main: [0, 64, 375, 932], barra: [0, 996, 375, 74], boton: [16, 1008, 343, 50],
}
// Figma 04.4 (284:6687), en coordenadas del frame de 1440 × 900. La tarjeta
// (Frame · Appointment) es __card; el breadcrumb, «Agregar…» y «Ver mis
// citas» van en HUG: sin su ancho (métrica de Inter). La x de Duración y
// Dónde depende del ancho del texto de Cuándo (188 en el navegador, 190 en
// Figma): se comparan y y alto, y aparte los huecos de 32 y el borde derecho.
const FIGMA_044 = {
  header: [0, 0, 1440, 82], breadcrumb: [120, 114, null, 28], pasos: [1000, 266, null, 24], insignia: [120, 172, 48, 48], titulo: [192, 158, 1128, 76], h1: [192, 158, 1128, 44], nota: [192, 210, 1128, 24],
  tarjeta: [120, 266, 848, 330], quien: [153, 299, 782, 102], avatar: [153, 299, 48, 48], dl: [153, 425, 782, 64],
  fila1: [153, 425, null, 44], fila2: [null, 425, null, 44], fila3: [null, 425, null, 64], calendario: [153, 513, null, 50],
  aviso: [1000, 306, 320, 206], verCitas: [1000, 528, null, 50], main: [0, 82, 1440, 818], barra: null, boton: null,
}

async function confirmPairs(b, expect) {
  await b.overlayScrollbars(true)
  for (const [name, width, figma, alto] of [['04.1', 375, FIGMA_041, 1070], ['04.4', 1440, FIGMA_044, 900]]) {
    await b.metrics(width, 900)
    await b.go(C1)
    const h = await fitPage(b, width)
    const actual = await measure(b, Object.fromEntries(Object.keys(figma).map((k) => [k, CONFIRM_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width, height: h })
    expect(`${name} (${width}, barra superpuesta) a ±1 px de Figma, y el alto de página`, { fuera: outside(actual, figma), alto: h }, { fuera: [], alto })
    if (name === '04.4') {
      const [f1, f2, f3] = [actual.fila1, actual.fila2, actual.fila3]
      const round = (n) => Math.round(n)
      expect('04.4: datos en fila a 32 (Figma: Details, gap space-6) y Dónde llega al borde del interior (935)', { huecos: [round(f2[0] - f1[0] - f1[2]), round(f3[0] - f2[0] - f2[2])], borde: round(f3[0] + f3[2]) }, { huecos: [32, 32], borde: 935 })
    }
    const avatar = figma.avatar
    expect(`${name}: foto de la Dra. Ruiz en «Who», 48 × 48 en su sitio, cargada, la de 96, decorativa`, await b.ev(photo(CONFIRM_PARTS.avatar)), {
      caja: avatar, cargada: true, candidata: 'elena-ruiz-arellano-96.webp', alt: '', oculto: true,
    })
  }
  await b.metrics(1280, 900)
}

// Umbral appointment-summary-wide (43.0625rem = 689): con los textos más
// anchos alcanzables (Cuándo «Miércoles 30 de mayo, 09:00» y el nombre de
// clínica «Consultorio Del Valle»), a 689 de raíz el nombre cabe en una línea
// y a 688 (el umbral a 43rem, con la raíz en 688) parte.
async function wideThreshold(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(1440, 900)
  await b.go(C1)
  const probe = (root) => `(() => {
    const summary = document.querySelector('.c-appointment-summary')
    summary.style.inlineSize = '${root}px'
    const dds = summary.querySelectorAll('.c-booking-details dd')
    dds[0].textContent = 'Miércoles 30 de mayo, 09:00'
    dds[2].textContent = 'Consultorio Del Valle'
    dds[3].textContent = 'Av. Álvaro Obregón 123, Roma Norte'
    const lines = (e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight))
    return { fila: getComputedStyle(summary.querySelector('.c-booking-details')).flexDirection, cuando: lines(dds[0]), clinica: lines(dds[2]), direccion: lines(dds[3]) }
  })()`
  const at689 = await b.ev(probe(689))
  await b.go(C1)
  await b.style('@container appointment-summary (min-width: 43rem) { .c-appointment-summary__details { --booking-details-direction: row; --booking-details-gap: var(--space-6); --booking-details-align: flex-start } .c-appointment-summary__card { --_card-padding-auto: var(--space-6); --_frame-card: 1 } .c-appointment-summary__body { --_frame-body: 0 } }')
  const at688 = await b.ev(probe(688))
  await b.unstyle()
  expect('appointment-summary-wide: a 689 de raíz, en fila y el nombre de clínica más largo en una línea (la dirección puede partir)', at689, { fila: 'row', cuando: 1, clinica: 1, direccion: 2 })
  expect('contraprueba: con el umbral a 43rem, a 688 en fila parte el nombre de la clínica', at688, { fila: 'row', cuando: 1, clinica: 2, direccion: 2 })
  const below = await (async () => {
    await b.go(C1)
    return b.ev(`(() => { const s = document.querySelector('.c-appointment-summary'); s.style.inlineSize = '688px'; return getComputedStyle(s.querySelector('.c-booking-details')).flexDirection })()`)
  })()
  expect('a 688 de raíz, sin tocar el umbral: datos en columna', below, 'column')
}

// Línea base de c-appointment-summary en 02.4 y 03.3, medida en c5a813a antes
// de tocar código (V4a). Cajas exactas, sin ±1.
const BASE_PARTS = {
  raiz: '.c-appointment-summary', tarjeta: '.c-appointment-summary__card', titulo: '.c-appointment-summary__title',
  quien: '.c-appointment-summary__who', avatar: '.c-appointment-summary .c-avatar', info: '.c-appointment-summary__info',
  identidad: '.c-appointment-summary__identity', nombre: '.c-appointment-summary__name', especialidad: '.c-appointment-summary__specialty',
  modalidad: '.c-appointment-summary .c-tag', dl: '.c-booking-details',
  fila1: '.c-booking-details > div:nth-child(1)', fila2: '.c-booking-details > div:nth-child(2)', fila3: '.c-booking-details > div:nth-child(3)',
  dd1: '.c-booking-details > div:nth-child(1) dd', dd3b: '.c-booking-details > div:nth-child(3) dd:last-child',
  siguiente: '.c-appointment-summary + *', padre: ':has(> .c-appointment-summary)',
}
const BASELINE = {
  '02.4@375': { raiz: [16, 252, 343, 344], tarjeta: [16, 252, 343, 344], titulo: null, quien: [41, 277, 293, 102], avatar: [41, 277, 48, 48], info: [105, 277, 229, 86], identidad: [105, 277, 229, 48], nombre: [105, 277, 229, 24], especialidad: [105, 301, 229, 24], modalidad: [105, 333, 94.6, 30], dl: [41, 395, 293, 176], fila1: [41, 395, 293, 44], fila2: [41, 451, 293, 44], fila3: [41, 507, 293, 64], dd1: [73, 415, 261, 24], dd3b: [73, 551, 261, 20], siguiente: [16, 612, 343, 50], padre: [16, 252, 343, 410], padding: '24px', alto: 986 },
  '02.4@320x200': { raiz: [32, 800, 256, 1364], tarjeta: [32, 800, 256, 1364], titulo: null, quien: [65, 833, 190, 426], avatar: [65, 833, 96, 96], info: [65, 961, 190, 266], identidad: [65, 961, 190, 192], nombre: [65, 961, 190, 144], especialidad: [65, 1105, 190, 48], modalidad: [65, 1169, 187.2, 58], dl: [65, 1291, 190, 840], fila1: [65, 1291, 190, 232], fila2: [65, 1547, 190, 136], fila3: [65, 1707, 190, 424], dd1: [129, 1331, 126, 192], dd3b: [129, 1891, 126, 240], siguiente: [32, 2196, 256, 194], padre: [32, 800, 256, 1590], padding: '32px', alto: 3674 },
  '02.4@1440': { raiz: [120, 274, 608, 344], tarjeta: [120, 274, 608, 344], titulo: null, quien: [145, 299, 558, 102], avatar: [145, 299, 48, 48], info: [209, 299, 494, 86], identidad: [209, 299, 494, 48], nombre: [209, 299, 494, 24], especialidad: [209, 323, 494, 24], modalidad: [209, 355, 94.6, 30], dl: [145, 417, 558, 176], fila1: [145, 417, 558, 44], fila2: [145, 473, 558, 44], fila3: [145, 529, 558, 64], dd1: [177, 437, 526, 24], dd3b: [177, 573, 526, 20], siguiente: [120, 634, 215.5, 50], padre: [120, 274, 608, 410], padding: '24px', alto: 984 },
  '03.3@1440': { raiz: [1000, 274, 320, 372], tarjeta: [1000, 274, 320, 372], titulo: [1017, 291, 286, 28], quien: [1017, 335, 286, 102], avatar: [1017, 335, 48, 48], info: [1081, 335, 222, 86], identidad: [1081, 335, 222, 48], nombre: [1081, 335, 222, 24], especialidad: [1081, 359, 222, 24], modalidad: [1081, 391, 94.6, 30], dl: [1017, 453, 286, 176], fila1: [1017, 453, 286, 44], fila2: [1017, 509, 286, 44], fila3: [1017, 565, 286, 64], dd1: [1049, 473, 254, 24], dd3b: [1049, 609, 254, 20], siguiente: [1000, 662, 320, 158], padre: [1000, 234, 320, 680], padding: '16px', alto: 962 },
}

async function summaryRegression(b, expect) {
  const out = {}
  for (const [name, url, width, big] of [['02.4@375', CONFIRM_024, 375, false], ['02.4@320x200', CONFIRM_024, 320, true], ['02.4@1440', CONFIRM_024, 1440, false], ['03.3@1440', DATOS_033, 1440, false]]) {
    await b.overlayScrollbars(true)
    await b.metrics(width, 900)
    await b.go(url)
    if (big) await b.style('html { font-size: 200% }')
    const boxes = await measure(b, BASE_PARTS)
    boxes.padding = await b.ev(`getComputedStyle(document.querySelector('.c-appointment-summary__card')).padding`)
    boxes.alto = await b.ev('document.documentElement.scrollHeight')
    await b.unstyle()
    out[name] = Object.entries(BASELINE[name]).filter(([k, v]) => JSON.stringify(boxes[k]) !== JSON.stringify(v)).map(([k]) => `${k}: ${JSON.stringify(boxes[k])}`)
  }
  expect('regresión exacta de c-appointment-summary en 02.4 (375, 320 al 200 %, 1440) y 03.3 frente a la línea base (c5a813a)', out, { '02.4@375': [], '02.4@320x200': [], '02.4@1440': [], '03.3@1440': [] })
  await b.metrics(1280, 900)
}

// Anchos: sin desborde y el mismo eje en el tramo; desde lg, la fila de datos
// según appointment-summary-wide (689 de raíz): columna hasta 1088 de
// viewport (1103 con barra clásica), fila desde 1089 (1104).
async function confirmWidths(b, expect) {
  const mobile = `(() => { const x = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().x) : null }; const w = (s) => Math.round(document.querySelector(s).getBoundingClientRect().width); return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: x('main h1'), marco: x('.c-appointment-summary__body'), calendario: w('.c-appointment-summary__action'), boton: x('.c-action-bar .c-button'), anchoBoton: w('.c-action-bar .c-button') } })()`
  const out = {}
  for (const [w, overlay] of [[320, true], [320, false], [360, true], [800, true], [1023, false]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(C1)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(mobile)
  }
  expect('04.1 en anchos intermedios: sin desborde; h1, resumen y «Ver mis citas» en el mismo eje (la barra reutiliza o-wrapper); «Agregar…» a ancho completo', out, {
    '320 sup': { desborde: 0, h1: 16, marco: 16, calendario: 288, boton: 16, anchoBoton: 288 },
    '320 clás': { desborde: 0, h1: 16, marco: 16, calendario: 273, boton: 16, anchoBoton: 273 },
    '360 sup': { desborde: 0, h1: 16, marco: 16, calendario: 328, boton: 16, anchoBoton: 328 },
    '800 sup': { desborde: 0, h1: 96, marco: 96, calendario: 608, boton: 96, anchoBoton: 608 },
    '1023 clás': { desborde: 0, h1: 200, marco: 200, calendario: 608, boton: 200, anchoBoton: 608 },
  })
  const desktop = `(() => { const s = document.querySelector('.c-appointment-summary'); const card = getComputedStyle(document.querySelector('.c-appointment-summary__card')); return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, barra: Boolean(document.querySelector('.c-app-layout__bar')), raiz: Math.round(s.getBoundingClientRect().width), datos: getComputedStyle(s.querySelector('.c-booking-details')).flexDirection, padding: card.paddingLeft, borde: card.borderTopWidth, calendario: Math.round(s.querySelector('.c-appointment-summary__action').getBoundingClientRect().width) } })()`
  const wide = {}
  // Con barra clásica, un viewport de 600 de alto: la página desplaza y la
  // barra existe (a 900 cabe entera y no la hay).
  for (const [w, overlay] of [[1024, true], [1088, true], [1089, true], [1103, false], [1104, false], [1440, true]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, overlay ? 900 : 600)
    await b.go(C1)
    wide[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(desktop)
    if (overlay && w !== 1440) await b.shot(`04.4-${w}.png`, { x: 0, y: 0, width: w, height: 900 })
  }
  // Por debajo del umbral, el marco lo lleva __body y __card va sin borde ni
  // padding; «Agregar…» llena la columna. Desde él, al revés, y la acción
  // mide su texto (234).
  const column = (raiz) => ({ desborde: 0, barra: false, raiz, datos: 'column', padding: '0px', borde: '0px', calendario: raiz })
  const row = (raiz) => ({ desborde: 0, barra: false, raiz, datos: 'row', padding: '32px', borde: '1px', calendario: 234 })
  expect('04.4 desde lg: datos en columna, con el marco en __body y la acción a ancho completo, hasta 1088 (1103 con barra clásica); en fila, con el marco en __card y la acción intrínseca, desde 1089 (1104)', wide, {
    '1024 sup': column(624), '1088 sup': column(688), '1089 sup': row(689), '1103 clás': column(688), '1104 clás': row(689), '1440 sup': row(848),
  })
  await b.metrics(1280, 900)
}

// 200 % a 320 con las dos barras y la letra del navegador a 24 y 32 (320) y a
// 20 (375): solo parten palabras más anchas que su interior.
const TEXT_041 = '.c-step__label, .c-page-header__title, .c-page-header__subtitle, .c-appointment-summary__name, .c-appointment-summary__specialty, .c-tag, .c-booking-details__term span, .c-booking-details__value, .c-booking-details__address, .c-appointment-summary__action, .c-notice__text > *, .c-action-bar .c-button'

async function confirmZoom(b, expect) {
  const out = {}
  for (const overlay of [true, false]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900)
    await b.go(C1)
    const html = await b.run(text200)
    await settle(300)
    const words = await b.run(splitWords, TEXT_041)
    out[overlay ? 'sup' : 'clás'] = { html, desborde: await b.run(overflow), padding: await b.ev(`getComputedStyle(document.querySelector('.c-appointment-summary__body')).paddingLeft`), parten: words.split.sort(), pudiendoCaber: words.couldFit.sort() }
  }
  // Parten el h1 («reservada»), el correo de la nota, «calendario» (interior
  // del botón 158 / 143) y el final del aviso; con barra clásica, además, los
  // datos (columna de 111, como en 02.4) y el aviso. «enviaremos» sale como
  // «pudiendo caber» con barra clásica: mide 175,08 en un párrafo de 175, el
  // margen de +0,5 del detector (docs/verificacion.md, Trampas).
  expect('04.1 al 200 % a 320: sin desborde, marco compacto (space-4) y solo parten palabras más anchas que su interior («enviaremos», 175,08 en 175, por el margen del detector)', out, {
    sup: { html: '32px', desborde: 0, padding: '32px', parten: ['calendario', 'identificación.', 'karla.sanchez@ejemplo.com', 'reservada'], pudiendoCaber: [] },
    clás: { html: '32px', desborde: 0, padding: '32px', parten: ['Duración', 'Obregón', 'Presencial', 'calendario', 'enviaremos', 'identificación.', 'karla.sanchez@ejemplo.com', 'minutos', 'recordatorio', 'reprogramar', 'reservada'], pudiendoCaber: ['enviaremos'] },
  })
  const large = {}
  for (const [w, px] of [[320, 24], [320, 32], [375, 20]]) {
    await b.overlayScrollbars(false)
    await b.metrics(w, 800)
    await font(b, px)
    await b.go(C1)
    const page = await b.ev(`({ html: getComputedStyle(document.documentElement).fontSize, barra: getComputedStyle(document.querySelector('.c-app-layout__bar')).position, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, barraAlFinal: Math.round(document.querySelector('.c-app-layout__bar').getBoundingClientRect().bottom + scrollY) === document.documentElement.scrollHeight })`)
    large[`${w} letra ${px}`] = { ...page, pudiendoCaber: (await b.run(splitWords, TEXT_041)).couldFit }
  }
  await font(b, 16)
  expect('04.1 con la letra del navegador a 24 y 32 (320) y a 20 (375): Action Bar estática al final del flujo, sin desborde ni palabras partidas pudiendo caber', large, {
    '320 letra 24': { html: '24px', barra: 'static', desborde: 0, barraAlFinal: true, pudiendoCaber: [] },
    '320 letra 32': { html: '32px', barra: 'static', desborde: 0, barraAlFinal: true, pudiendoCaber: ['enviaremos'] },
    '375 letra 20': { html: '20px', barra: 'static', desborde: 0, barraAlFinal: true, pudiendoCaber: [] },
  })
  await b.metrics(1280, 900)
}

async function confirmForced(b, expect) {
  const border = (s, side = 'Top') => `(() => { const e = document.querySelector(${JSON.stringify(s)}); if (!e) return null; const c = getComputedStyle(e); return c.border${side}Style + ' ' + c.border${side}Width + ' ' + (c.border${side}Color === 'rgba(0, 0, 0, 0)' ? 'transparente' : 'visible') })()`
  const badge = `(() => { const svg = getComputedStyle(document.querySelector('.c-page-header__badge svg')); return { comoElTexto: svg.color === getComputedStyle(document.querySelector('main h1')).color, sobreElFondo: svg.color !== getComputedStyle(document.body).backgroundColor } })()`
  await b.overlayScrollbars(true)
  await b.forcedColors(true)
  const out = {}
  for (const w of [375, 1440]) {
    await b.metrics(w, 900)
    await b.go(C1)
    out[w] = {
      marco: await b.ev(border(w === 375 ? '.c-appointment-summary__body' : '.c-appointment-summary__card')),
      quien: await b.ev(border('.c-appointment-summary__who', 'Bottom')),
      calendario: await b.ev(border('.c-appointment-summary__action')),
      aviso: await b.ev(border('main .c-notice')),
      insignia: await b.ev(badge),
    }
    await b.shot(`forced-04.${w === 375 ? 1 : 4}.png`, { x: 0, y: 0, width: w, height: 900 })
  }
  await b.forcedColors(false)
  const expected = { marco: 'solid 1px visible', quien: 'solid 1px visible', calendario: 'solid 1px visible', aviso: 'solid 1px visible', insignia: { comoElTexto: true, sobreElFondo: true } }
  expect('04.1 y 04.4 en forced-colors: el marco (en __body o en __card), el separador, «Agregar…» y el aviso conservan su contorno; el check de la insignia va en el color del texto', out, { 375: expected, 1440: expected })
  await b.metrics(1280, 900)
}

const STRUCTURE = `({
  titulo: document.title,
  encabezados: [...document.querySelectorAll('h1, h2, h3, h4')].map((h) => h.tagName + ' ' + h.textContent.trim()),
  retroceso: Boolean(document.querySelector('.c-back-link, .c-breadcrumb')),
  barraInferior: Boolean(document.querySelector('.c-bottom-nav')),
  pasos: [...document.querySelectorAll('ol[aria-label="Pasos de la reserva"] li')].map((l) => (l.getAttribute('aria-current') ?? '-') + ' ' + l.querySelector('.c-step__label').textContent).join(' | '),
  insignia: document.querySelector('.c-page-header__badge').getAttribute('aria-hidden'),
  aviso: (() => { const n = document.querySelector('main .c-notice'); return { titulo: n.querySelector('.c-notice__title').tagName, role: n.getAttribute('role'), cuerpo: n.querySelector('.c-notice__text p').textContent } })(),
  calendario: (() => { const a = document.querySelector('.c-appointment-summary__action'); return { tag: a.tagName, nombre: a.textContent, descarga: a.getAttribute('download'), tipo: a.getAttribute('href').startsWith('data:text/calendar;charset=utf-8,BEGIN%3AVCALENDAR') } })(),
  verCitas: (() => { const a = [...document.querySelectorAll('a')].find((e) => e.textContent === 'Ver mis citas'); return a.getAttribute('href') + ' · en main: ' + Boolean(a.closest('main')) })(),
})`

async function confirmStructure(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(C1)
  const mobile = await b.ev(STRUCTURE)
  await b.metrics(1440, 900)
  await b.go(`${C1}?q=Cardiolog%C3%ADa&escenario=ocupada`)
  const desktop = {
    ...(await b.ev(STRUCTURE)),
    migas: await b.ev(`[...document.querySelectorAll('.c-breadcrumb li')].map((l) => { const a = l.querySelector('a'); return l.textContent.replace('/', '').trim() + (a ? ' → ' + a.getAttribute('href') : '') })`),
  }
  const common = {
    titulo: 'Cita reservada · Salvia',
    encabezados: ['H1 Tu cita está reservada', 'H2 Qué sigue'],
    pasos: '- Fecha y hora, completado | - Tus datos, completado | step Listo',
    insignia: 'true',
    aviso: { titulo: 'H2', role: null, cuerpo: 'Te enviaremos un recordatorio por correo 24 horas antes. Hasta entonces, puedes cancelar o reprogramar sin costo desde Mis citas. Llega 10 minutos antes con una identificación.' },
    calendario: { tag: 'A', nombre: 'Agregar a mi calendario (archivo .ics)', descarga: 'cita-salvia-2029-04-24.ics', tipo: true },
  }
  // La comparación es por JSON: mismas claves en el mismo orden.
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [c]) => a.localeCompare(c)))
  expect('04.1 y 04.4: título (D15), h1 y h2 «Qué sigue» (Info sin role), pasos con «Listo» actual, insignia decorativa, «Agregar…» enlace de descarga con el sufijo oculto; sin retroceso ni barra inferior en móvil; breadcrumb de tres niveles con la consulta de V1 y el médico sin fecha ni hora', { mobile: sorted(mobile), desktop: sorted(desktop) }, {
    mobile: sorted({ ...common, retroceso: false, barraInferior: false, verCitas: '/mis-citas · en main: false' }),
    desktop: sorted({ ...common, retroceso: true, barraInferior: false, verCitas: '/mis-citas · en main: true', migas: ['Especialistas → /?q=Cardiolog%C3%ADa&escenario=ocupada', `Dra. Ruiz → ${RUIZ}?q=Cardiolog%C3%ADa&escenario=ocupada`, 'Cita reservada'] }),
  })

  const order = async () => {
    const seen = []
    await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
    for (let i = 0; i < 12; i++) {
      await b.tab()
      const f = await b.ev(focused)
      seen.push(f)
      if (f === 'BODY') break
    }
    return seen
  }
  await b.go(C1)
  const tab1440 = await order()
  await b.metrics(375, 900)
  await b.go(C1)
  const tab375 = await order()
  expect('orden de Tab en 04.1 (la barra va tras main) y 04.4', { 375: tab375, 1440: tab1440 }, {
    375: ['A Saltar al contenido', 'A Salvia', 'A Ayuda', 'A Agregar a mi calendario (archivo .ics)', 'A Ver mis citas', 'BODY'],
    1440: ['A Saltar al contenido', 'A Salvia', 'A Especialistas', 'A Mis citas', 'A Ayuda', 'BUTTON Karla Sánchez', 'A Especialistas', 'A Dra. Ruiz', 'A Agregar a mi calendario (archivo .ics)', 'A Ver mis citas', 'BODY'],
  })
  await b.metrics(1280, 900)
}

// Descarga real del .ics (Browser.setDownloadBehavior) y su contenido.
async function calendarDownload(b, expect) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'salvia-ics-'))
  await b.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: dir })
  await b.metrics(375, 900)
  await b.go(C1)
  await clickSel(b, '.c-appointment-summary__action')
  let file = null
  for (let i = 0; i < 30 && !file; i++) {
    await sleep(100)
    file = fs.readdirSync(dir).find((f) => f.endsWith('.ics')) ?? null
  }
  const text = file ? fs.readFileSync(path.join(dir, file), 'utf8') : ''
  fs.rmSync(dir, { recursive: true, force: true })
  await b.send('Browser.setDownloadBehavior', { behavior: 'default' })
  const lines = text.split('\r\n')
  expect('descarga de «Agregar a mi calendario»: cita-salvia-2029-04-24.ics con el evento de c1 en UTC (16:30Z–17:00Z) y CRLF; la página no navega', {
    archivo: file, dtstart: lines.find((l) => l.startsWith('DTSTART')), dtend: lines.find((l) => l.startsWith('DTEND')), resumen: lines.find((l) => l.startsWith('SUMMARY')), crlf: text.endsWith('\r\n') && !/[^\r]\n/.test(text), ruta: await b.ev('location.pathname'),
  }, { archivo: 'cita-salvia-2029-04-24.ics', dtstart: 'DTSTART:20290424T163000Z', dtend: 'DTEND:20290424T170000Z', resumen: 'SUMMARY:Cita con Dra. Elena Ruiz Arellano', crlf: true, ruta: C1 })
  await b.metrics(1280, 900)
}

// Reserva real en la vista 3 (→ 04.1 con replace): el correo y el
// recordatorio salen de la cita (C2), y «Qué sigue» depende de los dos y del
// plazo contra NOW (C1). Foco en el h1 al llegar.
const typeInto = async (b, id, text) => {
  await b.ev(`document.getElementById(${JSON.stringify(id)}).focus(), true`)
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
  await b.send('Input.insertText', { text })
  await settle()
}
const book = async (b, url, { email, reminder }) => {
  await b.go(url)
  if (email) await typeInto(b, 'correo', email)
  await b.ev(MOTIVO)
  await clickSel(b, '.c-checkbox__row:has(#privacidad)')
  if (reminder) await clickSel(b, '.c-checkbox__row:has(#recordatorio)')
  const i0 = await b.ev(idx)
  await clickSel(b, '.c-action-bar .c-button')
  await settle(300)
  return {
    ruta: await b.ev('location.pathname'),
    replace: (await b.ev(idx)) === i0,
    foco: await b.ev(focused),
    nota: await b.ev(`document.querySelector('.c-page-header__subtitle').textContent`),
    queSigue: await b.ev(`document.querySelector('main .c-notice__text p').textContent.split('.')[0]`),
  }
}

async function bookingContact(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  const out = {
    otroCorreoSinRecordatorio: await book(b, `${RUIZ}/datos?fecha=2029-04-24&hora=10:30`, { email: 'karla@otro.mx', reminder: false }),
    conRecordatorio: await book(b, `${RUIZ}/datos?fecha=2029-04-24&hora=10:30`, { reminder: true }),
    marianaHoy: await book(b, '/especialistas/mariana-cifuentes-poza/datos?fecha=2029-04-23&hora=19:15', { reminder: true }),
  }
  expect('reserva real → 04.1 (replace, foco en el h1): la nota nombra el correo de la reserva; sin recordatorio, «Qué sigue» no lo promete; a menos de 24 h (Mariana, hoy 19:15), no promete nada', out, {
    otroCorreoSinRecordatorio: { ruta: C1, replace: true, foco: 'H1 #contenido', nota: 'Enviamos la confirmación a karla@otro.mx', queSigue: 'Puedes cancelar o reprogramar sin costo desde Mis citas hasta 24 horas antes' },
    conRecordatorio: { ruta: C1, replace: true, foco: 'H1 #contenido', nota: 'Enviamos la confirmación a karla.sanchez@ejemplo.com', queSigue: 'Te enviaremos un recordatorio por correo 24 horas antes' },
    marianaHoy: { ruta: '/citas/c6/confirmada', replace: true, foco: 'H1 #contenido', nota: 'Enviamos la confirmación a karla.sanchez@ejemplo.com', queSigue: 'Puedes gestionar tu cita desde Mis citas' },
  })
  await b.metrics(1280, 900)
}

// Cruce de lg (también contra la preview): «Agregar…» no cambia de control ni
// se vuelve a montar (container query) y conserva el foco; «Ver mis citas» de
// la barra y el breadcrumb dejan de existir → h1; sin el respaldo, body
// (contraprueba).
async function confirmFocus(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  await b.metrics(375, 900)
  await b.go(C1)
  await b.ev(`(window.__calendario = document.querySelector('.c-appointment-summary__action')).focus(), true`)
  await b.metrics(1100, 900)
  await settle(400)
  out.calendarioSeQueda = { foco: await b.ev(focused), mismoNodo: await b.ev('document.activeElement === window.__calendario') }
  await b.metrics(375, 900)
  await b.go(C1)
  await b.ev(`document.querySelector('.c-action-bar .c-button').focus(), true`)
  await b.metrics(1100, 900)
  await settle(400)
  out.barraAEscritorio = await b.ev(focused)
  await b.ev(`document.querySelector('.c-breadcrumb a').focus(), true`)
  await b.metrics(375, 900)
  await settle(400)
  out.migasAMovil = await b.ev(focused)
  await b.go(C1)
  // El respaldo se anula en el prototipo para #contenido: sirve igual para un
  // h1 que se vuelva a montar (antes del cierre de la fase 5, al cruzar lg).
  await b.ev(`(() => { const f = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function (o) { if (this.id !== 'contenido') f.call(this, o) }; document.querySelector('.c-action-bar .c-button').focus(); return true })()`)
  await b.metrics(1100, 900)
  await settle(400)
  out.sinRespaldo = await b.ev(focused)
  expect('foco en la confirmación al cruzar lg: «Agregar…» conserva el foco y el nodo; «Ver mis citas» de la barra y el breadcrumb → h1; sin el respaldo, body (contraprueba)', out, {
    calendarioSeQueda: { foco: 'A Agregar a mi calendario (archivo .ics)', mismoNodo: true },
    barraAEscritorio: 'H1 #contenido',
    migasAMovil: 'H1 #contenido',
    sinRespaldo: 'BODY',
  })
  await b.metrics(1280, 900)
}

// Navegación en cliente 03.1 → 04.1 (envío real, 375, barra clásica): la
// confirmación en cliente frente a la recargada, al llegar y 4 s después.
async function confirmNavigation(b, expect) {
  await b.overlayScrollbars(false)
  await b.metrics(375, 900, 1)
  await b.go(`${RUIZ}/datos?fecha=2029-04-24&hora=10:30`)
  await b.ev(MOTIVO)
  await clickSel(b, '.c-checkbox__row:has(#privacidad)')
  await clickSel(b, '.c-checkbox__row:has(#recordatorio)')
  await clickSel(b, '.c-action-bar .c-button')
  await b.ev('document.fonts.ready.then(() => true)')
  await sleep(400)
  await toBottom(b)
  await b.mouse('mouseMoved', 1, 1)
  await sleep(100)
  const arrival = await b.ev(`({ ruta: location.pathname, sinRecarga: performance.getEntriesByType('navigation')[0].name.includes('/datos') })`)
  const afterClient = await viewport(b)
  await sleep(4000)
  const later = await viewport(b)
  await b.go(C1)
  await toBottom(b)
  await b.mouse('mouseMoved', 1, 1)
  await sleep(100)
  const afterReload = await viewport(b)
  const nav = { ...arrival, estado: null, pixelesDistintosDeLaRecarga: await b.ev(pixelDiff(afterClient, afterReload)), delta: await b.ev(pixelDelta(afterClient, afterReload)), deltaCuatroSegundos: await b.ev(pixelDelta(later, afterReload)) }
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-confirmada-cliente-375.png', afterClient)
    await b.saveBase64('navegacion-confirmada-recarga-375.png', afterReload)
  }
  expect(
    `navegación en cliente 03.1 → 04.1 (envío real, 375, barra clásica): sin resto de pintado, ningún píxel con delta > 64 al llegar ni 4 s después (${resampleNote(nav)})`,
    viewRest(nav),
    { ruta: C1, sinRecarga: true, estado: null, sobre64: 0, cuatroSegundosSobre64: 0 },
  )
  await b.metrics(1280, 900, 1)
}

// Los pasos solo existen en móvil, pero __heading existe siempre: el h1 es el
// mismo nodo al cruzar lg y el foco no pasa por body (cierre de la fase 5).
async function h1Cross(b, expect) {
  await b.overlayScrollbars(true)
  expect('foco en el h1 de la confirmación al cruzar lg (llegada por useRouteFocus, los dos sentidos): el mismo h1, sin ningún lote de mutaciones en body', await h1AcrossLg(b, C1), H1_ACROSS_LG)
}

// --- Mis citas (04.2, 04.5, 04.7, 04.8, 04.9) --------------------------------------------------------

const LIST = '/mis-citas'
const section = (n) => `.c-my-appointments__section:nth-of-type(${n})`
const cardAt = (n, k) => `${section(n)} > ul > li:nth-child(${k})`
const LIST_PARTS = {
  header: '.c-header-mobile, .c-header-desktop',
  h1: 'main h1',
  subtitulo: '.c-page-header__subtitle',
  aviso: 'main .c-notice--success',
  titulo1: `${section(1)} > h2`,
  titulo2: `${section(2)} > h2`,
  s1c1: cardAt(1, 1), s1c2: cardAt(1, 2), s1c3: cardAt(1, 3),
  s2c1: cardAt(2, 1), s2c2: cardAt(2, 2), s2c3: cardAt(2, 3),
  aside: '.c-my-appointments__aside',
  asideTexto: '.c-my-appointments__aside-text',
  asideTitulo: '.c-my-appointments__aside-title',
  asideCuerpo: '.c-my-appointments__aside-body',
  asideBoton: '.c-my-appointments__aside .c-button',
  main: 'main',
  barra: '.c-bottom-nav',
}
// Figma 04.2, 04.8 (375) y 04.5, 04.9 (1440), en coordenadas del frame. Las
// tarjetas son los li (UI/Appointment Card). El botón del aside va en HUG.
const mobileHead = { header: [0, 0, 375, 64], h1: [16, 88, 343, 36], subtitulo: [16, 132, 343, 24] }
const desktopHead = { header: [0, 0, 1440, 82], h1: [120, 114, 1200, 44], subtitulo: [120, 166, 1200, 24] }
const asideBox = { aside: [1000, 222, 320, 208], asideTexto: [1025, 247, 270, 84], asideTitulo: [1025, 247, 270, 28], asideCuerpo: [1025, 283, 270, 48], asideBoton: [1025, 355, null, 50] }
const noAside = { aside: null, asideTexto: null, asideTitulo: null, asideCuerpo: null, asideBoton: null }
const FIGMA_LIST = {
  '04.2': {
    ancho: 375, alto: 1942, cancelar: false,
    cajas: {
      ...mobileHead, aviso: null, titulo1: [16, 188, 343, 32], s1c1: [16, 236, 343, 324], s1c2: [16, 576, 343, 310], s1c3: [16, 902, 343, 324],
      titulo2: [16, 1258, 343, 32], s2c1: [16, 1306, 343, 262], s2c2: [16, 1584, 343, 262], s2c3: null, ...noAside, main: [0, 64, 375, 1814], barra: [0, 1878, 375, 64],
    },
  },
  '04.8': {
    ancho: 375, alto: 2060, cancelar: true,
    cajas: {
      ...mobileHead, aviso: [16, 188, 343, 134], titulo1: [16, 354, 343, 32], s1c1: [16, 402, 343, 324], s1c2: [16, 742, 343, 324], s1c3: null,
      titulo2: [16, 1098, 343, 32], s2c1: [16, 1146, 343, 262], s2c2: [16, 1424, 343, 262], s2c3: [16, 1702, 343, 262], ...noAside, main: [0, 64, 375, 1932], barra: [0, 1996, 375, 64],
    },
  },
  '04.5': {
    ancho: 1440, alto: 1534, cancelar: false,
    cajas: {
      ...desktopHead, aviso: null, titulo1: [120, 222, 848, 32], s1c1: [120, 270, 848, 212], s1c2: [120, 498, 848, 240], s1c3: [120, 754, 848, 212],
      titulo2: [120, 998, 848, 32], s2c1: [120, 1046, 848, 212], s2c2: [120, 1274, 848, 212], s2c3: null, ...asideBox, main: [0, 82, 1440, 1452], barra: null,
    },
  },
  '04.9': {
    ancho: 1440, alto: 1624, cancelar: true,
    cajas: {
      ...desktopHead, aviso: [120, 222, 848, 86], titulo1: [120, 340, 848, 32], s1c1: [120, 388, 848, 212], s1c2: [120, 616, 848, 212], s1c3: null,
      titulo2: [120, 860, 848, 32], s2c1: [120, 908, 848, 212], s2c2: [120, 1136, 848, 212], s2c3: [120, 1364, 848, 212], ...asideBox, main: [0, 82, 1440, 1542], barra: null,
    },
  },
}

// Cancela la cita de la tarjeta `k` de Próximas: abre el diálogo con un clic
// real y confirma con otro.
const cancelAt = async (b, k) => {
  await clickSel(b, `${cardAt(1, k)} button`)
  await clickSel(b, '.c-dialog .c-button--destructive')
  await settle(300)
}

async function listPairs(b, expect) {
  await b.overlayScrollbars(true)
  const fotos = {}
  for (const [name, { ancho, alto, cancelar, cajas }] of Object.entries(FIGMA_LIST)) {
    await b.metrics(ancho, 900)
    await b.go(LIST)
    if (cancelar) await cancelAt(b, 2)
    // Puntero a la esquina: tras el clic de confirmar se queda sobre otra
    // tarjeta y la captura saldría con un botón en :hover (Trampas, hover residual).
    await b.mouse('mouseMoved', 1, 1)
    await b.ev('window.scrollTo(0, 0), document.activeElement?.blur(), true')
    const h = await fitPage(b, ancho)
    const actual = await measure(b, Object.fromEntries(Object.keys(cajas).map((k) => [k, LIST_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width: ancho, height: h })
    expect(`${name} (${ancho}, barra superpuesta) a ±1 px de Figma, y el alto de página`, { fuera: outside(actual, cajas), alto: h }, { fuera: [], alto })
    fotos[name] = await b.ev(photo(`${cardAt(1, 1)} .c-avatar`))
  }
  // Figma, dentro de la tarjeta: Stacked, Avatar en 17,99 (284:6372, 339:8557);
  // Row, padding 24 + borde 1 y Details bajo la cabecera de 66 a 16: 25,107
  // (284:6933, 339:8749). Con las tarjetas de los pares: 04.2 16,236 → 33,335;
  // 04.8 16,402 → 33,501; 04.5 120,270 → 145,377; 04.9 120,388 → 145,495.
  const ruiz = (caja) => ({ caja, cargada: true, candidata: 'elena-ruiz-arellano-96.webp', alt: '', oculto: true })
  expect('foto de la Dra. Ruiz en su tarjeta (04.2, 04.5, 04.8, 04.9) en la caja de Figma: 48 × 48, cargada, la de 96, decorativa', fotos, {
    '04.2': ruiz([33, 335, 48, 48]), '04.8': ruiz([33, 501, 48, 48]), '04.5': ruiz([145, 377, 48, 48]), '04.9': ruiz([145, 495, 48, 48]),
  })
  await b.metrics(1280, 900)
}

// 04.7: el menú de cuenta abierto sobre Mis citas (panel 240 × 114 en 1080,70).
async function accountMenu(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(1440, 900)
  await b.go(LIST)
  await clickSel(b, '.c-header-desktop__account .c-button')
  // Se lee antes de la captura: captureBeyondViewport saca el foco del grupo
  // y el disclosure se cierra (salir del grupo lo cierra, 4.4).
  const panel = await b.ev(rect('.c-header-desktop__menu'))
  const expandido = await b.ev(`document.querySelector('.c-header-desktop__account .c-button').getAttribute('aria-expanded')`)
  await b.send('Page.captureScreenshot', { format: 'png' }).then(({ data }) => b.saveBase64('04.7.png', data))
  expect('04.7 (1440): menú de cuenta abierto, panel a ±1 px de Figma (1080,70 240 × 114), botón expandido', { fuera: outside({ panel }, { panel: [1080, 70, 240, 114] }), expandido }, { fuera: [], expandido: 'true' })
  await b.metrics(1280, 900)
}

// 04.3 y 04.6 en la vista: el diálogo sobre Mis citas, foco inicial en
// «Mantener mi cita»; Escape vuelve al disparador sin tocar la lista.
async function dialogInView(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  for (const [name, w, h] of [['04.3', 375, 812], ['04.6', 1440, 900]]) {
    await b.metrics(w, h)
    await b.go(LIST)
    await clickSel(b, `${cardAt(1, 2)} button`)
    await b.shot(`${name}.png`, { x: 0, y: 0, width: w, height: h })
    const panel = await b.ev(`(() => { const r = document.querySelector('.c-dialog__panel').getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(',') })()`)
    const foco = await b.ev(focused)
    const cuerpo = await b.ev(`document.querySelector('.c-dialog p').textContent`)
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await settle()
    out[name] = { panel, foco, cuerpo, trasEscape: await b.ev(focused), proximas: await b.ev(`document.querySelectorAll('${section(1)} > ul > li').length`) }
  }
  const body = 'Martes 8 de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer.'
  expect('04.3 y 04.6 en la vista: panel como en Figma (343 × 296 en 16,258; 480 × 210 en 480,345), foco en «Mantener mi cita», copy de cancelCopy; Escape vuelve al disparador y la lista no cambia', out, {
    '04.3': { panel: '16,258,343,296', foco: 'BUTTON Mantener mi cita', cuerpo: body, trasEscape: 'BUTTON Cancelar cita', proximas: 3 },
    '04.6': { panel: '480,345,480,210', foco: 'BUTTON Mantener mi cita', cuerpo: body, trasEscape: 'BUTTON Cancelar cita', proximas: 3 },
  })
  await b.metrics(1280, 900)
}

// Sonda de cancelar (dev y preview): un MutationObserver apunta, al final de
// cada lote de mutaciones, si la tarjeta de Molina está en Pasadas, si existe
// el aviso y dónde está el foco; una muestra por requestAnimationFrame hace lo
// mismo antes de cada pintado. Ningún lote ni frame puede tener la tarjeta en
// Pasadas sin el aviso, ni al revés, y el foco llega al título del aviso en el
// mismo commit.
const CANCEL_PROBE = `(() => {
  const state = () => {
    const past = [...document.querySelectorAll('${section(2)} > ul > li h3')].some((h) => h.textContent.includes('8 de mayo'))
    const notice = Boolean(document.querySelector('main .c-notice--success'))
    const a = document.activeElement
    const focus = !a || a === document.body ? 'BODY' : a.tagName + (a.classList.contains('c-notice__title') ? ' título del aviso' : ' ' + a.textContent.trim().slice(0, 20))
    return { past, notice, focus }
  }
  window.__batches = []
  window.__frames = []
  new MutationObserver(() => window.__batches.push(state())).observe(document.body, { childList: true, subtree: true, attributes: true })
  const tick = () => { window.__frames.push(state()); if (window.__frames.length < 120) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  return true
})()`
const CANCEL_READ = `(() => {
  const mixed = (list) => list.filter((s) => s.past !== s.notice).length
  const firstBoth = window.__batches.find((s) => s.past && s.notice)
  return {
    lotesMezclados: mixed(window.__batches),
    framesMezclados: mixed(window.__frames),
    focoAlAparecer: firstBoth?.focus ?? null,
    focoFinal: window.__batches.at(-1)?.focus ?? null,
    focoAlLeer: (() => { const a = document.activeElement; return !a || a === document.body ? 'BODY' : a.tagName + (a.classList.contains('c-notice__title') ? ' título del aviso' : ' ' + a.textContent.trim().slice(0, 20)) })(),
    frames: window.__frames.length > 0,
  }
})()`

async function cancelProbe(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  for (const w of [375, 1440]) {
    await b.metrics(w, 900)
    await b.go(LIST)
    await clickSel(b, `${cardAt(1, 2)} button`)
    await b.ev(CANCEL_PROBE)
    await clickSel(b, '.c-dialog .c-button--destructive')
    await sleep(2200)
    out[w] = await b.ev(CANCEL_READ)
  }
  const expected = { lotesMezclados: 0, framesMezclados: 0, focoAlAparecer: 'H2 título del aviso', focoFinal: 'H2 título del aviso', focoAlLeer: 'H2 título del aviso', frames: true }
  expect('sonda de cancelar (MutationObserver y requestAnimationFrame): la tarjeta pasa a Pasadas y el aviso aparece en el mismo commit, sin ningún lote ni frame intermedio; el foco llega al título del aviso en ese commit', out, { 375: expected, 1440: expected })
  await b.metrics(1280, 900)
}

// Cancelar: el orden de 04.8, el subtítulo, el aviso sin role y su cierre (foco
// al h1); y las tres próximas canceladas: «No tienes citas próximas» y sin
// sección Próximas (sin h2 vacío).
async function cancelFlow(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(LIST)
  await cancelAt(b, 2)
  const once = await b.ev(`({
    subtitulo: document.querySelector('.c-page-header__subtitle').textContent,
    proximas: [...document.querySelectorAll('${section(1)} h3')].map((h) => h.textContent),
    pasadas: [...document.querySelectorAll('${section(2)} h3')].map((h) => h.textContent),
    aviso: (() => { const n = document.querySelector('main .c-notice--success'); return { role: n.getAttribute('role'), titulo: n.querySelector('.c-notice__title').tagName, cuerpo: n.querySelector('.c-notice__text p').textContent } })(),
    foco: ${label},
  })`)
  await clickSel(b, 'main .c-notice--success .c-icon-button')
  const dismissed = { foco: await b.ev(focused), aviso: await b.ev(`Boolean(document.querySelector('main .c-notice--success'))`) }
  expect('cancelar a Molina: subtítulo a 2, Molina primera en Pasadas (descendente), aviso Success sin role con el copy de Figma y el foco en su título; al cerrarlo, foco en el h1', { once, dismissed }, {
    once: {
      subtitulo: 'Tienes 2 citas próximas',
      proximas: ['Martes 24 de abril · 10:30', 'Miércoles 16 de mayo · 09:30'],
      pasadas: ['Martes 8 de mayo · 17:00', 'Lunes 12 de marzo · 09:00', 'Jueves 22 de febrero · 12:30'],
      aviso: { role: null, titulo: 'H2', cuerpo: 'Ya no tienes la cita del martes 8 de mayo a las 17:00 con el Dr. Molina.' },
      // Desde V4b el título del aviso lleva id="aviso" (titleId, destino de
      // location.state.focus) y los dos avisos lo comparten: la etiqueta lleva
      // id y texto para distinguir cuál tiene el foco. Antes, «H2 Cita cancelada».
      foco: 'H2#aviso Cita cancelada',
    },
    dismissed: { foco: 'H1 #contenido', aviso: false },
  })

  await b.go(LIST)
  const focos = []
  for (let i = 0; i < 3; i++) {
    await cancelAt(b, 1)
    focos.push(await b.ev(label))
  }
  const all = await b.ev(`({
    subtitulo: document.querySelector('.c-page-header__subtitle').textContent,
    secciones: document.querySelectorAll('.c-my-appointments__section').length,
    encabezados: [...document.querySelectorAll('main h1, main h2')].filter((h) => h.checkVisibility()).map((h) => h.tagName + ' ' + h.textContent),
    pasadas: [...document.querySelectorAll('${section(1)} h3')].map((h) => h.textContent),
    aviso: document.querySelector('main .c-notice--success .c-notice__text p').textContent,
  })`)
  await b.shot('04.8-sin-proximas.png', { x: 0, y: 0, width: 375, height: 900 })
  expect('cancelar las tres próximas: «No tienes citas próximas», sin sección Próximas (sin h2 vacío), las cinco en Pasadas y el foco en el título de cada aviso', { focos, ...all }, {
    focos: ['H2#aviso Cita cancelada', 'H2#aviso Cita cancelada', 'H2#aviso Cita cancelada'],
    subtitulo: 'No tienes citas próximas',
    secciones: 1,
    encabezados: ['H1 Mis citas', 'H2 Cita cancelada', 'H2 Pasadas'],
    pasadas: ['Miércoles 16 de mayo · 09:30', 'Martes 8 de mayo · 17:00', 'Martes 24 de abril · 10:30', 'Lunes 12 de marzo · 09:00', 'Jueves 22 de febrero · 12:30'],
    aviso: 'Ya no tienes la cita del miércoles 16 de mayo a las 09:30 con el Dr. Cortés.',
  })
  await b.metrics(1280, 900)
}

// Tramo de Appointment Card desde lg (pendiente de V4a): el li mide viewport −
// 400 − 48; Row desde 640 de li, es decir desde 1040 de viewport (1055 con
// barra clásica). Entre 1024 y 1039 (1054), Stacked con las acciones a ancho
// completo.
async function cardStretch(b, expect) {
  const read = `(() => { const li = document.querySelector('${cardAt(1, 1)}'); const acts = [...li.querySelectorAll('.c-appointment-card__action')]; return { li: Math.round(li.getBoundingClientRect().width), forma: getComputedStyle(li.querySelector('.c-appointment-card__card')).gridTemplateColumns.split(' ').length === 2 ? 'Row' : 'Stacked', acciones: acts.map((a) => Math.round(a.getBoundingClientRect().width)), alto: Math.round(li.getBoundingClientRect().height) } })()`
  const out = {}
  for (const [w, overlay] of [[1024, true], [1039, true], [1040, true], [1054, false], [1055, false]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(LIST)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(read)
    await b.shot(`tramo-${w}-${overlay ? 'sup' : 'clas'}.png`, { x: 0, y: 0, width: w, height: 900 })
  }
  expect('Appointment Card en el tramo desde lg: Stacked con acciones a ancho completo hasta 1039 (1054 con barra clásica); Row desde 1040 (1055)', out, {
    '1024 sup': { li: 624, forma: 'Stacked', acciones: [590, 590], alto: 324 },
    '1039 sup': { li: 639, forma: 'Stacked', acciones: [605, 605], alto: 324 },
    '1040 sup': { li: 640, forma: 'Row', acciones: [224, 224], alto: 212 },
    '1054 clás': { li: 639, forma: 'Stacked', acciones: [605, 605], alto: 324 },
    '1055 clás': { li: 640, forma: 'Row', acciones: [224, 224], alto: 212 },
  })
  await b.metrics(1280, 900)
}

// === V4b · Reprogramación (02.7, 02.8) ================================================================
const RESCHEDULE = '/mis-citas/c3/reprogramar'
const R027 = `${RESCHEDULE}?fecha=2029-05-17&hora=17:00`

const RESCHEDULE_PARTS = {
  header: '.c-header-mobile, .c-header-desktop',
  retroceso: '.c-back-link',
  breadcrumb: '.c-breadcrumb',
  avatar: '.c-page-header__avatar',
  h1: 'main h1',
  especialidad: '.c-page-header__specialty',
  ubicacion: '.c-page-header__location',
  modalidad: '.c-page-header__tag',
  placa: 'main .c-notice--info:not(.c-booking-summary *)',
  fieldset: '.c-slot-picker__dates',
  legend: '.c-slot-picker__legend',
  mes: '.c-slot-picker__month',
  semana: '.c-slot-picker__week-nav',
  etiquetaSemana: '.c-slot-picker__week-label',
  semanaAnterior: '.c-slot-picker__week-previous',
  semanaSiguiente: '.c-slot-picker__week-next',
  tira: '.c-day-strip',
  chip2: '.c-day-chip:nth-child(2)',
  tituloHoras: '.c-slot-picker__times .c-slot-picker__heading',
  estado: '.c-slot-picker__status',
  lista: '.c-slot-list',
  hora1: '.c-time-slot',
  tarde: '.c-slot-list__group:nth-child(2)',
  barra: '.c-app-layout__bar',
  tarjeta: '.c-slot-picker__card',
  columnaFecha: '.c-slot-picker__calendar',
  eligeFecha: '.c-slot-picker__calendar .c-slot-picker__heading',
  calendario: '.c-slot-picker__calendar .c-calendar',
  horas: '.c-slot-picker__times',
  pasos: '.c-booking-summary ol',
  resumen: '.c-booking-summary__card',
  tituloResumen: '.c-booking-summary__title',
  nuevaCita: '.c-booking-details > div:nth-child(1)',
  antes: '.c-booking-details__previous',
  aviso: '.c-booking-summary .c-notice',
  acciones: '.c-booking-summary__actions',
  envio: '.c-booking-summary__actions .c-button',
  main: 'main',
}
// Figma 02.7 (357:6603, 375 × 1206) y 02.8 (357:6811, 1440 × 910), en
// coordenadas del frame. Los textos en HUG (retroceso, legend, etiqueta de
// semana, modalidad, breadcrumb y envío) sin su ancho: métrica de Inter. En
// 02.8 la ubicación mide 261,1 (Figma 260), así que la x de la modalidad
// tampoco se compara: y y alto.
const FIGMA_027 = {
  header: [0, 0, 375, 64], retroceso: [16, 88, null, 48], avatar: [16, 148, 64, 64], h1: [96, 144, 263, 72], especialidad: [16, 228, 343, 24],
  ubicacion: [16, 264, null, 20], modalidad: [16, 292, null, 30], placa: [16, 354, 343, 110], fieldset: [16, 496, 343, 184], legend: [16, 507, null, 28],
  mes: [141, 496, 218, 50], semana: [16, 562, 343, 48], etiquetaSemana: [16, 574, null, 24], semanaAnterior: [259, 562, 48, 48], semanaSiguiente: [311, 562, 48, 48],
  tira: [16, 618, 343, 62], chip2: [65.6, 618, 45.6, 62], tituloHoras: [16, 712, 343, 28], estado: [16, 748, 343, 24], lista: [16, 788, 343, 312],
  hora1: [16, 820, 106.3, 50], tarde: [16, 956, 343, 144], barra: [0, 1132, 375, 74],
}
const FIGMA_028 = {
  header: [0, 0, 1440, 82], breadcrumb: [120, 114, null, 28], avatar: [120, 167, 96, 96], h1: [240, 158, 1080, 44], especialidad: [240, 210, 1080, 24],
  ubicacion: [240, 247, null, 20], modalidad: [null, 242, null, 30], placa: null, tarjeta: [120, 304, 848, 558], columnaFecha: [153, 337, 360, 492],
  eligeFecha: [153, 337, 360, 28], calendario: [153, 381, 360, 448], horas: [545, 337, 390, null], lista: [545, 413, 390, 312], hora1: [545, 445, 122, 50],
  pasos: null, resumen: [1000, 304, 320, 274], tituloResumen: [1017, 321, 286, 28], nuevaCita: [1017, 365, 286, 64], antes: [1049, 409, 254, 20],
  aviso: [1000, 594, 320, 158], acciones: [1000, 768, 320, 50], envio: [1000, 768, null, 50], main: [0, 82, 1440, 828],
}

async function reschedulePairs(b, expect) {
  await b.overlayScrollbars(true)
  const initial = `(() => { const a = document.querySelector('.c-page-header__avatar'); return { img: a.querySelector('img') !== null, inicial: a.textContent.trim() } })()`
  for (const [name, width, figma, alto] of [['02.7', 375, FIGMA_027, 1206], ['02.8', 1440, FIGMA_028, 910]]) {
    await b.metrics(width, 900)
    await b.go(R027)
    const h = await fitPage(b, width)
    const actual = await measure(b, Object.fromEntries(Object.keys(figma).map((k) => [k, RESCHEDULE_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width, height: h })
    expect(`${name} (${width}, barra superpuesta) a ±1 px de Figma, y el alto de página; Cortés con la inicial, sin foto`, { fuera: outside(actual, figma), alto: h, avatar: await b.ev(initial) }, { fuera: [], alto, avatar: { img: false, inicial: 'I' } })
  }
  await b.metrics(1280, 900)
}

// --- V4b: envío, vuelta a Mis citas y la pantalla medida con teclado y ratón reales ----------------

const R_NOW = 'Miércoles 16 de mayo · 09:30. Al confirmar, esa hora se libera.'
const R_BEFORE = 'Antes: miércoles 16 de mayo, 09:30'
const label = `(() => { const a = document.activeElement; if (!a || a === document.body) return 'BODY'; return a.tagName + (a.id && !a.id.startsWith('react-aria') && !a.id.startsWith('_r') ? '#' + a.id : '') + ' ' + (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30)) })()`
const cortesCard = `[...document.querySelectorAll('.c-appointment-card')].find((c) => c.querySelector('.c-appointment-card__name')?.textContent === 'Dr. Iván Cortés Naranjo')`
const clickExpr = async (b, expr) => {
  const { x, y } = await b.ev(`(() => { const e = ${expr}; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  await settle()
}
const waitPath = async (b, path) => {
  for (let i = 0; i < 50 && (await b.ev('location.pathname')) !== path; i++) await sleep(100)
  await settle(300)
}
const isDesktop = (b) => b.ev(`matchMedia('(min-width: 64rem)').matches`)
const submitSel = async (b) => ((await isDesktop(b)) ? '.c-booking-summary__actions .c-button' : '.c-booking-bar__submit')
// Día y hora con clic real: la celda del calendario en escritorio, el chip en móvil, y la hora.
const pick = async (b, day, time) => {
  if (await isDesktop(b)) await clickExpr(b, `[...document.querySelectorAll('.c-slot-picker__calendar td')].find((td) => td.textContent.trim() === '${day}')`)
  else await clickExpr(b, `[...document.querySelectorAll('.c-day-chip')].find((c) => c.querySelector('.c-day-chip__day')?.textContent === '${day}')`)
  await clickExpr(b, `[...document.querySelectorAll('.c-time-slot')].find((s) => s.textContent.includes('${time}'))`)
}
// Desde Mis citas, «Reprogramar» de Cortés (clic real) y el 17 a las 17:00.
const toReschedule = async (b, width) => {
  await b.metrics(width, 900)
  await b.go(LIST)
  await clickExpr(b, `${cortesCard}.querySelector('a')`)
  await waitPath(b, RESCHEDULE)
  await pick(b, '17', '17:00')
}
const confirmHour = async (b) => {
  await clickSel(b, await submitSel(b))
  await waitPath(b, LIST)
}
// Atrás y Adelante del navegador (el historial de la pestaña, no history.back()).
const historyStep = async (b, delta) => {
  const { currentIndex, entries } = await b.send('Page.getNavigationHistory')
  await b.send('Page.navigateToHistoryEntry', { entryId: entries[currentIndex + delta].id })
  await settle(700)
}
const FOCUS_LOG = `(() => { window.__focusLog = []; window.__focusObserver?.disconnect(); window.__focusObserver = new MutationObserver(() => { const a = document.activeElement; window.__focusLog.push(!a || a === document.body ? 'BODY' : a.tagName) }); window.__focusObserver.observe(document.body, { childList: true, subtree: true }); return true })()`
const noticeNow = `({ ruta: location.pathname, aviso: document.querySelector('main .c-notice--success .c-notice__title')?.textContent ?? null, foco: ${label}, pasoPorBody: (window.__focusLog ?? []).includes('BODY') })`

// Sonda de «Confirmar hora»: al final de cada lote de mutaciones y antes de
// cada pintado, qué página hay (por su h1, no por la URL: React Router cambia
// la URL antes del commit), la placa y «Antes:» de la reprogramación, la
// fecha de la tarjeta de Cortés, el aviso y el foco. El foco en body se
// cuenta desde el envío (evento submit): el clic que lleva el foco de la hora
// al botón deja un lote con body entre el blur y el focus (docs/verificacion.md,
// Trampas), antes del envío y ajeno a él.
const RESCHEDULE_PROBE = `(() => {
  document.addEventListener('submit', () => { window.__sent = true }, { capture: true, once: true })
  const state = () => {
    const h1 = document.querySelector('main h1')?.textContent
    const a = document.activeElement
    return {
      enviado: Boolean(window.__sent),
      pagina: h1 === 'Mis citas' ? 'mis-citas' : h1 === 'Dr. Iván Cortés Naranjo' ? 'reprogramar' : 'otra',
      placa: document.querySelector('main .c-notice--info:not(.c-booking-summary *) .c-notice__text p:last-child')?.textContent ?? null,
      antes: document.querySelector('.c-booking-details__previous')?.textContent ?? null,
      cortes: ${cortesCard}?.querySelector('h3')?.textContent ?? null,
      aviso: document.querySelector('main .c-notice--success .c-notice__title')?.textContent ?? null,
      foco: !a || a === document.body ? 'BODY' : a.tagName + (a.id === 'aviso' ? '#aviso' : ''),
    }
  }
  window.__batches = []
  window.__frames = []
  new MutationObserver(() => window.__batches.push(state())).observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
  const tick = () => { window.__frames.push(state()); if (window.__frames.length < 120) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  return true
})()`
const RESCHEDULE_READ = `(() => {
  const all = [...window.__batches, ...window.__frames]
  const here = all.filter((s) => s.pagina === 'reprogramar')
  const there = all.filter((s) => s.pagina === 'mis-citas')
  const first = window.__batches.find((s) => s.pagina === 'mis-citas')
  return {
    conFechaNueva: here.filter((s) => (s.placa !== null && s.placa !== ${JSON.stringify(R_NOW)}) || (s.antes !== null && s.antes !== ${JSON.stringify(R_BEFORE)})).length,
    primerLote: first && { cortes: first.cortes, aviso: first.aviso, foco: first.foco },
    misCitasIncompletos: there.filter((s) => s.cortes !== 'Jueves 17 de mayo · 17:00' || s.aviso !== 'Cita reprogramada' || s.foco !== 'H2#aviso').length,
    enviado: all.some((s) => s.enviado),
    enBodyTrasEnviar: all.filter((s) => s.enviado && s.foco === 'BODY').length,
    otraPagina: all.filter((s) => s.pagina === 'otra').length,
    frames: window.__frames.length > 0,
  }
})()`

async function rescheduleProbe(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  for (const w of [375, 1440]) {
    await toReschedule(b, w)
    const i0 = await b.ev(idx)
    await b.ev(RESCHEDULE_PROBE)
    await clickSel(b, await submitSel(b))
    await sleep(2200)
    out[w] = {
      ...(await b.ev(RESCHEDULE_READ)),
      ruta: await b.ev('location.pathname'),
      mismoIdx: (await b.ev(idx)) === i0,
      state: await b.ev('history.state?.usr?.focus'),
      aviso: await b.ev(`(() => { const n = document.querySelector('main .c-notice--success'); return { role: n.getAttribute('role'), titulo: n.querySelector('.c-notice__title').tagName, cuerpo: n.querySelector('.c-notice__text p').textContent } })()`),
      focoAlLeer: await b.ev(label),
    }
  }
  const expected = {
    conFechaNueva: 0, primerLote: { cortes: 'Jueves 17 de mayo · 17:00', aviso: 'Cita reprogramada', foco: 'H2#aviso' }, misCitasIncompletos: 0, enviado: true, enBodyTrasEnviar: 0, otraPagina: 0, frames: true,
    ruta: LIST, mismoIdx: true, state: 'aviso', aviso: { role: null, titulo: 'H2', cuerpo: 'Tu cita pasó al jueves 17 de mayo, 17:00.' }, focoAlLeer: 'H2#aviso Cita reprogramada',
  }
  expect('sonda de «Confirmar hora» (clic real; MutationObserver y requestAnimationFrame): ningún lote ni frame de la reprogramación con la fecha nueva; el primer lote de Mis citas ya trae la tarjeta del 17, el aviso y el foco en su título; nunca body; replace con state.focus', out, { 375: expected, 1440: expected })
  await b.metrics(1280, 900)
}

// POP entre las dos entradas de Mis citas (Atrás y Adelante del navegador):
// sin aviso; si el foco estaba en su título, al h1 (useFocusFallback) sin
// ningún lote en body; si estaba en una tarjeta, no se mueve. Contraprueba:
// sin el respaldo (focus() anulado para #contenido en el prototipo, la única
// llamada durante el POP), body.
async function popEntries(b, expect) {
  await b.overlayScrollbars(true)
  await toReschedule(b, 375)
  await confirmHour(b)
  const llegada = await b.ev(label)
  await b.ev(FOCUS_LOG)
  await historyStep(b, -1)
  const atras = await b.ev(noticeNow)
  await b.tabTo(`${cortesCard}.querySelector('button')`)
  await b.ev('(window.__button = document.activeElement), true')
  await b.ev(FOCUS_LOG)
  await historyStep(b, 1)
  const adelante = { ...(await b.ev(noticeNow)), mismoNodo: await b.ev('document.activeElement === window.__button') }
  await toReschedule(b, 375)
  await confirmHour(b)
  await b.ev(`(() => { const f = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function (o) { if (this.id !== 'contenido') f.call(this, o) }; return true })()`)
  await b.ev(FOCUS_LOG)
  await historyStep(b, -1)
  const sinRespaldo = await b.ev(noticeNow)
  expect('POP entre las dos entradas de Mis citas: Atrás con el foco en el aviso → sin aviso y foco en el h1 sin pasar por body; Adelante con el foco en una tarjeta → sin aviso y el foco no se mueve; sin el respaldo, body (contraprueba)', { llegada, atras, adelante, sinRespaldo }, {
    llegada: 'H2#aviso Cita reprogramada',
    atras: { ruta: LIST, aviso: null, foco: 'H1#contenido Mis citas', pasoPorBody: false },
    adelante: { ruta: LIST, aviso: null, foco: 'BUTTON Cancelar cita', pasoPorBody: false, mismoNodo: true },
    sinRespaldo: { ruta: LIST, aviso: null, foco: 'BODY', pasoPorBody: true },
  })
  await b.metrics(1280, 900)
}

// Recarga de la entrada con el aviso: carga inicial, sin aviso (el almacén se
// reinicia) y con state.focus conservado; Atrás desde otra página: sin aviso
// y respaldo al h1 (D12).
async function reloadAndBack(b, expect) {
  await b.overlayScrollbars(true)
  await toReschedule(b, 375)
  await confirmHour(b)
  await b.send('Page.reload')
  for (let i = 0; i < 50; i++) {
    await sleep(100)
    if (await b.ev(`document.readyState === 'complete' && document.querySelector('main h1')?.textContent === 'Mis citas'`)) break
  }
  await settle(300)
  const recarga = { ...(await b.ev(noticeNow)), state: await b.ev('history.state?.usr?.focus'), cortes: await b.ev(`${cortesCard}.querySelector('h3').textContent`) }
  delete recarga.pasoPorBody
  await toReschedule(b, 375)
  await confirmHour(b)
  await clickSel(b, '.c-bottom-nav a[href="/"]')
  await waitPath(b, '/')
  await historyStep(b, -1)
  const atras = await b.ev(noticeNow)
  delete atras.pasoPorBody
  expect('recarga de Mis citas tras reprogramar: sin aviso, foco en body (carga inicial) y state.focus conservado; Atrás desde otra página: sin aviso y foco en el h1 (el destino no existe)', { recarga, atras }, {
    recarga: { ruta: LIST, aviso: null, foco: 'BODY', state: 'aviso', cortes: 'Miércoles 16 de mayo · 09:30' },
    atras: { ruta: LIST, aviso: null, foco: 'H1#contenido Mis citas' },
  })
  await b.metrics(1280, 900)
}

// Reprogramar c3 y después cancelarla: la key del aviso lleva el tipo, así
// que «Cita cancelada» es otro Notice y el foco llega a su título en el commit
// del aviso (misma sonda que cancelar).
const SWAP_PROBE = `(() => {
  const state = () => { const a = document.activeElement; return { aviso: document.querySelector('main .c-notice--success .c-notice__title')?.textContent ?? null, foco: !a || a === document.body ? 'BODY' : a.tagName + (a.id ? '#' + a.id : '') + ' ' + a.textContent.trim().slice(0, 20) } }
  window.__batches = []
  new MutationObserver(() => window.__batches.push(state())).observe(document.body, { childList: true, subtree: true, attributes: true })
  return true
})()`
async function rescheduleThenCancel(b, expect) {
  await b.overlayScrollbars(true)
  await toReschedule(b, 375)
  await confirmHour(b)
  await clickExpr(b, `${cortesCard}.querySelector('button')`)
  await b.ev(SWAP_PROBE)
  await clickSel(b, '.c-dialog .c-button--destructive')
  await sleep(600)
  const out = await b.ev(`({ focoAlAparecer: window.__batches.find((s) => s.aviso === 'Cita cancelada')?.foco ?? null, focoFinal: window.__batches.at(-1)?.foco ?? null, cuerpo: document.querySelector('main .c-notice--success .c-notice__text p').textContent })`)
  expect('reprogramar c3 y cancelarla: «Cita cancelada» sustituye a «Cita reprogramada» (key con el tipo) y el foco llega a su título en el commit del aviso', { ...out, focoAlLeer: await b.ev(label) }, {
    focoAlAparecer: 'H2#aviso Cita cancelada', focoFinal: 'H2#aviso Cita cancelada',
    cuerpo: 'Ya no tienes la cita del jueves 17 de mayo a las 17:00 con el Dr. Cortés.', focoAlLeer: 'H2#aviso Cita cancelada',
  })
  await b.metrics(1280, 900)
}

// Contador de takeNotice desde el script (solo dev: importa la URL exacta del
// módulo que cargó la app, docs/verificacion.md, Trampas): 1 por llegada a Mis
// citas; entrar en la reprogramación no lo ejecuta.
async function takeCounter(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.go(LIST)
  await b.ev(`(() => { const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/src/data/appointments.ts')); return import(url).then((m) => { const s = m.appointmentStore; const take = s.takeNotice; window.__takes = []; s.takeNotice = () => { const r = take(); window.__takes.push(r); return r }; return true }) })()`)
  await clickExpr(b, `${cortesCard}.querySelector('a')`)
  await waitPath(b, RESCHEDULE)
  const alEntrar = await b.ev('window.__takes.length')
  await pick(b, '17', '17:00')
  await confirmHour(b)
  const alVolver = await b.ev('window.__takes')
  await historyStep(b, -1)
  const alAtras = await b.ev('window.__takes')
  expect('takeNotice (contador desde el script): 0 al entrar en la reprogramación; 1 por llegada a Mis citas (la vuelta lo consume; Atrás lo vuelve a pedir y ya no hay)', { alEntrar, alVolver, alAtras }, {
    alEntrar: 0, alVolver: [{ kind: 'reprogramada', id: 'c3' }], alAtras: [{ kind: 'reprogramada', id: 'c3' }, null],
  })
  await b.metrics(1280, 900)
}

// El envío en el árbol AX: nombre y descripción con las dos fechas (panel 02.0).
const ax = async (b, selector) => {
  await b.send('Accessibility.enable')
  const { root } = await b.send('DOM.getDocument', { depth: 0 })
  const { nodeId } = await b.send('DOM.querySelector', { nodeId: root.nodeId, selector })
  const { nodes } = await b.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false })
  const n = nodes.find((x) => !x.ignored) ?? nodes[0]
  return { rol: n.role?.value, nombre: n.name?.value, descripcion: n.description?.value ?? null }
}
async function rescheduleStructure(b, expect) {
  await b.overlayScrollbars(true)
  const headings = `[...document.querySelectorAll('main h1, main h2, main h3')].map((h) => h.tagName + ' ' + h.textContent.trim())`
  await b.metrics(375, 900)
  await b.go(R027)
  const movil = {
    titulo: await b.ev('document.title'),
    encabezados: await b.ev(headings),
    placa: await b.ev(`(() => { const n = document.querySelector('main .c-notice--info'); return { role: n.getAttribute('role'), titulo: n.querySelector('.c-notice__title').tagName, foco: n.querySelector('[tabindex]') !== null } })()`),
    retroceso: await b.ev(`document.querySelector('.c-back-link').getAttribute('href')`),
    pestana: await b.ev(`document.querySelector('.c-bottom-nav')`),
    envio: await ax(b, '.c-booking-bar__submit'),
  }
  await b.metrics(1440, 900)
  await b.go(R027)
  const escritorio = {
    encabezados: await b.ev(headings),
    seccion: await b.ev(`(() => { const s = document.querySelector('section.c-booking-summary'); return { nombre: document.getElementById(s.getAttribute('aria-labelledby')).textContent, enElForm: Boolean(s.closest('form')), aside: document.querySelectorAll('main aside').length, pasos: s.querySelector('ol') !== null, nota: s.querySelector('.c-booking-summary__note') !== null } })()`),
    alConfirmar: await b.ev(`(() => { const n = document.querySelector('.c-booking-summary .c-notice'); return { role: n.getAttribute('role'), titulo: n.querySelector('.c-notice__title').tagName } })()`),
    breadcrumb: await b.ev(`[...document.querySelectorAll('.c-breadcrumb li')].map((l) => l.textContent.replace('/', '').trim() + (l.querySelector('a') ? ' → ' + l.querySelector('a').getAttribute('href') : ''))`),
    pestana: await b.ev(`(() => { const a = document.querySelector('.c-header-desktop [aria-current]'); return a.textContent + ' · ' + a.getAttribute('aria-current') })()`),
    leyenda: await b.ev(`[...document.querySelectorAll('.c-calendar__legend-item')].map((i) => i.textContent.trim())`),
    mesAnterior: await b.ev(`document.querySelector('[aria-label="Mes anterior"]') !== null`),
    dia16: await b.ev(`(() => { const cell = (d) => [...document.querySelectorAll('.c-slot-picker__calendar td')].find((td) => td.textContent.trim() === d); const sig = (d) => { const c = cell(d); const e = c.querySelector('[aria-label]') ?? c; return [c.className, e.className, e.getAttribute('aria-selected'), e.getAttribute('aria-disabled')].join('|') }; return { igualQue15: sig('16').replaceAll('16', 'N') === sig('15').replaceAll('15', 'N'), igualQue18: sig('16').replaceAll('16', 'N') === sig('18').replaceAll('18', 'N') } })()`),
    envio: await ax(b, '.c-booking-summary__actions .c-button'),
  }
  // El h2 «mayo de 2029» es el oculto de RAC (DESIGN.md § Fecha y hora). La
  // descripción la calcula Chromium con los textos de los ids de
  // aria-describedby separados por espacios.
  expect('02.7 y 02.8: título (D15), encabezados, placa y «Al confirmar» sin role ni encabezado (C2), «El cambio» como section en el form sin pasos ni nota (C1), retroceso a Mis citas, pestaña «Mis citas» como sección, mayo con «Mes anterior» y sin «Hoy», el 16 igual que un día libre, y el envío descrito por las dos fechas en el árbol AX (C4)', { movil, escritorio }, {
    movil: {
      titulo: 'Reprogramar cita · Dr. Iván Cortés Naranjo · Salvia',
      encabezados: ['H1 Dr. Iván Cortés Naranjo', 'H2 Elige fecha', 'H2 Elige hora'],
      placa: { role: null, titulo: 'P', foco: false },
      retroceso: LIST,
      pestana: null,
      envio: { rol: 'button', nombre: 'Confirmar hora', descripcion: `jue 17 may · 17:00 Presencial · 30 min Tu cita actual ${R_NOW}` },
    },
    escritorio: {
      encabezados: ['H1 Dr. Iván Cortés Naranjo', 'H2 Elige fecha', 'H2 mayo de 2029', 'H2 Elige hora', 'H2 El cambio'],
      seccion: { nombre: 'El cambio', enElForm: true, aside: 0, pasos: false, nota: false },
      alConfirmar: { role: null, titulo: 'P' },
      breadcrumb: ['Mis citas → /mis-citas', 'Dr. Cortés'],
      pestana: 'Mis citas · true',
      leyenda: ['Sin horarios'],
      mesAnterior: true,
      dia16: { igualQue15: true, igualQue18: true },
      envio: { rol: 'button', nombre: 'Confirmar hora', descripcion: `Nueva cita Jueves 17 de mayo, 17:00 ${R_BEFORE}` },
    },
  })
  await b.metrics(1280, 900)
}

// Missing en escritorio con clic real y con Intro (sin parámetros: el 15).
async function missingDesktop(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(1440, 900)
  const read = `({ estado: document.querySelector('.c-slot-picker__status').textContent, foco: (() => { const a = document.activeElement; return a.tagName + ' ' + a.textContent.trim() })(), describe: document.activeElement.getAttribute('aria-describedby')?.split(' ').map((i) => document.getElementById(i)?.textContent).join(' | ') ?? null, mensaje: document.querySelector('.c-booking-summary__message')?.textContent ?? null, url: location.search })`
  await b.go(RESCHEDULE)
  const inicial = await b.ev(`document.querySelector('.c-slot-picker__status').textContent`)
  await clickSel(b, '.c-booking-summary__actions .c-button')
  const clic = await b.ev(read)
  await b.go(RESCHEDULE)
  await b.tabTo(`document.querySelector('.c-booking-summary__actions .c-button')`)
  await b.enter()
  await settle(300)
  const intro = await b.ev(read)
  const expected = { estado: 'Martes 15 de mayo · 8 horarios libres', foco: 'DIV 09:00', describe: 'Elige un horario primero', mensaje: 'Elige un horario primero', url: '' }
  expect('Missing en escritorio (sin parámetros, el martes 15): con clic real y con Intro, el foco va a la primera hora libre, descrita por «Elige un horario primero»', { inicial, clic, intro }, { inicial: 'Martes 15 de mayo · 8 horarios libres', clic: expected, intro: expected })
  await b.metrics(1280, 900)
}

// C6 (≠ declarado, D4): reprogramar no cambia la disponibilidad, así que una
// cita puede volver a su propia hora. c1 al 24 a las 10:30 (su hora) y c3 en
// una segunda pasada, otra vez al 17 a las 17:00.
async function sameSlot(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(1440, 900)
  const before = `({ nuevaCita: document.querySelector('.c-booking-details__value').textContent, antes: document.querySelector('.c-booking-details__previous').textContent, alConfirmar: document.querySelector('.c-booking-summary .c-notice__text p:last-child').textContent })`
  const after = `document.querySelector('main .c-notice--success .c-notice__text p').textContent`
  await b.go('/mis-citas/c1/reprogramar?fecha=2029-04-24&hora=10:30')
  const c1 = { antesDeEnviar: await b.ev(before) }
  await confirmHour(b)
  c1.aviso = await b.ev(after)
  await toReschedule(b, 1440)
  await confirmHour(b)
  await clickExpr(b, `${cortesCard}.querySelector('a')`)
  await waitPath(b, RESCHEDULE)
  await pick(b, '17', '17:00')
  const c3 = { antesDeEnviar: await b.ev(before) }
  await confirmHour(b)
  c3.aviso = await b.ev(after)
  expect('C6 (≠ declarado, D4): una cita reprogramada a su propia hora nombra dos fechas iguales (c1 al 24 a las 10:30; c3 otra vez al 17 a las 17:00)', { c1, c3 }, {
    c1: { antesDeEnviar: { nuevaCita: 'Martes 24 de abril, 10:30', antes: 'Antes: martes 24 de abril, 10:30', alConfirmar: 'Se libera el martes 24 de abril a las 10:30 y tu cita pasa al martes 24. Puedes volver a cambiarla hasta 24 horas antes.' }, aviso: 'Tu cita pasó al martes 24 de abril, 10:30.' },
    c3: { antesDeEnviar: { nuevaCita: 'Jueves 17 de mayo, 17:00', antes: 'Antes: jueves 17 de mayo, 17:00', alConfirmar: 'Se libera el jueves 17 de mayo a las 17:00 y tu cita pasa al jueves 17. Puedes volver a cambiarla hasta 24 horas antes.' }, aviso: 'Tu cita pasó al jueves 17 de mayo, 17:00.' },
  })
  await b.metrics(1280, 900)
}

// C7 (coste declarado): «Confirmar hora» mide 167,3 en el navegador (Figma
// 167), así que la barra necesita 335,3 de interior (resumen 152 + 16 +
// 167,3): 368 de viewport con barra superpuesta y 383 con la clásica (el
// plan decía 367 / 382, con el ancho de Figma). Por debajo, el botón baja de
// línea y la barra mide 134.
async function barSweep(b, expect) {
  const read = `(() => { const bar = document.querySelector('.c-booking-bar'); const s = document.querySelector('.c-booking-bar__summary').getBoundingClientRect(), btn = document.querySelector('.c-booking-bar__submit').getBoundingClientRect(); return { alto: Math.round(bar.getBoundingClientRect().height), unaFila: Math.round(s.top) < Math.round(btn.bottom) && Math.round(btn.top) < Math.round(s.bottom), boton: Math.round(btn.width * 10) / 10 } })()`
  const out = {}
  for (const [w, overlay] of [[368, true], [367, true], [383, false], [382, false], [375, false], [375, true]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(R027)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(read)
  }
  const row = { alto: 74, unaFila: true, boton: 167.3 }
  const wrapped = { alto: 134, unaFila: false, boton: 167.3 }
  expect('C7: la barra con «Confirmar hora» en una fila desde 368 (superpuesta) y 383 (clásica); por debajo, el botón baja de línea (también a 375 con barra clásica)', out, {
    '368 sup': row, '367 sup': wrapped, '383 clás': row, '382 clás': wrapped, '375 clás': wrapped, '375 sup': row,
  })
  await b.metrics(1280, 900)
}

// Guarda de D1 en cliente: con c1 cancelada, su reprogramación → replace a
// /mis-citas (la entrada empujada se sustituye, sin crecer), y el foco en el h1.
// Solo dev: el aviso de cancelar se retira al cambiar de entrada (useFocusFallback).
async function rescheduleGuard(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(1280, 900)
  await b.go(LIST)
  await cancelAt(b, 1)
  const i0 = await b.ev(idx)
  await b.ev(`(history.pushState({ usr: null, key: 'verify', idx: (history.state?.idx ?? 0) + 1 }, '', '/mis-citas/c1/reprogramar'), dispatchEvent(new PopStateEvent('popstate', { state: history.state })), true)`)
  await sleep(700)
  const out = { ...(await b.ev(`({ ruta: location.pathname, h1: document.querySelector('main h1').textContent, aviso: document.querySelector('main .c-notice--success') !== null })`)), foco: await b.ev(label), entradas: (await b.ev(idx)) - i0 }
  expect('guarda en cliente: c1 cancelada → su reprogramación hace replace a /mis-citas (una sola entrada, la empujada) y el foco va al h1', out, { ruta: LIST, h1: 'Mis citas', aviso: false, foco: 'H1#contenido Mis citas', entradas: 1 })
}

// Cruce de lg: el h1 de la reprogramación es el mismo nodo (su padre no
// cambia); el foco en la barra o en «Confirmar hora» de «El cambio» va al h1;
// sin el respaldo, body (contraprueba).
async function rescheduleCross(b, expect) {
  await b.overlayScrollbars(true)
  const h1 = await h1AcrossLg(b, R027)
  const out = {}
  await b.metrics(375, 900)
  await b.go(R027)
  await b.ev(`document.querySelector('.c-booking-bar__submit').focus(), true`)
  await b.metrics(1100, 900)
  await settle(400)
  out.barraAEscritorio = await b.ev(label)
  await b.ev(`document.querySelector('.c-booking-summary__actions .c-button').focus(), true`)
  await b.metrics(375, 900)
  await settle(400)
  out.cambioAMovil = await b.ev(label)
  await b.go(R027)
  await b.ev(`(() => { const f = HTMLElement.prototype.focus; HTMLElement.prototype.focus = function (o) { if (this.id !== 'contenido') f.call(this, o) }; document.querySelector('.c-booking-bar__submit').focus(); return true })()`)
  await b.metrics(1100, 900)
  await settle(400)
  out.sinRespaldo = await b.ev(label)
  expect('cruce de lg en la reprogramación: el h1 es el mismo nodo (llegada por useRouteFocus, los dos sentidos, sin lotes en body); la barra y «El cambio» → h1; sin el respaldo, body (contraprueba)', { h1, ...out }, {
    h1: { '375→1100': { llegada: 'H1#contenido', foco: 'H1#contenido', nodoNuevo: false, pasoPorBody: false }, '1100→375': { llegada: 'H1#contenido', foco: 'H1#contenido', nodoNuevo: false, pasoPorBody: false } },
    barraAEscritorio: 'H1#contenido Dr. Iván Cortés Naranjo', cambioAMovil: 'H1#contenido Dr. Iván Cortés Naranjo', sinRespaldo: 'BODY',
  })
  await b.metrics(1280, 900)
}

// Navegación en cliente Mis citas → «Reprogramar» (clic real, 375, barra
// clásica): la reprogramación en cliente frente a la recargada.
async function rescheduleNavigation(b, expect) {
  await b.overlayScrollbars(false)
  await b.metrics(375, 900, 1)
  const nav = await clientNavigation(b, { from: LIST, link: 'Reprogramar', to: '/mis-citas/c1/reprogramar', park: true, state: `({ h1: document.querySelector('main h1').textContent, foco: ${label}, titulo: document.title })` })
  delete nav.afterClient
  delete nav.afterReload
  expect(
    `navegación en cliente Mis citas → «Reprogramar» de la Dra. Ruiz (clic real, 375, barra clásica): foco en el h1 y título de D15; sin resto de pintado, ningún píxel con delta > 64 al llegar ni 4 s después (${resampleNote(nav)})`,
    viewRest(nav),
    { ruta: '/mis-citas/c1/reprogramar', sinRecarga: true, estado: { h1: 'Dra. Elena Ruiz Arellano', foco: 'H1#contenido Dra. Elena Ruiz Arellano', titulo: 'Reprogramar cita · Dra. Elena Ruiz Arellano · Salvia' }, sobre64: 0, cuatroSegundosSobre64: 0 },
  )
  await b.metrics(1280, 900, 1)
}

// Anchos intermedios, 200 % a 320 con las dos barras, letra del navegador y
// forced-colors en 02.7 y 02.8.
const TEXT_R = '.c-notice__text > *, .c-page-header__title, .c-page-header__specialty, .c-page-header__location-text, .c-back-link, .c-slot-picker__month, .c-slot-picker__week-label, .c-legend__heading, .c-day-chip__weekday, .c-day-chip__day, .c-time-slot, .c-slot-picker__status, .c-slot-list__label, .c-booking-bar__title, .c-booking-bar__meta-text, .c-booking-bar__submit'
async function rescheduleWidths(b, expect) {
  const read = `(() => { const card = document.querySelector('.c-slot-picker__card'); return { chrome: document.querySelector('.c-header-desktop') ? 'escritorio' : 'móvil', placa: document.querySelector('main .c-notice--info:not(.c-booking-summary *)') !== null, cambio: document.querySelector('section.c-booking-summary') !== null, barra: document.querySelector('.c-booking-bar') !== null, fila: card ? getComputedStyle(card).flexDirection === 'row' : null, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth } })()`
  const out = {}
  for (const [w, overlay] of [[320, true], [360, true], [608, true], [1023, false], [1024, true], [1112, true], [1113, true], [1440, true]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(R027)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(read)
  }
  const mobile = { chrome: 'móvil', placa: true, cambio: false, barra: true, fila: null, desborde: 0 }
  const desktop = (fila) => ({ chrome: 'escritorio', placa: false, cambio: true, barra: false, fila, desborde: 0 })
  expect('anchos intermedios de la reprogramación: chrome móvil con placa y barra hasta 1023; desde lg, «El cambio» y la tarjeta apilada hasta 1112 y en fila desde 1113 (umbral slot-picker); sin desborde', out, {
    '320 sup': mobile, '360 sup': mobile, '608 sup': mobile, '1023 clás': mobile, '1024 sup': desktop(false), '1112 sup': desktop(false), '1113 sup': desktop(true), '1440 sup': desktop(true),
  })

  const zoom = {}
  for (const overlay of [true, false]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900)
    await b.go(R027)
    const html = await b.run(text200)
    await settle(300)
    const words = await b.run(splitWords, TEXT_R)
    zoom[overlay ? 'sup' : 'clás'] = { html, desborde: await b.run(overflow), parten: words.split.sort(), pudiendoCaber: words.couldFit.sort() }
  }
  // Con barra clásica, «Confirmar» (la del botón de la barra, interior 143)
  // y «completo» («Ver mes completo», interior 143) son más anchas que su
  // interior, como «Continuar» y «completo» en 02.1 (V2a).
  expect('02.7 al 200 % a 320 con las dos barras: sin desborde; solo parten palabras más anchas que su elemento', zoom, {
    sup: { html: '32px', desborde: 0, parten: [], pudiendoCaber: [] },
    clás: { html: '32px', desborde: 0, parten: ['Confirmar', 'completo'], pudiendoCaber: [] },
  })

  const large = {}
  for (const [w, px] of [[320, 24], [320, 32], [375, 20]]) {
    await b.overlayScrollbars(false)
    await b.metrics(w, 800)
    await font(b, px)
    await b.go(R027)
    const page = await b.ev(`({ html: getComputedStyle(document.documentElement).fontSize, barra: getComputedStyle(document.querySelector('.c-app-layout__bar')).position, desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth })`)
    large[`${w} letra ${px}`] = { ...page, pudiendoCaber: (await b.run(splitWords, TEXT_R)).couldFit }
  }
  await font(b, 16)
  const big = (px) => ({ html: `${px}px`, barra: 'static', desborde: 0, pudiendoCaber: [] })
  expect('02.7 con la letra del navegador a 24 y 32 (320) y a 20 (375): barra estática, sin desborde ni palabras partidas pudiendo caber', large, { '320 letra 24': big(24), '320 letra 32': big(32), '375 letra 20': big(20) })

  await b.overlayScrollbars(true)
  await b.forcedColors(true)
  const border = (selector) => `(() => { const c = getComputedStyle(document.querySelector(${JSON.stringify(selector)})); return c.borderTopStyle + ' ' + c.borderTopWidth + ' ' + (c.borderTopColor === 'rgba(0, 0, 0, 0)' ? 'transparente' : 'visible') })()`
  await b.metrics(375, 900)
  await b.go(R027)
  const forced = { placa: await b.ev(border('main .c-notice--info')), barra: await b.ev(border('.c-booking-bar')) }
  await b.shot('forced-02.7.png', { x: 0, y: 0, width: 375, height: 900 })
  await b.metrics(1440, 900)
  await b.go(R027)
  forced.cambio = await b.ev(border('.c-booking-summary__card'))
  forced.alConfirmar = await b.ev(border('.c-booking-summary .c-notice'))
  forced.confirmar = await b.ev(border('.c-booking-summary__actions .c-button'))
  await b.shot('forced-02.8.png', { x: 0, y: 0, width: 1440, height: 900 })
  await confirmHour(b)
  forced.aviso = await b.ev(border('main .c-notice--success'))
  await b.forcedColors(false)
  const solid = 'solid 1px visible'
  expect('forced-colors: placa, barra, «El cambio», «Al confirmar», «Confirmar hora» y el aviso «Cita reprogramada» conservan su contorno', forced, { placa: solid, barra: solid, cambio: solid, alConfirmar: solid, confirmar: solid, aviso: solid })
  await b.metrics(1280, 900)
}

// Orden de Tab en 02.7 y 02.8.
async function rescheduleTab(b, expect) {
  await b.overlayScrollbars(true)
  const order = async (w, n) => {
    await b.metrics(w, 900)
    await b.go(R027)
    await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
    const out = []
    for (let i = 0; i < n; i++) {
      await b.tab()
      out.push(await b.ev(`(() => { const a = document.activeElement; return a === document.body ? 'BODY' : a.tagName + ' ' + (a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30)) })()`))
    }
    return out
  }
  // La tira y la lista de horas son una parada cada una (radios y ListBox de
  // RAC); el calendario, una (la celda enfocable). La barra de móvil va tras
  // main. Tras el último control, el marco del navegador (body) y la vuelta.
  expect('orden de Tab en 02.7 (salto, header, retroceso, «Ver mes completo», semana, tira, horas y «Confirmar hora») y 02.8 (salto, header, breadcrumb, mes, el día elegido, horas y «Confirmar hora»)', { '02.7': await order(375, 12), '02.8': await order(1440, 14) }, {
    '02.7': ['A Saltar al contenido', 'A Salvia', 'A Ayuda', 'A Mis citas', 'BUTTON Ver mes completo', 'BUTTON Semana anterior', 'BUTTON Semana siguiente', 'INPUT ', 'DIV 17:00', 'BUTTON Confirmar hora', 'BODY', 'A Saltar al contenido'],
    '02.8': ['A Saltar al contenido', 'A Salvia', 'A Especialistas', 'A Mis citas', 'A Ayuda', 'BUTTON Karla Sánchez', 'A Mis citas', 'BUTTON Mes anterior', 'BUTTON Mes siguiente', 'DIV jueves 17 de mayo de 2029, 8 horarios libres, seleccionado', 'DIV 17:00', 'BUTTON Confirmar hora', 'BODY', 'A Saltar al contenido'],
  })
  await b.metrics(1280, 900)
}

// Flujos de foco contra la preview (sin StrictMode).
export async function previewFlows(b, expect) {
  await confirmFocus(b, expect)
  await h1Cross(b, expect)
  await dialogInView(b, expect)
  await cancelProbe(b, expect)
  await cancelFlow(b, expect)
  await rescheduleProbe(b, expect)
  await popEntries(b, expect)
  await reloadAndBack(b, expect)
  await rescheduleThenCancel(b, expect)
  await missingDesktop(b, expect)
  await rescheduleCross(b, expect)
}

export default async function run(b, expect) {
  await b.forcedColors(false)
  await confirmPairs(b, expect)
  await wideThreshold(b, expect)
  await summaryRegression(b, expect)
  await confirmWidths(b, expect)
  await confirmZoom(b, expect)
  await confirmForced(b, expect)
  await confirmStructure(b, expect)
  await calendarDownload(b, expect)
  await bookingContact(b, expect)
  await confirmFocus(b, expect)
  await h1Cross(b, expect)
  await confirmNavigation(b, expect)
  await listPairs(b, expect)
  await accountMenu(b, expect)
  await dialogInView(b, expect)
  await cancelProbe(b, expect)
  await cancelFlow(b, expect)
  await cardStretch(b, expect)
  await reschedulePairs(b, expect)
  await rescheduleStructure(b, expect)
  await rescheduleProbe(b, expect)
  await popEntries(b, expect)
  await reloadAndBack(b, expect)
  await rescheduleThenCancel(b, expect)
  await takeCounter(b, expect)
  await missingDesktop(b, expect)
  await sameSlot(b, expect)
  await barSweep(b, expect)
  await rescheduleGuard(b, expect)
  await rescheduleCross(b, expect)
  await rescheduleNavigation(b, expect)
  await rescheduleWidths(b, expect)
  await rescheduleTab(b, expect)
}
