// 5.1 Búsqueda (V1a): la vista 1 contra sus pares de Figma (01.1, 01.3, 01.4
// a 375; 01.5, 01.6, 01.7 a 1440), la línea base y el alto de la cabecera de
// resultados, los anchos intermedios, el texto ampliado, forced-colors, el
// orden de Tab, el historial (push o replace) y el scroll de cada acción, los
// flujos de foco, la lista en carga, las fotos (sizes y loading) y el href de
// «Ver horarios». V1b: la fila del disparador, la hoja «Filtrar y ordenar»
// (01.2: pares, anchos, texto grande, forced-colors, teclado, borrador y
// cruce de lg), la acción del vacío con texto ampliado y el conmutador
// «Avisarme» (01.8, 01.9) con su persistencia (D16). `previewFlows` repite
// los flujos de foco contra pnpm preview (sin StrictMode): pnpm verify 5.1
// --preview.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation } from './navegacion.mjs'

const Q011 = '/?q=Cardiolog%C3%ADa&especialidad=cardiologia'
const Q013 = '/?q=Neurocirug%C3%ADa+pedi%C3%A1trica'
const COLONIA = '/?q=Dermatolog%C3%ADa&ubicacion=polanco'
const FILTROS = '/?q=Cardiolog%C3%ADa&especialidad=dermatologia'
const LENTA = '&escenario=lenta'

const focused = `(() => { const a = document.activeElement; return a.tagName + ' ' + (a.tagName === 'INPUT' || a.tagName === 'SELECT' ? a.name + '=' + a.value : a.textContent.trim().slice(0, 40)) })()`
const idx = 'history.state?.idx'
const names = "[...document.querySelectorAll('main .c-result-card__name')].map((h) => h.textContent)"
const font = (b, px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })

// Carga completa sin esperar a las fuentes más de lo justo: con «lenta», la
// medida de la carga tiene que llegar antes de los 1500 ms.
const BASE = process.env.VERIFY_BASE ?? 'http://localhost:5173'
const goFast = async (b, url) => {
  await b.send('Page.navigate', { url: BASE + url })
  for (let i = 0; i < 100; i++) {
    await sleep(50)
    if (await b.ev(`document.readyState === 'complete' && Boolean(document.querySelector('main h1')) && location.pathname + location.search === ${JSON.stringify(url)}`).catch(() => false)) break
  }
  await b.ev('document.fonts.ready.then(() => true)')
}
const until = async (b, expr, ms = 3000) => {
  for (let t = 0; t < ms && !(await b.ev(expr).catch(() => false)); t += 50) await sleep(50)
  await sleep(150)
}
const settled = (b) => until(b, "document.querySelector('.c-results-header__count')?.textContent !== 'Buscando…' && !document.querySelector('main [aria-busy]')")

