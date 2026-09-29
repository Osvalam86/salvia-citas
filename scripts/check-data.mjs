// Aserciones de los datos simulados (DESIGN.md, D4, D13, D16, D17 y V4a). Falla si los datos
// dejan de cumplir los hechos declarados del diseño. Va encadenado en pnpm
// lint; importa el TS de src/data/ directamente (Node ≥ 22.18).
//
// node scripts/check-data.mjs --contrapruebas: aplica a una copia de los datos
// una mutación por aserción y exige que esa aserción falle. La ejecuta
// pnpm verify 5.0.
import { CalendarDate, parseDate } from '@internationalized/date'
import { AVAILABILITY, CORTES_FULL_MAY, firstFree, initialDate, isFull, nextFreeAfter, nextOpeningMonth, rescheduleStartDate, weekday } from '../src/data/availability.ts'
import { NOW, TODAY } from '../src/data/clock.ts'
import { cancelCopy, contactOf, createAppointmentStore, groupAppointments, rescheduleCopy, RUIZ_APPOINTMENT_ID, upcomingText } from '../src/data/appointments.ts'
import { nextStepsText } from '../src/data/booking.ts'
import { calendarFile } from '../src/data/calendar.ts'
import { createNotifyStore } from '../src/data/notify.ts'
import { createPatientStore, initialDraft, submitBooking, validatePatient } from '../src/data/patient.ts'
import { SESSION } from '../src/data/session.ts'
import { SLOW_MS, withScenario } from '../src/data/scenario.ts'
import { MODALITY_FILTERS, AVAILABILITY_WINDOWS, emptyCause, parseSearch, searchSpecialists, pageSlice } from '../src/data/search.ts'
import { AREAS, CLINICS, FILTER_AREAS, GENERATED_CARDIOLOGY, NEIGHBORHOODS, SLUGS, SPECIALISTS, shortName } from '../src/data/specialists.ts'

