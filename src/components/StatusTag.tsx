import Icon from './Icon.tsx'
import type { IconName } from './iconNames.ts'

// Etiqueta y glifo portan el estado y van fijos: sin props de texto ni icono.
const STATUS = {
  confirmed: { label: 'Confirmada', icon: 'check-circle' },
  pending: { label: 'Por confirmar', icon: 'hourglass' },
  past: { label: 'Realizada', icon: 'check' },
  cancelled: { label: 'Cancelada', icon: 'x-circle' },
} as const satisfies Record<string, { label: string; icon: IconName }>

type StatusTagProps = {
  status: keyof typeof STATUS
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Status Tag: estado de una cita, no interactivo. El texto visible es el
// estado; el icono es decorativo.
export default function StatusTag({ status, className }: StatusTagProps) {
  const { label, icon } = STATUS[status]
  const classes = ['c-status-tag', `c-status-tag--${status}`, className].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      <Icon name={icon} size={20} className="c-status-tag__icon" />
      {label}
    </span>
  )
}
