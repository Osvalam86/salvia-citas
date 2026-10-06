// 7.3 Auditoría automática sobre el inventario de estados. Bloque A: axe-core por
// CDP y lo que queda fuera de #root (popovers y anunciador de React Aria). Bloque B:
// contraste renderizado y anillo de foco contra sus vecinos. Bloques C y D, en
// 7.3-cd.mjs; lo común (inventario, acciones y ayudantes en la página), en 7.3-comun.mjs.
// Audita el build, nunca pnpm dev (StrictMode y el cliente de Vite):
//   VERIFY_BASE=http://localhost:4173 pnpm verify 7.3              # pnpm build && pnpm preview
//   VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.3   # producción
// axe se inyecta con Runtime.evaluate desde node_modules (axe-core 4.13.0, exacta)
// y corre sobre `document`, no sobre #root: así entra lo que cuelga de body.
// Etiquetas: wcag2a, wcag2aa, wcag21a, wcag21aa y wcag22aa; best-practice, aparte y como dato.
// En las pasadas con barra fija, axe corre arriba y con el scroll al final
// (target-size depende de lo que tapa la barra); con un <dialog> modal abierto,
// solo arriba (la página está bloqueada). Detalle en out/7.3/auditoria.json.
import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sleep } from './cdp.mjs'
import { BOUNDARY_PAIRS, DO_NOT_USE, TEXT_PAIRS } from '../contrast-pairs.mjs'
import { BOTH, MODAL, P021, PAGE, STATES, VIEWPORT, ringWalk, waitFor } from './7.3-comun.mjs'
import { runCD } from './7.3-cd.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const AXE = fs.readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const BASE = process.env.VERIFY_BASE

// --- Medidas en la página ----------------------------------------------------------------------------------------
// best-practice corre en la misma pasada y se aparta como dato (P3): una regla es WCAG si
// lleva alguna de las etiquetas de TAGS.
const RUN_AXE = `axe.run(document, { runOnly: { type: 'tag', values: ${JSON.stringify([...TAGS, 'best-practice'])} }, resultTypes: ['violations', 'incomplete'] }).then((r) => {
  // Caja en el viewport del nodo y de sus relacionados (en target-size, lo que lo tapa o lo rodea).
  const box = (selector) => { const e = document.querySelector(selector); if (!e) return null; const b = e.getBoundingClientRect(); return [b.x, b.y, b.width, b.height].map((v) => Math.round(v * 10) / 10) }
  const related = (n) => n.any.concat(n.all, n.none).flatMap((c) => c.relatedNodes ?? []).map((rn) => ({ target: rn.target.join(' '), html: rn.html.slice(0, 120), href: document.querySelector(rn.target.join(' '))?.getAttribute('href') ?? null, caja: box(rn.target.join(' ')) }))
  const text = (selector) => (document.querySelector(selector)?.textContent ?? '').trim().slice(0, 60)
  const pick = (list) => list.map((v) => ({ id: v.id, impact: v.impact, help: v.help, tags: v.tags.filter((t) => /^wcag\\d/.test(t)), nodes: v.nodes.map((n) => ({ target: n.target.join(' '), html: n.html.slice(0, 160), texto: text(n.target.join(' ')), caja: box(n.target.join(' ')), relacionados: related(n), resumen: (n.failureSummary ?? n.any.concat(n.all, n.none).map((c) => c.message).join(' | ')).replace(/\\s+/g, ' ').slice(0, 300) })) }))
  const wcag = (v) => v.tags.some((t) => ${JSON.stringify(TAGS)}.includes(t))
  return {
    version: axe.version,
    violations: pick(r.violations.filter(wcag)),
    incomplete: pick(r.incomplete.filter(wcag)),
    bestPractice: { violations: pick(r.violations.filter((v) => !wcag(v))), incomplete: pick(r.incomplete.filter((v) => !wcag(v))) },
  }
})`

// Barras fijas visibles dentro de #root (position fixed o sticky con caja).
const FIXED = `[...document.querySelectorAll('#root *')].filter((e) => ['fixed', 'sticky'].includes(getComputedStyle(e).position) && e.getBoundingClientRect().height > 0).map((e) => e.className.split(' ')[0])`

