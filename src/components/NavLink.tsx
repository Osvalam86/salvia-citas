import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'

type NavLinkProps = {
  href: string
  /**
   * Destino actual, con tres señales (peso, tinta, barra). «page» cuando el
   * enlace lleva a la página en la que se está (aria-current="page");
   * «section» en una subpágina de ese destino (aria-current="true"): el
   * perfil del médico cuelga de Especialistas, la reprogramación de Mis citas.
   */
  current?: 'page' | 'section'
  /** Clase de elemento del padre para colocarlo (mezcla BEM): alto y anillo en el header. */
  className?: string
  children: ReactNode
}

// UI/Nav Link: enlace de la navegación principal. Si es el actual lo dice la
// prop, no la ruta: cada vista sabe qué pestaña marca (la reprogramación
// cuelga de Mis citas aunque su ruta sea otra).
export default function NavLink({ href, current, className, children }: NavLinkProps) {
  const classes = ['c-nav-link', className].filter(Boolean).join(' ')
  const ariaCurrent = current === 'section' ? 'true' : current

  return (
    <RouterLink to={href} className={classes} aria-current={ariaCurrent}>
      {children}
    </RouterLink>
  )
}
