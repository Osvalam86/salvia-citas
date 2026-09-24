import { CalendarDate, parseDate } from '@internationalized/date'
import { NOW, TODAY } from './clock.ts'
import { GENERATED_CARDIOLOGY, SLUGS, SPECIALISTS, type Specialist } from './specialists.ts'

// Disponibilidad (D4). Un registro por médico, Record<ISODate, Slot[]>, desde
// hoy hasta su publishedUntil. «Lleno» se deriva (isFull) y nunca es un campo.
//
// Orden de las reglas, por día:
// 1. Plantilla: lunes a sábado 09:00–11:30 y 16:00–18:30 cada 30 min; el
//    domingo, solo la mañana. Mariana, desfasada un cuarto de hora (su 19:15).
// 2. Ocupación con semilla: mulberry32 sobre slug + fecha + hora, ocupada con
//    probabilidad 0.4. Nunca Math.random: las capturas deben ser estables.
// 3. Domingo: todas ocupadas (ningún día es []: [].every() daría lleno sin
//    horas). Horas que empiezan en o antes de NOW: ocupadas.
// 4. Días declarados (§5.2, §5.4 y el orden de la búsqueda), literales.
// 5. Un día de lunes a sábado que sale lleno sin estar declarado libera su
//    última hora: solo son llenos los domingos y los declarados.

export type Slot = { time: string; available: boolean }
export type DayAvailability = Slot[]
export type Availability = Record<string, Record<string, DayAvailability>>

const OCCUPIED_P = 0.4

const range = (from: string, to: string, stepMin = 30) => {
  const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3))
  const times: string[] = []
  for (let m = minutes(from); m <= minutes(to); m += stepMin) times.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`)
  return times
}

const STANDARD = { morning: range('09:00', '11:30'), afternoon: range('16:00', '18:30') }
const QUARTER = { morning: range('09:15', '11:45'), afternoon: range('16:15', '19:45') }

/** 0 = domingo. Sin new Date(): parte de la fecha de calendario. */
export const weekday = (date: CalendarDate) => date.toDate('UTC').getUTCDay()

// FNV-1a de 32 bits: semilla de mulberry32 a partir de un texto.
function fnv1a(text: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const random = (key: string) => mulberry32(fnv1a(key))()

const NOW_TIME = `${String(NOW.hour).padStart(2, '0')}:${String(NOW.minute).padStart(2, '0')}`

/** Horas de un día según la plantilla del médico. */
function templateTimes(specialist: Specialist, date: CalendarDate) {
  const grid = specialist.slug === SLUGS.mariana ? QUARTER : STANDARD
  return weekday(date) === 0 ? grid.morning : [...grid.morning, ...grid.afternoon]
}

const all = (times: string[], available: boolean): Slot[] => times.map((time) => ({ time, available }))
const only = (times: string[], free: string[]): Slot[] => times.map((time) => ({ time, available: free.includes(time) }))

// Días declarados: devuelven las horas del día o null si el día no lo está.
// Cortés (§5.4): días llenos de mayo, el 16 a las 09:30 (su cita actual) y el 17.
export const CORTES_FULL_MAY = [6, 7, 9, 13, 14, 20, 21, 23, 27, 28]

function declared(specialist: Specialist, iso: string, times: string[]): Slot[] | null {
  const { slug } = specialist
  if (slug === SLUGS.ruiz) {
    if (iso === '2029-04-23') return all(times, false)
    if (iso === '2029-04-24') return only(times, ['10:30', '11:00', '16:00', '16:30', '17:00', '17:30'])
  }
  if (slug === SLUGS.joaquin && iso <= '2029-04-25') return all(times, false)
  if (slug === SLUGS.rodrigo) return all(times, false)
  if (GENERATED_CARDIOLOGY.has(slug) && iso <= '2029-05-01') return all(times, false)
  if (slug === SLUGS.cortes) {
    const date = parseDate(iso)
    if (date.month === 5 && CORTES_FULL_MAY.includes(date.day)) return all(times, false)
    if (iso === '2029-05-17') return only(times, ['09:00', '10:30', '11:00', '11:30', '16:30', '17:00', '17:30', '18:00'])
  }
  return null
}

function generatedDay(specialist: Specialist, date: CalendarDate): DayAvailability {
  const iso = date.toString()
  const times = templateTimes(specialist, date)
  const fixed = declared(specialist, iso, times)
  if (fixed) return fixed

  const sunday = weekday(date) === 0
  const slots = times.map((time) => ({
    time,
    available: !sunday && !(iso === TODAY.toString() && time <= NOW_TIME) && random(`${specialist.slug}|${iso}|${time}`) >= OCCUPIED_P,
  }))
  // Primer hueco fijado por Figma (01.1), el resto del día con la semilla:
  // Mariana, hoy a las 19:15; Joaquín, el jueves 26 a las 17:00.
  const firstAt = (time: string) => {
    for (const slot of slots) if (slot.time <= time) slot.available = slot.time === time
  }
  if (specialist.slug === SLUGS.mariana && iso === '2029-04-23') firstAt('19:15')
  if (specialist.slug === SLUGS.joaquin && iso === '2029-04-26') firstAt('17:00')
  // Cortés, 16 de mayo: la hora de su cita actual está ocupada (§5.4).
  if (specialist.slug === SLUGS.cortes && iso === '2029-05-16') {
    for (const slot of slots) if (slot.time === '09:30') slot.available = false
  }
  if (!sunday && isFull(slots)) slots[slots.length - 1].available = true
  return slots
}

export function buildAvailability(specialists: Specialist[] = SPECIALISTS): Availability {
  const result: Availability = {}
  for (const specialist of specialists) {
    const days: Record<string, DayAvailability> = {}
    for (let date = TODAY; date.compare(specialist.publishedUntil) <= 0; date = date.add({ days: 1 })) {
      days[date.toString()] = generatedDay(specialist, date)
    }
    result[specialist.slug] = days
  }
  return result
}

export const isFull = (slots: DayAvailability) => slots.every((slot) => !slot.available)
export const freeCount = (slots: DayAvailability) => slots.filter((slot) => slot.available).length

// Después de isFull: la construcción la usa al cargar el módulo.
export const AVAILABILITY = buildAvailability()

/** Primer hueco libre del médico, o null si su agenda publicada está llena. */
export function firstFree(slug: string, availability: Availability = AVAILABILITY) {
  const days = availability[slug] ?? {}
  for (const iso of Object.keys(days).sort()) {
    const slot = days[iso].find((s) => s.available)
    if (slot) return { date: iso, time: slot.time }
  }
  return null
}

/** Mes en que se abre la agenda siguiente de un médico lleno (el del día después de publishedUntil). */
export const nextOpeningMonth = (specialist: Specialist) => specialist.publishedUntil.add({ days: 1 })

/** ¿Es `hora` una hora libre de `fecha` para ese médico? (guardas de D1). */
export function isFreeSlot(slug: string, date: string | null, time: string | null, availability: Availability = AVAILABILITY) {
  if (!date || !time) return false
  return availability[slug]?.[date]?.some((slot) => slot.time === time && slot.available) ?? false
}
