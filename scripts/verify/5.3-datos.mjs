// 5.3 Datos del paciente (V3): la vista 3 contra sus pares de Figma (03.1,
// 03.2 y 03.5 a 375), el resumen de errores (foco en el h2 al enviar con clic
// e Intro; enlace → control con la etiqueta visible por encima de la barra y
// sin entrada de historial, con la contraprueba del ancla nativa), la reserva
// fallida (foco en el título del aviso en el mismo commit, pie «Elegir otra
// hora», valores conservados, Intro sin envío) y el envío válido (replace a la
// confirmación). `previewFlows` repite los flujos de foco contra pnpm preview
// (sin StrictMode): pnpm verify 5.3 --preview.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation } from './navegacion.mjs'

const DATOS = '/especialistas/elena-ruiz-arellano/datos'
const P031 = `${DATOS}?fecha=2029-04-24&hora=10:30`
const P035 = `${P031}&escenario=ocupada`

const settle = () => sleep(250)
const focused = `(() => { const a = document.activeElement; if (!a || a === document.body) return 'BODY'; return a.tagName + ' ' + (a.id ? '#' + a.id : a.textContent.trim().slice(0, 40)) })()`
const rect = (selector) => `(() => { const e = document.querySelector(${JSON.stringify(selector)}); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.x * 10) / 10, Math.round((r.y + scrollY) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10] })()`
const clickSel = async (b, selector) => {
  const { x, y } = await b.ev(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  await settle()
}
// Clic real sin desplazar: el elemento debe estar ya en la vista.
const clickInPlace = async (b, selector) => {
  const { x, y } = await b.ev(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  await settle()
}
// Escribe en un campo como el teclado: foco, Ctrl+A y texto insertado (input).
const typeInto = async (b, id, text) => {
  await b.ev(`document.getElementById(${JSON.stringify(id)}).focus(), true`)
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
  await b.send('Input.insertText', { text })
  await settle()
}
// Motivo: el select nativo con el setter del prototipo y change (lo que React escucha).
const chooseReason = (b, value) =>
  b.ev(`(() => { const s = document.getElementById('motivo'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, ${JSON.stringify(value)}); s.dispatchEvent(new Event('change', { bubbles: true })); return s.value })()`)
// Estado de 03.2: correo «karla@», motivo sin elegir, aviso sin marcar.
const fillErrors = (b) => typeInto(b, 'correo', 'karla@')
// Estado de 03.5: motivo «Primera consulta» y las dos casillas marcadas.
const fillValid = async (b) => {
  await chooseReason(b, 'Primera consulta')
  await clickSel(b, '.c-checkbox__row:has(#privacidad)')
  await clickSel(b, '.c-checkbox__row:has(#recordatorio)')
}
const submitBar = (b) => clickSel(b, '.c-action-bar .c-button')

// Página entera en un viewport de su alto: la barra sticky queda al final del
// flujo, donde la dibuja Figma.
const fitPage = async (b, width) => {
  const h = await b.ev('document.documentElement.scrollHeight')
  await b.metrics(width, h)
  await b.ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))')
  return h
}
const measure = async (b, parts) => {
  const out = {}
  for (const [k, s] of Object.entries(parts)) out[k] = await b.ev(rect(s))
  return out
}
// Cajas frente a Figma a ±1 px. null en una cifra: no se compara (ancho de un
// texto, métrica de Inter Variable, como en 5.1 y 5.2).
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
  pasos: 'ol[aria-label="Pasos de la reserva"]',
  h1: 'main h1',
  resumen: '.c-error-summary',
  tituloResumen: '.c-error-summary__title',
  enlaceResumen1: '.c-error-summary li:nth-child(1) a',
  enlaceResumen2: '.c-error-summary li:nth-child(2) a',
  enlaceResumen3: '.c-error-summary li:nth-child(3) a',
  aviso: '.c-notice--error',
  fieldset1: '.c-patient-form fieldset:nth-of-type(1)',
  legend1: '.c-patient-form fieldset:nth-of-type(1) legend',
  ayuda: '.c-legend-help',
  nombre: '.c-field:has(#nombre)',
  correo: '.c-field:has(#correo)',
  telefono: '.c-field:has(#telefono)',
  motivo: '.c-field:has(#motivo)',
  fieldset2: '.c-patient-form fieldset:nth-of-type(2)',
  legend2: '.c-patient-form fieldset:nth-of-type(2) legend',
  enlaceAviso: '.c-patient-form__link',
  privacidad: '.c-checkbox:has(#privacidad)',
  recordatorio: '.c-checkbox:has(#recordatorio)',
  barra: '.c-app-layout__bar',
  envio: '.c-action-bar .c-button',
  nota: '.c-action-bar__note',
}
// Figma 03.1 (258:1327), 03.2 (258:1505) y 03.5 (343:8940), en coordenadas
// del frame de 375. La legend de Figma (UI/Legend) incluye la ayuda: en código
// son dos elementos, y se comparan por separado (28 + 4 + 40 = 72). Los pasos
// miden 313 en Figma (HUG) y llenan la columna en código: y y alto.
const fields = (y) => ({
  fieldset1: [16, y, 343, 560], legend1: [16, y, 343, 28], ayuda: [16, y + 32, 343, 40],
  nombre: [16, y + 88, 343, 106], correo: [16, y + 210, 343, 106], telefono: [16, y + 332, 343, 106], motivo: [16, y + 454, 343, 106],
  fieldset2: [16, y + 592, 343, 252], legend2: [16, y + 592, 343, 28], enlaceAviso: [16, y + 624, 203, 48],
  privacidad: [16, y + 676, 343, 72], recordatorio: [16, y + 748, 343, 96],
})
const heading = { header: [0, 0, 375, 64], retroceso: [16, 88, null, 48], pasos: [16, 144, null, 24], h1: [16, 184, 343, 36] }
const FIGMA_MOBILE = {
  '03.1': { alto: 1230, cajas: { ...heading, ...fields(252), resumen: null, aviso: null, barra: [0, 1128, 375, 102], envio: [16, 1140, 343, 50], nota: [16, 1198, 343, 20] } },
  '03.2': {
    alto: 1474,
    cajas: {
      ...heading, resumen: [16, 252, 343, 212], tituloResumen: [66, 270, 275, 24],
      enlaceResumen1: [34, 302, null, 48], enlaceResumen2: [34, 350, null, 48], enlaceResumen3: [34, 398, null, 48],
      ...fields(496), aviso: null, barra: [0, 1372, 375, 102], envio: [16, 1384, 343, 50], nota: [16, 1442, 343, 20],
    },
  },
  '03.5': { alto: 1368, cajas: { ...heading, resumen: null, aviso: [16, 252, 343, 134], ...fields(418), barra: [0, 1294, 375, 74], envio: [16, 1306, 343, 50], nota: null } },
}

