import { parseDate } from '@internationalized/date'
import { useId, useState } from 'react'
import { useLoaderData, useNavigate } from 'react-router'
import Avatar from '../components/Avatar.tsx'
import BackLink from '../components/BackLink.tsx'
import BookingBar, { type BookingBarProps } from '../components/BookingBar.tsx'
import BookingDetails from '../components/BookingDetails.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Button from '../components/Button.tsx'
import Icon from '../components/Icon.tsx'
import Notice from '../components/Notice.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SlotPicker from '../components/SlotPicker.tsx'
import { PATHS } from '../components/destinations.ts'
import { shortDate } from '../components/dates.ts'
import { appointmentStore, rescheduleCopy } from '../data/appointments.ts'
import { bookableUntil, rescheduleStartDate } from '../data/availability.ts'
import { BOOKING_DURATION, BOOKING_META } from '../data/booking.ts'
import { PHOTOS } from '../data/photos.ts'
import { CITY, CLINICS, MODALITIES, shortName } from '../data/specialists.ts'
import useFocusFallback from '../hooks/useFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import type { FocusState } from '../hooks/useRouteFocus.ts'
import useSlotPicker from '../hooks/useSlotPicker.ts'
import type { rescheduleLoader } from './loaders.ts'
import { NOTICE_TITLE_ID } from './MyAppointments.tsx'
import ViewLayout from './ViewLayout.tsx'

// V4b · reprogramación (/mis-citas/:id/reprogramar, D1; Figma 02.7 y 02.8).
// Un modo de la vista 2, no una pantalla nueva: compone el mismo SlotPicker
// (D3) y pone fuera lo que cambia. Cuelga de Mis citas: Back Link «Mis citas»
// en móvil, breadcrumb «Mis citas / Dr. Cortés» y la pestaña «Mis citas»
// como sección en escritorio. Sin pasos (salta la vista 3) ni barra inferior.
//
// Las dos fechas antes del envío (panel 02.0): en móvil, la placa Info «Tu
// cita actual» tras el encabezado; en escritorio, la fila «Nueva cita» de «El
// cambio» con su línea «Antes:». El envío «Confirmar hora» las lleva en
// aria-describedby. El día de la cita actual no se marca en el selector: el
// selector nunca la recibe.
//
// La cita sale del loader, sin suscribirse al almacén: la reprogramación
// cambia el almacén justo antes de navegar y la página no debe volver a
// pintarse con la fecha nueva.

export default function Reschedule() {
  const { appointment, specialist } = useLoaderData<typeof rescheduleLoader>()
  const { slug } = specialist
  const isDesktop = useMediaQuery('lg')
  const navigate = useNavigate()
  const maxValue = bookableUntil(specialist)
  const picker = useSlotPicker({ slug, maxValue, initialDate: rescheduleStartDate(slug, parseDate(appointment.date)) })

  // Al cruzar lg cambian de control el retroceso, la placa, la tira y el
  // calendario, la barra y «El cambio» (D7): el foco que cae en body va al h1.
  useFocusFallback(isDesktop)

  const [missing, setMissing] = useState(false)
  const formId = useId()
  const messageId = useId()
  const currentId = useId()
  const whenId = useId()
  const titleId = useId()

  const copy = rescheduleCopy(appointment, { date: picker.date.toString(), time: picker.time })
  const clinic = CLINICS[specialist.clinic]

  // «Confirmar hora» con hora elegida (sin hora, SlotPicker pasa a Missing):
  // reprograma en el almacén, que deja el aviso de un solo uso (D13), y vuelve
  // a Mis citas con replace (Atrás no vuelve a una reprogramación ya hecha) y
  // el foco en el título del aviso (location.state.focus, D12). Sin diálogo:
  // reprogramar no es destructivo (diseño §5.4).
  const submit = () => {
    if (!picker.time) return
    appointmentStore.reschedule(appointment.id, picker.date.toString(), picker.time)
    const state: FocusState = { focus: NOTICE_TITLE_ID }
    navigate(PATHS.misCitas, { replace: true, state })
  }

  let bar: BookingBarProps = { selection: 'none', fullDay: picker.full, formId, submitLabel: 'Confirmar hora', describedBy: currentId }
  if (picker.time) bar = { selection: 'chosen', summary: `${shortDate(picker.date)} · ${picker.time}`, meta: BOOKING_META, formId, submitLabel: 'Confirmar hora', describedBy: currentId }
  else if (missing) bar = { selection: 'missing', messageId, formId, submitLabel: 'Confirmar hora', describedBy: currentId }

  // «El cambio» (02.8): una <section> dentro del form, no un <aside>, porque
  // contiene el envío (panel 02.0, como «Tu cita»). Sin pasos y sin nota; en
  // Missing, el mismo mensaje que en la reserva.
  const change = (
    <section className="c-booking-summary" aria-labelledby={titleId}>
      <div className="c-booking-summary__card">
        <h2 className="c-booking-summary__title" id={titleId}>
          El cambio
        </h2>
        <BookingDetails
          when={copy.when}
          whenTerm="Nueva cita"
          previous={copy.previous}
          whenId={whenId}
          duration={BOOKING_DURATION}
          clinic={clinic}
        />
      </div>
      <Notice tone="info" headingLevel={null} title="Al confirmar" body={copy.policy} />
      <div className="c-booking-summary__actions">
        <Button type="submit" aria-describedby={missing ? messageId : whenId}>
          Confirmar hora
        </Button>
        {missing && (
          <p className="c-booking-summary__message" id={messageId}>
            <Icon name="warning-circle" size={20} />
            <span>Elige un horario primero</span>
          </p>
        )}
      </div>
    </section>
  )

  return (
    <ViewLayout
      title={`Reprogramar cita · ${specialist.name}`}
      current="mis-citas"
      currentKind="section"
      bar={isDesktop ? undefined : <BookingBar {...bar} />}
    >
      <PageHeader
        title={specialist.name}
        back={
          isDesktop ? (
            <Breadcrumb levels={[{ label: 'Mis citas', href: PATHS.misCitas }]} current={shortName(specialist)} />
          ) : (
            <BackLink href={PATHS.misCitas} className="c-page-header__back">
              Mis citas
            </BackLink>
          )
        }
        profile={{
          avatar: (
            <Avatar
              size={isDesktop ? 'large' : 'medium'}
              initial={specialist.initial}
              photo={PHOTOS[slug]}
              sizes="(min-width: 64rem) 6rem, 4rem"
              className="c-page-header__avatar"
            />
          ),
          specialty: specialist.specialtyLine,
          location: `${clinic.name} · ${CITY}`,
          modality: MODALITIES[specialist.modality],
        }}
      />

      {/* Contexto estático (Info): sin rol ni foco, título nominal sin encabezado (C2). */}
      {!isDesktop && (
        <div id={currentId}>
          <Notice tone="info" headingLevel={null} icon="calendar-check" title="Tu cita actual" body={copy.current} />
        </div>
      )}

      <SlotPicker
        picker={picker}
        specialist={specialist}
        maxValue={maxValue}
        formId={formId}
        onSubmit={submit}
        missing={missing}
        onMissingChange={setMissing}
        messageId={messageId}
        aside={change}
      />
    </ViewLayout>
  )
}
