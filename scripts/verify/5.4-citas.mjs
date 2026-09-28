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
import { pixelDiff, toBottom, viewport } from './navegacion.mjs'

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
  // El h1 se vuelve a montar al cruzar (cambia su padre: sin pasos desde lg),
  // así que el respaldo se anula en el prototipo, no en el nodo.
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
  const nav = { ...arrival, pixelesDistintosDeLaRecarga: await b.ev(pixelDiff(afterClient, afterReload)), cuatroSegundosDespues: await b.ev(pixelDiff(later, afterReload)) }
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-confirmada-cliente-375.png', afterClient)
    await b.saveBase64('navegacion-confirmada-recarga-375.png', afterReload)
  }
  expect(
    'navegación en cliente 03.1 → 04.1 (envío real, 375, barra clásica): sin restos en los píxeles, y el resto de pintado explicado o mitigado (✗ declarado: DESIGN.md, Pendientes, «Resto de pintado»)',
    { ...nav, explicado: false },
    { ruta: C1, sinRecarga: true, pixelesDistintosDeLaRecarga: 0, cuatroSegundosDespues: 0, explicado: true },
  )
  await b.metrics(1280, 900, 1)
}

// El h1 se vuelve a montar al cruzar lg (los pasos solo existen en móvil): el
// foco llega al nuevo sin pasar por body (DESIGN.md, Pendientes).
async function h1Cross(b, expect) {
  await b.overlayScrollbars(true)
  expect('foco en el h1 de la confirmación al cruzar lg (llegada por useRouteFocus, los dos sentidos): el h1 nuevo, sin ningún lote de mutaciones en body', await h1AcrossLg(b, C1), H1_ACROSS_LG)
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
    foco: ${focused},
  })`)
  await clickSel(b, 'main .c-notice--success .c-icon-button')
  const dismissed = { foco: await b.ev(focused), aviso: await b.ev(`Boolean(document.querySelector('main .c-notice--success'))`) }
  expect('cancelar a Molina: subtítulo a 2, Molina primera en Pasadas (descendente), aviso Success sin role con el copy de Figma y el foco en su título; al cerrarlo, foco en el h1', { once, dismissed }, {
    once: {
      subtitulo: 'Tienes 2 citas próximas',
      proximas: ['Martes 24 de abril · 10:30', 'Miércoles 16 de mayo · 09:30'],
      pasadas: ['Martes 8 de mayo · 17:00', 'Lunes 12 de marzo · 09:00', 'Jueves 22 de febrero · 12:30'],
      aviso: { role: null, titulo: 'H2', cuerpo: 'Ya no tienes la cita del martes 8 de mayo a las 17:00 con el Dr. Molina.' },
      foco: 'H2 Cita cancelada',
    },
    dismissed: { foco: 'H1 #contenido', aviso: false },
  })

  await b.go(LIST)
  const focos = []
  for (let i = 0; i < 3; i++) {
    await cancelAt(b, 1)
    focos.push(await b.ev(focused))
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
    focos: ['H2 Cita cancelada', 'H2 Cita cancelada', 'H2 Cita cancelada'],
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

// Flujos de foco contra la preview (sin StrictMode).
export async function previewFlows(b, expect) {
  await confirmFocus(b, expect)
  await h1Cross(b, expect)
  await dialogInView(b, expect)
  await cancelProbe(b, expect)
  await cancelFlow(b, expect)
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
}
