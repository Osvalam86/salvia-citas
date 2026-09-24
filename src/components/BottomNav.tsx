import type { IconName } from './iconNames.ts'
import NavItem from './NavItem.tsx'
import { PATHS, type BottomNavDestination } from './destinations.ts'

type BottomNavProps = {
  /** Destino actual. Sin él, ninguno se marca. */
  current?: BottomNavDestination
}

const ITEMS: { key: BottomNavDestination; href: string; icon: IconName; label: string }[] = [
  { key: 'especialistas', href: PATHS.especialistas, icon: 'magnifying-glass', label: 'Especialistas' },
  { key: 'mis-citas', href: PATHS.misCitas, icon: 'calendar-check', label: 'Mis citas' },
  { key: 'cuenta', href: PATHS.fueraDeAlcance, icon: 'user', label: 'Cuenta' },
]

// UI/Bottom Nav: navegación principal por debajo de lg. Va en la barra de
// AppLayout (sticky, con la zona segura y el alto medido para el
// scroll-padding). Comparte nombre con la nav del header de escritorio porque
// nunca coexisten: D7 renderiza una sola.
export default function BottomNav({ current }: BottomNavProps) {
  return (
    <nav className="c-bottom-nav" aria-label="Principal">
      <ul className="o-wrapper c-bottom-nav__list" role="list">
        {ITEMS.map(({ key, href, icon, label }) => (
          <li className="c-bottom-nav__item" key={key}>
            <NavItem href={href} icon={icon} current={current === key} className="c-bottom-nav__link">
              {label}
            </NavItem>
          </li>
        ))}
      </ul>
    </nav>
  )
}
