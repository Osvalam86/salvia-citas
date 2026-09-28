// Foco en el h1 al cruzar lg (V4a). En la confirmación y en la vista 3 el h1 se
// vuelve a montar al cruzar, porque su padre cambia (los pasos solo existen
// por debajo de lg); el foco lo salva useLgFocusFallback en el mismo commit
// (DESIGN.md, Pendientes, «5 · cierre»). Llega a `url` en cliente (POP desde
// /kit/estados: useRouteFocus lleva el foco al h1), cruza lg en los dos
// sentidos por CDP y registra con un MutationObserver el foco al final de cada
// lote de mutaciones: ninguno puede dejarlo en body.
import { sleep } from './cdp.mjs'

const label = `(() => { const a = document.activeElement; return !a || a === document.body ? 'BODY' : a.tagName + (a.id ? '#' + a.id : '') })()`
const install = `(() => {
  window.__h1 = document.getElementById('contenido')
  window.__focusLog = []
  window.__focusObserver?.disconnect()
  window.__focusObserver = new MutationObserver(() => { const a = document.activeElement; window.__focusLog.push(!a || a === document.body ? 'BODY' : a.tagName) })
  window.__focusObserver.observe(document.body, { childList: true, subtree: true })
  return true
})()`
const read = `({ foco: ${label}, nodoNuevo: document.activeElement !== window.__h1, pasoPorBody: window.__focusLog.includes('BODY') })`

export async function h1AcrossLg(b, url) {
  const out = {}
  for (const [from, to] of [[375, 1100], [1100, 375]]) {
    await b.metrics(from, 900)
    await b.go('/kit/estados')
    await b.ev(`(history.pushState({ usr: null, key: 'verify', idx: (history.state?.idx ?? 0) + 1 }, '', ${JSON.stringify(url)}), dispatchEvent(new PopStateEvent('popstate', { state: history.state })), true)`)
    await sleep(700)
    const llegada = await b.ev(label)
    await b.ev(install)
    await b.metrics(to, 900)
    await sleep(500)
    out[`${from}→${to}`] = { llegada, ...(await b.ev(read)) }
  }
  await b.metrics(1280, 900)
  return out
}

/** Lo esperado: llegada al h1 y, tras cruzar, el h1 nuevo sin pasar por body. */
export const H1_ACROSS_LG = {
  '375→1100': { llegada: 'H1#contenido', foco: 'H1#contenido', nodoNuevo: true, pasoPorBody: false },
  '1100→375': { llegada: 'H1#contenido', foco: 'H1#contenido', nodoNuevo: true, pasoPorBody: false },
}
