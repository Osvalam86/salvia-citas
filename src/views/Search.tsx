import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V1 · Búsqueda (/, D1). Provisional de T1: solo el h1; la vista llega en V1a.
export default function Search() {
  return (
    <ViewLayout title="Especialistas" current="especialistas" bottomNav>
      <PageHeader title="Encuentra a tu especialista" />
    </ViewLayout>
  )
}
