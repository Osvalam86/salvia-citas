import Icon from './Icon.tsx'

type BookingDetailsProps = {
  /** «Martes 24 de abril, 10:30», o «Sin horario elegido» en «Tu cita» sin hora. */
  when: string
  /** «30 minutos» */
  duration: string
  /** Clínica: nombre y, en una segunda línea, la dirección. */
  clinic: { name: string; address: string }
}

// Datos de la cita (c-booking-details): Cuándo, Duración y Dónde en un <dl>.
// Patrón de pantalla, sin ser de los 34 (D5): lo comparten «Tu cita» (02.5) y
// la tarjeta de la confirmación previa (02.4), y lo reutilizan las vistas 3 y
// 4. El icono va dentro del <dt>: un div de dl solo admite dt y dd.
export default function BookingDetails({ when, duration, clinic }: BookingDetailsProps) {
  return (
    <dl className="c-booking-details">
      <div className="c-booking-details__detail">
        <dt className="c-booking-details__term">
          <Icon name="calendar-check" size={20} />
          <span>Cuándo</span>
        </dt>
        <dd className="c-booking-details__value">{when}</dd>
      </div>
      <div className="c-booking-details__detail">
        <dt className="c-booking-details__term">
          <Icon name="clock" size={20} />
          <span>Duración</span>
        </dt>
        <dd className="c-booking-details__value">{duration}</dd>
      </div>
      <div className="c-booking-details__detail">
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
