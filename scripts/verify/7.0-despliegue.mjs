// 7.0 Despliegue (D12): contra la URL de Netlify, nunca contra pnpm dev ni la
// preview (no leen public/_redirects ni netlify.toml).
//   VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.0
// Estado HTTP con fetch de Node (no solo el h1): rutas de D1 y /kit/* → 200;
// fuera de ellas → 404 con index.html, y la precisión de los comodines
// (/kit-x no casa con /kit/*). Coste declarado: los comodines dan 200 a un
// slug o id desconocido y a rutas más profundas inventadas. Caché inmutable
// solo en /assets/*. En el navegador: carga completa de cada ruta con su h1 y
// su título (D15) y ninguna petición a otro origen (D11). 7.1: favicon, icono
// de Apple e imagen OG (200, su tipo y los mismos bytes que public/), los
// <link> de index.html y og:url y og:image absolutas y resolubles.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ROUTES } from './5.0-transversal.mjs'

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../public')
const SITE = 'https://salvia-citas.netlify.app'
const BASE = process.env.VERIFY_BASE ?? ''
const RUIZ = '/especialistas/elena-ruiz-arellano'
const KIT = ['/kit', '/kit/layout', '/kit/navegacion', '/kit/resultados', '/kit/fecha-hora', '/kit/citas', '/kit/estados']
const D1 = ROUTES.map(([path]) => path).filter((path) => path !== '/no-existe')

const head = async (path) => {
  const r = await fetch(BASE + path, { redirect: 'manual' })
  const body = await r.text()
  return { status: r.status, type: r.headers.get('content-type')?.split(';')[0] ?? null, cache: r.headers.get('cache-control'), spa: body.includes('<div id="root">') }
}
// Netlify normaliza Cache-Control sin espacios («public,max-age=…»): se comparan las directivas.
const directives = (cache) => (cache ?? '').split(',').map((d) => d.trim()).filter(Boolean).sort()
const statuses = async (paths) => Object.fromEntries(await Promise.all(paths.map(async (p) => [p, (await head(p)).status])))

