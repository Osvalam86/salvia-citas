// 4.5 Búsqueda y resultados: Result Card, Filter Trigger, Pagination, Page
// Link y Load More; Avatar con --avatar-size. Todo en /kit/resultados.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { typeErrorLines } from './static.mjs'

const PAGE = '/kit/resultados'
const STATES = "document.getElementById('kit-lista-estados')"
const cards = `[...${STATES}.children]`
const button = (label) => `[...document.querySelectorAll('button')].find((x) => x.textContent === ${JSON.stringify(label)})`
const active = `(() => { const a = document.activeElement; return a.tagName + (a.getAttribute('tabindex') ? '[tabindex=' + a.getAttribute('tabindex') + ']' : '') + ' «' + a.textContent.trim().slice(0, 40) + '»' })()`

// Alto de cada tarjeta de la lista de estados, ancho del CTA y del avatar.
const cardSizes = `${cards}.map((li) => {
  const c = li.querySelector('.c-result-card__card'), a = li.querySelector('.c-result-card__action, .c-result-card__bone--action'), av = li.querySelector('.c-result-card__avatar')
  return Math.round(c.getBoundingClientRect().height) + ' cta ' + Math.round(a.getBoundingClientRect().width) + ' avatar ' + av.getBoundingClientRect().width
})`
const withWidth = async (b, width, expr) => {
  await b.style(`#kit-lista-estados { inline-size: ${width}px }`)
  await sleep(100)
  const value = await b.ev(expr)
  await b.unstyle()
  return value
}

// Elementos de la paginación como texto visible; la actual entre corchetes.
const paginationItems = `[...document.querySelectorAll('.c-pagination li')].map((li) => {
  const a = li.querySelector('a'), text = li.textContent.replace('Página ', '')
  return a?.getAttribute('aria-current') === 'page' ? '[' + text + ']' : text
})`

// Colores de fondo resueltos de un rol, con una sonda.
const role = (name) => `(() => { const p = document.createElement('div'); p.style.backgroundColor = 'var(${name})'; document.body.append(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c })()`

