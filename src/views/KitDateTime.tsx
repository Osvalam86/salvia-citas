import { CalendarDate } from '@internationalized/date'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import BackLink from '../components/BackLink.tsx'
import BookingBar, { type BookingBarProps } from '../components/BookingBar.tsx'
import Calendar from '../components/Calendar.tsx'
import DayStrip from '../components/DayStrip.tsx'
import Legend from '../components/Legend.tsx'
import SlotList, { type SlotGroup, type SlotListHandle } from '../components/SlotList.tsx'
import { shortDate } from '../components/dates.ts'
import { MAX_DATE, TODAY } from '../data/clock.ts'
import useMediaQuery from '../hooks/useMediaQuery.ts'

// Catálogo de 4.6 Fecha y hora (D9). Página propia, como /kit/resultados: sus
// botones y radios no entran en las medidas de /kit.
//
// Datos: los días y horas que declaran §5.2 y §5.4 (abril: 23 y 29 llenos, el
// 24 con 6 libres; mayo: los días llenos de la lista y el 17 con 8 libres).
// Relleno solo del catálogo: un día no declarado tiene las 12 horas libres.
// La capa de datos real (D4) llega con la fase 5.

type Slot = SlotGroup['slots'][number]
const slots = (spec: string) =>
  spec.split(' ').map((s): Slot => ({ time: s.slice(0, 5), available: !s.endsWith('x') }))

const APRIL_24: SlotGroup[] = [
  { label: 'Mañana', slots: slots('09:00x 09:30x 10:00x 10:30 11:00 11:30x') },
  { label: 'Tarde', slots: slots('16:00 16:30 17:00 17:30 18:00x 18:30x') },
]
const MAY_17: SlotGroup[] = [
  { label: 'Mañana', slots: slots('09:00 09:30x 10:00x 10:30 11:00 11:30') },
  { label: 'Tarde', slots: slots('16:00x 16:30 17:00 17:30 18:00 18:30x') },
]
const ALL_FREE: SlotGroup[] = [
  { label: 'Mañana', slots: slots('09:00 09:30 10:00 10:30 11:00 11:30') },
  { label: 'Tarde', slots: slots('16:00 16:30 17:00 17:30 18:00 18:30') },
]

const FULL_DAYS = ['2029-04-23', '2029-04-29', ...[6, 7, 9, 13, 14, 20, 21, 23, 27, 28].map((d) => `2029-05-${String(d).padStart(2, '0')}`)]

function slotsFor(date: CalendarDate): SlotGroup[] {
  const key = date.toString()
  if (FULL_DAYS.includes(key)) return []
  if (key === '2029-04-24') return APRIL_24
  if (key === '2029-05-17') return MAY_17
  return ALL_FREE
}

// «Lleno» se deriva de las horas, nunca es un dato propio (D4).
const freeSlots = (date: CalendarDate) => slotsFor(date).flatMap((g) => g.slots).filter((s) => s.available).length

const week = (start: CalendarDate) => {
  const day = (offset: number) => {
    const date = start.add({ days: offset })
    return { date, free: freeSlots(date) }
  }
  return [day(0), day(1), day(2), day(3), day(4), day(5), day(6)] as const
}

const APRIL_WEEK = week(TODAY)
const MAY_WEEK = week(new CalendarDate(2029, 5, 14))
const APRIL_24_DATE = new CalendarDate(2029, 4, 24)
const MAY_17_DATE = new CalendarDate(2029, 5, 17)
const META = 'Presencial · 30 min'
const MESSAGE_ID = 'kit-reserva-mensaje'

// Demo viva: tira, horas y barra comparten estado, como hará useSlotPicker
// (D2): cambiar de fecha borra la hora. «Continuar» sin hora pasa la barra a
// Missing y lleva el foco a la primera hora libre, que recibe el mensaje.
function BookingDemo({ onBar }: { onBar: (bar: BookingBarProps) => void }) {
  const [date, setDate] = useState<CalendarDate>(APRIL_24_DATE)
  const [time, setTime] = useState<string | null>('10:30')
  const [missing, setMissing] = useState(false)
  const list = useRef<SlotListHandle>(null)
  const focusPending = useRef(false)
  const groups = slotsFor(date)

  useEffect(() => {
    let bar: BookingBarProps = { selection: 'none', formId: 'kit-reserva', submitLabel: 'Continuar' }
    if (time) bar = { selection: 'chosen', summary: `${shortDate(date)} · ${time}`, meta: META, formId: 'kit-reserva', submitLabel: 'Continuar' }
    else if (missing && groups.length > 0) bar = { selection: 'missing', messageId: MESSAGE_ID, formId: 'kit-reserva', submitLabel: 'Continuar' }
    onBar(bar)
  }, [date, time, missing, groups.length, onBar])

  useEffect(() => {
    if (!focusPending.current) return
    focusPending.current = false
    list.current?.focusFirstAvailable()
  })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (time || groups.length === 0) return
    setMissing(true)
    focusPending.current = true
  }

  return (
    <form id="kit-reserva" className="o-stack o-stack--gap-6" onSubmit={submit} noValidate>
      <fieldset className="o-stack o-stack--gap-4">
        <Legend level="section" headingLevel={3}>
          Elige fecha
        </Legend>
        <DayStrip
          name="kit-fecha"
          days={APRIL_WEEK}
          value={date}
          onChange={(d) => {
            setDate(d)
            setTime(null)
            setMissing(false)
          }}
          today={TODAY}
        />
      </fieldset>
      <div className="o-stack o-stack--gap-4" id="kit-horas">
        <h3 className="c-kit__subheading" id="kit-elige-hora">
          Elige hora
        </h3>
        {groups.length > 0 ? (
          <SlotList
            ref={list}
            aria-labelledby="kit-elige-hora"
            groups={groups}
            value={time}
            onChange={(t) => {
              setTime(t)
              setMissing(false)
            }}
            describedBy={missing ? MESSAGE_ID : undefined}
          />
        ) : (
          <p>Sin horarios: el bloque con el siguiente hueco y «Avisarme» llega con la vista 2.</p>
        )}
      </div>
    </form>
  )
}