// Hijos de body fuera de #root, con su caja, su foco y lo que contienen. `window.__fuera`
// guarda los elementos para leer su nodo en el árbol de accesibilidad.
const OUTSIDE = `(() => {
  const root = document.getElementById('root')
  const kids = [...document.body.children].filter((e) => e !== root && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(e.tagName))
  window.__fuera = kids
  return kids.map((e) => {
    const r = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    const focusables = [...e.querySelectorAll('*')].concat(e).filter((d) => d.tabIndex >= 0).length
    return {
      etiqueta: e.tagName + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ').join('.') : ''),
      atributos: Object.fromEntries([...e.attributes].filter((a) => /^(role|aria-|data-live|style)/.test(a.name)).map((a) => [a.name, a.value.slice(0, 120)])),
      caja: [Math.round(r.width), Math.round(r.height)],
      recorte: cs.clip !== 'auto' || cs.clipPath !== 'none' || cs.overflow === 'hidden',
      enfocables: focusables,
      regionesVivas: [...e.querySelectorAll('[aria-live]')].concat(e.hasAttribute('aria-live') ? [e] : []).map((l) => l.getAttribute('aria-live')),
      texto: e.textContent.trim().slice(0, 80),
    }
  })
})()`

async function axNode(b, index) {
  const { result } = await b.send('Runtime.evaluate', { expression: `window.__fuera[${index}]` })
  const { nodes } = await b.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })
  const n = nodes[0]
  return { ignorado: n.ignored, razones: (n.ignoredReasons ?? []).map((r) => r.name) }
}

// Región propia del mes dentro de la hoja del calendario (7.6): su texto y si está en el
// árbol de accesibilidad. null si el calendario no la lleva (en línea, o sin hoja).
async function monthRegion(b) {
  const sel = `document.querySelector('.c-calendar [role=status]')`
  if (!(await b.ev(`Boolean(${sel})`))) return null
  const { result } = await b.send('Runtime.evaluate', { expression: sel })
  const { nodes } = await b.send('Accessibility.getPartialAXTree', { objectId: result.objectId, fetchRelatives: false })
  return { texto: await b.ev(`${sel}.textContent`), enElDialogo: await b.ev(`Boolean(${sel}.closest('dialog:modal'))`), ignorado: nodes[0].ignored }
}

async function outside(b) {
  const kids = await b.ev(OUTSIDE)
  for (let i = 0; i < kids.length; i++) kids[i].ax = await axNode(b, i)
  return kids
}

// Criterio de «fuera de #root»: sin caja visible (≤ 1 × 1 o recortado), nada enfocable
// y, si es región viva, presente en el árbol de accesibilidad (no ignorado).
const offending = (kids) =>
  kids.filter((k) => (k.caja[0] * k.caja[1] > 1 && !k.recorte) || k.enfocables > 0 || (k.regionesVivas.length && k.ax.ignorado))

async function shot(b, file) {
  const { data } = await b.send('Page.captureScreenshot', { format: 'png' })
  return b.saveBase64(file, data)
}

// --- Bloque B: contraste renderizado y anillo contra vecinos -------------------------------------------------------
// Filas de F.3 y umbral por tipo de par.
const PAIRS = { texto: TEXT_PAIRS, límite: BOUNDARY_PAIRS, icono: BOUNDARY_PAIRS, anillo: BOUNDARY_PAIRS }
const THRESHOLD = { texto: 4.5, límite: 3, icono: 3, anillo: 3 }

// Nombra un par pintado con los roles de F.3: documentado, «No usar» o no documentado (dato).
function classify(tipo, fg, bg, palette) {
  const fgRoles = palette[fg] ?? []
  const bgRoles = palette[bg] ?? []
  const has = ([, f, b]) => fgRoles.includes(f) && bgRoles.includes(b)
  return {
    roles: `${fgRoles.join('|') || fg} / ${bgRoles.join('|') || bg}`,
    f3: PAIRS[tipo].find(has)?.[0] ?? null,
    noUsar: DO_NOT_USE.find((row) => row[5] === tipo && has(row))?.[0] ?? null,
  }
}

// ✗ del anillo: sin anillo, o pintado con una banda por debajo de 3:1. Un anillo que no sale
// en la captura (tapado o recortado) es un dato para 2.4.11 (bloque C), no un par que medir.
const ringFail = (s) => s.sinAnillo || (s.pintado > 0 && (s.exterior.min < 3 || s.interior.min < 3))

