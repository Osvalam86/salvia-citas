import type { CalendarDate } from '@internationalized/date'
import { CalendarCell } from 'react-aria-components'
import { freeSlotsText, longDate } from './dates.ts'

type CalendarDayProps = {
  date: CalendarDate
  /** Hoy de los datos simulados: el isToday de RAC usa el reloj real. */
  today: CalendarDate
  /** Horas libres del día: 0 es lleno (D4, derivado de los datos). */
  free: number
}

// UI/Calendar Day: celda de la rejilla de UI/Calendar (spike-rac § R3, 2.2 y
// 2.3). Sin isDateUnavailable: el día lleno es seleccionable y no lleva
// aria-disabled. RAC pone aria-disabled en los días fuera de rango (antes de
// hoy o pasados los 90 días): no son enfocables.
//
// El nombre accesible se compone entero, sin partir del de RAC («Primera fecha
// disponible» contradiría «sin horarios»):
// {fecha larga}[, hoy], {N horarios libres | sin horarios}[, seleccionado].
// Fuera de rango, solo la fecha. Los días de otro mes son Blank: vacíos y
// fuera del árbol accesible.
export default function CalendarDay({ date, today, free }: CalendarDayProps) {
  const isToday = date.compare(today) === 0
  const isPast = date.compare(today) < 0

  return (
    <CalendarCell
      date={date}
      className={({ isOutsideMonth }) => (free === 0 && !isPast && !isOutsideMonth ? 'c-calendar-day c-calendar-day--full' : 'c-calendar-day')}
      render={(props, { isOutsideMonth, isSelected, isDisabled }) => {
        // Blank: sin número (RAC vuelve al suyo si children es null), sin
        // nombre y fuera del árbol accesible (spike § 2.3).
        if (isOutsideMonth) {
          const blank = { ...props }
          delete blank['aria-label']
          delete blank.children
          return <div {...blank} aria-hidden="true" />
        }

        const label = [longDate(date), isToday && 'hoy', !isDisabled && freeSlotsText(free), isSelected && 'seleccionado']
          .filter(Boolean)
          .join(', ')
        // role="button" ya viene de RAC en props; se repite para que el lint
        // vea que el nombre va en un elemento con rol.
        return <div {...props} role="button" aria-label={label} aria-current={isToday ? 'date' : undefined} />
      }}
    >
      <span className="c-calendar-day__number">{date.day}</span>
      {isToday && <span className="c-calendar-day__today" />}
    </CalendarCell>
  )
}
