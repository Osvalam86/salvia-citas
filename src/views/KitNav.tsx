import { useSearchParams } from 'react-router'
import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import BackLink from '../components/BackLink.tsx'
import BottomNav from '../components/BottomNav.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import HeaderDesktop from '../components/HeaderDesktop.tsx'
import HeaderMobile from '../components/HeaderMobile.tsx'
import Link from '../components/Link.tsx'
import type { BottomNavDestination } from '../components/destinations.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'

// Demo del chrome real en el catálogo (D9): D7 renderiza un solo chrome, el
// de escritorio desde lg y el móvil (header + barra inferior) por debajo. El
// breadcrumb, solo en escritorio (diseño §4.3).
// Parámetros:
// - sesion=invitado|iniciada: variante Session del header de escritorio.
// - actual=especialistas|mis-citas|cuenta: destino marcado («cuenta» solo
//   existe en la barra inferior).

const DESTINATIONS: BottomNavDestination[] = ['especialistas', 'mis-citas', 'cuenta']
const fillerItems = Array.from({ length: 20 }, (_, index) => index + 1)

export default function KitNav() {
  const [params] = useSearchParams()
  const isDesktop = useMediaQuery('lg')
  const guest = params.get('sesion') === 'invitado'
  const actual = DESTINATIONS.find((d) => d === params.get('actual')) ?? 'especialistas'
  const headerCurrent = actual === 'cuenta' ? undefined : actual

  let header
  if (!isDesktop) header = <HeaderMobile />
  else if (guest) header = <HeaderDesktop session="guest" current={headerCurrent} />
  else header = <HeaderDesktop session="signed-in" userName="Karla Sánchez" current={headerCurrent} />

  return (
    <AppLayout header={header} bar={isDesktop ? undefined : <BottomNav current={actual} />}>
      <div className="c-kit">
        <div className="o-stack o-stack--gap-4">
          {isDesktop && (
            <Breadcrumb
              levels={[
                { label: 'Kit del sistema', href: '/kit' },
                { label: 'Navegación', href: '/kit#kit-navegacion' },
              ]}
              current="Chrome real"
            />
          )}
          <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
            Navegación · {isDesktop ? 'escritorio' : 'móvil'}
          </h1>
          <p>
            <BackLink href="/kit">Kit del sistema</BackLink>
          </p>
        </div>
        <section className="c-kit__section" aria-labelledby="kit-nav-variantes">
          <h2 className="c-kit__heading" id="kit-nav-variantes">
            Variantes
          </h2>
          <ul className="o-stack o-stack--gap-2" role="list">
            <li>
              <Link href="/kit/navegacion?sesion=iniciada&actual=especialistas">Sesión iniciada · Especialistas</Link>
            </li>
            <li>
              <Link href="/kit/navegacion?sesion=iniciada&actual=mis-citas">Sesión iniciada · Mis citas</Link>
            </li>
            <li>
              <Link href="/kit/navegacion?sesion=invitado&actual=especialistas">Invitado · Especialistas</Link>
            </li>
            <li>
              <Link href="/kit/navegacion?sesion=iniciada&actual=cuenta">Cuenta (solo en la barra inferior)</Link>
            </li>
          </ul>
        </section>
        <section className="c-kit__section" aria-labelledby="kit-nav-relleno">
          <h2 className="c-kit__heading" id="kit-nav-relleno">
            Contenido de relleno
          </h2>
          <p>Para comprobar que la barra inferior sigue al pie y que el foco nunca queda debajo.</p>
          {fillerItems.map((item) => (
            <button type="button" key={item}>
              {item === fillerItems.length ? 'Último elemento de la página' : `Relleno ${item}`}
            </button>
          ))}
        </section>
      </div>
    </AppLayout>
  )
}
