/* global document, window, getComputedStyle, NodeFilter, innerWidth */
// Funciones que se ejecutan dentro de la página (b.run(fn, ...args)). Se
// serializan con toString: no pueden usar nada de fuera de su propio cuerpo.

// Palabras que parten dentro de sí mismas en los elementos de `selector`. Una
// palabra «pudiendo caber» es la que cabía entera en el ancho de contenido del
// elemento, descontados sus iconos y gaps: esa es la que la regla prohíbe.
export function splitWords(selector) {
  const split = []
  const couldFit = []
  for (const el of document.querySelectorAll(selector)) {
    const cs = getComputedStyle(el)
    let avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    for (const svg of el.querySelectorAll(':scope > svg')) avail -= svg.getBoundingClientRect().width + (parseFloat(cs.columnGap) || 0)
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const re = /[^\s]+/g
      let m
      while ((m = re.exec(node.data))) {
        const range = document.createRange()
        range.setStart(node, m.index)
        range.setEnd(node, m.index + m[0].length)
        if (new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size < 2) continue
        const probe = document.createElement('span')
        probe.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden'
        probe.textContent = m[0]
        el.append(probe)
        const width = probe.getBoundingClientRect().width
        probe.remove()
        split.push(m[0])
        if (width <= avail + 0.5) couldFit.push(m[0])
      }
    }
  }
  return { split: [...new Set(split)], couldFit: [...new Set(couldFit)] }
}

export function overflow() {
  return document.documentElement.scrollWidth - document.documentElement.clientWidth
}

// Texto al 200 %: html { font-size: 200% }. Equivale a la ampliación solo de
// texto del navegador porque todo el proyecto mide en rem.
export function text200() {
  const s = document.createElement('style')
  s.dataset.text200 = ''
  s.textContent = 'html { font-size: 200% }'
  document.head.append(s)
  return getComputedStyle(document.documentElement).fontSize
}

export function size(expr, decimals = 0) {
  const el = new Function(`return (${expr})`)()
  const r = el.getBoundingClientRect()
  const f = 10 ** decimals
  return [Math.round(r.width * f) / f, Math.round(r.height * f) / f]
}

export function focusInfo() {
  const a = document.activeElement
  const c = getComputedStyle(a)
  return {
    el: a.tagName + (a.getAttribute('aria-label') ? ` «${a.getAttribute('aria-label')}»` : ` «${a.textContent.trim().slice(0, 40)}»`),
    focusVisible: a.matches(':focus-visible'),
    outline: `${c.outlineStyle} ${c.outlineWidth} ${c.outlineColor}`,
    offset: c.outlineOffset,
    radius: c.borderTopLeftRadius,
  }
}

export function center(expr) {
  const el = new Function(`return (${expr})`)()
  el.scrollIntoView({ block: 'center' })
  const r = el.getBoundingClientRect()
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

export function viewportWidth() {
  return { useful: document.documentElement.clientWidth, window: innerWidth, scrollY: Math.round(window.scrollY) }
}
