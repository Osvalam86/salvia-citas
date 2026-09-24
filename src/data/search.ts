import { endOfMonth, parseDate } from '@internationalized/date'
import { TODAY } from './clock.ts'
import { AVAILABILITY, firstFree, nextOpeningMonth, weekday, type Availability } from './availability.ts'
import { AREAS, CLINICS, FILTER_AREAS, SPECIALISTS, type Area, type Neighborhood, type Specialist } from './specialists.ts'

// Búsqueda de la vista 1 (D1, D4): filtros, orden y página a partir de los
// parámetros de la URL. Pura: la vista la envuelve con el escenario (D8).
//
// Valores en la URL: especialidad y modalidad se repiten; disponibilidad,
// orden y ubicación ausentes son su opción inicial («Cualquier fecha»,
// «Disponibilidad más próxima», «Ciudad de México»). Un valor desconocido se
// ignora (guarda de D1). O dentro de un grupo, Y entre grupos.

export const PAGE_SIZE = 4

export const AVAILABILITY_WINDOWS = ['hoy', 'semana', 'mes'] as const
export const SORTS = ['disponibilidad', 'experiencia', 'cercania'] as const
export const MODALITY_FILTERS = ['presencial', 'videoconsulta'] as const

export type SearchParams = {
  q: string
  ubicacion: Neighborhood | null
  especialidad: Area[]
  modalidad: (typeof MODALITY_FILTERS)[number][]
  disponibilidad: (typeof AVAILABILITY_WINDOWS)[number] | null
  orden: (typeof SORTS)[number]
  pagina: number
}

const oneOf = <T extends string>(options: readonly T[], value: string | null): T | null =>
  options.find((option) => option === value) ?? null

export function parseSearch(params: URLSearchParams): SearchParams {
  const page = Number(params.get('pagina'))
  return {
    q: params.get('q')?.trim() ?? '',
    ubicacion: oneOf(Object.keys(CLINICS) as Neighborhood[], params.get('ubicacion')),
    especialidad: FILTER_AREAS.filter((area) => params.getAll('especialidad').includes(area)),
    modalidad: MODALITY_FILTERS.filter((m) => params.getAll('modalidad').includes(m)),
    disponibilidad: oneOf(AVAILABILITY_WINDOWS, params.get('disponibilidad')),
    orden: oneOf(SORTS, params.get('orden')) ?? 'disponibilidad',
    pagina: Number.isInteger(page) && page > 0 ? page : 1,
  }
}

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
const collator = new Intl.Collator('es-MX')
const bareName = (s: Specialist) => s.name.replace(/^Dra?\.\s+/, '')

/** Fin de cada ventana de Disponibilidad: hoy, el domingo de esta semana y el fin de mes. */
function windowEnd(window: SearchParams['disponibilidad']) {
  if (window === 'hoy') return TODAY
  // Semana de lunes a domingo, como la tira y el calendario (no la del locale:
  // en es-MX la semana empieza en domingo).
  if (window === 'semana') return TODAY.add({ days: (7 - weekday(TODAY)) % 7 })
  if (window === 'mes') return endOfMonth(TODAY)
  return null
}

/** Clave de «Disponibilidad más próxima»: el primer hueco; para un lleno, el día siguiente a publishedUntil a las 00:00. */
export function availabilityKey(specialist: Specialist, availability: Availability = AVAILABILITY) {
  const first = firstFree(specialist.slug, availability)
  return first ? `${first.date}T${first.time}` : `${nextOpeningMonth(specialist).toString()}T00:00`
}

export type SearchData = { specialists: Specialist[]; availability: Availability }

export function searchSpecialists(params: SearchParams, data: SearchData = { specialists: SPECIALISTS, availability: AVAILABILITY }) {
  const q = fold(params.q)
  const end = windowEnd(params.disponibilidad)

  const results = data.specialists.filter((s) => {
    if (q && ![s.name, s.specialtyLine, AREAS[s.area]].some((text) => fold(text).includes(q))) return false
    if (params.ubicacion && s.clinic !== params.ubicacion) return false
    if (params.especialidad.length && !params.especialidad.includes(s.area)) return false
    if (params.modalidad.length) {
      const offers = { presencial: true, videoconsulta: s.modality === 'presencial-video' }
      if (!params.modalidad.some((m) => offers[m])) return false
    }
    if (end) {
      const first = firstFree(s.slug, data.availability)
      if (!first || parseDate(first.date).compare(end) > 0) return false
    }
    return true
  })

  const byName = (a: Specialist, b: Specialist) => collator.compare(bareName(a), bareName(b))
  const sorters = {
    disponibilidad: (a: Specialist, b: Specialist) => availabilityKey(a, data.availability).localeCompare(availabilityKey(b, data.availability)) || byName(a, b),
    experiencia: (a: Specialist, b: Specialist) => b.years - a.years || byName(a, b),
    cercania: (a: Specialist, b: Specialist) => a.distanceKm - b.distanceKm || byName(a, b),
  }
  results.sort(sorters[params.orden])

  return { total: results.length, results }
}

/** Corte de una página (escritorio) o de 1 a pagina × 4 (móvil, «Ver más»): D1. */
export const pageSlice = (results: Specialist[], page: number, cumulative = false) =>
  results.slice(cumulative ? 0 : (page - 1) * PAGE_SIZE, page * PAGE_SIZE)
