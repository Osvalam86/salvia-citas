import type { ReactNode } from 'react'
import AppLayout from '../components/AppLayout.tsx'
import BottomNav from '../components/BottomNav.tsx'
import HeaderDesktop from '../components/HeaderDesktop.tsx'
import HeaderMobile from '../components/HeaderMobile.tsx'
import type { HeaderDestination } from '../components/destinations.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'

type ViewLayoutProps = {
  /** Título de la pestaña (D15), sin el sufijo « · Salvia». */
  title: string
  /** Pestaña actual del header de escritorio (Figma, por pantalla). */
  current?: HeaderDestination
  /** «section» en una subpágina: Nav Link con aria-current="true". */
  currentKind?: 'page' | 'section'
  /**
   * Barra inferior bajo lg. Solo en los destinos de primer nivel y en las
   * páginas sin tarea (genérica, 404); las tareas de reserva no la llevan.
   * Marca su destino solo si la vista es ese destino (currentKind «page»).
   */
  bottomNav?: boolean
  children: ReactNode
}

// Chrome de cada vista (D7): el de escritorio desde lg y el móvil por debajo,
// uno solo en el DOM.
export default function ViewLayout({ title, current, currentKind = 'page', bottomNav = false, children }: ViewLayoutProps) {
  const isDesktop = useMediaQuery('lg')
  const header = isDesktop ? (
    <HeaderDesktop session="signed-in" userName="Karla Sánchez" current={current} currentKind={currentKind} />
  ) : (
    <HeaderMobile />
  )
  const bar = !isDesktop && bottomNav ? <BottomNav current={currentKind === 'page' ? current : undefined} /> : undefined

  return (
    <AppLayout header={header} bar={bar}>
      <title>{`${title} · Salvia`}</title>
      {children}
    </AppLayout>
  )
}
