// Navegación en cliente con clic real (el arnés, con `go`, siempre carga
// completa). Llega a `to` desde `from` pulsando el enlace `link`, baja al final
// con la rueda y compara el viewport, píxel a píxel, con el de `to` recargada.
// Lo usan 4.6 y las vistas (fase 5): docs/verificacion.md, resto de pintado.
import { sleep } from './cdp.mjs'

// Píxeles distintos entre dos capturas, no bytes: dos PNG del mismo viewport
// pueden codificarse distinto.
export const pixelDiff = (a, c) => `(async () => {
  const load = (d) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + d })
  const px = (img) => { const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data }
  const images = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(c)})])
  const w = images[0].width, [p, q] = images.map(px)
  let n = 0, x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1
  for (let i = 0; i < p.length; i += 4) {
    if (p[i] === q[i] && p[i + 1] === q[i + 1] && p[i + 2] === q[i + 2]) continue
    n++
    const k = i / 4, x = k % w, y = Math.floor(k / w)
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  return n === 0 ? 0 : n + ' en ' + [x0, y0, x1, y1].join(',')
})()`

// Umbral del resto de pintado (cierre de la fase 5): un píxel es resto si su
// delta máximo por canal frente a la recarga pasa de 64, en cualquier punto de
// la página (también sobre una foto). Medido: el remuestreo de una foto ya
// decodificada en la página de origen llega a 39 (V1b, 01.1) y 33 (V2b, 02.4)
// y no tiene ningún píxel por encima de 64; el resto real de 4.6 (avatares de
// /kit bajo la última Booking Bar) llega a 230, con 12632 píxeles por encima.
// Mecanismo probado en V2b: con la foto bloqueada en el origen, 0 de 5.
export const REST_DELTA = 64

// Píxeles distintos, píxeles con delta > REST_DELTA y delta máximo por canal.
export const pixelDelta = (a, c) => `(async () => {
  const load = (d) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + d })
  const px = (img) => { const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, img.width, img.height).data }
  const images = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(c)})])
  const [p, q] = images.map(px)
  let distintos = 0, sobre = 0, deltaMax = 0
  for (let i = 0; i < p.length; i += 4) {
    const d = Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2]))
    if (!d) continue
    distintos++
    if (d > ${REST_DELTA}) sobre++
    deltaMax = Math.max(deltaMax, d)
  }
  return { distintos, sobre64: sobre, deltaMax }
})()`

// Lo que comparan las vistas: sin resto al llegar ni 4 s después. El
// remuestreo (delta ≤ 64) no cuenta, pero se informa en la etiqueta.
export const viewRest = ({ ruta, sinRecarga, estado, delta, deltaCuatroSegundos }) => ({ ruta, sinRecarga, estado, sobre64: delta.sobre64, cuatroSegundosSobre64: deltaCuatroSegundos.sobre64 })
export const resampleNote = ({ delta }) => `remuestreo con delta ≤ 64: ${delta.distintos - delta.sobre64} px, delta máx. ${delta.deltaMax}`

export const viewport = async (b) => (await b.send('Page.captureScreenshot', { format: 'png' })).data

// La rueda va al centro del viewport: fuera de él (un x fijo a 375) el evento
// no desplaza la página.
export const toBottom = async (b) => {
  const x = Math.floor((await b.ev('innerWidth')) / 2)
  for (let i = 0; i < 20; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y: 400, deltaX: 0, deltaY: 400 })
  await sleep(600)
}

// Puntero a la esquina (el margen del shell, sin hover): tras el clic se queda
// donde se pulsó y, al bajar con la rueda, Chromium deja :hover en lo que pasó
// por debajo (V1a: la casilla «Videoconsulta» del aside, 188 px distintos de la
// recarga, donde el puntero no se ha movido).
const parkPointer = async (b) => {
  await b.mouse('mouseMoved', 1, 1)
  await sleep(100)
}

/**
 * Devuelve el estado a la llegada (`state`, una expresión opcional evaluada en
 * la página), si hubo carga completa, y los píxeles distintos de la recarga
 * justo al bajar y 4 s después (para separar un retraso de pintado de un resto
 * persistente). Deja la página en `to` recargada y al final. Con `park`, el
 * puntero va a la esquina antes de cada captura (las vistas con hover al
 * final de la página); 4.6 no lo usa, para no cambiar la reproducción del
 * resto de pintado. `selector` elige entre qué elementos se busca `link`: un
 * envío que navega es un botón (V2b: «Continuar» de la Booking Bar lleva a
 * /confirmar). `prepare(b)` actúa sobre el origen ya cargado, antes de buscar
 * el enlace.
 */
export async function clientNavigation(b, { from, link, to, state = 'null', park = false, selector = 'a', prepare = null }) {
  await b.go(from)
  // Estado del origen antes del clic (cierre de la fase 5): 4.6 baja /kit con
  // la rueda, la condición en la que aparece el resto de pintado.
  if (prepare) await prepare(b)
  const { x, y } = await b.ev(`(() => { const a = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => e.textContent === ${JSON.stringify(link)}); a.scrollIntoView({ block: 'center' }); const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 } })()`)
  await b.click(x, y)
  // Con search: el destino puede llevar consulta (5.1, /kit/estados → /?q=…).
  for (let i = 0; i < 50 && (await b.ev('location.pathname + location.search')) !== to; i++) await sleep(100)
  await b.ev('document.fonts.ready.then(() => true)')
  await sleep(400)
  await toBottom(b)
  if (park) await parkPointer(b)
  const arrival = await b.ev(`({ ruta: location.pathname + location.search, sinRecarga: performance.getEntriesByType('navigation')[0].name.endsWith(${JSON.stringify(from)}), estado: ${state} })`)
  const afterClient = await viewport(b)
  await sleep(4000)
  const later = await viewport(b)
  await b.go(to)
  await toBottom(b)
  if (park) await parkPointer(b)
  const afterReload = await viewport(b)
  return {
    ...arrival,
    pixelesDistintosDeLaRecarga: await b.ev(pixelDiff(afterClient, afterReload)),
    cuatroSegundosDespues: await b.ev(pixelDiff(later, afterReload)),
    delta: await b.ev(pixelDelta(afterClient, afterReload)),
    deltaCuatroSegundos: await b.ev(pixelDelta(later, afterReload)),
    afterClient,
    afterReload,
  }
}
