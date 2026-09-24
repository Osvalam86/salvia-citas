import type { CalendarDate } from '@internationalized/date'
import DayChip from './DayChip.tsx'

type Day = {
  date: CalendarDate
  /** Horas libres; 0 es lleno. */
  free: number
}

type DayStripProps = {
  /** Nombre del grupo de radios. */
  name: string
  /** Una semana, de lunes a domingo: siete días exactos, por tipo. */
  days: readonly [Day, Day, Day, Day, Day, Day, Day]
  /** Día marcado; puede no estar en la semana visible (D2: navegar no cambia la fecha). */
  value: CalendarDate | null
  onChange: (date: CalendarDate) => void
  today: CalendarDate
}

// Tira semanal de UI/Day Chip (excepción a D5, como c-wordmark: no es uno de
// los 34). Los siete radios y su rejilla. El fieldset, la legend «Elige fecha»,
// «Ver mes completo» y la navegación de semana son patrón de pantalla (fase 5).
export default function DayStrip({ name, days, value, onChange, today }: DayStripProps) {
  return (
    <div className="c-day-strip">
      {days.map(({ date, free }) => (
        <DayChip
          key={date.toString()}
          name={name}
          date={date}
          free={free}
          isToday={date.compare(today) === 0}
          checked={value !== null && date.compare(value) === 0}
          onChange={onChange}
        />
      ))}
    </div>
  )
}
