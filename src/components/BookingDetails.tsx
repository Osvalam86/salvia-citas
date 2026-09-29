import Icon from './Icon.tsx'

type BookingDetailsProps = {
  /** «Martes 24 de abril, 10:30», o «Sin horario elegido» en «Tu cita» sin hora. */
  when: string
  /** Término de la primera fila: «Cuándo»; «Nueva cita» en la reprogramación (02.8). */
  whenTerm?: string
  /** Tercera línea de la primera fila, en caption: «Antes: miércoles 16 de mayo, 09:30» (02.8). */
  previous?: string
  /** id de la primera fila: el envío la lleva en aria-describedby (las dos fechas, panel 02.0). */
  whenId?: string
  /** «30 minutos» */
  duration: string
  /** Clínica: nombre y, en una segunda línea, la dirección. */
  clinic: { name: string; address: string }
  /** Clase de elemento del padre (mezcla BEM): c-appointment-summary__details. */
  className?: string
}

// Datos de la cita (c-booking-details): Cuándo, Duración y Dónde en un <dl>.
// Patrón de pantalla, sin ser de los 34 (D5): lo comparten «Tu cita» (02.5) y
// la tarjeta de la confirmación previa (02.4), y lo reutilizan las vistas 3 y
// 4. El icono va dentro del <dt>: un div de dl solo admite dt y dd.
export default function BookingDetails({ when, whenTerm = 'Cuándo', previous, whenId, duration, clinic, className }: BookingDetailsProps) {
  return (
    <dl className={className ? `c-booking-details ${className}` : 'c-booking-details'}>
      <div className="c-booking-details__detail" id={whenId}>
        <dt className="c-booking-details__term">
          <Icon name="calendar-check" size={20} />
          <span>{whenTerm}</span>
        </dt>
        <dd className="c-booking-details__value">{when}</dd>
        {previous && <dd className="c-booking-details__previous">{previous}</dd>}
      </div>
      <div className="c-booking-details__detail">
        <dt className="c-booking-details__term">
          <Icon name="clock" size={20} />
          <span>Duración</span>
        </dt>
        <dd className="c-booking-details__value">{duration}</dd>
      </div>
      <div className="c-booking-details__detail c-booking-details__detail--place">
        <dt className="c-booking-details__term">
          <Icon name="map-pin" size={20} />
          <span>Dónde</span>
        </dt>
        <dd className="c-booking-details__value">{clinic.name}</dd>
        <dd className="c-booking-details__address">{clinic.address}</dd>
      </div>
    </dl>
  )
}
