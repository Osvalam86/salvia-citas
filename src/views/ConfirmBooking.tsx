import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V2 · confirmación previa (/especialistas/:slug/confirmar, D1). Provisional
// de T1: solo el h1; la vista llega en V2b.
export default function ConfirmBooking() {
  return (
    <ViewLayout title="Confirma tu cita" current="especialistas" currentKind="section">
      <PageHeader title="Confirma tu cita" />
    </ViewLayout>
  )
}