// Grupos de los ✗ del anillo (decisión de 7.3, DESIGN.md Pendientes 7 · 7.6): 1, 2, 3, 5 y 6 (este, de 7.6),
// coste medido; 1b y 4, defectos del kit de 7.3, corregidos en 7.6 (lote 6): se conservan para
// clasificar, y su expectativa pide que no haya ninguna parada en ellos. Una parada de un grupo de coste
// con algún punto de las dos bandas < 3 (✗ de 1.4.11) no es coste: pasa a «Nb».
const RING_GROUPS = {
  1: '1 · Nav Item y Nav Link (desfase −4) junto a la barra de actual o al borde de la barra: coste medido',
  '1b': '1b · Nav Item suelto de /kit: ✗ WCAG (las dos bandas < 3 junto a su etiqueta), corregido en 7.6',
  2: '2 · chip y celda del calendario junto al borde del vecino: coste medido',
  3: '3 · disparador del menú junto al borde del panel abierto: coste medido',
  4: '4 · salto al contenido sobre el contenido de /kit/*: corregido en 7.6',
  5: '5 · enlaces en línea del kit junto al texto vecino: coste medido',
  6: '6 · anillo que termina en el borde superior de la barra tras el desplazamiento (scroll-padding = barra + alcance, F2, 7.6): coste medido',
}
// El 6 va antes que los demás: es una vecindad (la barra), no un tipo de control.
const ringGroup = (s) => {
  const base = s.sinAnillo ? 'sin anillo' : s.bordeBarra ? '6' : ['a.c-nav-item', 'a.c-nav-link'].includes(s.pintor) ? '1' : ['label.c-day-chip', 'div.c-calendar-day'].includes(s.pintor) ? '2' : s.pintor === 'button.c-button' ? '3' : s.elemento.startsWith('A Saltar al contenido') ? '4' : '5'
  return RING_GROUPS[base] && base !== '4' && s.ambas > 0 ? `${base}b` : base
}
const RING_EXPECTED = {
  1: [
    'Missing · 1440 · A Especialistas',
    'aviso «Cita cancelada» · 1440 · A Mis citas',
    'aviso «Cita cancelada» · 375 · A Cuenta',
    'aviso «Cita cancelada» · 375 · A Especialistas',
    'aviso «Cita cancelada» · 375 · A Mis citas',
    'aviso «Cita reprogramada» · 1440 · A Mis citas',
    'aviso «Cita reprogramada» · 375 · A Cuenta',
    'aviso «Cita reprogramada» · 375 · A Especialistas',
    'aviso «Cita reprogramada» · 375 · A Mis citas',
    'calendario, mes siguiente · 1440 · A Especialistas',
    'carga / · 1440 · A Especialistas',
    'carga / · 375 · A Cuenta',
    'carga / · 375 · A Especialistas',
    'carga / · 375 · A Mis citas',
    'carga /citas/c1/confirmada · 1440 · A Especialistas',
    'carga /especialistas/elena-ruiz-arellano · 1440 · A Especialistas',
    'carga /especialistas/elena-ruiz-arellano/confirmar?fecha=2029-04-24&hora=10:30 · 1440 · A Especialistas',
    'carga /especialistas/elena-ruiz-arellano/datos?fecha=2029-04-24&hora=10:30 · 1440 · A Especialistas',
    // 7.6 · lote 6: el Nav Item suelto de /kit, con el ancho de su tercio de barra. «Especialistas»
    // pasa de 1b a este grupo (la banda exterior sobre la barra de actual, la interior en la
    // superficie); «Mis citas», que estaba aquí con la interior sobre su etiqueta, ya cumple.
    'carga /kit · 1440 · A Especialistas',
    'carga /kit · 375 · A Especialistas',
    'carga /kit/navegacion · 1440 · A Especialistas',
    'carga /kit/navegacion · 375 · A Cuenta',
    'carga /kit/navegacion · 375 · A Especialistas',
    'carga /kit/navegacion · 375 · A Mis citas',
    'carga /mis-citas · 1440 · A Mis citas',
    'carga /mis-citas · 375 · A Cuenta',
    'carga /mis-citas · 375 · A Especialistas',
    'carga /mis-citas · 375 · A Mis citas',
    'carga /mis-citas/c3/reprogramar · 1440 · A Mis citas',
    'hora elegida (ListBox) · 1440 · A Especialistas',
    'menú de cuenta · 1440 · A Mis citas',
    'reserva fallida · 1440 · A Especialistas',
    'resumen de errores · 1440 · A Especialistas',
    'sin horarios (Rodrigo) · 1440 · A Especialistas',
    'vacío por colonia · 1440 · A Especialistas',
    'vacío por colonia · 375 · A Cuenta',
    'vacío por colonia · 375 · A Especialistas',
    'vacío por colonia · 375 · A Mis citas',
    'vacío por consulta · 1440 · A Especialistas',
    'vacío por consulta · 375 · A Cuenta',
    'vacío por consulta · 375 · A Especialistas',
    'vacío por consulta · 375 · A Mis citas',
    'vacío por filtros · 1440 · A Especialistas',
    'vacío por filtros · 375 · A Cuenta',
    'vacío por filtros · 375 · A Especialistas',
    'vacío por filtros · 375 · A Mis citas',
    '«Avisarme» activado · 1440 · A Especialistas',
    '«Avisarme» activado · 375 · A Cuenta',
    '«Avisarme» activado · 375 · A Especialistas',
    '«Avisarme» activado · 375 · A Mis citas',
  ],
  2: [
    'carga /kit/fecha-hora · 1440 · INPUT 2029-04-24',
    'carga /kit/fecha-hora · 1440 · INPUT 2029-05-17',
    'sin horarios (Rodrigo) · 1440 · DIV lunes 23 de abril de 2029, hoy, sin hora',
    'sin horarios (Rodrigo) · 375 · INPUT 2029-04-23',
  ],
  3: ['menú de cuenta · 1440 · BUTTON Karla Sánchez'],
  5: [
    'carga /kit · 1440 · A ir a Foco',
    'carga /kit · 375 · A ir a Foco',
    'carga /kit/estados · 375 · A Confirmación previa',
    'carga /kit/estados · 375 · A Horarios',
    'carga /kit/estados · 375 · A Vacío por consulta',
  ],
  // F2 (7.6): la banda exterior sobre el borde de la barra (color-border, 2,66) o, en
  // /kit/navegacion, sobre la barra de actual del Nav Item (color-action, 1,33); la interior
  // en la superficie (6,02). La misma vecindad que el grupo 1 «al borde de la barra».
  6: [
    'carga /kit/layout · 1440 · BUTTON Columna 13',
    'carga /kit/layout · 1440 · BUTTON Columna 24',
    'carga /kit/layout · 375 · BUTTON Columna 12',
    'carga /kit/layout · 375 · BUTTON Columna 2',
    'carga /kit/layout · 375 · BUTTON Columna 22',
    'carga /kit/navegacion · 375 · BUTTON Relleno 11',
    'carga /kit/navegacion · 375 · BUTTON Último elemento de la página',
    'resumen de errores · 375 · INPUT karla.sanchez@ejemplo.com',
  ],
}

