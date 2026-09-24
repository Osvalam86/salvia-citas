import { useEffect, useRef, useState, type Ref } from 'react'
import { useSearchParams } from 'react-router'
import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import BackLink from '../components/BackLink.tsx'
import FilterTrigger from '../components/FilterTrigger.tsx'
import LoadMore from '../components/LoadMore.tsx'
import Pagination from '../components/Pagination.tsx'
import ResultCard, { type ResultCardProps } from '../components/ResultCard.tsx'

// Catálogo de 4.5 Búsqueda y resultados (D9). Página propia: sus botones,
// etiquetas y avatares no entran en las medidas de /kit de 4.1 y 4.2.
//
// Datos: las cuatro tarjetas de la pantalla 01.5 de Figma, sin fotos (su
// origen está pendiente, DESIGN.md). La demo de «Ver más» repite esas cuatro:
// los 34 especialistas llegan con los datos de la fase 5 (D4). El retraso de
// 800 ms solo existe aquí, para ver la carga; las vistas usarán ?escenario=
// (D8).

type CardData = Extract<ResultCardProps, { state: 'available' }> | Omit<Extract<ResultCardProps, { state: 'full' }>, 'notifyPressed' | 'onNotifyToggle'>

const CARDS: CardData[] = [
  {
    state: 'available',
    name: 'Dra. Mariana Cifuentes Poza',
    specialty: 'Cardiología pediátrica · 15 años',
    location: 'Clínica Condesa · Ciudad de México',
    modality: 'Presencial y videoconsulta',
    initial: 'M',
    nextSlot: 'Próxima cita: hoy, 19:15',
    href: '/especialistas/mariana-cifuentes-poza',
  },
  {
    state: 'available',
    name: 'Dra. Elena Ruiz Arellano',
    specialty: 'Cardiología · 12 años de experiencia',
    location: 'Clínica Roma Norte · Ciudad de México',
    modality: 'Presencial',
    initial: 'E',
    nextSlot: 'Próxima cita: mar 24 abr, 10:30',
    href: '/especialistas/elena-ruiz-arellano',
  },
  {
    state: 'available',
    name: 'Dr. Joaquín Bermúdez Lara',
    specialty: 'Cardiología intervencionista · 8 años',
    location: 'Hospital Ángeles Pedregal · Ciudad de México',
    modality: 'Presencial',
    initial: 'J',
    nextSlot: 'Próxima cita: jue 26 abr, 17:00',
    href: '/especialistas/joaquin-bermudez-lara',
  },
  {
    state: 'full',
    name: 'Dr. Rodrigo Alcántara Vela',
    specialty: 'Electrofisiología · 20 años',
    location: 'Centro Médico Nacional · Ciudad de México',
    modality: 'Presencial',
    initial: 'R',
    nextOpening: 'Sin disponibilidad · próximo cupo en mayo',
  },
]

const PAGE_SIZE = 4
const DEMO_TOTAL = 12
const DEMO_DELAY = 800

function Card({ data, nameRef }: { data: CardData; nameRef?: Ref<HTMLHeadingElement> }) {
  const [pressed, setPressed] = useState(false)
  if (data.state === 'available') return <ResultCard {...data} nameRef={nameRef} />
  return <ResultCard {...data} nameRef={nameRef} notifyPressed={pressed} onNotifyToggle={() => setPressed(!pressed)} />
}

// «Ver más»: 4 esqueletos al final y aria-busy en la lista; al llegar los
// datos, el foco pasa al nombre de la primera tarjeta nueva.
function LoadMoreDemo() {
  const [shown, setShown] = useState(PAGE_SIZE)
  const [busy, setBusy] = useState(false)
  const firstNew = useRef<HTMLHeadingElement>(null)
  const focusFrom = useRef<number | null>(null)

  useEffect(() => {
    if (focusFrom.current === null) return
    focusFrom.current = null
    firstNew.current?.focus()
  }, [shown])

  const loadMore = () => {
    setBusy(true)
    window.setTimeout(() => {
      focusFrom.current = shown
      setShown(shown + PAGE_SIZE)
      setBusy(false)
    }, DEMO_DELAY)
  }

  return (
    <div className="o-stack o-stack--gap-5">
      <ul className="o-stack o-stack--gap-4" role="list" aria-busy={busy} id="kit-lista-ver-mas">
        {Array.from({ length: shown }, (_, index) => (
          <Card data={CARDS[index % CARDS.length]} nameRef={index === shown - PAGE_SIZE && index > 0 ? firstNew : undefined} key={index} />
        ))}
        {busy && Array.from({ length: PAGE_SIZE }, (_, index) => <ResultCard state="loading" key={`loading-${index}`} />)}
      </ul>
      <LoadMore shown={shown} total={DEMO_TOTAL} busy={busy} onLoadMore={loadMore} />
    </div>
  )
}

export default function KitResults() {
  const [params] = useSearchParams()
  const page = Math.min(Math.max(Number(params.get('pagina')) || 1, 1), 9)

  return (
    <AppLayout>
      <div className="c-kit">
        <div className="o-stack o-stack--gap-4">
          <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
            Búsqueda y resultados
          </h1>
          <p>
            <BackLink href="/kit">Kit del sistema</BackLink>
          </p>
        </div>

        <section className="c-kit__section" aria-labelledby="kit-result-card">
          <h2 className="c-kit__heading" id="kit-result-card">
            Result Card
          </h2>
          <p>
            Stacked por defecto; Row cuando el li alcanza 32rem. El CTA de la tarjeta llena es un
            conmutador. La última tarjeta está en carga: fuera del árbol accesible.
          </p>
          <ul className="o-stack o-stack--gap-4" role="list" id="kit-lista-estados">
            {CARDS.map((data) => (
              <Card data={data} key={data.name} />
            ))}
            <ResultCard state="loading" />
          </ul>
          <h3 className="c-kit__subheading">Respaldo de la foto</h3>
          <p>
            La foto de esta tarjeta no existe a propósito: al fallar la carga, se retira y queda la
            inicial.
          </p>
          <ul className="o-stack o-stack--gap-4" role="list" id="kit-lista-respaldo">
            <ResultCard {...(CARDS[1] as Extract<CardData, { state: 'available' }>)} photo={{ src: '/fotos/no-existe.webp' }} />
          </ul>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-filter-trigger">
          <h2 className="c-kit__heading" id="kit-filter-trigger">
            Filter Trigger
          </h2>
          <p>Sin filtros, con uno y con dos. La hoja que abre llega con la vista 1.</p>
          <div className="o-cluster o-cluster--gap-3 o-cluster--align-center">
            <FilterTrigger count={0} />
            <FilterTrigger count={1} />
            <FilterTrigger count={2} />
          </div>
        </section>

        <section className="c-kit__section" aria-labelledby="kit-paginacion">
          <h2 className="c-kit__heading" id="kit-paginacion">
            Pagination y Page Link
          </h2>
          <p>Página {page} de 9.</p>
          <Pagination current={page} total={9} hrefFor={(p) => `/kit/resultados?pagina=${p}#kit-paginacion`} />
        </section>

        <section className="c-kit__section" aria-labelledby="kit-load-more">
          <h2 className="c-kit__heading" id="kit-load-more">
            Load More
          </h2>
          <LoadMoreDemo />
        </section>
      </div>
    </AppLayout>
  )
}
