// 4.2 Identidad y estado: Avatar, Tag, Status Tag, Step y Notice.
import { sleep } from './cdp.mjs'
import { overflow, splitWords, text200 } from './checks.mjs'
import { typeErrorLines } from './static.mjs'

const all = (sel) => `[...document.querySelectorAll('${sel}')]`
const liveBtn = "[...document.querySelectorAll('button')].find((x) => x.textContent === 'Avisarme si se libera un hueco' && !x.classList.contains('c-kit__fill'))"
const cancelBtn = "[...document.querySelectorAll('button')].find((x) => x.textContent === 'Cancelar la cita de ejemplo')"
const active = `(() => { const a = document.activeElement; return a.tagName + (a.getAttribute('tabindex') ? '[tabindex=' + a.getAttribute('tabindex') + ']' : '') + ' «' + (a.getAttribute('aria-label') ?? a.textContent).trim().slice(0, 40) + '»' })()`

// Geometría de un aviso respecto a su borde superior.
const noticeGeometry = (sel) => `(() => {
  const n = document.querySelector('${sel}'), top = n.getBoundingClientRect().top
  const c = (el) => Math.round(el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 - top)
  const slot = n.querySelector('.c-notice__icon-slot').getBoundingClientRect(), x = n.querySelector('.c-icon-button')
  return { ranura: [Math.round(slot.width), Math.round(slot.height)], centroIcono: c(n.querySelector('.c-notice__icon')), centroTitulo: c(n.querySelector('.c-notice__title')),
    cierre: x ? { top: Math.round(x.getBoundingClientRect().top - top), centro: c(x) } : null }
})()`

