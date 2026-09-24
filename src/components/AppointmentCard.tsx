import { useId, useRef } from 'react'
import Avatar, { type AvatarPhoto } from './Avatar.tsx'
import Button from './Button.tsx'
import Icon from './Icon.tsx'
import StatusTag from './StatusTag.tsx'

type Appointment = {
  /** Fecha y hora visibles («Martes 24 de abril · 10:30»): el h3 de la tarjeta. */
  when: string
  /** La misma fecha para máquinas, en el <time> del h3 («2029-04-24T10:30»). */
  dateTime: string
  /** Nombre con tratamiento («Dra. Elena Ruiz Arellano»). */
  name: string
  specialty: string
  location: string
  /** Respaldo del avatar. */
  initial: string
  photo?: AvatarPhoto
}

// «Cancelar cita» no abre el diálogo: lo avisa. El diálogo es uno solo, a
// nivel de la lista, y recibe el disparador para devolverle el foco.
type Cancellable = { onCancel: (trigger: HTMLButtonElement) => void }

type Confirmed = Appointment & Cancellable & {
  status: 'confirmed'
  /** Selector de horario en modo reprogramación (/mis-citas/:id/reprogramar). */
  rescheduleHref: string
  pendingNote?: never
  bookHref?: never
}

// Una pendiente se cancela pero no se reprograma (diseño §4.7).
type Pending = Appointment & Cancellable & {
  status: 'pending'
  /** Explica la confirmación manual del consultorio. */
  pendingNote: string
  rescheduleHref?: never
  bookHref?: never
}

// «Agendar seguimiento» y «Agendar de nuevo» llevan al perfil del médico.
type Closed = Appointment & {
  status: 'past' | 'cancelled'
  bookHref: string
  onCancel?: never
  rescheduleHref?: never
  pendingNote?: never
}

export type AppointmentCardProps = Confirmed | Pending | Closed

// UI/Appointment Card. La raíz es el <li> de la lista de su sección y es el
// contenedor de la container query (DESIGN.md § Contenedores). La tarjeta no
// es interactiva: solo sus acciones, todas Secondary (ningún Primary dentro de
// una lista). Las etiquetas se repiten entre tarjetas: cada acción lleva
// aria-describedby a la fecha de la suya.
export default function AppointmentCard(props: AppointmentCardProps) {
  const { status, when, dateTime, name, specialty, location, initial, photo } = props
  const whenId = useId()
  const trigger = useRef<HTMLButtonElement>(null)
  const whenClasses = ['c-appointment-card__when', status === 'cancelled' && 'c-appointment-card__when--cancelled']
    .filter(Boolean)
    .join(' ')

  return (
    <li className="c-appointment-card">
      <div className="c-appointment-card__card">
        <div className="c-appointment-card__body">
          <div className="c-appointment-card__header">
            <h3 className={whenClasses} id={whenId}>
              <time dateTime={dateTime}>{when}</time>
            </h3>
            <StatusTag status={status} />
            {props.status === 'pending' && <p className="c-appointment-card__note">{props.pendingNote}</p>}
          </div>
          <div className="c-appointment-card__details">
            <div className="c-appointment-card__who">
              <Avatar size="small" initial={initial} photo={photo} />
              <div className="c-appointment-card__person">
                <p className="c-appointment-card__name">{name}</p>
                <p className="c-appointment-card__specialty">{specialty}</p>
              </div>
            </div>
            <p className="c-appointment-card__location">
              <Icon name="map-pin" size={20} />
              <span className="c-appointment-card__text">{location}</span>
            </p>
          </div>
        </div>
        <div className="c-appointment-card__actions">
          {props.status === 'confirmed' && (
            <Button variant="secondary" href={props.rescheduleHref} aria-describedby={whenId} className="c-appointment-card__action">
              Reprogramar
            </Button>
          )}
          {(props.status === 'confirmed' || props.status === 'pending') && (
            <Button
              variant="secondary"
              ref={trigger}
              aria-haspopup="dialog"
              aria-describedby={whenId}
              onClick={() => trigger.current && props.onCancel(trigger.current)}
              className="c-appointment-card__action"
            >
              Cancelar cita
            </Button>
          )}
          {(props.status === 'past' || props.status === 'cancelled') && (
            <Button variant="secondary" href={props.bookHref} aria-describedby={whenId} className="c-appointment-card__action">
              {props.status === 'past' ? 'Agendar seguimiento' : 'Agendar de nuevo'}
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
