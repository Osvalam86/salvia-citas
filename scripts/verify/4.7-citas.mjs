// 4.7 Citas y diálogos: Appointment Card (bloque A), Dialog y el flujo de
// cancelar (bloque B). Todo en /kit/citas, con la estructura de Mis citas:
// Próximas (Ruiz, Molina, Cortés) y Pasadas (Ibarra, Serrano).
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { typeErrorLines } from './static.mjs'

const PAGE = '/kit/citas'
const cards = "['kit-proximas', 'kit-pasadas'].flatMap((id) => [...document.getElementById(id).children])"
const ax = (b) => b.send('Accessibility.getFullAXTree').then((r) => r.nodes.filter((n) => !n.ignored))
const key = (b, k, code, vk, modifiers = 0) =>
  b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, modifiers }).then(() =>
    b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, modifiers }),
  )
const escape = (b) => key(b, 'Escape', 'Escape', 27)

// Alto de cada tarjeta, ancho de sus acciones, avatar y padding.
const cardSizes = `${cards}.map((li) => {
  const c = li.querySelector('.c-appointment-card__card'), a = li.querySelector('.c-appointment-card__action')
  return Math.round(c.getBoundingClientRect().height) + ' acciones ' + Math.round(a.getBoundingClientRect().width) + ' avatar ' + li.querySelector('.c-avatar').getBoundingClientRect().width + ' padding ' + getComputedStyle(c).paddingTop
})`
const withWidth = async (b, width, expr, extra = '') => {
  await b.style(`#kit-proximas, #kit-pasadas { inline-size: ${width}px } ${extra}`)
  await sleep(100)
  const value = await b.ev(expr)
  await b.unstyle()
  return value
}
// Líneas de un texto: alto entre interlineado.
const lines = (selector, index) => `(() => { const e = ${cards}[${index}].querySelector('${selector}'), r = document.createRange(); r.selectNodeContents(e); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size })()`

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.metrics(375, 900, 1)

  // --- Geometría contra las instancias de Figma --------------------------------------------------------
  // 04.2, 04.3 y 04.8 (Mobile, li de 343): Confirmed 324, Pending 310, Past y
  // Cancelled 262 (Molina Cancelled en 04.8, 262). En la columna real de 375,
  // con barra superpuesta como en Figma. Con la clásica el li mide 328 y la
  // nota de Pending pasa a tres líneas (330).
  const at375 = {}
  for (const overlay of [true, false]) {
    await b.overlayScrollbars(overlay)
    await b.go(PAGE)
    at375[overlay ? 'superpuesta' : 'clásica'] = await b.ev(cardSizes)
  }
  await b.overlayScrollbars(false)
  expect('Stacked en la columna de 375 como en 04.2, 04.3 y 04.8 (li 343 con barra superpuesta): acciones a ancho completo, avatar 48, padding 16', at375, {
    superpuesta: [
      '324 acciones 309 avatar 48 padding 16px',
      '310 acciones 309 avatar 48 padding 16px',
      '324 acciones 309 avatar 48 padding 16px',
      '262 acciones 309 avatar 48 padding 16px',
      '262 acciones 309 avatar 48 padding 16px',
    ],
    clásica: [
      '324 acciones 294 avatar 48 padding 16px',
      '330 acciones 294 avatar 48 padding 16px',
      '324 acciones 294 avatar 48 padding 16px',
      '262 acciones 294 avatar 48 padding 16px',
      '262 acciones 294 avatar 48 padding 16px',
    ],
  })
  await b.metrics(1280, 900, 1)
  await b.go(PAGE)
  // 04.5, 04.6, 04.7 y 04.9 (Desktop, lista de 848): 212, Pending 240.
  expect('Row a 848 como en 04.5–04.7 y 04.9: acciones 224, avatar 48, padding 24', await withWidth(b, 848, cardSizes), [
    '212 acciones 224 avatar 48 padding 24px',
    '240 acciones 224 avatar 48 padding 24px',
    '212 acciones 224 avatar 48 padding 24px',
    '212 acciones 224 avatar 48 padding 24px',
    '212 acciones 224 avatar 48 padding 24px',
  ])
  const layout = `${cards}.map((li) => Math.round(li.querySelector('.c-appointment-card__action').getBoundingClientRect().width))`
  expect('umbral: li de 639 → Stacked (acciones 605), de 640 → Row (224)', { 639: await withWidth(b, 639, layout), 640: await withWidth(b, 640, layout) }, { 639: Array(5).fill(605), 640: Array(5).fill(224) })
  await b.style('.c-appointment-card { container-type: normal !important } #kit-proximas, #kit-pasadas { inline-size: 848px }')
  expect('contraprueba: sin contenedor en el li, a 848 se queda en Stacked', (await b.ev(cardSizes))[0], '324 acciones 814 avatar 48 padding 16px')
  await b.unstyle()

  // Por qué no 34rem: con Row a 544, al cuerpo le quedan 246 y parten la
  // fecha de Cortés (274) y la ubicación de Molina (icono + 268); en Stacked a
  // 543, y en Row a 640, van en una línea.
  const forcedRow = '.c-appointment-card__card { grid-template-columns: minmax(0, 1fr) 14rem !important; gap: var(--space-5) !important; padding: var(--space-5) !important }'
  const breakage = `({ fechaCortes: ${lines('.c-appointment-card__when', 2)}, ubicacionMolina: ${lines('.c-appointment-card__text', 1)}, cuerpo: Math.round(${cards}[2].querySelector('.c-appointment-card__body').getBoundingClientRect().width) })`
  expect('umbral de 34rem descartado: líneas de la fecha de Cortés y de la ubicación de Molina', {
    'Row a 544 (34rem, forzado)': await withWidth(b, 544, breakage, forcedRow),
    'Stacked a 543': await withWidth(b, 543, breakage),
    'Row a 640 (40rem)': await withWidth(b, 640, breakage),
  }, {
    'Row a 544 (34rem, forzado)': { fechaCortes: 2, ubicacionMolina: 2, cuerpo: 246 },
    'Stacked a 543': { fechaCortes: 1, ubicacionMolina: 1, cuerpo: 509 },
    'Row a 640 (40rem)': { fechaCortes: 1, ubicacionMolina: 1, cuerpo: 342 },
  })
  // Coste declarado: la nota de Pending (485,4) cabe en una línea desde 784.
  const pending = `Math.round(${cards}[1].querySelector('.c-appointment-card__card').getBoundingClientRect().height) + ' nota ' + ${lines('.c-appointment-card__note', 1)} + 'l'`
  expect('Pending en Row: la nota en dos líneas y la tarjeta en 260 hasta 783; desde 784, 240', { 640: await withWidth(b, 640, pending), 783: await withWidth(b, 783, pending), 784: await withWidth(b, 784, pending) }, { 640: '260 nota 2l', 783: '260 nota 2l', 784: '240 nota 1l' })

  // --- Semántica ---------------------------------------------------------------------------------------
  const nodes = await ax(b)
  expect('h3 de cada tarjeta: la fecha, con <time datetime>', {
    h3: nodes.filter((n) => n.role?.value === 'heading' && n.properties?.some((p) => p.name === 'level' && p.value.value === 3)).map((n) => n.name.value),
    time: await b.ev(`${cards}.map((li) => li.querySelector('h3 > time').getAttribute('datetime'))`),
  }, {
    h3: ['Martes 24 de abril · 10:30', 'Martes 8 de mayo · 17:00', 'Miércoles 16 de mayo · 09:30', 'Lunes 12 de marzo · 09:00', 'Jueves 22 de febrero · 12:30'],
    time: ['2029-04-24T10:30', '2029-05-08T17:00', '2029-05-16T09:30', '2029-03-12T09:00', '2029-02-22T12:30'],
  })
  expect('acciones por estado: todas Secondary, nombre por la etiqueta y descripción por la fecha de su tarjeta', {
    ax: nodes.filter((n) => ['link', 'button'].includes(n.role?.value) && /^(Reprogramar|Cancelar cita|Agendar)/.test(n.name?.value ?? '')).map((n) => `${n.role.value} «${n.name.value}» · ${n.description?.value}`),
    secundarias: await b.ev(`${cards}.flatMap((li) => [...li.querySelectorAll('.c-appointment-card__action')]).every((a) => a.classList.contains('c-button--secondary'))`),
    popup: await b.ev(`[...document.querySelectorAll('.c-appointment-card button')].map((x) => x.getAttribute('aria-haspopup') + ' ' + x.type)`),
    destinos: await b.ev(`[...document.querySelectorAll('.c-appointment-card a')].map((a) => a.getAttribute('href'))`),
  }, {
    ax: [
      'link «Reprogramar» · Martes 24 de abril · 10:30',
      'button «Cancelar cita» · Martes 24 de abril · 10:30',
      'button «Cancelar cita» · Martes 8 de mayo · 17:00',
      'link «Reprogramar» · Miércoles 16 de mayo · 09:30',
      'button «Cancelar cita» · Miércoles 16 de mayo · 09:30',
      'link «Agendar seguimiento» · Lunes 12 de marzo · 09:00',
      'link «Agendar de nuevo» · Jueves 22 de febrero · 12:30',
    ],
    secundarias: true,
    popup: ['dialog button', 'dialog button', 'dialog button'],
    destinos: ['/mis-citas/ruiz-2029-04-24/reprogramar', '/mis-citas/cortes-2029-05-16/reprogramar', '/especialistas/tomas-ibarra-solis', '/especialistas/paula-serrano-vidal'],
  })
  expect('avatar decorativo y nota solo en Pending', await b.ev(`${cards}.map((li) => li.querySelector('.c-avatar').getAttribute('aria-hidden') + ' ' + Boolean(li.querySelector('.c-appointment-card__note')))`), ['true false', 'true true', 'true false', 'true false', 'true false'])
  expect('fecha: heading-sm con cifras tabulares; Cancelled en secundario y tachada', await b.ev(`${cards}.map((li) => { const s = getComputedStyle(li.querySelector('h3')); return s.fontSize + ' ' + s.fontVariantNumeric + ' ' + s.color + ' ' + s.textDecorationLine })`), [
    ...Array(4).fill('20px tabular-nums rgb(32, 30, 25) none'),
    '20px tabular-nums rgb(110, 104, 88) line-through',
  ])
  expect('nombre body-strong en tinta; especialidad, ubicación y nota en secundario', await b.ev(`(() => { const li = ${cards}[1], s = (sel) => { const c = getComputedStyle(li.querySelector(sel)); return c.fontSize + ' ' + c.fontWeight + ' ' + c.color }; return [s('.c-appointment-card__name'), s('.c-appointment-card__specialty'), s('.c-appointment-card__location'), s('.c-appointment-card__note')] })()`), [
    '16px 600 rgb(32, 30, 25)',
    '16px 400 rgb(110, 104, 88)',
    '14px 400 rgb(110, 104, 88)',
    '14px 400 rgb(110, 104, 88)',
  ])

  // --- Teclado ------------------------------------------------------------------------------------------
  const action = (card, i) => `${cards}[${card}].querySelectorAll('.c-appointment-card__action')[${i}]`
  await b.tabTo(action(0, 0))
  const order = []
  for (let i = 0; i < 3; i++) {
    await b.tab()
    order.push(await b.ev(`document.activeElement.textContent + ' · ' + document.activeElement.closest('li').querySelector('h3').textContent`))
  }
  expect('Tab: la fecha no es un tope; de acción en acción, en el orden visual', order, ['Cancelar cita · Martes 24 de abril · 10:30', 'Cancelar cita · Martes 8 de mayo · 17:00', 'Reprogramar · Miércoles 16 de mayo · 09:30'])
  expect('foco en una acción: anillo general, radio 10', await b.ev("(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.matches(':focus-visible') + ' ' + s.outlineStyle + ' ' + s.outlineWidth + ' desfase ' + s.outlineOffset })()"), 'true solid 2px desfase 2px')

  // --- forced-colors ------------------------------------------------------------------------------------
  await b.forcedColors(true)
  await b.go(PAGE)
  expect('forced-colors: borde de la tarjeta, tachado de Cancelled, tag punteado e iconos en el color forzado', await b.ev(`(() => {
    const s = (el) => getComputedStyle(el), all = ${cards}
    return {
      tarjeta: s(all[0].querySelector('.c-appointment-card__card')).borderTopStyle + ' ' + s(all[0].querySelector('.c-appointment-card__card')).borderTopColor,
      cancelada: s(all[4].querySelector('h3')).textDecorationLine,
      tag: s(all[4].querySelector('.c-status-tag')).borderTopStyle,
      iconos: [...new Set(all.flatMap((li) => [...li.querySelectorAll('svg')]).map((i) => s(i).color))],
    }
  })()`), { tarjeta: 'solid rgb(255, 255, 255)', cancelada: 'line-through', tag: 'dashed', iconos: ['rgb(255, 255, 255)'] })
  await b.metrics(1280, 900, 2)
  await b.shot('forced-citas.png', await b.rect("document.getElementById('kit-proximas').closest('.c-kit')"))
  await b.forcedColors(false)
  await b.metrics(1280, 900, 1)

  // --- 320 con las dos barras, al 100 % y al 200 % -----------------------------------------------------
  const SCOPE = '.c-appointment-card__when, .c-appointment-card__note, .c-appointment-card__name, .c-appointment-card__specialty, .c-appointment-card__location, .c-appointment-card__action, .c-status-tag'
  // Avatar encima del nombre (fila partida) o al lado, en la tarjeta de Ruiz.
  const who = `(() => { const li = ${cards}[0], a = li.querySelector('.c-avatar').getBoundingClientRect(), p = li.querySelector('.c-appointment-card__person').getBoundingClientRect(); return (a.bottom <= p.top ? 'encima' : 'al lado') + ' ' + Math.round(p.width) })()`
  const narrow = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900, 1)
    await b.go(PAGE)
    for (const zoom of ['100 %', '200 %']) {
      if (zoom === '200 %') {
        await b.run(text200)
        await sleep(300)
      }
      const words = await b.run(splitWords, SCOPE)
      narrow[`${overlay ? 'superpuesta' : 'clásica'} ${zoom}`] = { desborde: await b.run(overflow), pudiendoCaber: words.couldFit, avatar: await b.ev(who), partidas: words.split }
    }
  }
  // Al 200 % parten solo palabras más anchas que su elemento: el interior de
  // la tarjeta mide 175 (clásica) o 190 (superpuesta), y el de la acción, 77
  // o 92 (límite de UI/Button, DESIGN.md § Controles con icono y etiqueta).
  expect('320: sin scroll horizontal ni palabras partidas pudiendo caber; al 200 % el avatar sube antes de que parta el nombre', narrow, {
    'clásica 100 %': { desborde: 0, pudiendoCaber: [], avatar: 'al lado 179', partidas: [] },
    'clásica 200 %': { desborde: 0, pudiendoCaber: [], avatar: 'encima 175', partidas: ['Confirmada', 'Reprogramar', 'Cancelar', 'Dermatología', 'Miércoles', 'Oftalmología', 'Agendar', 'seguimiento', 'Cancelada', 'nuevo'] },
    'superpuesta 100 %': { desborde: 0, pudiendoCaber: [], avatar: 'al lado 194', partidas: [] },
    'superpuesta 200 %': { desborde: 0, pudiendoCaber: [], avatar: 'encima 190', partidas: ['Confirmada', 'Reprogramar', 'Cancelar', 'Dermatología', 'Oftalmología', 'Agendar', 'seguimiento', 'nuevo'] },
  })
  await b.overlayScrollbars(false)
  await b.go(PAGE)
  await b.run(text200)
  await b.style('.c-appointment-card__who { flex-wrap: nowrap !important }')
  await sleep(200)
  expect('contraprueba: sin flex-wrap en la fila del avatar, al 200 % a 320 al nombre le quedan 55 y parten todos', { avatar: await b.ev(who), partidas: (await b.run(splitWords, '.c-appointment-card__name')).split }, {
    avatar: 'al lado 55',
    partidas: ['Dra.', 'Elena', 'Ruiz', 'Arellano', 'Andrés', 'Molina', 'Paz', 'Iván', 'Cortés', 'Naranjo', 'Tomás', 'Ibarra', 'Solís', 'Paula', 'Serrano', 'Vidal'],
  })
  await b.unstyle()
  expect('límite: interior de la acción al 200 % a 320 (clásica / superpuesta)', await (async () => {
    const out = []
    for (const overlay of [false, true]) {
      await b.overlayScrollbars(overlay)
      await b.go(PAGE)
      await b.run(text200)
      await sleep(200)
      out.push(await b.ev(`(() => { const x = ${action(0, 0)}, s = getComputedStyle(x); return Math.round(x.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)) })()`))
    }
    return out
  })(), [77, 92])
  await b.overlayScrollbars(false)
  for (const width of [375, 1280]) {
    await b.metrics(width, 900, 2)
    await b.go(PAGE)
    await b.shot(`citas-${width}.png`, await b.rect("document.getElementById('kit-proximas').closest('.c-kit')"))
  }
  await b.metrics(1280, 900, 1)

  // --- Navegación en cliente con clic real --------------------------------------------------------------
  // El arnés navega con carga completa; aquí se llega a /kit/citas con un clic
  // en el enlace del catálogo y se sale con un clic en «Reprogramar». Una
  // marca en window sobrevive solo si no hubo carga completa.
  const clickOn = async (expr) => {
    const { x, y } = await b.ev(`(() => { const a = ${expr}; a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
    await b.click(x, y)
  }
  const waitFor = async (path) => {
    for (let i = 0; i < 50 && (await b.ev('location.pathname')) !== path; i++) await sleep(100)
    await sleep(300)
  }
  await b.go('/kit')
  await b.ev('window.__verifyMark = true')
  await clickOn("[...document.querySelectorAll('a')].find((e) => e.textContent === 'Ver citas y diálogos')")
  await waitFor(PAGE)
  const arrival = await b.ev("({ ruta: location.pathname, sinRecarga: window.__verifyMark === true, tarjetas: document.querySelectorAll('.c-appointment-card').length })")
  // Foco de ruta (D12, useRouteFocus, T1). Contraprueba manual en
  // docs/verificacion.md: sin el hook, el foco queda en body.
  const focused = "(() => { const a = document.activeElement; return a.tagName + (a.id ? '#' + a.id : '') })()"
  expect('foco tras la navegación en cliente: el h1 de la vista', await b.ev(focused), 'H1#contenido')
  // «Reprogramar» llega a la ruta de la fase 5 (provisional desde T1).
  await clickOn(action(2, 0))
  await waitFor('/mis-citas/cortes-2029-05-16/reprogramar')
  expect('clic real: /kit → /kit/citas y «Reprogramar» de Cortés, sin carga completa; el foco va al h1 de la reprogramación', {
    llegada: arrival,
    reprogramar: await b.ev(`({ ruta: location.pathname, sinRecarga: window.__verifyMark === true, h1: document.querySelector('h1').textContent, foco: ${focused} })`),
  }, {
    llegada: { ruta: PAGE, sinRecarga: true, tarjetas: 5 },
    reprogramar: { ruta: '/mis-citas/cortes-2029-05-16/reprogramar', sinRecarga: true, h1: 'Reprogramar cita', foco: 'H1#contenido' },
  })

  // === Bloque B · Dialog y flujo de cancelar ===========================================================
  await b.metrics(1280, 900, 1)
  await b.go(PAGE)
  const DIALOG = "document.querySelector('.c-dialog')"
  const trigger = (name) => `[...document.querySelectorAll('.c-appointment-card')].find((li) => li.querySelector('.c-appointment-card__name').textContent === ${JSON.stringify(name)}).querySelector('button')`
  const dialogButton = (label) => `[...${DIALOG}.querySelectorAll('button')].find((x) => x.textContent === ${JSON.stringify(label)})`
  const state = `(() => { const d = ${DIALOG}, a = document.activeElement, li = a.closest('li'); return { abierto: d.open, foco: a.tagName + (a.getAttribute('tabindex') ? '[tabindex=' + a.getAttribute('tabindex') + ']' : '') + ' «' + a.textContent.trim().slice(0, 30) + '»' + (li ? ' · ' + li.querySelector('h3').textContent : '') } })()`
  const openFor = async (name) => {
    await b.tabTo(trigger(name))
    await b.enter()
    await sleep(200)
  }
  const shiftTab = () => key(b, 'Tab', 'Tab', 9, 8)
  const lists = "Object.fromEntries(['kit-proximas', 'kit-pasadas'].map((id) => [id.slice(4), [...(document.getElementById(id)?.children ?? [])].map((li) => li.querySelector('.c-appointment-card__name').textContent.split(' ').at(-2) + ' ' + li.querySelector('.c-status-tag').textContent)]))"

  // --- Apertura, foco inicial y árbol de accesibilidad --------------------------------------------------
  await openFor('Dr. Andrés Molina Paz')
  expect('Intro en «Cancelar cita» de Molina: abre y el foco va a «Mantener mi cita», con anillo', {
    ...(await b.ev(state)),
    anillo: await b.ev("(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.matches(':focus-visible') + ' ' + s.outlineStyle + ' ' + s.outlineWidth + ' desfase ' + s.outlineOffset })()"),
    modal: await b.ev(`${DIALOG}.matches(':modal')`),
  }, { abierto: true, foco: 'BUTTON «Mantener mi cita»', anillo: 'true solid 2px desfase 2px', modal: true })
  // Copia de Figma 04.3 (284:6558) y 04.6 (284:7114): la de Molina, literal.
  const openTree = await ax(b)
  expect('árbol AX con el diálogo abierto: alertdialog con nombre y descripción; el contenido de main, ignorado (inert)', {
    dialogo: openTree.filter((n) => n.role?.value === 'alertdialog').map((n) => `«${n.name.value}» · ${n.description?.value} · modal ${n.properties?.find((p) => p.name === 'modal')?.value.value}`),
    encabezados: openTree.filter((n) => n.role?.value === 'heading').map((n) => n.name.value),
    botones: openTree.filter((n) => n.role?.value === 'button').map((n) => n.name.value),
  }, {
    dialogo: ['«¿Cancelar esta cita?» · Martes 8 de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer. · modal true'],
    encabezados: ['¿Cancelar esta cita?'],
    botones: ['Mantener mi cita', 'Cancelar cita'],
  })

  // --- Teclado dentro del diálogo ------------------------------------------------------------------------
  // Tab y Mayús+Tab no llegan nunca a la página: el foco recorre el diálogo
  // (y el marco del navegador, que en headless es body).
  const where = `(() => { const a = document.activeElement; return ${DIALOG}.contains(a) ? a.textContent : 'fuera: ' + a.tagName })()`
  const cycle = []
  for (let i = 0; i < 4; i++) {
    await b.tab()
    cycle.push(await b.ev(where))
  }
  for (let i = 0; i < 4; i++) {
    await shiftTab()
    cycle.push(await b.ev(where))
  }
  // «fuera: BODY» es el paso por el marco del navegador (en headless no hay
  // marco y el foco queda en el documento): nunca en un elemento de la página.
  expect('Tab ×4 y Mayús+Tab ×4 desde «Mantener mi cita»: nunca en la página', cycle, ['Cancelar cita', 'fuera: BODY', 'Mantener mi cita', 'Cancelar cita', 'Mantener mi cita', 'fuera: BODY', 'Cancelar cita', 'Mantener mi cita'])
  await escape(b)
  await sleep(200)
  expect('Escape: cierra, el foco vuelve al disparador y la cita sigue en Próximas', { ...(await b.ev(state)), listas: await b.ev(lists) }, {
    abierto: false,
    foco: 'BUTTON «Cancelar cita» · Martes 8 de mayo · 17:00',
    listas: { proximas: ['Ruiz Confirmada', 'Molina Por confirmar', 'Cortés Confirmada'], pasadas: ['Ibarra Realizada', 'Serrano Cancelada'] },
  })
  await openFor('Dr. Andrés Molina Paz')
  await b.enter()
  await sleep(200)
  expect('Intro en «Mantener mi cita»: cierra y el foco vuelve al disparador', await b.ev(state), { abierto: false, foco: 'BUTTON «Cancelar cita» · Martes 8 de mayo · 17:00' })
  // Un clic en una zona no enfocable del diálogo (velo o panel) lleva el foco
  // al propio <dialog>, sin anillo (ratón); el siguiente Tab vuelve a Mantener.
  await openFor('Dr. Andrés Molina Paz')
  const clickState = `({ ...${state}, anillo: document.activeElement.matches(':focus-visible') })`
  await b.click(8, 8)
  await sleep(200)
  const afterVeil = await b.ev(clickState)
  await b.click(640, 450)
  await sleep(200)
  const afterPanel = await b.ev(clickState)
  await b.tab()
  expect('clic en el velo y en el panel: no cierra (alertdialog destructivo); Tab vuelve a Mantener', { velo: afterVeil, panel: afterPanel, tab: await b.ev(where) }, {
    velo: { abierto: true, foco: 'DIALOG «¿Cancelar esta cita?Martes 8 d»', anillo: false },
    panel: { abierto: true, foco: 'DIALOG «¿Cancelar esta cita?Martes 8 d»', anillo: false },
    tab: 'Mantener mi cita',
  })

  // Contraprueba del inert: con show() (no modal) el contenido de main vuelve al árbol.
  await escape(b)
  await sleep(200)
  await b.ev(`${DIALOG}.show(), true`)
  await sleep(200)
  expect('contraprueba: con show() en vez de showModal(), los encabezados de main vuelven al árbol', (await ax(b)).filter((n) => n.role?.value === 'heading').map((n) => n.name.value).slice(0, 4), ['Citas y diálogos', 'Próximas', 'Pasadas', '¿Cancelar esta cita?'])
  await b.go(PAGE)

  // --- Rueda sobre el velo ---------------------------------------------------------------------------------
  const wheel = async () => {
    for (let i = 0; i < 3; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 640, y: 100, deltaX: 0, deltaY: 400 })
    await sleep(400)
  }
  const scrollWith = async (extra) => {
    await b.go(PAGE)
    if (extra) await b.style(extra)
    await openFor('Dr. Andrés Molina Paz')
    const before = await b.ev('Math.round(scrollY)')
    await wheel()
    const after = await b.ev('Math.round(scrollY)')
    await b.unstyle()
    return `${before} → ${after}`
  }
  expect('rueda sobre el velo: la página no se desplaza; contraprueba con overscroll-behavior: auto', { contain: await scrollWith(), auto: await scrollWith('.c-dialog { overscroll-behavior: auto !important }') }, { contain: '0 → 0', auto: '0 → 720' })

  // --- Confirmar ---------------------------------------------------------------------------------------------
  await b.go(PAGE)
  await openFor('Dr. Andrés Molina Paz')
  await b.tab()
  await b.enter()
  await sleep(300)
  const notice = "document.querySelector('.c-notice')"
  expect('Cancelar cita: Molina pasa a Pasadas como Cancelada (primera, orden descendente); foco en el título del aviso Success, sin rol; subtítulo a 2', {
    ...(await b.ev(state)),
    anillo: await b.ev("document.activeElement.matches(':focus-visible')"),
    listas: await b.ev(lists),
    aviso: await b.ev(`(() => { const n = ${notice}; return { tono: n.classList.contains('c-notice--success'), rol: n.closest('[role]')?.getAttribute('role') ?? null, cuerpo: n.querySelector('p').textContent, cierre: Boolean(n.querySelector('button')) } })()`),
    orden: await b.ev(`(() => { const sub = document.getElementById('kit-subtitulo'), n = ${notice}, s = document.getElementById('kit-proximas'); return sub.textContent + ' → aviso → Próximas: ' + Boolean(sub.compareDocumentPosition(n) & 4 && n.compareDocumentPosition(s) & 4) })()`),
  }, {
    abierto: false,
    foco: 'H2[tabindex=-1] «Cita cancelada»',
    anillo: true,
    listas: { proximas: ['Ruiz Confirmada', 'Cortés Confirmada'], pasadas: ['Molina Cancelada', 'Ibarra Realizada', 'Serrano Cancelada'] },
    aviso: { tono: true, rol: null, cuerpo: 'Ya no tienes la cita del martes 8 de mayo a las 17:00 con el Dr. Molina.', cierre: true },
    orden: 'Tienes 2 citas próximas → aviso → Próximas: true',
  })
  // Segunda cancelación con el aviso anterior en pantalla: el aviso se monta
  // de nuevo y el foco va a su título.
  await openFor('Dra. Elena Ruiz Arellano')
  const ruizBody = await b.ev(`${DIALOG}.querySelector('p').textContent`)
  await b.tab()
  await b.enter()
  await sleep(300)
  expect('segunda cancelación (Ruiz): cuerpo del diálogo sin promesa de cancelación gratuita; aviso nuevo con foco', {
    dialogo: ruizBody,
    ...(await b.ev(state)),
    avisos: await b.ev("[...document.querySelectorAll('.c-notice')].map((n) => n.querySelector('p').textContent)"),
    subtitulo: await b.ev("document.getElementById('kit-subtitulo').textContent"),
  }, {
    dialogo: 'Martes 24 de abril, 10:30, con la Dra. Elena Ruiz Arellano. Esta acción no se puede deshacer.',
    abierto: false,
    foco: 'H2[tabindex=-1] «Cita cancelada»',
    avisos: ['Ya no tienes la cita del martes 24 de abril a las 10:30 con la Dra. Ruiz.'],
    subtitulo: 'Tienes 1 cita próxima',
  })

  // --- Geometría contra 04.3 y 04.6, y umbral sobre el velo -----------------------------------------------
  const geometry = `(() => { const r = (e) => { const x = e.getBoundingClientRect(); return [x.x, x.y, x.width, x.height].map(Math.round).join(',') }, d = ${DIALOG}; return { velo: r(d), panel: r(d.querySelector('.c-dialog__panel')), botones: [...d.querySelectorAll('.c-dialog__action')].map(r) } })()`
  const dialogAt = async (width, height) => {
    await b.metrics(width, height, 1)
    await b.go(PAGE)
    await openFor('Dr. Andrés Molina Paz')
    return b.ev(geometry)
  }
  await b.overlayScrollbars(true)
  expect('375 × 812 (04.3, 284:6558): velo = viewport; panel 343 × 296 en 16,258; botones apilados de 295, Mantener arriba', await dialogAt(375, 812), {
    velo: '0,0,375,812',
    panel: '16,258,343,296',
    botones: ['40,418,295,50', '40,480,295,50'],
  })
  // Figma: Mantener 180 y Cancelar 152, a la derecha (borde en 936). El
  // navegador mide la etiqueta de Mantener 0,6 más corta: 179.
  expect('1440 × 900 (04.6, 284:7114): panel 480 × 210 en 480,345; botones intrínsecos a la derecha, Mantener primero', await dialogAt(1440, 900), {
    velo: '0,0,1440,900',
    panel: '480,345,480,210',
    botones: ['593,481,179,50', '784,481,152,50'],
  })
  const dialogLayout = `(() => { const p = ${DIALOG}.querySelector('.c-dialog__panel'); return getComputedStyle(${DIALOG}.querySelector('.c-dialog__actions')).flexDirection + ' ' + Math.round(p.getBoundingClientRect().width) })()`
  const thresholds = {}
  for (const width of [511, 512]) {
    await dialogAt(width, 900)
    thresholds[width] = await b.ev(dialogLayout)
  }
  expect('umbral sobre el velo: 511 → Stacked, 512 → Row', thresholds, { 511: 'column 479', 512: 'row 480' })
  await b.overlayScrollbars(false)

  // --- forced-colors ----------------------------------------------------------------------------------------
  await b.forcedColors(true)
  const forced = await dialogAt(1280, 900).then(() => b.ev(`(() => { const d = ${DIALOG}, p = d.querySelector('.c-dialog__panel'), s = (e) => getComputedStyle(e); return { velo: s(d).backgroundColor, panel: s(p).backgroundColor + ' borde ' + s(p).borderTopStyle + ' ' + s(p).borderTopColor, destructivo: s(${dialogButton('Cancelar cita')}).borderTopColor } })()`))
  await b.metrics(1280, 900, 2)
  await b.shot('forced-dialogo.png', { x: 0, y: await b.ev('scrollY'), width: 1280, height: 900 })
  await b.style('.c-dialog__panel { border: 0 !important }')
  const noBorder = await b.ev(`getComputedStyle(${DIALOG}.querySelector('.c-dialog__panel')).borderTopWidth`)
  await b.unstyle()
  // El velo no pasa a Canvas opaco: Chromium fuerza el color y conserva el
  // alfa (negro al 45 %). El panel queda en Canvas, igual que el fondo que
  // asoma por el velo: solo el borde transparente, forzado a CanvasText, lo
  // separa. Sin él, el panel no tiene contorno.
  expect('forced-colors: velo con el alfa conservado; panel en Canvas con borde forzado a CanvasText; contraprueba sin borde', { ...forced, sinBorde: noBorder }, {
    velo: 'rgba(0, 0, 0, 0.45)',
    panel: 'rgb(0, 0, 0) borde solid rgb(255, 255, 255)',
    destructivo: 'rgb(255, 255, 255)',
    sinBorde: '0px',
  })
  await b.forcedColors(false)
  await b.metrics(1280, 900, 2)
  await dialogAt(1280, 900)
  await b.shot('dialogo-1280.png', { x: 0, y: await b.ev('scrollY'), width: 1280, height: 900 })
  await b.metrics(375, 812, 2)
  await dialogAt(375, 812)
  await b.shot('dialogo-375.png', { x: 0, y: await b.ev('scrollY'), width: 375, height: 812 })

  // --- Texto grande (letra del navegador) y 200 % a 320 ------------------------------------------------------
  const font = (px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
  const large = `(() => {
    const d = ${DIALOG}, p = d.querySelector('.c-dialog__panel'), a = document.activeElement.getBoundingClientRect()
    const focoVisible = a.top >= 0 && a.bottom <= innerHeight
    d.scrollTop = 0
    const pr = p.getBoundingClientRect()
    return { letra: getComputedStyle(document.documentElement).fontSize, forma: getComputedStyle(d.querySelector('.c-dialog__actions')).flexDirection, margenLateral: Math.round(pr.left), panelCabe: pr.left >= 0 && pr.right <= d.clientWidth, desborde: d.scrollWidth - d.clientWidth, desplaza: d.scrollHeight > d.clientHeight, arribaConVeloArriba: Math.round(pr.top), focoVisible, foco: document.activeElement.textContent }
  })()`
  // Interiores (ancho de contenido) del título y de «Mantener mi cita».
  const interiors = `(() => { const w = (e) => { const s = getComputedStyle(e); return Math.round(e.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)) }; return { titulo: w(${DIALOG}.querySelector('.c-dialog__title')), boton: w(${dialogButton('Mantener mi cita')}) } })()`
  const openLarge = async ({ width, height, px = 16, inject = false, extra }) => {
    await b.metrics(width, height, 1)
    await b.go(PAGE)
    await font(px)
    if (inject) await b.run(text200)
    if (extra) await b.style(extra)
    await sleep(200)
    await openFor('Dr. Andrés Molina Paz')
    const words = await b.run(splitWords, '.c-dialog__title, .c-dialog__content p, .c-dialog__action')
    const value = { ...(await b.ev(large)), interiores: await b.ev(interiors), pudiendoCaber: words.couldFit, partidas: words.split }
    await b.unstyle()
    return value
  }
  // Por debajo de 18.75rem de velo (dialog-compact), el panel sin margen
  // lateral y con padding space-4: con la letra a 24 o 32 y al 200 % a 320.
  const largeText = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    const bar = overlay ? 'superpuesta' : 'clásica'
    largeText[`${bar} · letra 24, 320×568`] = await openLarge({ width: 320, height: 568, px: 24 })
    largeText[`${bar} · letra 32, 320×568`] = await openLarge({ width: 320, height: 568, px: 32 })
    largeText[`${bar} · 200 %, 320×900`] = await openLarge({ width: 320, height: 900, inject: true })
  }
  await b.overlayScrollbars(false)
  largeText['clásica · letra 20, 375×812'] = await openLarge({ width: 375, height: 812, px: 20 })
  await font(16)
  // Con barra clásica, cuando el velo se desplaza pinta su propia barra de 15:
  // el interior del botón a 32 es 128, no 143. «¿Cancelar», «Mantener» y
  // «Cancelar» parten solo ahí, más anchas que su interior. A 375 con la letra
  // a 20 y barra clásica el velo mide 360 = 18rem: también compacto.
  const compactCase = (letra, desplaza, arriba, interiores, partidas) => ({ letra, forma: 'column', margenLateral: 0, panelCabe: true, desborde: 0, desplaza, arribaConVeloArriba: arriba, focoVisible: true, foco: 'Mantener mi cita', interiores, pudiendoCaber: [], partidas })
  expect('texto grande y 200 % a 320: compacto por debajo de 18.75rem de velo; el panel cabe, el velo se desplaza desde arriba y el botón enfocado queda a la vista', largeText, {
    'clásica · letra 24, 320×568': compactCase('24px', true, 24, { titulo: 242, boton: 168 }, []),
    'clásica · letra 32, 320×568': compactCase('32px', true, 32, { titulo: 226, boton: 128 }, ['¿Cancelar', 'Mantener', 'Cancelar']),
    'clásica · 200 %, 320×900': compactCase('32px', true, 32, { titulo: 226, boton: 128 }, ['¿Cancelar', 'Mantener', 'Cancelar']),
    'superpuesta · letra 24, 320×568': compactCase('24px', false, 33, { titulo: 272, boton: 198 }, []),
    'superpuesta · letra 32, 320×568': compactCase('32px', true, 32, { titulo: 256, boton: 158 }, []),
    'superpuesta · 200 %, 320×900': compactCase('32px', true, 32, { titulo: 256, boton: 158 }, []),
    'clásica · letra 20, 375×812': compactCase('20px', false, 232, { titulo: 320, boton: 258 }, []),
  })
  await b.overlayScrollbars(false)
  const noCompact = await openLarge({ width: 320, height: 568, px: 32, extra: '.c-dialog__panel { inline-size: calc(100% - 2 * var(--space-4)) !important; padding: calc(var(--space-5) - 1px) !important }' })
  await font(16)
  expect('contraprueba: sin dialog-compact, a 320 con la letra a 32 (clásica) el interior del botón vuelve a 32 y parten «mi» y «cita»', { interiores: noCompact.interiores, partidas: noCompact.partidas }, {
    interiores: { titulo: 130, boton: 32 },
    partidas: ['¿Cancelar', 'deshacer.', 'Mantener', 'mi', 'cita', 'Cancelar'],
  })
  // Al 100 % no cambia nada: 375 como Figma 04.3 y 320 con el margen de 16.
  await b.overlayScrollbars(true)
  const at100 = {}
  for (const [width, height] of [[375, 812], [320, 568]]) {
    await b.metrics(width, height, 1)
    await b.go(PAGE)
    await openFor('Dr. Andrés Molina Paz')
    at100[`${width}×${height}`] = (await b.ev(geometry)).panel
  }
  await b.overlayScrollbars(false)
  expect('al 100 % sin cambios: 375×812 como 04.3 (343×296 en 16,258); a 320, margen de 16', at100, { '375×812': '16,258,343,296', '320×568': '16,136,288,296' })
  await b.metrics(1280, 900, 1)

  // --- Tipos --------------------------------------------------------------------------------------------
  expect(
    'tipos del diálogo: compila «Cancelar cita»; fallan «Aceptar», «OK» y «Confirmar»',
    typeErrorLines(`import Dialog from '../components/Dialog.tsx'
const f = () => {}
const d = { open: true, title: 'T', body: 'B', dismissLabel: 'Mantener mi cita', returnFocus: null, onDismiss: f, onConfirm: f }
export const V1 = () => <Dialog {...d} confirmLabel="Cancelar cita" />
export const P1 = () => <Dialog {...d} confirmLabel="Aceptar" />
export const P2 = () => <Dialog {...d} confirmLabel="OK" />
export const P3 = () => <Dialog {...d} confirmLabel="Confirmar" />
`),
    [5, 6, 7],
  )
  expect(
    'tipos: compilan los 4 estados, fallan las 6 combinaciones prohibidas',
    typeErrorLines(`import AppointmentCard from '../components/AppointmentCard.tsx'
const p = { when: 'W', dateTime: '2029-04-24T10:30', name: 'N', specialty: 'S', location: 'L', initial: 'N' }
const f = () => {}
export const V1 = () => <AppointmentCard status="confirmed" rescheduleHref="/x" onCancel={f} {...p} />
export const V2 = () => <AppointmentCard status="pending" pendingNote="x" onCancel={f} {...p} />
export const V3 = () => <AppointmentCard status="past" bookHref="/x" {...p} />
export const V4 = () => <AppointmentCard status="cancelled" bookHref="/x" {...p} />
export const P1 = () => <AppointmentCard status="confirmed" rescheduleHref="/x" onCancel={f} pendingNote="x" {...p} />
export const P2 = () => <AppointmentCard status="pending" pendingNote="x" onCancel={f} rescheduleHref="/x" {...p} />
export const P3 = () => <AppointmentCard status="past" bookHref="/x" onCancel={f} {...p} />
export const P4 = () => <AppointmentCard status="cancelled" rescheduleHref="/x" {...p} />
export const P5 = () => <AppointmentCard status="pending" onCancel={f} {...p} />
export const P6 = () => <AppointmentCard status="confirmed" rescheduleHref="/x" {...p} />
`),
    [8, 9, 10, 11, 12, 13],
  )
}
