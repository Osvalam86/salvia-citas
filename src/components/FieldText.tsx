import { useId, type ChangeEventHandler, type HTMLAttributes, type HTMLInputAutoCompleteAttribute } from 'react'
import Icon from './Icon.tsx'

type FieldTextProps = {
  /** Etiqueta visible, siempre encima del control. Marca «(opcional)» si lo es. */
  label: string
  name: string
  /** id del control (por defecto, useId): lo da la pantalla cuando un enlace apunta a él (resumen de errores). */
  id?: string
  /**
   * Propósito del campo (1.3.5): lo declara el autocompletado. Sin `email`
   * (7.6): un type="email" con un valor a medias es inválido para el
   * navegador, que lo expone al lector («entrada inválida») antes de enviar.
   * El correo va como text con inputMode="email" y autoComplete="email".
   */
  type?: 'text' | 'tel'
  autoComplete?: HTMLInputAutoCompleteAttribute
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  /** Para el correo: sin mayúscula inicial en el teclado de pantalla. */
  autoCapitalize?: 'none'
  /** Para el correo: sin corrector. */
  spellCheck?: boolean
  /**
   * Obligatorio: se expone con aria-required, no con required (7.6). El
   * required nativo deja el campo vacío en :invalid desde la carga, y el
   * navegador lo anuncia como «entrada inválida» antes del primer envío
   * aunque el form tenga noValidate; aria-invalid="false" no lo anula en
   * Firefox (7.4). La validación es al enviar (§3.4) y la marca aria-invalid
   * con error (DESIGN.md, desviación de semantic-markup).
   */
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
export default function FieldText({ label, hint, error, className, type = 'text', id: idProp, required, ...input }: FieldTextProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
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
          aria-required={required || undefined}
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
