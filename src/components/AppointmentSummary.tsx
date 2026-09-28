import type { ReactNode } from 'react'
import Avatar, { type AvatarPhoto } from './Avatar.tsx'
import BookingDetails from './BookingDetails.tsx'
import Tag from './Tag.tsx'

type Title =
  | {
      /** h2 dentro de la tarjeta que nombra la sección que la contiene («Tu cita», 03.3). */
      title: string
      titleId: string
    }
  | { title?: never; titleId?: never }

type AppointmentSummaryProps = Title & {
  /**
   * `aside`: en la columna de 320 de escritorio (03.3), padding space-4 en
   * cualquier ancho. Por defecto, space-5 salvo en compacto (02.4).
   */
  variant?: 'aside'
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
  /**
   * Acción de la cita («Agregar a mi calendario», 04.1 y 04.4), con la mezcla
   * c-appointment-summary__action. Por debajo de appointment-summary-wide va
   * fuera del marco y a ancho completo; desde el umbral, dentro y con su ancho.
   */
  action?: ReactNode
}

// Resumen de la cita (c-appointment-summary; Figma 02.4: Appointment
// Summary). Patrón de pantalla, sin ser de los 34 (D5): quién (avatar Small
// decorativo, nombre, especialidad y modalidad) y los datos de la cita
// (BookingDetails). Sin encabezado en 02.4: el h1 de la página ya nombra el
// bloque (panel 02.0); con `title` en «Tu cita» de la vista 3 (03.3). La raíz
// es el contenedor (appointment-summary-compact y -wide) y __card, la tarjeta.
//
// Con `action` (V4a), quién y los datos van en __body: el marco lo lleva
// __body por debajo del umbral y __card desde él, sin cambiar el DOM (D7: es
// presentación). Sin `action`, el DOM de 02.4 y 03.3 no cambia.
export default function AppointmentSummary({ title, titleId, variant, name, specialty, initial, photo, modality, when, duration, clinic, action }: AppointmentSummaryProps) {
  const classes = ['c-appointment-summary', variant && `c-appointment-summary--${variant}`, action !== undefined && 'c-appointment-summary--action']
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {title && (
        <h2 className="c-appointment-summary__title" id={titleId}>
          {title}
        </h2>
      )}
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
      <BookingDetails when={when} duration={duration} clinic={clinic} className="c-appointment-summary__details" />
    </>
  )

  return (
    <div className={classes}>
      <div className="c-appointment-summary__card">
        {action === undefined ? (
          content
        ) : (
          <>
            <div className="c-appointment-summary__body">{content}</div>
            {action}
          </>
        )}
      </div>
    </div>
  )
}
