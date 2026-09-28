import { parseDate } from '@internationalized/date'
import { useSyncExternalStore } from 'react'
import { dayTitle } from '../components/dates.ts'
import type { Scenario } from './scenario.ts'
import { SESSION } from './session.ts'
import { shortName, SLUGS, type Specialist } from './specialists.ts'

// Citas de Karla (§6, D13): almacén en memoria, sembrado con las 5 citas y
// reiniciado al recargar. Ids opacos (c1–c5 y un contador para las nuevas):
// la URL de la confirmación no lleva una fecha que pueda contradecir la
// página. Reservar con la Dra. Ruiz reemplaza su cita y reutiliza c1, así
// /citas/c1/confirmada aguanta una recarga.

export type AppointmentStatus = 'confirmed' | 'pending' | 'past' | 'cancelled'

/**
 * Contacto de la reserva: el correo y la casilla del recordatorio del borrador
 * (D17) en el momento de reservar. El borrador se reinicia tras la reserva, así
 * que la confirmación (04.1) los lee de la cita, no de él.
 */
export type Contact = { email: string; reminder: boolean }

export type Appointment = {
  id: string
  slug: string
  /** ISO, AAAA-MM-DD. */
  date: string
  /** HH:MM. */
  time: string
  status: AppointmentStatus
  /** Solo en las reservadas en esta sesión; las sembradas usan contactOf. */
  contact?: Contact
}

/** Aviso que cruza una navegación (Mis citas tras reprogramar). De un solo uso. */
export type Notice = { kind: 'reprogramada'; id: string }

export const RUIZ_APPOINTMENT_ID = 'c1'

const SEED: Appointment[] = [
  { id: 'c1', slug: SLUGS.ruiz, date: '2029-04-24', time: '10:30', status: 'confirmed' },
  { id: 'c2', slug: SLUGS.molina, date: '2029-05-08', time: '17:00', status: 'pending' },
  { id: 'c3', slug: SLUGS.cortes, date: '2029-05-16', time: '09:30', status: 'confirmed' },
  { id: 'c4', slug: SLUGS.ibarra, date: '2029-03-12', time: '09:00', status: 'past' },
  { id: 'c5', slug: SLUGS.serrano, date: '2029-02-22', time: '12:30', status: 'cancelled' },
]

export type Booking = Pick<Appointment, 'slug' | 'date' | 'time' | 'contact'>

export type BookingResult = { ok: true; id: string } | { ok: false; reason: 'ocupada' }

export function createAppointmentStore(seed: Appointment[] = SEED) {
  let appointments = seed
  let notice: Notice | null = null
  let next = seed.length + 1
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((listener) => listener())
  const update = (id: string, change: Partial<Appointment>) => {
    appointments = appointments.map((a) => (a.id === id ? { ...a, ...change } : a))
    emit()
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => appointments,
    get: (id: string | undefined) => appointments.find((a) => a.id === id),

    /** Reserva (vista 3). `ocupada` falla sin tocar el almacén (D8). */
    book({ slug, date, time, contact }: Booking, scenario: Scenario = null): BookingResult {
      if (scenario === 'ocupada') return { ok: false, reason: 'ocupada' }
      if (slug === SLUGS.ruiz) {
        update(RUIZ_APPOINTMENT_ID, { date, time, status: 'confirmed', contact })
        return { ok: true, id: RUIZ_APPOINTMENT_ID }
      }
      const id = `c${next++}`
      appointments = [...appointments, { id, slug, date, time, status: 'confirmed', contact }]
      emit()
      return { ok: true, id }
    },

    cancel: (id: string) => update(id, { status: 'cancelled' }),

    reschedule(id: string, date: string, time: string) {
      notice = { kind: 'reprogramada', id }
      update(id, { date, time })
    },

    /** Devuelve el aviso pendiente y lo consume: tras recargar no vuelve. */
    takeNotice() {
      const pending = notice
      notice = null
      return pending
    },
  }
}

/**
 * Contacto de la confirmación. Una cita sembrada no lo tiene (la c1 al
 * recargar su confirmación): usa el correo de la sesión y el recordatorio
 * pedido, como una reserva anterior de Karla (DESIGN.md, D13).
 */
export const contactOf = (appointment: Appointment): Contact =>
  appointment.contact ?? { email: SESSION.email, reminder: true }

const isUpcoming = (appointment: Appointment) => appointment.status === 'confirmed' || appointment.status === 'pending'

/**
 * Secciones de Mis citas (§5.4): Próximas en orden ascendente; Pasadas,
 * descendente, con las canceladas.
 */
export function groupAppointments(appointments: Appointment[]) {
  const key = (a: Appointment) => `${a.date}T${a.time}`
  return {
    upcoming: appointments.filter(isUpcoming).sort((a, b) => key(a).localeCompare(key(b))),
    past: appointments.filter((a) => !isUpcoming(a)).sort((a, b) => key(b).localeCompare(key(a))),
  }
}

/** Nota de la cita Pendiente (§5.4): la confirmación manual es del consultorio. */
export const PENDING_NOTE = 'El consultorio confirma en menos de 24 horas. Te avisaremos por correo.'

/** Subtítulo de Mis citas. Con 0, frase propia: «0 citas» no existe en el diseño. */
export function upcomingText(count: number) {
  if (count === 0) return 'No tienes citas próximas'
  return count === 1 ? 'Tienes 1 cita próxima' : `Tienes ${count} citas próximas`
}

/**
 * Copy del diálogo de cancelar y del aviso «Cita cancelada». El de Molina es
 * el literal de Figma (04.3, 04.8); el resto, derivado del mismo patrón
 * (DESIGN.md § Citas y diálogos). Nunca promete cancelación sin costo (§5.4).
 */
export function cancelCopy({ date, time }: Pick<Appointment, 'date' | 'time'>, specialist: Pick<Specialist, 'name'>) {
  const day = dayTitle(parseDate(date))
  const article = specialist.name.startsWith('Dra.') ? 'la' : 'el'
  return {
    dialog: `${day}, ${time}, con ${article} ${specialist.name}. Esta acción no se puede deshacer.`,
    notice: `Ya no tienes la cita del ${day[0].toLowerCase()}${day.slice(1)} a las ${time} con ${article} ${shortName(specialist)}.`,
  }
}

export const appointmentStore = createAppointmentStore()

export function useAppointments() {
  return useSyncExternalStore(appointmentStore.subscribe, appointmentStore.getSnapshot)
}