function CalendarDemo() {
  const [value, setValue] = useState<CalendarDate | null>(APRIL_24_DATE)
  const [focused, setFocused] = useState<CalendarDate>(value ?? TODAY)
  return (
    <Calendar
      value={value}
      onChange={setValue}
      today={TODAY}
      maxValue={MAX_DATE}
      freeSlots={freeSlots}
      focusedValue={focused}
      onFocusChange={setFocused}
    />
  )
}

export default function KitDateTime() {
  const isDesktop = useMediaQuery('lg')
  const [bar, setBar] = useState<BookingBarProps | null>(null)
  const [mayDate, setMayDate] = useState<CalendarDate>(MAY_17_DATE)
  const [mayTime, setMayTime] = useState<string | null>('17:00')

  return (
    <AppLayout bar={!isDesktop && bar ? <BookingBar {...bar} /> : undefined}>
      <div className="c-kit">
        <div className="o-stack o-stack--gap-4">
          <title>Fecha y hora · Kit · Salvia</title>
          <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
            Fecha y hora
          </h1>
          <p>
            <BackLink href="/kit">Kit del sistema</BackLink>
          </p>
        </div>

        <section className="c-kit__section" aria-labelledby="kit-selector">
          <h2 className="c-kit__heading" id="kit-selector">
            Selector (demo)
          </h2>
          <p>
            Tira de la semana de hoy, horas del día marcado y, por debajo de lg, la Booking Bar en la
            barra del shell. «Continuar» sin hora pasa la barra a Missing.
          </p>
          <BookingDemo onBar={setBar} />
        </section>

        <section className="c-kit__section" aria-labelledby="kit-day-chip">
          <h2 className="c-kit__heading" id="kit-day-chip">
            Day Chip
          </h2>
          <p>La semana del 14 al 20 de mayo (reprogramación): sin «Hoy», lunes y domingo llenos.</p>
          <fieldset className="o-stack o-stack--gap-4" id="kit-tira-mayo">
            <Legend level="section" headingLevel={3}>
              Elige fecha en mayo
            </Legend>
            <DayStrip name="kit-fecha-mayo" days={MAY_WEEK} value={mayDate}
              onChange={(d) => {
                setMayDate(d)
                setMayTime(null)
              }}
              today={TODAY}
            />
          </fieldset>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-calendar">
          <h2 className="c-kit__heading" id="kit-calendar">
            Calendar y Calendar Day
          </h2>
          <p>
            Abril de 2029: del 1 al 22, pasados; el 23 (hoy) y el 29, llenos. Mayo recupera «Mes
            anterior» y pierde el «Hoy» de la leyenda.
          </p>
          <div id="kit-calendario">
            <CalendarDemo />
          </div>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-time-slot">
          <h2 className="c-kit__heading" id="kit-time-slot">
            Time Slot
          </h2>
          <h3 className="c-kit__subheading" id="kit-horas-mayo">
            Horas del jueves 17 de mayo
          </h3>
          <div id="kit-lista-mayo">
            <SlotList aria-labelledby="kit-horas-mayo" groups={slotsFor(mayDate)} value={mayTime} onChange={setMayTime} />
          </div>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-booking-bar">
          <h2 className="c-kit__heading" id="kit-booking-bar">
            Booking Bar
          </h2>
          <p>Las tres variantes, fuera de la barra del shell. Envían a un formulario vacío.</p>
          <form id="kit-barras" onSubmit={(event) => event.preventDefault()} />
          <div className="o-stack o-stack--gap-4" id="kit-barras-variantes">
            <BookingBar selection="chosen" summary="mar 24 abr · 10:30" meta={META} formId="kit-barras" submitLabel="Continuar" />
            <BookingBar selection="none" formId="kit-barras" submitLabel="Continuar" />
            <BookingBar selection="missing" messageId="kit-barras-mensaje" formId="kit-barras" submitLabel="Continuar" />
            <BookingBar selection="chosen" summary="jue 17 may · 17:00" meta={META} formId="kit-barras" submitLabel="Confirmar hora" />
          </div>
        </section>
      </div>
    </AppLayout>
  )
}
