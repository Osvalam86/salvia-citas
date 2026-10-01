// 7.3 · Lo que comparten los bloques de la auditoría (7.3-auditoria.mjs, A+B, y
// 7.3-cd.mjs, C+D): el inventario de estados, las acciones en la página, los ayudantes
// que corren en ella (window.__c) y el recorrido de las paradas de Tab.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sleep } from './cdp.mjs'
import { ROUTES } from './5.0-transversal.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

export const RUIZ = '/especialistas/elena-ruiz-arellano'
export const P021 = `${RUIZ}?fecha=2029-04-24&hora=10:30`
export const DATOS = `${RUIZ}/datos?fecha=2029-04-24&hora=10:30`
export const Q011 = '/?q=Cardiolog%C3%ADa&especialidad=cardiologia'
export const KIT = ['/kit', '/kit/layout', '/kit/navegacion', '/kit/resultados', '/kit/fecha-hora', '/kit/citas', '/kit/estados']
export const VIEWPORT = { 375: 812, 1440: 900 }
export const BOTH = [375, 1440]

// --- Acciones en la página -------------------------------------------------------------------------------------
// Primer elemento visible que casa con el selector y, si se da, con su texto (o su aria-label).
export const find = (selector, text) =>
  `[...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.getClientRects().length && (${JSON.stringify(text ?? null)} === null || (e.getAttribute('aria-label') ?? e.textContent).trim().startsWith(${JSON.stringify(text ?? '')})))`
