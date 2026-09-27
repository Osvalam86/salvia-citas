import { DateFormatter, type CalendarDate } from '@internationalized/date'

// Textos de fecha del selector (4.6). Formato propio donde Figma y Intl
// difieren: Intl (es-MX) pone coma tras el día de la semana («martes, 24…»),
// escribe «abril de 2029» y abrevia el miércoles como «M». Las fechas son
// CalendarDate sin hora: se formatean en UTC para que la zona del navegador no
// mueva el día.
const ZONE = 'UTC'
const LOCALE = 'es-MX'

const weekdayLong = new DateFormatter(LOCALE, { weekday: 'long', timeZone: ZONE })
const weekdayShort = new DateFormatter(LOCALE, { weekday: 'short', timeZone: ZONE })
const monthLong = new DateFormatter(LOCALE, { month: 'long', timeZone: ZONE })
const monthShort = new DateFormatter(LOCALE, { month: 'short', timeZone: ZONE })

const toDate = (date: CalendarDate) => date.toDate(ZONE)

/** Cabecera del calendario (UI/Calendar), lunes primero: X es el miércoles. */
export const WEEKDAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

/** «martes 24 de abril de 2029», sin coma (descripción de UI/Calendar Day). */
export function longDate(date: CalendarDate) {
  return `${weekdayLong.format(toDate(date))} ${date.day} de ${monthLong.format(toDate(date))} de ${date.year}`
}

/** «Abril 2029» (UI/Calendar, prop month). */
export function monthTitle(date: CalendarDate) {
  const month = monthLong.format(toDate(date))
  return `${month[0].toUpperCase()}${month.slice(1)} ${date.year}`
}

/** «abril», para el texto oculto del Day Chip. */
export function monthName(date: CalendarDate) {
  return monthLong.format(toDate(date))
}

/** «mar», «mié», «sáb» (UI/Day Chip). */
export function shortWeekday(date: CalendarDate) {
  return weekdayShort.format(toDate(date)).replace('.', '')
}

/** «mar 24 abr» (resumen de UI/Booking Bar). */
export function shortDate(date: CalendarDate) {
  return `${shortWeekday(date)} ${date.day} ${monthShort.format(toDate(date)).replace('.', '')}`
}

/**
 * Disponibilidad de UI/Result Card: «Próxima cita: hoy, 19:15» o «Próxima
 * cita: mar 24 abr, 10:30». Solo «hoy» tiene nombre: Figma escribe el día
 * siguiente con su fecha (01.1, Dra. Ruiz).
 */
export function nextSlotText(date: CalendarDate, time: string, today: CalendarDate) {
  return `Próxima cita: ${date.compare(today) === 0 ? 'hoy' : shortDate(date)}, ${time}`
}

/** «Sin disponibilidad · próximo cupo en mayo» (UI/Result Card, State=Full). */
export function nextOpeningText(opening: CalendarDate) {
  return `Sin disponibilidad · próximo cupo en ${monthName(opening)}`
}

const capitalize = (text: string) => `${text[0].toUpperCase()}${text.slice(1)}`

/** «Martes 24 de abril»: subtítulo de «Elige hora» (Figma 02.1, 02.3). */
export function dayTitle(date: CalendarDate) {
  return capitalize(`${weekdayLong.format(toDate(date))} ${date.day} de ${monthName(date)}`)
}

/**
 * «martes 24», con « de mayo» solo si el mes no es el de `reference`: en el
 * bloque sin horarios, el día del que se habla ya dice el mes.
 */
export function weekdayDay(date: CalendarDate, reference: CalendarDate) {
  const month = date.month === reference.month ? '' : ` de ${monthName(date)}`
  return `${weekdayLong.format(toDate(date))} ${date.day}${month}`
}

/** Etiqueta de la semana de la tira: «23 – 29 de abril», o «30 de abril – 6 de mayo» entre dos meses. */
export function weekRangeText(start: CalendarDate) {
  const end = start.add({ days: 6 })
  if (start.month === end.month) return `${start.day} – ${end.day} de ${monthName(end)}`
  return `${start.day} de ${monthName(start)} – ${end.day} de ${monthName(end)}`
}

/** «6 horarios libres», «1 horario libre», «sin horarios». */
export function freeSlotsText(free: number) {
  if (free === 0) return 'sin horarios'
  return free === 1 ? '1 horario libre' : `${free} horarios libres`
}
