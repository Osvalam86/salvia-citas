import { parseDate, startOfWeek, type CalendarDate } from '@internationalized/date'
import { useReducer } from 'react'
import { useSearchParams } from 'react-router'
import { AVAILABILITY, freeCount, initialDate, isFreeSlot, slotGroups, type Availability } from '../data/availability.ts'
import { TODAY } from '../data/clock.ts'

// Estado del selector de la vista 2 (D2): un reducer con cuatro valores, del
// que la tira, el calendario y el ListBox son vistas controladas.
// - date nunca es null: sin parámetros, initialDate (D2).
// - Cambiar de fecha pone time a null: una hora pertenece a su día.
// - Navegar de semana no cambia la fecha.
// - visibleMonth es el día enfocado del calendario, del que sale el mes visible.
//
// La URL (D1) da el estado inicial y recibe cada selección con replace y
// preventScrollReset: con radios cada flecha selecciona, y un push por tecla
// llenaría el historial. Tras montar, la URL solo se escribe: todas las
// escrituras son replace, así que no hay entradas de esta página a las que
// volver con Atrás. Semana y mes visibles no van a la URL.
//
// Guardas (D1): una `fecha` fuera de [hoy, maxValue] o mal formada y una
// `hora` que no está libre ese día se ignoran, sin tocar la URL.

type State = {
  date: CalendarDate
  time: string | null
  /** Lunes de la semana de la tira. */
  visibleWeek: CalendarDate
  visibleMonth: CalendarDate
}

type Action =
  | { type: 'date'; date: CalendarDate }
  | { type: 'time'; time: string }
  | { type: 'week'; start: CalendarDate }
  | { type: 'month'; focused: CalendarDate }

export const weekStart = (date: CalendarDate) => startOfWeek(date, 'es-MX', 'mon')

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'date':
      if (action.date.compare(state.date) === 0) return state
      return { date: action.date, time: null, visibleWeek: weekStart(action.date), visibleMonth: action.date }
    case 'time':
      return { ...state, time: action.time }
    case 'week':
      return { ...state, visibleWeek: action.start }
    case 'month':
      return { ...state, visibleMonth: action.focused }
  }
}

function parseParam(value: string | null) {
  if (!value) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

type Options = {
  slug: string
  /** Último día reservable: min(MAX_DATE, publishedUntil) (D4). */
  maxValue: CalendarDate
  availability?: Availability
}

export default function useSlotPicker({ slug, maxValue, availability = AVAILABILITY }: Options) {
  const [searchParams, setSearchParams] = useSearchParams()

  const [state, dispatch] = useReducer(reducer, null, (): State => {
    const param = parseParam(searchParams.get('fecha'))
    const inRange = param && param.compare(TODAY) >= 0 && param.compare(maxValue) <= 0
    const date = inRange ? param : initialDate(slug, availability)
    const hora = searchParams.get('hora')
    const time = inRange && isFreeSlot(slug, date.toString(), hora, availability) ? hora : null
    return { date, time, visibleWeek: weekStart(date), visibleMonth: date }
  })

  const write = (fecha: string, hora: string | null) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('fecha', fecha)
        if (hora) next.set('hora', hora)
        else next.delete('hora')
        return next
      },
      { replace: true, preventScrollReset: true },
    )

  const slotsOf = (date: CalendarDate) => availability[slug]?.[date.toString()] ?? []
  const inRange = (date: CalendarDate) => date.compare(TODAY) >= 0 && date.compare(maxValue) <= 0
  const slots = slotsOf(state.date)

  const firstWeek = weekStart(TODAY)
  const lastWeek = weekStart(maxValue)
  const day = (offset: number) => {
    const date = state.visibleWeek.add({ days: offset })
    return { date, free: freeCount(slotsOf(date)), inRange: inRange(date) }
  }

  return {
    ...state,
    groups: slotGroups(slots),
    free: freeCount(slots),
    /** Día seleccionado sin ninguna hora libre (estado sin horarios). */
    full: freeCount(slots) === 0,
    /** Horas libres de un día; 0 es lleno. Fuera del rango, 0. */
    freeSlots: (date: CalendarDate) => freeCount(slotsOf(date)),
    inRange,
    /** Los siete días de la semana visible, de lunes a domingo. */
    week: [day(0), day(1), day(2), day(3), day(4), day(5), day(6)] as const,
    /** Lunes de la semana de hoy y de la de maxValue: los límites de la tira. */
    firstWeek,
    lastWeek,
    /** Límite de rango (§4.5): sin «Semana anterior» en la de hoy ni «Semana siguiente» en la de maxValue. */
    hasPreviousWeek: state.visibleWeek.compare(firstWeek) > 0,
    hasNextWeek: state.visibleWeek.compare(lastWeek) < 0,
    selectDate(date: CalendarDate) {
      if (date.compare(state.date) === 0) return
      dispatch({ type: 'date', date })
      write(date.toString(), null)
    },
    selectTime(time: string) {
      dispatch({ type: 'time', time })
      write(state.date.toString(), time)
    },
    showWeek(direction: 1 | -1) {
      const start = state.visibleWeek.add({ weeks: direction })
      if (start.compare(firstWeek) < 0 || start.compare(lastWeek) > 0) return
      dispatch({ type: 'week', start })
    },
    focusMonth(focused: CalendarDate) {
      dispatch({ type: 'month', focused })
    },
  }
}
