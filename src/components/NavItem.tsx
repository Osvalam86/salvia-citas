import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import Icon from './Icon.tsx'
import type { IconName } from './iconNames.ts'

type NavItemProps = {
  href: string
  /** Icono de 24, decorativo: el nombre accesible es siempre la etiqueta. */
  icon: IconName
  /** Destino actual: aria-current="page" y cuatro señales (peso, tinta en etiqueta e icono, barra). */
  current?: boolean
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
  children: ReactNode
}

// UI/Nav Item: destino de la barra inferior. Es el <a>; el <li> lo pone
// BottomNav.
export default function NavItem({ href, icon, current = false, className, children }: NavItemProps) {
  const classes = ['c-nav-item', className].filter(Boolean).join(' ')

  return (
    <RouterLink to={href} className={classes} aria-current={current ? 'page' : undefined}>
      <Icon name={icon} size={24} />
      <span className="c-nav-item__label">{children}</span>
    </RouterLink>
  )
}
