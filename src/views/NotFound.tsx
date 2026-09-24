import Link from '../components/Link.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { PATHS } from '../components/destinations.ts'
import ViewLayout from './ViewLayout.tsx'

// 404 (ruta «*», D1). En T2 también es el errorElement de las guardas que
// lanzan un 404 por slug o id desconocido.
export default function NotFound() {
  return (
    <ViewLayout title="No encontramos esta página" bottomNav>
      <PageHeader title="No encontramos esta página" />
      <p>
        <Link href={PATHS.especialistas}>Ir a Especialistas</Link>
      </p>
    </ViewLayout>
  )
}