const DESKTOP_PARTS = {
  header: '.c-header-desktop',
  breadcrumb: '.c-breadcrumb',
  h1: 'main h1',
  resumen: '.c-error-summary',
  tituloResumen: '.c-error-summary__title',
  enlaceResumen1: '.c-error-summary li:nth-child(1) a',
  aviso: 'main .c-notice--error',
  tarjeta: '.c-patient-form__card',
  fieldset1: '.c-patient-form fieldset:nth-of-type(1)',
  legend1: '.c-patient-form fieldset:nth-of-type(1) legend',
  ayuda: '.c-legend-help',
  nombre: '.c-field:has(#nombre)',
  correo: '.c-field:has(#correo)',
  telefono: '.c-field:has(#telefono)',
  motivo: '.c-field:has(#motivo)',
  fieldset2: '.c-patient-form fieldset:nth-of-type(2)',
  enlaceAviso: '.c-patient-form__link',
  opciones: '.c-patient-form__options',
  privacidad: '.c-checkbox:has(#privacidad)',
  recordatorio: '.c-checkbox:has(#recordatorio)',
  seccion: '.c-booking-summary',
  pasos: '.c-booking-summary ol',
  resumenCita: '.c-appointment-summary__card',
  tituloCita: '.c-appointment-summary__title',
  quien: '.c-appointment-summary__who',
  datos: '.c-booking-details',
  politica: '.c-booking-summary .c-notice--info',
  acciones: '.c-booking-summary__actions',
  envio: '.c-booking-summary__actions .c-button',
  nota: '.c-booking-summary__note',
  main: 'main',
}
// Figma 03.3 (258:3180), 03.4 (258:5354) y 03.6 (345:9098), en coordenadas
// del frame de 1440. La tarjeta del formulario lleva borde 1 + padding space-6
// (33). La columna de campos: 375 + 32 + 375. Los pasos miden 313 (HUG) y
// llenan los 320 de la sección en código: y y alto. La nota «Recibirás un
// correo de confirmación» va en FILL en Figma (320) y en código mide su texto
// (sin comparar el ancho, como en 02.5).
const formCard = (y) => ({
  tarjeta: [120, y, 848, 622], fieldset1: [153, y + 33, 782, 296], legend1: [153, y + 33, 782, 28], ayuda: [153, y + 65, 782, 20],
  nombre: [153, y + 101, 375, 106], correo: [560, y + 101, 375, 106], telefono: [153, y + 223, 375, 106], motivo: [560, y + 223, 375, 106],
  fieldset2: [153, y + 361, 782, 228], enlaceAviso: [153, y + 393, 203, 48], opciones: [153, y + 445, 480, 144],
  privacidad: [153, y + 445, 480, 72], recordatorio: [153, y + 517, 480, 72],
})
const aside = {
  pasos: [1000, 234, null, 24], resumenCita: [1000, 274, 320, 372], tituloCita: [1017, 291, 286, 28], quien: [1017, 335, 286, 102],
  datos: [1017, 453, 286, 176], politica: [1000, 662, 320, 158],
}
const desktopHeading = { header: [0, 0, 1440, 82], breadcrumb: [120, 114, null, 28], h1: [120, 158, 1200, 44] }
const FIGMA_DESKTOP = {
  '03.3': {
    alto: 962,
    cajas: { ...desktopHeading, resumen: null, aviso: null, ...formCard(234), seccion: [1000, 234, 320, 680], ...aside, acciones: [1000, 836, 320, 78], envio: [1000, 836, null, 50], nota: [1000, 894, null, 20], main: [0, 82, 1440, 880] },
  },
  '03.4': {
    alto: 1148,
    cajas: {
      ...desktopHeading, resumen: [120, 234, 848, 212], tituloResumen: [170, 252, 780, 24], enlaceResumen1: [138, 284, null, 48], aviso: null,
      ...formCard(478), seccion: [1000, 234, 320, 680], ...aside, acciones: [1000, 836, 320, 78], envio: [1000, 836, null, 50], nota: [1000, 894, null, 20], main: [0, 82, 1440, 1066],
    },
  },
  '03.6': {
    alto: 1022,
    cajas: { ...desktopHeading, resumen: null, aviso: [120, 234, 848, 86], ...formCard(352), seccion: [1000, 234, 320, 652], ...aside, acciones: [1000, 836, 320, 50], envio: [1000, 836, null, 50], nota: null, main: [0, 82, 1440, 940] },
  },
}
const submitAside = (b) => clickSel(b, '.c-booking-summary__actions .c-button')

