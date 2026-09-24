import { endOfWeek, isSameMonth, startOfWeek, type CalendarDate } from '@internationalized/date'
import { useContext, type KeyboardEvent } from 'react'
import {
  Button,
  Calendar as RacCalendar,
  CalendarGrid,
  CalendarGridBody,
  CalendarStateContext,
} from 'react-aria-components'
import CalendarDay from './CalendarDay.tsx'
import Icon from './Icon.tsx'
import { monthTitle, WEEKDAY_LETTERS } from './dates.ts'

type CalendarProps = {
  value: CalendarDate | null
  onChange: (date: CalendarDate) => void
  /** Hoy de los datos simulados: es también minValue (§4.5, límite de rango). */
  today: CalendarDate
  /** Último día reservable (90 días desde hoy, D4). */
  maxValue: CalendarDate
  /** Horas libres de un día; 0 es lleno. Se deriva de los datos (D4). */
  freeSlots: (date: CalendarDate) => number
  /**
   * Día enfocado, del que sale el mes visible (visibleMonth de D2).
   * Controlado siempre: el valor inicial lo pone la composición (value ?? hoy),
   * porque sin él RAC enfocaría el hoy del reloj real.
   */
  focusedValue: CalendarDate
  onFocusChange: (date: CalendarDate) => void
}

// Navegación de mes. Un límite del rango no deja un botón desactivado: se
// omite, como «Anterior» en la paginación (diseño §4.5). Sin «Mes anterior», el
// mes se alinea al inicio (Figma 02.2 y 02.5) y «Mes siguiente» conserva su
// sitio.
function MonthNav() {
  const state = useContext(CalendarStateContext)
  if (!state) return null
  const showPrevious = !state.isPreviousVisibleRangeInvalid()
  const showNext = !state.isNextVisibleRangeInvalid()

  return (
    <div className={showPrevious ? 'c-calendar__nav' : 'c-calendar__nav c-calendar__nav--from-start'}>
      {showPrevious && (
        <Button slot="previous" aria-label="Mes anterior" className="c-icon-button">
          <Icon name="caret-left" size={24} />
        </Button>
      )}
      <p className="c-calendar__month">{monthTitle(state.visibleRange.start)}</p>
      {showNext && (
        <Button slot="next" aria-label="Mes siguiente" className="c-icon-button">
          <Icon name="caret-right" size={24} />
        </Button>
      )}
    </div>
  )
}

// Leyenda visual, fuera del árbol accesible: la información está en el nombre
// de cada día. «Hoy» solo si el mes visible contiene hoy (D3).
function Legend({ today }: { today: CalendarDate }) {
  const state = useContext(CalendarStateContext)
  const showToday = state ? isSameMonth(state.visibleRange.start, today) : false

  return (
    <div className="c-calendar__legend" aria-hidden="true">
      <span className="c-calendar__legend-item">
        <span className="c-calendar__swatch c-calendar__swatch--full" />
        Sin horarios
      </span>
      {showToday && (
        <span className="c-calendar__legend-item">
          <span className="c-calendar__swatch">
            <span className="c-calendar__dot" />
          </span>
          Hoy
        </span>
      )}
    </div>
  )
}

// UI/Calendar: rejilla de fecha del patrón APG con React Aria Calendar. Lunes
// primero (sin la prop, es-MX empieza en domingo), minValue = hoy y siempre el
// alto de 6 semanas. La cabecera es propia: RAC escribiría «M» para el
// miércoles; Figma, «X».
export default function Calendar({ value, onChange, today, maxValue, freeSlots, focusedValue, onFocusChange }: CalendarProps) {
  // Inicio y Fin: principio y fin de la semana, como piden la APG y la
  // descripción de UI/Calendar Day. RAC los lleva al principio y fin del mes;
  // el foco es controlado, así que basta con adelantarse a su teclado. Sin
  // salir del rango: desde el lunes 23 de abril, Inicio se queda en el 23.
  const weekEdge = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Home' && event.key !== 'End') return
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return
    event.preventDefault()
    event.stopPropagation()
    const edge = event.key === 'Home' ? startOfWeek(focusedValue, 'es-MX', 'mon') : endOfWeek(focusedValue, 'es-MX', 'mon')
    if (edge.compare(today) < 0) onFocusChange(today)
    else if (edge.compare(maxValue) > 0) onFocusChange(maxValue)
    else onFocusChange(edge)
  }

  return (
    <RacCalendar
      className="c-calendar"
      value={value}
      onChange={onChange}
      minValue={today}
      maxValue={maxValue}
      focusedValue={focusedValue}
      onFocusChange={onFocusChange}
      firstDayOfWeek="mon"
    >
      <MonthNav />
      {/* Captura en el envoltorio: CalendarGrid no acepta manejadores de teclado. */}
      <div className="c-calendar__body" onKeyDownCapture={weekEdge}>
        <CalendarGrid className="c-calendar__grid">
          <thead aria-hidden="true">
            <tr>
              {WEEKDAY_LETTERS.map((letter, index) => (
                <th className="c-calendar__weekday" key={index}>
                  {letter}
                </th>
              ))}
            </tr>
          </thead>
          <CalendarGridBody>{(date) => <CalendarDay date={date} today={today} free={freeSlots(date)} />}</CalendarGridBody>
        </CalendarGrid>
      </div>
      <Legend today={today} />
    </RacCalendar>
  )
}
