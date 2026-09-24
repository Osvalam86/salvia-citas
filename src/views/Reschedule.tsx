import { useLoaderData } from 'react-router'
import PageHeader from '../components/PageHeader.tsx'
import type { rescheduleLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

// V4b · reprogramación (/mis-citas/:id/reprogramar, D1). Cuelga de Mis citas
// (pestaña actual como subpágina). Provisional hasta V4b: h1 con el nombre del
// médico (Figma 02.7) y su título de D15.
export default function Reschedule() {
  const { specialist } = useLoaderData<typeof rescheduleLoader>()

  return (
    <ViewLayout title={`Reprogramar cita · ${specialist.name}`} current="mis-citas" currentKind="section">
      <PageHeader title={specialist.name} />
    </ViewLayout>
  )
}
