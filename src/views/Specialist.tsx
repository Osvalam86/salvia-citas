import type { CalendarDate } from '@internationalized/date'
import { useId, useLayoutEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router'
import { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import Avatar from '../components/Avatar.tsx'
import BackLink from '../components/BackLink.tsx'
import BookingBar, { type BookingBarProps } from '../components/BookingBar.tsx'
import Breadcrumb from '../components/Breadcrumb.tsx'
import Icon from '../components/Icon.tsx'
import Notice from '../components/Notice.tsx'
import Step from '../components/Step.tsx'
import Button from '../components/Button.tsx'
import Calendar from '../components/Calendar.tsx'
import DayStrip from '../components/DayStrip.tsx'
import EmptyState from '../components/EmptyState.tsx'
import IconButton from '../components/IconButton.tsx'
import Legend from '../components/Legend.tsx'
import PageHeader from '../components/PageHeader.tsx'
import Sheet from '../components/Sheet.tsx'
import SlotList, { type SlotListHandle } from '../components/SlotList.tsx'
import { dayTitle, freeSlotsText, monthName, shortDate, weekdayDay, weekRangeText } from '../components/dates.ts'
import { bookableUntil, nextFreeAfter, nextOpeningMonth } from '../data/availability.ts'
import { TODAY } from '../data/clock.ts'
import { notifyStore, useNotified } from '../data/notify.ts'
import { PHOTOS } from '../data/photos.ts'
import { carriedParams } from '../data/search.ts'
import { CITY, CLINICS, MODALITIES, shortName } from '../data/specialists.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import useSlotPicker from '../hooks/useSlotPicker.ts'
import type { specialistLoader } from './loaders.ts'
import ViewLayout from './ViewLayout.tsx'

// V2 · reserva (/especialistas/:slug, D1; Figma 02.1–02.3, 02.5, 02.6). El
// selector es useSlotPicker (D2): la URL da el estado inicial y recibe cada
// selección con replace.
//
// Missing («Continuar» sin hora) persiste hasta elegir hora, también si
// cambia el día: el mensaje sigue siendo cierto. El destino del foco y de su
// aria-describedby es la primera hora libre; sin horas, «Ver horarios del …»;
// sin hueco publicado, «Avisarme si se libera un hueco».

// Toda reserva es presencial: la videoconsulta está fuera de alcance (copy de
// Figma para todos los médicos, DESIGN.md § Fecha y hora).
const META = 'Presencial · 30 min'

/** Destinos de foco tras un commit: la primera hora libre, el objetivo de Missing o el botón de semana que queda. */
type PendingFocus = 'first-slot' | 'missing' | 'previous-week' | 'next-week' | null

type Picker = ReturnType<typeof useSlotPicker>

type DateSheetProps = {
  picker: Picker
  maxValue: CalendarDate
  trigger: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

// Hoja «Elige una fecha» (02.2): UI/Calendar en una hoja inferior. Borrador
// propio (D2), nacido de la fecha elegida: solo se aplica con «Ver horarios
// del …»; «Cerrar», Escape y el velo lo descartan. Foco inicial en el día
// seleccionado (panel 02.0); al cerrar, vuelve a «Ver mes completo» en los
// tres casos. Aplicar el mismo día conserva la hora; otro día la borra y la
// tira pasa a su semana (useSlotPicker). Solo se anuncia el estado de horas:
// la región viva de la semana no se escribe desde aquí.
function DateSheet({ picker, maxValue, trigger, onClose }: DateSheetProps) {
  const [draft, setDraft] = useState(picker.date)
  const [focused, setFocused] = useState(picker.date)

  return (
    <Sheet
      variant="bottom"
      title="Elige una fecha"
      initialFocus={(dialog) => dialog.querySelector<HTMLElement>('.c-calendar__grid [tabindex="0"]')}
      returnFocus={trigger}
      onDismiss={onClose}
      onSubmit={() => {
        picker.selectDate(draft)
        onClose()
      }}
      footer={
        <Button type="submit" className="c-sheet__fill">
          {`Ver horarios del ${weekdayDay(draft, focused)}`}
        </Button>
      }
    >
      <Calendar
        value={draft}
        onChange={setDraft}
        today={TODAY}
        maxValue={maxValue}
        freeSlots={picker.freeSlots}
        focusedValue={focused}
        onFocusChange={setFocused}
      />
    </Sheet>
  )
}

type BookingSummaryProps = {
  date: CalendarDate
  time: string | null
  clinic: (typeof CLINICS)[keyof typeof CLINICS]
  missing: boolean
  /** El mensaje de Missing: lo recibe como aria-describedby el destino del foco. */
  messageId: string
}

const STEPS = [
  { state: 'current', label: 'Fecha y hora' },
  { state: 'upcoming', label: 'Tus datos' },
  { state: 'upcoming', label: 'Listo' },
] as const

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
      <ol className="o-cluster o-cluster--gap-4 o-cluster--align-center" role="list" aria-label="Pasos de la reserva">
        {STEPS.map((step, index) => (
          <Step key={step.label} state={step.state} number={index + 1} label={step.label} />
        ))}
      </ol>
      <div className="c-booking-summary__card">
        <h2 className="c-booking-summary__title" id={titleId}>
          Tu cita
        </h2>
        <dl className="c-booking-summary__details">
          <div className="c-booking-summary__detail">
            <dt className="c-booking-summary__term">
              <Icon name="calendar-check" size={20} />
              <span>Cuándo</span>
            </dt>
            <dd className="c-booking-summary__value">{time ? `${dayTitle(date)}, ${time}` : 'Sin horario elegido'}</dd>
          </div>
          <div className="c-booking-summary__detail">
            <dt className="c-booking-summary__term">
              <Icon name="clock" size={20} />
              <span>Duración</span>
            </dt>
            <dd className="c-booking-summary__value">30 minutos</dd>
          </div>
          <div className="c-booking-summary__detail">
            <dt className="c-booking-summary__term">
              <Icon name="map-pin" size={20} />
              <span>Dónde</span>
            </dt>
            <dd className="c-booking-summary__value">{clinic.name}</dd>
            <dd className="c-booking-summary__address">{clinic.address}</dd>
          </div>
        </dl>
      </div>
      <Notice
        tone="info"
        headingLevel={null}
        title="Antes de continuar"
        body="Puedes cancelar o reprogramar sin costo hasta 24 horas antes. Llega 10 minutos antes con una identificación."
      />
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
  const notified = useNotified()

  // La hoja solo existe bajo lg. Al cruzar lg abierta, «Ver mes completo»
  // deja de existir (D7): la hoja se cierra y el borrador se descarta.
  const [sheetOpen, setSheetOpen] = useState(false)
  if (isDesktop && sheetOpen) setSheetOpen(false)
  const monthButton = useRef<HTMLButtonElement>(null)

  // Al cruzar lg cambian de control la tira y el calendario, la Booking Bar y
  // «Tu cita», el Back Link y el breadcrumb (D7). Si el foco estaba en uno de
  // ellos (o en la hoja), cae en body: va al h1, el respaldo de D12, como la
  // hoja de filtros en V1b. En el mismo commit, sin pasar un frame por body.
  const wasDesktop = useRef(isDesktop)
  useLayoutEffect(() => {
    if (wasDesktop.current === isDesktop) return
    wasDesktop.current = isDesktop
    if (!document.activeElement || document.activeElement === document.body) {
      document.getElementById(MAIN_TITLE_ID)?.focus({ preventScroll: true })
    }
  }, [isDesktop])

  const [missing, setMissing] = useState(false)
  const [weekAnnouncement, setWeekAnnouncement] = useState('')
  const pendingFocus = useRef<PendingFocus>(null)
  const list = useRef<SlotListHandle>(null)
  const nextDayButton = useRef<HTMLButtonElement>(null)
  const notifyButton = useRef<HTMLButtonElement>(null)
  const weekButtons = useRef<HTMLDivElement>(null)

  const formId = useId()
  const hoursId = useId()
  const messageId = useId()

  const next = picker.full ? nextFreeAfter(slug, picker.date) : null
  const notifyPressed = notified.has(slug)
  // Destino de Missing en el estado actual.
  const missingTarget = !picker.full ? 'slot' : next ? 'next-day' : 'notify'

  // En el mismo commit que desmonta el control pulsado (lección de V1b): el
  // foco no pasa por body.
  useLayoutEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    if (target === 'first-slot' || (target === 'missing' && missingTarget === 'slot')) list.current?.focusFirstAvailable()
    else if (target === 'missing') (missingTarget === 'next-day' ? nextDayButton : notifyButton).current?.focus()
    else {
      const label = target === 'next-week' ? 'Semana siguiente' : 'Semana anterior'
      weekButtons.current?.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)?.focus()
    }
  })

  const carried = carriedParams(searchParams)
  const backHref = carried.size ? `/?${carried}` : '/'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!picker.time) {
      setMissing(true)
      pendingFocus.current = 'missing'
      return
    }
    const target = new URLSearchParams(carried)
    target.set('fecha', picker.date.toString())
    target.set('hora', picker.time)
    navigate(`/especialistas/${slug}/${isDesktop ? 'datos' : 'confirmar'}?${target}`)
  }

  // La región viva de la semana solo se escribe desde estos botones: al
  // aplicar la hoja con un día de otra semana, se anuncia solo el estado de
  // horas (el día elegido), no las dos a la vez.
  const showWeek = (direction: 1 | -1) => {
    const start = picker.visibleWeek.add({ weeks: direction })
    picker.showWeek(direction)
    setWeekAnnouncement(weekRangeText(start))
    // Límite de rango: el botón pulsado deja de existir y el foco pasa al que queda.
    if (direction === -1 && start.compare(picker.firstWeek) === 0) pendingFocus.current = 'next-week'
    if (direction === 1 && start.compare(picker.lastWeek) === 0) pendingFocus.current = 'previous-week'
  }

  let bar: BookingBarProps = { selection: 'none', fullDay: picker.full, formId, submitLabel: 'Continuar' }
  if (picker.time) bar = { selection: 'chosen', summary: `${shortDate(picker.date)} · ${picker.time}`, meta: META, formId, submitLabel: 'Continuar' }
  else if (missing) bar = { selection: 'missing', messageId, formId, submitLabel: 'Continuar' }

  const clinic = CLINICS[specialist.clinic]
  // Acciones del bloque sin horarios: a ancho completo en móvil, intrínsecas
  // en escritorio (diseño §3.6; Figma 02.6).
  const emptyAction = isDesktop ? 'c-slot-picker__action' : 'c-empty-state__action'

  const times = (
    <div className="c-slot-picker__times">
      <div className="c-slot-picker__times-header">
        <h2 className="c-slot-picker__heading" id={hoursId}>
          Elige hora
        </h2>
        {/* Anuncia cada cambio de día (panel 02.0). Sin horas, el texto visible dice solo el día. */}
        <p className="c-slot-picker__status" role="status">
          {dayTitle(picker.date)}
          {picker.full ? <span className="u-sr-only"> · sin horarios libres</span> : ` · ${freeSlotsText(picker.free)}`}
        </p>
      </div>

      {picker.full ? (
        <EmptyState
          icon="calendar-blank"
          headingLevel={3}
          title={picker.date.compare(TODAY) === 0 ? 'La agenda de hoy está completa' : `La agenda del ${weekdayDay(picker.date, picker.date)} está completa`}
          help={
            next
              ? `El horario libre más cercano es ${next.date.compare(TODAY.add({ days: 1 })) === 0 ? 'mañana, ' : 'el '}${weekdayDay(next.date, picker.date)}, a las ${next.time}.`
              : `No hay horarios libres publicados. El próximo cupo se abre en ${monthName(nextOpeningMonth(specialist))}.`
          }
        >
          {next && (
            <Button
              variant="secondary"
              className={emptyAction}
              ref={nextDayButton}
              aria-describedby={missing && missingTarget === 'next-day' ? messageId : undefined}
              onClick={() => {
                picker.selectDate(next.date)
                pendingFocus.current = 'first-slot'
              }}
            >
              {`Ver horarios del ${weekdayDay(next.date, picker.date)}`}
            </Button>
          )}
          {/* Conmutador (diseño §7.3, D16): la clave es el médico, no el día. */}
          <Button
            variant="secondary"
            className={emptyAction}
            ref={notifyButton}
            aria-pressed={notifyPressed}
            aria-describedby={missing && missingTarget === 'notify' ? messageId : undefined}
            leadingIcon={notifyPressed ? 'check' : undefined}
            onClick={() => notifyStore.toggle(slug)}
          >
            {notifyPressed ? 'Te avisaremos' : 'Avisarme si se libera un hueco'}
          </Button>
        </EmptyState>
      ) : (
        <SlotList
          ref={list}
          aria-labelledby={hoursId}
          groups={picker.groups}
          value={picker.time}
          onChange={(time) => {
            picker.selectTime(time)
            setMissing(false)
          }}
          describedBy={missing ? messageId : undefined}
        />
      )}
    </div>
  )

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

      {isDesktop ? (
        <form id={formId} className="o-layout o-layout--aside-end" onSubmit={submit} noValidate>
          <div className="c-slot-picker">
            <div className="c-slot-picker__card">
              <div className="c-slot-picker__calendar">
                <h2 className="c-slot-picker__heading">Elige fecha</h2>
                <Calendar
                  value={picker.date}
                  onChange={picker.selectDate}
                  today={TODAY}
                  maxValue={maxValue}
                  freeSlots={picker.freeSlots}
                  focusedValue={picker.visibleMonth}
                  onFocusChange={picker.focusMonth}
                />
              </div>
              {times}
            </div>
          </div>
          <BookingSummary
            date={picker.date}
            time={picker.time}
            clinic={clinic}
            missing={missing}
            messageId={messageId}
          />
        </form>
      ) : (
        <form id={formId} className="c-slot-picker" onSubmit={submit} noValidate>
          <fieldset className="c-slot-picker__dates">
            <Legend level="section" headingLevel={2} className="c-slot-picker__legend">
              Elige fecha
            </Legend>
            <Button
              variant="secondary"
              leadingIcon="calendar-dots"
              aria-haspopup="dialog"
              className="c-slot-picker__month"
              ref={monthButton}
              onClick={() => setSheetOpen(true)}
            >
              Ver mes completo
            </Button>
            <div className="c-slot-picker__week">
              <div className="c-slot-picker__week-nav">
                <p className="c-slot-picker__week-label">{weekRangeText(picker.visibleWeek)}</p>
                <p className="u-sr-only" aria-live="polite">
                  {weekAnnouncement}
                </p>
                <div className="c-slot-picker__week-buttons" ref={weekButtons}>
                  {picker.hasPreviousWeek && (
                    <IconButton icon="caret-left" label="Semana anterior" onClick={() => showWeek(-1)} className="c-slot-picker__week-previous" />
                  )}
                  {picker.hasNextWeek && (
                    <IconButton icon="caret-right" label="Semana siguiente" onClick={() => showWeek(1)} className="c-slot-picker__week-next" />
                  )}
                </div>
              </div>
              <DayStrip name="fecha" days={picker.week} value={picker.date} onChange={picker.selectDate} today={TODAY} />
            </div>
          </fieldset>
          {times}
        </form>
      )}
      {!isDesktop && sheetOpen && <DateSheet picker={picker} maxValue={maxValue} trigger={monthButton} onClose={() => setSheetOpen(false)} />}
    </ViewLayout>
  )
}
