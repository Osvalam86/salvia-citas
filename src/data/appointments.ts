import { useSyncExternalStore } from 'react'
import type { Scenario } from './scenario.ts'
import { SLUGS } from './specialists.ts'

// Citas de Karla (§6, D13): almacén en memoria, sembrado con las 5 citas y
// reiniciado al recargar. Ids opacos (c1–c5 y un contador para las nuevas):
// la URL de la confirmación no lleva una fecha que pueda contradecir la
// página. Reservar con la Dra. Ruiz reemplaza su cita y reutiliza c1, así
// /citas/c1/confirmada aguanta una recarga.

export type AppointmentStatus = 'confirmed' | 'pending' | 'past' | 'cancelled'

export type Appointment = {
  id: string
  slug: string
  /** ISO, AAAA-MM-DD. */
  date: string
  /** HH:MM. */
  time: string
  status: AppointmentStatus
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
    book({ slug, date, time }: Pick<Appointment, 'slug' | 'date' | 'time'>, scenario: Scenario = null): BookingResult {
      if (scenario === 'ocupada') return { ok: false, reason: 'ocupada' }
      if (slug === SLUGS.ruiz) {
        update(RUIZ_APPOINTMENT_ID, { date, time, status: 'confirmed' })
        return { ok: true, id: RUIZ_APPOINTMENT_ID }
      }
      const id = `c${next++}`
      appointments = [...appointments, { id, slug, date, time, status: 'confirmed' }]
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

export const appointmentStore = createAppointmentStore()

export function useAppointments() {
  return useSyncExternalStore(appointmentStore.subscribe, appointmentStore.getSnapshot)
}