// Filas y ancho del contenido de cada aviso a 320.
const noticeRows = `[...document.querySelectorAll('.c-notice')].map((n) => {
  const top = n.getBoundingClientRect().top, rel = (el) => (el ? Math.round(el.getBoundingClientRect().top - top) : null)
  const c = n.querySelector('.c-notice__content')
  return n.className.split(' ')[1].replace('c-notice--', '') + ': contenido ' + Math.round(c.getBoundingClientRect().width) + ', filas ' + new Set([rel(n.querySelector('.c-notice__icon-slot')), rel(c), rel(n.querySelector('.c-icon-button'))].filter((v) => v !== null)).size
})`

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.metrics(1280, 900, 1)
  await b.go('/kit')

  // --- Medidas a 100 % ---------------------------------------------------------------
  expect('Avatar: tamaño y paso de la inicial', await b.ev(`${all('.c-avatar')}.map((a) => { const r = a.getBoundingClientRect(), s = getComputedStyle(a); return r.width + '×' + r.height + ' ' + s.fontSize + '/' + s.lineHeight + ' aria-hidden=' + a.getAttribute('aria-hidden') })`), [
    '48×48 25px/32px aria-hidden=true',
    '64×64 25px/32px aria-hidden=true',
    '96×96 31px/36px aria-hidden=true',
  ])
  expect('Tag', await b.ev(`${all('.c-tag')}.map((t) => Math.round(t.getBoundingClientRect().width * 10) / 10 + '×' + t.getBoundingClientRect().height)`), ['94.6×30', '203.2×30'])
  expect('Status Tag: tamaño, borde e icono', await b.ev(`${all('.c-status-tag')}.map((t) => { const s = getComputedStyle(t); return Math.round(t.getBoundingClientRect().width * 10) / 10 + '×' + t.getBoundingClientRect().height + ' ' + s.borderTopStyle + ' icono ' + getComputedStyle(t.querySelector('svg')).color })`), [
    '129.7×30 solid icono rgb(31, 115, 80)',
    '142.9×30 solid icono rgb(177, 94, 48)',
    '115.5×30 solid icono rgb(32, 30, 25)',
    '121.8×30 dashed icono rgb(110, 104, 88)',
  ])
  expect('Step: tamaño, peso, aria-current y texto para el lector', await b.ev(`${all('.c-step')}.map((t) => Math.round(t.getBoundingClientRect().width * 10) / 10 + '×' + t.getBoundingClientRect().height + ' ' + getComputedStyle(t).fontWeight + ' ' + t.getAttribute('aria-current') + ' «' + t.querySelector('.c-step__label').textContent + '»')`), [
    '117.6×24 400 null «Fecha y hora, completado»',
    '97.8×24 600 step «Tus datos»',
    '63.5×24 400 null «Listo, pendiente»',
  ])
  expect('Notice Info: ranura 20 × 24, centros de icono y título a 29', await b.ev(noticeGeometry('.c-notice--info')), { ranura: [20, 24], centroIcono: 29, centroTitulo: 29, cierre: null })

  // --- Región viva ------------------------------------------------------------------------
  const ax = async () =>
    (await b.send('Accessibility.getFullAXTree')).nodes.filter((n) => ['status', 'alert'].includes(n.role?.value)).map((n) => `${n.role.value}: ${n.childIds?.length ?? 0} hijos`)
  expect('región viva: existe vacía antes del mensaje', await ax(), ['status: 0 hijos'])
  await b.ev(`(() => { window.__region = document.querySelector('[role=status]'); window.__mut = []; new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => __mut.push((n.className || n.nodeName) + ' dentro de ' + (m.target.getAttribute('role') ? '[role=' + m.target.getAttribute('role') + ']' : m.target.className))))).observe(document.querySelector('.c-kit'), { childList: true, subtree: true }); return true })()`)
  await b.tabTo(liveBtn)
  await b.enter()
  await sleep(400)
  expect('región viva: tras Intro', {
    foco: await b.ev(active),
    mismaRegion: await b.ev('document.querySelector("[role=status]") === __region'),
    mutaciones: await b.ev('[...__mut]'),
    ax: await ax(),
  }, {
    foco: 'BUTTON «Avisarme si se libera un hueco»',
    mismaRegion: true,
    mutaciones: ['c-notice c-notice--success dentro de [role=status]'],
    ax: ['status: 1 hijos'],
  })
  expect('Notice Success: cierre arriba, a 17 del borde, centro a 41', await b.ev(noticeGeometry('.c-notice--success')), { ranura: [20, 24], centroIcono: 29, centroTitulo: 29, cierre: { top: 17, centro: 41 } })
  await b.tab()
  expect('región viva: siguiente Tab', await b.ev(active), 'BUTTON «Cerrar aviso»')
  await b.enter()
  await sleep(300)
  expect('región viva: al cerrar, foco al encabezado de la sección y región vacía', { foco: await b.ev(active), region: await b.ev('document.querySelector("[role=status]") === __region && __region.childElementCount === 0') }, { foco: 'H2[tabindex=-1] «Identidad y estado»', region: true })

  // --- Foco -------------------------------------------------------------------------------
  await b.tabTo(cancelBtn)
  await b.enter()
  await sleep(400)
  expect('modo foco: título enfocado, sin rol, disparador fuera', {
    foco: await b.ev(active),
    sinRol: await b.ev(`(() => { const t = document.activeElement; return !t.closest('.c-notice').hasAttribute('role') && !t.closest('[role=status], [role=alert]') })()`),
    focusVisible: await b.ev('document.activeElement.matches(":focus-visible")'),
    disparador: await b.ev(`Boolean(${cancelBtn})`),
  }, { foco: 'H4[tabindex=-1] «Cita cancelada»', sinRol: true, focusVisible: true, disparador: false })
  await b.shot('foco-error.png', await b.rect("document.querySelector('.c-notice--error')", 8))
  await b.tab()
  expect('modo foco: siguiente Tab', await b.ev(active), 'BUTTON «Cerrar aviso»')
  await b.enter()
  await sleep(300)
  expect('modo foco: al cerrar, foco al encabezado y vuelve el disparador', { foco: await b.ev(active), disparador: await b.ev(`Boolean(${cancelBtn})`) }, { foco: 'H2[tabindex=-1] «Identidad y estado»', disparador: true })

  await b.metrics(1280, 900, 3)
  await b.shot('status-tags-3x.png', await b.rect("document.querySelector('.c-status-tag').parentElement", 4))
  await b.shot('steps-3x.png', await b.rect("document.querySelector('.c-step').parentElement", 4))

  // --- forced-colors ------------------------------------------------------------------------
  await b.metrics(1280, 900, 2)
  await b.forcedColors(true)
  await b.go('/kit')
  await b.ev(`(${cancelBtn}).click(), true`)
  await sleep(200)
  await b.ev('document.activeElement.blur(), true')
  expect('forced-colors: iconos con color propio siguen el forzado', await b.ev(`[...document.querySelectorAll('.c-status-tag, .c-notice, .c-step--done')].map((el) => getComputedStyle(el.querySelector('svg')).color)`), Array(7).fill('rgb(255, 255, 255)'))
  expect('forced-colors: Status Tag sin superficie, borde (discontinuo en Cancelled)', await b.ev(`${all('.c-status-tag')}.map((t) => getComputedStyle(t).backgroundColor + ' ' + getComputedStyle(t).borderTopStyle)`), ['rgb(0, 0, 0) solid', 'rgb(0, 0, 0) solid', 'rgb(0, 0, 0) solid', 'rgb(0, 0, 0) dashed'])
  expect('forced-colors: Step Done sin relleno, con aro y check', await b.ev(`(() => { const m = document.querySelector('.c-step--done .c-step__marker'), s = getComputedStyle(m); return [s.backgroundColor, s.borderTopColor, getComputedStyle(m.querySelector('svg')).color] })()`), ['rgb(0, 0, 0)', 'rgb(255, 255, 255)', 'rgb(255, 255, 255)'])
  await b.shot('forced-identidad.png', await b.rect("document.getElementById('kit-identidad').closest('section')"))
  await b.forcedColors(false)

  // --- 320 con las dos barras, al 100 % y al 200 % ----------------------------------------------
  const expected = {
    'clásica 100 %': ['info: contenido 207, filas 1', 'success: contenido 147, filas 1', 'error: contenido 147, filas 1'],
    'clásica 200 %': ['info: contenido 175, filas 2', 'success: contenido 175, filas 3', 'error: contenido 175, filas 3'],
    'superpuesta 100 %': ['info: contenido 222, filas 1', 'success: contenido 162, filas 1', 'error: contenido 162, filas 1'],
    'superpuesta 200 %': ['info: contenido 190, filas 2', 'success: contenido 190, filas 3', 'error: contenido 190, filas 3'],
  }
  for (const overlay of [false, true]) {
    const bar = overlay ? 'superpuesta' : 'clásica'
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900, 2)
    await b.go('/kit')
    await b.ev(`(${liveBtn}).click(), (${cancelBtn}).click(), true`)
    await sleep(300)
    for (const zoom of ['100 %', '200 %']) {
      if (zoom === '200 %') {
        await b.run(text200)
        await sleep(300)
      }
      expect(`320, barra ${bar}, ${zoom}: Notice`, await b.ev(noticeRows), expected[`${bar} ${zoom}`])
      expect(`320, barra ${bar}, ${zoom}: sin scroll horizontal ni palabras partidas`, { overflow: await b.run(overflow), words: (await b.run(splitWords, '.c-tag, .c-status-tag, .c-step, .c-notice')).split }, { overflow: 0, words: [] })
    }
  }
  await b.overlayScrollbars(false)
  await b.metrics(320, 900, 2)
  await b.go('/kit')
  await b.run(text200)
  await sleep(300)
  expect('200 % a 320: Avatar', await b.ev(`${all('.c-avatar')}.map((a) => a.getBoundingClientRect().width)`), [96, 128, 192])

  // --- Tipos de Notice ------------------------------------------------------------------------
  expect(
    'tipos de Notice: compilan los 3 válidos, fallan las 9 combinaciones prohibidas',
    typeErrorLines(`import Notice from '../components/Notice.tsx'
const b = { title: 'T', headingLevel: 2 as const, body: 'B' }
export const V1 = () => <Notice tone="info" icon="calendar-check" {...b} />
export const V2 = () => <Notice tone="success" delivery="live" open={false} onDismiss={() => {}} {...b} />
export const V3 = () => <Notice tone="error" delivery="focus" action={{ href: '/kit', label: 'Elegir otra hora' }} {...b} />
export const P1 = () => <Notice tone="info" onDismiss={() => {}} {...b} />
export const P2 = () => <Notice tone="info" action={{ href: '/', label: 'x' }} {...b} />
export const P3 = () => <Notice tone="info" delivery="live" open {...b} />
export const P4 = () => <Notice tone="info" delivery="focus" {...b} />
export const P5 = () => <Notice tone="success" {...b} />
export const P6 = () => <Notice tone="error" delivery="focus" open {...b} />
export const P7 = () => <Notice tone="success" delivery="live" {...b} />
export const P8 = () => <Notice tone="error" delivery="focus" icon="info" {...b} />
export const P9 = () => <Notice tone="info" title="T" body="B" />
`),
    [6, 7, 8, 9, 10, 11, 12, 13, 14],
  )
}
