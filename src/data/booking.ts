import { CalendarDateTime, parseDate } from '@internationalized/date'
import type { Appointment, Contact } from './appointments.ts'
import { NOW } from './clock.ts'
import { MODALITIES } from './specialists.ts'

// La cita que se reserva (vista 2): toda reserva es presencial y dura 30
// minutos, también con los médicos de «Presencial y videoconsulta» (la
// videoconsulta está fuera de alcance; DESIGN.md § Fecha y hora). Una sola
// fuente para la meta de UI/Booking Bar, la Duración de «Tu cita» (02.5) y la
// tarjeta de la confirmación previa (02.4): no pueden divergir.

export const BOOKING_MINUTES = 30

/** Modalidad de la cita (UI/Tag de 02.4), no la del médico. */
export const BOOKING_MODALITY = MODALITIES.presencial

/** «Presencial · 30 min» (meta de UI/Booking Bar). */
export const BOOKING_META = `${BOOKING_MODALITY} · ${BOOKING_MINUTES} min`

/** «30 minutos» (Duración del resumen). */
export const BOOKING_DURATION = `${BOOKING_MINUTES} minutos`

/** Cuerpo del aviso Info «Antes de continuar» (02.4, 02.5). */
export const BOOKING_POLICY = 'Puedes cancelar o reprogramar sin costo hasta 24 horas antes. Llega 10 minutos antes con una identificación.'

/** Inicio de la cita como fecha y hora sin zona (el reloj simulado tampoco la lleva). */
export const startOf = ({ date, time }: Pick<Appointment, 'date' | 'time'>) => {
  const day = parseDate(date)
  const [hour, minute] = time.split(':').map(Number)
  return new CalendarDateTime(day.year, day.month, day.day, hour, minute)
}

/**
 * Cuerpo del aviso Info «Qué sigue» (04.1, 04.4). El de Figma promete un
 * recordatorio 24 horas antes y cancelar sin costo hasta entonces: solo es
 * verdad si se pidió el recordatorio y faltan 24 horas o más (contra NOW). Sin
 * recordatorio, la política sin la promesa; a menos de 24 horas (Mariana hoy a
 * las 19:15), ni recordatorio ni gratuidad. «Mis citas» es el nombre de un
 * destino: espacio de no separación (diseño §8).
 */
export function nextStepsText({ date, time, contact }: Pick<Appointment, 'date' | 'time'> & { contact: Contact }, now = NOW) {
  const inWindow = startOf({ date, time }).compare(now.add({ hours: 24 })) >= 0
  if (!inWindow) return 'Puedes gestionar tu cita desde Mis citas. Llega 10 minutos antes con una identificación.'
  if (!contact.reminder) return 'Puedes cancelar o reprogramar sin costo desde Mis citas hasta 24 horas antes. Llega 10 minutos antes con una identificación.'
  return 'Te enviaremos un recordatorio por correo 24 horas antes. Hasta entonces, puedes cancelar o reprogramar sin costo desde Mis citas. Llega 10 minutos antes con una identificación.'
}
