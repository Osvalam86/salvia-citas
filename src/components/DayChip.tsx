import type { CalendarDate } from '@internationalized/date'
import { freeSlotsText, monthName, shortWeekday } from './dates.ts'

export type DayChipProps = {
  /** El grupo: los siete chips de una tira comparten name. */
  name: string
  date: CalendarDate
  /** Horas libres del día; 0 es lleno (seleccionable, sin aria-disabled). */
  free: number
  /**
   * Fuera de [hoy, maxValue]: como el día pasado del calendario, no enfocable
   * (radio disabled) y con solo la fecha en el nombre. Fuera de Figma: solo le
   * ocurre a un médico con la agenda publicada hasta un día que no es domingo
   * (Rodrigo, DESIGN.md § Fecha y hora).
   */
  inRange?: boolean
  /** «Hoy» sustituye al día de la semana. */
  isToday: boolean
  checked: boolean
  onChange: (date: CalendarDate) => void
}

// UI/Day Chip: un radio nativo de la tira semanal (diseño §5.2). Tab entra en
// el día marcado y las flechas mueven y seleccionan, sin script. El input,
// invisible, ocupa el chip entero; la etiqueta es el chip.
//
// Nombre: empieza por el texto visible y se completa con texto oculto
// (criterio 2.5.3): «mar 24» + « de abril, 6 horarios libres».
export default function DayChip({ name, date, free, inRange = true, isToday, checked, onChange }: DayChipProps) {
  let classes = 'c-day-chip'
  if (!inRange) classes += ' c-day-chip--out-of-range'
  else if (free === 0) classes += ' c-day-chip--full'

  return (
    <label className={classes}>
      <input
        type="radio"
        className="c-day-chip__input"
        name={name}
        value={date.toString()}
        checked={checked}
        disabled={!inRange}
        onChange={() => onChange(date)}
      />
      <span className="c-day-chip__weekday">{isToday ? 'Hoy' : shortWeekday(date)} </span>
      <span className="c-day-chip__day">{date.day}</span>
      <span className="u-sr-only">
        {inRange ? ` de ${monthName(date)}, ${freeSlotsText(free)}` : ` de ${monthName(date)}`}
      </span>
    </label>
  )
}
