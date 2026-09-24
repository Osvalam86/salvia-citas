import { CalendarDate, CalendarDateTime } from '@internationalized/date'

// Reloj simulado (D4): la app vive el lunes 23 de abril de 2029 a las 09:00,
// antes del 19:15 de Mariana y del 10:30 de la cita de Ruiz. `new Date()`,
// `Date.now()`, `today()` y `now()` están prohibidos por lint: toda fecha
// parte de aquí.
export const TODAY = new CalendarDate(2029, 4, 23)
export const NOW = new CalendarDateTime(2029, 4, 23, 9, 0)

// Límite del selector: 90 días desde hoy (D4).
export const MAX_DATE = TODAY.add({ days: 90 })
