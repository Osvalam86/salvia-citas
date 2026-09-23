// 4.3 Formulario: Field/Text, Field/Select, Checkbox, Radio y Legend.
import { sleep } from './cdp.mjs'
import { center, overflow, splitWords, text200 } from './checks.mjs'
import { lintLines, typeErrorLines } from './static.mjs'

const byName = (n) => `document.querySelector('[name="${n}"]')`
const FIELDS = ['kit-correo', 'kit-correo-error', 'kit-motivo', 'kit-motivo-error', 'kit-motivo-lleno']

// Control, campo, borde, padding, mensaje enlazado e iconos de un campo.
const field = (n) => `(() => {
  const c = ${byName(n)}, f = c.closest('.c-field'), cs = getComputedStyle(c), r = c.getBoundingClientRect()
  const msg = document.getElementById(c.getAttribute('aria-describedby'))
  const icons = [...f.querySelectorAll('.c-field__adornments svg')].map((s) => s.getBoundingClientRect())
  const contentRight = r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight)
  return {
    control: r.height, campo: f.getBoundingClientRect().height, borde: cs.borderTopWidth, padding: cs.paddingTop + ' ' + cs.paddingLeft,
    invalid: c.getAttribute('aria-invalid'), mensaje: msg ? getComputedStyle(msg).color : null,
    alBorde: icons.length ? Math.round(r.right - icons[icons.length - 1].right) : null,
    textoAlIcono: icons.length ? Math.round(icons[0].left - contentRight) : null,
  }
})()`

// Filas de casilla y radio agrupadas por contenedor: caja en la línea de la
// etiqueta, o arriba y a qué distancia de su etiqueta y de la fila anterior.
const rows = `(() => {
  const groups = new Map()
  for (const el of document.querySelectorAll('.c-checkbox, .c-radio')) (groups.get(el.parentElement) ?? groups.set(el.parentElement, []).get(el.parentElement)).push(el)
  const out = []
  for (const items of groups.values()) items.forEach((el, i) => {
    const box = el.querySelector('.c-checkbox__box, .c-radio__circle').getBoundingClientRect(), lab = el.querySelector('.c-checkbox__label, .c-radio__label').getBoundingClientRect()
    if (Math.abs(box.top - lab.top) < 2) return out.push('misma línea')
    const prev = i > 0 ? (items[i - 1].querySelector('.c-checkbox__message') ?? items[i - 1].querySelector('.c-checkbox__label, .c-radio__label')).getBoundingClientRect().bottom : null
    out.push('arriba ' + Math.round(lab.top - box.bottom) + (prev === null ? '' : '/' + Math.round(box.top - prev)))
  })
  return out
})()`

