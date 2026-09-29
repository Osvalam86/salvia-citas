// 7.0 Despliegue (D12): contra la URL de Netlify, nunca contra pnpm dev ni la
// preview (no leen public/_redirects ni netlify.toml).
//   VERIFY_BASE=https://salvia-citas.netlify.app pnpm verify 7.0
// Estado HTTP con fetch de Node (no solo el h1): rutas de D1 y /kit/* → 200;
// fuera de ellas → 404 con index.html, y la precisión de los comodines
// (/kit-x no casa con /kit/*). Coste declarado: los comodines dan 200 a un
// slug o id desconocido y a rutas más profundas inventadas. Caché inmutable
// solo en /assets/*. En el navegador: carga completa de cada ruta con su h1 y
// su título (D15) y ninguna petición a otro origen (D11).
import { ROUTES } from './5.0-transversal.mjs'

const BASE = process.env.VERIFY_BASE ?? ''
const RUIZ = '/especialistas/elena-ruiz-arellano'
const KIT = ['/kit', '/kit/layout', '/kit/navegacion', '/kit/resultados', '/kit/fecha-hora', '/kit/citas', '/kit/estados']
const D1 = ROUTES.map(([path]) => path).filter((path) => path !== '/no-existe')

const head = async (path) => {
  const r = await fetch(BASE + path, { redirect: 'manual' })
  const body = await r.text()
  return { status: r.status, type: r.headers.get('content-type')?.split(';')[0] ?? null, cache: r.headers.get('cache-control'), spa: body.includes('<div id="root">') }
}
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
  const missing = ['/no-existe', '/especialistas', '/citas', '/kit-x', '/mis-citasx', '/assets/no-existe.js']
  const notFound = Object.fromEntries(await Promise.all(missing.map(async (p) => [p, await head(p)])))
  expect(
    'fuera de las rutas por HTTP: 404 con index.html (el 404 de D1 lo pinta React Router); /kit-x y /mis-citasx no casan con los comodines',
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
    `caché de /assets/* (${assets.length} de index.html): 200 y public, max-age=31536000, immutable`,
    { hay: assets.length > 0, todos: assetHeads.every(([, r]) => r.status === 200 && r.cache === 'public, max-age=31536000, immutable') },
    { hay: true, todos: true },
  )
  const index = await head('/')
  const deep = served['/mis-citas']
  expect(
    'index.html (en / y por el fallback en /mis-citas) sin immutable ni max-age largo',
    [index.cache, deep.cache].map((c) => ({ immutable: /immutable/.test(c ?? ''), maxAgeLargo: /max-age=[1-9]/.test(c ?? '') })),
    [{ immutable: false, maxAgeLargo: false }, { immutable: false, maxAgeLargo: false }],
  )

  // --- Navegador: h1, título y origen de las peticiones ---------------------------------------------------------
  await b.metrics(1280, 900, 1)
  const origin = new URL(BASE).origin
  const loaded = {}
  const foreign = new Set()
  const pages = [...ROUTES.map(([path, h1, title]) => [path, h1, title]), ...KIT.map((p) => [p, null, null])]
  for (const [path] of pages) {
    await b.go(path)
    loaded[path] = await b.ev("({ h1: document.querySelector('main h1').textContent, title: document.title })")
    for (const u of await b.ev("[location.href, ...performance.getEntriesByType('resource').map((e) => e.name)]")) {
      if (!u.startsWith('data:') && new URL(u).origin !== origin) foreign.add(u)
    }
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
}
