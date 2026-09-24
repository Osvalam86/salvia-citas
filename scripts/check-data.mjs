// Aserciones de los datos simulados (DESIGN.md, D4 y D13). Falla si los datos
// dejan de cumplir los hechos declarados del diseño. Va encadenado en pnpm
// lint; importa el TS de src/data/ directamente (Node ≥ 22.18).
//
// node scripts/check-data.mjs --contrapruebas: aplica a una copia de los datos
// una mutación por aserción y exige que esa aserción falle. La ejecuta
// pnpm verify 5.0.
import { CalendarDate } from '@internationalized/date'
import { AVAILABILITY, CORTES_FULL_MAY, firstFree, isFull, nextOpeningMonth, weekday } from '../src/data/availability.ts'
import { NOW, TODAY } from '../src/data/clock.ts'
import { createAppointmentStore, RUIZ_APPOINTMENT_ID } from '../src/data/appointments.ts'
import { SLOW_MS, withScenario } from '../src/data/scenario.ts'
import { MODALITY_FILTERS, AVAILABILITY_WINDOWS, parseSearch, searchSpecialists, pageSlice } from '../src/data/search.ts'
import { FILTER_AREAS, GENERATED_CARDIOLOGY, NEIGHBORHOODS, SLUGS, SPECIALISTS } from '../src/data/specialists.ts'

