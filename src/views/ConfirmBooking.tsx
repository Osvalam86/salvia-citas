import { useId } from 'react'
import { useLoaderData, useSearchParams } from 'react-router'
import ActionBar from '../components/ActionBar.tsx'
import AppointmentSummary from '../components/AppointmentSummary.tsx'
import BackLink from '../components/BackLink.tsx'
import BookingSteps from '../components/BookingSteps.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Button from '../components/Button.tsx'
import Notice from '../components/Notice.tsx'
import PageHeader from '../components/PageHeader.tsx'
import { dayTitle } from '../components/dates.ts'
import { BOOKING_DURATION, BOOKING_MODALITY, policyText } from '../data/booking.ts'
import { PHOTOS } from '../data/photos.ts'
import { carriedParams } from '../data/search.ts'
import { AREAS, CLINICS, shortName } from '../data/specialists.ts'
import useFocusFallback from '../hooks/useFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import type { bookingStepLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

const TITLE = 'Confirma tu cita'
const NOTE = 'Todavía no se reserva nada'

// V2 · confirmación previa (/especialistas/:slug/confirmar, D1; Figma 02.4).
// El equivalente móvil de «Tu cita»: resume la selección antes de «Tus
// datos». Solo navega (no hay formulario): «Cambiar fecha u hora» y
// «Continuar con tus datos» son enlaces con la selección, los parámetros de
// V1 y el escenario (D1, D8). «Cambiar» lleva el mismo href que el retroceso
// (panel 02.0).
//
// Existe en cualquier viewport, pero solo el «Continuar» de móvil lleva aquí.
// Desde lg (sin frame en Figma): la misma pantalla con el chrome de
// escritorio, breadcrumb de tres niveles, columna de 38rem y acciones
// intrínsecas; sin barra (las barras solo existen bajo lg), el envío va al
// final de main. Al cruzar lg cambian de control el retroceso y el envío
// (D7): el foco que cae en body va al h1.
export default function ConfirmBooking() {
  const { specialist, date, time } = useLoaderData<typeof bookingStepLoader>()
  const { slug } = specialist
  const isDesktop = useMediaQuery('lg')
  useFocusFallback(isDesktop)
  const [searchParams] = useSearchParams()
  const noteId = useId()

  const carried = carriedParams(searchParams)
  const backHref = carried.size ? `/?${carried}` : '/'
  const selection = new URLSearchParams(carried)
  selection.set('fecha', date.toString())
  selection.set('hora', time)
  const profileHref = `/especialistas/${slug}?${selection}`
  const doctor = shortName(specialist)
  const clinic = CLINICS[specialist.clinic]

  const submit = (
    <Button href={`/especialistas/${slug}/datos?${selection}`} aria-describedby={noteId}>
      Continuar con tus datos
    </Button>
  )

  return (
    <ViewLayout
      title={TITLE}
      current="especialistas"
      currentKind="section"
      bar={
        isDesktop ? undefined : (
          <ActionBar note={NOTE} noteId={noteId}>
            {submit}
          </ActionBar>
        )
      }
    >
      <PageHeader
        title={TITLE}
        back={
          isDesktop ? (
            <Breadcrumb
              levels={[
                { label: 'Especialistas', href: backHref },
                { label: doctor, href: profileHref },
              ]}
              current={TITLE}
            />
          ) : (
            <BackLink href={profileHref} className="c-page-header__back">
              {doctor}
            </BackLink>
          )
        }
        steps={<BookingSteps current={1} />}
      />

      <div className="c-booking-review o-stack o-stack--gap-6">
        <div className="o-stack o-stack--gap-4">
          <AppointmentSummary
            name={specialist.name}
            specialty={AREAS[specialist.area]}
            initial={specialist.initial}
            photo={PHOTOS[slug]}
            modality={BOOKING_MODALITY}
            when={`${dayTitle(date)}, ${time}`}
            duration={BOOKING_DURATION}
            clinic={clinic}
          />
          <Button variant="secondary" href={profileHref} className={isDesktop ? 'c-booking-review__action' : undefined}>
            Cambiar fecha u hora
          </Button>
        </div>
        <Notice tone="info" headingLevel={null} title="Antes de continuar" body={policyText({ date: date.toString(), time })} />
        {isDesktop && (
          <div className="c-booking-review__actions">
            {submit}
            <p className="c-booking-review__note" id={noteId}>
              {NOTE}
            </p>
          </div>
        )}
      </div>
    </ViewLayout>
  )
}
