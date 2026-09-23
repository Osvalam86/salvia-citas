import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'

type LinkProps = {
  /** Ruta interna o ancla. Nunca "#" solo: todo enlace lleva destino real. */
  href: string
  /** La etiqueta es el nombre accesible y dice adónde lleva. */
  children: ReactNode
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Link: enlace suelto de 48 de alto. Color y subrayado los pone la regla
// base de `a`; c-link aporta la caja. Un retroceso es BackLink, no este.
//
// Un ancla (#id) va en <a> nativo: el navegador mueve el punto de partida de
// la tabulación al destino y, si es enfocable, le da el foco (enlaces del
// resumen de errores). A través de React Router solo hace scroll.
export default function Link({ href, children, className }: LinkProps) {
  const classes = ['c-link', className].filter(Boolean).join(' ')

  if (href.startsWith('#')) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <RouterLink to={href} className={classes}>
      {children}
    </RouterLink>
  )
}
