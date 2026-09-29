import type { CalendarDate } from '@internationalized/date'
import { useId, useState } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import Avatar from '../components/Avatar.tsx'
import BackLink from '../components/BackLink.tsx'
import BookingBar, { type BookingBarProps } from '../components/BookingBar.tsx'
import BookingDetails from '../components/BookingDetails.tsx'
import BookingSteps from '../components/BookingSteps.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Icon from '../components/Icon.tsx'
import Notice from '../components/Notice.tsx'
import Button from '../components/Button.tsx'
import PageHeader from '../components/PageHeader.tsx'
import SlotPicker from '../components/SlotPicker.tsx'
import { dayTitle, shortDate } from '../components/dates.ts'
import { bookableUntil } from '../data/availability.ts'
import { BOOKING_DURATION, BOOKING_META, policyText } from '../data/booking.ts'
import { PHOTOS } from '../data/photos.ts'
import { carriedParams } from '../data/search.ts'
import { CITY, CLINICS, MODALITIES, shortName } from '../data/specialists.ts'
import useFocusFallback from '../hooks/useFocusFallback.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import useSlotPicker from '../hooks/useSlotPicker.ts'
import type { specialistLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

// V2 · reserva (/especialistas/:slug, D1; Figma 02.1–02.3, 02.5, 02.6). El
// selector es SlotPicker, sin prop de modo (D3), con el estado de
// useSlotPicker (D2): la URL da el estado inicial y recibe cada selección con
// replace. Lo propio de la reserva está aquí: el perfil, el retroceso con la
// consulta de V1, «Continuar» en la Booking Bar y la sección «Tu cita».

type BookingSummaryProps = {
  date: CalendarDate
  time: string | null
  clinic: (typeof CLINICS)[keyof typeof CLINICS]
  missing: boolean
  /** El mensaje de Missing: lo recibe como aria-describedby el destino del foco. */
  messageId: string
}

// «Tu cita» en escritorio (02.5, 02.6): el trabajo de la Booking Bar y de la
// confirmación previa de móvil (02.4). Una <section> dentro del form, no un
// <aside>: contiene el envío (panel 02.0). Sin hora, «Cuándo» dice «Sin
// horario elegido», con el día lleno o sin él. En Missing, la nota se
// sustituye por el mensaje.
function BookingSummary({ date, time, clinic, missing, messageId }: BookingSummaryProps) {
  const titleId = useId()
  const noteId = useId()

  return (
    <section className="c-booking-summary" aria-labelledby={titleId}>
      <BookingSteps current={1} />
      <div className="c-booking-summary__card">
        <h2 className="c-booking-summary__title" id={titleId}>
          Tu cita
        </h2>
        <BookingDetails when={time ? `${dayTitle(date)}, ${time}` : 'Sin horario elegido'} duration={BOOKING_DURATION} clinic={clinic} />
      </div>
      <Notice tone="info" headingLevel={null} title="Antes de continuar" body={policyText({ date: date.toString(), time })} />
      <div className="c-booking-summary__actions">
        <Button type="submit" aria-describedby={missing ? messageId : noteId}>
          Continuar con tus datos
        </Button>
        {missing ? (
          <p className="c-booking-summary__message" id={messageId}>
            <Icon name="warning-circle" size={20} />
            <span>Elige un horario primero</span>
          </p>
        ) : (
          <p className="c-booking-summary__note" id={noteId}>
            Todavía no se reserva nada
          </p>
        )}
      </div>
    </section>
  )
}

export default function Specialist() {
  const { specialist } = useLoaderData<typeof specialistLoader>()
  const { slug } = specialist
  const isDesktop = useMediaQuery('lg')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const maxValue = bookableUntil(specialist)
  const picker = useSlotPicker({ slug, maxValue })

  // Al cruzar lg cambian de control la tira y el calendario, la Booking Bar y
  // «Tu cita», el Back Link y el breadcrumb (D7). Si el foco estaba en uno de
  // ellos (o en la hoja), va al h1, como la hoja de filtros en V1b.
  useFocusFallback(isDesktop)

  const [missing, setMissing] = useState(false)
  const formId = useId()
  const messageId = useId()

  const carried = carriedParams(searchParams)
  const backHref = carried.size ? `/?${carried}` : '/'

  // Con hora elegida (sin hora, SlotPicker pasa a Missing): push a /datos en
  // escritorio y a /confirmar en móvil, con los parámetros de V1 y escenario.
  const submit = () => {
    if (!picker.time) return
    const target = new URLSearchParams(carried)
    target.set('fecha', picker.date.toString())
    target.set('hora', picker.time)
    navigate(`/especialistas/${slug}/${isDesktop ? 'datos' : 'confirmar'}?${target}`)
  }

  let bar: BookingBarProps = { selection: 'none', fullDay: picker.full, formId, submitLabel: 'Continuar' }
  if (picker.time) bar = { selection: 'chosen', summary: `${shortDate(picker.date)} · ${picker.time}`, meta: BOOKING_META, formId, submitLabel: 'Continuar' }
  else if (missing) bar = { selection: 'missing', messageId, formId, submitLabel: 'Continuar' }

  const clinic = CLINICS[specialist.clinic]

  return (
    <ViewLayout title={specialist.name} current="especialistas" currentKind="section" bar={isDesktop ? undefined : <BookingBar {...bar} />}>
      <PageHeader
        title={specialist.name}
        back={
          isDesktop ? (
            <Breadcrumb levels={[{ label: 'Especialistas', href: backHref }]} current={shortName(specialist)} />
          ) : (
            <BackLink href={backHref} className="c-page-header__back">
              Especialistas
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

      <SlotPicker
        picker={picker}
        specialist={specialist}
        maxValue={maxValue}
        formId={formId}
        onSubmit={submit}
        missing={missing}
        onMissingChange={setMissing}
        messageId={messageId}
        aside={<BookingSummary date={picker.date} time={picker.time} clinic={clinic} missing={missing} messageId={messageId} />}
      />
    </ViewLayout>
  )
}
