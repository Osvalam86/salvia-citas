import Link from '../components/Link.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { PATHS } from '../components/destinations.ts'
import ViewLayout from './ViewLayout.tsx'

// Página genérica (/fuera-de-alcance, diseño §7.1): destino de Ayuda, Cuenta,
// Iniciar sesión, Crear cuenta, Cerrar sesión y el aviso de privacidad. Sin
// pestaña actual: ninguna lleva aquí como destino propio.
export default function OutOfScope() {
  return (
    <ViewLayout title="Fuera del caso de estudio" bottomNav>
      <PageHeader title="Esta sección no forma parte del caso de estudio" />
      <p>
        <Link href={PATHS.especialistas}>Ir a Especialistas</Link>
      </p>
    </ViewLayout>
  )
}
