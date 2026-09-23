// 4.1 Acciones: Icon, Button, Icon Button, Link y Back Link.
import { sleep } from './cdp.mjs'
import { center, focusInfo, overflow, size, splitWords, text200 } from './checks.mjs'
import { FIGMA, iconHashes } from './icon-hashes.mjs'
import { lintLines, typeErrorLines } from './static.mjs'

const T = {
  primary: "document.querySelectorAll('.c-button')[0]",
  secondary: "document.querySelector('.c-button--secondary')",
  destructive: "document.querySelector('.c-button--destructive')",
  asLink: "document.querySelector('a.c-button:not([download])')",
  download: "document.querySelector('a.c-button[download]')",
  fill: "document.querySelector('.c-kit__fill')",
  iconButton: "document.querySelector('.c-icon-button')",
  link: "[...document.querySelectorAll('.c-link')].find((a) => a.textContent === 'Ir a Tipografía')",
  backLink: "document.querySelector('.c-back-link')",
}
const RING = { outline: 'solid 2px rgb(72, 107, 77)', offset: '2px', focusVisible: true }

export default async function run(b, expect) {
  // --- Iconos ----------------------------------------------------------------
  expect('iconos: 19 archivos, formato y hash iguales a Figma', iconHashes(), FIGMA)

  // --- 1280: medidas, foco, hover ----------------------------------------------
  await b.forcedColors(false)
  await b.metrics(1280, 900, 1)
  await b.go('/kit')
  expect('Button', await b.run(size, T.primary, 2), [104.16, 50])
  expect('Icon Button', await b.run(size, T.iconButton), [48, 48])
  expect('Link, alto', (await b.run(size, T.link))[1], 48)
  expect('Back Link', await b.run(size, T.backLink, 2), [122.13, 48])
  expect('iconos del kit: aria-hidden y focusable=false', await b.ev(`[...document.querySelectorAll('svg.c-icon')].every((s) => s.getAttribute('aria-hidden') === 'true' && s.getAttribute('focusable') === 'false')`), true)
  expect(
    'marcado de Button: <button type=button>, <a> sin type',
    await b.ev(`({ boton: (${T.primary}).outerHTML.startsWith('<button type="button"'), aConType: document.querySelectorAll('a.c-button[type]').length, descarga: (${T.download}).hasAttribute('download') })`),
    { boton: true, aConType: 0, descarga: true },
  )

  await b.style('.c-button { padding-block: 0 !important }')
  expect('contraprueba: Button sin padding-block → 26', (await b.run(size, T.primary))[1], 26)
  await b.unstyle()
  await b.style('.c-icon-button { inline-size: auto !important; block-size: auto !important }')
  expect('contraprueba: Icon Button sin tamaño → 26 × 26', await b.run(size, T.iconButton), [26, 26])
  await b.unstyle()
  expect('contraprueba: Link sin c-link → 24 de alto', await b.ev(`(() => { const a = ${T.link}; a.classList.remove('c-link'); const h = Math.round(a.getBoundingClientRect().height); a.classList.add('c-link'); return h })()`), 24)

  for (const k of ['primary', 'secondary', 'destructive', 'asLink', 'download', 'iconButton', 'link', 'backLink']) {
    await b.tabTo(T[k])
    const f = await b.run(focusInfo)
    expect(`foco con Tab: ${k}`, { outline: f.outline, offset: f.offset, focusVisible: f.focusVisible, radius: f.radius }, { ...RING, radius: '6px' })
    await b.metrics(1280, 900, 3)
    await b.shot(`foco-${k}.png`, await b.rect(T[k], 8))
    await b.metrics(1280, 900, 1)
  }
  await b.ev('document.activeElement.blur(), true')
  const p = await b.run(center, T.primary)
  await b.click(p.x, p.y)
  expect('contraprueba: clic de ratón → foco sin anillo', (await b.run(focusInfo)).focusVisible, false)

  const hover = async (expr, prop) => {
    const c = await b.run(center, expr)
    await b.mouse('mouseMoved', 1, 1)
    await b.mouse('mouseMoved', c.x, c.y)
    await sleep(50)
    const v = await b.ev(`getComputedStyle(${expr}).${prop}`)
    await b.mouse('mouseMoved', 1, 1)
    return v
  }
  expect('hover Primary', await hover(T.primary, 'backgroundColor'), 'rgb(44, 66, 48)')
  expect('hover Secondary', await hover(T.secondary, 'backgroundColor'), 'rgb(226, 234, 227)')
  expect('hover Destructive', await hover(T.destructive, 'backgroundColor'), 'rgb(108, 27, 27)')
  expect('hover Icon Button', await hover(T.iconButton, 'backgroundColor'), 'rgb(226, 234, 227)')
  expect('hover Link', await hover(T.link, 'color'), 'rgb(32, 30, 25)')
  expect('hover Back Link', await hover(T.backLink, 'color'), 'rgb(32, 30, 25)')

  // --- 2.5.8: enlaces sueltos del kit a 320 y 1440 ------------------------------
  for (const w of [320, 1440]) {
    await b.metrics(w, 900, 1)
    await b.go('/kit')
    const kit = await b.ev(`[...new Set([...document.querySelectorAll('.c-kit__swatch .c-link, .c-kit__section ul .c-link')].map((a) => Math.round(a.getBoundingClientRect().height)))]`)
    await b.go('/kit/layout?aside=inicio&lineas=1')
    const back = await b.ev(`Math.round(document.querySelector('.c-back-link').getBoundingClientRect().height)`)
    expect(`2.5.8 a ${w}: alto de los enlaces sueltos del kit`, { kit, backLink: back }, { kit: [48], backLink: 48 })
  }

  // --- 200 % a 320, con las dos barras ----------------------------------------------
  // Ninguna palabra parte pudiendo caber (la regla). Las inevitables son más
  // anchas que el interior del botón entero: 158 px con barra superpuesta,
  // 143 con la clásica, donde «completo» y «Avisarme» lo exceden por 2–3 px
  // (DESIGN.md § Controles con icono y etiqueta; Pendientes, fase 5).
  const unavoidable = {
    clásica: ['Siguiente', 'completo', 'Descargar', 'calendar-blank.svg', 'Avisarme'],
    superpuesta: ['Descargar', 'calendar-blank.svg'],
  }
  // Back Link con barra clásica: icono 40 + gap 8 + «Especialistas» 196 = 244
  // no caben en 241, y por la regla el icono baja de línea en vez de partir la
  // palabra: 24 + 48 + 48 + 24 = 144 de alto.
  const backLinkHeight = { clásica: 144, superpuesta: 96 }
  for (const overlay of [false, true]) {
    const bar = overlay ? 'superpuesta' : 'clásica'
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900, 2)
    await b.go('/kit')
    expect(`200 %, barra ${bar}: texto al 200 %`, await b.run(text200), '32px')
    await sleep(300)
    expect(`200 %, barra ${bar}: alto de Button, Icon Button, Link y Back Link`, [(await b.run(size, T.primary))[1], await b.run(size, T.iconButton), (await b.run(size, T.link))[1], (await b.run(size, T.backLink))[1]], [98, [96, 96], 96, backLinkHeight[bar]])
    expect(`200 %, barra ${bar}: sin scroll horizontal`, await b.run(overflow), 0)
    expect(`200 %, barra ${bar}: ninguna palabra parte pudiendo caber; las inevitables`, await b.run(splitWords, '.c-button, .c-link, .c-back-link'), { split: unavoidable[bar], couldFit: [] })
  }
  expect('200 %, barra superpuesta: Back Link «Especialistas»', await b.run(size, T.backLink), [244, 96])
  await b.style('.c-kit__fill { block-size: 50px !important }')
  // Con flex-wrap (añadido después de la primera medida, que centraba una sola
  // línea y daba 67 arriba y 66 abajo), el contenido arranca arriba y el texto
  // se sale solo por abajo. Lo que se prueba es que se sale.
  expect(
    'contraprueba 200 %: alto fijo → el texto se sale de la caja (por abajo)',
    await b.ev(`(() => { const el = ${T.fill}, box = el.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(el); const rs = [...r.getClientRects()]; return { arriba: Math.min(...rs.map((x) => x.top)) < box.top, abajo: Math.max(...rs.map((x) => x.bottom)) > box.bottom } })()`),
    { arriba: false, abajo: true },
  )
  await b.unstyle()
  await b.style('.c-button { white-space: nowrap !important; flex-wrap: nowrap !important }')
  expect('contraprueba 200 %: nowrap → scroll horizontal', (await b.run(overflow)) > 0, true)
  await b.unstyle()
  await b.style('.c-button { flex-wrap: nowrap !important }')
  expect('contraprueba 200 %: sin flex-wrap → 17 palabras partidas', (await b.ev(`(${splitWords})('.c-button')`)).split.length > 2, true)
  await b.unstyle()
  await b.overlayScrollbars(false)

  // --- forced-colors ---------------------------------------------------------------
  await b.metrics(1280, 900, 2)
  await b.forcedColors(true)
  await b.go('/kit')
  expect('forced-colors: borde de Primary e Icon Button', await b.ev(`[${T.primary}, ${T.iconButton}].map((e) => getComputedStyle(e).borderTopStyle + ' ' + getComputedStyle(e).borderTopWidth + ' ' + getComputedStyle(e).borderTopColor)`), ['solid 1px rgb(255, 255, 255)', 'solid 1px rgb(255, 255, 255)'])
  await b.tabTo(T.primary)
  expect('forced-colors: anillo', (await b.run(focusInfo)).outline, 'solid 2px rgb(26, 235, 255)')
  await b.ev('document.activeElement.blur(), true')
  await b.shot('forced-acciones.png', await b.rect("document.getElementById('kit-acciones').closest('section')"))
  await b.style('.c-button { border: 0 !important }')
  await b.shot('forced-contraprueba-sin-borde.png', await b.rect(`(${T.primary}).parentElement`, 8))
  await b.unstyle()
  await b.forcedColors(false)

  // --- Ancla nativa (Link con href="#…") -----------------------------------------------
  await b.metrics(1280, 900, 1)
  await b.go('/kit')
  const first = "document.querySelector('.c-kit__swatch .c-link')"
  await b.tabTo(first)
  const origin = await b.ev('(window.__nodo = document.querySelector(".c-kit"), window.__h1 = document.querySelector("h1"), Math.round(scrollY))')
  await b.enter()
  await sleep(800)
  expect('ancla: tras Intro', await b.ev(`({ url: location.pathname + location.hash, mismaRuta: document.querySelector('.c-kit') === __nodo && document.querySelector('h1') === __h1, focoEnH1: document.activeElement.tagName === 'H1' })`), { url: '/kit#kit-enlaces', mismaRuta: true, focoEnH1: false })
  await b.tab()
  expect('ancla: siguiente Tab, como la nativa', await b.ev('document.activeElement.textContent'), 'volver a Tipografía')
  const afterAnchor = await b.ev('Math.round(scrollY)')
  const { currentIndex, entries } = await b.send('Page.getNavigationHistory')
  await b.send('Page.navigateToHistoryEntry', { entryId: entries[currentIndex - 1].id })
  await sleep(800)
  expect('ancla: Atrás vuelve a /kit (el scroll no se restaura: Pendientes, fase 5)', await b.ev(`({ url: location.pathname + location.hash, restauraScroll: Math.round(scrollY) === ${origin} && ${origin} !== ${afterAnchor} })`), { url: '/kit', restauraScroll: false })

  // --- Estáticas: ESLint y tipos -----------------------------------------------------------
  expect(
    'ESLint: modificadores de o-stack/o-cluster y aria-label en div',
    lintLines(`export default function V({ gap }: { gap: number }) {
  return (
    <>
      <div className="o-stack">1</div>
      <div className="o-cluster o-cluster--gap-2">2</div>
      <div className="o-cluster o-cluster--align-center">3</div>
      <div className={\`o-stack \${gap > 0 ? 'x' : 'y'}\`}>4</div>
      <div aria-label="Regla antigua">5</div>
      <div className="o-stack o-stack--gap-0">6</div>
      <div className="o-cluster o-cluster--gap-3 o-cluster--align-center">7</div>
      <div className={\`o-stack o-stack--gap-\${gap}\`}>8</div>
    </>
  )
}
`),
    ['4: no-restricted-syntax', '5: no-restricted-syntax', '6: no-restricted-syntax', '7: no-restricted-syntax', '8: no-restricted-syntax'],
  )
  expect(
    'tipos de Button: fallan estado en enlace, valor inválido y aria-controls en enlace',
    typeErrorLines(`import Button from '../components/Button.tsx'
export const A = () => <Button aria-pressed={true}>a</Button>
export const B = () => <Button aria-expanded={false} aria-haspopup="dialog" aria-controls="m">b</Button>
export const C = () => <Button href="/kit" aria-describedby="n">c</Button>
export const D = () => <Button href="/kit" aria-pressed={true}>d</Button>
export const E = () => <Button aria-haspopup="menú">e</Button>
export const F = () => <Button href="/kit" aria-controls="m">f</Button>
`),
    [5, 6, 7],
  )
  expect('ESLint: aria-* mal escrito en Button', lintLines(`import Button from '../components/Button.tsx'
export const A = () => <Button aria-presed={true}>a</Button>
`), ['2: jsx-a11y/aria-props'])
}
