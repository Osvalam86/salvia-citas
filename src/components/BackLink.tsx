import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import Icon from './Icon.tsx'

type BackLinkProps = {
  /** Destino con la consulta conservada; nunca history.back(). */
  href: string
  /** Nombre del destino («Especialistas», «Tu cita»): es el nombre accesible. */
  children: ReactNode
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Back Link: retroceso de móvil, primer elemento de main, antes del h1.
export default function BackLink({ href, children, className }: BackLinkProps) {
  const classes = ['c-back-link', className].filter(Boolean).join(' ')

  return (
    <RouterLink to={href} className={classes}>
      <Icon name="caret-left" size={20} />
      {children}
    </RouterLink>
  )
}
