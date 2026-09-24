import PageHeader from '../components/PageHeader.tsx'
import ViewLayout from './ViewLayout.tsx'

// V4 · confirmación (/citas/:id/confirmada, D1). Provisional de T1: solo el
// h1; la vista llega en V4a.
export default function BookingConfirmed() {
  return (
    <ViewLayout title="Cita reservada" current="especialistas" currentKind="section">
      <PageHeader title="Tu cita está reservada" />
    </ViewLayout>
  )
}
