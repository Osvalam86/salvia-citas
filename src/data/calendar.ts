import type { CalendarDateTime } from '@internationalized/date'
import type { Appointment } from './appointments.ts'
import { BOOKING_MINUTES, startOf } from './booking.ts'
import { NOW } from './clock.ts'
import { CITY, CLINICS, type Specialist } from './specialists.ts'

// «Agregar a mi calendario» (04.1, 04.4; diseño §5.4): un .ics de un evento,
// RFC 5545. Horas en UTC con Z, sin TZID ni VTIMEZONE: Ciudad de México está
// en UTC−6 todo el año (sin horario de verano desde 2022). DTSTAMP sale del
// reloj simulado (NOW), no del real: el archivo es estable.

/** Horas que se suman a la hora de Ciudad de México para pasarla a UTC. */
export const CDMX_UTC_OFFSET_HOURS = 6

const pad = (n: number) => String(n).padStart(2, '0')
const utc = (local: CalendarDateTime, offset: number) => {
  const t = local.add({ hours: offset })
  return `${t.year}${pad(t.month)}${pad(t.day)}T${pad(t.hour)}${pad(t.minute)}${pad(t.second)}Z`
}

// TEXT de RFC 5545 §3.3.11: barra invertida, punto y coma y coma, escapados.
const text = (value: string) => value.replace(/[\\;,]/g, (c) => `\\${c}`)

// §3.1: líneas de 75 octetos como mucho; la continuación empieza por un
// espacio. Se corta por caracteres para no partir uno de varios octetos.
const encoder = new TextEncoder()
function fold(line: string) {
  const parts: string[] = []
  let current = ''
  for (const char of line) {
    const limit = parts.length ? 74 : 75
    if (encoder.encode(current + char).length > limit) {
      parts.push(current)
      current = char
    } else {
      current += char
    }
  }
  parts.push(current)
  return parts.join('\r\n ')
}

/** Contenido del .ics de una cita, con CRLF. */
export function calendarFile(appointment: Pick<Appointment, 'id' | 'date' | 'time'>, specialist: Pick<Specialist, 'name' | 'clinic'>, offset = CDMX_UTC_OFFSET_HOURS) {
  const start = startOf(appointment)
  const clinic = CLINICS[specialist.clinic]
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salvia//Caso de estudio//ES',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@salvia.example`,
    `DTSTAMP:${utc(NOW, offset)}`,
    `DTSTART:${utc(start, offset)}`,
    `DTEND:${utc(start.add({ minutes: BOOKING_MINUTES }), offset)}`,
    `SUMMARY:${text(`Cita con ${specialist.name}`)}`,
    `LOCATION:${text(`${clinic.name}, ${clinic.address}, ${CITY}`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map(fold).join('\r\n')}\r\n`
}

/** href del enlace de descarga: data URI, sin Blob que liberar. */
export const calendarHref = (file: string) => `data:text/calendar;charset=utf-8,${encodeURIComponent(file)}`

/** «cita-salvia-2029-04-24.ics» */
export const calendarFileName = (appointment: Pick<Appointment, 'date'>) => `cita-salvia-${appointment.date}.ics`
