import { useId } from 'react'
import Button from './Button.tsx'
import Icon from './Icon.tsx'

type Base = {
  /** El form de la vista: la barra vive en el hueco del shell, fuera de main. */
  formId: string
  /**
   * La pone la pantalla: «Continuar» en la reserva, «Confirmar hora» en la
   * reprogramación. Sin texto libre: con un botón de más de 167 el resumen
   * baja de 160 y parte (techo de §4.5).
   */
  submitLabel: 'Continuar' | 'Confirmar hora'
}

type Chosen = Base & {
  selection: 'chosen'
  /** «mar 24 abr · 10:30» */
  summary: string
  /** «Presencial · 30 min» */
  meta: string
  messageId?: never
}

type None = Base & {
  selection: 'none'
  summary?: never
  meta?: never
  messageId?: never
}

type Missing = Base & {
  selection: 'missing'
  /** id del mensaje: la primera hora libre lo recibe como aria-describedby. */
  messageId: string
  summary?: never
  meta?: never
}

export type BookingBarProps = Chosen | None | Missing

// UI/Booking Bar (móvil, 02.1–02.3 y 02.7): resumen de la selección y envío,
// en el hueco de barra de AppLayout (sticky, con su zona segura). Por D7 solo
// existe bajo lg; en escritorio su trabajo lo hace la sección «Tu cita».
//
// El resumen no es región viva: cada selección ya se anuncia en su control.
// El envío nunca se deshabilita y lleva aria-describedby hacia el resumen.
export default function BookingBar(props: BookingBarProps) {
  const summaryId = useId()
  const { selection, formId, submitLabel } = props

  let title = 'Sin horario elegido'
  let meta = 'Elige un día con horarios'
  if (selection === 'chosen') {
    title = props.summary
    meta = props.meta
  } else if (selection === 'missing') {
    meta = 'Elige un horario primero'
  }

  return (
    <div className="c-booking-bar">
      <div className="o-wrapper c-booking-bar__inner">
        <div className="c-booking-bar__summary" id={summaryId}>
          <p className="c-booking-bar__title">{title}</p>
          <p className={selection === 'missing' ? 'c-booking-bar__meta c-booking-bar__meta--error' : 'c-booking-bar__meta'}>
            {selection === 'chosen' && <Icon name="clock" size={20} />}
            {selection === 'missing' && <Icon name="warning-circle" size={20} />}
            <span className="c-booking-bar__meta-text" id={selection === 'missing' ? props.messageId : undefined}>
              {meta}
            </span>
          </p>
        </div>
        <Button type="submit" form={formId} aria-describedby={summaryId} className="c-booking-bar__submit">
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
