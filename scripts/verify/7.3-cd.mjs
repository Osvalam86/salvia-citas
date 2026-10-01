// 7.3 · Bloques C y D de la auditoría automática, llamados desde 7.3-auditoria.mjs al final
// de la sección (misma base: la preview o producción). Sobre el inventario de estados de
// 7.3-comun.mjs, sin `lenta` (el estado cambia a los 1,5 s):
//   C · 2.4.11 (foco no tapado): cada parada de Tab a 375 y 1440, con la letra del navegador a
//       16 y a 32 (Page.setFontSizes); cinco puntos de la caja del componente. Con la letra a
//       32 en 375 la barra va en el flujo: el anillo de lo que la toca, en píxeles.
//     · 2.5.8 (tamaño del objetivo): 320, 375 y 1440, y 320 con la letra a 32; exenciones
//       nombradas (en línea, espaciado).
//     · 1.4.12 (espaciado de texto): los cuatro valores del criterio inyectados, a 320 y 1440.
//     · 3.2.6 (ayuda coherente): «Ayuda» en el mismo orden relativo en las 16 cargas.
//   D · ListBox de horas a 320 con el texto al 200 % (inyección y letra del navegador) y las
//       dos barras; flechas y anillo de cada opción.
//     · Resto de pintado desde /?q=Cardiología&pagina=9 desplazada a 375 (DESIGN.md,
//       Pendientes, fase 7): 3 pasadas y la contraprueba; /kit con la receta de 4.6 a 375 y
//       1350 (✗ declarado, D9). La receta del hallazgo de 7.1 (inyección), como dato.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { clientNavigation, pixelDelta, resampleNote, toBottom, viewport, viewRest } from './navegacion.mjs'
import { LOADS, P021, PAGE, STATES, VIEWPORT, waitFor } from './7.3-comun.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const R027 = '/mis-citas/c3/reprogramar?fecha=2029-05-17&hora=17:00'
// 320 con la misma altura que el móvil de 7.3 (375 × 812).
const SIZES = { 320: 812, ...VIEWPORT }
const FROM_P9 = '/?q=Cardiolog%C3%ADa&pagina=9'
// Los cuatro valores de 1.4.12: interlineado 1,5, párrafo 2 veces la letra, letras 0,12 y palabras 0,16.
const SPACING = '*, *::before, *::after { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important } p { margin-block-end: 2em !important }'

const font = (b, px) => b.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round((px * 13) / 16) } })
const htmlSize = (b) => b.ev('getComputedStyle(document.documentElement).fontSize')
const press = async (b, k, code, vk) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk })
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk })
  await sleep(80)
}
const setWidth = async (b, width) => {
  await b.metrics(width, SIZES[width], 1)
  // Móvil con barra superpuesta; escritorio con la clásica de Windows.
  await b.overlayScrollbars(width !== 1440)
}
// Estados de un ancho: el móvil (320 y 375) usa los de 375, y la letra a 32 también (con la
// letra a 32, lg pasa a 2048 y a 1440 sale el chrome móvil).
const statesFor = (width, px = 16) => STATES.filter((s) => !s.loading && s.widths.includes(width === 1440 && px === 16 ? 1440 : 375))
async function visit(b, state) {
  await b.go(state.url)
  if (state.setup) await state.setup(b)
  if (state.until) await waitFor(b, state.until, `el estado «${state.id}»`)
  await b.ev(PAGE)
}

// Paradas de Tab desde el principio hasta volver a una ya vista (tope de 200).
async function focusWalk(b, onStop) {
  await b.ev('document.activeElement?.blur(), window.scrollTo(0, 0), true')
  const seen = new Set()
  for (let i = 0; i < 200; i++) {
    await b.tab()
    await sleep(40)
    const o = await b.ev('window.__c.obscured()')
    if (!o) continue
    if (seen.has(o.key)) return false
    seen.add(o.key)
    await onStop(o)
  }
  return true
}