const slug = (s) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()

// run.mjs la llama antes de abrir Edge: un mensaje es «no se puede medir» (código 2).
export function checkBase(base) {
  return !base || new URL(base).port === '5173'
    ? '7.3 audita el build, no pnpm dev: VERIFY_BASE=http://localhost:4173 pnpm verify 7.3 (tras pnpm build && pnpm preview) o VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.3'
    : null
}

export default async function run(b, expect) {
  const report = []
  const violations = {}
  const outsideBad = {}
  const monthRegions = {}
  let cargando = {}
  const pairs = new Map()
  const resolved = []
  const rings = []
  let covered = 0
  const coveredBy = {}

  for (const width of BOTH) {
    await b.metrics(width, VIEWPORT[width], 1)
    // Móvil con barra superpuesta; escritorio con la clásica de Windows.
    await b.overlayScrollbars(width === 375)
    for (const state of STATES.filter((s) => s.widths.includes(width))) {
      await b.go(state.url)
      if (state.setup) await state.setup(b)
      if (state.until) await waitFor(b, state.until, `el estado «${state.id}»`)
      if (state.loading) cargando[width] = await b.ev('document.querySelectorAll("main [aria-hidden=true] li").length')
      if (!(await b.ev('typeof axe !== "undefined"'))) await b.ev(`${AXE};true`)

      const modal = await b.ev(`Boolean(${MODAL})`)
      const fixed = await b.ev(FIXED)
      const scrollable = await b.ev('document.documentElement.scrollHeight > innerHeight')
      const positions = fixed.length && scrollable && !modal && !state.loading ? ['arriba', 'final'] : ['arriba']
      const fuera = await outside(b)
      const bad = offending(fuera)
      if (bad.length) outsideBad[`${state.id} · ${width}`] = bad.map((k) => k.etiqueta + (k.atributos['data-live-announcer'] ? ` anunciador de RAC «${k.texto}»` : ''))
      const region = await monthRegion(b)
      if (region) monthRegions[`${state.id} · ${width}`] = region

      let topIncomplete = []
      for (const pos of positions) {
        if (!modal) await b.ev(pos === 'final' ? 'window.scrollTo(0, document.documentElement.scrollHeight), true' : 'window.scrollTo(0, 0), true')
        await sleep(300)
        const r = await b.ev(RUN_AXE)
        if (pos === 'arriba') topIncomplete = r.incomplete.filter((v) => v.id === 'color-contrast').flatMap((v) => v.nodes.map((n) => n.target))
        const key = `${state.id} · ${width}${positions.length > 1 ? ` · ${pos}` : ''}`
        const file = `${slug(state.id)}-${width}${positions.length > 1 ? `-${pos}` : ''}.png`
        const captura = await shot(b, file)
        if (r.violations.length) violations[key] = r.violations.flatMap((v) => v.nodes.map((n) => ({ regla: v.id, nodo: n.texto, relacionados: [...new Set(n.relacionados.map((x) => x.href))].sort() })))
        report.push({ estado: state.id, url: state.url, ancho: width, posicion: pos, modal, barrasFijas: fixed, axe: r.version, violations: r.violations, incomplete: r.incomplete, bestPractice: r.bestPractice, fuera, captura })
        const list = (vs) => vs.map((v) => `${v.id} (${v.nodes.length})`).join(', ')
        const inc = list(r.incomplete)
        const bp = r.bestPractice
        console.log(`· ${key}: ${r.violations.length} violaciones${r.violations.length ? ` [${list(r.violations)}]` : ''} · incomplete ${r.incomplete.length}${inc ? ` [${inc}]` : ''} · best-practice (dato) ${bp.violations.length}${bp.violations.length ? ` [${list(bp.violations)}]` : ''} / incomplete ${bp.incomplete.length}${bp.incomplete.length ? ` [${list(bp.incomplete)}]` : ''} · fuera de #root ${fuera.length}${fuera.length ? ` [${fuera.map((k) => `${k.etiqueta} ${k.caja.join('×')}${k.regionesVivas.length ? ` live:${k.regionesVivas.join('/')}` : ''} ax:${k.ax.ignorado ? `ignorado(${k.ax.razones.join(',')})` : 'visible'}`).join('; ')}]` : ''}`)
      }

      // Bloque B. Con `lenta` el estado cambia a los 1,5 s: solo axe (bloque A).
      if (state.loading) continue
      // Colores en reposo: sin transiciones (un hover a medias al desplazar bajo el puntero
      // dio en una pasada un borde intermedio de 1,45 en un botón de /kit) y el puntero aparcado.
      await b.style('*, *::before, *::after { transition: none !important; animation: none !important }')
      await b.mouse('mouseMoved', 1, 400)
      await b.ev(PAGE)
      const palette = await b.ev('window.__c.palette')
      for (const it of await b.ev('window.__c.collect()')) {
        if (it.cubierto) {
          covered++
          const c = (coveredBy[`${it.tipo} · ${it.tapadoPor}`] ??= { n: 0, ejemplos: [] })
          c.n++
          if (c.ejemplos.length < 3) c.ejemplos.push(`${state.id} · ${width} · ${it.sel} «${it.muestra}»`)
          continue
        }
        const k = `${it.tipo}|${it.fg}|${it.bg}|${it.inactivo}`
        if (!pairs.has(k)) pairs.set(k, { tipo: it.tipo, fg: it.fg, bg: it.bg, ratio: it.ratio, inactivo: it.inactivo, ...classify(it.tipo, it.fg, it.bg, palette), n: 0, rellenoMin: Infinity, estados: new Set(), ejemplos: new Set(), imagen: false })
        const p = pairs.get(k)
        p.n++
        p.estados.add(`${state.id} · ${width}`)
        if (p.ejemplos.size < 3) p.ejemplos.add(`${it.sel} «${it.muestra}»`)
        if (it.relleno !== undefined) p.rellenoMin = Math.min(p.rellenoMin, it.relleno)
        p.imagen ||= it.imagen
      }
      if (topIncomplete.length) {
        for (const r of await b.ev(`window.__c.resolve(${JSON.stringify(topIncomplete)})`)) {
          const veredicto = !r.encontrado || r.sinTexto ? 'sin resolver' : r.cubierto ? 'tapado: sin texto visible' : r.inactivo ? 'inactivo (exento)' : r.ratio >= 4.5 ? 'cumple' : '✗'
          resolved.push({ estado: state.id, ancho: width, target: r.target, par: r.fg ? classify('texto', r.fg, r.bg, palette).roles : null, ratio: r.ratio ?? null, muestra: r.muestra ?? null, veredicto })
        }
      }
      const tag = `${slug(state.id)}-${width}`
      const walk = await ringWalk(b, (s) => (ringFail(s) || s.seleccionada ? tag : null))
      await b.unstyle()
      rings.push({ estado: state.id, ancho: width, ...walk })
      const fails = walk.stops.filter(ringFail)
      const unseen = walk.stops.filter((s) => !s.sinAnillo && s.total > 0 && s.pintado === 0)
      console.log(`  B · ${state.id} · ${width}: ${walk.stops.length} paradas${walk.truncado ? ' (tope)' : ''}, anillo ✗ ${fails.length}${fails.length ? ` [${fails.map((s) => `${s.parada} ${s.elemento}`).join('; ')}]` : ''}, no pintado en la captura ${unseen.length}, mínimo ${Math.min(...walk.stops.filter((s) => s.pintado).map((s) => Math.min(s.exterior.min, s.interior.min)))}`)
    }
  }
  const out = path.join(here, 'out', '7.3')
  const pairList = [...pairs.values()].map((p) => ({ ...p, rellenoMin: Number.isFinite(p.rellenoMin) ? p.rellenoMin : null, estados: [...p.estados], ejemplos: [...p.ejemplos] })).sort((a, b) => a.tipo.localeCompare(b.tipo) || a.ratio - b.ratio)
  fs.writeFileSync(path.join(out, 'auditoria.json'), JSON.stringify({ base: BASE, tags: TAGS, report, contraste: { pares: pairList, tapados: covered, tapadosPor: coveredBy }, incompleteResueltos: resolved, anillos: rings }, null, 2))

  // Falso positivo de posición (tapado por la barra fija arriba; 0 al final y sin la barra):
  // el mismo nodo y los mismos relacionados, ni uno más ni uno menos.
  const bar = ['/', '/fuera-de-alcance', '/mis-citas']
  expect(
    `axe ${report[0].axe} (${TAGS.join(', ')}) en ${report.length} pasadas: 0 violaciones salvo el falso positivo de posición (tapado por la barra fija arriba; 0 al final y sin la barra)`,
    violations,
    {
      'carga / · 375 · arriba': [{ regla: 'target-size', nodo: 'Ver horarios', relacionados: bar }],
      'carga /kit/navegacion · 375 · arriba': [{ regla: 'target-size', nodo: 'Relleno 4', relacionados: bar }],
    },
  )
  // El anunciador de RAC, en body, queda ignorado (activeModalDialog) bajo la hoja modal del
  // calendario: coste exacto desde 7.6, porque lo que anuncia lo lleva la región propia de la
  // hoja (expectativa siguiente). Cualquier otro elemento fuera de #root, o el mismo en otro
  // estado, hace fallar la expectativa.
  expect(
    'fuera de #root: sin caja visible, nada enfocable y ninguna región viva ignorada en el árbol de accesibilidad, salvo el anunciador de RAC bajo la hoja modal del calendario (coste exacto: lo cubre la región propia de la hoja, 7.6)',
    outsideBad,
    { 'hoja del calendario, mes siguiente · 375': ['DIV anunciador de RAC «mayo de 2029»'] },
  )
  expect(
    'región propia del mes en la hoja del calendario (7.6): dentro del <dialog> modal y en el árbol de accesibilidad; vacía al abrir y «mayo de 2029» tras «Mes siguiente»; ninguna en línea',
    monthRegions,
    {
      'hoja del calendario · 375': { texto: '', enElDialogo: true, ignorado: false },
      'hoja del calendario, mes siguiente · 375': { texto: 'mayo de 2029', enElDialogo: true, ignorado: false },
    },
  )
  // Contraprueba del hallazgo: el mismo anunciador, sin modal (calendario en línea a 1440), está
  // expuesto, y en línea no hay región propia (anunciaría dos veces).
  const inline = report.find((p) => p.estado === 'calendario, mes siguiente' && p.ancho === 1440)
  expect(
    'contraprueba: a 1440, sin modal, el anunciador de RAC (1 × 1, sin foco) está expuesto en el árbol de accesibilidad y el calendario en línea no lleva región propia',
    { anunciador: inline.fuera.map((k) => ({ anunciador: k.atributos['data-live-announcer'], caja: k.caja, enfocables: k.enfocables, ignorado: k.ax.ignorado })), regionPropia: monthRegions['calendario, mes siguiente · 1440'] ?? null },
    { anunciador: [{ anunciador: 'true', caja: [1, 1], enfocables: 0, ignorado: false }], regionPropia: null },
  )
  const bpTotal = (kind) => report.filter((p) => p.bestPractice[kind].length).length
  console.log(`· dato: best-practice con violaciones en ${bpTotal('violations')} de ${report.length} pasadas, con incomplete en ${bpTotal('incomplete')}`)
  expect('carga con lenta: axe corre con los esqueletos montados (filas en la lista oculta)', Object.values(cargando).every((n) => n > 0), true)

  // --- Bloque B: resultados ------------------------------------------------------------------------------------
  const contrastFails = pairList
    .filter((p) => !p.inactivo && p.tipo !== 'icono')
    .filter((p) => p.noUsar || (p.tipo === 'texto' && p.ratio < THRESHOLD.texto) || (p.tipo === 'límite' && p.ratio < THRESHOLD.límite && (p.rellenoMin ?? 1) < THRESHOLD.límite))
    .map((p) => `${p.tipo} ${p.roles} ${p.ratio}${p.noUsar ? ` (No usar: ${p.noUsar})` : ''} · ${p.ejemplos[0]}`)
  expect(`contraste renderizado (${pairList.length} pares, ${covered} textos tapados sin contar): texto ≥ 4,5 y límites ≥ 3 (o su relleno ≥ 3), y ninguno de los 6 «No usar»`, contrastFails, [])
  const undocumented = pairList.filter((p) => !p.f3 && p.tipo !== 'icono')
  console.log(`· dato: pares fuera de F.3 (no documentados): ${undocumented.length}${undocumented.length ? ` [${undocumented.map((p) => `${p.tipo} ${p.roles} ${p.ratio}${p.inactivo ? ' inactivo' : ''}`).join('; ')}]` : ''}`)
  const incompleteTargets = report.filter((p) => p.posicion === 'arriba').reduce((n, p) => n + p.incomplete.filter((v) => v.id === 'color-contrast').reduce((m, v) => m + v.nodes.length, 0), 0)
  expect(
    'incomplete de color-contrast de axe (arriba): cada nodo con su par calculado; cumple (≥ 4,5), tapado sin texto visible o inactivo; ninguno sin resolver ni por debajo',
    { nodos: resolved.length, deAxe: incompleteTargets, pendientes: resolved.filter((r) => r.veredicto === '✗' || r.veredicto === 'sin resolver').map((r) => `${r.estado} · ${r.ancho} · ${r.target}`) },
    { nodos: incompleteTargets, deAxe: incompleteTargets, pendientes: [] },
  )
  // Regla del proyecto (§3.1): las dos bandas ≥ 3 en cada punto. El coste medido va exacto por
  // grupo, como el falso positivo de target-size: una parada nueva, una que desaparece o una de
  // coste con un punto ✗ de 1.4.11 (pasa a «Nb») hacen fallar esa expectativa. Los defectos del
  // kit (1b y 4) son un ✗ declarado aparte.
  const ringFails = {}
  for (const w of rings) for (const s of w.stops.filter(ringFail)) (ringFails[ringGroup(s)] ??= []).push(`${w.estado} · ${w.ancho} · ${s.elemento}`)
  for (const list of Object.values(ringFails)) list.sort()
  const stopCount = rings.reduce((n, w) => n + w.stops.length, 0)
  const ringWcag = rings.reduce((n, w) => n + w.stops.filter((s) => s.ambas > 0).length, 0)
  console.log(`· dato: paradas con algún punto de las dos bandas < 3 (✗ de 1.4.11): ${ringWcag}; grupos: ${Object.entries(RING_GROUPS).map(([k, v]) => `${v} (${(ringFails[k] ?? []).length})`).join('; ')}`)
  // Coste medido (grupos 1, 2, 3, 5 y 6): exacto. Todo ✗ que no sea coste ni uno de los defectos
  // declarados (1b, 4) sale aquí como grupo de más.
  const COST = ['1', '2', '3', '5', '6']
  const DEFECTS = ['1b', '4']
  const pickGroups = (keys, from) => Object.fromEntries(Object.entries(from).filter(([k]) => keys.includes(k)))
  const others = Object.keys(ringFails).filter((k) => !DEFECTS.includes(k))
  expect(
    `anillo contra vecinos, coste medido (§3.1: las dos bandas ≥ 3:1 en cada punto; ${stopCount} paradas en ${rings.length} recorridos): los ✗ de los grupos 1, 2, 3, 5 y 6 son exactamente los declarados, ninguno con las dos bandas < 3, y no hay ✗ fuera de los grupos`,
    { grupos: pickGroups(others, ringFails), truncados: rings.filter((w) => w.truncado).map((w) => `${w.estado} · ${w.ancho}`) },
    { grupos: pickGroups(COST, RING_EXPECTED), truncados: [] },
  )
  expect(
    'anillo contra vecinos, defectos del kit (1b, el Nav Item suelto, y 4, el salto al contenido sobre el contenido de /kit/*; corregidos en 7.6, lote 6): ninguna parada',
    pickGroups(DEFECTS, ringFails),
    {},
  )
  const selected = rings.flatMap((w) => w.stops.filter((s) => s.seleccionada && s.pintado))
  expect(
    'hora seleccionada: el anillo cae sobre la superficie (banda interior #ffffff, el hueco del desfase), no sobre el ámbar, y ≥ 3:1 en las dos bandas',
    { paradas: selected.length > 0, interiorEnSuperficie: selected.every((s) => s.interior.color === '#ffffff'), minimo: selected.every((s) => s.interior.min >= 3 && s.exterior.min >= 3) },
    { paradas: true, interiorEnSuperficie: true, minimo: true },
  )
  const unseenAll = rings.flatMap((w) => w.stops.filter((s) => !s.sinAnillo && s.total > 0 && s.pintado === 0).map((s) => `${w.estado} · ${w.ancho} · ${s.parada} ${s.elemento}`))
  console.log(`· dato para el bloque C (2.4.11): anillo no pintado en la captura en ${unseenAll.length} paradas${unseenAll.length ? ` [${unseenAll.join('; ')}]` : ''}`)

  // Contrapruebas: axe detecta una imagen sin alt en main, y el criterio de «fuera de
  // #root» detecta un elemento enfocable colgado de body.
  await b.metrics(1440, VIEWPORT[1440], 1)
  await b.go('/fuera-de-alcance')
  await b.ev(`${AXE};true`)
  await b.ev(`(() => { const i = document.createElement('img'); i.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='; document.querySelector('main').append(i); const d = document.createElement('div'); d.tabIndex = 0; d.textContent = 'sonda'; document.body.append(d); return true })()`)
  const probe = await b.ev(RUN_AXE)
  expect('contraprueba: con una imagen sin alt en main, axe da image-alt', probe.violations.map((v) => v.id), ['image-alt'])
  expect('contraprueba: un div enfocable colgado de body sale en «fuera de #root»', offending(await outside(b)).map((k) => k.etiqueta), ['DIV'])

  // Contraprueba de target-size (la hipótesis de Lighthouse): en / a 375, arriba, sin la
  // barra fija el mismo «Ver horarios» no da target-size.
  await b.metrics(375, VIEWPORT[375], 1)
  await b.overlayScrollbars(true)
  await b.go('/')
  // Una carga completa de una URL ya visitada restaura su scroll (D12, «Matiz»): arriba de forma explícita.
  await b.ev('window.scrollTo(0, 0), true')
  await sleep(300)
  await b.ev(`${AXE};true`)
  const withBar = (await b.ev(RUN_AXE)).violations.map((v) => v.id)
  await b.style('.c-app-layout__bar { display: none }')
  const withoutBar = (await b.ev(RUN_AXE)).violations.map((v) => v.id)
  await b.unstyle()
  expect('contraprueba: en / a 375 (arriba), target-size con la barra fija y nada sin ella', { conBarra: withBar, sinBarra: withoutBar }, { conBarra: ['target-size'], sinBarra: [] })

  // Contrapruebas del bloque B, a 1440.
  await b.metrics(1440, VIEWPORT[1440], 1)
  await b.overlayScrollbars(false)
  // Un h1 en color-border (#b3ac98) sale como texto bajo 4,5.
  await b.go('/fuera-de-alcance')
  await b.style('main h1 { color: var(--color-border) }')
  await b.ev(PAGE)
  const low = (await b.ev('window.__c.collect()')).filter((it) => it.sel.startsWith('h1') && !it.cubierto).map((it) => [it.fg, it.bg, it.ratio])
  await b.unstyle()
  expect('contraprueba: el h1 en color-border sale como texto de 2,27 sobre la superficie', low, [['#b3ac98', '#ffffff', 2.27]])
  // El anillo en surface-muted (#e6e2d8) queda bajo 3:1 en todas las paradas.
  await b.style(':focus-visible, :has(> :focus-visible) { outline-color: var(--color-surface-muted) !important }')
  const pale = await ringWalk(b, () => null)
  await b.unstyle()
  expect('contraprueba: con el anillo en surface-muted, todas las paradas de /fuera-de-alcance bajan de 3:1', { paradas: pale.stops.length > 0, todas: pale.stops.every(ringFail) }, { paradas: true, todas: true })
  // Con desfase −2, el anillo de la hora seleccionada cae sobre el ámbar: el par «No usar» (2,09).
  await b.go(P021)
  await b.ev(PAGE)
  await b.style('.c-time-slot:focus-visible { outline-offset: -2px }')
  const inside = (await ringWalk(b, () => null)).stops.filter((s) => s.seleccionada).map((s) => [s.interior.color, s.interior.min])
  await b.unstyle()
  expect('contraprueba: con desfase −2, la banda interior de la hora seleccionada es el ámbar (#d9834b) a 2,09 («No usar»)', inside, [['#d9834b', 2.09]])

  // Bloques C y D (7.3-cd.mjs).
  await runCD(b, expect)
}
