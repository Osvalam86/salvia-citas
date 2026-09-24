import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'

type NavLinkProps = {
  href: string
  /** Destino actual: aria-current="page" y tres señales (peso, tinta, barra). */
  current?: boolean
  /** Clase de elemento del padre para colocarlo (mezcla BEM): alto y anillo en el header. */
  className?: string
  children: ReactNode
}

// UI/Nav Link: enlace de la navegación principal. Si es el actual lo dice la
// prop, no la ruta: cada vista sabe qué pestaña marca (la reprogramación
// cuelga de Mis citas aunque su ruta sea otra).
export default function NavLink({ href, current = false, className, children }: NavLinkProps) {
  const classes = ['c-nav-link', className].filter(Boolean).join(' ')

  return (
    <RouterLink to={href} className={classes} aria-current={current ? 'page' : undefined}>
      {children}
    </RouterLink>
  )
}
