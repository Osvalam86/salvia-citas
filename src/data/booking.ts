import { MODALITIES } from './specialists.ts'

// La cita que se reserva (vista 2): toda reserva es presencial y dura 30
// minutos, también con los médicos de «Presencial y videoconsulta» (la
// videoconsulta está fuera de alcance; DESIGN.md § Fecha y hora). Una sola
// fuente para la meta de UI/Booking Bar, la Duración de «Tu cita» (02.5) y la
// tarjeta de la confirmación previa (02.4): no pueden divergir.

const MINUTES = 30

/** Modalidad de la cita (UI/Tag de 02.4), no la del médico. */
export const BOOKING_MODALITY = MODALITIES.presencial

/** «Presencial · 30 min» (meta de UI/Booking Bar). */
export const BOOKING_META = `${BOOKING_MODALITY} · ${MINUTES} min`

/** «30 minutos» (Duración del resumen). */
export const BOOKING_DURATION = `${MINUTES} minutos`

/** Cuerpo del aviso Info «Antes de continuar» (02.4, 02.5). */
export const BOOKING_POLICY = 'Puedes cancelar o reprogramar sin costo hasta 24 horas antes. Llega 10 minutos antes con una identificación.'
