// 4.6 Fecha y hora: Day Chip (DayStrip), Calendar y Calendar Day, Time Slot
// (SlotList) y Booking Bar. Todo en /kit/fecha-hora. Las cifras de geometría
// son las de Figma: maestros y pantallas 02.1, 02.2, 02.5 y 02.7.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation, pixelDiff, viewport } from './navegacion.mjs'
import { lintLines, typeErrorLines } from './static.mjs'

const PAGE = '/kit/fecha-hora'
const LIVE = "document.getElementById('kit-reserva')"
const CAL = "document.getElementById('kit-calendario')"
const day = (n) => `[...${CAL}.querySelectorAll('.c-calendar-day')].find((x) => x.textContent === '${n}')`
const month = `${CAL}.querySelector('.c-calendar__month').textContent`
const active = `(() => { const a = document.activeElement; return a.getAttribute('aria-label') ?? a.textContent.trim().slice(0, 40) })()`
const ax = (b) => b.send('Accessibility.getFullAXTree').then((r) => r.nodes.filter((n) => !n.ignored))
const prop = (n, name) => n.properties?.find((p) => p.name === name)?.value.value

const key = async (b, k, code, vk, modifiers = 0, text) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, modifiers, ...(text ? { text, unmodifiedText: text } : {}) })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, modifiers })
  await sleep(120)
}
const left = (b) => key(b, 'ArrowLeft', 'ArrowLeft', 37)
const right = (b) => key(b, 'ArrowRight', 'ArrowRight', 39)
const up = (b) => key(b, 'ArrowUp', 'ArrowUp', 38)
const down = (b) => key(b, 'ArrowDown', 'ArrowDown', 40)

// Rectángulos de los hijos de un contenedor, relativos a él: [x, y, ancho, alto].
const layout = (parent, child) => `(() => { const p = ${parent}.getBoundingClientRect(); return [...${parent}.querySelectorAll('${child}')].map((e) => { const r = e.getBoundingClientRect(); return [r.x - p.x, r.y - p.y, r.width, r.height] }) })()`
// Desviación máxima frente a las cifras de Figma. Las columnas en fr (y las
// de una tabla fija) las reparte el navegador en múltiplos de 1/64 px (45.56 /
// 45.58 / 45.63 frente a 45.57): se compara con margen de 0.1 y, si se pasa,
// se informa la desviación.
const deviation = (actual, figma) => {
  const max = Math.max(...actual.flatMap((row, i) => row.map((v, j) => Math.abs(v - figma[i][j]))))
  return max < 0.1 ? '< 0.1' : `${Math.round(max * 100) / 100}`
}
const withWidth = async (b, selector, width, expr) => {
  await b.style(`${selector} { inline-size: ${width}px }`)
  await sleep(100)
  const value = await b.ev(expr)
  await b.unstyle()
  return value
}

// Contraste entre dos colores calculados (rgb/rgba sobre opaco).
const contrast = `(a, b) => {
  const lum = (c) => { const [r, g, v] = c.match(/[\\d.]+/g).slice(0, 3).map(Number).map((x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * v }
  const [h, l] = [lum(a), lum(b)].sort((x, y) => y - x)
  return Math.round(((h + 0.05) / (l + 0.05)) * 100) / 100
}`
const role = (name) => `(() => { const p = document.createElement('div'); p.style.backgroundColor = 'var(${name})'; document.body.append(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c })()`

