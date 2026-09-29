import { parseDate } from '@internationalized/date'
import { data, replace, type LoaderFunctionArgs } from 'react-router'
import { appointmentStore } from '../data/appointments.ts'
import { isFreeSlot } from '../data/availability.ts'
import { findSpecialist } from '../data/specialists.ts'

// Guardas de D1. Un slug o un id desconocidos lanzan un 404 que pinta
// RouteError; los pasos sin hora libre y las citas que no se pueden
// reprogramar redirigen con replace, no con redirect: redirect añade una
// entrada (medido en T2, idx 1 en carga completa) y Atrás volvería a la URL
// que redirige, sin salida.

const notFound = () => data(null, { status: 404 })

export function specialistLoader({ params }: LoaderFunctionArgs) {
  const specialist = findSpecialist(params.slug)
  if (!specialist) throw notFound()
  return { specialist }
}

/**
 * /confirmar y /datos: sin fecha y hora libres, a la reserva con los mismos
 * parámetros. Devuelve la selección ya validada: la hora, decodificada
 * (`10%3A30` y `10:30` dan `10:30`).
 */
export function bookingStepLoader(args: LoaderFunctionArgs) {
  const { specialist } = specialistLoader(args)
  const url = new URL(args.request.url)
  const date = url.searchParams.get('fecha')
  const time = url.searchParams.get('hora')
  if (!date || !time || !isFreeSlot(specialist.slug, date, time)) {
    throw replace(`/especialistas/${specialist.slug}${url.search}`)
  }
  return { specialist, date: parseDate(date), time }
}

/**
 * Solo una cita Confirmada tiene confirmación (D1, V4a): una cancelada, pasada
 * o pendiente no está «reservada», y la c1 cancelada en Mis citas tampoco.
 */
export function confirmedLoader({ params }: LoaderFunctionArgs) {
  const appointment = appointmentStore.get(params.id)
  if (!appointment) throw notFound()
  if (appointment.status !== 'confirmed') throw replace('/mis-citas')
  return { appointment, specialist: findSpecialist(appointment.slug)! }
}

/**
 * Mis citas: consume el aviso de un solo uso del almacén (D13, «Cita
 * reprogramada»). En el loader y no en el render: corre una vez por
 * navegación, fuera de React, y el primer commit de la vista ya trae el aviso.
 * Cada navegación a /mis-citas lo vuelve a ejecutar (también un POP o un PUSH
 * a la misma URL) y entonces el aviso ya no está: así no vuelve con Atrás ni
 * al recargar.
 */
export function myAppointmentsLoader() {
  return { notice: appointmentStore.takeNotice() }
}

/** Solo una cita Confirmada se reprograma (UI/Appointment Card solo ofrece ahí «Reprogramar»). */
export function rescheduleLoader({ params }: LoaderFunctionArgs) {
  const appointment = appointmentStore.get(params.id)
  if (!appointment) throw notFound()
  if (appointment.status !== 'confirmed') throw replace('/mis-citas')
  return { appointment, specialist: findSpecialist(appointment.slug)! }
}