const NOW_TIME = `${String(NOW.hour).padStart(2, '0')}:${String(NOW.minute).padStart(2, '0')}`
const day = (ctx, slug, iso) => ctx.availability[slug]?.[iso] ?? []
const free = (slots) => slots.filter((s) => s.available).map((s) => s.time)
const search = (ctx, query) => searchSpecialists(parseSearch(new URLSearchParams(query)), ctx)
const weeks = (year, month) => {
  const first = new CalendarDate(year, month, 1)
  return Math.ceil(((weekday(first) + 6) % 7 + first.calendar.getDaysInMonth(first)) / 7)
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Cada aserción devuelve true o un texto con lo que encontró.
const ASSERTIONS = {
  ruizFull: ['Ruiz: el 23 y el 29 de abril llenos', (ctx) => (isFull(day(ctx, SLUGS.ruiz, '2029-04-23')) && isFull(day(ctx, SLUGS.ruiz, '2029-04-29'))) || 'hay horas libres'],
  ruiz24: ['Ruiz: el 24 con 6 horas libres y la primera a las 10:30', (ctx) => {
    const f = free(day(ctx, SLUGS.ruiz, '2029-04-24'))
    return (f.length === 6 && f[0] === '10:30') || `${f.length} libres, primera ${f[0]}`
  }],
  cortesMay: ['Cortés: los días llenos de mayo son exactamente los de la lista', (ctx) => {
    const full = Object.entries(ctx.availability[SLUGS.cortes]).filter(([iso, slots]) => iso.startsWith('2029-05') && isFull(slots)).map(([iso]) => Number(iso.slice(8)))
    return same(full, CORTES_FULL_MAY) || `llenos: ${full.join(', ')}`
  }],
  cortes15: ['Cortés: el 15 de mayo con al menos una hora libre', (ctx) => free(day(ctx, SLUGS.cortes, '2029-05-15')).length > 0 || 'ninguna libre'],
  cortes17: ['Cortés: el 17 de mayo con 8 horas libres', (ctx) => free(day(ctx, SLUGS.cortes, '2029-05-17')).length === 8 || `${free(day(ctx, SLUGS.cortes, '2029-05-17')).length} libres`],
  cortes16: ['Cortés: el 16 de mayo a las 09:30 (su cita actual) ocupada', (ctx) => !free(day(ctx, SLUGS.cortes, '2029-05-16')).includes('09:30') || 'libre'],
  mariana: ['Primer hueco de Mariana: hoy a las 19:15', (ctx) => same(firstFree(SLUGS.mariana, ctx.availability), { date: '2029-04-23', time: '19:15' }) || JSON.stringify(firstFree(SLUGS.mariana, ctx.availability))],
  joaquin: ['Primer hueco de Joaquín: el 26 de abril a las 17:00', (ctx) => same(firstFree(SLUGS.joaquin, ctx.availability), { date: '2029-04-26', time: '17:00' }) || JSON.stringify(firstFree(SLUGS.joaquin, ctx.availability))],
  rodrigo: ['Rodrigo es Full con «mayo» (sin hueco hasta publishedUntil; su agenda siguiente abre en mayo)', (ctx) => {
    const rodrigo = ctx.specialists.find((s) => s.slug === SLUGS.rodrigo)
    return (firstFree(SLUGS.rodrigo, ctx.availability) === null && nextOpeningMonth(rodrigo).month === 5) || 'tiene hueco'
  }],
  weeks: ['Mayo tiene 5 semanas y abril 6 (de lunes a domingo)', () => (weeks(2029, 4) === 6 && weeks(2029, 5) === 5) || `abril ${weeks(2029, 4)}, mayo ${weeks(2029, 5)}`],
  noEmpty: ['Ningún día publicado es []', (ctx) => {
    const empty = Object.entries(ctx.availability).flatMap(([slug, days]) => Object.entries(days).filter(([, slots]) => slots.length === 0).map(([iso]) => `${slug} ${iso}`))
    return empty.length === 0 || empty.slice(0, 3).join(', ')
  }],
  noPast: ['Ninguna hora libre empieza en o antes de NOW', (ctx) => {
    const past = Object.entries(ctx.availability).filter(([, days]) => free(days[TODAY.toString()] ?? []).some((t) => t <= NOW_TIME)).map(([slug]) => slug)
    return past.length === 0 || past.join(', ')
  }],
  search011: ['La búsqueda de 01.1 da 34 y su primera página es la de Figma, en su orden', (ctx) => {
    const { total, results } = search(ctx, 'q=Cardiología&especialidad=cardiologia')
    const first = pageSlice(results, 1).map((s) => s.slug)
    return (total === 34 && same(first, [SLUGS.mariana, SLUGS.ruiz, SLUGS.joaquin, SLUGS.rodrigo])) || `${total} · ${first.join(', ')}`
  }],
  filters: ['Cada opción de cada filtro, sin consulta, da al menos un resultado', (ctx) => {
    const queries = [...FILTER_AREAS.map((a) => `especialidad=${a}`), ...MODALITY_FILTERS.map((m) => `modalidad=${m}`), ...AVAILABILITY_WINDOWS.map((w) => `disponibilidad=${w}`)]
    const empty = queries.filter((q) => search(ctx, q).total === 0)
    return empty.length === 0 || `0 en ${empty.join(', ')}`
  }],
  neighborhoods: ['Cada ubicación, sin consulta, da al menos un resultado', (ctx) => {
    const empty = NEIGHBORHOODS.filter((n) => search(ctx, `ubicacion=${n}`).total === 0)
    return empty.length === 0 || `0 en ${empty.join(', ')}`
  }],
  slugs: ['Slugs únicos', (ctx) => new Set(ctx.specialists.map((s) => s.slug)).size === ctx.specialists.length || 'hay repetidos'],
  ruizId: ['Reservar con Ruiz reemplaza su cita y reutiliza c1 (D13)', (ctx) => {
    const store = ctx.makeStore()
    const before = store.getSnapshot().length
    const result = store.book({ slug: SLUGS.ruiz, date: '2029-04-24', time: '11:00' })
    const ruiz = store.get(RUIZ_APPOINTMENT_ID)
    return (result.ok && result.id === 'c1' && store.getSnapshot().length === before && ruiz.time === '11:00') || JSON.stringify(result)
  }],
  opaqueId: ['Una reserva nueva lleva un id opaco del contador (c6)', (ctx) => {
    const store = ctx.makeStore()
    const result = store.book({ slug: SLUGS.mariana, date: '2029-04-23', time: '19:15' })
    return (result.ok && result.id === 'c6' && store.get('c6')?.slug === SLUGS.mariana) || JSON.stringify(result)
  }],
  mutations: ['cancel y reschedule cambian la cita', (ctx) => {
    const store = ctx.makeStore()
    store.cancel('c2')
    store.reschedule('c3', '2029-05-17', '17:00')
    const c2 = store.get('c2'), c3 = store.get('c3')
    return (c2.status === 'cancelled' && c3.date === '2029-05-17' && c3.time === '17:00') || JSON.stringify({ c2, c3 })
  }],
  notice: ['El aviso de reprogramada es de un solo uso', (ctx) => {
    const store = ctx.makeStore()
    store.reschedule('c3', '2029-05-17', '17:00')
    const first = store.takeNotice(), second = store.takeNotice()
    return (same(first, { kind: 'reprogramada', id: 'c3' }) && second === null) || JSON.stringify({ first, second })
  }],
  busy: ['?escenario=ocupada: la reserva falla y no toca el almacén', (ctx) => {
    const store = ctx.makeStore()
    const before = store.getSnapshot()
    const result = store.book({ slug: SLUGS.ruiz, date: '2029-04-24', time: '10:30' }, 'ocupada')
    return (!result.ok && store.getSnapshot() === before) || JSON.stringify(result)
  }],
  slow: ['?escenario=lenta tarda entre 1500 y 1700 ms', async (ctx) => {
    const start = performance.now()
    await ctx.withScenario('lenta', () => null)
    const ms = Math.round(performance.now() - start)
    return (ms >= SLOW_MS && ms < 1700) || `${ms} ms`
  }],
}

const base = () => ({
  specialists: SPECIALISTS,
  availability: structuredClone(AVAILABILITY),
  makeStore: () => createAppointmentStore(),
  withScenario,
})

// Mutaciones: una por aserción (salvo weeks, un hecho del calendario).
const setSlot = (ctx, slug, iso, time, available) => {
  const slot = ctx.availability[slug][iso].find((s) => s.time === time)
  slot.available = available
  return ctx
}
const wrapStore = (ctx, patch) => ({ ...ctx, makeStore: () => { const s = createAppointmentStore(); return { ...s, ...patch(s) } } })
const firstGeneratedCardiology = [...GENERATED_CARDIOLOGY][0]

const MUTATIONS = {
  ruizFull: ['liberar Ruiz 23 a las 10:00', (c) => setSlot(c, SLUGS.ruiz, '2029-04-23', '10:00', true)],
  ruiz24: ['ocupar Ruiz 24 a las 11:00', (c) => setSlot(c, SLUGS.ruiz, '2029-04-24', '11:00', false)],
  cortesMay: ['liberar Cortés 6 de mayo a las 09:00', (c) => setSlot(c, SLUGS.cortes, '2029-05-06', '09:00', true)],
  cortes15: ['ocupar todo Cortés 15 de mayo', (c) => { c.availability[SLUGS.cortes]['2029-05-15'].forEach((s) => (s.available = false)); return c }],
  cortes17: ['ocupar Cortés 17 de mayo a las 17:30', (c) => setSlot(c, SLUGS.cortes, '2029-05-17', '17:30', false)],
  cortes16: ['liberar Cortés 16 de mayo a las 09:30', (c) => setSlot(c, SLUGS.cortes, '2029-05-16', '09:30', true)],
  mariana: ['liberar Mariana hoy a las 18:15', (c) => setSlot(c, SLUGS.mariana, '2029-04-23', '18:15', true)],
  joaquin: ['liberar Joaquín el 25 a las 09:00', (c) => setSlot(c, SLUGS.joaquin, '2029-04-25', '09:00', true)],
  rodrigo: ['liberar Rodrigo el 30 a las 09:00', (c) => setSlot(c, SLUGS.rodrigo, '2029-04-30', '09:00', true)],
  noEmpty: ['dejar Ruiz 25 en []', (c) => { c.availability[SLUGS.ruiz]['2029-04-25'] = []; return c }],
  noPast: ['liberar Ruiz hoy a las 09:00', (c) => setSlot(c, SLUGS.ruiz, '2029-04-23', '09:00', true)],
  search011: ['un cardiólogo generado con hora libre hoy a las 10:00', (c) => setSlot(c, firstGeneratedCardiology, '2029-04-23', '10:00', true)],
  filters: ['todos a «Presencial» (Videoconsulta da 0)', (c) => ({ ...c, specialists: c.specialists.map((s) => ({ ...s, modality: 'presencial' })) })],
  neighborhoods: ['los de Nápoles pasan a Condesa', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.clinic === 'napoles' ? { ...s, clinic: 'condesa' } : s)) })],
  slugs: ['un slug repetido', (c) => ({ ...c, specialists: c.specialists.map((s, i) => (i === 9 ? { ...s, slug: c.specialists[8].slug } : s)) })],
  ruizId: ['reservar con Ruiz como un médico más', (c) => wrapStore(c, (s) => ({ book: (input, scenario) => s.book({ ...input, slug: 'otro' }, scenario) }))],
  opaqueId: ['id con fecha (<slug>-<fecha>)', (c) => wrapStore(c, () => ({ book: (input) => ({ ok: true, id: `${input.slug}-${input.date}` }) }))],
  mutations: ['cancel sin efecto', (c) => wrapStore(c, () => ({ cancel: () => {} }))],
  notice: ['el aviso no se consume', (c) => wrapStore(c, () => ({ takeNotice: () => ({ kind: 'reprogramada', id: 'c3' }) }))],
  busy: ['ocupada ignorado', (c) => wrapStore(c, (s) => ({ book: (input) => s.book(input) }))],
  slow: ['lenta sin retraso', (c) => ({ ...c, withScenario: async (_, run) => run() })],
}

const check = async (ctx, key) => {
  const result = await ASSERTIONS[key][1](ctx)
  return result === true ? true : String(result)
}

let failed = 0
if (process.argv.includes('--contrapruebas')) {
  for (const [key, [label, mutate]] of Object.entries(MUTATIONS)) {
    const result = await check(mutate(base()), key)
    const ok = result !== true
    if (!ok) failed++
    console.log(`${ok ? '✓' : '✗'} contraprueba «${label}» rompe «${ASSERTIONS[key][0]}»${ok ? `: ${result}` : ': sigue pasando'}`)
  }
  console.log('— weeks: sin mutación (hecho del calendario)')
} else {
  for (const key of Object.keys(ASSERTIONS)) {
    const result = await check(base(), key)
    if (result !== true) failed++
    console.log(`${result === true ? '✓' : '✗'} ${ASSERTIONS[key][0]}${result === true ? '' : `: ${result}`}`)
  }
}
process.exit(failed ? 1 : 0)