const clickAt = async (b, expr, block = 'center') => {
  const { x, y } = await b.ev(`(() => { const e = ${expr}; ${block ? `e.scrollIntoView({ block: '${block}' });` : ''} const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
}
const byText = (selector, text) => `[...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent.trim() === ${JSON.stringify(text)})`

// --- Pares de Figma ----------------------------------------------------------------------------------------
// Coordenadas relativas al contenedor (esquina del h1): x, y, ancho, alto.
// Una medida fuera de ±1 px sale en `fuera`.
const geometry = (parts) => `(() => {
  const h = document.querySelector('main h1').getBoundingClientRect()
  const rel = (r) => [Math.round(r.x - h.x), Math.round(r.y - h.y), Math.round(r.width), Math.round(r.height)]
  const one = (s) => { const e = document.querySelector(s); return e ? rel(e.getBoundingClientRect()) : null }
  const union = (s) => { const rs = [...document.querySelectorAll(s)].map((e) => e.getBoundingClientRect()); if (!rs.length) return null; const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y)); return rel({ x, y, width: Math.max(...rs.map((r) => r.right)) - x, height: Math.max(...rs.map((r) => r.bottom)) - y }) }
  const parts = ${JSON.stringify(parts)}
  const out = {}
  for (const [name, [kind, s, i]] of Object.entries(parts)) {
    if (kind === 'one') out[name] = one(s)
    else if (kind === 'union') out[name] = union(s)
    else out[name] = (() => { const e = document.querySelectorAll(s)[i]; return e ? rel(e.getBoundingClientRect()) : null })()
  }
  return out
})()`

const pair = (actual, expected) => {
  const fuera = Object.entries(expected).filter(([k, e]) => {
    const a = actual[k]
    if (e === null || a === null) return e !== a
    return e.some((v, i) => v !== null && Math.abs(v - a[i]) > 1)
  }).map(([k, e]) => `${k}: ${JSON.stringify(actual[k])} (Figma ${JSON.stringify(e)})`)
  return fuera
}

const DESKTOP_PARTS = {
  titulo: ['one', 'main h1'],
  subtitulo: ['one', '.c-page-header__subtitle'],
  consulta: ['nth', '.c-search-form > .c-field', 0],
  ubicacion: ['nth', '.c-search-form > .c-field', 1],
  buscar: ['one', '.c-search-form__submit'],
  aside: ['one', 'main aside'],
  especialidad: ['nth', 'main aside fieldset', 0],
  modalidad: ['nth', 'main aside fieldset', 1],
  disponibilidad: ['nth', 'main aside fieldset', 2],
  limpiar: ['one', 'main aside .c-button'],
  cabecera: ['one', '.c-results-header'],
  recuento: ['one', '.c-results-header__count'],
  orden: ['one', '.c-results-header__sort'],
  tarjeta1: ['nth', 'main ul[role=list] > .c-result-card', 0],
  tarjeta2: ['nth', 'main ul[role=list] > .c-result-card', 1],
  tarjeta3: ['nth', 'main ul[role=list] > .c-result-card', 2],
  tarjeta4: ['nth', 'main ul[role=list] > .c-result-card', 3],
  paginacion: ['union', '.c-pagination__list > li'],
  vacio: ['one', '.c-empty-state'],
  placa: ['one', '.c-empty-state__badge'],
  tituloVacio: ['one', '.c-empty-state__title'],
  ayuda: ['one', '.c-empty-state__help'],
  accion: ['one', '.c-empty-state__action'],
  verMas: ['one', '.c-load-more'],
}

// El ancho del recuento es el de su texto (contenido, no construcción):
// «Buscando…» mide 81 en el navegador y 79 en Figma (avance de los glifos de
// Inter Variable). Se comparan su posición y su alto.
const common = {
  titulo: [0, 0, 1200, 44], subtitulo: [0, 52, 1200, 24],
  consulta: [0, 108, 776, 78], ubicacion: [792, 108, 288, 78], buscar: [1096, 136, 104, 50],
  aside: [0, 218, 320, 858], especialidad: [0, 270, 320, 316], modalidad: [0, 618, 320, 124], disponibilidad: [0, 774, 320, 220], limpiar: [0, 1026, 157, 50],
}
const cardsAt = (height) => Object.fromEntries([0, 1, 2, 3].map((i) => [`tarjeta${i + 1}`, [352, 320 + i * 230, 848, height]]))
const noEmpty = { vacio: null, placa: null, tituloVacio: null, ayuda: null, accion: null }
const FIGMA = {
  '01.5 (1440)': { ...common, cabecera: [352, 218, 848, 78], recuento: [352, 246, null, 50], orden: [912, 218, 288, 78], ...cardsAt(214), paginacion: [352, 1248, 365, 50], ...noEmpty, verMas: null },
  // Título del vacío con el copy de V1a (cambio frente a Figma declarado): una línea, como en 01.6.
  '01.6 (1440)': { ...common, cabecera: [352, 218, 848, 50], recuento: [352, 218, null, 50], orden: null, tarjeta1: null, paginacion: null, vacio: [352, 292, 848, 256], placa: [377, 317, 48, 48], tituloVacio: [377, 389, 798, 28], ayuda: [377, 425, 798, 24], accion: [377, 473, 257, 50], verMas: null },
  '01.7 (1440)': { ...common, cabecera: [352, 218, 848, 78], recuento: [352, 246, null, 50], orden: [912, 218, 288, 78], ...cardsAt(214), paginacion: null, ...noEmpty, verMas: null },
}
// Móvil (V1b): la fila de la cabecera, con el disparador a la izquierda y el
// recuento a la derecha, centrados (Figma items-center). Del disparador se
// comparan posición y alto; su ancho es el de su texto (231,3 y 201,4 frente
// a 233 y 202 de Figma, métrica de Inter Variable, igual que en 4.5). Del
// recuento, la y y el alto de su ranura de 50; su borde derecho, aparte.
const mobileCommon = { titulo: [0, 0, 343, 72], subtitulo: [0, 80, 343, 48], consulta: [0, 160, 343, 78], ubicacion: [0, 250, 343, 78], buscar: [0, 340, 343, 50], cabecera: [0, 422, 343, 50], disparador: [0, 422, null, 50], recuento: [null, 422, null, 50] }
const FIGMA_MOBILE = {
  '01.1 (375)': { ...mobileCommon, tarjeta1: [0, 496, 343, 294], tarjeta2: [0, 806, 343, 290], tarjeta3: [0, 1112, 343, 318], tarjeta4: [0, 1446, 343, 318], verMas: [0, 1788, 343, 82], vacio: null },
  '01.3 (375)': { ...mobileCommon, tarjeta1: null, vacio: [0, 496, 343, null], placa: [25, 521, 48, 48], tituloVacio: [25, 593, 293, null], accion: [25, null, 293, 50], verMas: null },
  '01.4 (375)': { ...mobileCommon, tarjeta1: [0, 496, 343, 290], tarjeta2: [0, 802, 343, 290], tarjeta3: [0, 1108, 343, 290], tarjeta4: [0, 1414, 343, 290], verMas: null, vacio: null },
}
const MOBILE_PARTS = { ...DESKTOP_PARTS, disparador: ['one', '.c-filter-trigger'] }

// Fila del disparador: texto del recuento a 15 de la fila (Figma y 15, alto
// 20) y pegado al borde derecho; ancho del disparador; píldora junto al texto
// (hueco space-2) y centrada en su línea.
const triggerRow = `(() => {
  const row = document.querySelector('.c-results-header').getBoundingClientRect()
  const t = document.querySelector('.c-filter-trigger'), c = document.querySelector('.c-results-header__count')
  const text = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect() }
  const label = t.querySelector('.c-button__label'), pill = t.querySelector('.c-filter-trigger__count')
  const words = [...label.childNodes].find((n) => n.nodeType === 3)
  const w = (() => { const r = document.createRange(); r.selectNodeContents(words); return r.getBoundingClientRect() })()
  return {
    disparador: Math.round(t.getBoundingClientRect().width * 10) / 10,
    recuentoY: Math.round(c.getBoundingClientRect().y + (c.getBoundingClientRect().height - 20) / 2 - row.y),
    recuentoDerecha: Math.round(text(c).right - row.right),
    pildora: pill ? { hueco: Math.round(pill.getBoundingClientRect().x - w.right), centro: Math.round((pill.getBoundingClientRect().y + 10) - (w.y + w.height / 2)) } : null,
  }
})()`

async function figmaPairs(b, expect) {
  await b.overlayScrollbars(true)
  const measured = {}
  await b.metrics(1440, 900, 1)
  for (const [name, url] of [['01.5 (1440)', Q011], ['01.6 (1440)', Q013], ['01.7 (1440)', Q011 + LENTA]]) {
    await goFast(b, url)
    const g = await b.ev(geometry(DESKTOP_PARTS))
    measured[name] = { recuento: await b.ev("document.querySelector('.c-results-header__count').textContent"), fuera: pair(g, FIGMA[name]) }
    await b.shot(`${name.slice(0, 4)}-1440.png`, { x: 0, y: 0, width: 1440, height: await b.ev('document.documentElement.scrollHeight') })
  }
  await b.metrics(375, 812, 1)
  const rows = {}
  for (const [name, url] of [['01.1 (375)', Q011], ['01.3 (375)', Q013], ['01.4 (375)', Q011 + LENTA]]) {
    await goFast(b, url)
    const g = await b.ev(geometry(MOBILE_PARTS))
    rows[name] = await b.ev(triggerRow)
    measured[name] = { recuento: await b.ev("document.querySelector('.c-results-header__count').textContent"), fuera: pair(g, FIGMA_MOBILE[name]) }
    await b.shot(`${name.slice(0, 4)}-375.png`, { x: 0, y: 0, width: 375, height: await b.ev('document.documentElement.scrollHeight') })
  }
  // El texto del recuento termina en el borde (0) o a 0,4 por el redondeo.
  expect('fila del disparador (V1b): recuento a 15 y pegado a la derecha; disparador de 231,3 y 201,4 (Figma 233 y 202, métrica); píldora a space-2 del texto y centrada', rows, {
    '01.1 (375)': { disparador: 231.3, recuentoY: 15, recuentoDerecha: 0, pildora: { hueco: 8, centro: 0 } },
    '01.3 (375)': { disparador: 201.4, recuentoY: 15, recuentoDerecha: 0, pildora: null },
    '01.4 (375)': { disparador: 231.3, recuentoY: 15, recuentoDerecha: 0, pildora: { hueco: 8, centro: 0 } },
  })
  // Contraprueba del modificador --trigger: con last baseline, sin contador
  // (01.3), el recuento baja 1, la cabecera mide 51 y el vacío baja 1. Con
  // contador (01.1) las líneas base coinciden y no cambia nada.
  const rowShift = "(() => { const h = document.querySelector('.c-results-header').getBoundingClientRect(), t = document.querySelector('main h1').getBoundingClientRect(); return { cabecera: Math.round(h.height), recuento: Math.round(document.querySelector('.c-results-header__count').getBoundingClientRect().y - h.y), siguiente: Math.round(document.querySelector('.c-empty-state, main ul[role=list]').getBoundingClientRect().y - t.y) } })()"
  const shift = {}
  for (const [name, url] of [['01.3', Q013], ['01.1', Q011]]) {
    await goFast(b, url)
    await b.style('.c-results-header--trigger { --_align: last baseline }')
    await sleep(100)
    shift[name] = await b.ev(rowShift)
    await b.unstyle()
  }
  expect('contraprueba: con last baseline, 01.3 (sin contador) mide 51 y el vacío baja a 497; 01.1 (con contador) no cambia', shift, { '01.3': { cabecera: 51, recuento: 1, siguiente: 497 }, '01.1': { cabecera: 50, recuento: 0, siguiente: 496 } })
  expect('pares de Figma a ±1 px (barra superpuesta; relativas al h1). Móvil con la fila del disparador (V1b)', measured, {
    '01.5 (1440)': { recuento: '34 resultados', fuera: [] },
    '01.6 (1440)': { recuento: '0 resultados', fuera: [] },
    '01.7 (1440)': { recuento: 'Buscando…', fuera: [] },
    '01.1 (375)': { recuento: '34 resultados', fuera: [] },
    '01.3 (375)': { recuento: '0 resultados', fuera: [] },
    '01.4 (375)': { recuento: 'Buscando…', fuera: [] },
  })
  await b.overlayScrollbars(false)
}

// --- Cabecera: línea base y alto -----------------------------------------------------------------------------
const headerState = `(() => {
  const h = document.querySelector('.c-results-header'), c = document.querySelector('.c-results-header__count'), s = document.querySelector('.c-results-header__sort select')
  // Línea base de un elemento: una sonda de alto 0 alineada con un clon suyo.
  // align-self en el clon: el select lleva last baseline (c-field) y quedaría
  // en otro grupo de alineación que la sonda.
  const base = (el) => { const row = document.createElement('div'); row.style.cssText = 'display:flex;align-items:baseline;position:absolute;top:0;left:0'; const p = document.createElement('span'); p.style.cssText = 'display:inline-block;width:0;height:0'; const clone = el.cloneNode(true); clone.style.alignSelf = 'baseline'; row.append(clone, p); document.body.append(row); const v = p.getBoundingClientRect().y - clone.getBoundingClientRect().y; row.remove(); return v }
  const r = (e) => e.getBoundingClientRect()
  // Solo si comparten línea: con la letra a 32 la columna mide 496 y el orden baja (flex-wrap).
  const sameLine = s && r(c).bottom > r(s).top
  return {
    cabecera: Math.round(r(h).height),
    recuento: Math.round(r(c).height),
    control: s ? Math.round(r(s).height) : null,
    lineaBase: sameLine ? Math.round((r(c).y + base(c)) - (r(s).y + base(s))) : null,
  }
})()`

async function header(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(1440, 900, 1)
  const out = {}
  for (const [name, url] of [['01.5', Q011], ['01.6', Q013], ['01.7', Q011 + LENTA]]) {
    for (const size of ['100 %', 'letra a 32']) {
      await goFast(b, url)
      if (size !== '100 %') await b.run(text200)
      await sleep(100)
      out[`${name} ${size}`] = await b.ev(headerState)
    }
  }
  // Al 100 %, 79 y no 78: la línea base del recuento (label, 30 desde arriba
  // en su caja de 50) y la del select (31) difieren en 1 px, y Figma centra.
  // Con la letra a 32 (inyección en html: la media query no se mueve y el
  // chrome sigue siendo el de escritorio) el aside mide 640, la columna 496 y
  // el orden baja de línea: 98 + 32 + 154 = 284.
  expect('cabecera: el recuento mide lo que el control (control-block-size) al 100 % y con la letra a 32; línea base común con el select', out, {
    '01.5 100 %': { cabecera: 79, recuento: 50, control: 50, lineaBase: 0 },
    '01.5 letra a 32': { cabecera: 284, recuento: 98, control: 98, lineaBase: null },
    '01.6 100 %': { cabecera: 50, recuento: 50, control: null, lineaBase: null },
    '01.6 letra a 32': { cabecera: 98, recuento: 98, control: null, lineaBase: null },
    '01.7 100 %': { cabecera: 79, recuento: 50, control: 50, lineaBase: 0 },
    '01.7 letra a 32': { cabecera: 284, recuento: 98, control: 98, lineaBase: null },
  })
  // Contraprueba: el literal 3.125rem se separa del control con la letra a 32.
  await goFast(b, Q013)
  await b.run(text200)
  await b.style('.c-results-header__count { min-block-size: 3.125rem }')
  await sleep(100)
  expect('contraprueba: con min-block-size 3.125rem y la letra a 32, el vacío de 01.6 mide 100 y el control 98', { cabecera: (await b.ev(headerState)).cabecera, control: await b.ev("Math.round(document.querySelector('.c-search-form select').getBoundingClientRect().height)") }, { cabecera: 100, control: 98 })
  await b.unstyle()
  await goFast(b, Q011)
  await b.style('.c-results-header { align-items: center }')
  await sleep(100)
  expect('contraprueba: con align-items center la línea base del recuento se separa de la del select', (await b.ev(headerState)).lineaBase !== 0, true)
  await b.unstyle()
  await b.overlayScrollbars(false)
}

// --- Anchos intermedios ----------------------------------------------------------------------------------------
async function widths(b, expect) {
  const avatar = "document.querySelector('main .c-result-card__avatar').getBoundingClientRect().width"
  const out = {}
  for (const [overlay, widthsList] of [[true, [607, 608]], [false, [622, 623]]]) {
    await b.overlayScrollbars(overlay)
    for (const w of widthsList) {
      await b.metrics(w, 900, 1)
      await b.go(Q011)
      out[`${overlay ? 'superpuesta' : 'clásica'} ${w}`] = await b.ev(avatar)
    }
  }
  expect('Row desde 608 de viewport (623 con barra clásica): avatar 48 → 64', out, { 'superpuesta 607': 48, 'superpuesta 608': 64, 'clásica 622': 48, 'clásica 623': 64 })

  await b.overlayScrollbars(true)
  const chrome = {}
  for (const w of [1023, 1024]) {
    await b.metrics(w, 900, 1)
    await b.go(Q011)
    chrome[w] = await b.ev("({ aside: Boolean(document.querySelector('main aside')), paginacion: Boolean(document.querySelector('.c-pagination')), verMas: Boolean(document.querySelector('.c-load-more')), orden: Boolean(document.querySelector('.c-results-header__sort')) })")
  }
  expect('D7 en lg: por debajo, «Ver más» sin aside ni orden; desde 1024, aside, orden y paginación', chrome, {
    1023: { aside: false, paginacion: false, verMas: true, orden: false },
    1024: { aside: true, paginacion: true, verMas: false, orden: true },
  })

  const rows = {}
  for (const [overlay, list] of [[true, [1069, 1070]], [false, [1084, 1085]]]) {
    await b.overlayScrollbars(overlay)
    for (const w of list) {
      await b.metrics(w, 900, 1)
      await b.go(`${Q011}&pagina=4`)
      rows[`${overlay ? 'superpuesta' : 'clásica'} ${w}`] = await b.ev("Math.round(document.querySelector('.c-pagination__list').getBoundingClientRect().height)")
    }
  }
  expect('paginación en una fila desde 1070 (1085 con barra clásica), en la página 4 (fila de 669)', rows, { 'superpuesta 1069': 108, 'superpuesta 1070': 50, 'clásica 1084': 108, 'clásica 1085': 50 })
  await b.overlayScrollbars(false)
}

// --- Texto ampliado ----------------------------------------------------------------------------------------
const TEXT = 'main h1, main h2, main h3, main p, main a, main button, main label, main legend'
async function zoom(b, expect) {
  const out = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 800, 1)
    for (const [name, url] of [['lista', Q011], ['vacío', Q013], ['carga', Q011 + LENTA]]) {
      await goFast(b, url)
      await b.run(text200)
      await sleep(100)
      const words = await b.run(splitWords, TEXT)
      out[`${overlay ? 'superpuesta' : 'clásica'} ${name}`] = { pudiendoCaber: words.couldFit, desborde: await b.run(overflow) }
    }
  }
  await b.overlayScrollbars(false)
  // Con barra clásica, «experiencia» sale por el margen de +0,5 del detector
  // (docs/verificacion.md, Trampas) y no cabía: 175,3 en un párrafo de 175 (ya
  // en 4.5). Hasta V1b salía también «los» (45,4 en el interior de 45 de «Ver
  // todos los especialistas»); con empty-state-compact el interior mide 77.
  expect('200 % a 320 con las dos barras: ninguna palabra partida pudiendo caber (salvo el margen del detector), sin desborde', out, {
    'clásica lista': { pudiendoCaber: ['experiencia'], desborde: 0 },
    'clásica vacío': { pudiendoCaber: [], desborde: 0 },
    'clásica carga': { pudiendoCaber: [], desborde: 0 },
    'superpuesta lista': { pudiendoCaber: [], desborde: 0 },
    'superpuesta vacío': { pudiendoCaber: [], desborde: 0 },
    'superpuesta carga': { pudiendoCaber: [], desborde: 0 },
  })

  const large = {}
  await b.metrics(375, 812, 1)
  for (const px of [24, 32]) {
    await font(b, px)
    for (const [name, url] of [['lista', Q011], ['vacío', Q013]]) {
      await b.go(url)
      const words = await b.run(splitWords, TEXT)
      large[`letra ${px} ${name}`] = { html: await b.ev('getComputedStyle(document.documentElement).fontSize'), pudiendoCaber: words.couldFit, desborde: await b.run(overflow) }
    }
  }
  await font(b, 16)
  expect('texto grande (letra del navegador a 24 y 32, 375): sin desborde ni palabras partidas pudiendo caber', large, {
    'letra 24 lista': { html: '24px', pudiendoCaber: [], desborde: 0 },
    'letra 24 vacío': { html: '24px', pudiendoCaber: [], desborde: 0 },
    'letra 32 lista': { html: '32px', pudiendoCaber: [], desborde: 0 },
    'letra 32 vacío': { html: '32px', pudiendoCaber: [], desborde: 0 },
  })

  // Fila del disparador (V1b) al 200 % a 320 y con la letra del navegador a 24
  // y 32, con las dos barras: envuelve sin partir palabras que quepan, y la
  // cabecera no se solapa con la lista.
  const rowState = `(() => {
    const h = document.querySelector('.c-results-header').getBoundingClientRect(), t = document.querySelector('.c-filter-trigger').getBoundingClientRect(), c = document.querySelector('.c-results-header__count').getBoundingClientRect()
    const list = document.querySelector('main ul[role=list]').getBoundingClientRect()
    return { envuelve: c.top >= t.bottom, dentro: t.bottom <= h.bottom && c.bottom <= h.bottom, solapa: h.bottom > list.top }
  })()`
  const row = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    const bar = overlay ? 'superpuesta' : 'clásica'
    await b.metrics(320, 800, 1)
    await goFast(b, Q011)
    await b.run(text200)
    await sleep(100)
    row[`${bar} 200 %`] = { ...(await b.ev(rowState)), pudiendoCaber: (await b.run(splitWords, '.c-results-header, .c-results-header *')).couldFit }
    for (const px of [24, 32]) {
      await font(b, px)
      await b.go(Q011)
      row[`${bar} letra ${px}`] = { ...(await b.ev(rowState)), pudiendoCaber: (await b.run(splitWords, '.c-results-header, .c-results-header *')).couldFit }
    }
    await font(b, 16)
  }
  await b.overlayScrollbars(false)
  const wrapped = { envuelve: true, dentro: true, solapa: false, pudiendoCaber: [] }
  expect('fila del disparador al 200 % a 320 y con la letra a 24 y 32 (dos barras): el recuento baja de línea, nada parte pudiendo caber y la lista no se solapa', row, {
    'clásica 200 %': wrapped, 'clásica letra 24': wrapped, 'clásica letra 32': wrapped,
    'superpuesta 200 %': wrapped, 'superpuesta letra 24': wrapped, 'superpuesta letra 32': wrapped,
  })
}

// --- Acción del vacío con texto ampliado (empty-state-compact) --------------------------------------------------------
async function emptyCompact(b, expect) {
  const state = "(() => { const box = document.querySelector('.c-empty-state__box'), a = document.querySelector('.c-empty-state__action'), s = getComputedStyle(a); return { padding: getComputedStyle(box).paddingLeft, interior: Math.round(a.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)) } })()"
  const out = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    const bar = overlay ? 'superpuesta' : 'clásica'
    for (const w of [320, 375]) {
      await b.metrics(w, 800, 1)
      await b.go(Q013)
      out[`${bar} ${w} 100 %`] = await b.ev(state)
    }
    await b.metrics(320, 800, 1)
    await b.go(Q013)
    await b.run(text200)
    await sleep(100)
    out[`${bar} 320 200 %`] = await b.ev(state)
  }
  // Al 100 %, marco de 24 (Figma 01.3); al 200 % a 320 el marco pasa a space-4
  // (32) y el interior de la acción, de 45/60 a 77/92: el mismo límite que el
  // CTA de Result Card (DESIGN.md § Contenedores).
  expect('vacío: marco de 24 al 100 % (320 y 375); al 200 % a 320, space-4 y un interior de 77/92 en la acción', out, {
    'clásica 320 100 %': { padding: '24px', interior: 173 }, 'clásica 375 100 %': { padding: '24px', interior: 228 },
    'clásica 320 200 %': { padding: '32px', interior: 77 },
    'superpuesta 320 100 %': { padding: '24px', interior: 188 }, 'superpuesta 375 100 %': { padding: '24px', interior: 243 },
    'superpuesta 320 200 %': { padding: '32px', interior: 92 },
  })
  // Contraprueba: con el umbral de dialog-compact (18.75rem) el marco pasa a
  // space-4 ya a 320 al 100 %, porque la raíz mide 288 = 18rem.
  await b.overlayScrollbars(true)
  await b.metrics(320, 800, 1)
  await b.go(Q013)
  await b.style('@container empty-state (min-width: 16.75rem) { .c-empty-state__box { padding: 1rem } } @container empty-state (min-width: 18.75rem) { .c-empty-state__box { padding: 1.5rem } }')
  await sleep(100)
  expect('contraprueba: con el umbral en 18.75rem, a 320 al 100 % el marco ya es compacto (16)', await b.ev("getComputedStyle(document.querySelector('.c-empty-state__box')).paddingLeft"), '16px')
  await b.unstyle()
  await b.overlayScrollbars(false)
}

// --- Hoja «Filtrar y ordenar» (01.2) -----------------------------------------------------------------------------
const SHEET = "document.querySelector('dialog.c-sheet')"
const openSheet = async (b, url = Q011) => {
  await goFast(b, url)
  await settled(b)
  await clickAt(b, "document.querySelector('.c-filter-trigger')")
  await until(b, `Boolean(${SHEET}?.open)`)
}
const sheetParts = `(() => {
  const d = ${SHEET}
  const r = (e) => { const x = e.getBoundingClientRect(); return [Math.round(x.x), Math.round(x.y), Math.round(x.width), Math.round(x.height)] }
  const q = (s) => d.querySelector(s)
  const [limpiar, ver] = d.querySelectorAll('.c-sheet__actions .c-button')
  return {
    hoja: r(d), cabecera: r(q('.c-sheet__header')), titulo: r(q('.c-sheet__title')), cerrar: r(q('.c-sheet__close')),
    ...Object.fromEntries([...d.querySelectorAll('fieldset')].map((f, i) => [['ordenar', 'especialidad', 'modalidad', 'disponibilidad'][i], r(f)])),
    cuerpo: [q('.c-sheet__body').scrollHeight, null, null, null],
    pie: r(q('.c-sheet__footer')), limpiar: r(limpiar), ver: r(ver),
  }
})()`

async function sheetLayout(b, expect) {
  await b.overlayScrollbars(true)
  await b.metrics(375, 812, 1)
  await openSheet(b)
  const g = await b.ev(sheetParts)
  await b.shot('01.2-375.png', await b.rect(SHEET))
  // 01.2 a 375 (la hoja es el viewport, 812): el pie va al fondo. Cuerpo: 976
  // de contenido, como el Sheet Body de Figma. Limpiar y Ver N, texto de Inter
  // Variable (107,4 y 223,6): dentro de ±1.
  expect('01.2 a ±1 px (375 × 812, barra superpuesta): cabecera 64, «Cerrar» en (323, 8), fieldsets, pie de 82 y sus dos botones', pair(g, {
    hoja: [0, 0, 375, 812], cabecera: [0, 0, 375, 64], titulo: [16, 16, null, 32], cerrar: [323, 8, 48, 48],
    ordenar: [16, 88, 343, 172], especialidad: [16, 292, 343, 316], modalidad: [16, 640, 343, 124], disponibilidad: [16, 796, 343, 220],
    cuerpo: [976, null, null, null], pie: [0, 730, 375, 82], limpiar: [16, 746, 108, 50], ver: [136, 746, 223, 50],
  }), [])
  expect('01.2: foco inicial en el título (panel 01.0), modal con nombre, título de página sin cambios', await b.ev(`({ foco: document.activeElement.tagName + ' ' + document.activeElement.textContent, modal: ${SHEET}.matches(':modal'), nombre: document.getElementById(${SHEET}.getAttribute('aria-labelledby')).textContent, titulo: document.title, ver: ${SHEET}.querySelector('.c-sheet__fill').textContent })`), { foco: 'H2 Filtrar y ordenar', modal: true, nombre: 'Filtrar y ordenar', titulo: 'Especialistas · Salvia', ver: 'Ver 34 resultados' })

  // Contraprueba del margen de «Cerrar»: sin él, en el eje del gutter (311).
  await b.style('.c-sheet__close { margin-inline-end: 0 }')
  await sleep(100)
  expect('contraprueba: sin el margen negativo, «Cerrar» cae en x 311', await b.ev(`Math.round(${SHEET}.querySelector('.c-sheet__close').getBoundingClientRect().x)`), 311)
  await b.unstyle()

  // Anchos: el interior en el eje de o-wrapper (título, fieldsets y «Limpiar»
  // a la izquierda; glifo de «Cerrar» y «Ver N» a la derecha), sin desborde.
  const axis = `(() => {
    const d = ${SHEET}, x = (s, side = 'left') => Math.round(d.querySelector(s).getBoundingClientRect()[side])
    const glyph = d.querySelector('.c-sheet__close svg').getBoundingClientRect()
    return { izquierda: new Set([x('.c-sheet__title'), x('fieldset'), x('.c-sheet__actions .c-button')]).size === 1 ? x('.c-sheet__title') : 'distintas', derecha: new Set([Math.round(glyph.right), x('.c-sheet__fill', 'right')]).size === 1 ? Math.round(glyph.right) : [Math.round(glyph.right), x('.c-sheet__fill', 'right')], desborde: d.scrollWidth - d.clientWidth }
  })()`
  const axes = {}
  for (const w of [320, 375, 768, 1023]) {
    await b.metrics(w, 812, 1)
    await openSheet(b)
    axes[w] = await b.ev(axis)
  }
  expect('anchos: interior en el eje de o-wrapper (16 hasta 640; centrado y 608 útiles en el tramo), glifo de «Cerrar» y «Ver N» en el mismo borde, sin desborde', axes, {
    320: { izquierda: 16, derecha: 304, desborde: 0 },
    375: { izquierda: 16, derecha: 359, desborde: 0 },
    768: { izquierda: 80, derecha: 688, desborde: 0 },
    1023: { izquierda: 208, derecha: 816, desborde: 0 },
  })

  // Scroll: cabecera y pie fijos; Tab real hasta «Este mes» (el último radio
  // del cuerpo) lo deja visible sobre el pie (2.4.11).
  await b.metrics(375, 812, 1)
  await openSheet(b)
  for (let i = 0; i < 11; i++) await b.tab()
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 })
  const fixed = await b.ev(`(() => { const d = ${SHEET}, a = document.activeElement.closest('label').getBoundingClientRect(), pie = d.querySelector('.c-sheet__footer').getBoundingClientRect(); return { foco: document.activeElement.name + ':' + document.activeElement.value, cuerpoDesplazado: d.querySelector('.c-sheet__body').scrollTop > 0, cabecera: Math.round(d.querySelector('.c-sheet__header').getBoundingClientRect().y), pie: Math.round(pie.y), visible: a.bottom <= pie.top } })()`)
  expect('cuerpo con scroll: cabecera en 0 y pie en 730 fijos; el radio con foco queda sobre el pie', fixed, { foco: 'disponibilidad:hoy', cuerpoDesplazado: true, cabecera: 0, pie: 730, visible: true })
  await b.overlayScrollbars(false)
}

async function sheetLargeText(b, expect) {
  const TEXT_SHEET = 'dialog h2, dialog label, dialog legend, dialog button'
  const state = `(() => { const d = ${SHEET}, body = d.querySelector('.c-sheet__body'); return { html: getComputedStyle(document.documentElement).fontSize, desplaza: d.scrollHeight > d.clientHeight ? 'hoja' : body.scrollHeight > body.clientHeight ? 'cuerpo' : 'nada', cabecera: getComputedStyle(d.querySelector('.c-sheet__header')).position, desborde: d.scrollWidth - d.clientWidth } })()`
  const out = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    const bar = overlay ? 'superpuesta' : 'clásica'
    for (const [w, px] of [[320, 24], [320, 32], [375, 20]]) {
      await b.metrics(w, 812, 1)
      await font(b, px)
      await openSheet(b)
      out[`${bar} ${w} letra ${px}`] = { ...(await b.ev(state)), pudiendoCaber: (await b.run(splitWords, TEXT_SHEET)).couldFit }
      if (w === 320 && px === 32) await b.shot(`01.2-320-letra-32-${bar}.png`, await b.rect(SHEET))
    }
    await font(b, 16)
  }
  await b.overlayScrollbars(false)
  // Con la letra a 32, «resultados» es más ancha que el interior de «Ver N» a
  // ancho completo (143/158): el límite ya declarado en § Controles.
  const big = (bar, px) => ({ html: `${px}px`, desplaza: 'hoja', cabecera: 'static', desborde: 0, pudiendoCaber: [] })
  expect('texto grande: la hoja entera se desplaza (cabecera y pie en el flujo), sin desborde ni palabras partidas pudiendo caber', out, {
    'clásica 320 letra 24': big('clásica', 24), 'clásica 320 letra 32': big('clásica', 32), 'clásica 375 letra 20': big('clásica', 20),
    'superpuesta 320 letra 24': big('superpuesta', 24), 'superpuesta 320 letra 32': big('superpuesta', 32), 'superpuesta 375 letra 20': big('superpuesta', 20),
  })
  // Contraprueba: sin la regla, a 320 con la letra a 32 al cuerpo le queda poco alto.
  await b.metrics(320, 812, 1)
  await font(b, 32)
  await openSheet(b)
  await b.style('.c-sheet, .c-sheet__form, .c-sheet__body { overflow: hidden } .c-sheet__form, .c-sheet__body { flex: 1 1 0 } .c-sheet__body { overflow-y: auto }')
  await sleep(100)
  expect('contraprueba: sin la regla de texto grande, a 320 con la letra a 32 el cuerpo mide menos de un tercio del viewport', await b.ev(`${SHEET}.querySelector('.c-sheet__body').clientHeight < 812 / 3`), true)
  await b.unstyle()
  await font(b, 16)
}

async function sheetForced(b, expect) {
  await b.metrics(375, 812, 1)
  await b.forcedColors(true)
  await openSheet(b)
  const probe = "(() => { const p = document.createElement('div'); p.style.color = 'CanvasText'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c })()"
  const text = await b.ev(probe)
  const borders = await b.ev(`(() => { const d = ${SHEET}, h = getComputedStyle(d.querySelector('.c-sheet__header')), f = getComputedStyle(d.querySelector('.c-sheet__footer')); return { cabecera: h.borderBottomColor === ${JSON.stringify(text)}, pie: f.borderTopColor === ${JSON.stringify(text)} } })()`)
  await b.shot('forced-colors-01.2.png', await b.rect(SHEET))
  await b.forcedColors(false)
  expect('forced-colors: bordes de cabecera y pie en CanvasText', borders, { cabecera: true, pie: true })
}

const escape = (b) => b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }).then(() => b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }))
const sheetFocus = `({ hoja: Boolean(${SHEET}), foco: document.activeElement.classList.contains('c-filter-trigger') ? 'disparador' : document.activeElement.tagName + ' ' + document.activeElement.textContent.trim().slice(0, 30), url: decodeURIComponent(location.search) })`

async function sheetKeyboard(b, expect) {
  await b.metrics(375, 812, 1)
  await goFast(b, Q011)
  await settled(b)
  await b.tabTo("document.querySelector('.c-filter-trigger')")
  await b.enter()
  await until(b, `Boolean(${SHEET}?.open)`)
  const opened = await b.ev("document.activeElement.tagName + ' ' + document.activeElement.textContent + ' ' + document.activeElement.matches(':focus-visible')")
  const stops = []
  for (let i = 0; i < 16; i++) {
    await b.tab()
    stops.push(await b.ev("(() => { const a = document.activeElement; if (!a.closest('dialog')) return a === document.body ? 'body' : 'PÁGINA ' + a.tagName; if (a.tagName === 'INPUT') return a.name + ':' + a.value; return a.getAttribute('aria-label') ?? a.textContent.trim() })()"))
  }
  // Tras «Ver N», el foco sale al marco del navegador (en headless, body o la
  // vuelta al principio del diálogo, según la versión de Edge: DESIGN.md §
  // Citas y diálogos); nunca a la página.
  const cycle = ['Cerrar', 'orden:disponibilidad', 'especialidad:cardiologia', 'especialidad:dermatologia', 'especialidad:pediatria', 'especialidad:ginecologia', 'especialidad:medicina-interna', 'especialidad:traumatologia', 'modalidad:presencial', 'modalidad:videoconsulta', 'disponibilidad:', 'Limpiar', 'Ver 34 resultados']
  expect('teclado: Intro abre con el foco en el título (anillo visible); Tab recorre la hoja en el orden del DOM y nunca llega a la página', { abrir: opened, recorrido: stops.slice(0, 13), fuera: stops.slice(13).filter((s) => s.startsWith('PÁGINA')) }, { abrir: 'H2 Filtrar y ordenar true', recorrido: cycle, fuera: [] })
  await escape(b)
  await until(b, `!${SHEET}`)
  expect('Escape: cierra, descarta y el foco vuelve al disparador', await b.ev(sheetFocus), { hoja: false, foco: 'disparador', url: '?q=Cardiología&especialidad=cardiologia' })
}

async function sheetDraft(b, expect) {
  await b.metrics(375, 812, 1)
  const out = {}
  const draftState = `({ ver: ${SHEET}.querySelector('.c-sheet__fill').textContent, region: ${SHEET}.querySelector('[role=status]').textContent, url: decodeURIComponent(location.search), foco: document.activeElement.tagName === 'INPUT' ? document.activeElement.name + ':' + document.activeElement.value : document.activeElement.textContent.trim() })`
  const tick = (value) => clickAt(b, `${SHEET}.querySelector('input[value="${value}"]').closest('label')`)

  // Borrador: marcar cambia «Ver N» y la región de la hoja; la URL no cambia.
  await openSheet(b)
  out.abrir = await b.ev(`${SHEET}.querySelector('[role=status]').textContent`)
  await tick('videoconsulta')
  await sleep(100)
  out.videoconsulta = await b.ev(draftState)
  await tick('experiencia')
  await sleep(100)
  // «Limpiar»: vacía los filtros del borrador, conserva el orden, no cierra.
  await clickAt(b, `${SHEET}.querySelectorAll('.c-sheet__actions .c-button')[0]`)
  await sleep(100)
  out.limpiar = { ...(await b.ev(draftState)), abierta: await b.ev(`Boolean(${SHEET})`), orden: await b.ev(`${SHEET}.querySelector('input[name=orden]:checked').value`), marcadas: await b.ev(`${SHEET}.querySelectorAll('input[type=checkbox]:checked').length`) }
  // «Cerrar»: descarta.
  await clickAt(b, `${SHEET}.querySelector('.c-sheet__close')`)
  await until(b, `!${SHEET}`)
  out.cerrar = await b.ev(sheetFocus)
  expect('borrador: «Ver N» y la región siguen al borrador sin tocar la URL; «Limpiar» vacía los filtros, conserva el orden y el foco; «Cerrar» descarta', out, {
    abrir: '',
    videoconsulta: { ver: 'Ver 11 resultados', region: '11 resultados', url: '?q=Cardiología&especialidad=cardiologia', foco: 'modalidad:videoconsulta' },
    limpiar: { ver: 'Ver 34 resultados', region: '34 resultados', url: '?q=Cardiología&especialidad=cardiologia', foco: 'Limpiar', abierta: true, orden: 'experiencia', marcadas: 0 },
    cerrar: { hoja: false, foco: 'disparador', url: '?q=Cardiología&especialidad=cardiologia' },
  })

  // «Ver N»: replace, sin subir el scroll, foco en el disparador, contador al día.
  await goFast(b, Q011)
  await settled(b)
  await b.ev("scrollTo(0, 250), true")
  await sleep(200)
  const before = await b.ev(`({ idx: ${idx}, scrollY: Math.round(scrollY) })`)
  await clickAt(b, "document.querySelector('.c-filter-trigger')", null)
  await until(b, `Boolean(${SHEET}?.open)`)
  await tick('dermatologia')
  await tick('presencial')
  await clickAt(b, `${SHEET}.querySelector('.c-sheet__fill')`)
  await until(b, `!${SHEET}`)
  await settled(b)
  const applied = await b.ev(`({ ...${sheetFocus}, historial: ${idx} === ${before.idx} ? 'replace' : 'otro', scrollIgual: Math.round(scrollY) === ${before.scrollY}, pildora: document.querySelector('.c-filter-trigger__count').textContent, nombre: document.querySelector('.c-filter-trigger').textContent, recuento: document.querySelector('.c-results-header__count').textContent })`)
  expect('«Ver N resultados»: aplica con replace y sin subir el scroll; el foco vuelve al disparador, con el contador de opciones marcadas', applied, {
    hoja: false, foco: 'disparador', url: '?q=Cardiología&especialidad=cardiologia&especialidad=dermatologia&modalidad=presencial',
    historial: 'replace', scrollIgual: true, pildora: '3', nombre: 'Filtrar y ordenar, 3 filtros aplicados3', recuento: '34 resultados',
  })

  // «Ver 0 resultados» no se deshabilita: lleva al vacío por filtros.
  await openSheet(b)
  await tick('cardiologia')
  await tick('pediatria')
  const zero = await b.ev(`${SHEET}.querySelector('.c-sheet__fill').textContent`)
  await clickAt(b, `${SHEET}.querySelector('.c-sheet__fill')`)
  await until(b, `!${SHEET}`)
  expect('«Ver 0 resultados» aplica y lleva al vacío por filtros; el foco en el disparador', { ver: zero, ...(await b.ev(`({ ...${sheetFocus}, vacio: document.querySelector('.c-empty-state__title')?.textContent })`)) }, { ver: 'Ver 0 resultados', hoja: false, foco: 'disparador', url: '?q=Cardiología&especialidad=pediatria', vacio: 'Ningún especialista cumple estos filtros' })

  // lenta: «Ver N» al momento; tras aplicar, «Buscando…» y el contador se mantiene.
  await openSheet(b, Q011 + LENTA)
  await tick('videoconsulta')
  const instant = await b.ev(`${SHEET}.querySelector('.c-sheet__fill').textContent`)
  await clickAt(b, `${SHEET}.querySelector('.c-sheet__fill')`)
  await sleep(200)
  const loading = await b.ev(`({ recuento: document.querySelector('.c-results-header__count').textContent, pildora: document.querySelector('.c-filter-trigger__count').textContent, foco: document.activeElement.classList.contains('c-filter-trigger') })`)
  await settled(b)
  expect('lenta: «Ver N» al momento (vista previa); tras aplicar, «Buscando…» con el contador y el foco en el disparador', { instant, loading }, { instant: 'Ver 11 resultados', loading: { recuento: 'Buscando…', pildora: '2', foco: true } })
}

// Página bloqueada bajo la hoja (html:has(dialog:modal), 04-elements): con
// barra clásica la hoja mide el viewport entero y, al cerrar, scrollY se
// conserva. «Ver N» con barra clásica lo mide sheetDraft (scrollIgual).
async function sheetLock(b, expect) {
  await b.overlayScrollbars(false)
  await b.metrics(375, 812, 1)
  await goFast(b, Q011)
  await settled(b)
  await b.ev("scrollTo(0, 250), true")
  await sleep(200)
  const y = await b.ev('Math.round(scrollY)')
  await clickAt(b, "document.querySelector('.c-filter-trigger')", null)
  await until(b, `Boolean(${SHEET}?.open)`)
  const open = await b.ev(`({ hoja: Math.round(${SHEET}.getBoundingClientRect().width), overflow: getComputedStyle(document.documentElement).overflowY })`)
  await clickAt(b, `${SHEET}.querySelector('.c-sheet__close')`)
  await until(b, `!${SHEET}`)
  expect('barra clásica: la hoja mide 375 con la página bloqueada; al cerrar, scrollY se conserva y la página vuelve a desplazarse', { ...open, scrollIgual: (await b.ev('Math.round(scrollY)')) === y && y > 0, despues: await b.ev('getComputedStyle(document.documentElement).overflowY') }, { hoja: 375, overflow: 'hidden', scrollIgual: true, despues: 'visible' })
  await b.style('html { overflow: visible !important }')
  await clickAt(b, "document.querySelector('.c-filter-trigger')")
  await until(b, `Boolean(${SHEET}?.open)`)
  expect('contraprueba: sin el bloqueo, con barra clásica la hoja mide 360', await b.ev(`Math.round(${SHEET}.getBoundingClientRect().width)`), 360)
  await escape(b)
  await b.unstyle()
}

// Cruce de lg con la hoja abierta: el disparador deja de existir (D7); el
// foco va al h1 (respaldo de D12), no a body.
async function sheetCrossing(b, expect) {
  await b.metrics(1000, 812, 1)
  await openSheet(b)
  await b.metrics(1100, 812, 1)
  await until(b, `!${SHEET}`)
  const after = await b.ev(`({ hoja: Boolean(${SHEET}), aside: Boolean(document.querySelector('main aside')), foco: document.activeElement.tagName + '#' + document.activeElement.id })`)
  await b.metrics(1000, 812, 1)
  await until(b, "Boolean(document.querySelector('.c-filter-trigger'))")
  const back = await b.ev(`Boolean(${SHEET})`)
  expect('cruce de lg con la hoja abierta: se cierra, el foco va al h1 (#contenido) y al volver bajo lg no se reabre', { ...after, reabierta: back }, { hoja: false, aside: true, foco: 'H1#contenido', reabierta: false })
}

// --- Conmutador «Avisarme» (01.8, 01.9) y su persistencia (D16) --------------------------------------------------
const RODRIGO = `[...document.querySelectorAll('main .c-result-card')].find((li) => li.querySelector('h3').textContent === 'Dr. Rodrigo Alcántara Vela')`
const toggleState = `(() => { const li = ${RODRIGO}, t = li.querySelector('.c-result-card__action'), icon = t.querySelector('svg'), card = li.querySelector('.c-result-card__card'); return { pulsado: t.getAttribute('aria-pressed'), etiqueta: t.textContent, foco: document.activeElement === t, check: icon ? Math.round(icon.getBoundingClientRect().x - t.getBoundingClientRect().x) : null, tarjeta: Math.round(card.getBoundingClientRect().height) } })()`

async function notifyToggle(b, expect) {
  await b.overlayScrollbars(true)
  const out = {}
  for (const [name, w] of [['01.8 (375)', 375], ['01.9 (1440)', 1440]]) {
    await b.metrics(w, 900, 1)
    await goFast(b, Q011)
    await clickAt(b, `${RODRIGO}.querySelector('.c-result-card__action')`)
    await sleep(100)
    out[name] = await b.ev(toggleState)
    await b.shot(`${name.slice(0, 4)}-${w}.png`, await b.rect(RODRIGO, 8))
  }
  // Check junto al padding (borde 1 + space-5 24): la etiqueta llena el resto
  // (Figma, Label en FILL). En Row, el CTA mide 200 y el grupo casi lo llena.
  expect('«Te avisaremos» (01.8 y 01.9): pulsado, foco en el botón, check a 25 del borde del CTA y tarjeta de 318 / 214', out, {
    '01.8 (375)': { pulsado: 'true', etiqueta: 'Te avisaremos', foco: true, check: 25, tarjeta: 318 },
    '01.9 (1440)': { pulsado: 'true', etiqueta: 'Te avisaremos', foco: true, check: 25, tarjeta: 214 },
  })
  await b.metrics(375, 900, 1)
  await b.style('.c-button__label { flex-grow: 0 }')
  await sleep(100)
  expect('contraprueba: sin el crecimiento de la etiqueta, el check se centra con el texto (lejos del padding)', (await b.ev(toggleState)).check > 60, true)
  await b.unstyle()
  await b.overlayScrollbars(false)

  // Persistencia (D16): perfil y Atrás, «Ver más»; al recargar, vuelve a «Avisarme».
  const persist = {}
  await b.metrics(375, 900, 1)
  await goFast(b, Q011)
  await clickAt(b, `${RODRIGO}.querySelector('.c-result-card__action')`)
  await sleep(100)
  await clickAt(b, byText('main a', 'Ver horarios'))
  await until(b, "location.pathname.startsWith('/especialistas/')")
  await b.ev('history.back(), true')
  await until(b, `location.pathname === '/' && Boolean(${RODRIGO})`)
  persist.volver = (await b.ev(toggleState)).pulsado
  await clickAt(b, byText('main button', 'Ver más especialistas'))
  await settled(b)
  persist.verMas = (await b.ev(toggleState)).pulsado
  await b.go(Q011)
  persist.recargar = (await b.ev(toggleState)).pulsado
  expect('persistencia (D16): sigue pulsado al volver del perfil y tras «Ver más»; al recargar, «Avisarme»', persist, { volver: 'true', verMas: 'true', recargar: 'false' })
}

// --- forced-colors -----------------------------------------------------------------------------------------
async function forced(b, expect) {
  await b.metrics(1440, 900, 1)
  await b.forcedColors(true)
  await b.go(Q013)
  const probe = "(() => { const p = document.createElement('div'); p.style.color = 'CanvasText'; document.body.append(p); const c = getComputedStyle(p).color; p.remove(); return c })()"
  const text = await b.ev(probe)
  const state = await b.ev(`(() => { const box = getComputedStyle(document.querySelector('.c-empty-state__box')), icon = getComputedStyle(document.querySelector('.c-empty-state__badge .c-icon')); return { borde: box.borderTopStyle + ' ' + box.borderTopWidth + ' ' + (box.borderTopColor === ${JSON.stringify(text)} ? 'CanvasText' : box.borderTopColor), glifo: icon.color === ${JSON.stringify(text)} ? 'CanvasText' : icon.color } })()`)
  await b.shot('forced-colors-01.6.png', await b.rect("document.querySelector('.c-empty-state')", 8))
  await b.go(Q011)
  const card = await b.ev(`(() => { const c = getComputedStyle(document.querySelector('.c-result-card__card')); return c.borderTopStyle + ' ' + c.borderTopWidth + ' ' + (c.borderTopColor === ${JSON.stringify(text)} ? 'CanvasText' : c.borderTopColor) })()`)
  await b.shot('forced-colors-01.5.png', await b.rect("document.querySelector('main ul[role=list]')", 8))
  await b.forcedColors(false)
  expect('forced-colors: marco del vacío y de la tarjeta en CanvasText; glifo de la placa visible (la placa pierde el relleno)', { ...state, tarjeta: card }, { borde: 'solid 1px CanvasText', glifo: 'CanvasText', tarjeta: 'solid 1px CanvasText' })
}

// --- Orden de Tab y encabezados ------------------------------------------------------------------------------
async function structure(b, expect) {
  await b.metrics(1440, 900, 1)
  await b.go(Q011)
  await b.ev("document.getElementById('contenido').focus(), true")
  const stops = []
  for (let i = 0; i < 40; i++) {
    await b.tab()
    const s = await b.ev(`(() => { const a = document.activeElement; if (a.tagName === 'INPUT') return a.type === 'radio' || a.type === 'checkbox' ? a.name + ':' + a.value : a.name; if (a.tagName === 'SELECT') return a.name; return a.textContent.trim() })()`)
    stops.push(s)
    if (s === 'Siguiente') break
  }
  expect('orden de Tab en 01.5 desde el h1: formulario → aside (radios: una parada) → orden → CTA → paginación', stops, [
    'q', 'ubicacion', 'Buscar',
    'especialidad:cardiologia', 'especialidad:dermatologia', 'especialidad:pediatria', 'especialidad:ginecologia', 'especialidad:medicina-interna', 'especialidad:traumatologia',
    'modalidad:presencial', 'modalidad:videoconsulta', 'disponibilidad:', 'Limpiar filtros',
    'orden', 'Ver horarios', 'Ver horarios', 'Ver horarios', 'Avisarme',
    'Página 1', 'Página 2', 'Página 9', 'Siguiente',
  ])

  const headings = "[...document.querySelectorAll('main h1, main h2, main h3')].map((h) => h.tagName + ' ' + h.textContent)"
  const outline = {}
  for (const [name, url] of [['lista', Q011], ['vacío', Q013], ['carga', Q011 + LENTA]]) {
    await goFast(b, url)
    outline[name] = await b.ev(headings)
  }
  expect('encabezados (diseño §3.7): la columna siempre tiene un h2; con lista, «Resultados» oculto y los nombres en h3', outline, {
    lista: ['H1 Encuentra a tu especialista', 'H2 Filtros', 'H2 Resultados', 'H3 Dra. Mariana Cifuentes Poza', 'H3 Dra. Elena Ruiz Arellano', 'H3 Dr. Joaquín Bermúdez Lara', 'H3 Dr. Rodrigo Alcántara Vela'],
    vacío: ['H1 Encuentra a tu especialista', 'H2 Filtros', 'H2 No encontramos especialistas para «Neurocirugía pediátrica»'],
    carga: ['H1 Encuentra a tu especialista', 'H2 Filtros', 'H2 Resultados'],
  })

  const copy = {}
  for (const [name, url] of [['colonia', COLONIA], ['filtros', FILTROS]]) {
    await b.go(url)
    copy[name] = await b.ev("[...document.querySelectorAll('.c-empty-state__title, .c-empty-state__help, .c-empty-state__action')].map((e) => e.tagName + ' ' + e.textContent)")
  }
  expect('vacío por colonia y por filtros (diseño §5.1): copy y control de su acción', copy, {
    colonia: ['H2 No encontramos especialistas para «Dermatología» en Polanco', 'P Prueba en toda la Ciudad de México o en otra colonia.', 'A Buscar en toda la Ciudad de México'],
    filtros: ['H2 Ningún especialista cumple estos filtros', 'P Quita algún filtro para ver más resultados.', 'BUTTON Limpiar filtros'],
  })
}

// --- Lista en carga (árbol accesible) ------------------------------------------------------------------------
const lists = (b) => b.send('Accessibility.getFullAXTree').then((r) => r.nodes.filter((n) => !n.ignored && n.role?.value === 'list').map((n) => `lista de ${(n.childIds ?? []).length}`).sort())
async function loadingTree(b, expect) {
  await b.metrics(375, 812, 1)
  await goFast(b, Q011 + LENTA)
  const during = { recuento: await b.ev("document.querySelector('.c-results-header__count').textContent"), ul: await b.ev("document.querySelector('main ul[role=list]').getAttribute('aria-hidden')"), listas: await lists(b) }
  await b.ev("document.querySelector('main ul[role=list]').removeAttribute('aria-hidden'), true")
  const counter = await lists(b)
  expect('carga completa: la lista entera fuera del árbol (solo queda la barra inferior); «Buscando…» en la región', during, { recuento: 'Buscando…', ul: 'true', listas: ['lista de 3'] })
  expect('contraprueba: sin aria-hidden en el ul, el lector encuentra una lista de 0 elementos', counter.includes('lista de 0'), true)
  await settled(b)
}

// --- Fotos: sizes y loading -------------------------------------------------------------------------------------
async function photos(b, expect) {
  const state = "Promise.all([...document.querySelectorAll('main .c-avatar__photo')].map((i) => i.decode().catch(() => null))).then(() => [...document.querySelectorAll('main .c-avatar__photo')].map((i) => Math.round(i.getBoundingClientRect().width) + ' ' + (i.currentSrc.match(/-(96|192)[-.]/) ?? [])[1] + ' ' + i.loading))"
  const out = {}
  for (const w of [375, 700, 1440]) {
    await b.metrics(w, 900, 2)
    await b.go(Q011)
    out[w] = await b.ev(state)
  }
  expect('fotos a 2x: sizes elige 96 en Stacked (48) y 192 en Row (64); eager en las dos primeras tarjetas y lazy en el resto', out, {
    375: ['48 96 eager', '48 96 eager', '48 96 lazy'],
    700: ['64 192 eager', '64 192 eager', '64 192 lazy'],
    1440: ['64 192 eager', '64 192 eager', '64 192 lazy'],
  })
  // Contraprueba con una sonda: cambiar sizes tras la carga no baja de
  // resolución, y una imagen nueva con el mismo srcset reutiliza la de 192 de
  // la caché. La sonda usa URL sin caché (y sin archivo): currentSrc dice qué
  // candidata eligió el navegador, se cargue o no.
  const fresh = (sizes) => `new Promise((ok) => { const n = Math.random().toString(36).slice(2); const i = new Image(64, 64); i.srcset = '/sonda-' + n + '-96.webp 96w, /sonda-' + n + '-192.webp 192w'; i.sizes = ${JSON.stringify(sizes)}; i.onerror = i.onload = () => { const v = (i.currentSrc.match(/-(96|192)\\.webp/) ?? [])[1]; i.remove(); ok(v) }; document.body.append(i) })`
  expect('contraprueba (1440, 2x, imagen nueva de 64): con el sizes por defecto de Small (3rem) elige la de 96; con el de la vista, la de 192', { defecto: await b.ev(fresh('3rem')), vista: await b.ev(fresh('(min-width: 38rem) 4rem, 3rem')) }, { defecto: '96', vista: '192' })
  await b.metrics(1280, 900, 1)
}

// --- «Ver horarios» y sujeción de página ---------------------------------------------------------------------------
async function links(b, expect) {
  await b.metrics(1440, 900, 1)
  const href = async (url) => {
    await goFast(b, url)
    await settled(b)
    return b.ev(`(() => { const u = new URL(${byText('main a', 'Ver horarios')}.href); return { ruta: u.pathname, parametros: [...u.searchParams] } })()`)
  }
  const second = await href(`${Q011}&orden=experiencia&pagina=2&escenario=lenta&ajeno=1`)
  const slug = await b.ev(`'/especialistas/' + [...document.querySelectorAll('main .c-result-card')].find((li) => li.querySelector('a'))?.querySelector('a').pathname.split('/').pop()`)
  expect('«Ver horarios» conserva los parámetros de V1 y el escenario (D1), comparado con URLSearchParams; lo ajeno se descarta', {
    '01.1': await href(Q011),
    'con orden, página, escenario y uno ajeno': { ...second, ruta: second.ruta === slug },
  }, {
    '01.1': { ruta: '/especialistas/mariana-cifuentes-poza', parametros: [['q', 'Cardiología'], ['especialidad', 'cardiologia']] },
    'con orden, página, escenario y uno ajeno': { ruta: true, parametros: [['q', 'Cardiología'], ['especialidad', 'cardiologia'], ['orden', 'experiencia'], ['pagina', '2'], ['escenario', 'lenta']] },
  })

  await b.go(`${Q011}&pagina=99`)
  const desktop = await b.ev(`({ url: location.search, actual: document.querySelector('.c-pagination [aria-current]').textContent, tarjetas: ${names}.length })`)
  await b.metrics(375, 812, 1)
  await b.go(`${Q011}&pagina=99`)
  const mobile = await b.ev("({ tarjetas: document.querySelectorAll('main .c-result-card').length, verMas: document.querySelector('.c-load-more').textContent })")
  expect('pagina=99 se sujeta a la última sin tocar la URL (D1)', { desktop, mobile }, {
    desktop: { url: '?q=Cardiolog%C3%ADa&especialidad=cardiologia&pagina=99', actual: 'Página 9', tarjetas: 2 },
    mobile: { tarjetas: 34, verMas: 'Has visto los 34 especialistas' },
  })
}

// --- Historial, scroll y foco de cada acción ----------------------------------------------------------------------
async function verMas(b, expect, lenta = false) {
  await b.metrics(375, 812, 1)
  await goFast(b, Q011 + (lenta ? LENTA : ''))
  await settled(b)
  const button = byText('main button', 'Ver más especialistas')
  await b.ev(`${button}.scrollIntoView({ block: 'center' }), true`)
  await sleep(200)
  const before = await b.ev(`({ scrollY: Math.round(scrollY), idx: ${idx} })`)
  await clickAt(b, button, null)
  const samples = []
  let during = null
  for (let t = 0; t < (lenta ? 2200 : 400); t += 100) {
    await sleep(100)
    samples.push(await b.ev('document.activeElement.tagName'))
    // Durante la carga: tarjetas y esqueletos, con aria-busy en la lista.
    if (lenta && t === 500) during = await b.ev("({ busy: document.querySelector('main ul[role=list]').getAttribute('aria-busy'), esqueletos: document.querySelectorAll('main .c-result-card[aria-hidden]').length, foco: document.activeElement.textContent })")
  }
  await settled(b)
  const after = await b.ev(`({ url: location.search, foco: ${focused} === 'H3 ' + ${names}[4], scrollY: Math.round(scrollY), idx: ${idx}, anillo: document.activeElement.matches(':focus-visible') })`)
  expect(`«Ver más»${lenta ? ' con lenta' : ''} (375): replace, sin subir el scroll y foco en el nombre de la primera tarjeta nueva${lenta ? '; nunca en body' : ''}`, { ...after, scrollIgual: after.scrollY === before.scrollY, idxIgual: after.idx === before.idx, body: samples.includes('BODY'), durante: during, scrollY: undefined, idx: undefined }, {
    url: '?q=Cardiolog%C3%ADa&especialidad=cardiologia' + (lenta ? '&escenario=lenta' : '') + '&pagina=2',
    foco: true,
    anillo: false,
    scrollIgual: true,
    idxIgual: true,
    body: false,
    durante: lenta ? { busy: 'true', esqueletos: 4, foco: 'Ver más especialistas' } : null,
  })
}

async function pageChange(b, expect) {
  await b.metrics(1440, 900, 1)
  await b.go(Q011)
  const before = await b.ev(idx)
  await clickAt(b, byText('.c-pagination a', 'Página 2'))
  await until(b, "location.search.includes('pagina=2')")
  expect('Page Link «2» (1440): push, sube arriba y foco en el nombre de la primera tarjeta', await b.ev(`({ foco: ${focused} === 'H3 ' + ${names}[0], scrollY: Math.round(scrollY), push: ${idx} === ${before} + 1, anillo: document.activeElement.matches(':focus-visible') })`), { foco: true, scrollY: 0, push: true, anillo: false })
}

async function pageChangeSlow(b, expect, from, link, to) {
  await b.metrics(1440, 900, 1)
  await goFast(b, `${Q011}&pagina=${from}${LENTA}`)
  await settled(b)
  await clickAt(b, byText('.c-pagination a', link))
  const samples = []
  let currentDuring = null
  for (let t = 0; t < 2200; t += 100) {
    await sleep(100)
    samples.push(await b.ev('document.activeElement.tagName'))
    if (t === 500) currentDuring = await b.ev("document.querySelector('.c-pagination [aria-current]')?.textContent ?? null")
  }
  await settled(b)
  const after = await b.ev(`({ foco: ${focused}, actual: document.querySelector('.c-pagination [aria-current]').textContent, primera: ${names}[0] })`)
  expect(`«${link}» ${from} → ${to} con lenta: la paginación muestra la página cargada hasta que llegan los datos y el foco nunca cae en body`, { body: samples.includes('BODY'), actualDurante: currentDuring, actual: after.actual, focoEnLaPrimera: after.foco === 'H3 ' + after.primera }, { body: false, actualDurante: `Página ${from}`, actual: `Página ${to}`, focoEnLaPrimera: true })
}

async function emptyActions(b, expect) {
  await b.metrics(1440, 900, 1)
  const run = async (url, text, selector = 'main .c-empty-state a') => {
    await b.go(url)
    const before = await b.ev(idx)
    await clickAt(b, byText(selector, text))
    await until(b, "!document.querySelector('.c-empty-state')")
    return b.ev(`({ url: decodeURIComponent(location.pathname + location.search), foco: ${focused} === 'H3 ' + ${names}[0], historial: ${idx} === ${before} ? 'replace' : ${idx} === ${before} + 1 ? 'push' : String(${idx}), anillo: document.activeElement.matches(':focus-visible') })`)
  }
  expect('acciones del vacío: dos enlaces (push, state.focus) y un botón (replace, ref) llevan el foco al nombre de la primera tarjeta', {
    'Ver todos los especialistas': await run(Q013, 'Ver todos los especialistas'),
    'Buscar en toda la Ciudad de México': await run(COLONIA, 'Buscar en toda la Ciudad de México'),
    'Limpiar filtros': await run(FILTROS, 'Limpiar filtros', 'main .c-empty-state button'),
  }, {
    'Ver todos los especialistas': { url: '/', foco: true, historial: 'push', anillo: false },
    'Buscar en toda la Ciudad de México': { url: '/?q=Dermatología', foco: true, historial: 'push', anillo: false },
    'Limpiar filtros': { url: '/?q=Cardiología', foco: true, historial: 'replace', anillo: false },
  })
}

async function stayingActions(b, expect) {
  await b.metrics(1440, 900, 1)
  const out = {}

  // «Buscar»: otra consulta. El foco se queda en el botón y la región anuncia.
  await b.go(Q011)
  let before = await b.ev(idx)
  await clickAt(b, "document.querySelector('.c-search-form input[name=q]')")
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 })
  await b.send('Input.insertText', { text: 'Pediatría' })
  await clickAt(b, "document.querySelector('.c-search-form__submit')")
  await until(b, "decodeURIComponent(location.search) === '?q=Pediatría'")
  out.Buscar = await b.ev(`({ url: decodeURIComponent(location.search), foco: ${focused}, historial: ${idx} === ${before} + 1 ? 'push' : 'otro', recuento: document.querySelector('.c-results-header__count').textContent })`)

  // Última casilla del aside, con la página bajada.
  await b.go(Q011)
  await b.ev('scrollTo(0, 300), true')
  await sleep(200)
  before = await b.ev(idx)
  await clickAt(b, "document.querySelector('main aside input[value=videoconsulta]').closest('label')", null)
  await until(b, "location.search.includes('videoconsulta')")
  out['casilla Videoconsulta'] = await b.ev(`({ url: decodeURIComponent(location.search), foco: ${focused}, historial: ${idx} === ${before} ? 'replace' : 'otro', scrollY: Math.round(scrollY) })`)

  // «Limpiar filtros» del aside, con la página bajada hasta verlo (600, o el
  // máximo si la página es más corta).
  await b.ev('scrollTo(0, 600), true')
  await sleep(200)
  before = await b.ev(idx)
  const scrolled = await b.ev('Math.round(scrollY)')
  await clickAt(b, "document.querySelector('main aside .c-button')", null)
  await until(b, "!location.search.includes('especialidad')")
  out['Limpiar filtros (aside)'] = await b.ev(`({ url: decodeURIComponent(location.search), foco: ${focused}, historial: ${idx} === ${before} ? 'replace' : 'otro', scrollIgual: Math.round(scrollY) === ${scrolled} && ${scrolled} > 0 })`)

  // «Ordenar por» con teclado: flecha abajo en el select cerrado.
  await b.go(Q011)
  before = await b.ev(idx)
  await b.ev("document.querySelector('.c-results-header__sort select').focus(), true")
  await b.arrowDown()
  await until(b, "location.search.includes('orden=')")
  out['Ordenar por'] = await b.ev(`({ url: decodeURIComponent(location.search), foco: ${focused}, historial: ${idx} === ${before} ? 'replace' : 'otro' })`)

  expect('«Buscar» (push), filtros, «Limpiar filtros» y orden (replace, sin subir el scroll): el foco se queda en su control', out, {
    Buscar: { url: '?q=Pediatría', foco: 'BUTTON Buscar', historial: 'push', recuento: '2 resultados' },
    'casilla Videoconsulta': { url: '?q=Cardiología&especialidad=cardiologia&modalidad=videoconsulta', foco: 'INPUT modalidad=videoconsulta', historial: 'replace', scrollY: 300 },
    'Limpiar filtros (aside)': { url: '?q=Cardiología', foco: 'BUTTON Limpiar filtros', historial: 'replace', scrollIgual: true },
    'Ordenar por': { url: '?q=Cardiología&especialidad=cardiologia&orden=experiencia', foco: 'SELECT orden=experiencia', historial: 'replace' },
  })
}

async function flows(b, expect) {
  await verMas(b, expect)
  await pageChange(b, expect)
  await emptyActions(b, expect)
  await stayingActions(b, expect)
  await verMas(b, expect, true)
  await pageChangeSlow(b, expect, 8, 'Siguiente', 9)
  await pageChangeSlow(b, expect, 2, 'Anterior', 1)
}

// Flujos de foco de la hoja (V1b): dependen del orden close() → foco, que
// StrictMode puede ocultar.
async function sheetFlows(b, expect) {
  await sheetKeyboard(b, expect)
  await sheetDraft(b, expect)
  await sheetLock(b, expect)
  await sheetCrossing(b, expect)
}

export async function previewFlows(b, expect) {
  await b.overlayScrollbars(false)
  await flows(b, expect)
  await sheetFlows(b, expect)
}

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.overlayScrollbars(false)
  await figmaPairs(b, expect)
  await header(b, expect)
  await widths(b, expect)
  await zoom(b, expect)
  await emptyCompact(b, expect)
  await forced(b, expect)
  await structure(b, expect)
  await loadingTree(b, expect)
  await photos(b, expect)
  await links(b, expect)
  await flows(b, expect)
  await sheetLayout(b, expect)
  await sheetLargeText(b, expect)
  await sheetForced(b, expect)
  await sheetFlows(b, expect)
  await notifyToggle(b, expect)

  // Navegación real hacia la vista: desde /kit/estados, «Resultados» (01.1).
  // Regla de T0: la línea repite la comprobación del resto de pintado y sigue
  // en ✗ declarado (explicado: false) aunque mida 0 (DESIGN.md, Pendientes).
  // park: el puntero dejaba en :hover la casilla que pasaba bajo él al bajar.
  await b.metrics(1350, 900, 1)
  const { afterClient, afterReload, ...nav } = await clientNavigation(b, { from: '/kit/estados', link: 'Resultados', to: Q011, park: true })
  if (nav.pixelesDistintosDeLaRecarga !== 0) {
    await b.saveBase64('navegacion-cliente-1350.png', afterClient)
    await b.saveBase64('navegacion-recarga-1350.png', afterReload)
  }
  expect(
    'navegación en cliente /kit/estados → 01.1 (clic real): sin restos en los píxeles, y el resto de pintado explicado o mitigado (✗ declarado: DESIGN.md, Pendientes, «Resto de pintado»)',
    { ...nav, explicado: false },
    { ruta: Q011, sinRecarga: true, estado: null, pixelesDistintosDeLaRecarga: 0, cuatroSegundosDespues: 0, explicado: true },
  )
  await b.metrics(1280, 900, 1)
}
