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

/** /confirmar y /datos: sin fecha y hora libres, a la reserva con los mismos parámetros. */
export function bookingStepLoader(args: LoaderFunctionArgs) {
  const { specialist } = specialistLoader(args)
  const url = new URL(args.request.url)
  if (!isFreeSlot(specialist.slug, url.searchParams.get('fecha'), url.searchParams.get('hora'))) {
    throw replace(`/especialistas/${specialist.slug}${url.search}`)
  }
  return { specialist }
}

export function confirmedLoader({ params }: LoaderFunctionArgs) {
  const appointment = appointmentStore.get(params.id)
  if (!appointment) throw notFound()
  return { appointment, specialist: findSpecialist(appointment.slug)! }
}

/** Solo una cita Confirmada se reprograma (UI/Appointment Card solo ofrece ahí «Reprogramar»). */
export function rescheduleLoader({ params }: LoaderFunctionArgs) {
  const appointment = appointmentStore.get(params.id)
  if (!appointment) throw notFound()
  if (appointment.status !== 'confirmed') throw replace('/mis-citas')
  return { appointment, specialist: findSpecialist(appointment.slug)! }
}
