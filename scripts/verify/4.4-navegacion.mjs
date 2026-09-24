// 4.4 Navegación: Header/Desktop, Header/Mobile, Breadcrumb, Nav Link, Nav
// Item, Bottom Nav, Menu y Menu Item; salto al contenido y D7.
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sleep } from './cdp.mjs'
import { center, overflow, splitWords, text200 } from './checks.mjs'
import { typeErrorLines } from './static.mjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const NAV = '/kit/navegacion?sesion=iniciada&actual=especialistas'
const GUEST = '/kit/navegacion?sesion=invitado&actual=mis-citas'
const TRIGGER = "document.querySelector('.c-header-desktop [aria-controls]')"
const PANEL = `document.getElementById(${TRIGGER}.getAttribute('aria-controls'))`

// Estado del disclosure: abierto, panel oculto, dónde está el foco y el caret.
const menuState = `(() => {
  const t = ${TRIGGER}, p = ${PANEL}, a = document.activeElement
  return { expanded: t.getAttribute('aria-expanded'), hidden: p.hidden, foco: a === t ? 'disparador' : a.tagName + ' «' + a.textContent.trim() + '»', caret: t.querySelector('svg path').getAttribute('d') === window.__caretUp ? 'caret-up' : 'caret-down' }
})()`

// Anillo del elemento con foco: estilo, desfase, radio y cuánto sale fuera del
// rectángulo del contenedor (negativo: queda dentro).
const ring = (containerExpr) => `(() => {
  const a = document.activeElement, s = getComputedStyle(a), r = a.getBoundingClientRect(), c = (${containerExpr}).getBoundingClientRect()
  const out = parseFloat(s.outlineOffset) + parseFloat(s.outlineWidth)
  return { anillo: s.outlineStyle + ' ' + s.outlineWidth + ' desfase ' + s.outlineOffset + ' radio ' + s.borderTopLeftRadius, fuera: Math.max(Math.round(c.top - (r.top - out)), Math.round((r.bottom + out) - c.bottom)) }
})()`

const key = (b, k, code, vk, modifiers = 0) =>
  b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, modifiers }).then(() =>
    b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk, modifiers }),
  )
const escape = (b) => key(b, 'Escape', 'Escape', 27)
const shiftTab = (b) => key(b, 'Tab', 'Tab', 9, 8)

