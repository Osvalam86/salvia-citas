import type { ChangeEventHandler } from 'react'

type RadioProps = {
  label: string
  /** El grupo: todos los radios de un fieldset comparten name. */
  name: string
  value: string
  checked?: boolean
  defaultChecked?: boolean
  onChange?: ChangeEventHandler<HTMLInputElement>
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Radio: opción de un grupo en <fieldset> con UI/Legend. Todo grupo parte
// de una opción seleccionada, así que no hay error. Flechas y Tab, nativos.
export default function Radio({ label, className, ...input }: RadioProps) {
  const classes = ['c-radio', className].filter(Boolean).join(' ')

  return (
    <label className={classes}>
      <span className="c-radio__circle">
        <input {...input} type="radio" className="c-radio__input" />
        <span className="c-radio__dot" />
      </span>
      <span className="c-radio__label">{label}</span>
    </label>
  )
}
