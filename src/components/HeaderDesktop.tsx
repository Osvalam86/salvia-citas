import { useNavigate } from 'react-router'
import useDisclosure from '../hooks/useDisclosure.ts'
import Button from './Button.tsx'
import Menu from './Menu.tsx'
import MenuItem from './MenuItem.tsx'
import NavLink from './NavLink.tsx'
import Wordmark from './Wordmark.tsx'
import { PATHS, type HeaderDestination } from './destinations.ts'

type HeaderDesktopProps = {
  /** Pestaña actual. La decide la vista: la reprogramación marca «Mis citas». */
  current?: HeaderDestination
} & ({ session: 'guest'; userName?: never } | { session: 'signed-in'; userName: string })

const LINKS: { key: HeaderDestination | 'ayuda'; href: string; label: string }[] = [
  { key: 'especialistas', href: PATHS.especialistas, label: 'Especialistas' },
  { key: 'mis-citas', href: PATHS.misCitas, label: 'Mis citas' },
  { key: 'ayuda', href: PATHS.fueraDeAlcance, label: 'Ayuda' },
]

// Menú de cuenta (Session=Signed-in): disclosure, sin aria-haspopup (con
// «menu», el lector anunciaría un menú de flechas que no existe). El caret
// cambia de instancia al abrir, como en la pantalla 04.7.
function AccountMenu({ userName }: { userName: string }) {
  const { open, toggle, close, panelId, groupRef, triggerRef } = useDisclosure()
  const navigate = useNavigate()

  return (
    <div className="c-header-desktop__account" ref={groupRef}>
      <Button
        ref={triggerRef}
        variant="secondary"
        trailingIcon={open ? 'caret-up' : 'caret-down'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
      >
        {userName}
      </Button>
      <Menu id={panelId} open={open} onSelect={close} className="c-header-desktop__menu">
        <MenuItem href={PATHS.fueraDeAlcance}>Cuenta</MenuItem>
        <MenuItem onSelect={() => navigate(PATHS.fueraDeAlcance)}>Cerrar sesión</MenuItem>
      </Menu>
    </div>
  )
}

// UI/Header/Desktop, desde lg (D7: por debajo, HeaderMobile y BottomNav).
export default function HeaderDesktop(props: HeaderDesktopProps) {
  return (
    <header className="c-header-desktop">
      <div className="o-wrapper c-header-desktop__inner">
        <div className="c-header-desktop__brand">
          <Wordmark />
          <nav className="c-header-desktop__nav" aria-label="Principal">
            <ul className="c-header-desktop__links" role="list">
              {LINKS.map(({ key, href, label }) => (
                <li className="c-header-desktop__item" key={key}>
                  <NavLink href={href} current={props.current === key} className="c-header-desktop__link">
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="c-header-desktop__actions">
          {props.session === 'guest' ? (
            <>
              <Button variant="secondary" href={PATHS.fueraDeAlcance}>
                Iniciar sesión
              </Button>
              <Button href={PATHS.fueraDeAlcance}>Crear cuenta</Button>
            </>
          ) : (
            <AccountMenu userName={props.userName} />
          )}
        </div>
      </div>
    </header>
  )
}