export default async function run(b, expect) {
  if (!/\.netlify\.app$/.test(new URL(BASE || 'http://localhost').hostname)) {
    throw new Error('7.0 va contra Netlify: VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.0')
  }

  // --- Estado HTTP ---------------------------------------------------------------------------------------------
  const ok = [...D1, ...KIT]
  const served = Object.fromEntries(await Promise.all(ok.map(async (p) => [p, await head(p)])))
  expect(
    'rutas de D1 y /kit/* por HTTP: 200 con index.html (text/html)',
    Object.fromEntries(Object.entries(served).map(([p, r]) => [p, [r.status, r.type, r.spa]])),
    Object.fromEntries(ok.map((p) => [p, [200, 'text/html', true]])),
  )
  const missing = ['/no-existe', '/especialistas', '/especialistas/', '/citas', '/citas/', '/kit-x', '/mis-citasx', '/assets/no-existe.js']
  const notFound = Object.fromEntries(await Promise.all(missing.map(async (p) => [p, await head(p)])))
  expect(
    'fuera de las rutas por HTTP: 404 con index.html (el 404 de D1 lo pinta React Router); /especialistas y /citas, con y sin barra, por sus reglas antes de los comodines; /kit-x y /mis-citasx no casan con los comodines',
    Object.fromEntries(Object.entries(notFound).map(([p, r]) => [p, [r.status, r.type, r.spa]])),
    Object.fromEntries(missing.map((p) => [p, [404, 'text/html', true]])),
  )
  const wildcards = ['/especialistas/no-existe', '/citas/c99/confirmada', '/kit/a/b', '/citas/c1/x/y', '/mis-citas/c1/x/y', `${RUIZ}/x/y`]
  expect(
    'coste declarado (D12): los comodines dan 200 a un slug o id desconocido y a rutas más profundas inventadas',
    await statuses(wildcards),
    Object.fromEntries(wildcards.map((p) => [p, 200])),
  )

  // --- Caché ---------------------------------------------------------------------------------------------------
  const html = await (await fetch(BASE + '/')).text()
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
  const assetHeads = await Promise.all(assets.map(async (a) => [a, await head(a)]))
  expect(
    `caché de /assets/* (${assets.length} de index.html): 200 y las directivas public, max-age=31536000, immutable`,
    Object.fromEntries(assetHeads.map(([a, r]) => [a, [r.status, directives(r.cache)]])),
    Object.fromEntries(assets.map((a) => [a, [200, ['immutable', 'max-age=31536000', 'public']]])),
  )
  const index = await head('/')
  const deep = served['/mis-citas']
  expect(
    'index.html (en / y por el fallback en /mis-citas) sin immutable ni max-age largo',
    [index.cache, deep.cache].map((c) => ({ immutable: /immutable/.test(c ?? ''), maxAgeLargo: /max-age=[1-9]/.test(c ?? '') })),
    [{ immutable: false, maxAgeLargo: false }, { immutable: false, maxAgeLargo: false }],
  )

  // --- Favicon, icono de Apple e imagen OG (7.1) -----------------------------------------------------------
  // Con el fallback 404, un archivo que falta devuelve el HTML de la SPA: el tipo es lo que discrimina.
  const ICO = ['image/x-icon', 'image/vnd.microsoft.icon']
  const icons = [['/favicon.svg', 'image/svg+xml'], ['/favicon.ico', ICO], ['/apple-touch-icon.png', 'image/png'], ['/og-image.png', 'image/png']]
  const iconChecks = {}
  for (const [file, type] of icons) {
    const r = await fetch(BASE + file, { redirect: 'manual' })
    const bytes = Buffer.from(await r.arrayBuffer())
    const got = r.headers.get('content-type')?.split(';')[0] ?? null
    iconChecks[file] = { status: r.status, tipo: Array.isArray(type) ? type.includes(got) : got === type, igualQuePublic: bytes.equals(fs.readFileSync(path.join(PUBLIC, file))) }
    if (file === '/favicon.ico') console.log(`· dato: /favicon.ico se sirve como ${got}`)
  }
  expect(
    'favicon.svg, favicon.ico, apple-touch-icon.png y og-image.png: 200, su content-type y los mismos bytes que public/',
    iconChecks,
    Object.fromEntries(icons.map(([file]) => [file, { status: 200, tipo: true, igualQuePublic: true }])),
  )
  const missingIcon = await head('/favicon-no-existe.svg')
  expect('contraprueba: un icono que no existe da 404 y text/html (el fallback), no su tipo', [missingIcon.status, missingIcon.type], [404, 'text/html'])

  const attr = (re) => html.match(re)?.[1] ?? null
  const links = {
    icono: attr(/<link rel="icon" href="([^"]+)" sizes="32x32">/),
    svg: attr(/<link rel="icon" href="([^"]+)" type="image\/svg\+xml">/),
    apple: attr(/<link rel="apple-touch-icon" href="([^"]+)">/),
  }
  expect('<link> de index.html servido: favicon.ico (32x32), favicon.svg y apple-touch-icon.png', links, { icono: '/favicon.ico', svg: '/favicon.svg', apple: '/apple-touch-icon.png' })

  // Todas las <meta> con name o property del index.html servido, frente al texto aprobado en 7.1.
  const metas = Object.fromEntries([...html.matchAll(/<meta (?:name|property)="([^"]+)" content="([^"]*)"/g)].map((m) => [m[1], m[2]]))
  expect('<meta> de index.html servido: la del viewport y exactamente las aprobadas en 7.1, con su texto', metas, {
    viewport: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
    description: 'Caso de estudio de maquetación y accesibilidad WCAG 2.2 AA: una plataforma para agendar citas con especialistas médicos.',
    author: 'Osvaldo Ocampo',
    'og:type': 'website',
    'og:site_name': 'Salvia',
    'og:locale': 'es_MX',
    'og:title': 'Salvia · Plataforma de citas médicas',
    'og:description': 'Caso de estudio de maquetación y accesibilidad WCAG 2.2 AA: una plataforma para agendar citas con especialistas médicos.',
    'og:url': `${SITE}/`,
    'og:image': `${SITE}/og-image.png`,
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': 'Portada de Salvia, plataforma de citas médicas: el selector de fecha y hora del perfil de la Dra. Elena Ruiz en escritorio y en móvil, con el martes 24 de abril a las 10:30 seleccionado. Osvaldo Ocampo · Maquetación BEMIT y accesibilidad WCAG 2.2 AA.',
    'twitter:card': 'summary_large_image',
  })
  const og = await fetch(metas['og:image'] ?? 'about:blank').then(async (r) => {
    const bytes = Buffer.from(await r.arrayBuffer())
    return { status: r.status, tipo: r.headers.get('content-type')?.split(';')[0], tamano: [bytes.readUInt32BE(16), bytes.readUInt32BE(20)] }
  }).catch((e) => ({ error: e.message }))
  expect('og:image resuelve: 200, image/png y 1200 × 630 (los de og:image:type, width y height)', og, { status: 200, tipo: 'image/png', tamano: [1200, 630] })

  // --- Navegador: h1, título, origen de las peticiones y nada ajeno a la app -----------------------------------
  await b.metrics(1280, 900, 1)
  const origin = new URL(BASE).origin
  const loaded = {}
  const foreign = new Set()
  const outside = {}
  const hud = {}
  const pages = [...ROUTES.map(([path, h1, title]) => [path, h1, title]), ...KIT.map((p) => [p, null, null])]
  for (const [path] of pages) {
    await b.go(path)
    loaded[path] = await b.ev("({ h1: document.querySelector('main h1').textContent, title: document.title })")
    for (const u of await b.ev("[location.href, ...performance.getEntriesByType('resource').map((e) => e.name)]")) {
      if (!u.startsWith('data:') && new URL(u).origin !== origin) foreign.add(u)
    }
    const found = await b.ev(OUTSIDE)
    if (found.length) outside[path] = found
    if (await b.ev(`Boolean(document.querySelector('script[src*="/.netlify/scripts/hud"]'))`)) hud[path] = true
  }
  expect(
    'carga completa de cada ruta (1280): h1 y título de D15 (catálogo: «Kit del sistema · Salvia» y «{h1} · Kit · Salvia»)',
    loaded,
    Object.fromEntries(pages.map(([path, h1, title]) => {
      if (h1) return [path, { h1, title }]
      const got = loaded[path].h1
      return [path, { h1: got, title: path === '/kit' ? 'Kit del sistema · Salvia' : `${got} · Kit · Salvia` }]
    })),
  )
  expect('ninguna petición a otro origen en esas cargas (D11: fuentes alojadas)', [...foreign], [])
  expect(
    'nada fuera de #root y del <head> con caja ni con tabIndex ≥ 0 en esas cargas (contraprueba manual: el badge de Netlify activo, iframe 197 × 64 en 178,748 a 375 con tabIndex 0)',
    outside,
    {},
  )

  // «Continuar» de la Booking Bar a 375 (02.1): lo que hay en su centro es el botón.
  await b.metrics(375, 812, 1)
  await b.go(`${RUIZ}?fecha=2029-04-24&hora=10:30`)
  expect(
    '«Continuar» de la Booking Bar a 375: elementFromPoint en su centro devuelve el botón (con el badge activo, IFRAME)',
    await b.ev(`(() => { const btn = document.querySelector('.c-booking-bar button[type="submit"]'); const r = btn.getBoundingClientRect(); const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { texto: btn.textContent, golpe: hit.closest('button') === btn ? 'BUTTON' : hit.tagName } })()`),
    { texto: 'Continuar', golpe: 'BUTTON' },
  )

  // Datos, sin criterio de paso: lo que Netlify inyecta.
  console.log(`· dato: script /.netlify/scripts/hud en ${Object.keys(hud).length} de ${pages.length} cargas`)
  console.log(`· dato: comentario «hosted on Netlify» en el <head> servido: ${html.includes('hosted on Netlify') ? 'sí' : 'no'}`)
}

// Elementos fuera de #root y del <head> (lo que inyecte el alojamiento) con caja o enfocables por Tab.
const OUTSIDE = `(() => {
  const root = document.getElementById('root')
  return [...document.querySelectorAll('body *, html > :not(head):not(body)')]
    .filter((e) => !root.contains(e) && e !== root && !e.closest('head'))
    .map((e) => { const r = e.getBoundingClientRect(); return { tag: e.tagName, caja: [Math.round(r.width), Math.round(r.height)], tabIndex: e.tabIndex, pos: [Math.round(r.x), Math.round(r.y)] } })
    .filter((e) => e.caja[0] * e.caja[1] > 0 || e.tabIndex >= 0)
})()`
