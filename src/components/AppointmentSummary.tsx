import Avatar, { type AvatarPhoto } from './Avatar.tsx'
import BookingDetails from './BookingDetails.tsx'
import Tag from './Tag.tsx'

type AppointmentSummaryProps = {
  /** «Dra. Elena Ruiz Arellano» */
  name: string
  /** Especialidad del área («Cardiología»), no la línea del perfil. */
  specialty: string
  initial: string
  photo?: AvatarPhoto
  /** Modalidad de la cita (UI/Tag): «Presencial» en toda reserva. */
  modality: string
  when: string
  duration: string
  clinic: { name: string; address: string }
}

// Resumen de la cita (c-appointment-summary; Figma 02.4: Appointment
// Summary). Patrón de pantalla, sin ser de los 34 (D5): quién (avatar Small
// decorativo, nombre, especialidad y modalidad) y los datos de la cita
// (BookingDetails). Sin encabezado: 02.4 no lo tiene y el h1 de la página ya
// nombra el bloque (panel 02.0). La raíz es el contenedor
// (appointment-summary-compact) y __card, la tarjeta.
export default function AppointmentSummary({ name, specialty, initial, photo, modality, when, duration, clinic }: AppointmentSummaryProps) {
  return (
    <div className="c-appointment-summary">
      <div className="c-appointment-summary__card">
        <div className="c-appointment-summary__who">
          <Avatar size="small" initial={initial} photo={photo} />
          <div className="c-appointment-summary__info">
            <div className="c-appointment-summary__identity">
              <p className="c-appointment-summary__name">{name}</p>
              <p className="c-appointment-summary__specialty">{specialty}</p>
            </div>
            <Tag>{modality}</Tag>
          </div>
        </div>
        <BookingDetails when={when} duration={duration} clinic={clinic} />
      </div>
    </div>
  )
}
