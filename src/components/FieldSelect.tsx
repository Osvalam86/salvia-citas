import { useId, type ChangeEventHandler } from 'react'
import Icon from './Icon.tsx'

type FieldSelectProps = {
  /** Etiqueta visible, siempre encima del control. */
  label: string
  name: string
  options: readonly { value: string; label: string }[]
  /**
   * Texto de la opción vacía (`value=""`), una opción real que se envía y que
   * la validación trata como vacía (§3.4). Sin ella, el select siempre tiene
   * valor (Ordenar por).
   */
  placeholder?: string
  required?: boolean
  value?: string
  defaultValue?: string
  onChange?: ChangeEventHandler<HTMLSelectElement>
  hint?: string
  /** Mensaje de error: sustituye a la pista en su sitio y marca aria-invalid. */
  error?: string
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Field/Select: <select> nativo con appearance: none. Chevron y aviso
// son decorativos y no capturan el clic. Bloque c-field (DESIGN.md, D5).
export default function FieldSelect({
  label,
  options,
  placeholder,
  hint,
  error,
  className,
  ...select
}: FieldSelectProps) {
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
        <select
          {...select}
          id={id}
          className="c-field__select"
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
        >
          {placeholder !== undefined && (
            <option className="c-field__option" value="">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option className="c-field__option" value={option.value} key={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="c-field__adornments" aria-hidden="true">
          {error && <Icon name="warning-circle" size={20} className="c-field__error-icon" />}
          <Icon name="caret-down" size={20} />
        </span>
      </div>
      {message && (
        <p className="c-field__message" id={messageId}>
          {message}
        </p>
      )}
    </div>
  )
}