// Texto partido de cada etiqueta de la barra inferior, línea a línea.
const labelLines = `[...document.querySelectorAll('.c-nav-item__label')].map((l) => {
  const t = l.firstChild, out = []; let prev = null, cur = ''
  for (let i = 0; i < t.length; i++) { const r = document.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); const top = Math.round(r.getClientRects()[0].top); if (prev !== null && top !== prev) { out.push(cur); cur = '' } cur += t.data[i]; prev = top }
  out.push(cur); return l.clientWidth + ' ' + out.join('|')
})`

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.overlayScrollbars(false)

  // --- Header de escritorio ---------------------------------------------------------------------
  await b.metrics(1440, 900, 1)
  const header = `(() => {
    const h = document.querySelector('.c-header-desktop'), hr = h.getBoundingClientRect()
    const actions = h.querySelector('.c-header-desktop__actions > *').getBoundingClientRect()
    return {
      alto: hr.height, contenido: h.querySelector('.c-header-desktop__inner').clientWidth - 48,
      enlaces: [...h.querySelectorAll('.c-nav-link')].map((a) => { const r = a.getBoundingClientRect(), f = getComputedStyle(a, '::after'); return a.textContent + ' ' + r.height + ' fondo ' + Math.round(r.bottom - hr.bottom) + ' barra ' + f.borderBottomStyle }),
      control: [actions.top, actions.height],
    }
  })()`
  await b.go(NAV)
  const bars = ['Especialistas 82 fondo 0 barra solid', 'Mis citas 82 fondo 0 barra none', 'Ayuda 82 fondo 0 barra none']
  expect('Header/Desktop Signed-in: 82, contenido 1200, enlaces a todo el alto hasta el borde, control a 16', await b.ev(header), { alto: 82, contenido: 1200, enlaces: bars, control: [16, 50] })
  expect('peso y tinta: actual body/strong en tinta; el resto body/md secundario', await b.ev("[...document.querySelectorAll('.c-header-desktop .c-nav-link')].map((a) => { const s = getComputedStyle(a); return s.fontSize + '/' + s.lineHeight + ' ' + s.fontWeight + ' ' + s.color })"), ['16px/24px 600 rgb(32, 30, 25)', '16px/24px 400 rgb(110, 104, 88)', '16px/24px 400 rgb(110, 104, 88)'])
  await b.style('.c-header-desktop__link { margin-block-end: 0 !important }')
  expect('contraprueba: sin el margen de −1, la barra queda 1px por encima del borde', (await b.ev(header)).enlaces[0], 'Especialistas 81 fondo -1 barra solid')
  await b.unstyle()
  await b.go(GUEST)
  expect('Header/Desktop Guest: 82 y «Mis citas» actual', await b.ev(`(() => { const h = document.querySelector('.c-header-desktop'); return { alto: h.getBoundingClientRect().height, actual: h.querySelector('[aria-current]').textContent, acciones: [...h.querySelectorAll('.c-header-desktop__actions .c-button')].map((x) => x.textContent) } })()`), { alto: 82, actual: 'Mis citas', acciones: ['Iniciar sesión', 'Crear cuenta'] })

  // --- Anillos en el header -----------------------------------------------------------------------
  await b.go(NAV)
  const HEADER = "document.querySelector('.c-header-desktop')"
  await b.tabTo("document.querySelector('.c-wordmark')")
  expect('foco en el wordmark: general, radio 6 (anillo 10)', (await b.ev(ring(HEADER))).anillo, 'solid 2px desfase 2px radio 6px')
  await b.tabTo("document.querySelector('.c-header-desktop .c-nav-link')")
  expect('foco en Nav Link del header: −4, dentro del header', await b.ev(ring(HEADER)), { anillo: 'solid 2px desfase -4px radio 0px', fuera: -2 })
  await b.style('.c-header-desktop__link:focus-visible { outline-offset: 2px !important }')
  expect('contraprueba: con desfase 2, el anillo sale 4px del header', (await b.ev(ring(HEADER))).fuera, 4)
  await b.unstyle()
  await b.tabTo(TRIGGER)
  expect('foco en el disparador: general', (await b.ev(ring(HEADER))).anillo, 'solid 2px desfase 2px radio 6px')

  // --- Menú de cuenta: teclado y ratón ------------------------------------------------------------------
  // Trazado de caret-up para reconocer la instancia. El SVG servido tal cual
  // (con ?raw, Vite devuelve un módulo JS); en window, así que tras cada
  // navegación completa hay que volver a leerlo.
  await b.ev("fetch('/src/assets/icons/caret-up.svg').then((r) => r.text()).then((t) => { window.__caretUp = t.match(/ d=\"([^\"]+)\"/)[1]; return true })")
  expect('disclosure cerrado: sin aria-haspopup, aria-controls a un ul existente', await b.ev(`({ haspopup: ${TRIGGER}.getAttribute('aria-haspopup'), panel: ${PANEL}.tagName, roles: document.querySelectorAll('[role="menu"], [role="menuitem"]').length, ...${menuState} })`), { haspopup: null, panel: 'UL', roles: 0, expanded: 'false', hidden: true, foco: 'disparador', caret: 'caret-down' })
  await b.enter()
  await sleep(100)
  expect('Intro: abre, el foco se queda en el disparador, caret-up', await b.ev(menuState), { expanded: 'true', hidden: false, foco: 'disparador', caret: 'caret-up' })
  expect('panel: 4 por debajo, alineado a la derecha, 240 de ancho, ítems de 48', await b.ev(`(() => { const t = ${TRIGGER}.getBoundingClientRect(), p = ${PANEL}.getBoundingClientRect(); return { debajo: p.top - t.bottom, derecha: p.right - t.right, ancho: p.width, items: [...${PANEL}.querySelectorAll('.c-menu-item')].map((i) => i.getBoundingClientRect().width + 'x' + i.getBoundingClientRect().height) } })()`), { debajo: 4, derecha: 0, ancho: 240, items: ['238x48', '238x48'] })
  await b.tab()
  expect('Tab: Cuenta, sigue abierto', await b.ev(menuState), { expanded: 'true', hidden: false, foco: 'A «Cuenta»', caret: 'caret-up' })
  expect('foco en Menu Item: −4, radio 0, 2px dentro de su propia fila', await b.ev(ring('document.activeElement')), { anillo: 'solid 2px desfase -4px radio 0px', fuera: -2 })
  await b.tab()
  expect('Tab: Cerrar sesión (button), sigue abierto', await b.ev(`({ ...${menuState}, tipo: document.activeElement.getAttribute('type') })`), { expanded: 'true', hidden: false, foco: 'BUTTON «Cerrar sesión»', caret: 'caret-up', tipo: 'button' })
  await b.tab()
  expect('Tab fuera del grupo: cierra y el foco sigue su curso', await b.ev(menuState), { expanded: 'false', hidden: true, foco: 'A «Kit del sistema»', caret: 'caret-down' })
  await shiftTab(b)
  await b.enter()
  await sleep(100)
  await b.tab()
  await escape(b)
  await sleep(100)
  expect('Escape desde un ítem: cierra y el foco vuelve al disparador', await b.ev(menuState), { expanded: 'false', hidden: true, foco: 'disparador', caret: 'caret-down' })
  await b.enter()
  await sleep(100)
  await escape(b)
  await sleep(100)
  expect('Escape desde el disparador: cierra, el foco se queda', await b.ev(menuState), { expanded: 'false', hidden: true, foco: 'disparador', caret: 'caret-down' })
  await b.enter()
  await sleep(100)
  await shiftTab(b)
  await sleep(100)
  expect('Shift+Tab desde el disparador: cierra', await b.ev(menuState), { expanded: 'false', hidden: true, foco: 'A «Ayuda»', caret: 'caret-down' })
  const t = await b.run(center, TRIGGER)
  await b.click(t.x, t.y)
  await sleep(100)
  expect('clic en el disparador: abre, foco en él', await b.ev(menuState), { expanded: 'true', hidden: false, foco: 'disparador', caret: 'caret-up' })
  const p = await b.ev(`(() => { const r = document.querySelector('main p').getBoundingClientRect(); return { x: r.right + 40, y: r.top + r.height / 2 } })()`)
  await b.click(p.x, p.y)
  await sleep(100)
  expect('clic fuera (en un párrafo): cierra; el foco no vuelve al disparador', await b.ev(`({ ...${menuState}, foco: document.activeElement.tagName })`), { expanded: 'false', hidden: true, foco: 'BODY', caret: 'caret-down' })

  // --- Salto al contenido ------------------------------------------------------------------------------
  for (const [width, name] of [[1440, 'escritorio'], [375, 'móvil']]) {
    await b.metrics(width, 900, 1)
    await b.go(NAV)
    const hiddenSize = await b.ev("[document.querySelector('.c-app-layout__skip').getBoundingClientRect().width, document.querySelector('.c-app-layout__skip').getBoundingClientRect().height]")
    await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
    await b.tab()
    const skip = await b.ev(`(() => { const a = document.activeElement, r = a.getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return { foco: a.textContent, rect: [r.left, r.top, Math.round(r.width), r.height], dentroDelHeader: r.bottom <= h.bottom, encima: document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === a, anillo: getComputedStyle(a).outlineOffset } })()`)
    expect(`salto (${name}): oculto 1×1; primer Tab lo muestra sobre el header`, { hiddenSize, ...skip }, { hiddenSize: [1, 1], foco: 'Saltar al contenido', rect: [16, 8, 194, 50], dentroDelHeader: true, encima: true, anillo: '2px' })
    const before = await b.ev('history.length')
    await b.enter()
    await sleep(100)
    const after = await b.ev(`({ foco: document.activeElement.id + ' ' + document.activeElement.tagName, hash: location.hash, historial: history.length - ${before}, visible: document.activeElement.matches(':focus-visible') })`)
    await b.tab()
    expect(`salto (${name}): Intro lleva el foco al h1 sin entrada de historial; el siguiente Tab cae en el main`, { ...after, siguiente: await b.ev("document.querySelector('main').contains(document.activeElement) ? document.activeElement.textContent : 'fuera del main'") }, { foco: 'contenido H1', hash: '', historial: 0, visible: true, siguiente: name === 'escritorio' ? 'Kit del sistema' : 'Kit del sistema' })
  }
  await b.ev("document.getElementById('contenido').removeAttribute('tabindex'), true")
  await b.tabTo("document.querySelector('.c-app-layout__skip')")
  await b.enter()
  await sleep(100)
  expect('contraprueba: sin tabindex en el h1, el foco no se mueve', await b.ev('document.activeElement.textContent'), 'Saltar al contenido')

  // --- Header móvil y barra inferior --------------------------------------------------------------------
  await b.metrics(375, 800, 1)
  await b.go(NAV)
  const mobile = `(() => {
    const help = document.querySelector('.c-header-mobile__help'), r = help.getBoundingClientRect(), cs = getComputedStyle(help), nav = document.querySelector('.c-bottom-nav').getBoundingClientRect()
    return {
      header: document.querySelector('.c-header-mobile').getBoundingClientRect().height,
      ayudaAlBorde: Math.round(document.documentElement.clientWidth - (r.right - parseFloat(cs.paddingRight))), wordmarkAlBorde: document.querySelector('.c-wordmark').getBoundingClientRect().left,
      barra: nav.height, items: [...document.querySelectorAll('.c-nav-item')].map((a) => Math.round(a.getBoundingClientRect().width) + 'x' + a.getBoundingClientRect().height + ' +' + Math.round(a.getBoundingClientRect().top - nav.top) + ' ' + getComputedStyle(a, '::before').borderTopStyle),
      scrollPadding: getComputedStyle(document.documentElement).scrollPaddingBottom,
    }
  })()`
  expect('Header/Mobile 64 y Ayuda a 16, como el wordmark; Bottom Nav 64, tercios, barra sobre el borde; scroll-padding 64', await b.ev(mobile), { header: 64, ayudaAlBorde: 16, wordmarkAlBorde: 16, barra: 64, items: ['109x64 +0 solid', '109x64 +0 none', '109x64 +0 none'], scrollPadding: '64px' })
  expect('Nav Item: actual label en tinta (etiqueta e icono); el resto caption secundario', await b.ev("[...document.querySelectorAll('.c-nav-item')].map((a) => { const s = getComputedStyle(a); return s.fontSize + '/' + s.lineHeight + ' ' + s.fontWeight + ' ' + s.color + ' icono ' + getComputedStyle(a.querySelector('svg')).color })"), ['14px/20px 600 rgb(32, 30, 25) icono rgb(32, 30, 25)', '14px/20px 400 rgb(110, 104, 88) icono rgb(110, 104, 88)', '14px/20px 400 rgb(110, 104, 88) icono rgb(110, 104, 88)'])
  await b.style('.c-header-mobile__help { margin-inline-end: 0 !important } .c-bottom-nav__item { margin-block-start: 0 !important }')
  const counter = await b.ev(mobile)
  expect('contraprueba: sin los márgenes negativos, Ayuda a 28 y barra de 65', { ayuda: counter.ayudaAlBorde, barra: counter.barra }, { ayuda: 28, barra: 65 })
  await b.unstyle()
  await b.tabTo("document.querySelector('.c-header-mobile__help')")
  expect('foco en Ayuda (móvil): −4, 2px dentro de su propia caja', await b.ev(ring('document.activeElement')), { anillo: 'solid 2px desfase -4px radio 0px', fuera: -2 })
  await b.tabTo("document.querySelector('.c-nav-item')")
  expect('foco en Nav Item: −4, radio 0, dentro de la barra', await b.ev(ring("document.querySelector('.c-bottom-nav')")), { anillo: 'solid 2px desfase -4px radio 0px', fuera: -2 })
  await b.ev('document.activeElement.blur(), true')

  // --- D7 --------------------------------------------------------------------------------------------------------
  const chrome = "({ desktop: Boolean(document.querySelector('.c-header-desktop')), mobile: Boolean(document.querySelector('.c-header-mobile')), barra: Boolean(document.querySelector('.c-bottom-nav')), principal: document.querySelectorAll('nav[aria-label=\"Principal\"]').length, barSize: getComputedStyle(document.documentElement).getPropertyValue('--app-layout-bar-size'), breadcrumb: Boolean(document.querySelector('.c-breadcrumb')) })"
  await b.metrics(1023, 800, 1)
  await b.go(NAV)
  const at1023 = await b.ev(chrome)
  await b.metrics(1024, 800, 1)
  await sleep(300)
  expect('D7: a 1023 chrome móvil; a 1024 el de escritorio, sin barra; una sola nav «Principal»', { at1023, at1024: await b.ev(chrome) }, {
    at1023: { desktop: false, mobile: true, barra: true, principal: 1, barSize: '64px', breadcrumb: false },
    at1024: { desktop: true, mobile: false, barra: false, principal: 1, barSize: '', breadcrumb: true },
  })
  const tsFile = path.join(root, 'src/breakpoints.ts')
  const original = fs.readFileSync(tsFile, 'utf8')
  let check
  try {
    fs.writeFileSync(tsFile, original.replace("lg: '64rem'", "lg: '60rem'"))
    check = spawnSync('node scripts/check-breakpoints.mjs', { cwd: root, shell: true, encoding: 'utf8' })
  } finally {
    fs.writeFileSync(tsFile, original)
  }
  expect('contraprueba D7: lg distinto en TS → el check de pnpm lint falla', { code: check.status, msg: check.stderr.trim().split('\n')[1]?.trim() }, { code: 1, msg: 'lg: SCSS 64rem · TS 60rem' })

  // --- forced-colors ---------------------------------------------------------------------------------------------
  await b.forcedColors(true)
  await b.metrics(1440, 900, 2)
  await b.go(NAV)
  const forcedDesktop = "(() => { const a = document.querySelector('.c-header-desktop [aria-current]'), f = getComputedStyle(a, '::after'); return { barra: f.borderBottomStyle + ' ' + f.borderBottomWidth + ' ' + f.borderBottomColor, fondoBarra: f.backgroundColor, fondoHeader: getComputedStyle(document.querySelector('.c-header-desktop')).backgroundColor, reposo: getComputedStyle(document.querySelector('.c-header-desktop .c-nav-link:not([aria-current])'), '::after').borderBottomStyle } })()"
  expect('forced-colors: la barra actual del header es un borde en LinkText; en reposo, none', await b.ev(forcedDesktop), { barra: 'solid 2px rgb(255, 255, 0)', fondoBarra: 'rgba(0, 0, 0, 0)', fondoHeader: 'rgb(0, 0, 0)', reposo: 'none' })
  await b.shot('forced-header.png', await b.rect("document.querySelector('.c-header-desktop')"))
  await b.style(".c-nav-link[aria-current='page']::after { border: 0 !important; block-size: 2px; background-color: var(--color-action) !important }")
  expect('contraprueba: la barra como fondo se fuerza al del header (invisible)', await b.ev("getComputedStyle(document.querySelector('.c-header-desktop [aria-current]'), '::after').backgroundColor"), 'rgb(0, 0, 0)')
  await b.shot('forced-header-contraprueba.png', await b.rect("document.querySelector('.c-header-desktop')"))
  await b.unstyle()
  await b.metrics(375, 800, 2)
  await b.go(NAV)
  expect('forced-colors: barra de Nav Item actual visible (LinkText)', await b.ev("(() => { const f = getComputedStyle(document.querySelector('.c-nav-item[aria-current]'), '::before'); return f.borderTopStyle + ' ' + f.borderTopColor })()"), 'solid rgb(255, 255, 0)')
  await b.shot('forced-bottom-nav.png', await b.rect("document.querySelector('.c-bottom-nav')"))
  await b.forcedColors(false)

  // --- Breadcrumb ----------------------------------------------------------------------------------------------
  await b.metrics(1280, 900, 1)
  await b.go('/kit')
  const crumbs = async () => {
    const { nodes } = await b.send('Accessibility.getFullAXTree')
    const nav = nodes.find((n) => n.role?.value === 'navigation' && n.name?.value === 'Ruta de navegación')
    const byId = new Map(nodes.map((n) => [n.nodeId, n]))
    const out = []
    const walk = (n, depth) => {
      if (!n) return
      if (!n.ignored && n.role?.value !== 'none' && n.role?.value !== 'generic') out.push(`${n.role.value}${n.name?.value ? ` «${n.name.value}»` : ''}`)
      for (const c of n.childIds ?? []) walk(byId.get(c), depth + 1)
    }
    walk(nav, 0)
    return out.filter((s) => !s.startsWith('InlineTextBox'))
  }
  expect('Breadcrumb (árbol de accesibilidad): nav con nombre, lista, sin «/», actual sin enlace', await crumbs(), [
    'navigation «Ruta de navegación»', 'list', 'listitem', 'link «Especialistas»', 'StaticText «Especialistas»', 'listitem', 'link «Dra. Ruiz»', 'StaticText «Dra. Ruiz»', 'listitem', 'StaticText «Tus datos»',
  ])
  expect('Breadcrumb: niveles de 28 y aria-current en el actual', await b.ev("[...document.querySelector('.c-breadcrumb').querySelectorAll('.c-breadcrumb__link, .c-breadcrumb__current')].map((e) => e.textContent + ' ' + e.getBoundingClientRect().height + (e.getAttribute('aria-current') ? ' ' + e.getAttribute('aria-current') : ''))"), ['Especialistas 28', 'Dra. Ruiz 28', 'Tus datos 28 page'])
  await b.style(".c-breadcrumb__separator { display: none } .c-breadcrumb__item:not(:last-child)::after { content: '/' }")
  expect('contraprueba: el separador como ::after entra en el árbol', (await crumbs()).filter((s) => s === 'StaticText «/»').length, 2)
  await b.unstyle()

  // --- Chrome real a 320: al 100 % y con la letra del navegador (texto grande) --------------------------------------
  // La letra del navegador va por Page.setFontSizes: la inyección en html no
  // mueve una media query. En 4.1 no se mantenía entre medidas, así que cada
  // medida comprueba la letra del html en ese momento.
  const font = (px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
  const rootFont = () => b.ev('getComputedStyle(document.documentElement).fontSize')
  const barState = `(() => {
    const bar = document.querySelector('.c-app-layout__bar'), nav = document.querySelector('.c-bottom-nav'), cur = document.querySelector('.c-nav-item[aria-current]'), f = getComputedStyle(cur, '::before')
    return {
      barra: getComputedStyle(bar).position + ' ' + nav.getBoundingClientRect().height,
      columnas: getComputedStyle(document.querySelector('.c-bottom-nav__list')).gridTemplateColumns.split(' ').length,
      filas: [...document.querySelectorAll('.c-nav-item')].map((a) => a.getBoundingClientRect().height),
      actual: 'arriba ' + f.borderTopStyle + ' · inicio ' + f.borderLeftStyle + ' ' + f.borderLeftWidth + ' ' + f.borderLeftColor,
      scrollPadding: getComputedStyle(document.documentElement).scrollPaddingBottom,
    }
  })()`
  for (const overlay of [false, true]) {
    const bar = overlay ? 'superpuesta' : 'clásica'
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 640, 1)
    await font(16)
    await b.go(NAV)
    const at100 = { letra: await rootFont(), ...(await b.ev(barState)), partidas: (await b.run(splitWords, '.c-nav-item')).split, lineas: await b.ev(labelLines) }
    expect(`320, barra ${bar}, 100 %: barra fija de 64 en tercios; ninguna etiqueta parte`, at100, {
      letra: '16px', barra: 'sticky 64', columnas: 3, filas: [64, 64, 64], actual: 'arriba solid · inicio none 0px rgb(32, 30, 25)', scrollPadding: '64px', partidas: [],
      lineas: ['89 Especialistas', '59 Mis citas', '47 Cuenta'],
    })
    await b.style('.c-nav-item { padding-inline: var(--space-2) !important }')
    expect(`contraprueba (${bar}): con el padding lateral de Figma (8), «Especialistas» parte a 320`, { partidas: (await b.run(splitWords, '.c-nav-item')).split, barra: (await b.ev(barState)).barra }, { partidas: ['Especialistas'], barra: 'sticky 84' })
    await b.unstyle()

    for (const px of [24, 32]) {
      await font(px)
      await b.go(NAV)
      await sleep(300)
      const big = { letra: await rootFont(), texto: await b.ev("matchMedia('(max-width: 18.75rem)').matches"), ...(await b.ev(barState)), partidas: (await b.run(splitWords, '.c-nav-item, .c-header-mobile')).split, overflow: await b.run(overflow) }
      expect(`320, barra ${bar}, letra ${px}: texto grande; barra estática, filas, barra de actual al inicio, sin reserva`, big, {
        // Letra 32: en la fila de «Especialistas» (178 px) el icono baja de
        // línea (48 + 16 + 178 no caben en 209) y la palabra no parte: 152.
        letra: `${px}px`, texto: true, barra: px === 24 ? 'static 217' : 'static 345', columnas: 1, filas: px === 24 ? [72, 72, 72] : [152, 96, 96],
        actual: 'arriba none · inicio solid 2px rgb(59, 87, 64)', scrollPadding: '0px', partidas: [], overflow: 0,
      })
      if (px === 24) {
        const second = await b.run(center, "document.querySelectorAll('.c-nav-item')[1]")
        await b.mouse('mouseMoved', second.x, second.y)
        await sleep(100)
        expect(`hover en fila no actual (${bar}, letra 24): barra al inicio en color-border y texto en tinta`, await b.ev("(() => { const a = document.querySelectorAll('.c-nav-item')[1], f = getComputedStyle(a, '::before'); return f.borderLeftStyle + ' ' + f.borderLeftColor + ' · ' + getComputedStyle(a).color })()"), 'solid rgb(179, 172, 152) · rgb(32, 30, 25)')
        await b.mouse('mouseMoved', 1, 1)
      }
    }
    // Contrapruebas con la letra a 32: sin las filas, las etiquetas vuelven a
    // partir; sin el 0, el scroll-padding reserva el alto de una barra que ya
    // no tapa nada.
    expect(`letra 32, ${bar}: sigue a 32`, await rootFont(), '32px')
    await b.style('.c-bottom-nav__list { grid-template-columns: repeat(3, minmax(0, 1fr)) !important } .c-nav-item { flex-direction: column !important; padding-inline: 0 !important }')
    // Sin padding lateral, «Mis citas» parte por su espacio, no dentro de una palabra.
    expect(`contraprueba (${bar}, letra 32): en tres columnas, «Especialistas» y «Cuenta» parten`, (await b.run(splitWords, '.c-nav-item')).split, ['Especialistas', 'Cuenta'])
    await b.unstyle()
    // Tab real: focus() por script centra el elemento en Chromium.
    const LAST = "[...document.querySelectorAll('main button')].at(-1)"
    const lastGap = `Math.round(innerHeight - (${LAST}).getBoundingClientRect().bottom)`
    await b.tabTo(LAST)
    const gap0 = await b.ev(lastGap)
    await b.style('html { scroll-padding-block-end: var(--app-layout-bar-size) !important }')
    await b.tabTo(LAST)
    expect(`contraprueba (${bar}, letra 32): con Tab al último botón, hueco al pie; con la reserva, crece en el alto de la barra`, { sin: gap0, con: await b.ev(lastGap), barra: await b.ev("getComputedStyle(document.documentElement).getPropertyValue('--app-layout-bar-size')") }, { sin: 0, con: 345, barra: '345px' })
    await b.unstyle()
    await b.tabTo("document.querySelector('.c-nav-item')")
    expect(`foco en Nav Item con texto grande (${bar}): anillo general`, (await b.ev(ring('document.activeElement'))).anillo, 'solid 2px desfase 2px radio 0px')
    await font(16)

    await b.go('/kit')
    await b.run(text200)
    await sleep(300)
    // Nav Link suelto: con barra clásica «Especialistas» (≈ 205 + 48 de
    // padding) no cabe en los 241 de la columna; ninguna parte pudiendo caber.
    expect(`320, barra ${bar}, 200 % (/kit): sin scroll horizontal; ninguna palabra parte pudiendo caber`, { overflow: await b.run(overflow), ...(await b.run(splitWords, '.c-breadcrumb, .c-nav-link, .c-nav-item, .c-menu')) }, { overflow: 0, split: overlay ? [] : ['Especialistas'], couldFit: [] })
    await b.style('.c-kit__menu { max-inline-size: none !important }')
    expect(`contraprueba (${bar}): sin el tope del kit, el panel suelto desborda`, (await b.run(overflow)) > 0, true)
    await b.unstyle()
  }
  await b.overlayScrollbars(false)

  // --- D7 con la letra del navegador al 200 %: lg pasa a 2048 ---------------------------------------------------------
  await b.metrics(1024, 800, 1)
  await font(32)
  await b.go(NAV)
  expect('letra 32 a 1024: chrome móvil (lg = 2048), sin texto grande (32rem): barra fija en tercios, sin partir', { letra: await rootFont(), ...(await b.ev(chrome)), barra: (await b.ev(barState)).barra, partidas: (await b.run(splitWords, '.c-nav-item')).split }, { letra: '32px', desktop: false, mobile: true, barra: 'sticky 128', principal: 1, barSize: '128px', breadcrumb: false, partidas: [] })
  await font(16)

  // --- Estáticas ------------------------------------------------------------------------------------------------------
  expect(
    'tipos: sesión, MenuItem (href | onSelect), niveles del breadcrumb y ref solo en la forma botón',
    typeErrorLines(`import Breadcrumb from '../components/Breadcrumb.tsx'
import Button from '../components/Button.tsx'
import HeaderDesktop from '../components/HeaderDesktop.tsx'
import MenuItem from '../components/MenuItem.tsx'
const c = { label: 'A', href: '/' }
export const V = () => <><HeaderDesktop session="signed-in" userName="Karla" /><HeaderDesktop session="guest" /><MenuItem href="/">A</MenuItem><MenuItem onSelect={() => {}}>B</MenuItem><Breadcrumb levels={[c, c]} current="C" /></>
export const S1 = () => <HeaderDesktop session="signed-in" />
export const S2 = () => <HeaderDesktop session="guest" userName="Karla" />
export const M1 = () => <MenuItem href="/" onSelect={() => {}}>A</MenuItem>
export const M2 = () => <MenuItem>A</MenuItem>
export const B0 = () => <Breadcrumb levels={[]} current="C" />
export const B3 = () => <Breadcrumb levels={[c, c, c]} current="C" />
export const R = () => <Button href="/" ref={null}>A</Button>
`),
    [7, 8, 9, 10, 11, 12, 13],
  )
}
