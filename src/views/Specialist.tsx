import { useLoaderData } from 'react-router'
import PageHeader from '../components/PageHeader.tsx'
import type { specialistLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

// V2 · reserva (/especialistas/:slug, D1). Provisional hasta V2a: h1 y título
// con el nombre del médico (su guarda lanza el 404 si el slug no existe).
export default function Specialist() {
  const { specialist } = useLoaderData<typeof specialistLoader>()

  return (
    <ViewLayout title={specialist.name} current="especialistas" currentKind="section">
      <PageHeader title={specialist.name} />
    </ViewLayout>
  )
}
