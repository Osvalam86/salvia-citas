// 5.1 Búsqueda (V1a): la vista 1 contra sus pares de Figma (01.1, 01.3, 01.4
// a 375; 01.5, 01.6, 01.7 a 1440), la línea base y el alto de la cabecera de
// resultados, los anchos intermedios, el texto ampliado, forced-colors, el
// orden de Tab, el historial (push o replace) y el scroll de cada acción, los
// flujos de foco, la lista en carga, las fotos (sizes y loading) y el href de
// «Ver horarios». `previewFlows` repite los flujos de foco contra pnpm preview
// (sin StrictMode): pnpm verify 5.1 --preview.
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
// Móvil: la fila de la cabecera (disparador a la izquierda, recuento a la
// derecha) es N/A → V1b; aquí solo su alto, 50.
const mobileCommon = { titulo: [0, 0, 343, 72], subtitulo: [0, 80, 343, 48], consulta: [0, 160, 343, 78], ubicacion: [0, 250, 343, 78], buscar: [0, 340, 343, 50], cabecera: [0, 422, 343, 50] }
const FIGMA_MOBILE = {
  '01.1 (375)': { ...mobileCommon, tarjeta1: [0, 496, 343, 294], tarjeta2: [0, 806, 343, 290], tarjeta3: [0, 1112, 343, 318], tarjeta4: [0, 1446, 343, 318], verMas: [0, 1788, 343, 82], vacio: null },
  '01.3 (375)': { ...mobileCommon, tarjeta1: null, vacio: [0, 496, 343, null], placa: [25, 521, 48, 48], tituloVacio: [25, 593, 293, null], accion: [25, null, 293, 50], verMas: null },
  '01.4 (375)': { ...mobileCommon, tarjeta1: [0, 496, 343, 290], tarjeta2: [0, 802, 343, 290], tarjeta3: [0, 1108, 343, 290], tarjeta4: [0, 1414, 343, 290], verMas: null, vacio: null },
}

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
  for (const [name, url] of [['01.1 (375)', Q011], ['01.3 (375)', Q013], ['01.4 (375)', Q011 + LENTA]]) {
    await goFast(b, url)
    const g = await b.ev(geometry(DESKTOP_PARTS))
    measured[name] = { recuento: await b.ev("document.querySelector('.c-results-header__count').textContent"), fuera: pair(g, FIGMA_MOBILE[name]) }
    await b.shot(`${name.slice(0, 4)}-375.png`, { x: 0, y: 0, width: 375, height: await b.ev('document.documentElement.scrollHeight') })
  }
  expect('pares de Figma a ±1 px (barra superpuesta; relativas al h1). Móvil: fila del disparador N/A → V1b', measured, {
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
  // Con barra clásica, dos palabras salen por el margen de +0,5 del detector
  // (docs/verificacion.md, Trampas) y ninguna cabía: «experiencia» (175,3 en
  // un párrafo de 175, ya en 4.5) y «los» (45,4 en el interior de 45 de «Ver
  // todos los especialistas»: padding de la caja y del botón al 200 %; coste
  // declarado en DESIGN.md § Controles con icono y etiqueta).
  expect('200 % a 320 con las dos barras: ninguna palabra partida pudiendo caber (salvo el margen del detector), sin desborde', out, {
    'clásica lista': { pudiendoCaber: ['experiencia'], desborde: 0 },
    'clásica vacío': { pudiendoCaber: ['los'], desborde: 0 },
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

export async function previewFlows(b, expect) {
  await b.overlayScrollbars(false)
  await flows(b, expect)
}

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.overlayScrollbars(false)
  await figmaPairs(b, expect)
  await header(b, expect)
  await widths(b, expect)
  await zoom(b, expect)
  await forced(b, expect)
  await structure(b, expect)
  await loadingTree(b, expect)
  await photos(b, expect)
  await links(b, expect)
  await flows(b, expect)

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