const NOW_TIME = `${String(NOW.hour).padStart(2, '0')}:${String(NOW.minute).padStart(2, '0')}`
const day = (ctx, slug, iso) => ctx.availability[slug]?.[iso] ?? []
const free = (slots) => slots.filter((s) => s.available).map((s) => s.time)
const search = (ctx, query) => searchSpecialists(parseSearch(new URLSearchParams(query)), ctx)
const weeks = (year, month) => {
  const first = new CalendarDate(year, month, 1)
  return Math.ceil(((weekday(first) + 6) % 7 + first.calendar.getDaysInMonth(first)) / 7)
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
// La reprogramación de Figma (02.7, 02.8): c3 del 16 de mayo a las 09:30 al 17 a las 17:00.
const C3_NOW = { date: '2029-05-16', time: '09:30' }
const C3_NEXT = { date: '2029-05-17', time: '17:00' }
const c3Copy = (ctx) => ctx.rescheduleCopy(C3_NOW, C3_NEXT)
// Un ejemplo de vacío de /kit/estados: 0 resultados y la causa que su copy nombra.
const emptyExample = (ctx, query, cause) => {
  const params = parseSearch(new URLSearchParams(query))
  const total = searchSpecialists(params, ctx).total
  const found = total === 0 ? emptyCause(params, ctx) : null
  return (total === 0 && found === cause) || `${total} ${total === 1 ? 'resultado' : 'resultados'}${found ? `, causa ${found}` : ''}`
}

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
  emptyQuery: ['Vacío por consulta (01.3, D8): «Neurocirugía pediátrica» da 0 en toda la ciudad', (ctx) => emptyExample(ctx, 'q=Neurocirugía pediátrica', 'consulta')],
  emptyNeighborhood: ['Vacío por colonia: «Dermatología» da resultados en la ciudad y 0 en Polanco', (ctx) => emptyExample(ctx, 'q=Dermatología&ubicacion=polanco', 'colonia')],
  emptyFilters: ['Vacío por filtros: «Cardiología» da resultados y con Especialidad = Dermatología, 0', (ctx) => emptyExample(ctx, 'q=Cardiología&especialidad=dermatologia', 'filtros')],
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
  initialRuiz: ['Selector de Ruiz sin parámetros (D2): empieza el 24', (ctx) => initialDate(SLUGS.ruiz, ctx.availability).toString() === '2029-04-24' || initialDate(SLUGS.ruiz, ctx.availability).toString()],
  nextFreeRuiz: ['Sin horarios de Ruiz el 23: el hueco más cercano es el 24 a las 10:30', (ctx) => {
    const next = nextFreeAfter(SLUGS.ruiz, TODAY, ctx.availability)
    return (next?.date.toString() === '2029-04-24' && next.time === '10:30') || JSON.stringify(next && { date: next.date.toString(), time: next.time })
  }],
  rodrigoNoNext: ['Rodrigo: sin hueco más cercano y su selector empieza hoy', (ctx) => {
    const next = nextFreeAfter(SLUGS.rodrigo, TODAY.subtract({ days: 1 }), ctx.availability)
    const start = initialDate(SLUGS.rodrigo, ctx.availability)
    return (next === null && start.compare(TODAY) === 0) || JSON.stringify({ next: next && `${next.date} ${next.time}`, start: start.toString() })
  }],
  shortNames: ['Nombres cortos: Dra. Ruiz, Dr. Molina, Dr. Cortés, Dr. Ibarra, Dra. Serrano', (ctx) => {
    const names = [SLUGS.ruiz, SLUGS.molina, SLUGS.cortes, SLUGS.ibarra, SLUGS.serrano].map((slug) => shortName(ctx.specialists.find((s) => s.slug === slug)))
    return same(names, ['Dra. Ruiz', 'Dr. Molina', 'Dr. Cortés', 'Dr. Ibarra', 'Dra. Serrano']) || names.join(', ')
  }],
  ruizSummary: ['Resumen de 02.4: Dra. Ruiz, Cardiología, Clínica Roma Norte, Av. Álvaro Obregón 123, Roma Norte', (ctx) => {
    const ruiz = ctx.specialists.find((s) => s.slug === SLUGS.ruiz)
    const clinic = ctx.clinics[ruiz.clinic]
    const found = [shortName(ruiz), AREAS[ruiz.area], clinic.name, clinic.address]
    return same(found, ['Dra. Ruiz', 'Cardiología', 'Clínica Roma Norte', 'Av. Álvaro Obregón 123, Roma Norte']) || found.join(' · ')
  }],
  nameShape: ['Todo nombre lleva tratamiento, nombre de pila y dos apellidos (shortName)', (ctx) => {
    const bad = ctx.specialists.filter((s) => !/^Dra?\. /.test(s.name) || s.name.split(' ').length < 4).map((s) => s.name)
    return bad.length === 0 || bad.join(', ')
  }],
  notifyEmpty: ['Avisos (D16): el almacén empieza vacío', (ctx) => ctx.makeNotify().getSnapshot().size === 0 || `${ctx.makeNotify().getSnapshot().size} pedidos`],
  notifyToggle: ['Avisos: conmutar dos veces vuelve al estado inicial', (ctx) => {
    const store = ctx.makeNotify()
    store.toggle(SLUGS.rodrigo)
    const on = store.has(SLUGS.rodrigo)
    store.toggle(SLUGS.rodrigo)
    return (on && !store.has(SLUGS.rodrigo)) || JSON.stringify({ on, off: !store.has(SLUGS.rodrigo) })
  }],
  notifyPerSpecialist: ['Avisos: conmutar un médico no toca a otro', (ctx) => {
    const store = ctx.makeNotify()
    store.toggle(SLUGS.rodrigo)
    return (store.has(SLUGS.rodrigo) && !store.has(SLUGS.ruiz) && store.getSnapshot().size === 1) || [...store.getSnapshot()].join(', ')
  }],
  session: ['Sesión (§6): Karla Sánchez Bautista, «Karla Sánchez» en el header, karla.sanchez@ejemplo.com', (ctx) =>
    same(ctx.session, { fullName: 'Karla Sánchez Bautista', shortName: 'Karla Sánchez', email: 'karla.sanchez@ejemplo.com' }) || JSON.stringify(ctx.session)],
  errorScenario: ['Errores de 03.2: correo «karla@», motivo sin elegir y aviso sin marcar dan 3 errores, en el orden del DOM', (ctx) => {
    const fields = ctx.validate({ ...initialDraft(), email: 'karla@' }).map((e) => e.field)
    return same(fields, ['correo', 'motivo', 'privacidad']) || fields.join(', ')
  }],
  validScenario: ['Envío de 03.5: motivo «Primera consulta» y las dos casillas marcadas no dan errores', (ctx) => {
    const errors = ctx.validate({ ...initialDraft(), reason: 'Primera consulta', privacy: true, reminder: true })
    return errors.length === 0 || errors.map((e) => e.field).join(', ')
  }],
  phone: ['Teléfono opcional: vacío y «55 1234 5678» valen; «5512» falla', (ctx) => {
    const fails = (phone) => ctx.validate({ ...initialDraft(), phone }).some((e) => e.field === 'telefono')
    return (!fails('') && !fails('55 1234 5678') && fails('5512')) || JSON.stringify({ vacio: fails(''), ejemplo: fails('55 1234 5678'), corto: fails('5512') })
  }],
  draftInitial: ['Borrador (D17): nace de la sesión, con teléfono, motivo y casillas vacíos', (ctx) =>
    same(ctx.makePatient().getSnapshot(), { name: 'Karla Sánchez Bautista', email: 'karla.sanchez@ejemplo.com', phone: '', reason: '', privacy: false, reminder: false }) || JSON.stringify(ctx.makePatient().getSnapshot())],
  draftResetOnBooking: ['Borrador: una reserva correcta lo reinicia (submitBooking)', (ctx) => {
    const patient = ctx.makePatient()
    patient.update({ reason: 'Primera consulta', privacy: true })
    const result = ctx.submit({ slug: SLUGS.ruiz, date: '2029-04-24', time: '10:30' }, null, { appointments: ctx.makeStore(), patient })
    return (result.ok && same(patient.getSnapshot(), initialDraft())) || JSON.stringify({ result, draft: patient.getSnapshot() })
  }],
  draftKeptWhenBusy: ['Borrador: con ?escenario=ocupada la reserva falla y se conserva', (ctx) => {
    const patient = ctx.makePatient()
    patient.update({ reason: 'Primera consulta', privacy: true })
    const kept = patient.getSnapshot()
    const result = ctx.submit({ slug: SLUGS.ruiz, date: '2029-04-24', time: '10:30' }, 'ocupada', { appointments: ctx.makeStore(), patient })
    return (!result.ok && patient.getSnapshot() === kept) || JSON.stringify({ result, draft: patient.getSnapshot() })
  }],
  contactStored: ['Una reserva guarda el correo y el recordatorio del borrador (04.1)', (ctx) => {
    const appointments = ctx.makeStore()
    const patient = ctx.makePatient()
    patient.update({ email: ' otra@ejemplo.com ', reminder: true })
    const result = ctx.submit({ slug: SLUGS.mariana, date: '2029-04-23', time: '19:15' }, null, { appointments, patient })
    const contact = result.ok && appointments.get(result.id)?.contact
    return same(contact, { email: 'otra@ejemplo.com', reminder: true }) || JSON.stringify(contact)
  }],
  contactFallback: ['La c1 sembrada, sin contacto, usa la sesión y el recordatorio pedido', (ctx) => {
    const found = ctx.contactOf(ctx.makeStore().get(RUIZ_APPOINTMENT_ID))
    return same(found, { email: 'karla.sanchez@ejemplo.com', reminder: true }) || JSON.stringify(found)
  }],
  groups: ['Mis citas: Próximas ascendente y Pasadas descendente con las canceladas; tras cancelar c2, el orden de 04.8', (ctx) => {
    const store = ctx.makeStore()
    const ids = () => { const g = ctx.group(store.getSnapshot()); return [g.upcoming.map((a) => a.id), g.past.map((a) => a.id)] }
    const before = ids()
    store.cancel('c2')
    const after = ids()
    return (same(before, [['c1', 'c2', 'c3'], ['c4', 'c5']]) && same(after, [['c1', 'c3'], ['c2', 'c4', 'c5']])) || JSON.stringify({ before, after })
  }],
  upcomingText: ['Subtítulo: «Tienes 3 citas próximas», «Tienes 1 cita próxima», «No tienes citas próximas»', (ctx) => {
    const found = [3, 1, 0].map(ctx.upcomingText)
    return same(found, ['Tienes 3 citas próximas', 'Tienes 1 cita próxima', 'No tienes citas próximas']) || found.join(' · ')
  }],
  cancelCopy: ['Copy de cancelar: Molina, el literal de Figma (04.3, 04.8); Ruiz, el mismo patrón con «la Dra.»', (ctx) => {
    const find = (slug) => ctx.specialists.find((s) => s.slug === slug)
    const molina = ctx.cancelCopy({ date: '2029-05-08', time: '17:00' }, find(SLUGS.molina))
    const ruiz = ctx.cancelCopy({ date: '2029-04-24', time: '10:30' }, find(SLUGS.ruiz))
    return same([molina, ruiz], [
      { dialog: 'Martes 8 de mayo, 17:00, con el Dr. Andrés Molina Paz. Esta acción no se puede deshacer.', notice: 'Ya no tienes la cita del martes 8 de mayo a las 17:00 con el Dr. Molina.' },
      { dialog: 'Martes 24 de abril, 10:30, con la Dra. Elena Ruiz Arellano. Esta acción no se puede deshacer.', notice: 'Ya no tienes la cita del martes 24 de abril a las 10:30 con la Dra. Ruiz.' },
    ]) || JSON.stringify([molina, ruiz])
  }],
  nextStepsReminder: ['«Qué sigue»: c1 (25,5 h) con recordatorio da el copy de Figma; sin él, la política sin la promesa', (ctx) => {
    const c1 = { date: '2029-04-24', time: '10:30' }
    const found = [true, false].map((reminder) => ctx.nextSteps({ ...c1, contact: { email: '', reminder } }).split('.')[0])
    return same(found, ['Te enviaremos un recordatorio por correo 24 horas antes', 'Puedes cancelar o reprogramar sin costo desde Mis\u00a0citas hasta 24 horas antes']) || found.join(' · ')
  }],
  nextStepsWindow: ['«Qué sigue»: Mariana hoy a las 19:15 no promete nada; a 24 h justas de NOW, sí (≥ 24 h)', (ctx) => {
    const contact = { email: '', reminder: true }
    const today = ctx.nextSteps({ date: '2029-04-23', time: '19:15', contact }).split('.')[0]
    const edge = ctx.nextSteps({ date: '2029-04-24', time: '09:00', contact }).split('.')[0]
    return (today === 'Puedes gestionar tu cita desde Mis\u00a0citas' && edge === 'Te enviaremos un recordatorio por correo 24 horas antes') || JSON.stringify({ today, edge })
  }],
  rescheduleStart: ['Reprogramar sin parámetros (D2): c3 (16 de mayo) empieza el 15; c1 (24 de abril), el 24', (ctx) => {
    const found = [['2029-05-16', SLUGS.cortes], ['2029-04-24', SLUGS.ruiz]].map(([date, slug]) => rescheduleStartDate(slug, parseDate(date), ctx.availability).toString())
    return same(found, ['2029-05-15', '2029-04-24']) || found.join(' · ')
  }],
  // Copy de reprogramar c3 (16 de mayo, 09:30 → 17 de mayo, 17:00): los cinco literales leídos
  // por MCP en Figma (V4b), una aserción por literal para que cada uno falle por separado.
  rescheduleCurrent: ['Placa «Tu cita actual» de c3, literal de Figma (02.7, I374:7459;371:7347)', (ctx) =>
    c3Copy(ctx).current === 'Miércoles 16 de mayo · 09:30. Al confirmar, esa hora se libera.' || c3Copy(ctx).current],
  rescheduleWhen: ['«Nueva cita» de c3, literal de Figma (02.8, 357:6871)', (ctx) =>
    c3Copy(ctx).when === 'Jueves 17 de mayo, 17:00' || c3Copy(ctx).when],
  reschedulePrevious: ['«Antes:» de c3, literal de Figma (02.8, 357:7295)', (ctx) =>
    c3Copy(ctx).previous === 'Antes: miércoles 16 de mayo, 09:30' || c3Copy(ctx).previous],
  reschedulePolicy: ['«Al confirmar» de c3, literal de Figma (02.8, I376:7520;371:7347)', (ctx) =>
    c3Copy(ctx).policy === 'Se libera el miércoles 16 de mayo a las 09:30 y tu cita pasa al jueves 17. Puedes volver a cambiarla hasta 24 horas antes.' || c3Copy(ctx).policy],
  rescheduleNotice: ['Aviso «Cita reprogramada» de c3, literal de Figma (descripción de UI/Notice 334:8516; diseño §7.2)', (ctx) =>
    c3Copy(ctx).notice === 'Tu cita pasó al jueves 17 de mayo, 17:00.' || c3Copy(ctx).notice],
  rescheduleNoTime: ['Reprogramar sin hora: «Al confirmar» no nombra el día nuevo, «Nueva cita» dice «Sin horario elegido» y no hay aviso', (ctx) => {
    const found = ctx.rescheduleCopy({ date: '2029-05-16', time: '09:30' }, { date: '2029-05-20', time: null })
    return same([found.policy, found.when, found.notice], [
      'Al confirmar la nueva hora, se libera la del miércoles 16 de mayo a las 09:30. Puedes volver a cambiarla hasta 24 horas antes.',
      'Sin horario elegido',
      null,
    ]) || JSON.stringify(found)
  }],
  rescheduleWindow: ['Reprogramar a menos de 24 h (hoy a las 16:30) omite «Puedes volver a cambiarla…»; a 24 h justas de NOW la conserva (≥ 24 h)', (ctx) => {
    const current = { date: '2029-05-16', time: '09:30' }
    const today = ctx.rescheduleCopy(current, { date: '2029-04-23', time: '16:30' }).policy
    const edge = ctx.rescheduleCopy(current, { date: '2029-04-24', time: '09:00' }).policy
    return (today === 'Se libera el miércoles 16 de mayo a las 09:30 y tu cita pasa al lunes 23 de abril.' && edge.endsWith('Puedes volver a cambiarla hasta 24 horas antes.')) || JSON.stringify({ today, edge })
  }],
  ics: ['.ics de c1: 10:30 de Ciudad de México = 16:30Z, 30 min, CRLF y líneas de 75 octetos como mucho', (ctx) => {
    const file = ctx.ics({ id: 'c1', date: '2029-04-24', time: '10:30' }, ctx.specialists.find((s) => s.slug === SLUGS.ruiz))
    const lines = file.split('\r\n')
    const long = lines.filter((l) => new TextEncoder().encode(l).length > 75)
    const ok = lines.includes('DTSTART:20290424T163000Z') && lines.includes('DTEND:20290424T170000Z') && lines.includes('DTSTAMP:20290423T150000Z') && !/[^\r]\n/.test(file) && file.endsWith('\r\n') && long.length === 0
    return ok || JSON.stringify(lines)
  }],
}