export const waitFor = async (b, expr, what) => {
  for (let i = 0; i < 60; i++) {
    if (await b.ev(`Boolean(${expr})`)) return sleep(300)
    await sleep(100)
  }
  throw new Error(`No aparece ${what}`)
}
// Clic real en el centro del elemento, tras traerlo a la vista.
export const press = async (b, selector, text) => {
  await waitFor(b, find(selector, text), `${selector} «${text ?? ''}»`)
  const { x, y } = await b.ev(`(() => { const e = ${find(selector, text)}; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
}
export const MODAL = 'document.querySelector("dialog:modal")'

// --- Inventario --------------------------------------------------------------------------------------------------
// Las 16 cargas completas de 7.0 y los estados con interacción. `setup` actúa tras la carga.
export const LOADS = [...ROUTES.map(([p]) => p), ...KIT].map((url) => ({ id: `carga ${url}`, url, widths: BOTH }))
export const STATES = [
  ...LOADS,
  { id: 'hora elegida (ListBox)', url: P021, widths: BOTH },
  { id: 'Missing', url: RUIZ, widths: [375], setup: (b) => press(b, '.c-booking-bar button[type="submit"]'), until: 'document.body.textContent.includes("Elige un horario primero")' },
  { id: 'Missing', url: RUIZ, widths: [1440], setup: (b) => press(b, '.c-booking-summary button', 'Continuar'), until: 'document.body.textContent.includes("Elige un horario primero")' },
  { id: 'sin horarios (Rodrigo)', url: '/especialistas/rodrigo-alcantara-vela', widths: BOTH },
  { id: 'hoja del calendario', url: P021, widths: [375], setup: (b) => press(b, 'button', 'Ver mes completo'), until: MODAL },
  { id: 'hoja del calendario, mes siguiente', url: P021, widths: [375], setup: async (b) => { await press(b, 'button', 'Ver mes completo'); await waitFor(b, MODAL, 'la hoja'); await press(b, 'dialog[open] button', 'Mes siguiente') }, until: MODAL },
  { id: 'calendario, mes siguiente', url: P021, widths: [1440], setup: (b) => press(b, 'main button', 'Mes siguiente') },
  { id: 'hoja de filtros', url: Q011, widths: [375], setup: (b) => press(b, '.c-filter-trigger'), until: MODAL },
  { id: 'carga con lenta', url: `${Q011}&escenario=lenta`, widths: BOTH, loading: true },
  { id: 'vacío por consulta', url: '/?q=Neurocirug%C3%ADa+pedi%C3%A1trica', widths: BOTH },
  { id: 'vacío por colonia', url: '/?q=Dermatolog%C3%ADa&ubicacion=condesa', widths: BOTH },
  { id: 'vacío por filtros', url: '/?q=Oftalmolog%C3%ADa&modalidad=videoconsulta', widths: BOTH },
  { id: '«Avisarme» activado', url: Q011, widths: BOTH, setup: (b) => press(b, 'main .c-result-card button', 'Avisarme'), until: 'document.querySelector("main [aria-pressed=true]")' },
  { id: 'resumen de errores', url: DATOS, widths: BOTH, setup: (b) => press(b, 'button', 'Confirmar cita'), until: 'document.querySelector(".c-error-summary")' },
  {
    id: 'reserva fallida',
    url: `${DATOS}&escenario=ocupada`,
    widths: BOTH,
    setup: async (b) => {
      // El motivo por el setter nativo (React escucha `change`); la casilla con clic real.
      await b.ev(`(() => { const s = document.querySelector('main select'); Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(s, s.options[1].value); s.dispatchEvent(new Event('change', { bubbles: true })); return true })()`)
      await press(b, '#privacidad')
      await press(b, 'button', 'Confirmar cita')
    },
    until: 'document.body.textContent.includes("Elegir otra hora")',
  },
  { id: 'diálogo de cancelar', url: '/mis-citas', widths: BOTH, setup: (b) => press(b, 'main button', 'Cancelar cita'), until: MODAL },
  {
    id: 'aviso «Cita cancelada»',
    url: '/mis-citas',
    widths: BOTH,
    setup: async (b) => {
      await press(b, 'main button', 'Cancelar cita')
      await waitFor(b, MODAL, 'el diálogo')
      await press(b, 'dialog[open] button', 'Cancelar cita')
    },
    until: '!document.querySelector("dialog:modal") && document.body.textContent.includes("Cita cancelada")',
  },
  { id: 'aviso «Cita reprogramada»', url: '/mis-citas/c3/reprogramar?fecha=2029-05-17&hora=17:00', widths: BOTH, setup: (b) => press(b, 'button', 'Confirmar hora'), until: 'location.pathname === "/mis-citas" && document.body.textContent.includes("Cita reprogramada")' },
  { id: 'menú de cuenta', url: '/mis-citas', widths: [1440], setup: (b) => press(b, 'header button', 'Karla Sánchez'), until: 'document.querySelector("header [aria-expanded=true]")' },
]

// --- Ayudantes en la página ---------------------------------------------------------------------------------------
// Roles de color de _tokens.scss (los que apuntan a un primitivo): con ellos se nombra cada
// color pintado y se busca el par en F.3.
const TOKENS = path.join(here, '../../src/styles/01-settings/_tokens.scss')
const ROLES = [...fs.readFileSync(TOKENS, 'utf8').matchAll(/--color-([\w-]+):\s*var\(/g)].map((m) => m[1])
export const CONTROLS = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea, button, a.c-button, [role=option], .c-checkbox__box, .c-radio__circle, .c-day-chip, .c-calendar-day, .c-time-slot'

// Ayudantes en la página (window.__c): color calculado, fondo efectivo (capas de fondo de los
// antepasados hasta la primera opaca, con la opacidad acumulada), si lo tapa otro elemento
// (elementFromPoint en su centro, tras traerlo a la vista), pares de texto, límites de
// control e iconos, y el anillo de la parada de Tab con sus dos bandas de píxeles.
export const PAGE = `window.__c ??= (() => {
  const parse = (s) => {
    let m = s.match(/rgba?\\(([^)]+)\\)/)
    if (m) { const p = m[1].split(/[\\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s.match(/color\\(srgb ([^)]+)\\)/)
    if (m) { const p = m[1].split(/[\\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return null
  }
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1)
  const over = (top, bottom) => [0, 1, 2].map((i) => top[i] * top[3] + bottom[i] * (1 - top[3])).concat(1)
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100 }
  const bgOf = (el) => {
    const layers = []
    let image = false
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e)
      if (cs.backgroundImage !== 'none') image = true
      const c = parse(cs.backgroundColor)
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break }
    }
    let base = layers.length && layers.at(-1)[3] >= 1 ? layers.pop() : [255, 255, 255, 1]
    for (const l of layers.reverse()) base = over(l, base)
    return { color: base, image }
  }
  const opacityOf = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return o }
  const describe = (el) => el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '')
  const inView = (r) => r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth
  // Oculto a la vista: recortado a 1 px (u-sr-only, VisuallyHidden de RAC) en él o en un antepasado.
  const clipped = (el) => {
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = getComputedStyle(e)
      if (cs.clipPath !== 'none' || cs.clip !== 'auto') { const r = e.getBoundingClientRect(); if (r.width <= 1 || r.height <= 1) return true }
    }
    return false
  }
  // Primer elemento de la pila en ese punto que se ve: se salta lo transparente (el input
  // con opacidad 0 que cubre el chip, la casilla o el select).
  const topAt = (x, y) => document.elementsFromPoint(x, y).find((e) => opacityOf(e) > 0 && getComputedStyle(e).visibility === 'visible') ?? null
  // Si no está a la vista o algo lo tapa (una barra fija), se trae al centro y se mira otra vez.
  const visibleRect = (el, getRect) => {
    if (clipped(el)) return null
    let r = getRect()
    if (!r) return null
    const hitAt = () => topAt(r.left + r.width / 2, r.top + r.height / 2)
    const clear = (hit) => hit && (el.contains(hit) || hit.contains(el))
    let hit = inView(r) ? hitAt() : null
    if (!clear(hit)) {
      el.scrollIntoView({ block: 'center', inline: 'nearest' })
      r = getRect()
      if (!r) return null
      hit = hitAt()
    }
    return { r, cubierto: !clear(hit), tapadoPor: clear(hit) ? null : hit ? describe(hit) : 'fuera del viewport' }
  }
  const textRect = (node) => () => { const range = document.createRange(); range.selectNodeContents(node); return [...range.getClientRects()].find((r) => r.width > 1 && r.height > 1) ?? null }
  const boxRect = (el) => () => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 ? r : null }
  const item = (tipo, el, fgRaw, bgEl, muestra, rect) => {
    const bg = bgOf(bgEl)
    const fg = over([...fgRaw.slice(0, 3), fgRaw[3] * opacityOf(el)], bg.color)
    return { tipo, fg: hex(fg), bg: hex(bg.color), ratio: ratio(fg, bg.color), imagen: bg.image, cubierto: rect.cubierto, tapadoPor: rect.tapadoPor, inactivo: Boolean(el.closest('[aria-disabled=true]')), muestra: muestra.slice(0, 40), sel: describe(el) }
  }
  const textItem = (node) => {
    const el = node.parentElement
    if (!el || getComputedStyle(el).visibility !== 'visible') return null
    const rect = visibleRect(el, textRect(node))
    return rect ? item('texto', el, parse(getComputedStyle(el).color), el, node.textContent.trim(), rect) : null
  }
  const nameOf = (a) => a.tagName + ' ' + ((a.getAttribute('aria-label') ?? a.textContent).trim().slice(0, 40) || a.value || '')
  // Quien pinta el anillo del elemento con el foco: él o un antepasado (:has(:focus-visible) en
  // casilla, radio y chip). El input oculto hereda el outline global pero no se pinta (sin caja
  // u opacidad 0): se sigue subiendo hasta el que tiene caja.
  const painterOf = (a) => {
    for (let p = a, i = 0; i < 5 && p && p.nodeType === 1; i++, p = p.parentElement) {
      const cs = getComputedStyle(p)
      const r = p.getBoundingClientRect()
      if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && r.width > 2 && r.height > 2 && Number(cs.opacity) > 0 && cs.clipPath === 'none' && cs.clip === 'auto') return p
    }
    return null
  }
  const palette = {}
  const probe = document.createElement('span')
  document.body.append(probe)
  for (const name of ${JSON.stringify(ROLES)}) { probe.style.color = 'var(--color-' + name + ')'; (palette[hex(parse(getComputedStyle(probe).color))] ??= []).push(name) }
  probe.remove()

  return {
    palette,
    collect() {
      const items = []
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim() || n.parentElement?.closest('script, style, noscript, template')) continue
        const it = textItem(n)
        if (it) items.push(it)
      }
      // Valor o placeholder de los campos (no son nodos de texto).
      for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')) {
        const rect = visibleRect(el, boxRect(el))
        if (!rect) continue
        const empty = el.tagName !== 'SELECT' && !el.value
        const muestra = el.tagName === 'SELECT' ? el.selectedOptions[0]?.textContent ?? '' : el.value || el.placeholder
        if (!muestra) continue
        items.push(item('texto', el, parse(getComputedStyle(el, empty ? '::placeholder' : null).color), el, 'campo: ' + muestra, rect))
      }
      // Límite de control: su borde o su relleno frente al fondo de fuera. Sin borde y sin
      // relleno propio, el control es texto (enlace, botón de texto) y no tiene límite que medir.
      for (const el of document.querySelectorAll(${JSON.stringify(CONTROLS)})) {
        const rect = visibleRect(el, boxRect(el))
        if (!rect || Number(getComputedStyle(el).opacity) === 0) continue
        const cs = getComputedStyle(el)
        const outside = bgOf(el.parentElement)
        const fill = parse(cs.backgroundColor)
        const fillRatio = fill && fill[3] > 0 ? ratio(over(fill, outside.color), outside.color) : 1
        const border = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' ? parse(cs.borderTopColor) : null
        if (!border || border[3] === 0) continue
        const it = item('límite', el, border, el.parentElement, (el.getAttribute('aria-label') ?? el.textContent).trim() || el.tagName, rect)
        it.relleno = fillRatio
        items.push(it)
      }
      // Iconos (dato): su color frente al fondo.
      for (const el of document.querySelectorAll('svg.c-icon')) {
        const rect = visibleRect(el, boxRect(el))
        if (rect) items.push(item('icono', el, parse(getComputedStyle(el).color), el.parentElement, el.parentElement?.closest('[class]')?.getAttribute('class').split(' ')[0] ?? 'svg', rect))
      }
      scrollTo(0, 0)
      return items
    },
    // Par del primer nodo de texto de cada objetivo (los incomplete de color-contrast de axe).
    resolve(targets) {
      const out = targets.map((t) => {
        const el = document.querySelector(t)
        if (!el) return { target: t, encontrado: false }
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
        let n = walker.nextNode()
        while (n && !n.textContent.trim()) n = walker.nextNode()
        return { target: t, encontrado: true, ...(n ? textItem(n) : { sinTexto: true }) }
      })
      scrollTo(0, 0)
      return out
    },
    // Anillo de la parada actual: el elemento enfocado o el antepasado que lo pinta
    // (:has(:focus-visible) en casilla, radio y chip).
    ring() {
      const a = document.activeElement
      if (!a || a === document.body) return null
      const all = [...document.querySelectorAll('*')]
      const p = painterOf(a)
      if (!p) return { key: all.indexOf(a), elemento: nameOf(a), sinAnillo: true }
      const cs = getComputedStyle(p)
      const r = p.getBoundingClientRect()
      const radius = Math.min(parseFloat(cs.borderTopLeftRadius) || 0, r.width / 2, r.height / 2)
      return { key: all.indexOf(a), elemento: nameOf(a), pintor: describe(p), rect: [r.left, r.top, r.right, r.bottom], radius, off: parseFloat(cs.outlineOffset), w: parseFloat(cs.outlineWidth), color: hex(parse(cs.outlineColor)), seleccionada: p.matches('.c-time-slot[aria-selected=true]') }
    },
    // 2.4.11: la caja del componente con el foco (la del que pinta su anillo, si es otro) y
    // cinco puntos: las cuatro esquinas, 2 px hacia dentro, y el centro. En cada uno, si lo
    // tapa otro elemento (el primero visible de la pila en ese punto) o si cae fuera del viewport.
    obscured() {
      const a = document.activeElement
      if (!a || a === document.body) return null
      const el = painterOf(a) ?? a
      const r = el.getBoundingClientRect()
      const points = [[r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2], [r.left + r.width / 2, r.top + r.height / 2]]
      const cover = points.map(([x, y]) => {
        if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return 'fuera del viewport'
        // Sin nada en la pila: el punto cae en la última fracción de píxel del viewport.
        const hit = topAt(x, y)
        return hit && (el.contains(hit) || hit.contains(el) || a.contains(hit)) ? null : hit ? describe(hit) : 'fuera del viewport'
      })
      // Anillo bajo la barra del shell cuando es fija o sticky: píxeles de alto del anillo
      // (la caja más desfase y grosor) que caen dentro de ella. Con el foco en un <dialog>
      // modal, la capa superior va por encima de la barra.
      const bar = document.querySelector('.c-app-layout__bar')
      let bajoBarra = 0
      if (bar && ['fixed', 'sticky'].includes(getComputedStyle(bar).position) && !bar.contains(a) && !a.closest('dialog:modal')) {
        const cs = getComputedStyle(el)
        const e = Math.max(parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth), 0)
        const br = bar.getBoundingClientRect()
        if (r.right + e > br.left && r.left - e < br.right) bajoBarra = Math.max(0, Math.min(r.bottom + e, br.bottom) - Math.max(r.top - e, br.top))
      }
      return { key: [...document.querySelectorAll('*')].indexOf(a), elemento: nameOf(a), pintor: describe(el), puntosTapados: cover.filter(Boolean).length, por: [...new Set(cover.filter(Boolean))], caja: [r.left, r.top, r.width, r.height].map((v) => Math.round(v)), anilloBajoBarra: Math.round(bajoBarra * 10) / 10 }
    },
    // 2.5.8: objetivos de puntero visibles (con un <dialog> modal, solo los suyos). Casilla y
    // radio nativos ocultos cuentan por su etiqueta, que es donde se pulsa. Cumple con 24 × 24;
    // si no, «en línea» (enlace dentro de un texto) o «espaciado» (un círculo de 24 centrado en
    // él no toca otro objetivo ni el círculo de otro objetivo pequeño); si no, ✗.
    targets() {
      const scope = document.querySelector('dialog:modal') ?? document
      const sel = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=option], [role=button], [role=tab], [tabindex]:not([tabindex="-1"])'
      const found = new Map()
      for (const el of scope.querySelectorAll(sel)) {
        const cs = getComputedStyle(el)
        if (cs.visibility !== 'visible' || cs.display === 'none') continue
        const own = el.getBoundingClientRect()
        let t = el
        if ((el.type === 'checkbox' || el.type === 'radio') && (own.width <= 2 || own.height <= 2 || Number(cs.opacity) === 0)) t = el.closest('label')
        else if (clipped(el)) continue
        if (!t) continue
        const r = t.getBoundingClientRect()
        if (r.width < 1 || r.height < 1) continue
        found.set(t, r)
      }
      const list = [...found].map(([el, r]) => ({ el, r, cx: r.left + r.width / 2, cy: r.top + r.height / 2, small: Math.round(r.width * 100) / 100 < 24 || Math.round(r.height * 100) / 100 < 24 }))
      const inline = (el) => {
        if (el.tagName !== 'A' || !getComputedStyle(el).display.startsWith('inline')) return false
        let block = el.parentElement
        while (block && getComputedStyle(block).display.startsWith('inline')) block = block.parentElement
        return Boolean(block) && block.textContent.replace(el.textContent, '').trim().length > 0
      }
      const distToRect = (x, y, r) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))
      const out = []
      for (const t of list.filter((t) => t.small)) {
        let veredicto = inline(t.el) ? 'en línea' : null
        let vecino = null
        if (!veredicto) {
          const clash = list.find((o) => o !== t && !o.el.contains(t.el) && !t.el.contains(o.el) && (distToRect(t.cx, t.cy, o.r) < 12 || (o.small && Math.hypot(o.cx - t.cx, o.cy - t.cy) < 24)))
          veredicto = clash ? '✗' : 'espaciado'
          vecino = clash ? nameOf(clash.el) : null
        }
        out.push({ objetivo: nameOf(t.el), sel: describe(t.el), caja: [Math.round(t.r.width * 10) / 10, Math.round(t.r.height * 10) / 10], veredicto, vecino })
      }
      return { total: list.length, pequenos: out }
    },
    // 1.4.12, con el espaciado ya inyectado: texto recortado por un antepasado con overflow
    // hidden o clip, y líneas de texto de elementos distintos que se solapan dentro de la misma
    // capa (con un <dialog> modal, solo dentro de él). Una barra fija o sticky tapa el contenido
    // que pasa por debajo también sin espaciado: los pares entre capas distintas no cuentan.
    spacingLoss() {
      const layerOf = (el) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) if (['fixed', 'sticky'].includes(getComputedStyle(e).position)) return e; return null }
      const scope = document.querySelector('dialog:modal') ?? document.body
      const cut = new Map()
      const lines = []
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT)
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const el = n.parentElement
        if (!n.textContent.trim() || !el || el.closest('script, style, noscript, template') || clipped(el) || getComputedStyle(el).visibility !== 'visible') continue
        const range = document.createRange()
        range.selectNodeContents(n)
        const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5)
        if (!rects.length) continue
        // El primer antepasado que corta su desborde decide: si se desplaza (auto, scroll), lo que
        // queda fuera no se pierde, solo no se ve ahí (y no cuenta para los solapes); si no
        // (hidden, clip), el texto que sale está recortado.
        let hidden = false
        for (let e = el; e && e !== document.body; e = e.parentElement) {
          const cs = getComputedStyle(e)
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
          const b = e.getBoundingClientRect()
          const out = rects.some((r) => r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1)
          if (!out) continue
          const scrolls = [cs.overflowX, cs.overflowY].some((v) => v === 'auto' || v === 'scroll')
          if (scrolls) hidden = true
          else cut.set(el, { texto: n.textContent.trim().slice(0, 40), sel: describe(el), por: describe(e) })
          break
        }
        if (hidden) continue
        const layer = layerOf(el)
        for (const r of rects) lines.push({ el, r, layer })
      }
      const pairs = new Map()
      for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
          const p = lines[i]
          const q = lines[j]
          if (p.el === q.el || p.el.contains(q.el) || q.el.contains(p.el) || p.layer !== q.layer) continue
          const w = Math.min(p.r.right, q.r.right) - Math.max(p.r.left, q.r.left)
          const h = Math.min(p.r.bottom, q.r.bottom) - Math.max(p.r.top, q.r.top)
          if (w > 2 && h > 2) pairs.set(describe(p.el) + ' «' + p.el.textContent.trim().slice(0, 24) + '» / ' + describe(q.el) + ' «' + q.el.textContent.trim().slice(0, 24) + '»', Math.round(w) + ' × ' + Math.round(h))
        }
      }
      return { recortados: [...cut.values()], solapes: [...pairs].map(([k, v]) => k + ' (' + v + ')'), desborde: document.documentElement.scrollWidth - document.documentElement.clientWidth }
    },
    // Muestras en la captura del viewport: el centro del anillo (¿está pintado?), un píxel
    // entero por fuera (banda exterior) y uno por dentro (banda interior: el hueco del
    // desfase o, con desfase negativo, el propio control), en el tramo recto de cada lado
    // (sin las esquinas redondeadas del anillo, radio del control + desfase + grosor).
    async sample(png, g) {
      const img = new Image()
      img.src = 'data:image/png;base64,' + png
      await img.decode()
      const canvas = new OffscreenCanvas(img.width, img.height)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const data = ctx.getImageData(0, 0, img.width, img.height).data
      const px = (x, y) => x < 0 || y < 0 || x >= img.width || y >= img.height ? null : [data[(y * img.width + x) * 4], data[(y * img.width + x) * 4 + 1], data[(y * img.width + x) * 4 + 2], 1]
      const ringColor = rgb(g.color)
      const [L, T, R, B] = g.rect
      const o = g.off
      const w = g.w
      const edges = [
        { horiz: true, from: L, to: R, mid: Math.floor(T - o - w / 2), out: Math.floor(T - o - w) - 1, inn: Math.ceil(T - o) },
        { horiz: true, from: L, to: R, mid: Math.floor(B + o + w / 2), out: Math.ceil(B + o + w), inn: Math.floor(B + o) - 1 },
        { horiz: false, from: T, to: B, mid: Math.floor(L - o - w / 2), out: Math.floor(L - o - w) - 1, inn: Math.ceil(L - o) },
        { horiz: false, from: T, to: B, mid: Math.floor(R + o + w / 2), out: Math.ceil(R + o + w), inn: Math.floor(R + o) - 1 },
      ]
      // «ambas»: puntos con las dos bandas < 3, donde el borde del anillo no se distingue
      // (✗ de 1.4.11); si es 0, en cada punto una banda llega a 3 (✗ solo de la regla §3.1).
      const res = { total: 0, pintado: 0, ambas: 0, exterior: { min: Infinity, color: null }, interior: { min: Infinity, color: null } }
      const corner = g.radius > 0 ? g.radius + Math.max(o, 0) + w + 1 : 0
      for (const e of edges) {
        const from = e.from + corner
        const to = e.to - corner
        for (let k = 0; k <= 8; k++) {
          const along = to - from < 2 ? Math.floor((e.from + e.to) / 2) : Math.floor(from + (to - from) * (0.1 + 0.8 * k / 8))
          const at = (v) => (e.horiz ? px(along, v) : px(v, along))
          const mid = at(e.mid)
          const out = at(e.out)
          const inn = at(e.inn)
          if (!mid || !out || !inn) continue
          res.total++
          if (ratio(mid, ringColor) > 1.25) continue
          res.pintado++
          const point = {}
          for (const [band, c] of [['exterior', out], ['interior', inn]]) {
            const r = (point[band] = ratio(ringColor, c))
            if (r < res[band].min) res[band] = { min: r, color: hex(c) }
          }
          if (point.exterior < 3 && point.interior < 3) res.ambas++
        }
      }
      return res
    },
  }
})(); true`

// Recorre las paradas de Tab desde el principio hasta volver a una ya vista (tope de 200).
// En cada una, captura del viewport y muestras del anillo.
export async function ringWalk(b, capture) {
  await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
  const stops = []
  const seen = new Set()
  for (let i = 0; i < 200; i++) {
    await b.tab()
    await sleep(60)
    const g = await b.ev('window.__c.ring()')
    if (!g) continue
    if (seen.has(g.key)) return { stops, truncado: false }
    seen.add(g.key)
    if (g.sinAnillo) {
      stops.push({ parada: stops.length + 1, elemento: g.elemento, sinAnillo: true })
      continue
    }
    const { data } = await b.send('Page.captureScreenshot', { format: 'png' })
    const s = await b.ev(`window.__c.sample(${JSON.stringify(data)}, ${JSON.stringify(g)})`)
    const stop = { parada: stops.length + 1, elemento: g.elemento, pintor: g.pintor, desfase: g.off, color: g.color, seleccionada: g.seleccionada, ...s }
    if (capture(stop)) stop.captura = b.saveBase64(`anillo-${capture(stop)}-${stop.parada}.png`, data)
    stops.push(stop)
  }
  return { stops, truncado: true }
}