async function desktopPairs(b, expect) {
  await b.overlayScrollbars(true)
  for (const [name, { alto, cajas }] of Object.entries(FIGMA_DESKTOP)) {
    await b.metrics(1440, 900)
    await b.go(name === '03.6' ? P035 : P031)
    if (name === '03.4') {
      await fillErrors(b)
      await submitAside(b)
    }
    if (name === '03.6') {
      await fillValid(b)
      await submitAside(b)
    }
    const h = await fitPage(b, 1440)
    const actual = await measure(b, Object.fromEntries(Object.keys(cajas).map((k) => [k, DESKTOP_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width: 1440, height: h })
    expect(`${name} (1440) a ±1 px de Figma, y el alto de página`, { fuera: outside(actual, cajas), alto: h }, { fuera: [], alto })
  }
}

// --aside: padding de la tarjeta de «Tu cita» (03.3, columna de 320) frente al
// de 02.4 a 343 (sin modificador, por encima de appointment-summary-compact).
async function asidePadding(b, expect) {
  const padding = `(() => { const c = getComputedStyle(document.querySelector('.c-appointment-summary__card')); return [c.paddingTop, c.paddingLeft].join(' ') + ' · raíz ' + Math.round(document.querySelector('.c-appointment-summary').getBoundingClientRect().width) })()`
  await b.overlayScrollbars(true)
  await b.metrics(1440, 900)
  await b.go(P031)
  const aside = await b.ev(padding)
  await b.metrics(375, 812)
  await b.go('/especialistas/elena-ruiz-arellano/confirmar?fecha=2029-04-24&hora=10:30')
  const confirm = await b.ev(padding)
  expect('--aside: la tarjeta de «Tu cita» (03.3) lleva padding 16 con la raíz de 320; la de 02.4 a 343, 24 (sin modificador)', { '03.3': aside, '02.4': confirm }, { '03.3': '16px 16px · raíz 320', '02.4': '24px 24px · raíz 343' })
}

async function figmaPairs(b, expect) {
  await b.overlayScrollbars(true)
  for (const [name, { alto, cajas }] of Object.entries(FIGMA_MOBILE)) {
    await b.metrics(375, 812)
    await b.go(name === '03.5' ? P035 : P031)
    if (name === '03.2') {
      await fillErrors(b)
      await submitBar(b)
    }
    if (name === '03.5') {
      await fillValid(b)
      await submitBar(b)
    }
    const h = await fitPage(b, 375)
    const actual = await measure(b, Object.fromEntries(Object.keys(cajas).map((k) => [k, MOBILE_PARTS[k]])))
    await b.shot(`${name}.png`, { x: 0, y: 0, width: 375, height: h })
    expect(`${name} (375, barra superpuesta) a ±1 px de Figma, y el alto de página`, { fuera: outside(actual, cajas), alto: h }, { fuera: [], alto })
  }
}

// Resumen de errores en móvil (375 × 812, barra superpuesta y clásica): foco en
// el h2 al enviar con clic y con Intro; cada enlace lleva el foco a su control
// sin entrada de historial, con la etiqueta (o la legend) visible y el control
// por encima de la barra (2.4.11). Contraprueba: el mismo enlace sin el
// manejador (ancla nativa) añade una entrada y el hash.
async function summaryFlow(b, expect) {
  const out = {}
  for (const [bar, hidden] of [['superpuesta', true], ['clásica', false]]) {
    await b.overlayScrollbars(hidden)
    await b.metrics(375, 812)
    await b.go(P031)
    await fillErrors(b)
    await submitBar(b)
    // Destino de foco programático: con ratón no hay anillo; con teclado, sí
    // (DESIGN.md § Constantes, «Destino de foco programático»).
    const ring = `(() => { const a = document.activeElement; const c = getComputedStyle(a); return a.matches(':focus-visible') ? c.outlineStyle + ' ' + c.outlineWidth : 'sin anillo' })()`
    const clic = {
      foco: await b.ev(focused),
      anillo: await b.ev(ring),
      resumenArriba: await b.ev(`Math.round(document.querySelector('.c-error-summary').getBoundingClientRect().top)`),
      invalidos: await b.ev(`[...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.id + ' → ' + document.getElementById(e.getAttribute('aria-describedby'))?.textContent)`),
    }
    await b.go(P031)
    await fillErrors(b)
    await b.enter()
    await settle()
    const intro = { foco: await b.ev(focused), anillo: await b.ev(ring) }

    const links = {}
    for (const id of ['correo', 'motivo', 'privacidad']) {
      await b.ev('window.scrollTo(0, 0), true')
      const before = await b.ev('history.length')
      await clickInPlace(b, `.c-error-summary a[href="#${id}"]`)
      links[id] = await b.ev(`(() => {
        const control = document.getElementById(${JSON.stringify(id)})
        const grouped = control.type === 'checkbox'
        const label = grouped ? control.closest('fieldset').querySelector('legend') : control.labels[0]
        const box = (grouped ? control.closest('.c-checkbox__box') : control).getBoundingClientRect()
        const top = label.getBoundingClientRect().top
        const bar = document.querySelector('.c-app-layout__bar').getBoundingClientRect().top
        return { foco: document.activeElement.id, etiquetaVisible: top >= 0, controlSobreLaBarra: box.bottom <= bar, historial: history.length - ${before}, hash: location.hash, cifras: [Math.round(top), Math.round(box.top), Math.round(box.bottom), Math.round(bar)] }
      })()`)
    }
    // Contraprueba: un clon del enlace, sin el manejador de React, es un ancla nativa.
    await b.ev(`(() => { window.scrollTo(0, 0); const a = document.querySelector('.c-error-summary a[href="#motivo"]'); const li = document.createElement('li'); const c = a.cloneNode(true); c.id = 'ancla-nativa'; li.append(c); a.closest('ul').append(li); return true })()`)
    const before = await b.ev('history.length')
    await clickInPlace(b, '#ancla-nativa')
    const nativa = await b.ev(`({ foco: document.activeElement.id, historial: history.length - ${before}, hash: location.hash })`)
    out[bar] = { clic, intro, links, nativa }
  }
  const link = { foco: null, etiquetaVisible: true, controlSobreLaBarra: true, historial: 0, hash: '' }
  // Cifras [etiqueta arriba, control arriba, control abajo, barra arriba] en la
  // vista de 812. Con los errores la página mide 1474 y los tres destinos caen
  // en el máximo de desplazamiento (662): la etiqueta de «Correo» no llega a
  // space-4 del borde (44 en vez de 16). La casilla mide su caja de 24.
  const expected = {
    clic: { foco: 'H2 Corrige 3 campos para continuar', anillo: 'sin anillo', resumenArriba: 16, invalidos: ['correo → Escribe un correo válido, con @ y dominio', 'motivo → Elige el motivo de tu consulta', 'privacidad → Debes aceptar el aviso para continuar'] },
    intro: { foco: 'H2 Corrige 3 campos para continuar', anillo: 'solid 2px' },
    links: {
      correo: { ...link, foco: 'correo', cifras: [44, 72, 122, 710] },
      motivo: { ...link, foco: 'motivo', cifras: [288, 316, 366, 710] },
      privacidad: { ...link, foco: 'privacidad', cifras: [426, 522, 546, 710] },
    },
    nativa: { foco: 'motivo', historial: 1, hash: '#motivo' },
  }
  expect(
    'resumen de errores (375 × 812): foco en el h2 al enviar con clic (sin anillo) y con Intro (anillo de 2 px); cada enlace → su control sin entrada de historial, etiqueta visible y control sobre la barra; contraprueba: el ancla nativa añade una entrada y el hash',
    out,
    { superpuesta: expected, clásica: expected },
  )
}

// Reserva fallida (?escenario=ocupada): el foco llega al título del aviso en
// el mismo commit que desmonta «Confirmar cita» (la sonda lo lee al vaciarse
// la pila del commit: nunca body); el aviso va sin role; el pie pasa a
// «Elegir otra hora» (enlace al perfil con la fecha, sin hora, con V1 y
// escenario) sin nota; los valores se conservan; Intro en un campo no envía
// (ningún submit asociado ni <button> sin type en el form).
async function failedFlow(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  await b.go(`${P035}&q=Cardiolog%C3%ADa`)
  await fillValid(b)
  await b.ev(`(() => { window.__probe = []; new MutationObserver(() => window.__probe.push(document.activeElement === document.body ? 'BODY' : document.activeElement.tagName)).observe(document.body, { childList: true, subtree: true }); return true })()`)
  await submitBar(b)
  const out = await b.ev(`(() => {
    const form = document.querySelector('form.c-patient-form')
    const notice = document.querySelector('.c-notice--error')
    const bar = document.querySelector('.c-action-bar')
    return {
      foco: document.activeElement.tagName + ' ' + document.activeElement.textContent,
      sonda: [...new Set(window.__probe)],
      rol: notice.getAttribute('role') ?? notice.parentElement.getAttribute('role'),
      cuerpo: notice.querySelector('.c-notice__text p:last-child').textContent,
      pie: [...bar.querySelectorAll('a, button')].map((e) => e.tagName + ' ' + e.textContent + ' → ' + (e.getAttribute('href') ?? e.type)),
      nota: Boolean(bar.querySelector('.c-action-bar__note')),
      resumen: Boolean(document.querySelector('.c-error-summary')),
      valores: [document.getElementById('nombre').value, document.getElementById('motivo').value, document.getElementById('privacidad').checked, document.getElementById('recordatorio').checked],
      submits: [...form.elements].filter((e) => e.type === 'submit').length + document.querySelectorAll('[form="' + form.id + '"]').length,
      botonesSinType: form.querySelectorAll('button:not([type])').length,
    }
  })()`)
  // Intro en un campo tras el fallo: sin envío, la URL y el foco no cambian.
  const url = await b.ev('location.href')
  await b.ev(`document.getElementById('nombre').focus(), true`)
  await b.enter()
  await settle()
  out.introEnCampo = { mismaUrl: (await b.ev('location.href')) === url, foco: await b.ev(focused), aviso: await b.ev(`Boolean(document.querySelector('.c-notice--error'))`) }
  expect('reserva fallida (03.5): foco en el título del aviso en el mismo commit, sin role; pie «Elegir otra hora» sin nota; valores conservados; Intro en un campo no envía', out, {
    foco: 'H2 Esa hora ya está ocupada',
    sonda: ['H2'],
    rol: null,
    cuerpo: 'Alguien reservó el martes 24 a las 10:30 mientras completabas tus datos. Tus datos se conservan.',
    pie: ['A Elegir otra hora → /especialistas/elena-ruiz-arellano?escenario=ocupada&q=Cardiolog%C3%ADa&fecha=2029-04-24'],
    nota: false,
    resumen: false,
    valores: ['Karla Sánchez Bautista', 'Primera consulta', true, true],
    submits: 0,
    botonesSinType: 0,
    introEnCampo: { mismaUrl: true, foco: 'INPUT #nombre', aviso: true },
  })
}

// Foco del aviso fallido: Notice enfoca su título sin preventScroll, así que
// Chromium lo desplaza a la vista. Se mide dónde queda: dentro de la vista y,
// en móvil, por encima de la barra (2.4.11). 375 × 812 (03.5, las dos barras)
// y 1440 × 900 (03.6).
async function failedFocusPosition(b) {
  const where = `(() => { const t = document.querySelector('.c-notice--error .c-notice__title'); const r = t.getBoundingClientRect(); const bar = document.querySelector('.c-app-layout__bar'); const limit = bar ? bar.getBoundingClientRect().top : innerHeight; return { foco: document.activeElement === t, titulo: [Math.round(r.top), Math.round(r.bottom)], limite: Math.round(limit), visible: r.top >= 0 && r.bottom <= limit, scrollY: Math.round(scrollY) } })()`
  const out = {}
  for (const [name, width, height, hidden, submit] of [
    ['03.5 superpuesta', 375, 812, true, submitBar],
    ['03.5 clásica', 375, 812, false, submitBar],
    ['03.6', 1440, 900, true, submitAside],
  ]) {
    await b.overlayScrollbars(hidden)
    await b.metrics(width, height)
    await b.go(P035)
    await fillValid(b)
    await submit(b)
    out[name] = await b.ev(where)
  }
  return out
}

// Envío válido: replace a /citas/c1/confirmada (D13: la cita de Ruiz reutiliza
// c1) con V1 y escenario, sin fecha ni hora; foco en su h1.
async function validFlow(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  await b.go(`${P031}&q=Cardiolog%C3%ADa`)
  const idx = await b.ev('history.state?.idx')
  await fillValid(b)
  await submitBar(b)
  await sleep(300)
  expect('envío válido: replace a /citas/c1/confirmada con los parámetros de V1, foco en su h1', {
    ruta: await b.ev('location.pathname + location.search'),
    replace: (await b.ev('history.state?.idx')) === idx,
    foco: await b.ev(`document.activeElement.tagName + ' ' + document.activeElement.textContent`),
  }, { ruta: '/citas/c1/confirmada?q=Cardiolog%C3%ADa', replace: true, foco: 'H1 Tu cita está reservada' })
}

// Tras un envío válido, submitBooking reinicia el borrador (D17) antes de
// navegar, y useSyncExternalStore vuelve a pintar el form en síncrono. ¿Llega
// a verse el form con los valores iniciales antes del cambio de ruta?
// - MutationObserver (subtree, atributos y texto): lee el estado del form al
//   final de cada commit que muta el DOM. React cambia value y checked como
//   propiedades: un commit que solo reinicia valores puede no mutar nada.
// - requestAnimationFrame: una muestra por frame, antes de pintar; cada
//   muestra es un frame que llega a la pantalla.
// Cada registro: [ruta, motivo, privacidad marcada].
const RESET_PROBE = `(() => {
  const state = () => { const m = document.getElementById('motivo'); const p = document.getElementById('privacidad'); return [location.pathname.split('/').pop(), m ? m.value : null, p ? p.checked : null] }
  window.__mo = []; window.__raf = []
  new MutationObserver(() => window.__mo.push(state())).observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })
  const tick = () => { window.__raf.push(state()); if (window.__raf.length < 90) requestAnimationFrame(tick) }
  requestAnimationFrame(tick)
  return true
})()`
async function resetProbe(b) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  await b.go(P031)
  await fillValid(b)
  const { x, y } = await b.ev(`(() => { const e = document.querySelector('.c-action-bar .c-button'); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.ev(RESET_PROBE)
  await b.click(x, y)
  await sleep(1600)
  const dedupe = (rows) => rows.filter((r, i) => i === 0 || JSON.stringify(r) !== JSON.stringify(rows[i - 1]))
  const mo = await b.ev('window.__mo')
  const raf = await b.ev('window.__raf')
  // Form reiniciado: el form sigue en el DOM (motivo no null) con los valores
  // iniciales, sea cual sea la ruta (la URL cambia antes que la vista).
  const reset = (r) => r[1] === '' || r[2] === false
  return {
    mutationObserver: { secuencia: dedupe(mo), commitsConElFormReiniciado: mo.filter(reset).length },
    frames: { secuencia: dedupe(raf), framesConElFormReiniciado: raf.filter(reset).length },
  }
}
// Medido en dev y en la preview (3 de 3). El frame [confirmada, «Primera
// consulta», true] es del router: la URL cambia antes de montar la vista
// nueva, con el form aún lleno (no cambia nada visible). Contraprueba manual
// (docs/verificacion.md): con la vista suscrita al borrador aparece
// [confirmada, '', false], el form reiniciado.
const RESET_EXPECTED = {
  mutationObserver: { secuencia: [['datos', 'Primera consulta', true], ['confirmada', null, null]], commitsConElFormReiniciado: 0 },
  frames: { secuencia: [['datos', 'Primera consulta', true], ['confirmada', 'Primera consulta', true], ['confirmada', null, null]], framesConElFormReiniciado: 0 },
}

// El borrador (D17) cruza vistas: se conserva al ir al aviso de privacidad
// (/fuera-de-alcance) y volver con Atrás, y tras «Elegir otra hora» → perfil →
// otra hora → /datos (escritorio: «Continuar con tus datos» lleva a /datos).
async function draftKept(b, expect) {
  const values = `[document.getElementById('telefono').value, document.getElementById('motivo').value, document.getElementById('privacidad').checked, document.getElementById('recordatorio').checked]`
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  await b.go(P031)
  await typeInto(b, 'telefono', '55 1234 5678')
  await fillValid(b)
  await clickSel(b, '.c-patient-form__link')
  const genericPage = await b.ev('location.pathname')
  await b.ev('history.back(), true')
  await sleep(500)
  const afterBack = { ruta: await b.ev('location.pathname'), valores: await b.ev(values) }

  await b.metrics(1440, 900)
  await b.go(P035)
  await chooseReason(b, 'Segunda opinión')
  await clickSel(b, '.c-checkbox__row:has(#privacidad)')
  await submitAside(b)
  await clickSel(b, '.c-booking-summary__actions .c-button')
  const profile = await b.ev('location.pathname + location.search')
  await clickSel(b, '.c-time-slot:not([aria-disabled="true"])')
  await clickSel(b, '.c-booking-summary__actions .c-button')
  const again = { ruta: await b.ev('location.pathname'), valores: await b.ev(values) }
  expect('borrador (D17): se conserva al ir al aviso de privacidad y volver, y tras «Elegir otra hora» → perfil → otra hora → /datos', { genericPage, afterBack, profile, again }, {
    genericPage: '/fuera-de-alcance',
    afterBack: { ruta: '/especialistas/elena-ruiz-arellano/datos', valores: ['55 1234 5678', 'Primera consulta', true, true] },
    profile: '/especialistas/elena-ruiz-arellano?escenario=ocupada&fecha=2029-04-24',
    again: { ruta: '/especialistas/elena-ruiz-arellano/datos', valores: ['', 'Segunda opinión', true, false] },
  })
}

const font = (b, px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
// Hojas de texto de la vista: se miden sus palabras partidas (splitWords con
// hojas del árbol, trampa de V2a).
const TEXT_LEAVES = [
  'main h1', '.c-back-link', 'ol[aria-label="Pasos de la reserva"] li', '.c-error-summary__title', '.c-error-summary a', '.c-notice__title', '.c-notice__text p',
  '.c-legend__heading', '.c-legend-help', '.c-field__label', '.c-field__message', '.c-patient-form__link', '.c-checkbox__label', '.c-checkbox__message-text',
  '.c-button__label', '.c-action-bar__note',
].join(', ')
// Estados que se miden en cada ancho: el form con errores (03.2) y la reserva fallida (03.5).
const withErrors = async (b) => {
  await b.go(P031)
  await fillErrors(b)
  await submitBar(b)
}
const failed = async (b) => {
  await b.go(P035)
  await fillValid(b)
  await submitBar(b)
}

// Anchos intermedios: sin desborde; h1, form y envío de la barra en el mismo
// eje en el tramo (la barra reutiliza o-wrapper). Desde lg, la rejilla de
// campos pasa a dos columnas con 672 de interior de tarjeta: 1138 de viewport
// con barra superpuesta, 1153 con la clásica (coste declarado: una columna
// entre 1024 y 1137).
async function widths(b, expect) {
  const mobile = `(() => { const x = (s) => Math.round(document.querySelector(s).getBoundingClientRect().x); return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, h1: x('main h1'), form: x('.c-patient-form'), envio: x('.c-action-bar .c-button'), anchoEnvio: Math.round(document.querySelector('.c-action-bar .c-button').getBoundingClientRect().width) } })()`
  const out = {}
  for (const [w, overlay] of [[320, true], [320, false], [360, true], [608, true], [800, true], [1023, false]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await withErrors(b)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(mobile)
  }
  const grid = `(() => { const g = document.querySelector('.c-patient-form__fields'); return { desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth, columnas: getComputedStyle(g).gridTemplateColumns.split(' ').length, interior: Math.round(g.getBoundingClientRect().width) } })()`
  for (const [w, overlay] of [[1024, true], [1137, true], [1138, true], [1152, false], [1153, false]]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(w, 900)
    await b.go(P031)
    out[`${w} ${overlay ? 'sup' : 'clás'}`] = await b.ev(grid)
  }
  expect('anchos: sin desborde; en móvil y en el tramo, h1, form y envío en el mismo eje; desde lg, dos columnas de campos desde 672 de interior (1138 sup, 1153 clás)', out, {
    '320 sup': { desborde: 0, h1: 16, form: 16, envio: 16, anchoEnvio: 288 },
    '320 clás': { desborde: 0, h1: 16, form: 16, envio: 16, anchoEnvio: 273 },
    '360 sup': { desborde: 0, h1: 16, form: 16, envio: 16, anchoEnvio: 328 },
    '608 sup': { desborde: 0, h1: 16, form: 16, envio: 16, anchoEnvio: 576 },
    '800 sup': { desborde: 0, h1: 96, form: 96, envio: 96, anchoEnvio: 608 },
    '1023 clás': { desborde: 0, h1: 200, form: 200, envio: 200, anchoEnvio: 608 },
    '1024 sup': { desborde: 0, columnas: 1, interior: 558 },
    '1137 sup': { desborde: 0, columnas: 1, interior: 671 },
    '1138 sup': { desborde: 0, columnas: 2, interior: 672 },
    '1152 clás': { desborde: 0, columnas: 1, interior: 671 },
    '1153 clás': { desborde: 0, columnas: 2, interior: 672 },
  })
}

// Texto al 200 % a 320 (inyección en html) con las dos barras, en 03.2 y 03.5:
// sin desborde; solo parten palabras más anchas que su elemento.
async function text200Check(b, expect) {
  const out = {}
  for (const [bar, hidden] of [['sup', true], ['clás', false]]) {
    await b.overlayScrollbars(hidden)
    await b.metrics(320, 900)
    for (const [name, prepare] of [['03.2', withErrors], ['03.5', failed]]) {
      await prepare(b)
      const html = await b.run(text200)
      await settle()
      const words = await b.run(splitWords, TEXT_LEAVES)
      out[`${bar} ${name}`] = { html, desborde: await b.run(overflow), parten: words.split.sort(), pudiendoCaber: words.couldFit.sort() }
      await b.ev(`document.querySelectorAll('style[data-text200]').forEach((s) => s.remove()), true`)
    }
  }
  // Parten «completabas» (el cuerpo del aviso Error) y, con barra clásica,
  // «Confirmar» en la barra (interior de 143, como «Continuar» en V2a): las dos
  // más anchas que su elemento.
  expect('200 % a 320 (las dos barras, 03.2 y 03.5): sin desborde; solo parten palabras más anchas que su elemento', out, {
    'sup 03.2': { html: '32px', desborde: 0, parten: [], pudiendoCaber: [] },
    'sup 03.5': { html: '32px', desborde: 0, parten: ['completabas'], pudiendoCaber: [] },
    'clás 03.2': { html: '32px', desborde: 0, parten: ['Confirmar'], pudiendoCaber: [] },
    'clás 03.5': { html: '32px', desborde: 0, parten: ['completabas'], pudiendoCaber: [] },
  })
}

// Letra del navegador a 24 y 32 (320) y a 20 (375): texto grande respecto al
// viewport, la Action Bar pasa a estática al final del flujo; sin desborde ni
// palabras partidas pudiendo caber.
async function largeText(b, expect) {
  const out = {}
  await b.overlayScrollbars(true)
  for (const [w, px] of [[320, 24], [320, 32], [375, 20]]) {
    await b.metrics(w, 900)
    await font(b, px)
    await withErrors(b)
    const words = await b.run(splitWords, TEXT_LEAVES)
    out[`${w} letra ${px}`] = {
      html: await b.ev('getComputedStyle(document.documentElement).fontSize'),
      barra: await b.ev(`getComputedStyle(document.querySelector('.c-app-layout__bar')).position`),
      barraAlFinal: await b.ev(`document.querySelector('.c-app-layout__bar').getBoundingClientRect().bottom + scrollY >= document.documentElement.scrollHeight - 1`),
      desborde: await b.run(overflow),
      pudiendoCaber: words.couldFit.sort(),
    }
  }
  await font(b, 16)
  const large = (html) => ({ html, barra: 'static', barraAlFinal: true, desborde: 0, pudiendoCaber: [] })
  expect('letra del navegador a 24 y 32 (320) y a 20 (375): Action Bar estática al final del flujo, sin desborde ni palabras partidas pudiendo caber', out, {
    '320 letra 24': large('24px'),
    '320 letra 32': large('32px'),
    '375 letra 20': large('20px'),
  })
}

// forced-colors: el resumen, el campo en error y la casilla en error conservan
// su contorno (el borde se fuerza a un color de sistema, no desaparece).
async function forcedColors(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await b.forcedColors(true)
  await withErrors(b)
  const border = (sel) => `(() => { const c = getComputedStyle(document.querySelector(${JSON.stringify(sel)})); return c.borderTopStyle + ' ' + c.borderTopWidth + ' ' + (c.borderTopColor === 'rgba(0, 0, 0, 0)' ? 'transparente' : 'visible') })()`
  const out = {
    resumen: await b.ev(border('.c-error-summary')),
    campo: await b.ev(border('#correo')),
    select: await b.ev(border('#motivo')),
    casilla: await b.ev(border('.c-checkbox:has(#privacidad) .c-checkbox__box')),
    iconoCampo: await b.ev(`getComputedStyle(document.querySelector('.c-field:has(#correo) .c-field__error-icon')).color === getComputedStyle(document.querySelector('.c-field:has(#correo) .c-field__message')).color`),
  }
  await b.shot('forced-03.2.png', { x: 0, y: 0, width: 375, height: 900 })
  await b.forcedColors(false)
  expect('forced-colors (03.2): resumen, campo, select y casilla en error conservan el contorno; el icono del campo toma el color forzado del texto', out, {
    resumen: 'solid 2px visible',
    campo: 'solid 2px visible',
    select: 'solid 2px visible',
    casilla: 'solid 2px visible',
    iconoCampo: true,
  })
}

// Estructura: título (D15), encabezados (D14: legends con h2), grupos, ayuda
// por aria-describedby, required solo en los obligatorios, noValidate, tipos y
// autocompletado; en escritorio, «Tu cita» como section dentro del form. El h2
// del resumen en el árbol de accesibilidad al recibir el foco.
async function structure(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 900)
  await withErrors(b)
  const common = `(() => {
    const form = document.querySelector('form.c-patient-form')
    const fs = [...form.querySelectorAll('fieldset')]
    return {
      titulo: document.title,
      encabezados: [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => h.tagName + ' ' + h.textContent),
      grupos: fs.map((f) => f.querySelector('legend').textContent + (f.getAttribute('aria-describedby') ? ' · ' + document.getElementById(f.getAttribute('aria-describedby')).textContent : '')),
      obligatorios: [...form.querySelectorAll('[required]')].map((e) => e.id),
      noValidate: form.noValidate,
      controles: [...form.querySelectorAll('input, select')].map((e) => e.id + ' ' + (e.type ?? '') + ' ' + (e.getAttribute('autocomplete') ?? '-')),
      pasos: document.querySelector('ol[aria-label="Pasos de la reserva"] [aria-current="step"]')?.textContent,
    }
  })()`
  const mobile = await b.ev(common)
  await b.send('Accessibility.enable')
  const { nodes } = await b.send('Accessibility.getFullAXTree')
  const h2 = nodes.find((n) => n.role?.value === 'heading' && n.name?.value === 'Corrige 3 campos para continuar')
  const prop = (n, k) => n?.properties?.find((p) => p.name === k)?.value?.value
  const ax = { rol: h2?.role?.value, nombre: h2?.name?.value, nivel: prop(h2, 'level'), enfocado: prop(h2, 'focused') ?? false }
  await b.metrics(1440, 900)
  await b.go(P031)
  const desktop = await b.ev(`(() => { const s = document.querySelector('.c-booking-summary'); return { encabezados: [...document.querySelectorAll('main h1, main h2, main h3')].map((h) => h.tagName + ' ' + h.textContent), seccion: s.tagName + ' · ' + document.getElementById(s.getAttribute('aria-labelledby')).textContent + ' · en el form: ' + Boolean(s.closest('form')), aside: document.querySelectorAll('aside').length, envio: document.querySelector('.c-booking-summary__actions .c-button').type + ' · ' + document.getElementById(document.querySelector('.c-booking-summary__actions .c-button').getAttribute('aria-describedby')).textContent } })()`)
  expect('estructura (03.2 móvil y 03.3 escritorio) y el h2 del resumen en el árbol de accesibilidad al recibir el foco', { mobile, ax, desktop }, {
    mobile: {
      titulo: 'Tus datos · Salvia',
      encabezados: ['H1 Tus datos', 'H2 Corrige 3 campos para continuar', 'H2 Datos del paciente', 'H2 Antes de confirmar'],
      grupos: ['Datos del paciente · Todos los campos son obligatorios salvo los marcados como opcionales', 'Antes de confirmar'],
      obligatorios: ['nombre', 'correo', 'motivo', 'privacidad'],
      noValidate: true,
      controles: ['nombre text name', 'correo email email', 'telefono tel tel-national', 'motivo select-one -', 'privacidad checkbox -', 'recordatorio checkbox -'],
      pasos: '2Tus datos',
    },
    ax: { rol: 'heading', nombre: 'Corrige 3 campos para continuar', nivel: 2, enfocado: true },
    desktop: {
      encabezados: ['H1 Tus datos', 'H2 Datos del paciente', 'H2 Antes de confirmar', 'H2 Tu cita'],
      seccion: 'SECTION · Tu cita · en el form: true',
      aside: 0,
      envio: 'submit · Recibirás un correo de confirmación',
    },
  })
}

// Contraprueba de noValidate: sin él, con required en los obligatorios, el
// navegador bloquea el envío (sin evento submit) y el resumen no aparece.
async function noValidateCheck(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  const out = {}
  for (const [name, remove] of [['con noValidate', false], ['sin noValidate (contraprueba)', true]]) {
    await b.go(P031)
    await fillErrors(b)
    if (remove) await b.ev(`document.querySelector('form.c-patient-form').noValidate = false, true`)
    await submitBar(b)
    out[name] = { resumen: await b.ev(`Boolean(document.querySelector('.c-error-summary'))`), foco: await b.ev(focused) }
  }
  expect('noValidate: con él, el resumen recibe el foco; sin él (contraprueba), el navegador bloquea el envío en el primer campo inválido y no hay resumen', out, {
    'con noValidate': { resumen: true, foco: 'H2 Corrige 3 campos para continuar' },
    'sin noValidate (contraprueba)': { resumen: false, foco: 'INPUT #correo' },
  })
}

// Intro en un campo: envío implícito por el botón por defecto del form. En
// móvil es «Confirmar cita» de la barra (form=, fuera del form); en escritorio,
// el de la sección. Contraprueba: un submit dentro del form, antes, se lleva el
// envío.
async function defaultButton(b, expect) {
  const submitter = `new Promise((resolve) => { document.addEventListener('submit', (e) => resolve((e.submitter?.id || e.submitter?.textContent) + ' · dentro del form: ' + Boolean(e.submitter?.closest('form'))), { capture: true, once: true }) })`
  const out = {}
  for (const [name, width, inject] of [['móvil', 375, false], ['móvil (contraprueba)', 375, true], ['escritorio', 1440, false]]) {
    await b.overlayScrollbars(true)
    await b.metrics(width, 900)
    await b.go(P031)
    if (inject) await b.ev(`(() => { const x = document.createElement('button'); x.type = 'submit'; x.id = 'intruso'; x.textContent = 'intruso'; document.querySelector('form.c-patient-form').prepend(x); return true })()`)
    await b.ev(`window.__submitter = ${submitter}, true`)
    await b.ev(`document.getElementById('nombre').focus(), true`)
    await b.enter()
    await settle()
    out[name] = await b.ev('window.__submitter')
  }
  expect('Intro en un campo envía por el botón por defecto (móvil: el de la barra, con form=; escritorio: el de la sección); contraprueba: un submit anterior dentro del form se lleva el envío', out, {
    móvil: 'Confirmar cita · dentro del form: false',
    'móvil (contraprueba)': 'intruso · dentro del form: true',
    escritorio: 'Confirmar cita · dentro del form: true',
  })
}

// Volver a enviar (opción A: los errores solo cambian al enviar). Corregido el
// correo y marcada la casilla sin enviar, el mensaje de la casilla sigue en
// error; al enviar, «Corrige 1 campo para continuar» (motivo) con el foco en el
// h2; con todo corregido, la reserva.
async function resubmit(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  await withErrors(b)
  await typeInto(b, 'correo', 'karla.sanchez@ejemplo.com')
  await clickSel(b, '.c-checkbox__row:has(#privacidad)')
  const beforeSubmit = await b.ev(`[...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.id + (e.checked ? ' (marcada)' : ''))`)
  await submitBar(b)
  const second = { foco: await b.ev(focused), enlaces: await b.ev(`[...document.querySelectorAll('.c-error-summary a')].map((a) => a.textContent)`), invalidos: await b.ev(`[...document.querySelectorAll('[aria-invalid="true"]')].map((e) => e.id)`) }
  await chooseReason(b, 'Seguimiento')
  await submitBar(b)
  await sleep(300)
  expect('volver a enviar: los errores no cambian hasta enviar (la casilla marcada sigue en error); con uno pendiente, «Corrige 1 campo» con el foco en el h2; con todo corregido, reserva', { beforeSubmit, second, ruta: await b.ev('location.pathname') }, {
    beforeSubmit: ['correo', 'motivo', 'privacidad (marcada)'],
    second: { foco: 'H2 Corrige 1 campo para continuar', enlaces: ['Motivo de consulta'], invalidos: ['motivo'] },
    ruta: '/citas/c1/confirmada',
  })
}

// Cruce de lg (D7): con el foco en un control que cambia (el envío de la barra
// o el de la sección), el foco va al h1; el resumen de errores se conserva.
async function crossLg(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  await b.metrics(1000, 900)
  await withErrors(b)
  await b.ev(`document.querySelector('.c-action-bar .c-button').focus(), true`)
  await b.metrics(1100, 900)
  await settle()
  out.aEscritorio = { foco: await b.ev(focused), resumen: await b.ev(`Boolean(document.querySelector('.c-error-summary'))`), seccion: await b.ev(`Boolean(document.querySelector('.c-booking-summary'))`) }
  await b.ev(`document.querySelector('.c-booking-summary__actions .c-button').focus(), true`)
  await b.metrics(1000, 900)
  await settle()
  out.aMovil = { foco: await b.ev(focused), resumen: await b.ev(`Boolean(document.querySelector('.c-error-summary'))`), barra: await b.ev(`Boolean(document.querySelector('.c-action-bar'))`) }
  expect('cruce de lg con el foco en el envío: al h1 en los dos sentidos; el resumen de errores se conserva', out, {
    aEscritorio: { foco: 'H1 #contenido', resumen: true, seccion: true },
    aMovil: { foco: 'H1 #contenido', resumen: true, barra: true },
  })
}

// Orden de Tab en móvil: salto, header, retroceso, los campos y el envío (la
// barra va tras main).
async function tabOrder(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812)
  await b.go(P031)
  await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
  const order = []
  for (let i = 0; i < 14; i++) {
    await b.tab()
    order.push(await b.ev(focused))
  }
  expect('orden de Tab en móvil: salto, header, retroceso, campos, aviso, casillas y «Confirmar cita»', order, [
    'A Saltar al contenido', 'A Salvia', 'A Ayuda', 'A Tu cita', 'INPUT #nombre', 'INPUT #correo', 'INPUT #telefono', 'SELECT #motivo',
    'A Leer el aviso de privacidad', 'INPUT #privacidad', 'INPUT #recordatorio', 'BUTTON Confirmar cita', 'BODY', 'A Saltar al contenido',
  ])
}

// Navegación en cliente 02.4 → 03.1 («Continuar con tus datos», clic real).
async function navigation(b, expect) {
  await b.metrics(375, 900, 1)
  const to = `${DATOS}?fecha=2029-04-24&hora=10%3A30`
  const { afterClient, afterReload, ...nav } = await clientNavigation(b, { from: '/especialistas/elena-ruiz-arellano/confirmar?fecha=2029-04-24&hora=10%3A30', link: 'Continuar con tus datos', to, park: true })
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-datos-cliente-375.png', afterClient)
    await b.saveBase64('navegacion-datos-recarga-375.png', afterReload)
  }
  expect(
    'navegación en cliente 02.4 → 03.1 («Continuar con tus datos», clic real, 375): sin restos en los píxeles, y el resto de pintado explicado o mitigado (✗ declarado: DESIGN.md, Pendientes, «Resto de pintado»)',
    { ...nav, explicado: false },
    { ruta: to, sinRecarga: true, estado: null, pixelesDistintosDeLaRecarga: 0, cuatroSegundosDespues: 0, explicado: true },
  )
  await b.metrics(1280, 900, 1)
}

export default async function run(b, expect) {
  await figmaPairs(b, expect)
  await desktopPairs(b, expect)
  await asidePadding(b, expect)
  await summaryFlow(b, expect)
  await failedFlow(b, expect)
  const position = await failedFocusPosition(b)
  // El título, [arriba, abajo], frente al límite (arriba de la barra en móvil,
  // alto de la vista en escritorio). En 03.6, scrollY 62 desde que el
  // breadcrumb va a space-4 (antes 54): la página baja 8 y el título queda en
  // el mismo sitio de la vista.
  expect('foco del aviso fallido: el título queda en la vista y, en móvil, por encima de la barra', position, {
    '03.5 superpuesta': { foco: true, titulo: [269, 293], limite: 738, visible: true, scrollY: 0 },
    '03.5 clásica': { foco: true, titulo: [269, 293], limite: 738, visible: true, scrollY: 0 },
    '03.6': { foco: true, titulo: [189, 213], limite: 900, visible: true, scrollY: 62 },
  })
  await validFlow(b, expect)
  expect('envío válido: ningún commit ni frame pinta el form reiniciado antes del cambio de ruta (la vista no se suscribe al borrador)', await resetProbe(b), RESET_EXPECTED)
  await draftKept(b, expect)
  await widths(b, expect)
  await text200Check(b, expect)
  await largeText(b, expect)
  await forcedColors(b, expect)
  await structure(b, expect)
  await noValidateCheck(b, expect)
  await defaultButton(b, expect)
  await resubmit(b, expect)
  await crossLg(b, expect)
  await tabOrder(b, expect)
  await navigation(b, expect)
}

// Flujos de foco contra la preview (sin StrictMode).
export async function previewFlows(b, expect) {
  await summaryFlow(b, expect)
  await failedFlow(b, expect)
  expect('envío válido (preview): ningún commit ni frame pinta el form reiniciado antes del cambio de ruta', await resetProbe(b), RESET_EXPECTED)
  await crossLg(b, expect)
}
