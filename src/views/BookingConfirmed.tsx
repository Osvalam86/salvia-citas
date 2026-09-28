import { parseDate } from '@internationalized/date'
import { useLoaderData, useSearchParams } from 'react-router'
import ActionBar from '../components/ActionBar.tsx'
import AppointmentSummary from '../components/AppointmentSummary.tsx'
import BookingSteps from '../components/BookingSteps.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Button from '../components/Button.tsx'
import Notice from '../components/Notice.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { PATHS } from '../components/destinations.ts'
import { dayTitle } from '../components/dates.ts'
import { contactOf } from '../data/appointments.ts'
import { BOOKING_DURATION, BOOKING_MODALITY, nextStepsText } from '../data/booking.ts'
import { calendarFile, calendarFileName, calendarHref } from '../data/calendar.ts'
import { PHOTOS } from '../data/photos.ts'
import { carriedParams } from '../data/search.ts'
import { AREAS, CLINICS, shortName } from '../data/specialists.ts'
import useLgFocusFallback from '../hooks/useLgFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import type { confirmedLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

const LABEL = 'Cita reservada'

// V4 · confirmación (/citas/:id/confirmada, D1; Figma 04.1 y 04.4). Se llega
// con replace desde el envío de la vista 3; solo una cita Confirmada tiene
// confirmación (guarda en confirmedLoader). Sin Back Link en móvil: la reserva
// ya se envió (panel 04.0); desde lg, el breadcrumb solo navega.
//
// El correo de la nota y el recordatorio de «Qué sigue» salen de la cita
// (contactOf): el borrador de D17 ya se reinició al reservar.
//
// «Agregar a mi calendario» va en el resumen (`action`): fuera del marco y a
// ancho completo en móvil, dentro y con su ancho en escritorio, por container
// query (D7: es presentación). Cambian de control al cruzar lg los pasos
// (encabezado o columna), el retroceso, la barra y el sitio de «Qué sigue»: el
// foco que cae en body va al h1.
export default function BookingConfirmed() {
  const { appointment, specialist } = useLoaderData<typeof confirmedLoader>()
  const { slug } = specialist
  const isDesktop = useMediaQuery('lg')
  useLgFocusFallback(isDesktop)
  const [searchParams] = useSearchParams()

  // El breadcrumb conserva la consulta de V1 (D1) y lleva al perfil sin fecha
  // ni hora: con ellas preseleccionaría la hora ya reservada.
  const carried = carriedParams(searchParams)
  const query = carried.size ? `?${carried}` : ''
  const contact = contactOf(appointment)

  const calendar = (
    <Button
      variant="secondary"
      href={calendarHref(calendarFile(appointment, specialist))}
      download={calendarFileName(appointment)}
      className="c-appointment-summary__action"
    >
      Agregar a mi calendario<span className="u-sr-only"> (archivo .ics)</span>
    </Button>
  )
  const nextSteps = <Notice tone="info" headingLevel={2} title="Qué sigue" body={nextStepsText({ ...appointment, contact })} />
  const viewAppointments = <Button href={PATHS.misCitas}>Ver mis citas</Button>
  const steps = <BookingSteps current={3} />

  return (
    <ViewLayout
      title={LABEL}
      current="especialistas"
      currentKind="section"
      bar={isDesktop ? undefined : <ActionBar>{viewAppointments}</ActionBar>}
    >
      <PageHeader
        title="Tu cita está reservada"
        subtitle={`Enviamos la confirmación a ${contact.email}`}
        success
        back={
          isDesktop ? (
            <Breadcrumb
              levels={[
                { label: 'Especialistas', href: `${PATHS.especialistas}${query}` },
                { label: shortName(specialist), href: `/especialistas/${slug}${query}` },
              ]}
              current={LABEL}
            />
          ) : undefined
        }
        steps={isDesktop ? undefined : steps}
      />

      <div className="o-layout o-layout--aside-end">
        <AppointmentSummary
          name={specialist.name}
          specialty={AREAS[specialist.area]}
          initial={specialist.initial}
          photo={PHOTOS[slug]}
          modality={BOOKING_MODALITY}
          when={`${dayTitle(parseDate(appointment.date))}, ${appointment.time}`}
          duration={BOOKING_DURATION}
          clinic={CLINICS[specialist.clinic]}
          action={calendar}
        />
        {isDesktop ? (
          <div className="c-booking-summary">
            {steps}
            {nextSteps}
            <div className="c-booking-summary__actions">{viewAppointments}</div>
          </div>
        ) : (
          nextSteps
        )}
      </div>
    </ViewLayout>
  )
}
