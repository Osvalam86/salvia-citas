import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V2 · reserva (/especialistas/:slug, D1). Provisional de T1: h1 y título sin
// datos; T2 los sustituye por el nombre del médico y la vista llega en V2a.
export default function Specialist() {
  return (
    <ViewLayout title="Perfil del especialista" current="especialistas" currentKind="section">
      <PageHeader title="Perfil del especialista" />
    </ViewLayout>
  )
}
