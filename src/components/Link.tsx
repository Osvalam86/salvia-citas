import type { MouseEventHandler, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'

type Common = {
  /** La etiqueta es el nombre accesible y dice adónde lleva. */
  children: ReactNode
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// Ruta interna. Nunca "#" solo: todo enlace lleva destino real.
type RouteLink = Common & { href: string; onClick?: never }

// Ancla (#id). `onClick` permite a la pantalla sustituir el salto nativo: el
// resumen de errores enfoca el control por script y desplaza su etiqueta, sin
// entrada de historial (diseño §5.3).
type AnchorLink = Common & { href: `#${string}`; onClick?: MouseEventHandler<HTMLAnchorElement> }

type LinkProps = RouteLink | AnchorLink

// UI/Link: enlace suelto de 48 de alto. Color y subrayado los pone la regla
// base de `a`; c-link aporta la caja. Un retroceso es BackLink, no este.
//
// Un ancla (#id) va en <a> nativo: el navegador mueve el punto de partida de
// la tabulación al destino y, si es enfocable, le da el foco. A través de
// React Router solo hace scroll.
export default function Link({ href, children, className, onClick }: LinkProps) {
  const classes = ['c-link', className].filter(Boolean).join(' ')

  if (href.startsWith('#')) {
    return (
      <a href={href} className={classes} onClick={onClick}>
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