const base = () => ({
  specialists: SPECIALISTS,
  clinics: CLINICS,
  availability: structuredClone(AVAILABILITY),
  makeStore: () => createAppointmentStore(),
  makeNotify: () => createNotifyStore(),
  makePatient: () => createPatientStore(),
  session: SESSION,
  validate: validatePatient,
  submit: submitBooking,
  withScenario,
  contactOf,
  group: groupAppointments,
  upcomingText,
  cancelCopy,
  nextSteps: nextStepsText,
  rescheduleCopy,
  ics: calendarFile,
})

// Mutaciones: una por aserción (salvo weeks, un hecho del calendario).
const setSlot = (ctx, slug, iso, time, available) => {
  const slot = ctx.availability[slug][iso].find((s) => s.time === time)
  slot.available = available
  return ctx
}
const wrapStore = (ctx, patch) => ({ ...ctx, makeStore: () => { const s = createAppointmentStore(); return { ...s, ...patch(s) } } })
const wrapNotify = (ctx, patch) => ({ ...ctx, makeNotify: () => { const s = createNotifyStore(); return { ...s, ...patch(s) } } })
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
  emptyQuery: ['un generado con la línea «Neurocirugía pediátrica · 9 años»', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.slug === firstGeneratedCardiology ? { ...s, specialtyLine: 'Neurocirugía pediátrica · 9 años' } : s)) })],
  emptyNeighborhood: ['Molina pasa a Polanco', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.slug === SLUGS.molina ? { ...s, clinic: 'polanco' } : s)) })],
  emptyFilters: ['un cardiólogo generado pasa al área Dermatología', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.slug === firstGeneratedCardiology ? { ...s, area: 'dermatologia' } : s)) })],
  ruizId: ['reservar con Ruiz como un médico más', (c) => wrapStore(c, (s) => ({ book: (input, scenario) => s.book({ ...input, slug: 'otro' }, scenario) }))],
  opaqueId: ['id con fecha (<slug>-<fecha>)', (c) => wrapStore(c, () => ({ book: (input) => ({ ok: true, id: `${input.slug}-${input.date}` }) }))],
  mutations: ['cancel sin efecto', (c) => wrapStore(c, () => ({ cancel: () => {} }))],
  notice: ['el aviso no se consume', (c) => wrapStore(c, () => ({ takeNotice: () => ({ kind: 'reprogramada', id: 'c3' }) }))],
  busy: ['ocupada ignorado', (c) => wrapStore(c, (s) => ({ book: (input) => s.book(input) }))],
  slow: ['lenta sin retraso', (c) => ({ ...c, withScenario: async (_, run) => run() })],
  initialRuiz: ['liberar Ruiz 23 a las 10:00', (c) => setSlot(c, SLUGS.ruiz, '2029-04-23', '10:00', true)],
  nextFreeRuiz: ['ocupar Ruiz 24 a las 10:30', (c) => setSlot(c, SLUGS.ruiz, '2029-04-24', '10:30', false)],
  rodrigoNoNext: ['liberar Rodrigo el 30 a las 09:00', (c) => setSlot(c, SLUGS.rodrigo, '2029-04-30', '09:00', true)],
  shortNames: ['Ruiz con un solo apellido', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.slug === SLUGS.ruiz ? { ...s, name: 'Dra. Elena Ruiz' } : s)) })],
  ruizSummary: ['Ruiz pasa a Clínica Polanco', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.slug === SLUGS.ruiz ? { ...s, clinic: 'polanco' } : s)) })],
  nameShape: ['un generado sin segundo apellido', (c) => ({ ...c, specialists: c.specialists.map((s) => (s.slug === firstGeneratedCardiology ? { ...s, name: s.name.split(' ').slice(0, 3).join(' ') } : s)) })],
  notifyEmpty: ['sembrado con Rodrigo', (c) => wrapNotify(c, (s) => { s.toggle(SLUGS.rodrigo); return {} })],
  notifyToggle: ['conmutar solo añade', (c) => wrapNotify(c, (s) => ({ toggle: (slug) => { if (!s.has(slug)) s.toggle(slug) } }))],
  notifyPerSpecialist: ['clave compartida entre médicos', (c) => wrapNotify(c, (s) => ({ toggle: () => s.toggle('todos'), has: () => s.has('todos') }))],
  session: ['el correo sin «.sanchez»', (c) => ({ ...c, session: { ...c.session, email: 'karla@ejemplo.com' } })],
  errorScenario: ['sin comprobar el formato del correo', (c) => ({ ...c, validate: (v) => validatePatient({ ...v, email: v.email.includes('.') ? v.email : `${v.email}ejemplo.com` }) })],
  validScenario: ['el teléfono pasa a obligatorio', (c) => ({ ...c, validate: (v) => [...validatePatient(v), ...(v.phone ? [] : [{ field: 'telefono', message: '' }])] })],
  phone: ['el teléfono no se valida', (c) => ({ ...c, validate: (v) => validatePatient({ ...v, phone: '' }) })],
  draftInitial: ['borrador sembrado con un motivo', (c) => ({ ...c, makePatient: () => { const s = createPatientStore(); s.update({ reason: 'Seguimiento' }); return s } })],
  draftResetOnBooking: ['submitBooking sin el reinicio', (c) => ({ ...c, submit: (booking, scenario, stores) => stores.appointments.book(booking, scenario) })],
  contactStored: ['submitBooking sin el contacto', (c) => ({ ...c, submit: (booking, scenario, stores) => stores.appointments.book(booking, scenario) })],
  contactFallback: ['el respaldo sin recordatorio', (c) => ({ ...c, contactOf: (a) => a.contact ?? { email: SESSION.email, reminder: false } })],
  groups: ['Pasadas en orden ascendente', (c) => ({ ...c, group: (list) => { const g = groupAppointments(list); return { ...g, past: [...g.past].reverse() } } })],
  upcomingText: ['el singular en plural', (c) => ({ ...c, upcomingText: (n) => (n === 0 ? upcomingText(0) : `Tienes ${n} citas próximas`) })],
  cancelCopy: ['«el Dr.» también para una doctora', (c) => ({ ...c, cancelCopy: (a, s) => cancelCopy(a, { name: s.name.replace(/^Dra\./, 'Dr.') }) })],
  nextStepsReminder: ['el recordatorio se da por pedido', (c) => ({ ...c, nextSteps: (a) => nextStepsText({ ...a, contact: { ...a.contact, reminder: true } }) })],
  nextStepsWindow: ['el plazo contra NOW + 1 min (> en vez de ≥)', (c) => ({ ...c, nextSteps: (a) => nextStepsText(a, NOW.add({ minutes: 1 })) })],
  rescheduleStart: ['ocupar todo Cortés 15 de mayo', (c) => { c.availability[SLUGS.cortes]['2029-05-15'].forEach((s) => (s.available = false)); return c }],
  // Una por literal: cada una cambia solo ese campo, con un error plausible.
  rescheduleCurrent: ['la placa nombra la cita nueva', (c) => ({ ...c, rescheduleCopy: (a, n) => ({ ...rescheduleCopy(a, n), current: rescheduleCopy(n, n).current }) })],
  rescheduleWhen: ['«Nueva cita» con la cita actual', (c) => ({ ...c, rescheduleCopy: (a, n) => ({ ...rescheduleCopy(a, n), when: rescheduleCopy(a, a).when }) })],
  reschedulePrevious: ['«Antes:» con la cita nueva', (c) => ({ ...c, rescheduleCopy: (a, n) => ({ ...rescheduleCopy(a, n), previous: rescheduleCopy(n, n).previous }) })],
  reschedulePolicy: ['«pasa al» día de la cita actual', (c) => ({ ...c, rescheduleCopy: (a, n) => ({ ...rescheduleCopy(a, n), policy: rescheduleCopy(a, { ...n, date: a.date }).policy }) })],
  rescheduleNotice: ['el aviso con la cita de antes', (c) => ({ ...c, rescheduleCopy: (a, n) => ({ ...rescheduleCopy(a, n), notice: rescheduleCopy(a, a).notice }) })],
  rescheduleNoTime: ['sin hora, la política de la hora elegida', (c) => ({ ...c, rescheduleCopy: (a, n) => rescheduleCopy(a, { ...n, time: n.time ?? '09:00' }) })],
  rescheduleWindow: ['el plazo contra NOW + 1 min (> en vez de ≥)', (c) => ({ ...c, rescheduleCopy: (a, n) => rescheduleCopy(a, n, NOW.add({ minutes: 1 })) })],
  ics: ['la hora local sin pasar a UTC', (c) => ({ ...c, ics: (a, s) => calendarFile(a, s, 0) })],
  draftKeptWhenBusy: ['submitBooking reinicia siempre', (c) => ({ ...c, submit: (booking, scenario, stores) => { stores.patient.reset(); return stores.appointments.book(booking, scenario) } })],
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
