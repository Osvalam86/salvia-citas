import { appointmentStore, type Appointment, type BookingResult } from './appointments.ts'
import type { Scenario } from './scenario.ts'
import { SESSION } from './session.ts'

// Datos del paciente (vista 3). La validación es una función pura (diseño
// §3.4: al enviar) y el borrador vive en memoria (D17), como las citas (D13) y
// los avisos (D16): cruza vistas (el aviso de privacidad, «Elegir otra hora»)
// para que «Tus datos se conservan» (03.5) diga la verdad, se reinicia al
// recargar y tras una reserva correcta. Los errores no van aquí: son estado de
// la vista y solo cambian al enviar.

export type PatientDraft = {
  name: string
  email: string
  phone: string
  /** Opción de REASONS, o '' («Elige una opción»). */
  reason: string
  privacy: boolean
  reminder: boolean
}

/** Campos que pueden fallar, en el orden del DOM. Son también sus ids (anclas del resumen). */
export type PatientField = 'nombre' | 'correo' | 'telefono' | 'motivo' | 'privacidad'

export type PatientError = { field: PatientField; message: string }

/** Nace de la sesión: nombre y correo rellenos (§5.3); el resto, vacío (Figma 03.1). */
export function initialDraft(): PatientDraft {
  return { name: SESSION.fullName, email: SESSION.email, phone: '', reason: '', privacy: false, reminder: false }
}

// «con @ y dominio» (mensaje de Figma 03.2).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 10 dígitos; se admiten los separadores del ejemplo («55 1234 5678»).
const PHONE_SEPARATORS = /[\s()-]/g

/** Errores en el orden del DOM; vacío si el envío es válido. */
export function validatePatient(values: PatientDraft): PatientError[] {
  const errors: PatientError[] = []
  const email = values.email.trim()
  const phone = values.phone.replace(PHONE_SEPARATORS, '')

  if (!values.name.trim()) errors.push({ field: 'nombre', message: 'Escribe tu nombre completo' })
  if (!email) errors.push({ field: 'correo', message: 'Escribe tu correo electrónico' })
  else if (!EMAIL.test(email)) errors.push({ field: 'correo', message: 'Escribe un correo válido, con @ y dominio' })
  if (phone && !/^\d{10}$/.test(phone)) errors.push({ field: 'telefono', message: 'Escribe 10 dígitos o deja el campo vacío' })
  if (!values.reason) errors.push({ field: 'motivo', message: 'Elige el motivo de tu consulta' })
  if (!values.privacy) errors.push({ field: 'privacidad', message: 'Debes aceptar el aviso para continuar' })
  return errors
}

export function createPatientStore() {
  let draft = initialDraft()

  return {
    getSnapshot: () => draft,
    update: (change: Partial<PatientDraft>) => {
      draft = { ...draft, ...change }
    },
    reset: () => {
      draft = initialDraft()
    },
  }
}

/**
 * La vista 3 no se suscribe: lee el borrador al montar y le escribe cada
 * cambio. Suscrita, el reinicio de submitBooking volvía a pintar el form vacío
 * antes de salir (D17).
 */
export const patientStore = createPatientStore()

type Stores = {
  appointments: Pick<typeof appointmentStore, 'book'>
  patient: Pick<typeof patientStore, 'reset'>
}

/**
 * Envío válido de la vista 3: reserva (D13; `ocupada` falla sin tocar el
 * almacén, D8) y, solo si sale bien, reinicia el borrador (D17).
 */
export function submitBooking(
  booking: Pick<Appointment, 'slug' | 'date' | 'time'>,
  scenario: Scenario,
  stores: Stores = { appointments: appointmentStore, patient: patientStore },
): BookingResult {
  const result = stores.appointments.book(booking, scenario)
  if (result.ok) stores.patient.reset()
  return result
}
