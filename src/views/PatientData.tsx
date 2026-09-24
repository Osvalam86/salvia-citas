import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V3 · Datos del paciente (/especialistas/:slug/datos, D1). Provisional de T1:
// solo el h1; la vista llega en V3.
export default function PatientData() {
  return (
    <ViewLayout title="Tus datos" current="especialistas" currentKind="section">
      <PageHeader title="Tus datos" />
    </ViewLayout>
  )
}
