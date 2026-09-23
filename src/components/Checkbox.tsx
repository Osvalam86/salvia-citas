import { useId, type ChangeEventHandler, type ReactNode } from 'react'
import Icon from './Icon.tsx'

type CheckboxProps = {
  /** Nombre accesible. Sin enlaces dentro: pulsarlos cambiaría el estado. */
  label: ReactNode
  name?: string
  value?: string
  checked?: boolean
  defaultChecked?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  required?: boolean
  /** Mensaje bajo la etiqueta, fuera del <label>: descripción, no nombre. */
  hint?: string
  /**
   * Error (caso «debes aceptar»): sustituye a la pista y marca aria-invalid.
   * Marcada y con error a la vez, la caja se pinta marcada y el mensaje sigue
   * en error hasta que la pantalla lo retire (cuándo, se decide en la fase 5).
   */
  error?: string
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Checkbox: <label> que envuelve el input nativo y el texto; toda la fila
// es área de clic. El input sigue siendo el control real, invisible sobre la
// caja dibujada.
export default function Checkbox({ label, hint, error, className, ...input }: CheckboxProps) {
  const messageId = `${useId()}-mensaje`
  const message = error ?? hint
  const classes = ['c-checkbox', message && 'c-checkbox--with-message', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="c-checkbox__row">
        <span className="c-checkbox__box">
          <input
            {...input}
            type="checkbox"
            className="c-checkbox__input"
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
          />
          <Icon name="check" size={20} className="c-checkbox__check" />
        </span>
        <span className="c-checkbox__label">{label}</span>
      </label>
      {message && (
        <p className="c-checkbox__message" id={messageId}>
          {error && <Icon name="warning-circle" size={20} className="c-checkbox__error-icon" />}
          <span className="c-checkbox__message-text">{message}</span>
        </p>
      )}
    </div>
  )
}
