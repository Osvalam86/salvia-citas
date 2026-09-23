import Icon from './Icon.tsx'

type StepProps = {
  state: 'done' | 'current' | 'upcoming'
  number: number
  label: string
}

// Texto oculto por estado: Current lo dice aria-current="step".
const HIDDEN = { done: ', completado', current: null, upcoming: ', pendiente' } as const

// UI/Step: un <li> de la fila de pasos, que es patrón de pantalla
// (<ol aria-label="Pasos de la reserva">). No interactivo. El número y el
// check son decorativos: la posición la da el propio <ol>.
export default function Step({ state, number, label }: StepProps) {
  const hidden = HIDDEN[state]

  return (
    <li className={`c-step c-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
      <span className="c-step__marker" aria-hidden="true">
        {state === 'done' ? <Icon name="check" size={20} /> : number}
      </span>
      <span className="c-step__label">
        {label}
        {hidden && <span className="u-sr-only">{hidden}</span>}
      </span>
    </li>
  )
}
