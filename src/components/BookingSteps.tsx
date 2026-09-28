import Step from './Step.tsx'

const LABELS = ['Fecha y hora', 'Tus datos', 'Listo'] as const

type BookingStepsProps = {
  /** Paso actual (1 a 3): los anteriores van en Done y los siguientes en Upcoming. */
  current: 1 | 2 | 3
}

// Fila de pasos de la reserva: patrón de pantalla (descripción de UI/Step),
// sin bloque propio. <ol aria-label="Pasos de la reserva"> con gap space-4;
// la usan «Tu cita» (02.5), la confirmación previa (02.4) y las vistas 3 y 4.
export default function BookingSteps({ current }: BookingStepsProps) {
  return (
    <ol className="o-cluster o-cluster--gap-4 o-cluster--align-center" role="list" aria-label="Pasos de la reserva">
      {LABELS.map((label, index) => {
        const number = index + 1
        const state = number < current ? 'done' : number === current ? 'current' : 'upcoming'
        return <Step key={label} state={state} number={number} label={label} />
      })}
    </ol>
  )
}