export default async function run(b, expect) {
  await b.forcedColors(false)
  await b.metrics(1280, 900, 1)
  await b.go('/kit')

  // --- Campos ----------------------------------------------------------------------------
  const measured = {}
  for (const n of FIELDS) measured[n] = await b.ev(field(n))
  const plain = { control: 50, campo: 106, borde: '1px', padding: '12px 16px', invalid: null, mensaje: 'rgb(110, 104, 88)' }
  const error = { control: 50, campo: 106, borde: '2px', padding: '11px 15px', invalid: 'true', mensaje: 'rgb(146, 38, 38)' }
  expect('campos: control 50 y campo 106, en reposo y en error, con y sin valor', measured, {
    'kit-correo': { ...plain, alBorde: null, textoAlIcono: null },
    'kit-correo-error': { ...error, alBorde: 17, textoAlIcono: 12 },
    'kit-motivo': { ...plain, alBorde: 17, textoAlIcono: 12 },
    'kit-motivo-error': { ...error, alBorde: 17, textoAlIcono: 12 },
    'kit-motivo-lleno': { ...plain, alBorde: 17, textoAlIcono: 12 },
  })
  await b.style(".c-field__input[aria-invalid='true'], .c-field__select[aria-invalid='true'] { --_pad-block: var(--space-3) !important; --_pad-inline: var(--space-4) !important }")
  expect('contraprueba: sin la compensación de 1px, el control en error mide 52', await b.ev(`[${byName('kit-correo-error')}, ${byName('kit-motivo-error')}].map((c) => c.getBoundingClientRect().height)`), [52, 52])
  await b.unstyle()
  expect('select: vacío en secundario, con valor en tinta, opciones en tinta', await b.ev(`({ vacio: getComputedStyle(${byName('kit-motivo')}).color, lleno: getComputedStyle(${byName('kit-motivo-lleno')}).color, opciones: [...${byName('kit-motivo')}.options].map((o) => getComputedStyle(o).color) })`), { vacio: 'rgb(110, 104, 88)', lleno: 'rgb(32, 30, 25)', opciones: ['rgb(32, 30, 25)', 'rgb(32, 30, 25)'] })
  expect('clic sobre los iconos: llega al control', await b.ev(`(() => { const out = []; for (const n of ['kit-motivo-error', 'kit-correo-error']) { const f = document.querySelector('[name="' + n + '"]').closest('.c-field'); f.scrollIntoView({ block: 'center' }); for (const s of f.querySelectorAll('.c-field__adornments svg')) { const r = s.getBoundingClientRect(); out.push(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).tagName) } } return out })()`), ['SELECT', 'SELECT', 'INPUT'])
  await b.ev(`(() => { const i = ${byName('kit-correo-error')}; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'karla.sanchez.arellano.con.un.correo.muy.largo@ejemplo.com'); i.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  expect('texto largo en error: acaba 12 antes del icono', (await b.ev(field('kit-correo-error'))).textoAlIcono, 12)

  for (const n of ['kit-correo', 'kit-correo-error']) {
    await b.tabTo(byName(n))
    expect(`foco con Tab: ${n}`, await b.ev(`(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth + ' desfase ' + s.outlineOffset + ' radio ' + s.borderTopLeftRadius })()`), 'solid 2px desfase 2px radio 6px')
  }
  await b.ev('document.activeElement.blur(), true')
  const hover = async (n) => {
    const c = await b.run(center, byName(n))
    await b.mouse('mouseMoved', 1, 1)
    await b.mouse('mouseMoved', c.x, c.y)
    await sleep(50)
    const v = await b.ev(`getComputedStyle(${byName(n)}).borderTopColor`)
    await b.mouse('mouseMoved', 1, 1)
    return v
  }
  expect('hover en campo: borde action; en error, sigue rojo', [await hover('kit-correo'), await hover('kit-correo-error'), await hover('kit-motivo')], ['rgb(59, 87, 64)', 'rgb(146, 38, 38)', 'rgb(59, 87, 64)'])

  // --- Casilla y radio ---------------------------------------------------------------------
  const box = (n) => `(() => { const i = ${byName(n)}, root = i.closest('.c-checkbox, .c-radio'), s = getComputedStyle(i.parentElement); return { raiz: root.getBoundingClientRect().height, fila: i.closest('label').getBoundingClientRect().height, caja: s.width + ' ' + s.borderTopWidth + ' ' + s.backgroundColor, peso: getComputedStyle(root.querySelector('.c-checkbox__label, .c-radio__label')).fontWeight } })()`
  expect('casillas: fila 48, 72 con mensaje, caja 24 con borde 2', [await b.ev(box('kit-privacidad')), await b.ev(box('kit-recordatorio')), await b.ev(box('kit-especialidad'))], [
    { raiz: 72, fila: 36, caja: '24px 2px rgb(255, 255, 255)', peso: '400' },
    { raiz: 72, fila: 36, caja: '24px 2px rgb(59, 87, 64)', peso: '600' },
    { raiz: 48, fila: 48, caja: '24px 2px rgb(255, 255, 255)', peso: '400' },
  ])
  expect('radios: fila 48, punto de 12 en el seleccionado', await b.ev(`[...document.querySelectorAll('[name="kit-disponibilidad"]')].map((i) => i.closest('label').getBoundingClientRect().height + (i.checked ? ' punto ' + i.parentElement.querySelector('.c-radio__dot').getBoundingClientRect().width : ''))`), ['48 punto 12', '48', '48', '48'])
  expect('nombres accesibles: etiqueta sin el mensaje; mensaje como descripción', (await b.send('Accessibility.getFullAXTree')).nodes.filter((x) => ['checkbox', 'group'].includes(x.role?.value) && x.name?.value).map((x) => `${x.role.value}: «${x.name.value}»` + (x.description?.value ? ` — «${x.description.value}»` : '')), [
    'group: «Antes de confirmar» — «Todos los campos son obligatorios salvo los marcados como opcionales»',
    'group: «Disponibilidad»',
    'group: «Elige fecha»',
    'checkbox: «Acepto el aviso de privacidad» — «Debes aceptar el aviso para continuar»',
    'checkbox: «Quiero un recordatorio por correo el día anterior» — «Lo enviamos 24 horas antes de tu cita»',
    'checkbox: «Cardiología»',
  ])
  const pad = await b.ev(`(() => { ${byName('kit-especialidad')}.scrollIntoView({ block: 'center' }); const r = ${byName('kit-especialidad')}.closest('label').getBoundingClientRect(); return { x: r.x + 200, y: r.y + 4 } })()`)
  await b.click(pad.x, pad.y)
  await sleep(100)
  expect('clic real en el padding superior de la fila: marca', await b.ev(`${byName('kit-especialidad')}.checked`), true)
  await b.tabTo(byName('kit-privacidad'))
  expect('foco en la casilla: anillo en la caja', await b.ev(`(() => { const s = getComputedStyle(document.activeElement.parentElement); return s.outlineStyle + ' ' + s.outlineWidth + ' desfase ' + s.outlineOffset + ' radio ' + s.borderTopLeftRadius })()`), 'solid 2px desfase 2px radio 6px')
  await b.space()
  await sleep(100)
  expect('Espacio marca; marcada con error: caja marcada, mensaje en rojo', await b.ev(`(() => { const i = ${byName('kit-privacidad')}; return { marcada: i.checked, caja: getComputedStyle(i.parentElement).backgroundColor, mensaje: getComputedStyle(i.closest('.c-checkbox').querySelector('p')).color } })()`), { marcada: true, caja: 'rgb(59, 87, 64)', mensaje: 'rgb(146, 38, 38)' })
  await b.shot('marcada-con-error.png', await b.rect(`${byName('kit-privacidad')}.closest('.c-checkbox')`, 8))
  await b.tabTo("document.querySelector('[name=\"kit-disponibilidad\"]:checked')")
  expect('foco en el radio: anillo en el círculo', await b.ev(`getComputedStyle(document.activeElement.parentElement).outlineStyle + ' radio ' + getComputedStyle(document.activeElement.parentElement).borderTopLeftRadius`), 'solid radio 999px')
  await b.arrowDown()
  await sleep(100)
  expect('flecha abajo: selecciona la siguiente', await b.ev(`document.activeElement.value + ' ' + document.activeElement.checked`), 'Hoy true')

  // --- Legend ----------------------------------------------------------------------------------
  const gaps = `[...document.querySelectorAll('.c-legend')].map((l) => l.textContent + ' ' + l.getBoundingClientRect().height + ' → ' + Math.round(l.nextElementSibling.getBoundingClientRect().top - l.getBoundingClientRect().bottom))`
  expect('Legend: alto y separación real con el contenido', await b.ev(gaps), ['Antes de confirmar 28 → 4', 'Disponibilidad 24 → 4', 'Elige fecha 28 → 16'])
  await b.style('.c-legend { float: none !important }')
  expect('contraprueba: legend sin float → el gap no la separa', await b.ev(gaps), ['Antes de confirmar 28 → 0', 'Disponibilidad 24 → 0', 'Elige fecha 28 → 0'])
  await b.unstyle()
  expect('D14: <legend><h3>', await b.ev(`[...document.querySelectorAll('.c-legend')].find((x) => x.querySelector('h3')).outerHTML.replace(/ class="[^"]*"/g, '')`), '<legend><h3>Elige fecha</h3></legend>')

  // --- forced-colors ---------------------------------------------------------------------------
  await b.metrics(1280, 900, 2)
  await b.forcedColors(true)
  await b.go('/kit')
  await b.tabTo(byName('kit-especialidad'))
  expect('forced-colors: check, caja marcada, punto, iconos y foco', await b.ev(`({
    check: getComputedStyle(${byName('kit-recordatorio')}.parentElement.querySelector('svg')).color,
    caja: getComputedStyle(${byName('kit-recordatorio')}.parentElement).backgroundColor + ' ' + getComputedStyle(${byName('kit-recordatorio')}.parentElement).borderTopColor,
    punto: getComputedStyle(document.querySelector('[name="kit-disponibilidad"]:checked').parentElement.querySelector('.c-radio__dot')).borderTopWidth,
    aviso: getComputedStyle(${byName('kit-correo-error')}.closest('.c-field').querySelector('.c-field__error-icon')).color,
    chevron: getComputedStyle(${byName('kit-motivo')}.closest('.c-field').querySelector('.c-field__adornments svg')).color,
    foco: getComputedStyle(document.activeElement.parentElement).outlineStyle,
  })`), { check: 'rgb(255, 255, 255)', caja: 'rgb(0, 0, 0) rgb(255, 255, 255)', punto: '6px', aviso: 'rgb(255, 255, 255)', chevron: 'rgb(255, 255, 255)', foco: 'solid' })
  await b.ev('document.activeElement.blur(), true')
  await b.shot('forced-casillas.png', await b.rect(`${byName('kit-privacidad')}.closest('fieldset')`, 8))
  await b.shot('forced-radios.png', await b.rect("document.querySelector('.c-radio').closest('fieldset')", 8))
  await b.shot('forced-selects.png', await b.rect(`${byName('kit-motivo')}.closest('.c-field').parentElement`, 8))
  await b.forcedColors(false)

  // --- 320 con las dos barras, al 100 % y al 200 % --------------------------------------------------
  for (const overlay of [false, true]) {
    const bar = overlay ? 'superpuesta' : 'clásica'
    await b.overlayScrollbars(overlay)
    await b.metrics(320, 900, 2)
    await b.go('/kit')
    expect(`320, barra ${bar}, 100 %: casillas y radios en su línea`, [...new Set(await b.ev(rows))], ['misma línea'])
    expect(`320, barra ${bar}, 100 %: sin scroll horizontal ni palabras partidas`, { overflow: await b.run(overflow), words: (await b.run(splitWords, '.c-field, .c-checkbox, .c-radio, .c-legend, .c-legend-help')).split }, { overflow: 0, words: [] })
    await b.run(text200)
    await sleep(300)
    expect(`320, barra ${bar}, 200 %: caja a 24 de su etiqueta y a 48 de la fila anterior`, await b.ev(rows), ['arriba 24', 'arriba 24/48', 'arriba 24/48', 'arriba 24', 'arriba 24/48', 'arriba 24/48', 'arriba 24/48'])
    expect(`320, barra ${bar}, 200 %: controles 98, sin scroll horizontal ni palabras partidas`, { controles: [...new Set(await b.ev(`[...document.querySelectorAll('.c-field__input, .c-field__select')].map((c) => c.getBoundingClientRect().height)`))], overflow: await b.run(overflow), words: (await b.run(splitWords, '.c-field, .c-checkbox, .c-radio, .c-legend, .c-legend-help')).split }, { controles: [98], overflow: 0, words: [] })
  }
  await b.overlayScrollbars(false)

  // --- Estáticas -------------------------------------------------------------------------------------
  expect(
    'tipos de FieldText: fallan type, inputMode, required y name; autoComplete mal escrito compila',
    typeErrorLines(`import FieldText from '../components/FieldText.tsx'
export const V = () => <FieldText label="Correo" name="correo" type="email" autoComplete="email" inputMode="email" required />
export const T = () => <FieldText label="Edad" name="edad" type="number" />
export const A = () => <FieldText label="Correo" name="correo" autoComplete="emali" />
export const I = () => <FieldText label="Tel" name="tel" inputMode="telefono" />
export const R = () => <FieldText label="Correo" name="correo" required="sí" />
export const N = () => <FieldText label="Correo" />
`),
    [3, 5, 6, 7],
  )
  expect('ESLint: autoComplete mal escrito en FieldText; el válido pasa', lintLines(`import FieldText from '../components/FieldText.tsx'
export const A = () => <FieldText label="Correo" name="correo" type="email" autoComplete="emali" />
export const B = () => <FieldText label="Correo" name="correo" type="email" autoComplete="email" />
`), ['2: jsx-a11y/autocomplete-valid'])
}
