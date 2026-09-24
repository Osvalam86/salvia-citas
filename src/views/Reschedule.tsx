import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V4b · reprogramación (/mis-citas/:id/reprogramar, D1). Cuelga de Mis citas
// (pestaña actual como subpágina). Provisional de T1: h1 y título sin datos;
// T2 añade el nombre del médico y la vista llega en V4b.
export default function Reschedule() {
  return (
    <ViewLayout title="Reprogramar cita" current="mis-citas" currentKind="section">
      <PageHeader title="Reprogramar cita" />
    </ViewLayout>
  )
}
