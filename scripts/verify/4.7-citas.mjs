// 4.7 Citas y diálogos: Appointment Card (bloque A). Todo en /kit/citas, con
// la estructura de Mis citas: Próximas (Ruiz, Molina, Cortés) y Pasadas
// (Ibarra, Serrano).
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { typeErrorLines } from './static.mjs'

const PAGE = '/kit/citas'
const cards = "['kit-proximas', 'kit-pasadas'].flatMap((id) => [...document.getElementById(id).children])"
const ax = (b) => b.send('Accessibility.getFullAXTree').then((r) => r.nodes.filter((n) => !n.ignored))

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
  // ✗ declarado: el paso del foco al h1 al cambiar de ruta (D12) aún no existe
  // y el foco queda en body. Pasará sin tocar la comprobación cuando la fase 5
  // lo implemente.
  expect('foco tras la navegación en cliente: el h1 de la vista (✗ declarado: DESIGN.md, Pendientes, fase 5, «Foco al cambiar de ruta»)', await b.ev("(() => { const a = document.activeElement; return a.tagName + (a.id ? '#' + a.id : '') })()"), 'H1#contenido')
  // La ruta de reprogramación es de la fase 5: hoy llega al 404 de React
  // Router, que escribe en la consola. Esos errores se retiran aquí, solo los
  // de este paso, y se comprueban aparte.
  const before = b.consoleErrors.length
  await clickOn(action(2, 0))
  await waitFor('/mis-citas/cortes-2029-05-16/reprogramar')
  // Filtro de consola, pendiente de la fase 5: retirarlo cuando exista
  // /mis-citas/:id/reprogramar.
  expect('clic real: /kit → /kit/citas y «Reprogramar» de Cortés, sin carga completa', {
    llegada: arrival,
    reprogramar: await b.ev("({ ruta: location.pathname, sinRecarga: window.__verifyMark === true, error: document.querySelector('h3')?.textContent })"),
    consola: b.consoleErrors.splice(before),
  }, {
    llegada: { ruta: PAGE, sinRecarga: true, tarjetas: 5 },
    reprogramar: { ruta: '/mis-citas/cortes-2029-05-16/reprogramar', sinRecarga: true, error: '404 Not Found' },
    consola: Array(2).fill('Error handled by React Router default ErrorBoundary: ErrorResponseImpl'),
  })

  // --- Tipos --------------------------------------------------------------------------------------------
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
