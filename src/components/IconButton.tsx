import type { MouseEventHandler } from 'react'
import Icon from './Icon.tsx'
import type { IconName } from './iconNames.ts'

type IconButtonProps = {
  icon: IconName
  /** Nombre accesible («Cerrar», «Mes siguiente»): el icono es decorativo. */
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Icon Button: 48 × 48, icono de 24, solo variante Ghost.
export default function IconButton({ icon, label, onClick, className }: IconButtonProps) {
  const classes = ['c-icon-button', className].filter(Boolean).join(' ')

  return (
    <button type="button" className={classes} aria-label={label} onClick={onClick}>
      <Icon name={icon} size={24} />
    </button>
  )
}
