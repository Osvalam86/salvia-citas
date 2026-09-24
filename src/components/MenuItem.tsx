import { useContext, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router'
import { MenuSelectContext } from './menuContext.ts'

// Enlace («Cuenta») o acción («Cerrar sesión»), nunca las dos.
type MenuItemProps = { children: ReactNode } & (
  | { href: string; onSelect?: never }
  | { onSelect: () => void; href?: never }
)

// UI/Menu Item: no es role="menuitem". El ítem es un <a> o un
// <button type="button"> con su semántica nativa. Nunca en rojo: «Cerrar
// sesión» no es destructivo.
export default function MenuItem(props: MenuItemProps) {
  const close = useContext(MenuSelectContext)

  if (props.href !== undefined) {
    return (
      <li>
        <RouterLink to={props.href} className="c-menu-item" onClick={close}>
          {props.children}
        </RouterLink>
      </li>
    )
  }

  const { onSelect } = props
  return (
    <li>
      <button
        type="button"
        className="c-menu-item"
        onClick={() => {
          close()
          onSelect()
        }}
      >
        {props.children}
      </button>
    </li>
  )
}