const ax = (b) => b.send('Accessibility.getFullAXTree').then((r) => r.nodes.filter((n) => !n.ignored))

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.overlayScrollbars(false)
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  await b.metrics(1280, 900, 1)
  await b.go(PAGE)

  // --- Result Card: forma y geometría --------------------------------------------------------------
  // Mariana, Elena, Joaquín, Rodrigo (Full) y el esqueleto.
  expect('Row a 848 (Figma: 214 en los tres estados), CTA 200, avatar 64', await withWidth(b, 848, cardSizes), Array(5).fill('214 cta 200 avatar 64'))
  // Figma 01.1 (Mobile · Resultados): Mariana 294, Elena 290, Joaquín 338,
  // Rodrigo 338; 01.4 (Mobile · Carga): Loading 290. Mismos textos, al píxel.
  expect('Stacked a 343 como en Figma 01.1 y 01.4, CTA a ancho completo, avatar 48', await withWidth(b, 343, cardSizes), [
    '294 cta 309 avatar 48',
    '290 cta 309 avatar 48',
    '338 cta 309 avatar 48',
    '338 cta 309 avatar 48',
    '290 cta 309 avatar 48',
  ])
  expect('umbral: li de 575 → Stacked (avatar 48), de 576 → Row (avatar 64)', [
    (await withWidth(b, 575, cardSizes))[1].split(' avatar ')[1],
    (await withWidth(b, 576, cardSizes))[1].split(' avatar ')[1],
  ], ['48', '64'])
  await b.style('.c-result-card { container-type: normal !important } #kit-lista-estados { inline-size: 848px }')
  expect('contraprueba: sin contenedor en el li, a 848 se queda en la base (avatar encima, CTA completo)', (await b.ev(cardSizes))[1], '330 cta 814 avatar 48')
  await b.unstyle()

  // Loading frente a Available: coinciden donde el texto ocupa las líneas del
  // esqueleto (la copia de Figma: Elena); con otro texto, no.
  const heights = `${cards}.map((li) => Math.round(li.firstChild.getBoundingClientRect().height))`
  const geometry = {}
  for (const width of [343, 575, 576, 608, 848]) geometry[width] = await withWidth(b, width, heights)
  expect('alto por ancho del li: Mariana, Elena, Joaquín, Rodrigo, Loading', geometry, {
    343: [294, 290, 338, 338, 290],
    575: [266, 266, 266, 266, 290],
    576: [242, 214, 242, 214, 214],
    608: [242, 214, 214, 214, 214],
    848: [214, 214, 214, 214, 214],
  })
  // Con 32rem, a 512 la columna medía 158 y la disponibilidad llegaba a 4 líneas.
  expect('Row a 576 (umbral): columna de disponibilidad y líneas de su texto, dos como mucho', await withWidth(b, 576, `${cards}.slice(0, 4).map((li) => { const a = li.querySelector('.c-result-card__availability'); return Math.round(a.getBoundingClientRect().width) + ' ' + Math.round(a.querySelector('.c-result-card__text').getBoundingClientRect().height / 24) + 'l' })`), ['222 1l', '222 2l', '222 2l', '222 2l'])
  // En la columna real: 608 útiles en el tramo móvil y 609 a 1024 con barra clásica.
  expect('Row en la columna de 608 y de 609: alto de cada tarjeta', { 608: geometry[608], 609: await withWidth(b, 609, heights) }, { 608: [242, 214, 214, 214, 214], 609: [242, 214, 214, 214, 214] })

  // --- Result Card: semántica -----------------------------------------------------------------------
  expect('esqueleto: li aria-hidden; la lista expone 4 h3 y ningún esqueleto', {
    oculto: await b.ev(`${cards}.map((li) => li.getAttribute('aria-hidden'))`),
    h3: (await ax(b)).filter((n) => n.role?.value === 'heading' && n.properties?.some((p) => p.name === 'level' && p.value.value === 3) && /^Dra?\. /.test(n.name.value)).map((n) => n.name.value).slice(0, 4),
  }, { oculto: [null, null, null, null, 'true'], h3: ['Dra. Mariana Cifuentes Poza', 'Dra. Elena Ruiz Arellano', 'Dr. Joaquín Bermúdez Lara', 'Dr. Rodrigo Alcántara Vela'] })
  expect('CTA: nombre por la etiqueta, descripción por el nombre del especialista', (await ax(b)).filter((n) => ['link', 'button'].includes(n.role?.value) && ['Ver horarios', 'Avisarme'].includes(n.name?.value)).slice(0, 4).map((n) => `${n.role.value} «${n.name.value}» · ${n.description?.value}`), [
    'link «Ver horarios» · Dra. Mariana Cifuentes Poza',
    'link «Ver horarios» · Dra. Elena Ruiz Arellano',
    'link «Ver horarios» · Dr. Joaquín Bermúdez Lara',
    'button «Avisarme» · Dr. Rodrigo Alcántara Vela',
  ])
  expect('texto de disponibilidad: Available body-strong en tinta, Full body-md secundario', await b.ev(`${cards}.slice(1, 4).map((li) => { const s = getComputedStyle(li.querySelector('.c-result-card__availability')); return s.fontWeight + ' ' + s.color })`), ['600 rgb(32, 30, 25)', '600 rgb(32, 30, 25)', '400 rgb(110, 104, 88)'])

  // --- Teclado y conmutador -----------------------------------------------------------------------
  const firstCta = `${STATES}.querySelector('.c-result-card__action')`
  await b.tabTo(firstCta)
  await b.tab()
  expect('Tab: el h3 no es un tope; del CTA de una tarjeta al de la siguiente', await b.ev(`document.activeElement === ${STATES}.children[1].querySelector('.c-result-card__action')`), true)
  const toggle = `${STATES}.children[3].querySelector('button')`
  const toggleState = `(() => { const t = ${toggle}; return { foco: document.activeElement === t, pulsado: t.getAttribute('aria-pressed'), etiqueta: t.textContent, check: Boolean(t.querySelector('svg')) } })()`
  await b.tabTo(toggle)
  expect('conmutador en reposo', await b.ev(toggleState), { foco: true, pulsado: 'false', etiqueta: 'Avisarme', check: false })
  await b.space()
  await sleep(100)
  expect('Espacio: pulsado, «Te avisaremos» con check, el foco se queda', await b.ev(toggleState), { foco: true, pulsado: 'true', etiqueta: 'Te avisaremos', check: true })
  expect('«Te avisaremos» + check en el CTA de 200 al 100 %: contenido e interior', await b.ev(`(() => { const t = ${toggle}, s = getComputedStyle(t), r = document.createRange(); r.selectNodeContents(t); return { cta: t.getBoundingClientRect().width, interior: t.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight), contenido: Math.round(r.getBoundingClientRect().width * 10) / 10, alto: t.getBoundingClientRect().height } })()`), { cta: 200, interior: 150, contenido: 139.7, alto: 50 })
  await b.enter()
  await sleep(100)
  expect('Intro: vuelve a «Avisarme», el foco se queda', await b.ev(toggleState), { foco: true, pulsado: 'false', etiqueta: 'Avisarme', check: false })

  // --- Filter Trigger -----------------------------------------------------------------------------
  expect('Filter Trigger: 0, 1 y 2 filtros; alto 50 y píldora de 20', await b.ev(`[...document.querySelectorAll('.c-filter-trigger')].map((t) => { const c = t.querySelector('.c-filter-trigger__count'); return Math.round(t.getBoundingClientRect().width * 10) / 10 + '×' + t.getBoundingClientRect().height + ' ' + t.getAttribute('aria-haspopup') + (c ? ' píldora ' + Math.round(c.getBoundingClientRect().width * 10) / 10 + '×' + c.getBoundingClientRect().height + ' aria-hidden=' + c.getAttribute('aria-hidden') : '') })`), [
    '201.4×50 dialog',
    '231.3×50 dialog píldora 21.9×20 aria-hidden=true',
    '234.1×50 dialog píldora 24.7×20 aria-hidden=true',
  ])
  // Chromium añade un espacio antes de la coma: el texto oculto está fuera del
  // flujo y el cálculo del nombre lo separa como un bloque. No se pronuncia.
  expect('Filter Trigger: nombre accesible', (await ax(b)).filter((n) => n.role?.value === 'button' && n.name?.value?.startsWith('Filtrar')).map((n) => n.name.value), [
    'Filtrar y ordenar',
    'Filtrar y ordenar , 1 filtro aplicado',
    'Filtrar y ordenar , 2 filtros aplicados',
  ])

  // --- Pagination -----------------------------------------------------------------------------------
  const expected = {
    1: ['[1]', '2', '…', '9', 'Siguiente'],
    2: ['Anterior', '1', '[2]', '3', '…', '9', 'Siguiente'],
    3: ['Anterior', '1', '2', '[3]', '4', '…', '9', 'Siguiente'],
    4: ['Anterior', '1', '2', '3', '[4]', '5', '…', '9', 'Siguiente'],
    5: ['Anterior', '1', '…', '4', '[5]', '6', '…', '9', 'Siguiente'],
    6: ['Anterior', '1', '…', '5', '[6]', '7', '8', '9', 'Siguiente'],
    7: ['Anterior', '1', '…', '6', '[7]', '8', '9', 'Siguiente'],
    8: ['Anterior', '1', '…', '7', '[8]', '9', 'Siguiente'],
    9: ['Anterior', '1', '…', '8', '[9]'],
  }
  const actual = {}
  const widths = {}
  for (let page = 1; page <= 9; page++) {
    await b.go(`${PAGE}?pagina=${page}`)
    actual[page] = await b.ev(paginationItems)
    widths[page] = await b.ev("Math.round([...document.querySelectorAll('.c-pagination li')].reduce((sum, li) => sum + li.getBoundingClientRect().width, 0) + 8 * (document.querySelectorAll('.c-pagination li').length - 1))")
  }
  expect('truncado en las 9 posiciones (salto de una página → número)', actual, expected)
  // 4, 5 y 6 miden lo mismo: con el salto de una página, el número ocupa la
  // celda que habría ocupado el «…».
  expect('ancho de la fila por posición (Figma: First 365, Middle 670, Last 355)', widths, { 1: 364, 2: 553, 3: 611, 4: 669, 5: 669, 6: 669, 7: 611, 8: 553, 9: 355 })

  await b.go(`${PAGE}?pagina=5`)
  expect('nav con nombre, un solo aria-current, «…» fuera del árbol, Page Link 50 × 50', {
    nav: await b.ev("document.querySelector('.c-pagination').tagName + ' «' + document.querySelector('.c-pagination').getAttribute('aria-label') + '»'"),
    actual: await b.ev("[...document.querySelectorAll('.c-pagination [aria-current]')].map((a) => a.getAttribute('aria-current') + ' ' + a.textContent)"),
    puntos: await b.ev("[...document.querySelectorAll('.c-pagination__gap')].map((li) => li.getAttribute('aria-hidden') + ' ' + li.getBoundingClientRect().width + '×' + li.getBoundingClientRect().height)"),
    numeros: await b.ev("[...new Set([...document.querySelectorAll('.c-page-link')].filter((a) => /\\d/.test(a.textContent)).map((a) => a.getBoundingClientRect().width + '×' + a.getBoundingClientRect().height))]"),
    nombres: (await ax(b)).filter((n) => n.role?.value === 'link' && /^(Página|Anterior|Siguiente)/.test(n.name?.value ?? '')).map((n) => n.name.value),
  }, {
    nav: 'NAV «Paginación»',
    actual: ['page Página 5'],
    puntos: ['true 50×50', 'true 50×50'],
    numeros: ['50×50'],
    nombres: ['Anterior', 'Página 1', 'Página 4', 'Página 5', 'Página 6', 'Página 9', 'Siguiente'],
  })
  expect('Page Link: tinta, peso, subrayado y relleno (no actual / actual)', await b.ev("['Página 4', 'Página 5'].map((t) => { const a = [...document.querySelectorAll('.c-page-link')].find((x) => x.textContent === t), s = getComputedStyle(a); return s.fontWeight + ' ' + s.color + ' ' + s.textDecorationLine + ' ' + s.backgroundColor + ' borde ' + s.borderTopColor })"), [
    `400 ${await b.ev(role('--color-text-link'))} underline rgba(0, 0, 0, 0) borde rgba(0, 0, 0, 0)`,
    `600 rgb(255, 255, 255) none ${await b.ev(role('--color-action'))} borde ${await b.ev(role('--color-action'))}`,
  ])
  const hoverBg = async (text) => {
    const { x, y } = await b.ev(`(() => { const a = [...document.querySelectorAll('.c-page-link')].find((x) => x.textContent === '${text}'); a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
    await b.mouse('mouseMoved', x, y)
    await sleep(100)
    const bg = await b.ev(`getComputedStyle([...document.querySelectorAll('.c-page-link')].find((x) => x.textContent === '${text}')).backgroundColor`)
    await b.mouse('mouseMoved', 1, 1)
    return bg
  }
  expect('hover: no actual con color-action-subtle; actual con color-action-hover', [await hoverBg('Página 4'), await hoverBg('Página 5')], [await b.ev(role('--color-action-subtle')), await b.ev(role('--color-action-hover'))])
  await b.tabTo("[...document.querySelectorAll('.c-page-link')].find((x) => x.textContent === 'Página 4')")
  expect('foco en Page Link: anillo general, radio 6', await b.ev("(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth + ' desfase ' + s.outlineOffset + ' radio ' + s.borderTopLeftRadius })()"), 'solid 2px desfase 2px radio 6px')

  // La fila más ancha (669 redondeado; 669,x sin redondear) frente a la
  // columna principal: cabe desde 670, es decir, desde 1070 de viewport (1085
  // con barra clásica). A 1024 la columna mide 624 (609 con barra clásica) y
  // la fila pasa a dos líneas.
  await b.go(`${PAGE}?pagina=4`)
  const rows = "(() => { const ul = document.querySelector('.c-pagination__list'); return { filas: new Set([...ul.children].map((li) => Math.round(li.getBoundingClientRect().top))).size, altoMax: Math.max(...[...ul.querySelectorAll('a')].map((a) => a.getBoundingClientRect().height)) } })()"
  const inColumn = async (width, extra = '') => {
    await b.style(`.c-pagination { inline-size: ${width}px } ${extra}`)
    const value = await b.ev(rows)
    await b.unstyle()
    return value
  }
  expect('Pagination (actual 4) por ancho de columna: filas y alto máximo de enlace', { 670: await inColumn(670), 669: await inColumn(669), 624: await inColumn(624), 609: await inColumn(609) }, {
    670: { filas: 1, altoMax: 50 },
    669: { filas: 2, altoMax: 50 },
    624: { filas: 2, altoMax: 50 },
    609: { filas: 2, altoMax: 50 },
  })
  expect('contraprueba: sin flex-wrap, a 609 los enlaces encogen y «Anterior» se deforma', await inColumn(609, '.c-pagination__list { flex-wrap: nowrap !important }'), { filas: 1, altoMax: 102 })

  // --- Load More ------------------------------------------------------------------------------------
  await b.go(PAGE)
  const LIST = "document.getElementById('kit-lista-ver-mas')"
  const loadState = `(() => { const l = ${LIST}; return { busy: l.getAttribute('aria-busy'), tarjetas: l.querySelectorAll('h3').length, esqueletos: l.querySelectorAll('li[aria-hidden=true]').length, recuento: document.querySelector('.c-load-more__count').textContent, boton: ${button('Ver más especialistas')}?.textContent ?? null } })()`
  await b.style('.c-load-more { inline-size: 343px }')
  expect('Load More a 343: alto 82 como en Figma 01.1 (recuento 20 + 12 + botón 50)', await b.ev("(() => { const r = document.querySelector('.c-load-more').getBoundingClientRect(); return r.width + '×' + r.height })()"), '343×82')
  await b.unstyle()
  expect('Load More en reposo', await b.ev(loadState), { busy: 'false', tarjetas: 4, esqueletos: 0, recuento: 'Mostrando 4 de 12 especialistas', boton: 'Ver más especialistas' })
  await b.tabTo(button('Ver más especialistas'))
  await b.enter()
  await sleep(100)
  await b.enter()
  await sleep(100)
  expect('al pulsar: aria-busy, 4 esqueletos al final; el segundo Intro se ignora', await b.ev(loadState), { busy: 'true', tarjetas: 4, esqueletos: 4, recuento: 'Mostrando 4 de 12 especialistas', boton: 'Ver más especialistas' })
  await sleep(1000)
  expect('al terminar: foco en el nombre de la primera tarjeta nueva, con anillo; etiqueta estable', {
    ...(await b.ev(loadState)),
    foco: await b.ev(active),
    esLaQuinta: await b.ev(`document.activeElement === ${LIST}.children[4].querySelector('h3')`),
    anillo: await b.ev("(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.matches(':focus-visible') + ' ' + s.outlineStyle + ' ' + s.outlineWidth })()"),
  }, { busy: 'false', tarjetas: 8, esqueletos: 0, recuento: 'Mostrando 8 de 12 especialistas', boton: 'Ver más especialistas', foco: 'H3[tabindex=-1] «Dra. Mariana Cifuentes Poza»', esLaQuinta: true, anillo: 'true solid 2px' })

  // Contraprueba: si el nombre no es destino de foco programático, el foco no llega.
  await b.ev(`(() => { new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.querySelectorAll?.('h3').forEach((h) => h.removeAttribute('tabindex'))))).observe(${LIST}, { childList: true }); return true })()`)
  await b.tabTo(button('Ver más especialistas'))
  await b.enter()
  await sleep(1100)
  expect('contraprueba: sin tabindex=-1 en el h3, el foco no llega al nombre', await b.ev("document.activeElement.tagName"), 'BODY')
  expect('Complete: sin botón, «Has visto los 12 especialistas»', await b.ev(loadState), { busy: 'false', tarjetas: 12, esqueletos: 0, recuento: 'Has visto los 12 especialistas', boton: null })

  // --- Movimiento -----------------------------------------------------------------------------------
  const bone = "getComputedStyle(document.querySelector('.c-result-card__bone'))"
  expect('brillo sin movimiento reducido: 1,5 s × 3 pasadas (4,5 s, por debajo de los 5 s de 2.2.2)', await b.ev(`${bone}.animationName + ' ' + ${bone}.animationDuration + ' × ' + ${bone}.animationIterationCount`), 'c-result-card-shimmer 1.5s × 3')
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  expect('con movimiento reducido: sin animación ni degradado', await b.ev(`${bone}.animationName + ' ' + ${bone}.backgroundImage`), 'none none')
  await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })

  // --- forced-colors --------------------------------------------------------------------------------
  await b.forcedColors(true)
  await b.go(`${PAGE}?pagina=5`)
  const forced = `(() => {
    const s = (el) => getComputedStyle(el)
    const bone = s(document.querySelector('.c-result-card__bone--name')), pill = s(document.querySelector('.c-filter-trigger__count')), current = s(document.querySelector('.c-page-link[aria-current]')), card = s(document.querySelector('.c-result-card__card'))
    return {
      tarjeta: card.borderTopStyle + ' ' + card.borderTopColor,
      barra: bone.borderTopWidth + ' ' + bone.borderTopColor,
      pildora: pill.outlineStyle + ' ' + pill.outlineWidth + ' ' + pill.outlineColor + ' desfase ' + pill.outlineOffset + ' alto ' + document.querySelector('.c-filter-trigger__count').getBoundingClientRect().height,
      actual: current.borderTopColor,
      iconos: [...new Set([...document.querySelectorAll('.c-result-card svg, .c-filter-trigger svg, .c-page-link svg')].map((i) => s(i).color))],
    }
  })()`
  const forcedValue = await b.ev(forced)
  expect('forced-colors: borde de tarjeta, contorno de barras y píldora, borde de la página actual, iconos en el color forzado', forcedValue, {
    tarjeta: 'solid rgb(255, 255, 255)',
    barra: '1px rgb(255, 255, 255)',
    pildora: 'solid 1px rgb(255, 255, 255) desfase -1px alto 20',
    actual: 'rgb(255, 255, 0)',
    iconos: ['rgb(255, 255, 255)', 'rgb(255, 255, 0)'],
  })
  await b.style('.c-filter-trigger__count { outline: none !important } .c-result-card__bone { border: 0 !important }')
  expect('contraprueba: sin outline ni borde transparentes, píldora y barras sin contorno', await b.ev("[getComputedStyle(document.querySelector('.c-filter-trigger__count')).outlineStyle, getComputedStyle(document.querySelector('.c-result-card__bone--name')).borderTopWidth]"), ['none', '0px'])
  await b.unstyle()
  await b.metrics(1280, 900, 2)
  await b.shot('forced-resultados.png', await b.rect(`${STATES}`))
  await b.shot('forced-filtros-paginacion.png', await b.rect("document.getElementById('kit-filter-trigger').closest('section')"))
  await b.forcedColors(false)
  await b.metrics(1280, 900, 1)

  // --- Umbral de identidad (14rem): 448 con la letra al doble ---------------------------------------
  // En una container query, rem sigue a la letra del html: la inyección en
  // html y Page.setFontSizes (la letra del navegador) mueven el umbral igual,
  // a diferencia de una media query (docs/verificacion.md, Trampas).
  const identity = `(() => { const li = ${STATES}.children[1], a = li.querySelector('.c-avatar').getBoundingClientRect(), h = li.querySelector('.c-result-card__heading').getBoundingClientRect(); return (a.bottom <= h.top ? 'encima' : 'al lado') + ' · html ' + getComputedStyle(document.documentElement).fontSize })()`
  const font = (px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
  const identityAt = async () => ({ 447: await withWidth(b, 447, identity), 448: await withWidth(b, 448, identity) })
  await b.go(PAGE)
  const at100 = await withWidth(b, 223, identity)
  const at100b = await withWidth(b, 224, identity)
  await b.run(text200)
  await sleep(200)
  const injected = await identityAt()
  await b.go(PAGE)
  await font(32)
  await sleep(200)
  const browserFont = await identityAt()
  await font(16)
  expect('umbral de identidad: 224 al 100 %; 448 con la letra al doble, por inyección y por Page.setFontSizes', { '100 %': { 223: at100, 224: at100b }, inyeccion: injected, setFontSizes: browserFont }, {
    '100 %': { 223: 'encima · html 16px', 224: 'al lado · html 16px' },
    inyeccion: { 447: 'encima · html 32px', 448: 'al lado · html 32px' },
    setFontSizes: { 447: 'encima · html 32px', 448: 'al lado · html 32px' },
  })

  // --- 320 con las dos barras, al 100 % y al 200 % --------------------------------------------------
  // Cada texto contra su propio interior: una palabra que parte en un botón
  // más estrecho que ella no es la que la regla prohíbe.
  const SCOPE = '.c-result-card__name, .c-result-card__specialty, .c-result-card__location, .c-result-card__availability, .c-result-card__action, .c-tag, .c-filter-trigger, .c-page-link, .c-load-more__count, .c-load-more__action'
  const narrow = {}
  for (const overlay of [false, true]) {
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900, 2)
    await b.go(`${PAGE}?pagina=4`)
    for (const zoom of ['100 %', '200 %']) {
      if (zoom === '200 %') {
        await b.run(text200)
        await sleep(300)
      }
      const words = await b.run(splitWords, SCOPE)
      narrow[`${overlay ? 'superpuesta' : 'clásica'} ${zoom}`] = {
        desborde: await b.run(overflow),
        pudiendoCaber: words.couldFit,
        avatar: await b.ev(`${STATES}.querySelector('.c-avatar').getBoundingClientRect().width`),
        encabezado: await b.ev(`Math.round(${STATES}.querySelector('.c-result-card__heading').getBoundingClientRect().width)`),
        partidas: words.split,
      }
    }
  }
  // Al 200 % parten solo palabras más anchas que su elemento. «experiencia»
  // (175,3) en un párrafo de 175 con barra clásica: no cabe; la marca el
  // margen de +0,5 del detector.
  expect('320: sin scroll horizontal ni palabras partidas pudiendo caber; al 200 % el avatar sube y el encabezado ocupa el ancho', narrow, {
    'clásica 100 %': { desborde: 0, pudiendoCaber: [], avatar: 48, encabezado: 179, partidas: [] },
    'clásica 200 %': { desborde: 0, pudiendoCaber: ['experiencia'], avatar: 96, encabezado: 175, partidas: ['Cifuentes', 'Presencial', 'videoconsulta', 'horarios', 'experiencia', 'Bermúdez', 'intervencionista', 'Alcántara', 'Electrofisiología', 'disponibilidad', 'Avisarme', 'especialistas'] },
    'superpuesta 100 %': { desborde: 0, pudiendoCaber: [], avatar: 48, encabezado: 194, partidas: [] },
    'superpuesta 200 %': { desborde: 0, pudiendoCaber: [], avatar: 96, encabezado: 190, partidas: ['videoconsulta', 'horarios', 'Bermúdez', 'intervencionista', 'Electrofisiología', 'disponibilidad', 'Avisarme', 'especialistas'] },
  })
  expect('«experiencia» con barra clásica al 200 %: palabra y párrafo', await (async () => {
    await b.overlayScrollbars(false)
    await b.go(`${PAGE}?pagina=4`)
    await b.run(text200)
    await sleep(200)
    return b.ev(`(() => { const p = [...document.querySelectorAll('.c-result-card__specialty')].find((x) => x.textContent.includes('experiencia')), s = document.createElement('span'); s.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden'; s.textContent = 'experiencia'; p.append(s); const w = Math.round(s.getBoundingClientRect().width * 10) / 10; s.remove(); return { palabra: w, parrafo: p.clientWidth } })()`)
  })(), { palabra: 175.3, parrafo: 175 })
  // Límite medido: interior del CTA de la tarjeta al 200 % a 320.
  expect('límite: interior del CTA de la tarjeta al 200 % a 320 (clásica / superpuesta)', await (async () => {
    const out = []
    for (const overlay of [false, true]) {
      await b.overlayScrollbars(overlay)
      await b.go(PAGE)
      await b.run(text200)
      await sleep(200)
      out.push(await b.ev(`(() => { const x = ${STATES}.querySelector('.c-result-card__action'), s = getComputedStyle(x); return Math.round(x.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)) })()`))
    }
    return out
  })(), [77, 92])
  await b.overlayScrollbars(false)
  await b.go(PAGE)
  await b.run(text200)
  await b.style('.c-result-card__card { grid-template-columns: auto minmax(0, 1fr) !important; grid-template-areas: "avatar heading" "meta meta" "footer footer" !important }')
  await sleep(200)
  expect('contraprueba: con el avatar al lado al 200 % a 320, al encabezado le quedan 55', await b.ev(`Math.round(${STATES}.querySelector('.c-result-card__heading').getBoundingClientRect().width)`), 55)
  await b.unstyle()
  await b.metrics(1280, 900, 2)
  await b.go(PAGE)
  await b.shot('tarjetas-1280.png', await b.rect(STATES))
  await b.metrics(375, 900, 2)
  await b.go(PAGE)
  await b.shot('tarjetas-375.png', await b.rect(STATES))
  await b.metrics(1280, 900, 1)

  // --- Avatar: foto sobre la inicial ----------------------------------------------------------------
  // El kit no tiene fotos (pendiente de la fase 5): se inyecta una en el
  // avatar de la primera tarjeta para medir que foto e inicial comparten la
  // celda. El respaldo por onError es de React y no se mide aquí.
  await b.go(PAGE)
  const photo = `(() => {
    const av = ${STATES}.querySelector('.c-avatar'), img = document.createElement('img')
    img.className = 'c-avatar__photo'; img.width = 64; img.height = 64
    img.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="gray"/></svg>')
    av.append(img)
    const r = (el) => { const x = el.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top), x.width, x.height] }
    const a = r(av), i = r(img), t = av.querySelector('.c-avatar__initial').getBoundingClientRect()
    const out = { foto: i.join(',') === a.join(','), inicialCentrada: Math.round(t.left + t.width / 2 - a[0]) + ',' + Math.round(t.top + t.height / 2 - a[1]), alto: a[3] }
    img.remove(); return out
  })()`
  expect('Avatar: la foto ocupa el círculo y la inicial queda centrada debajo', await b.ev(photo), { foto: true, inicialCentrada: '32,32', alto: 64 })

  // Respaldo por onError: la demo lleva una foto que no existe.
  await sleep(500)
  expect('onError: tras la carga fallida no queda img y la inicial llena el círculo', await b.ev(`(() => {
    const av = document.querySelector('#kit-lista-respaldo .c-avatar'), a = av.getBoundingClientRect(), t = av.querySelector('.c-avatar__initial').getBoundingClientRect()
    return { img: av.querySelectorAll('img').length, inicial: av.textContent, circulo: a.width + '×' + a.height + ' ' + getComputedStyle(av).backgroundColor, centro: Math.round(t.left + t.width / 2 - a.left) + ',' + Math.round(t.top + t.height / 2 - a.top) }
  })()`), { img: 0, inicial: 'E', circulo: `64×64 ${await b.ev(role('--color-surface-muted'))}`, centro: '32,32' })

  // --- Tipos -----------------------------------------------------------------------------------------
  expect(
    'tipos: compilan los 7 válidos, fallan las 7 combinaciones prohibidas',
    typeErrorLines(`import FilterTrigger from '../components/FilterTrigger.tsx'
import LoadMore from '../components/LoadMore.tsx'
import PageLink from '../components/PageLink.tsx'
import ResultCard from '../components/ResultCard.tsx'
const p = { name: 'N', specialty: 'S', location: 'L', modality: 'M', initial: 'N' }
export const V1 = () => <ResultCard state="available" nextSlot="x" href="/x" {...p} />
export const V2 = () => <ResultCard state="full" nextOpening="x" notifyPressed onNotifyToggle={() => {}} {...p} />
export const V3 = () => <ResultCard state="loading" />
export const V4 = () => <PageLink href="/x" page={2} current />
export const V5 = () => <PageLink href="/x" direction="next" />
export const V6 = () => <FilterTrigger count={1} />
export const V7 = () => <LoadMore shown={4} total={34} onLoadMore={() => {}} />
export const P1 = () => <ResultCard state="loading" name="N" />
export const P2 = () => <ResultCard state="full" nextOpening="x" {...p} />
export const P3 = () => <ResultCard state="available" nextSlot="x" href="/x" notifyPressed {...p} />
export const P4 = () => <ResultCard state="available" nextOpening="x" href="/x" {...p} />
export const P5 = () => <PageLink href="/x" direction="next" current />
export const P6 = () => <PageLink href="/x" page={2} direction="previous" />
export const P7 = () => <PageLink href="/x" />
`),
    [13, 14, 15, 16, 17, 18, 19],
  )
}
