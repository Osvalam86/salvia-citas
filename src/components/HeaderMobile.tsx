import NavLink from './NavLink.tsx'
import Wordmark from './Wordmark.tsx'
import { PATHS } from './destinations.ts'

// UI/Header/Mobile: wordmark y «Ayuda». La navegación principal y la cuenta
// viven en la barra inferior, así que aquí no hay <nav>: «Ayuda» es un Nav
// Link suelto. Pieza a sangre: el interior reutiliza o-wrapper.
export default function HeaderMobile() {
  return (
    <header className="c-header-mobile">
      <div className="o-wrapper c-header-mobile__inner">
        <Wordmark />
        <NavLink href={PATHS.fueraDeAlcance} className="c-header-mobile__help">
          Ayuda
        </NavLink>
      </div>
    </header>
  )
}