export default async function run(b, expect) {
  await b.forcedColors(false)
  // Figma dibuja 375 sin barra de scroll: la superpuesta deja los 343 de la columna.
  await b.overlayScrollbars(true)
  await b.metrics(375, 900, 1)
  await b.go(PAGE)

  // --- Geometría contra Figma ---------------------------------------------------------------------
  // 02.1: siete chips de 45.57 × 62 con huecos de 4 a 343.
  const chips = await b.ev(layout(`${LIVE}.querySelector('.c-day-strip')`, '.c-day-chip'))
  const figmaChips = Array.from({ length: 7 }, (_, i) => [i * 49.571, 0, 45.571, 62])
  expect('Day Strip a 343 (Figma 02.1): 7 chips de 45.57 × 62 cada 49.57; desviación máxima < 0.1', { chips: chips.length, desviacion: deviation(chips, figmaChips) }, { chips: 7, desviacion: '< 0.1' })
  // 02.1: Mañana (etiqueta 24, 8, filas de 50 con 12) y Tarde a 24; 106.33 × 50.
  const slotBoxes = await b.ev(layout(`${LIVE}.querySelector('.c-slot-list')`, '.c-time-slot'))
  const figmaSlots = [32, 94, 200, 262].flatMap((y) => [0, 118.333, 236.667].map((x) => [x, y, 106.333, 50]))
  expect('Slot List a 343 (Figma 02.1): 312 de alto, etiquetas a 0 y 168, 12 horas de 106.33 × 50; desviación máxima < 0.1', {
    alto: await b.ev(`${LIVE}.querySelector('.c-slot-list').getBoundingClientRect().height`),
    etiquetas: (await b.ev(layout(`${LIVE}.querySelector('.c-slot-list')`, '.c-slot-list__label'))).map((r) => `${r[1]} ${r[3]}`),
    desviacion: deviation(slotBoxes, figmaSlots),
  }, { alto: 312, etiquetas: ['0 24', '168 24'], desviacion: '< 0.1' })
  // 02.5: columna de horas de 390 → 122.
  expect('Slot List a 390 (Figma 02.5): tres columnas de 122', await withWidth(b, '#kit-reserva .c-slot-list', 390, `getComputedStyle(${LIVE}.querySelector('.c-slot-list__group')).gridTemplateColumns`), '122px 122px 122px')
  expect('tope de columnas: grid-template-columns de la franja', await b.ev(`[...document.styleSheets].flatMap((s) => [...s.cssRules]).find((r) => r.selectorText === '.c-slot-list__group')?.style.gridTemplateColumns`), 'repeat(auto-fill, minmax(max(4.8125rem, (100% - 2 * var(--space-3)) / 3), 1fr))')
  // Con el mínimo de V3 (77) caben 4 desde 344 (4 × 77 + 3 × 12): a 420 el tope
  // es el tercio.
  const columnsAt420 = `getComputedStyle(${LIVE}.querySelector('.c-slot-list__group')).gridTemplateColumns.split(' ').length`
  const capped = await withWidth(b, '#kit-reserva .c-slot-list', 420, columnsAt420)
  await b.style('#kit-reserva .c-slot-list__group { grid-template-columns: repeat(auto-fill, minmax(4.8125rem, 1fr)) !important }')
  expect('tope real: a 420 siguen 3 columnas; contraprueba sin el tercio como mínimo, 4', { tope: capped, sinTope: await withWidth(b, '#kit-reserva .c-slot-list', 420, columnsAt420) }, { tope: 3, sinTope: 4 })
  await b.unstyle()

  // 02.2 (343) y 02.5 (360): calendario de 448; celdas de 45.57 y 48 × 50.
  const calendarAt = (width) =>
    withWidth(b, '#kit-calendario', width, `(() => {
      const c = ${CAL}.querySelector('.c-calendar'), p = c.getBoundingClientRect(), r = (e) => e.getBoundingClientRect()
      const days = [...c.querySelectorAll('.c-calendar-day')].filter((d) => d.textContent), range = document.createRange()
      // x del texto (Range) e y de la caja de línea (elemento), como la capa de Figma.
      range.selectNodeContents(c.querySelector('.c-calendar__month'))
      const m = range.getBoundingClientRect(), th = c.querySelector('.c-calendar__weekday')
      const f = (v) => Math.round(v * 100) / 100
      return {
        calendario: f(p.width) + '×' + p.height,
        mes: f(m.x - p.x) + ',' + f(r(c.querySelector('.c-calendar__month')).y - p.y),
        cabecera: f(r(th).y - p.y) + ' ' + (r(th).height - parseFloat(getComputedStyle(th).paddingBottom)),
        filas: [...new Set(days.map((d) => f(r(d).y - p.y)))],
        celdas: days.map((d) => [r(d).x - p.x, r(d).width, r(d).height]),
        leyenda: f(r(c.querySelector('.c-calendar__legend')).y - p.y),
      }
    })()`)
  // Celdas por columna: x = columna × (ancho + 4), alto 50.
  const cellDeviation = (cells, width) => deviation(cells.map(([x, w, h]) => [x, w, h]), cells.map(([x]) => { const col = Math.round(x / (width + 4)); return [col * (width + 4), width, 50] }))
  const april = await calendarAt(343)
  expect('Calendar a 343 (Figma 02.2): 448, mes al inicio sin «Mes anterior», cabecera de 20 a 64, filas cada 54, celdas de 45.57 × 50', { ...april, celdas: cellDeviation(april.celdas, 45.571) }, {
    calendario: '343×448', mes: '0,10', cabecera: '64 20', filas: [92, 146, 200, 254, 308, 362], celdas: '< 0.1', leyenda: 428,
  })
  expect('Calendar a 360 (Figma 02.5): celdas de 48 × 50', cellDeviation((await calendarAt(360)).celdas, 48), '< 0.1')
  expect('punto de hoy (Figma 02.2): 4 × 4 a 40 del borde superior de la celda, centrado', await withWidth(b, '#kit-calendario', 343, `(() => { const c = ${day(23)}.getBoundingClientRect(), d = ${CAL}.querySelector('.c-calendar-day__today').getBoundingClientRect(); return Math.round((d.x - c.x) * 100) / 100 + ',' + (d.y - c.y) + ' ' + d.width + '×' + d.height })()`), '20.78,40 4×4')

  // Booking Bar a 375 (Figma 02.1): 74 con el borde dentro; resumen 200; botón 127 en 232,12.
  const barBox = (root) => `(() => { const bar = ${root}.querySelector('.c-booking-bar'), p = bar.getBoundingClientRect(), s = bar.querySelector('.c-booking-bar__summary').getBoundingClientRect(), k = bar.querySelector('.c-booking-bar__submit').getBoundingClientRect(), t = document.createRange(); t.selectNodeContents(bar.querySelector('.c-booking-bar__submit')); return { etiqueta: Math.round(t.getBoundingClientRect().width * 10) / 10, barra: p.width + '×' + p.height, resumen: Math.round(s.x - p.x) + ',' + Math.round(s.y - p.y) + ' ' + Math.round(s.width) + '×' + s.height, boton: Math.round(k.x - p.x) + ',' + Math.round(k.y - p.y) + ' ' + Math.round(k.width) + '×' + k.height } })()`
  // Figma: resumen 200, botón 127 en 232. «Continuar» mide 76.3 en Edge y 77
  // en Figma: el botón queda en 126 y el resumen en 201.
  expect('Booking Bar Chosen en la barra del shell a 375 (Figma 02.1: 74; resumen 200 y botón 127 con la etiqueta de 77)', await b.ev(barBox("document.querySelector('.c-app-layout__bar')")), { etiqueta: 76.3, barra: '375×74', resumen: '16,15 201×44', boton: '233,12 126×50' })
  await b.style('#kit-barras-variantes { inline-size: 375px; margin-inline: -16px }')
  expect('«Confirmar hora» a 375 (Figma 02.7): botón de 167, resumen en el techo de 160, una línea cada texto', await b.ev(`(() => { const bar = document.querySelectorAll('#kit-barras-variantes .c-booking-bar')[3]; return { boton: Math.round(bar.querySelector('.c-booking-bar__submit').getBoundingClientRect().width), resumen: Math.round(bar.querySelector('.c-booking-bar__summary').getBoundingClientRect().width), alto: bar.getBoundingClientRect().height } })()`), { boton: 167, resumen: 160, alto: 74 })
  expect('las tres variantes a 375: 74 de alto', await b.ev("[...document.querySelectorAll('#kit-barras-variantes .c-booking-bar')].slice(0, 3).map((x) => x.getBoundingClientRect().height)"), [74, 74, 74])
  await b.style('.c-booking-bar__inner { padding-block: var(--space-3) !important }')
  expect('contraprueba: sin restar el borde, 75', await b.ev("document.querySelector('#kit-barras-variantes .c-booking-bar').getBoundingClientRect().height"), 75)
  await b.unstyle()

  // Alto de 6 semanas: mayo (5 semanas) mide lo mismo que abril.
  await b.tabTo(`${CAL}.querySelector('[aria-label="Mes siguiente"]')`)
  await b.enter()
  await sleep(200)
  const may = await calendarAt(343)
  const centered = await withWidth(b, '#kit-calendario', 343, `(() => { const c = ${CAL}.querySelector('.c-calendar').getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(${CAL}.querySelector('.c-calendar__month')); const m = r.getBoundingClientRect(); return Math.abs((m.left - c.left) - (c.right - m.right)) <= 0.5 })()`)
  expect('Mayo a 343 (Figma 02.8): «Mes anterior» vuelve y el mes se centra; 5 semanas en el mismo alto; sin «Hoy» en la leyenda', {
    mes: await b.ev(month), anterior: await b.ev(`Boolean(${CAL}.querySelector('[aria-label="Mes anterior"]'))`), centrado: centered, filas: may.filas.length, alto: may.calendario,
    leyenda: await b.ev(`${CAL}.querySelector('.c-calendar__legend').textContent`),
  }, { mes: 'Mayo 2029', anterior: true, centrado: true, filas: 5, alto: '343×448', leyenda: 'Sin horarios' })
  await b.style('.c-calendar__body { min-block-size: 0 !important }')
  expect('contraprueba: sin el mínimo de 6 semanas, mayo encoge 54', (await calendarAt(343)).calendario, '343×394')
  await b.unstyle()
  expect('RAC anuncia el mes al pulsar «Mes siguiente» (región viva propia)', await b.ev("[...document.querySelectorAll('[data-live-announcer] [aria-live]')].map((e) => e.textContent).filter(Boolean)"), ['mayo de 2029'])

  // Foco cuando «Mes anterior» desaparece con el foco dentro.
  await b.tabTo(`${CAL}.querySelector('[aria-label="Mes anterior"]')`)
  await b.enter()
  await sleep(300)
  expect('«Mes anterior» desde mayo: el botón desaparece y RAC lleva el foco al día enfocado de abril (no se pierde)', { mes: await b.ev(month), foco: await b.ev(active), anterior: await b.ev(`Boolean(${CAL}.querySelector('[aria-label="Mes anterior"]'))`) }, {
    mes: 'Abril 2029', foco: 'martes 24 de abril de 2029, 6 horarios libres, seleccionado', anterior: false,
  })

  // --- Envoltorio del calendario: solo desplazamiento horizontal ----------------------------------
  // Defecto de la primera entrega: la tabla, con su margen de −4, sobresalía 4
  // por abajo y overflow-x: auto (que hace auto también overflow-y) pintaba
  // una barra vertical a cualquier ancho.
  const bodyScroll = `(() => { const e = ${CAL}.querySelector('.c-calendar__body'); return e.scrollHeight + '/' + e.clientHeight + (e.scrollWidth > e.clientWidth ? ' h' : '') })()`
  const scrollAt = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(1350, 900, 1)
    await b.go(PAGE)
    scrollAt[overlay ? 'superpuesta' : 'clásica'] = { 343: await withWidth(b, '#kit-calendario', 343, bodyScroll), 360: await withWidth(b, '#kit-calendario', 360, bodyScroll), kit: await b.ev(bodyScroll) }
  }
  expect('envoltorio sin desplazamiento vertical ni horizontal al 100 % (scrollHeight/clientHeight): 343, 360 y ancho del kit a 1350, con las dos barras', scrollAt, {
    clásica: { 343: '356/356', 360: '356/356', kit: '356/356' },
    superpuesta: { 343: '356/356', 360: '356/356', kit: '356/356' },
  })
  await b.style('.c-calendar__body { padding: 0 var(--space-1) !important; margin: 0 calc(-1 * var(--space-1)) !important; min-block-size: 21.75rem !important }')
  expect('contraprueba: sin reservar el bloque, la tabla sobresale 4 y aparece el desplazamiento vertical', await b.ev(bodyScroll), '352/348')
  await b.unstyle()

  // El anillo (desfase 2 + grosor 2 = 4 fuera de la celda) de la primera y la
  // última fila y columna cae dentro de la caja de padding del envoltorio.
  const ringFits = `(() => {
    const body = ${CAL}.querySelector('.c-calendar__body'), p = body.getBoundingClientRect(), box = { l: p.left + body.clientLeft, t: p.top + body.clientTop, r: p.left + body.clientLeft + body.clientWidth, b: p.top + body.clientTop + body.clientHeight }
    const rows = [...body.querySelectorAll('tbody tr')].filter((tr) => tr.querySelector('.c-calendar-day__number'))
    const cells = { primeraFila: [...rows[0].querySelectorAll('.c-calendar-day')], ultimaFila: [...rows[rows.length - 1].querySelectorAll('.c-calendar-day')], primeraColumna: rows.map((tr) => tr.children[0].firstChild), ultimaColumna: rows.map((tr) => tr.children[6].firstChild) }
    const fits = (c) => { const r = c.getBoundingClientRect(); return r.left - 4 >= box.l - 0.5 && r.right + 4 <= box.r + 0.5 && r.top - 4 >= box.t - 0.5 && r.bottom + 4 <= box.b + 0.5 }
    const out = {}
    body.scrollLeft = 0
    out.primeraFila = cells.primeraFila.every((c) => { const r = c.getBoundingClientRect(); return r.top - 4 >= box.t - 0.5 })
    out.ultimaFila = cells.ultimaFila.every((c) => { const r = c.getBoundingClientRect(); return r.bottom + 4 <= box.b + 0.5 })
    out.primeraColumna = cells.primeraColumna.every(fits)
    body.scrollLeft = body.scrollWidth
    out.ultimaColumna = cells.ultimaColumna.every(fits)
    body.scrollLeft = 0
    return out
  })()`
  const allFit = { primeraFila: true, ultimaFila: true, primeraColumna: true, ultimaColumna: true }
  const rings = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(375, 900, 1)
    await b.go(PAGE)
    rings[`${overlay ? 'superpuesta' : 'clásica'} 100 %`] = await b.ev(ringFits)
    await b.metrics(320, 900, 1)
    await b.go(PAGE)
    await b.run(text200)
    await sleep(300)
    rings[`${overlay ? 'superpuesta' : 'clásica'} 200 % a 320`] = { ...(await b.ev(ringFits)), desplaza: await b.ev(bodyScroll).then((s) => s.endsWith(' h')) }
  }
  expect('anillo entero en la primera y la última fila y columna (al 200 % a 320, con el envoltorio desplazado a cada extremo)', rings, {
    'clásica 100 %': allFit, 'clásica 200 % a 320': { ...allFit, desplaza: true },
    'superpuesta 100 %': allFit, 'superpuesta 200 % a 320': { ...allFit, desplaza: true },
  })
  await b.style('.c-calendar__body { padding-inline: 0 !important; margin-inline: 0 !important }')
  const clipped = await b.ev(ringFits)
  await b.unstyle()
  // Solo la primera: el margen de −4 de la tabla sale por la izquierda, que no
  // se puede desplazar; por la derecha amplía el área desplazable y el
  // extremo sigue alcanzándose.
  expect('contraprueba (200 % a 320): sin la reserva lateral, el anillo de la primera columna se recorta', { primeraColumna: clipped.primeraColumna, ultimaColumna: clipped.ultimaColumna }, { primeraColumna: false, ultimaColumna: true })

  // --- Cursor ---------------------------------------------------------------------------------------
  // La mano de los botones vive en 03-generic/_reset.scss (:where(button)). La
  // celda de RAC es un div role="button" y la lleva en c-calendar-day.
  await b.overlayScrollbars(true)
  await b.metrics(375, 900, 1)
  await b.go(PAGE)
  const blank = `${CAL}.querySelector('[data-outside-month]')`
  expect('cursor: mano en lo seleccionable (también días y chips llenos); normal en pasados, Blank y horas llenas', await b.ev(`(() => { const c = (e) => getComputedStyle(e).cursor; return {
    dia: c(${day(25)}), diaLleno: c(${day(29)}), diaSeleccionado: c(${day(24)}), diaPasado: c(${day(22)}), blank: c(${blank}),
    mesSiguiente: c(${CAL}.querySelector('[aria-label="Mes siguiente"]')),
    chip: c(${LIVE}.querySelector('.c-day-chip:not(.c-day-chip--full)')), chipLleno: c(${LIVE}.querySelector('.c-day-chip--full')),
    hora: c(${LIVE}.querySelector('.c-time-slot:not([aria-disabled])')), horaLlena: c(${LIVE}.querySelector('.c-time-slot[aria-disabled=true]')),
  } })()`), {
    dia: 'pointer', diaLleno: 'pointer', diaSeleccionado: 'pointer', diaPasado: 'default', blank: 'default',
    mesSiguiente: 'pointer', chip: 'pointer', chipLleno: 'pointer', hora: 'pointer', horaLlena: 'default',
  })

  // --- Inicio y Fin en los bordes de mes y de rango ---------------------------------------------------
  // Principio y fin de semana (APG): cambian de mes como las flechas; el mes
  // visible sigue al foco. minValue y maxValue recortan: con estos datos no
  // llega a ejercerse, porque hoy es lunes y el día 90 es domingo.
  await b.tabTo(day(24))
  const edgeState = `document.activeElement.getAttribute('aria-label') + ' · ' + ${month}`
  const edges = []
  await down(b)
  await right(b)
  edges.push(`miércoles 2 de mayo → Inicio: ${await (async () => { await key(b, 'Home', 'Home', 36); return b.ev(edgeState) })()}`)
  edges.push(`Fin: ${await (async () => { await key(b, 'End', 'End', 35); return b.ev(edgeState) })()}`)
  await key(b, 'PageDown', 'PageDown', 34, 8)
  edges.push(`Mayús+AvPág → Inicio: ${await (async () => { await key(b, 'Home', 'Home', 36); return b.ev(edgeState) })()}`)
  edges.push(`Fin en la semana de maxValue: ${await (async () => { await key(b, 'End', 'End', 35); return b.ev(edgeState) })()}`)
  await key(b, 'PageUp', 'PageUp', 33, 8)
  edges.push(`Mayús+RePág → Inicio en la semana de hoy: ${await (async () => { await key(b, 'Home', 'Home', 36); return b.ev(edgeState) })()}`)
  expect('Inicio/Fin: semana, cambiando de mes; sin salir de minValue ni maxValue', edges, [
    'miércoles 2 de mayo → Inicio: lunes 30 de abril de 2029, 12 horarios libres · Abril 2029',
    'Fin: domingo 6 de mayo de 2029, sin horarios · Mayo 2029',
    'Mayús+AvPág → Inicio: lunes 16 de julio de 2029, 12 horarios libres · Julio 2029',
    'Fin en la semana de maxValue: domingo 22 de julio de 2029, 12 horarios libres · Julio 2029',
    'Mayús+RePág → Inicio en la semana de hoy: lunes 23 de abril de 2029, hoy, sin horarios · Abril 2029',
  ])

  // --- Semántica ----------------------------------------------------------------------------------------
  await b.go(PAGE)
  const tree = await ax(b)
  const names = (r) => tree.filter((n) => n.role?.value === r).map((n) => n.name?.value)
  expect('Day Chip: nombre = texto visible + oculto (2.5.3); el lleno sin aria-disabled', {
    abril: names('radio').filter((n) => /abril/.test(n)),
    deshabilitados: tree.filter((n) => n.role?.value === 'radio' && prop(n, 'disabled')).length,
    grupo: names('group').filter((n) => /Elige fecha/.test(n)),
  }, {
    abril: ['Hoy 23 de abril, sin horarios', 'mar 24 de abril, 6 horarios libres', 'mié 25 de abril, 12 horarios libres', 'jue 26 de abril, 12 horarios libres', 'vie 27 de abril, 12 horarios libres', 'sáb 28 de abril, 12 horarios libres', 'dom 29 de abril, sin horarios'],
    deshabilitados: 0,
    grupo: ['Elige fecha en mayo', 'Elige fecha'],
  })
  expect('Calendar: rejilla nombrada por el mes una sola vez; nombre de cada día compuesto (C2)', {
    rejilla: names('grid'),
    dias: names('button').filter((n) => /de abril de 2029,/.test(n)),
    pasado: names('button').find((n) => /^domingo 22/.test(n)),
    hoy: await b.ev(`${day(23)}.getAttribute('aria-current')`),
    lleno: await b.ev(`[${day(23)}, ${day(29)}].map((d) => d.getAttribute('aria-disabled'))`),
  }, {
    rejilla: ['abril de 2029'],
    dias: ['lunes 23 de abril de 2029, hoy, sin horarios', 'martes 24 de abril de 2029, 6 horarios libres, seleccionado', 'miércoles 25 de abril de 2029, 12 horarios libres', 'jueves 26 de abril de 2029, 12 horarios libres', 'viernes 27 de abril de 2029, 12 horarios libres', 'sábado 28 de abril de 2029, 12 horarios libres', 'domingo 29 de abril de 2029, sin horarios', 'lunes 30 de abril de 2029, 12 horarios libres'],
    pasado: 'domingo 22 de abril de 2029',
    hoy: 'date',
    lleno: [null, null],
  })
  expect('Blank: vacías, aria-hidden y sin nombre (26–31 de marzo y 1–6 de mayo)', await b.ev(`[...${CAL}.querySelectorAll('[data-outside-month]')].map((d) => d.textContent + '|' + d.getAttribute('aria-hidden') + '|' + d.getAttribute('aria-label'))`), Array(12).fill('|true|null'))
  // Añadidos de RAC que el plan no preveía: los trae el informe.
  expect('RAC añade un h2 oculto con el mes y un botón oculto «Siguiente» (tabIndex -1)', {
    h2: await b.ev(`[...${CAL}.querySelectorAll('h2')].map((h) => h.textContent + ' ' + getComputedStyle(h.parentElement).clipPath)`),
    boton: await b.ev(`[...${CAL}.querySelectorAll('button[tabindex="-1"]')].map((x) => x.getAttribute('aria-label'))`),
    cabecera: await b.ev(`${CAL}.querySelector('thead').getAttribute('aria-hidden')`),
  }, { h2: ['abril de 2029 inset(50%)'], boton: ['Siguiente'], cabecera: 'true' })
  expect('Time Slot: listbox nombrado por su h3, grupos Mañana/Tarde, llenas aria-disabled, una seleccionada', {
    lista: names('listbox'),
    grupos: names('group').filter((n) => ['Mañana', 'Tarde'].includes(n)).length,
    opciones: tree.filter((n) => n.role?.value === 'option').slice(12).map((n) => n.name.value + (prop(n, 'disabled') ? ' llena' : '') + (prop(n, 'selected') ? ' ✓' : '')),
  }, {
    lista: ['Horas del jueves 17 de mayo', 'Elige hora'],
    grupos: 4,
    opciones: ['09:00 llena', '09:30 llena', '10:00 llena', '10:30 ✓', '11:00', '11:30 llena', '16:00', '16:30', '17:00', '17:30', '18:00 llena', '18:30 llena'],
  })
  expect('Booking Bar: el envío es submit de kit-reserva (form=) y se describe con el resumen', await b.ev("(() => { const x = document.querySelector('.c-app-layout__bar .c-button'); return { tipo: x.type, form: x.form?.id, fuera: !x.closest('form'), descripcion: document.getElementById(x.getAttribute('aria-describedby')).textContent } })()"), { tipo: 'submit', form: 'kit-reserva', fuera: true, descripcion: 'mar 24 abr · 10:30Presencial · 30 min' })

  // --- Teclado --------------------------------------------------------------------------------------------
  // Tira: nativo. Tab entra en el marcado; las flechas mueven y seleccionan.
  const checked = `${LIVE}.querySelector('.c-day-chip__input:checked')?.value`
  await b.tabTo(`${LIVE}.querySelector('.c-day-chip__input:checked')`)
  await right(b)
  const afterRight = { marcado: await b.ev(checked), foco: await b.ev('document.activeElement.value'), horas: await b.ev(`${LIVE}.querySelectorAll('.c-time-slot[aria-selected=true]').length`), barra: await b.ev("document.querySelector('.c-app-layout__bar .c-booking-bar__title').textContent") }
  await left(b)
  await left(b)
  expect('Day Chip: → marca el 25 (la hora se borra: barra None); ←← llega al 23 lleno y lo marca', { afterRight, lleno: await b.ev(checked), sinHoras: await b.ev(`${LIVE}.querySelector('#kit-horas p')?.textContent.slice(0, 12)`) }, {
    afterRight: { marcado: '2029-04-25', foco: '2029-04-25', horas: 0, barra: 'Sin horario elegido' },
    lleno: '2029-04-23',
    sinHoras: 'Sin horarios',
  })

  // «Continuar» sin hora: Missing y foco en la primera hora libre, con el mensaje.
  await b.go(PAGE)
  await b.tabTo(`${LIVE}.querySelector('.c-day-chip__input:checked')`)
  await right(b)
  await b.tabTo("document.querySelector('.c-app-layout__bar .c-button')")
  await b.enter()
  await sleep(300)
  expect('«Continuar» sin hora: barra Missing; foco en la primera libre (09:00 del 25) con aria-describedby al mensaje', await b.ev(`(() => { const a = document.activeElement, id = a.getAttribute('aria-describedby'); return { foco: a.textContent, rol: a.getAttribute('role'), mensaje: id && document.getElementById(id).textContent, barra: document.querySelector('.c-app-layout__bar .c-booking-bar__meta').className, anillo: a.matches(':focus-visible') } })()`), {
    foco: '09:00', rol: 'option', mensaje: 'Elige un horario primero', barra: 'c-booking-bar__meta c-booking-bar__meta--error', anillo: true,
  })

  // Horas: Tab entra en la seleccionada; las flechas mueven sin seleccionar.
  await b.go(PAGE)
  const selected = `[...${LIVE}.querySelectorAll('.c-time-slot[aria-selected=true]')].map((x) => x.textContent)`
  await b.tabTo(`${LIVE}.querySelector('.c-time-slot[aria-selected=true]')`)
  const tabIn = await b.ev(active)
  await right(b)
  const moved = { foco: await b.ev(active), seleccion: await b.ev(selected) }
  await down(b)
  const crossed = await b.ev(active)
  await up(b)
  await right(b)
  await b.enter()
  await sleep(100)
  const fullEnter = { foco: await b.ev(active), seleccion: await b.ev(selected) }
  await left(b)
  await b.space()
  await sleep(100)
  const spaceOnce = await b.ev(selected)
  await b.space()
  await sleep(100)
  expect('Time Slot: Tab a la seleccionada; → mueve sin seleccionar; ↓ cruza a Tarde; Intro en una llena no selecciona; Espacio selecciona y no deselecciona', {
    tabIn, moved, crossed, fullEnter, spaceOnce, spaceTwice: await b.ev(selected),
  }, {
    tabIn: '10:30', moved: { foco: '11:00', seleccion: ['10:30'] }, crossed: '16:30', fullEnter: { foco: '11:30', seleccion: ['10:30'] }, spaceOnce: ['11:00'], spaceTwice: ['11:00'],
  })
  await b.mouse('mouseMoved', 1, 1)

  // Calendar: APG con el rango de minValue = hoy.
  await b.go(PAGE)
  await b.tabTo(day(24))
  const tabIntoCalendar = await b.ev(active)
  const steps = []
  for (const [label, press] of [
    ['←', () => left(b)],
    ['← (22, fuera de rango)', () => left(b)],
    ['↑ (16, fuera de rango)', () => up(b)],
    ['Fin (fin de semana)', () => key(b, 'End', 'End', 35)],
    ['Inicio (principio de semana)', () => key(b, 'Home', 'Home', 36)],
    ['→ ↓ Inicio (30 → 30, lunes)', async () => { await key(b, 'ArrowDown', 'ArrowDown', 40); await key(b, 'Home', 'Home', 36) }],
    ['↑ (23) y Fin', async () => { await up(b); await key(b, 'End', 'End', 35) }],
    ['AvPág', () => key(b, 'PageDown', 'PageDown', 34)],
    ['Mayús+AvPág (tope de 90 días)', () => key(b, 'PageDown', 'PageDown', 34, 8)],
    ['Mayús+RePág', () => key(b, 'PageUp', 'PageUp', 33, 8)],
  ]) {
    await press()
    steps.push(`${label}: ${await b.ev(active)}`)
  }
  await b.enter()
  await sleep(100)
  expect('Calendar: Tab entra en el seleccionado; teclado APG; los pasados no se enfocan; Intro selecciona el 23 lleno', {
    tab: tabIntoCalendar,
    steps,
    seleccion: await b.ev(`${CAL}.querySelector('[aria-selected=true] .c-calendar-day')?.getAttribute('aria-label')`),
  }, {
    tab: 'martes 24 de abril de 2029, 6 horarios libres, seleccionado',
    steps: [
      '←: lunes 23 de abril de 2029, hoy, sin horarios',
      '← (22, fuera de rango): lunes 23 de abril de 2029, hoy, sin horarios',
      '↑ (16, fuera de rango): lunes 23 de abril de 2029, hoy, sin horarios',
      'Fin (fin de semana): domingo 29 de abril de 2029, sin horarios',
      'Inicio (principio de semana): lunes 23 de abril de 2029, hoy, sin horarios',
      '→ ↓ Inicio (30 → 30, lunes): lunes 30 de abril de 2029, 12 horarios libres',
      '↑ (23) y Fin: domingo 29 de abril de 2029, sin horarios',
      'AvPág: martes 29 de mayo de 2029, 12 horarios libres',
      'Mayús+AvPág (tope de 90 días): domingo 22 de julio de 2029, 12 horarios libres',
      'Mayús+RePág: lunes 23 de abril de 2029, hoy, sin horarios',
    ],
    seleccion: 'lunes 23 de abril de 2029, hoy, sin horarios, seleccionado',
  })

  // --- Estilos ----------------------------------------------------------------------------------------------
  await b.go(PAGE)
  expect('tabular-nums en hora, número del día y día del chip', await b.ev("['.c-time-slot', '.c-calendar-day', '.c-day-chip__day'].map((s) => getComputedStyle(document.querySelector(s)).fontVariantNumeric)"), ['tabular-nums', 'tabular-nums', 'tabular-nums'])
  const digits = `(() => { const host = document.querySelector('.c-time-slot'), w = (t) => { const s = document.createElement('span'); s.textContent = t; s.style.position = 'absolute'; host.append(s); const x = s.getBoundingClientRect().width; s.remove(); return Math.round(x * 10) / 10 }; return [w('11:11'), w('10:00')] })()`
  const tnum = await b.ev(digits)
  await b.style('.c-time-slot { font-variant-numeric: normal !important }')
  const proportional = await b.ev(digits)
  await b.unstyle()
  expect('tabular-nums: «11:11» y «10:00» miden lo mismo; contraprueba: sin él, distinto', { tabular: tnum[0] === tnum[1], sin: proportional[0] === proportional[1] }, { tabular: true, sin: false })

  const look = `(() => {
    const s = (e) => { const c = getComputedStyle(e); return c.borderTopStyle + ' ' + c.borderTopWidth + ' ' + c.textDecorationLine + ' ' + c.fontWeight }
    return {
      horaLlena: s(${LIVE}.querySelector('.c-time-slot[aria-disabled=true]')),
      horaElegida: s(${LIVE}.querySelector('.c-time-slot[aria-selected=true]')) + ' check ' + Boolean(${LIVE}.querySelector('.c-time-slot[aria-selected=true] svg')),
      diaLleno: s(${day(29)}),
      chipLleno: getComputedStyle(${LIVE}.querySelector('.c-day-chip--full')).borderTopStyle + ' ' + s(${LIVE}.querySelector('.c-day-chip--full .c-day-chip__day')).split(' ').slice(2).join(' '),
      pasado: s(${day(22)}) + ' ' + getComputedStyle(${day(22)}).color,
    }
  })()`
  expect('lleno = dashed nativo + tachado; seleccionada = borde 2 + check + peso; pasado = body-md secundario sin borde visible', await b.ev(look), {
    horaLlena: 'dashed 1px line-through 400',
    horaElegida: 'solid 2px none 600 check true',
    diaLleno: 'dashed 1px line-through 400',
    chipLleno: 'dashed line-through 400',
    pasado: `solid 1px none 400 ${await b.ev(role('--color-text-secondary'))}`,
  })

  // Anillo sobre la hora seleccionada: desfase 2, sobre la superficie (§3.1).
  await b.tabTo(`${LIVE}.querySelector('.c-time-slot[aria-selected=true]')`)
  const ring = await b.ev(`(() => { const c = getComputedStyle(document.activeElement); return c.outlineStyle + ' ' + c.outlineWidth + ' desfase ' + c.outlineOffset })()`)
  const ringColor = await b.ev(role('--color-focus-ring'))
  const surface = await b.ev(role('--color-surface'))
  const accent = await b.ev(role('--color-accent'))
  expect('anillo en la hora seleccionada: general, sobre la superficie 6.02:1; con −4 caería en el ámbar a 2.09:1', {
    anillo: ring, superficie: await b.ev(`(${contrast})(${JSON.stringify(ringColor)}, ${JSON.stringify(surface)})`), ambar: await b.ev(`(${contrast})(${JSON.stringify(ringColor)}, ${JSON.stringify(accent)})`),
  }, { anillo: 'solid 2px desfase 2px', superficie: 6.02, ambar: 2.09 })
  await b.tabTo(day(24))
  expect('anillo del día: general y dentro del envoltorio desplazable (no se recorta)', await b.ev(`(() => { const a = document.activeElement, c = getComputedStyle(a), r = a.getBoundingClientRect(), body = a.closest('.c-calendar__body').getBoundingClientRect(); return c.outlineWidth + ' ' + c.outlineOffset + ' ' + (r.left - 4 >= body.left - 0.5 && r.right + 4 <= body.right + 0.5) })()`), '2px 2px true')
  await b.tabTo(`${LIVE}.querySelector('.c-day-chip__input:checked')`)
  expect('anillo del chip: en la etiqueta, por :has(:focus-visible)', await b.ev("(() => { const c = getComputedStyle(document.activeElement.closest('.c-day-chip')); return c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineOffset })()"), 'solid 2px 2px')
  await b.ev('document.activeElement.blur(), true')

  // --- forced-colors (V8, medido) ---------------------------------------------------------------------
  await b.forcedColors(true)
  await b.go(PAGE)
  const forced = `(() => {
    const s = (e) => { const c = getComputedStyle(e); return c.backgroundColor + ' ' + c.color + ' ' + c.borderTopStyle + ' ' + c.borderTopColor }
    return {
      seleccionado: s(${day(24)}), libre: s(${day(25)}), lleno: s(${day(29)}), hoy: s(${day(23)}) + ' punto ' + getComputedStyle(${CAL}.querySelector('.c-calendar-day__today')).borderTopColor,
      chipSeleccionado: s(${LIVE}.querySelector('.c-day-chip:has(:checked)')), chip: s(${LIVE}.querySelectorAll('.c-day-chip')[2]),
      horaSeleccionada: s(${LIVE}.querySelector('.c-time-slot[aria-selected=true]')) + ' ' + getComputedStyle(${LIVE}.querySelector('.c-time-slot[aria-selected=true]')).borderTopWidth,
      avisoBarra: getComputedStyle(document.querySelectorAll('#kit-barras-variantes .c-booking-bar__meta svg')[1]).color,
    }
  })()`
  expect('forced-colors: SelectedItem en el día y el chip seleccionados (sin forced-color-adjust); lleno punteado; punto de hoy visible; la hora elegida con borde 2 y check', await b.ev(forced), {
    seleccionado: 'rgb(25, 103, 210) rgb(255, 255, 255) solid rgb(25, 103, 210)',
    libre: 'rgba(0, 0, 0, 0) rgb(255, 255, 255) solid rgb(255, 255, 255)',
    lleno: 'rgba(0, 0, 0, 0) rgb(255, 255, 255) dashed rgb(255, 255, 255)',
    hoy: 'rgba(0, 0, 0, 0) rgb(255, 255, 255) dashed rgb(255, 255, 255) punto rgb(255, 255, 255)',
    chipSeleccionado: 'rgb(25, 103, 210) rgb(255, 255, 255) solid rgb(25, 103, 210)',
    chip: 'rgb(0, 0, 0) rgb(255, 255, 255) solid rgb(255, 255, 255)',
    horaSeleccionada: 'rgb(0, 0, 0) rgb(255, 255, 255) solid rgb(255, 255, 255) 2px',
    avisoBarra: 'rgb(255, 255, 255)',
  })
  await b.style(':where([aria-selected=true]) > .c-calendar-day, .c-day-chip:has(:checked) { --_bg: var(--color-action) !important; --_border: var(--color-action) !important; --_fg: var(--color-on-action) !important; --_day: var(--color-on-action) !important }')
  expect('contraprueba: sin SelectedItem, el relleno del seleccionado se fuerza a Canvas, el mismo negro del fondo que un libre', await b.ev(`[getComputedStyle(${day(24)}).backgroundColor, getComputedStyle(${LIVE}.querySelector('.c-day-chip:has(:checked)')).backgroundColor, getComputedStyle(document.body).backgroundColor]`), ['rgb(0, 0, 0)', 'rgb(0, 0, 0)', 'rgb(0, 0, 0)'])
  await b.unstyle()
  await b.metrics(375, 900, 2)
  await b.shot('forced-calendario-24.png', await b.rect(CAL))
  // Lleno y seleccionado: el 29.
  await b.tabTo(day(24))
  await key(b, 'End', 'End', 35)
  await b.enter()
  await sleep(200)
  expect('forced-colors: lleno y seleccionado (29) conserva el tachado sobre SelectedItem', await b.ev(`(() => { const c = getComputedStyle(${day(29)}); return c.backgroundColor + ' ' + c.textDecorationLine + ' ' + c.borderTopStyle })()`), 'rgb(25, 103, 210) line-through solid')
  await b.ev('document.activeElement.blur(), true')
  await b.shot('forced-calendario-29.png', await b.rect(CAL))
  await b.shot('forced-selector.png', await b.rect(LIVE))
  await b.forcedColors(false)
  await b.shot('selector-375.png', await b.rect(LIVE))
  await b.shot('calendario-375.png', await b.rect(CAL))
  await b.metrics(375, 900, 1)

  // --- 320: 100 % y 200 %, con las dos barras --------------------------------------------------------------
  const SCOPE = '.c-day-chip, .c-time-slot, .c-slot-list__label, .c-calendar__month, .c-calendar-day, .c-calendar__legend'
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
      narrow[`${overlay ? 'superpuesta' : 'clásica'} ${zoom}`] = {
        desborde: await b.run(overflow),
        partidas: words.split,
        tira: await b.ev(`getComputedStyle(${LIVE}.querySelector('.c-day-strip')).gridTemplateColumns.split(' ').length`),
        horas: await b.ev(`getComputedStyle(${LIVE}.querySelector('.c-slot-list__group')).gridTemplateColumns.split(' ').length`),
        calendario: await b.ev(`(() => { const e = ${CAL}.querySelector('.c-calendar__body'); return e.scrollWidth > e.clientWidth ? 'se desplaza' : 'cabe' })()`),
      }
    }
  }
  expect('320: sin scroll de página ni palabras partidas; al 200 % la tira y las horas pasan a menos columnas y el calendario se desplaza en su envoltorio', narrow, {
    'clásica 100 %': { desborde: 0, partidas: [], tira: 7, horas: 3, calendario: 'cabe' },
    'clásica 200 %': { desborde: 0, partidas: [], tira: 3, horas: 1, calendario: 'se desplaza' },
    'superpuesta 100 %': { desborde: 0, partidas: [], tira: 7, horas: 3, calendario: 'cabe' },
    'superpuesta 200 %': { desborde: 0, partidas: [], tira: 3, horas: 1, calendario: 'se desplaza' },
  })
  // Con el calendario desplazable, las flechas llevan la celda enfocada a la vista.
  const inView = `(() => { const a = document.activeElement, r = a.getBoundingClientRect(), p = a.closest('.c-calendar__body').getBoundingClientRect(); return a.textContent + (r.left >= p.left - 0.5 && r.right <= p.right + 0.5 ? ' a la vista' : ' FUERA') })()`
  const scrolled = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.go(PAGE)
    await b.run(text200)
    await sleep(300)
    await b.tabTo(day(24))
    const seen = []
    for (let i = 0; i < 5; i++) {
      await right(b)
      seen.push(await b.ev(inView))
    }
    for (let i = 0; i < 6; i++) await left(b)
    seen.push(await b.ev(inView))
    scrolled[overlay ? 'superpuesta' : 'clásica'] = seen
  }
  const path = ['25 a la vista', '26 a la vista', '27 a la vista', '28 a la vista', '29 a la vista', '23 a la vista']
  expect('200 % a 320: → hasta el 29 y ← hasta el 23, la celda enfocada siempre a la vista', scrolled, { clásica: path, superpuesta: path })
  await b.style('.c-calendar__body { overflow-x: visible !important }')
  expect('contraprueba: sin el desplazamiento, la tabla sale de su envoltorio', await b.ev(`(() => { const t = ${CAL}.querySelector('.c-calendar__grid').getBoundingClientRect(), p = ${CAL}.getBoundingClientRect(); return t.right > p.right + 4 })()`), true)
  await b.unstyle()
  await b.style('.c-day-strip { grid-template-columns: repeat(7, minmax(0, 1fr)) !important }')
  expect('contraprueba: con 7 columnas fijas al 200 %, los chips se estrechan hasta 30 y el día desborda su chip', await b.ev(`(() => { const c = ${LIVE}.querySelector('.c-day-chip'), d = c.querySelector('.c-day-chip__weekday'); return Math.round(c.getBoundingClientRect().width) + ' ' + (d.scrollWidth > c.clientWidth) })()`), '30 true')
  await b.unstyle()
  await b.overlayScrollbars(false)

  // --- Booking Bar con la letra del navegador (tools.large-text) -----------------------------------------------
  const font = (px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
  const barState = `(() => {
    const slot = document.querySelector('.c-app-layout__bar'), bar = slot.querySelector('.c-booking-bar'), inner = bar.querySelector('.c-booking-bar__inner'), s = bar.querySelector('.c-booking-bar__summary').getBoundingClientRect(), k = bar.querySelector('.c-booking-bar__submit').getBoundingClientRect()
    return { letra: getComputedStyle(document.documentElement).fontSize, modo: matchMedia('(max-width: 18.75rem)').matches, posicion: getComputedStyle(slot).position, boton: k.top >= s.bottom ? 'debajo' : 'al lado', anchoBoton: Math.round(k.width) === Math.round(inner.clientWidth - parseFloat(getComputedStyle(inner).paddingLeft) * 2) ? 'completo' : 'intrínseco' }
  })()`
  const bars = {}
  for (const [width, px] of [[320, 16], [320, 24], [320, 32], [375, 20], [390, 20]]) {
    await b.overlayScrollbars(true)
    await b.metrics(width, 800, 1)
    await font(px)
    await b.go(PAGE)
    await sleep(200)
    bars[`${width} a ${px}`] = { ...(await b.ev(barState)), partidas: (await b.run(splitWords, '.c-app-layout__bar .c-booking-bar__title, .c-app-layout__bar .c-booking-bar__meta-text, .c-app-layout__bar .c-button')).split, desborde: await b.run(overflow) }
  }
  await font(16)
  expect('Booking Bar con la letra del navegador: texto grande en columna y botón completo; a 320 al 100 % y a 390 a 20, fuera del modo con el botón debajo (base de 9.5rem)', bars, {
    '320 a 16': { letra: '16px', modo: false, posicion: 'sticky', boton: 'debajo', anchoBoton: 'intrínseco', partidas: [], desborde: 0 },
    '320 a 24': { letra: '24px', modo: true, posicion: 'static', boton: 'debajo', anchoBoton: 'completo', partidas: [], desborde: 0 },
    '320 a 32': { letra: '32px', modo: true, posicion: 'static', boton: 'debajo', anchoBoton: 'completo', partidas: [], desborde: 0 },
    '375 a 20': { letra: '20px', modo: true, posicion: 'static', boton: 'debajo', anchoBoton: 'completo', partidas: [], desborde: 0 },
    '390 a 20': { letra: '20px', modo: false, posicion: 'sticky', boton: 'debajo', anchoBoton: 'intrínseco', partidas: [], desborde: 0 },
  })
  await b.metrics(390, 800, 1)
  await font(20)
  await b.go(PAGE)
  const lines = "[...document.querySelectorAll('.c-app-layout__bar .c-booking-bar__title, .c-app-layout__bar .c-booking-bar__meta')].map((e) => Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)))"
  const withBase = await b.ev(lines)
  await b.style('.c-booking-bar__summary { flex: 1 1 0 !important }')
  expect('contraprueba (390 a 20): sin la base, el botón se queda al lado y título y meta pasan de 1 línea a varias', { con: withBase, sin: { boton: (await b.ev(barState)).boton, lineas: await b.ev(lines) } }, { con: [1, 1], sin: { boton: 'al lado', lineas: [2, 2] } })
  await b.unstyle()
  await font(16)

  // Coste declarado (decisión C): por debajo de un ancho, al resumen no le
  // quedan los 152 y el botón baja; la barra mide 134 en vez de 74. Barrido
  // al 100 % con las dos barras de scroll: alto de la barra por ancho.
  const sweep = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    const heights = {}
    for (let width = 320; width <= 345; width++) {
      await b.metrics(width, 800, 1)
      await b.go(PAGE)
      heights[width] = await b.ev("document.querySelector('.c-app-layout__bar .c-booking-bar').getBoundingClientRect().height")
    }
    const values = Object.values(heights)
    sweep[overlay ? 'superpuesta' : 'clásica'] = { altos: [...new Set(values)], primero74: Number(Object.keys(heights).find((w) => heights[w] === 74)) }
  }
  expect('coste de C: barra de 134 hasta que el resumen tiene 152; de 74 desde 327 (superpuesta) y 342 (clásica); sin alturas intermedias', sweep, {
    clásica: { altos: [134, 74], primero74: 342 },
    superpuesta: { altos: [134, 74], primero74: 327 },
  })
  await b.overlayScrollbars(false)
  await b.metrics(1280, 900, 1)

  // --- Navegación en cliente desde /kit ---------------------------------------------------------------
  // Clic real en «Ver fecha y hora», bajada con la rueda y comparación con la
  // página recargada (navegacion.mjs). La medida se imprime, pero la línea es
  // un ✗ declarado mientras el resto de pintado no esté explicado o mitigado
  // con contraprueba (DESIGN.md, Pendientes, T0: no reproducido en 40
  // pasadas). Un 0 aquí no lo explica: el defecto era intermitente.
  const client = {}
  let counterNav = null
  for (const width of [1350, 375]) {
    await b.overlayScrollbars(false)
    await b.metrics(width, 900, 1)
    const { afterClient, afterReload, ...result } = await clientNavigation(b, {
      from: '/kit',
      link: 'Ver fecha y hora',
      to: PAGE,
      state: "({ avatares: document.querySelectorAll('.c-avatar').length, mains: document.querySelectorAll('main').length })",
    })
    client[width] = result
    // Si difieren, las dos capturas quedan en out/4.6 para mirarlas.
    if (result.pixelesDistintosDeLaRecarga !== 0) {
      await b.saveBase64(`navegacion-cliente-${width}.png`, afterClient)
      await b.saveBase64(`navegacion-recarga-${width}.png`, afterReload)
    }
    // Contraprueba (a 1350): un avatar de /kit detrás de la última barra se
    // nota en el DOM y en los píxeles.
    if (width === 1350) {
      await b.ev("(() => { const bar = [...document.querySelectorAll('#kit-barras-variantes .c-booking-bar')].pop(), a = document.createElement('span'); a.className = 'c-avatar c-avatar--small'; a.textContent = 'E'; a.style.cssText = 'position:absolute;left:40px;top:4px'; bar.style.position = 'relative'; bar.append(a); return true })()")
      await sleep(100)
      counterNav = { avatares: await b.ev("document.querySelectorAll('.c-avatar').length"), pixelesDistintos: (await b.ev(pixelDiff(afterReload, await viewport(b)))) !== 0 }
    }
  }
  const clientOk = { ruta: PAGE, sinRecarga: true, estado: { avatares: 0, mains: 1 }, pixelesDistintosDeLaRecarga: 0, cuatroSegundosDespues: 0 }
  expect(
    'navegación en cliente /kit → /kit/fecha-hora (clic real, sin recarga): sin restos de /kit en el DOM ni en los píxeles, y el resto de pintado explicado o mitigado (✗ declarado: DESIGN.md, Pendientes, T0)',
    { ...client, explicado: false },
    { 1350: clientOk, 375: clientOk, explicado: true },
  )
  expect('contraprueba: un avatar detrás de la última barra se detecta en el DOM y en los píxeles', counterNav, { avatares: 1, pixelesDistintos: true })
  await b.metrics(1280, 900, 1)

  // --- Estáticas: lint del reloj y tipos ---------------------------------------------------------------------
  expect(
    'lint del reloj (D4): new Date(), Date.now(), today() y now() fallan; TODAY de clock.ts pasa',
    lintLines(`import { now, today } from '@internationalized/date'
import { TODAY } from '../data/clock.ts'
export const a = new Date()
export const b = Date.now()
export const c = today('UTC')
export const d = now('UTC')
export const e = TODAY.add({ days: 1 })
`),
    ['1: no-restricted-imports', '1: no-restricted-imports', '3: no-restricted-syntax', '4: no-restricted-syntax'],
  )
  expect(
    'tipos: compilan los 7 válidos, fallan las 7 combinaciones prohibidas',
    typeErrorLines(`import { CalendarDate } from '@internationalized/date'
import BookingBar from '../components/BookingBar.tsx'
import Button from '../components/Button.tsx'
import Calendar from '../components/Calendar.tsx'
import DayStrip from '../components/DayStrip.tsx'
const d = new CalendarDate(2029, 4, 23), w = { date: d, free: 0 }, f = () => {}
export const V1 = () => <BookingBar selection="chosen" summary="s" meta="m" formId="f" submitLabel="Continuar" />
export const V2 = () => <BookingBar selection="none" formId="f" submitLabel="Confirmar hora" />
export const V3 = () => <BookingBar selection="missing" messageId="m" formId="f" submitLabel="Continuar" />
export const V4 = () => <DayStrip name="n" days={[w, w, w, w, w, w, w]} value={d} onChange={f} today={d} />
export const V5 = () => <Calendar value={null} onChange={f} today={d} maxValue={d} freeSlots={() => 0} focusedValue={d} onFocusChange={f} />
export const V6 = () => <Button type="submit" form="f">Enviar</Button>
export const V7 = () => <BookingBar selection="chosen" summary="s" meta="m" formId="f" submitLabel="Confirmar hora" />
export const P1 = () => <BookingBar selection="chosen" formId="f" submitLabel="Continuar" />
export const P2 = () => <BookingBar selection="missing" formId="f" submitLabel="Continuar" />
export const P3 = () => <BookingBar selection="none" summary="s" formId="f" submitLabel="Continuar" />
export const P4 = () => <BookingBar selection="none" formId="f" submitLabel="Confirmar el cambio" />
export const P5 = () => <DayStrip name="n" days={[w, w, w, w, w, w]} value={d} onChange={f} today={d} />
export const P6 = () => <Calendar value={null} onChange={f} today={d} maxValue={d} freeSlots={() => 0} />
export const P7 = () => <Button href="/x" form="f">Enviar</Button>
`),
    [14, 15, 16, 17, 18, 19, 20],
  )
}