export async function runCD(b, expect) {
  const out = path.join(here, 'out', '7.3')
  const report = { focoTapado: [], anilloBajoBarra: [], anilloBarra: [], margenBarra: {}, objetivos: [], espaciado: [], ayuda: [], listbox: [], resto: [], receta71: [], noMedidos: [] }

  // --- C · 2.4.11 -----------------------------------------------------------------------------------------------
  let stops = 0
  for (const px of [16, 32]) {
    await font(b, px)
    for (const width of [375, 1440]) {
      await setWidth(b, width)
      for (const state of statesFor(width, px)) {
        try {
          await visit(b, state)
        } catch (error) {
          report.noMedidos.push(`2.4.11 · ${state.id} · ${width} · letra ${px}: ${error.message}`)
          continue
        }
        const html = await htmlSize(b)
        const inFlow = await b.ev("(() => { const bar = document.querySelector('.c-app-layout__bar'); return Boolean(bar) && getComputedStyle(bar).position === 'static' })()")
        const truncado = await focusWalk(b, async (o) => {
          stops++
          if (o.puntosTapados || o.anilloBajoBarra > 0) {
            const file = `foco-${report.focoTapado.length + report.anilloBajoBarra.length + 1}.png`
            b.saveBase64(file, (await b.send('Page.captureScreenshot', { format: 'png' })).data)
            const captura = `scripts/verify/out/7.3/${file}`
            if (o.puntosTapados) report.focoTapado.push({ estado: state.id, ancho: width, letra: px, html, ...o, captura })
            if (o.anilloBajoBarra > 0) report.anilloBajoBarra.push({ estado: state.id, ancho: width, letra: px, elemento: o.elemento, px: o.anilloBajoBarra, captura })
          }
          if (!inFlow) return
          // El anillo de lo que queda encima de la barra en el flujo (no sus propios ítems): margen
          // entre su borde inferior y el borde superior de la barra; si la toca (margen < 0), ¿se
          // pinta entero y con qué vecinos?
          const g = await b.ev('window.__c.ring()')
          if (!g || g.sinAnillo) return
          const gap = await b.ev(`(() => { const bar = document.querySelector('.c-app-layout__bar'); if (bar.contains(document.activeElement)) return null; const r = bar.getBoundingClientRect(); const e = Math.max(${g.off} + ${g.w}, 0); const [l, , ri, bo] = ${JSON.stringify(g.rect)}; if (ri + e < r.left || l - e > r.right) return null; return Math.round((r.top - (bo + e)) * 10) / 10 })()`)
          if (gap === null) return
          const key = `${state.id} · ${width}`
          if (!(key in report.margenBarra) || gap < report.margenBarra[key].margen) report.margenBarra[key] = { margen: gap, elemento: o.elemento }
          if (gap >= 0) return
          const { data } = await b.send('Page.captureScreenshot', { format: 'png' })
          const s = await b.ev(`window.__c.sample(${JSON.stringify(data)}, ${JSON.stringify(g)})`)
          const file = `barra-flujo-${report.anilloBarra.length + 1}.png`
          b.saveBase64(file, data)
          report.anilloBarra.push({ estado: state.id, ancho: width, letra: px, html, elemento: o.elemento, pintor: g.pintor, ...s, captura: `scripts/verify/out/7.3/${file}` })
        })
        if (truncado) report.noMedidos.push(`2.4.11 · ${state.id} · ${width} · letra ${px}: tope de 200 paradas`)
      }
    }
  }
  await font(b, 16)
  const whole = report.focoTapado.filter((o) => o.puntosTapados === 5 && o.por.some((p) => p !== 'fuera del viewport'))
  expect(
    `2.4.11 (foco no tapado): ninguna de las ${stops} paradas de Tab (375 y 1440, letra a 16 y a 32) con el componente tapado entero (sus cinco puntos) por contenido de la página`,
    whole.map((o) => `${o.estado} · ${o.ancho} · letra ${o.letra} · ${o.elemento} (${o.por.join(', ')})`),
    [],
  )
  const partial = report.focoTapado.filter((o) => !whole.includes(o))
  console.log(`· dato (regla del sistema, scroll-padding): paradas con algún punto tapado o fuera del viewport: ${partial.length}${partial.length ? ` [${partial.map((o) => `${o.estado} · ${o.ancho} · ${o.letra} · ${o.elemento} ${o.puntosTapados}/5 por ${o.por.join('+')}`).join('; ')}]` : ''}`)
  const under = report.anilloBajoBarra
  console.log(`· dato: paradas con parte del anillo bajo la barra fija o sticky (el componente, visible): ${under.length}${under.length ? ` [${under.map((o) => `${o.estado} · ${o.ancho} · ${o.letra} · ${o.elemento} ${o.px} px`).join('; ')}]` : ''}`)
  const barRing = report.anilloBarra
  const margins = Object.entries(report.margenBarra)
  expect(
    `anillo sobre la barra en el flujo (letra a 32 a 375, Page.setFontSizes; pendiente de 7.1): en los ${margins.length} estados con barra en el flujo, lo que queda encima de ella con su anillo encima o tocándola se pinta entero y con sus dos bandas ≥ 3:1`,
    { estados: margins.length > 0, fallos: barRing.filter((s) => s.pintado < s.total || s.exterior.min < 3 || s.interior.min < 3).map((s) => `${s.estado} · ${s.elemento} (pintado ${s.pintado}/${s.total}, exterior ${s.exterior.min} ${s.exterior.color}, interior ${s.interior.min} ${s.interior.color})`) },
    { estados: true, fallos: [] },
  )
  console.log(`· dato: margen mínimo entre el anillo y la barra en el flujo (letra a 32 a 375; < 0, la toca): ${margins.map(([k, v]) => `${k} ${v.margen} (${v.elemento})`).join('; ')}`)

  // --- C · 2.5.8 ------------------------------------------------------------------------------------------------
  const exemptions = new Map()
  const targetFails = []
  let targetCount = 0
  for (const [width, px] of [[320, 16], [375, 16], [1440, 16], [320, 32]]) {
    await font(b, px)
    await setWidth(b, width)
    for (const state of statesFor(width, px)) {
      try {
        await visit(b, state)
      } catch (error) {
        report.noMedidos.push(`2.5.8 · ${state.id} · ${width} · letra ${px}: ${error.message}`)
        continue
      }
      const r = await b.ev('window.__c.targets()')
      targetCount += r.total
      for (const t of r.pequenos) {
        const where = `${state.id} · ${width}${px === 32 ? ' · letra 32' : ''}`
        report.objetivos.push({ donde: where, ...t })
        if (t.veredicto === '✗') targetFails.push(`${where} · ${t.objetivo} ${t.caja.join(' × ')} (vecino: ${t.vecino})`)
        else {
          const k = `${t.veredicto} · ${t.sel} «${t.objetivo.slice(t.objetivo.indexOf(' ') + 1)}»`
          if (!exemptions.has(k)) exemptions.set(k, { cajas: new Set(), donde: new Set() })
          exemptions.get(k).cajas.add(t.caja.join(' × '))
          exemptions.get(k).donde.add(where)
        }
      }
    }
  }
  await font(b, 16)
  expect(`2.5.8 (tamaño del objetivo): ${targetCount} objetivos (320, 375, 1440 y 320 con la letra a 32); ninguno por debajo de 24 × 24 sin exención (en línea o espaciado)`, targetFails, [])
  console.log(`· dato: exenciones de 2.5.8 (${exemptions.size}): ${[...exemptions].map(([k, v]) => `${k} ${[...v.cajas].join('/')} en ${v.donde.size}`).join('; ')}`)

  // --- C · 1.4.12 -----------------------------------------------------------------------------------------------
  for (const width of [320, 1440]) {
    await setWidth(b, width)
    for (const state of statesFor(width)) {
      try {
        await visit(b, state)
      } catch (error) {
        report.noMedidos.push(`1.4.12 · ${state.id} · ${width}: ${error.message}`)
        continue
      }
      await b.style(SPACING)
      await sleep(300)
      const r = await b.ev('window.__c.spacingLoss()')
      await b.unstyle()
      report.espaciado.push({ estado: state.id, ancho: width, ...r })
    }
  }
  const lost = report.espaciado.filter((r) => r.recortados.length || r.solapes.length)
  expect(
    `1.4.12 (espaciado de texto): con los cuatro valores inyectados, ningún texto recortado ni solapado (${report.espaciado.length} estados a 320 y 1440)`,
    Object.fromEntries(lost.map((r) => [`${r.estado} · ${r.ancho}`, { recortados: r.recortados.map((c) => `${c.sel} «${c.texto}» por ${c.por}`), solapes: r.solapes }])),
    {},
  )
  const wide = report.espaciado.filter((r) => r.desborde > 0)
  console.log(`· dato: desborde horizontal con el espaciado: ${wide.length ? wide.map((r) => `${r.estado} · ${r.ancho}: ${r.desborde}`).join('; ') : 'ninguno'}`)
  // Contraprueba: un alto fijo con overflow hidden en el título de la página genérica recorta
  // su segunda línea con el espaciado.
  await setWidth(b, 320)
  await b.go('/fuera-de-alcance')
  await b.ev(PAGE)
  await b.style(`${SPACING} main h1 { block-size: 1lh; overflow: hidden }`)
  await sleep(300)
  const cutProbe = (await b.ev('window.__c.spacingLoss()')).recortados.map((c) => c.sel)
  await b.unstyle()
  expect('contraprueba: el h1 de /fuera-de-alcance con alto fijo y overflow hidden sale recortado con el espaciado', cutProbe.some((s) => s.startsWith('h1')), true)

  // --- C · 3.2.6 ------------------------------------------------------------------------------------------------
  // El orden relativo se lee en el header (el mecanismo de ayuda es su enlace «Ayuda»): lo
  // demás fuera de main (barra inferior, Booking Bar) cambia de ruta a ruta por D7.
  const HELP = `(() => {
    const main = document.querySelector('main')
    const items = [...document.querySelectorAll('header a[href], header button')].filter((e) => e.getClientRects().length && !e.closest('dialog'))
    const names = items.map((e) => (e.getAttribute('aria-label') ?? e.textContent).trim())
    const i = names.indexOf('Ayuda')
    return { ayuda: i >= 0, orden: names, vecinos: i >= 0 ? [names[i - 1] ?? null, names[i + 1] ?? null] : null, antesDeMain: i >= 0 ? Boolean(items[i].compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING) : null }
  })()`
  const help = {}
  for (const width of [375, 1440]) {
    await setWidth(b, width)
    for (const { url } of LOADS) {
      await b.go(url)
      const h = await b.ev(HELP)
      report.ayuda.push({ ruta: url, ancho: width, ...h })
      if (h.ayuda) (help[width] ??= new Set()).add(JSON.stringify({ vecinos: h.vecinos, antesDeMain: h.antesDeMain }))
    }
  }
  expect(
    '3.2.6 (ayuda coherente): en cada ancho, «Ayuda» va en el mismo orden relativo (mismos vecinos, antes de main) en todas las cargas donde aparece',
    Object.fromEntries(Object.entries(help).map(([w, s]) => [w, [...s].map((x) => JSON.parse(x))])),
    { 375: [{ vecinos: ['Salvia', null], antesDeMain: true }], 1440: [{ vecinos: ['Mis citas', 'Karla Sánchez'], antesDeMain: true }] },
  )
  const without = report.ayuda.filter((h) => !h.ayuda).map((h) => `${h.ruta} · ${h.ancho}`)
  console.log(`· dato: cargas sin «Ayuda» (el criterio no aplica donde no está): ${without.length ? without.join('; ') : 'ninguna'}`)

  // --- D · ListBox de horas a 320 y 200 % ------------------------------------------------------------------------
  for (const url of [P021, R027]) {
    for (const method of ['inyección', 'letra']) {
      for (const overlay of [true, false]) {
        await b.metrics(320, SIZES[320], 1)
        await b.overlayScrollbars(overlay)
        await font(b, method === 'letra' ? 32 : 16)
        await b.go(url)
        if (method === 'inyección') await b.run(text200)
        await sleep(300)
        await b.ev(PAGE)
        const box = await b.ev(`(() => {
          const list = document.querySelector('[role=listbox]')
          const opts = [...list.querySelectorAll('[role=option]')]
          const lr = list.getBoundingClientRect()
          const clipped = opts.filter((o) => {
            const r = o.getBoundingClientRect()
            if (r.left < lr.left - 1 || r.right > lr.right + 1 || r.right > document.documentElement.clientWidth + 1) return true
            for (let e = o.parentElement; e && e !== document.body; e = e.parentElement) {
              const cs = getComputedStyle(e)
              if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
              const b = e.getBoundingClientRect()
              if (r.left < b.left - 1 || r.right > b.right + 1) return true
            }
            return false
          })
          const lefts = new Set(opts.map((o) => Math.round(o.getBoundingClientRect().left)))
          return { html: getComputedStyle(document.documentElement).fontSize, opciones: opts.length, columnas: lefts.size, recortadas: clipped.map((o) => o.textContent.trim()) }
        })()`)
        const row = { url, metodo: method, barra: overlay ? 'superpuesta' : 'clásica', ...box, desborde: await b.run(overflow), partidas: (await b.run(splitWords, '.c-time-slot')).couldFit }
        if (overlay) {
          // Teclado: Tab hasta una opción y ← hasta la primera (Inicio desplaza la página: se
          // mide aparte); → recorre en orden del DOM y ↓ va a la opción de debajo más cercana
          // en horizontal (geometría de la rejilla).
          for (let i = 0; i < 60 && !(await b.ev("document.activeElement?.getAttribute('role') === 'option'")); i++) await b.tab()
          const idx = "(() => [...document.querySelectorAll('[role=listbox] [role=option]')].indexOf(document.activeElement))()"
          const toFirst = async () => { for (let i = 0; i < 30 && (await b.ev(idx)) > 0; i++) await press(b, 'ArrowLeft', 'ArrowLeft', 37) }
          await toFirst()
          const rects = await b.ev("[...document.querySelectorAll('[role=listbox] [role=option]')].map((o) => { const r = o.getBoundingClientRect(); return [r.left, r.top + scrollY, r.right, r.bottom + scrollY] })")
          const right = [await b.ev(idx)]
          const ring = []
          for (let i = 1; i < rects.length; i++) {
            const g = await b.ev('window.__c.ring()')
            const { data } = await b.send('Page.captureScreenshot', { format: 'png' })
            ring.push({ opcion: right.at(-1), ...(await b.ev(`window.__c.sample(${JSON.stringify(data)}, ${JSON.stringify(g)})`)) })
            await press(b, 'ArrowRight', 'ArrowRight', 39)
            right.push(await b.ev(idx))
          }
          const expectedDown = [0]
          for (;;) {
            const [l, , r, bo] = rects[expectedDown.at(-1)]
            const cx = (l + r) / 2
            const below = rects.map((q, k) => [q, k]).filter(([q]) => q[1] >= bo - 1)
            if (!below.length) break
            const top = Math.min(...below.map(([q]) => q[1]))
            const next = below.filter(([q]) => Math.abs(q[1] - top) < 2).sort((a, c) => Math.abs((a[0][0] + a[0][2]) / 2 - cx) - Math.abs((c[0][0] + c[0][2]) / 2 - cx))[0][1]
            expectedDown.push(next)
          }
          await toFirst()
          const down = [await b.ev(idx)]
          for (let i = 0; i < rects.length; i++) {
            await press(b, 'ArrowDown', 'ArrowDown', 40)
            const k = await b.ev(idx)
            if (k === down.at(-1)) break
            down.push(k)
          }
          // Fin e Inicio: la opción enfocada, ¿dentro del viewport?, y el scroll de la página.
          const edge = "(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); return { opcion: a.textContent.trim(), top: Math.round(r.top), bottom: Math.round(r.bottom), enViewport: r.bottom > 0 && r.top < innerHeight, scrollY: Math.round(scrollY) } })()"
          await press(b, 'End', 'End', 35)
          const end = await b.ev(edge)
          await press(b, 'Home', 'Home', 36)
          const home = await b.ev(edge)
          home.captura = b.saveBase64(`listbox-inicio-${url.split('?')[0].split('/').pop()}-${method}.png`, (await b.send('Page.captureScreenshot', { format: 'png' })).data)
          Object.assign(row, { derecha: right, abajo: down, abajoEsperado: expectedDown, fin: end, inicio: home, anillo: ring.map((s) => ({ opcion: s.opcion, pintado: `${s.pintado}/${s.total}`, minimo: Math.min(s.exterior.min, s.interior.min) })) })
        }
        report.listbox.push(row)
      }
    }
  }
  await font(b, 16)
  expect(
    'ListBox a 320 con el texto al 200 % (inyección y letra del navegador, barra superpuesta y clásica; 02.1 y 02.7): sin desborde horizontal, ninguna opción recortada y ninguna palabra partida pudiendo caber',
    report.listbox.map((r) => ({ [`${r.url.split('?')[0].split('/').pop()} · ${r.metodo} · ${r.barra}`]: { html: r.html, desborde: r.desborde, recortadas: r.recortadas, partidas: r.partidas } })),
    report.listbox.map((r) => ({ [`${r.url.split('?')[0].split('/').pop()} · ${r.metodo} · ${r.barra}`]: { html: '32px', desborde: 0, recortadas: [], partidas: [] } })),
  )
  const keyed = report.listbox.filter((r) => r.derecha)
  const label = (r) => `${r.url.split('?')[0].split('/').pop()} · ${r.metodo}`
  expect(
    'ListBox a 320 y 200 % (teclado): → recorre las opciones en el orden del DOM y ↓ va a la de debajo más cercana',
    keyed.map((r) => ({ [label(r)]: { derechaEnOrden: r.derecha.every((k, i) => k === i), abajoGeometrico: JSON.stringify(r.abajo) === JSON.stringify(r.abajoEsperado) } })),
    keyed.map((r) => ({ [label(r)]: { derechaEnOrden: true, abajoGeometrico: true } })),
  )
  expect(
    'ListBox a 320 y 200 % (teclado): el anillo de cada opción se pinta entero con sus dos bandas ≥ 3:1 (✗ declarado F2: con la inyección, la barra sticky tapa los 4 px inferiores del anillo de las opciones que quedan en su borde; propuesta en 7.6, DESIGN.md Pendientes)',
    keyed.map((r) => ({ [label(r)]: r.anillo.filter((s) => s.pintado.split('/')[0] !== s.pintado.split('/')[1] || s.pintado === '0/0' || s.minimo < 3).map((s) => `opción ${s.opcion}: ${s.pintado}`) })),
    keyed.map((r) => ({ [label(r)]: [] })),
  )
  expect(
    'ListBox a 320 y 200 % (teclado): Fin e Inicio dejan la opción enfocada dentro del viewport (✗ declarado F1: la acción por defecto de la tecla no se evita y la página se desplaza; propuesta en 7.6, DESIGN.md Pendientes)',
    keyed.map((r) => ({ [label(r)]: { fin: r.fin.enViewport, inicio: r.inicio.enViewport } })),
    keyed.map((r) => ({ [label(r)]: { fin: true, inicio: true } })),
  )
  // Contraprueba (y prueba de la propuesta): con un escuchador en captura que evita la acción
  // por defecto de Inicio y Fin dentro del ListBox, la opción enfocada sigue a la vista.
  await b.metrics(320, SIZES[320], 1)
  await b.overlayScrollbars(true)
  await b.go(P021)
  await b.run(text200)
  await b.ev("document.addEventListener('keydown', (e) => { if ((e.key === 'Home' || e.key === 'End') && e.target.closest?.('[role=listbox]')) e.preventDefault() }, true), true")
  for (let i = 0; i < 60 && !(await b.ev("document.activeElement?.getAttribute('role') === 'option'")); i++) await b.tab()
  const view = "(() => { const r = document.activeElement.getBoundingClientRect(); return { opcion: document.activeElement.textContent.trim(), enViewport: r.bottom > 0 && r.top < innerHeight } })()"
  await press(b, 'End', 'End', 35)
  const endPrevented = await b.ev(view)
  await press(b, 'Home', 'Home', 36)
  const homePrevented = await b.ev(view)
  expect('contraprueba: evitando la acción por defecto de Inicio y Fin en el ListBox (02.1, 320, 200 %), la última y la primera hora quedan a la vista', { fin: endPrevented, inicio: homePrevented }, { fin: { opcion: '18:30', enViewport: true }, inicio: { opcion: '09:00', enViewport: true } })

  // --- D · Resto de pintado desde /?q=Cardiología&pagina=9 a 375 -------------------------------------------------
  await b.metrics(375, SIZES[375], 1)
  await b.overlayScrollbars(true)
  await b.go(FROM_P9)
  // La última tarjeta con «Ver horarios» (una Full lleva «Avisarme» en su lugar).
  const last = await b.ev("(() => { const cards = [...document.querySelectorAll('main li.c-result-card')]; const i = cards.findLastIndex((li) => [...li.querySelectorAll('a')].some((a) => a.textContent === 'Ver horarios')); const a = [...cards[i].querySelectorAll('a')].find((x) => x.textContent === 'Ver horarios'); const u = new URL(a.href); return { n: i + 1, tarjetas: cards.length, to: u.pathname + u.search } })()")
  let nav
  for (let pass = 1; pass <= 3; pass++) {
    let origin = null
    nav = await clientNavigation(b, { from: FROM_P9, link: 'Ver horarios', selector: `main li.c-result-card:nth-child(${last.n}) a`, to: last.to, park: true, prepare: async (bb) => { await toBottom(bb); origin = await bb.ev('Math.round(scrollY)') } })
    const { afterClient, afterReload, ...rest } = nav
    report.resto.push({ pasada: pass, origen: origin, ...viewRest(rest), nota: resampleNote(rest) })
    if (rest.delta.sobre64 || rest.deltaCuatroSegundos.sobre64) {
      b.saveBase64(`resto-p9-${pass}-cliente.png`, afterClient)
      b.saveBase64(`resto-p9-${pass}-recarga.png`, afterReload)
    }
  }
  expect(
    `resto de pintado desde ${FROM_P9} desplazada (${last.tarjetas} tarjetas; «Ver horarios» de la n.º ${last.n}) a 375, 3 pasadas: ningún píxel con delta > 64 al llegar ni 4 s después`,
    report.resto.map(({ pasada, ruta, sinRecarga, sobre64, cuatroSegundosSobre64, origen }) => ({ pasada, ruta, sinRecarga, sobre64, cuatroSegundosSobre64, origenDesplazado: origen > 1000 })),
    [1, 2, 3].map((pasada) => ({ pasada, ruta: last.to, sinRecarga: true, sobre64: 0, cuatroSegundosSobre64: 0, origenDesplazado: true })),
  )
  // Contraprueba del criterio: un avatar de /kit inyectado en el destino recargado y al final.
  await b.ev("(() => { const a = document.createElement('span'); a.className = 'c-avatar c-avatar--small'; a.textContent = 'E'; a.dataset.verify = ''; a.style.cssText = 'position:fixed;z-index:1;left:150px;top:300px'; document.body.append(a); return true })()")
  await sleep(100)
  const injected = await b.ev(pixelDelta(await viewport(b), nav.afterReload))
  await b.ev("document.querySelectorAll('[data-verify]').forEach((e) => e.remove()), true")
  expect('contraprueba: un resto inyectado en el destino supera el delta de 64', { hayResto: injected.sobre64 > 0, deltaMax: injected.deltaMax > 64 }, { hayResto: true, deltaMax: true })
  // /kit (✗ declarado, D9; también en 4.6, contra pnpm dev): la receta de 4.6 contra esta
  // base, a 375 y 1350 de ancho y 900 de alto con barra clásica, 3 pasadas cada uno. El origen se
  // fija en 1600 con scrollTo y se comprueba (una carga completa de /kit restaura el scroll de
  // la visita anterior, D12); `clientNavigation` centra después el enlace, así que se lee
  // también el scroll en el momento del clic.
  const kitPasses = []
  await b.overlayScrollbars(false)
  for (const width of [375, 1350]) {
    await b.metrics(width, 900, 1)
    for (let pass = 1; pass <= 3; pass++) {
      let origin = null
      const kitNav = await clientNavigation(b, {
        from: '/kit',
        link: 'Ver fecha y hora',
        to: '/kit/fecha-hora',
        state: 'window.__clickY ?? null',
        prepare: async (bb) => {
          await bb.ev("window.scrollTo(0, 1600), window.addEventListener('click', () => { window.__clickY = Math.round(scrollY) }, { capture: true, once: true }), true")
          await sleep(300)
          origin = await bb.ev('Math.round(scrollY)')
        },
      })
      const { afterClient: kitClient, afterReload: kitReload, ...kitRest } = kitNav
      kitPasses.push({ kit: true, ancho: width, pasada: pass, origen: origin, scrollAlClic: kitRest.estado, ...viewRest(kitRest), deltaMax: kitRest.delta.deltaMax })
      if (kitRest.delta.sobre64 || kitRest.deltaCuatroSegundos.sobre64) {
        b.saveBase64(`resto-kit-${width}-${pass}-cliente.png`, kitClient)
        b.saveBase64(`resto-kit-${width}-${pass}-recarga.png`, kitReload)
      }
    }
  }
  report.resto.push(...kitPasses)
  console.log(`· dato: /kit → /kit/fecha-hora desde /kit en 1600 (receta de 4.6), 3 pasadas por ancho: ${kitPasses.map((p) => `${p.ancho} · ${p.pasada}: origen ${p.origen}, clic en ${p.scrollAlClic}, al llegar ${p.sobre64} (máx. ${p.deltaMax}), a los 4 s ${p.cuatroSegundosSobre64}`).join('; ')}`)
  expect(
    'resto de pintado en /kit → /kit/fecha-hora desde /kit desplazado (receta de 4.6, 375 y 1350, 3 pasadas): ningún píxel con delta > 64 al llegar ni 4 s después (✗ declarado de /kit, que va a producción por D9: a 1350, 12632 px con delta 230 al llegar y a los 4 s, 3 de 3; a 375, 0; DESIGN.md Pendientes)',
    kitPasses.map((p) => ({ [`${p.ancho} · ${p.pasada}`]: { sinRecarga: p.sinRecarga, sobre64: p.sobre64, cuatroSegundosSobre64: p.cuatroSegundosSobre64 } })),
    kitPasses.map((p) => ({ [`${p.ancho} · ${p.pasada}`]: { sinRecarga: true, sobre64: 0, cuatroSegundosSobre64: 0 } })),
  )

  // Receta del hallazgo de 7.1, como dato: /fuera-de-alcance a 375 con el html a 32 por
  // inyección y Tab real hasta «Ir a Especialistas». Con la inyección la media query del modo de
  // texto grande no cambia y la barra sigue sticky; el solape depende del alto del viewport.
  for (const height of [812, 900]) {
    await b.metrics(375, height, 1)
    await b.overlayScrollbars(true)
    await b.go('/fuera-de-alcance')
    await b.run(text200)
    await b.ev(PAGE)
    await b.tabTo("[...document.querySelectorAll('main a')].find((a) => a.textContent === 'Ir a Especialistas')")
    await sleep(200)
    const m = await b.ev("(() => { const a = document.activeElement, bar = document.querySelector('.c-app-layout__bar'), cs = getComputedStyle(a); const r = a.getBoundingClientRect(), br = bar.getBoundingClientRect(), e = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth); return { html: getComputedStyle(document.documentElement).fontSize, barra: getComputedStyle(bar).position, anilloAbajo: Math.round((r.bottom + e) * 10) / 10, barraArriba: Math.round(br.top * 10) / 10, solape: Math.round((r.bottom + e - br.top) * 10) / 10, enLaFranja: document.elementFromPoint(r.left + r.width / 2, Math.floor(r.bottom + e - 1))?.className ?? null } })()")
    const g = await b.ev('window.__c.ring()')
    const { data } = await b.send('Page.captureScreenshot', { format: 'png' })
    const s = await b.ev(`window.__c.sample(${JSON.stringify(data)}, ${JSON.stringify(g)})`)
    b.saveBase64(`receta-7.1-375x${height}.png`, data)
    report.receta71.push({ viewport: `375 × ${height}`, ...m, pintado: `${s.pintado}/${s.total}` })
  }
  console.log(`· dato: receta de 7.1 (inyección, /fuera-de-alcance, «Ir a Especialistas»): ${report.receta71.map((r) => `${r.viewport}: barra ${r.barra}, anillo hasta ${r.anilloAbajo}, barra desde ${r.barraArriba}, solape ${r.solape}, pintado ${r.pintado}`).join('; ')}`)

  if (report.noMedidos.length) console.log(`· no medidos: ${report.noMedidos.join('; ')}`)
  expect('C+D: todos los estados medidos (ningún estado sin medir ni recorrido truncado)', report.noMedidos, [])
  fs.writeFileSync(path.join(out, 'auditoria-cd.json'), JSON.stringify(report, null, 2))
}
