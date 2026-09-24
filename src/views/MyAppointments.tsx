import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V4 · Mis citas (/mis-citas, D1). Provisional de T1: solo el h1; la vista
// llega en V4a.
export default function MyAppointments() {
  return (
    <ViewLayout title="Mis citas" current="mis-citas" bottomNav>
      <PageHeader title="Mis citas" />
    </ViewLayout>
  )
}
