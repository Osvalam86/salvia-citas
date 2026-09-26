import { parseDate } from '@internationalized/date'
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router'
import { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import Button from '../components/Button.tsx'
import Checkbox from '../components/Checkbox.tsx'
import { nextOpeningText, nextSlotText } from '../components/dates.ts'
import EmptyState from '../components/EmptyState.tsx'
import FieldSelect from '../components/FieldSelect.tsx'
import FieldText from '../components/FieldText.tsx'
import FilterTrigger from '../components/FilterTrigger.tsx'
import Legend from '../components/Legend.tsx'
import LoadMore from '../components/LoadMore.tsx'
import PageHeader from '../components/PageHeader.tsx'
import Pagination from '../components/Pagination.tsx'
import Radio from '../components/Radio.tsx'
import ResultCard from '../components/ResultCard.tsx'
import Sheet from '../components/Sheet.tsx'
import useMediaQuery from '../hooks/useMediaQuery.ts'
import { firstFree, nextOpeningMonth } from '../data/availability.ts'
import { TODAY } from '../data/clock.ts'
import { notifyStore, useNotified } from '../data/notify.ts'
import { PHOTOS } from '../data/photos.ts'
import { scenarioFrom, withScenario, type Scenario } from '../data/scenario.ts'
import {
  AVAILABILITY_WINDOWS,
  MODALITY_FILTERS,
  PAGE_SIZE,
  SORTS,
  carriedParams,
  clampPage,
  emptyCause,
  pageCount,
  pageSlice,
  parseSearch,
  searchKey,
  searchSpecialists,
  type SearchParams,
} from '../data/search.ts'
import { AREAS, CITY, CLINICS, FILTER_AREAS, MODALITIES, NEIGHBORHOODS, type Specialist } from '../data/specialists.ts'
import ViewLayout from './ViewLayout.tsx'

// V1 · Búsqueda (/, D1; Figma 01.1–01.9). La URL es el estado: consulta,
// ubicación, filtros, orden y página. Por debajo de lg, el disparador y la
// hoja «Filtrar y ordenar» (01.2) sustituyen al aside y a «Ordenar por» (D7).

/** Destino de foco que resuelve esta vista (useRouteFocus, FocusState): el nombre de la primera tarjeta. */
export const FIRST_RESULT = 'primer-resultado'

// Valor de «Ciudad de México» en el select: toda la ciudad es la ausencia de
// `ubicacion`. No es "" porque c-field pinta en secundario la opción vacía, y
// aquí es un valor real (Figma: Filled).
const WHOLE_CITY = 'ciudad-de-mexico'

// Row desde 36rem de li; por debajo de lg, el li mide el viewport menos el
// gutter (2 × space-4), así que Row desde 38rem de viewport. Desde lg, siempre
// Row. Con barra clásica, entre 608 y 622 pide la de 192 sin necesitarla.
const PHOTO_SIZES = '(min-width: 38rem) 4rem, 3rem'
// Las dos primeras tarjetas del corte caben sobre el pliegue en 1440 × 900.
const EAGER_CARDS = 2

const SORT_LABELS: Record<SearchParams['orden'], string> = {
  disponibilidad: 'Disponibilidad más próxima',
  experiencia: 'Años de experiencia',
  cercania: 'Cercanía',
}
const MODALITY_LABELS: Record<(typeof MODALITY_FILTERS)[number], string> = {
  presencial: 'Presencial',
  videoconsulta: 'Videoconsulta',
}
const WINDOW_LABELS: Record<(typeof AVAILABILITY_WINDOWS)[number], string> = {
  hoy: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
}

type Loaded = { key: string; page: number; total: number; results: Specialist[] }

const run = (params: SearchParams): Loaded => ({ key: searchKey(params), page: params.pagina, ...searchSpecialists(params) })

// Resultados de la URL. Sin escenario, al momento. Con «lenta» (D8), cada
// búsqueda, cada página y cada «Ver más» tardan 1500 ms: hasta entonces se
// muestra lo último cargado y la vista deriva de la diferencia si es una
// búsqueda nueva (clave distinta) o solo otra página.
function useResults(params: SearchParams, scenario: Scenario) {
  const immediate = useMemo(() => (scenario === 'lenta' ? null : run(params)), [params, scenario])
  const [slow, setSlow] = useState<Loaded | null>(null)

  useEffect(() => {
    if (scenario !== 'lenta') return
    let current = true
    void withScenario(scenario, () => run(params)).then((loaded) => {
      if (current) setSlow(loaded)
    })
    return () => {
      current = false
    }
  }, [params, scenario])

  return immediate ?? slow
}

// Parámetros de la búsqueda sin su página: cualquier cambio de filtros u orden
// vuelve a la primera (replace y sin subir el scroll: con radios, cada flecha
// selecciona, y un push por tecla llenaría el historial).
function useSearchUpdate() {
  const [searchParams, setSearchParams] = useSearchParams()
  return (change: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(searchParams)
    next.delete('pagina')
    change(next)
    setSearchParams(next, { replace: true, preventScrollReset: true })
  }
}

function SearchForm({ params, scenario }: { params: SearchParams; scenario: Scenario }) {
  const [, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(params.q)
  const [place, setPlace] = useState<string>(params.ubicacion ?? WHOLE_CITY)
  // Los campos siguen a la URL cuando cambia por otro camino («Ver todos»,
  // «Buscar en toda la Ciudad de México», Atrás).
  const [synced, setSynced] = useState({ q: params.q, ubicacion: params.ubicacion })
  if (synced.q !== params.q || synced.ubicacion !== params.ubicacion) {
    setSynced({ q: params.q, ubicacion: params.ubicacion })
    setQuery(params.q)
    setPlace(params.ubicacion ?? WHOLE_CITY)
  }

  // Una consulta nueva limpia los filtros y la página (diseño §5.1); el orden
  // no es un filtro y el escenario viaja (D8). Push: es otra búsqueda.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = new URLSearchParams()
    const q = query.trim()
    if (q) next.set('q', q)
    if (place !== WHOLE_CITY) next.set('ubicacion', place)
    if (params.orden !== 'disponibilidad') next.set('orden', params.orden)
    if (scenario) next.set('escenario', scenario)
    setSearchParams(next, { preventScrollReset: true })
  }

  const places = [
    { value: WHOLE_CITY, label: CITY },
    ...NEIGHBORHOODS.map((n) => ({ value: n, label: CLINICS[n].neighborhood })),
  ]

  // Sin JS, el GET nativo lleva a la misma URL (la guarda ignora
  // ubicacion=ciudad-de-mexico); los ocultos conservan orden y escenario.
  return (
    <form className="c-search-form" role="search" action="/" method="get" onSubmit={submit}>
      <FieldText
        label="Especialidad o nombre"
        name="q"
        placeholder="Por ejemplo, pediatría"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <FieldSelect
        label="Ubicación"
        name="ubicacion"
        options={places}
        value={place}
        onChange={(event) => setPlace(event.target.value)}
      />
      {params.orden !== 'disponibilidad' && <input type="hidden" name="orden" value={params.orden} />}
      {scenario && <input type="hidden" name="escenario" value={scenario} />}
      <Button type="submit" className="c-search-form__submit">
        Buscar
      </Button>
    </form>
  )
}

// Filtros y orden, tal como se escriben en la URL. El orden no es un filtro:
// no cuenta en el disparador y «Limpiar» lo conserva (C3 de V1b).
type Filters = Pick<SearchParams, 'especialidad' | 'modalidad' | 'disponibilidad' | 'orden'>

const NO_FILTERS = { especialidad: [], modalidad: [], disponibilidad: null } satisfies Partial<Filters>

const filtersOf = ({ especialidad, modalidad, disponibilidad, orden }: SearchParams): Filters => ({ especialidad, modalidad, disponibilidad, orden })

/** Contador del disparador (§4.4): opciones marcadas; una ventana de disponibilidad cuenta 1. */
const filterCount = (f: Filters) => f.especialidad.length + f.modalidad.length + (f.disponibilidad ? 1 : 0)

// En el orden de las opciones, como las escribe el aside (una URL por estado).
function writeFilters(next: URLSearchParams, f: Filters) {
  next.delete('especialidad')
  next.delete('modalidad')
  for (const area of f.especialidad) next.append('especialidad', area)
  for (const modality of f.modalidad) next.append('modalidad', modality)
  if (f.disponibilidad) next.set('disponibilidad', f.disponibilidad)
  else next.delete('disponibilidad')
  if (f.orden === 'disponibilidad') next.delete('orden')
  else next.set('orden', f.orden)
}

type FilterGroupsProps = {
  value: Filters
  onChange: (next: Filters) => void
  /** «Ordenar por» como grupo de radios: solo en la hoja (en escritorio es un select en la cabecera). */
  sort?: boolean
}

// Grupos de filtro (panel 01.0): el mismo marcado en el aside y en la hoja.
// Especialidad y Modalidad, casillas; Disponibilidad y Ordenar por, radios
// que parten de una opción seleccionada. Controlados: quien los compone decide
// si un cambio va a la URL (aside) o a un borrador (hoja).
function FilterGroups({ value, onChange, sort = false }: FilterGroupsProps) {
  const toggleArea = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: area, checked } = event.target
    const selected = new Set<string>(value.especialidad)
    if (checked) selected.add(area)
    else selected.delete(area)
    onChange({ ...value, especialidad: FILTER_AREAS.filter((a) => selected.has(a)) })
  }

  const toggleModality = (event: ChangeEvent<HTMLInputElement>) => {
    const { value: modality, checked } = event.target
    const selected = new Set<string>(value.modalidad)
    if (checked) selected.add(modality)
    else selected.delete(modality)
    onChange({ ...value, modalidad: MODALITY_FILTERS.filter((m) => selected.has(m)) })
  }

  const setWindow = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, disponibilidad: AVAILABILITY_WINDOWS.find((w) => w === event.target.value) ?? null })

  const setSort = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, orden: SORTS.find((s) => s === event.target.value) ?? 'disponibilidad' })

  return (
    <>
      {sort && (
        <fieldset className="o-stack o-stack--gap-1">
          <Legend level="group">Ordenar por</Legend>
          <div className="o-stack o-stack--gap-0">
            {SORTS.map((option) => (
              <Radio label={SORT_LABELS[option]} name="orden" value={option} checked={value.orden === option} onChange={setSort} key={option} />
            ))}
          </div>
        </fieldset>
      )}
      <fieldset className="o-stack o-stack--gap-1">
        <Legend level="group">Especialidad</Legend>
        <div className="o-stack o-stack--gap-0">
          {FILTER_AREAS.map((area) => (
            <Checkbox
              label={AREAS[area]}
              name="especialidad"
              value={area}
              checked={value.especialidad.includes(area)}
              onChange={toggleArea}
              key={area}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="o-stack o-stack--gap-1">
        <Legend level="group">Modalidad</Legend>
        <div className="o-stack o-stack--gap-0">
          {MODALITY_FILTERS.map((modality) => (
            <Checkbox
              label={MODALITY_LABELS[modality]}
              name="modalidad"
              value={modality}
              checked={value.modalidad.includes(modality)}
              onChange={toggleModality}
              key={modality}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="o-stack o-stack--gap-1">
        <Legend level="group">Disponibilidad</Legend>
        <div className="o-stack o-stack--gap-0">
          <Radio label="Cualquier fecha" name="disponibilidad" value="" checked={value.disponibilidad === null} onChange={setWindow} />
          {AVAILABILITY_WINDOWS.map((window) => (
            <Radio
              label={WINDOW_LABELS[window]}
              name="disponibilidad"
              value={window}
              checked={value.disponibilidad === window}
              onChange={setWindow}
              key={window}
            />
          ))}
        </div>
      </fieldset>
    </>
  )
}

// Aside «Filtros» de escritorio (panel 01.0): se aplican al marcarlos, sin
// botón de aplicar; el recuento anuncia el total. «Limpiar filtros» devuelve
// cada grupo a su opción inicial y el foco se queda en el botón.
function SearchFilters({ params }: { params: SearchParams }) {
  const titleId = useId()
  const update = useSearchUpdate()
  const value = filtersOf(params)

  return (
    <aside className="c-search-filters o-stack o-stack--gap-5" aria-labelledby={titleId}>
      <h2 className="c-search-filters__title" id={titleId}>
        Filtros
      </h2>
      <form className="o-stack o-stack--gap-6" onSubmit={(event) => event.preventDefault()}>
        <FilterGroups value={value} onChange={(next) => update((url) => writeFilters(url, next))} />
        <div>
          <Button variant="secondary" onClick={() => update(clearFilters)}>
            Limpiar filtros
          </Button>
        </div>
      </form>
    </aside>
  )
}

type FilterSheetProps = {
  params: SearchParams
  trigger: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

// Hoja «Filtrar y ordenar» (01.2, panel 01.0). Un borrador que nace de la URL
// al abrirla: «Ver N resultados» lo aplica y cierra; «Limpiar» vacía los
// filtros del borrador sin cerrar ni tocar la URL (el orden se conserva);
// «Cerrar» y Escape lo descartan. El foco vuelve al disparador en los tres
// casos.
//
// N es el total que daría el borrador, al momento también con «lenta»: es una
// vista previa, no una búsqueda (D8). El fondo es inert y la región del
// recuento de la página no se oye: la hoja lleva la suya, vacía al abrir para
// no anunciar nada hasta el primer cambio.
function FilterSheet({ params, trigger, onClose }: FilterSheetProps) {
  const update = useSearchUpdate()
  const [draft, setDraft] = useState<Filters>(() => filtersOf(params))
  const [announced, setAnnounced] = useState('')
  const total = searchSpecialists({ ...params, ...draft, pagina: 1 }).total

  const change = (next: Filters) => {
    setDraft(next)
    setAnnounced(countText(searchSpecialists({ ...params, ...next, pagina: 1 }).total))
  }

  return (
    <Sheet
      title="Filtrar y ordenar"
      returnFocus={trigger}
      onDismiss={onClose}
      onSubmit={() => {
        update((url) => writeFilters(url, draft))
        onClose()
      }}
      footer={
        <>
          <Button variant="secondary" onClick={() => change({ ...draft, ...NO_FILTERS })}>
            Limpiar
          </Button>
          <Button type="submit" className="c-sheet__fill">
            {total === 1 ? 'Ver 1 resultado' : `Ver ${total} resultados`}
          </Button>
        </>
      }
    >
      <div className="o-stack o-stack--gap-6">
        <FilterGroups value={draft} onChange={change} sort />
      </div>
      <p className="u-sr-only" role="status">
        {announced}
      </p>
    </Sheet>
  )
}

function clearFilters(next: URLSearchParams) {
  next.delete('especialidad')
  next.delete('modalidad')
  next.delete('disponibilidad')
}

function countText(total: number) {
  return total === 1 ? '1 resultado' : `${total} resultados`
}

function hrefWith(params: URLSearchParams) {
  const search = params.toString()
  return search ? `/?${search}` : '/'
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parseSearch(searchParams), [searchParams])
  const scenario = scenarioFrom(searchParams)
  const isDesktop = useMediaQuery('lg')
  const update = useSearchUpdate()
  const location = useLocation()
  const navigationType = useNavigationType()

  const loaded = useResults(params, scenario)
  const key = searchKey(params)
  // Búsqueda nueva en curso: aún no se sabe el total.
  const searching = !loaded || loaded.key !== key
  // Misma búsqueda, otra página: el total sigue valiendo.
  const paging = !searching && loaded.page !== params.pagina
  const total = loaded?.total ?? 0
  const page = loaded ? clampPage(loaded.page, loaded.total) : 1
  const cards = searching || (paging && isDesktop) ? [] : pageSlice(loaded.results, page, !isDesktop)
  const skeletons = searching || paging ? PAGE_SIZE : 0
  const empty = !searching && total === 0

  // Conmutador «Avisarme» (diseño §7.3, 01.8, 01.9): almacén en memoria por
  // médico (D16), que sobrevive a ir al perfil y volver.
  const notified = useNotified()

  // Hoja de filtros (móvil). «lost»: estaba abierta y el viewport cruzó lg; el
  // disparador ya no existe (D7), así que el foco va al h1, el respaldo de
  // D12, y no se queda en body.
  const trigger = useRef<HTMLButtonElement>(null)
  const [sheet, setSheet] = useState<'closed' | 'open' | 'lost'>('closed')
  if (isDesktop && sheet === 'open') setSheet('lost')
  useEffect(() => {
    if (sheet === 'lost') document.getElementById(MAIN_TITLE_ID)?.focus({ preventScroll: true })
  }, [sheet])

  // Foco (o foco o región viva, diseño §4.6). Al llegar los datos, el foco va
  // al nombre de una tarjeta: la primera nueva tras «Ver más»; la primera tras
  // cambiar de página, tras los enlaces del vacío (state.focus) y tras
  // «Limpiar filtros» del vacío. «Buscar», los filtros y el orden no lo mueven:
  // su control sigue ahí y la región del recuento anuncia.
  //
  // Sin desplazar: tras «Ver más» y «Limpiar filtros» la tarjeta aparece donde
  // estaba el botón pulsado; tras Page Link y los enlaces del vacío, arriba,
  // con la primera tarjeta a la vista. Sin «lenta», este efecto corre en el
  // mismo commit que el scrollTo de <ScrollRestoration> y antes que él (es
  // hermano posterior del Outlet): con preventScroll, el resultado es el mismo.
  //
  // En un efecto de layout: con «lenta», el enlace pulsado («Siguiente» hacia
  // la última, «Anterior» hacia la primera) se desmonta en el commit que trae
  // los datos, y un useEffect correría en otra tarea con el foco en body entre
  // medias (medido tras V1b: 40 de 40; un frame pintado en 7).
  const names = useRef<(HTMLHeadingElement | null)[]>([])
  const pendingFocus = useRef<number | null>(null)
  const handledState = useRef<string | null>(null)
  const shown = useRef<{ key: string; page: number } | null>(null)

  useLayoutEffect(() => {
    if (searching || paging) return
    const previous = shown.current
    shown.current = { key, page }

    let index = pendingFocus.current
    const named = (location.state as { focus?: unknown } | null)?.focus
    if (named === FIRST_RESULT && navigationType !== 'POP' && handledState.current !== location.key) {
      handledState.current = location.key
      index = 0
    }
    // Page Link: push de la misma búsqueda con otra página.
    if (isDesktop && navigationType === 'PUSH' && previous?.key === key && previous.page !== page) index = 0
    if (index === null) return
    pendingFocus.current = null
    names.current[index]?.focus({ preventScroll: true })
  }, [searching, paging, key, page, isDesktop, location, navigationType])

  const loadMore = () => {
    pendingFocus.current = cards.length
    const next = new URLSearchParams(searchParams)
    next.set('pagina', String(page + 1))
    setSearchParams(next, { replace: true, preventScrollReset: true })
  }

  const clearFromEmpty = () => {
    pendingFocus.current = 0
    update(clearFilters)
  }

  const carried = carriedParams(searchParams).toString()
  const profileHref = (slug: string) => `/especialistas/${slug}${carried ? `?${carried}` : ''}`

  const pageHref = (target: number) => {
    const next = new URLSearchParams(searchParams)
    if (target === 1) next.delete('pagina')
    else next.set('pagina', String(target))
    return hrefWith(next)
  }

  return (
    <ViewLayout title="Especialistas" current="especialistas" bottomNav>
      <PageHeader title="Encuentra a tu especialista" subtitle="Elige a quién quieres ver y reserva en el horario que te acomode." />
      <SearchForm params={params} scenario={scenario} />
      <div className="o-layout o-layout--aside-start">
        {isDesktop && <SearchFilters params={params} />}
        <div className="o-stack o-stack--gap-5">
          <div className={isDesktop ? 'c-results-header' : 'c-results-header c-results-header--trigger'}>
            {!isDesktop && <FilterTrigger count={filterCount(filtersOf(params))} onClick={() => setSheet('open')} ref={trigger} />}
            <p className="c-results-header__count" role="status">
              {searching ? 'Buscando…' : countText(total)}
            </p>
            {isDesktop && !empty && (
              <FieldSelect
                label="Ordenar por"
                name="orden"
                options={SORTS.map((sort) => ({ value: sort, label: SORT_LABELS[sort] }))}
                value={params.orden}
                onChange={(event) =>
                  update((next) => {
                    if (event.target.value === 'disponibilidad') next.delete('orden')
                    else next.set('orden', event.target.value)
                  })
                }
                className="c-results-header__sort"
              />
            )}
          </div>
          {!isDesktop && sheet === 'open' && <FilterSheet params={params} trigger={trigger} onClose={() => setSheet('closed')} />}

          {empty ? (
            <Empty params={params} searchParams={searchParams} scenario={scenario} onClearFilters={clearFromEmpty} />
          ) : (
            <>
              <h2 className="u-sr-only">Resultados</h2>
              {/* Solo esqueletos: la lista entera fuera del árbol, o el lector
                  anunciaría «lista, 0 elementos». Con tarjetas y esqueletos
                  (Ver más), aria-busy mientras llegan. */}
              <ul
                className="o-stack o-stack--gap-4"
                role="list"
                aria-hidden={cards.length === 0 ? true : undefined}
                aria-busy={cards.length > 0 && skeletons > 0 ? true : undefined}
              >
                {cards.map((specialist, index) => (
                  <Card
                    specialist={specialist}
                    href={profileHref(specialist.slug)}
                    notified={notified.has(specialist.slug)}
                    onNotifyToggle={() => notifyStore.toggle(specialist.slug)}
                    loading={index < EAGER_CARDS ? 'eager' : 'lazy'}
                    nameRef={(element) => {
                      names.current[index] = element
                    }}
                    key={specialist.slug}
                  />
                ))}
                {Array.from({ length: skeletons }, (_, index) => (
                  <ResultCard state="loading" key={`carga-${index}`} />
                ))}
              </ul>
            </>
          )}

          {!searching && !isDesktop && total > PAGE_SIZE && (
            <LoadMore shown={cards.length} total={total} busy={paging} onLoadMore={loadMore} />
          )}
          {!searching && isDesktop && <Pagination current={page} total={pageCount(total)} hrefFor={pageHref} />}
        </div>
      </div>
    </ViewLayout>
  )
}

type CardProps = {
  specialist: Specialist
  href: string
  notified: boolean
  onNotifyToggle: () => void
  loading: 'eager' | 'lazy'
  nameRef: (element: HTMLHeadingElement | null) => void
}

function Card({ specialist: s, href, notified, onNotifyToggle, loading, nameRef }: CardProps) {
  const common = {
    name: s.name,
    specialty: s.specialtyLine,
    location: `${CLINICS[s.clinic].name} · ${CITY}`,
    modality: MODALITIES[s.modality],
    initial: s.initial,
    photo: PHOTOS[s.slug],
    photoSizes: PHOTO_SIZES,
    photoLoading: loading,
    nameRef,
  }
  const first = firstFree(s.slug)

  if (!first) {
    return (
      <ResultCard
        {...common}
        state="full"
        nextOpening={nextOpeningText(nextOpeningMonth(s))}
        notifyPressed={notified}
        onNotifyToggle={onNotifyToggle}
      />
    )
  }
  return <ResultCard {...common} state="available" nextSlot={nextSlotText(parseDate(first.date), first.time, TODAY)} href={href} />
}

type EmptyProps = {
  params: SearchParams
  searchParams: URLSearchParams
  scenario: Scenario
  onClearFilters: () => void
}

// Vacío (diseño §5.1): su título es el h2 de la columna. La consulta va entre
// comillas y tal como se escribió: `q` también busca por nombre, y el copy de
// Figma en minúsculas daría «especialistas en molina» (cambio declarado).
function Empty({ params, searchParams, scenario, onClearFilters }: EmptyProps) {
  const cause = emptyCause(params)

  if (cause === 'consulta') {
    // La búsqueda sin consulta; el escenario sigue (D8).
    const all = new URLSearchParams(scenario ? { escenario: scenario } : {})
    return (
      <EmptyState
        icon="magnifying-glass"
        headingLevel={2}
        title={`No encontramos especialistas para «${params.q}»`}
        help="Prueba con otra especialidad, amplía la ubicación o revisa la ortografía."
      >
        <Button variant="secondary" href={hrefWith(all)} state={{ focus: FIRST_RESULT }} className="c-empty-state__action">
          Ver todos los especialistas
        </Button>
      </EmptyState>
    )
  }

  if (cause === 'colonia' && params.ubicacion) {
    // Deshace solo lo que causó el vacío: conserva la consulta y quita la colonia.
    const city = new URLSearchParams(searchParams)
    city.delete('ubicacion')
    city.delete('pagina')
    return (
      <EmptyState
        icon="magnifying-glass"
        headingLevel={2}
        title={`No encontramos especialistas para «${params.q}» en ${CLINICS[params.ubicacion].neighborhood}`}
        help="Prueba en toda la Ciudad de México o en otra colonia."
      >
        <Button variant="secondary" href={hrefWith(city)} state={{ focus: FIRST_RESULT }} className="c-empty-state__action">
          Buscar en toda la Ciudad de México
        </Button>
      </EmptyState>
    )
  }

  return (
    <EmptyState
      icon="magnifying-glass"
      headingLevel={2}
      title="Ningún especialista cumple estos filtros"
      help="Quita algún filtro para ver más resultados."
    >
      <Button variant="secondary" onClick={onClearFilters} className="c-empty-state__action">
        Limpiar filtros
      </Button>
    </EmptyState>
  )
}
