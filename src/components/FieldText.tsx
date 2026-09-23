import { useId, type ChangeEventHandler, type HTMLAttributes, type HTMLInputAutoCompleteAttribute } from 'react'
import Icon from './Icon.tsx'

type FieldTextProps = {
  /** Etiqueta visible, siempre encima del control. Marca «(opcional)» si lo es. */
  label: string
  name: string
  /** Propósito del campo (1.3.5): el tipo y el autocompletado lo declaran. */
  type?: 'text' | 'email' | 'tel'
  autoComplete?: HTMLInputAutoCompleteAttribute
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  /** Semántica de obligatorio. La validación es al enviar (form noValidate). */
  required?: boolean
  /** Solo un ejemplo: todo requisito o formato va en `hint`. */
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Pista bajo el control. */
  hint?: string
  /** Mensaje de error: sustituye a la pista en su sitio y marca aria-invalid. */
  error?: string
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Field/Text. Bloque c-field, compartido con FieldSelect (DESIGN.md, D5).
export default function FieldText({ label, hint, error, className, type = 'text', ...input }: FieldTextProps) {
  const id = useId()
  const messageId = `${id}-mensaje`
  const message = error ?? hint
  const classes = ['c-field', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <label className="c-field__label" htmlFor={id}>
        {label}
      </label>
      <div className="c-field__control">
        <input
          {...input}
          id={id}
          type={type}
          className="c-field__input"
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
        />
        {error && (
          <span className="c-field__adornments" aria-hidden="true">
            <Icon name="warning-circle" size={20} className="c-field__error-icon" />
          </span>
        )}
      </div>
      {message && (
        <p className="c-field__message" id={messageId}>
          {message}
        </p>
      )}
    </div>
  )
}
