import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import BackLink from '../components/BackLink.tsx'
import Avatar from '../components/Avatar.tsx'
import Link from '../components/Link.tsx'
import { PHOTOS } from '../data/photos.ts'
import { SLUGS, findSpecialist } from '../data/specialists.ts'

// Estados de demo (D8, /kit/estados): un enlace a cada estado de las 32
// pantallas de Figma, con su frame móvil y el de escritorio. Los que no tienen
// URL propia (hojas, diálogo, menú, errores al enviar) dicen qué interacción
// lleva a ellos. Va en producción con el catálogo (D9).

type State = { frames: string; label: string } & ({ href: string; steps?: string } | { href?: never; steps: string })

const url = (path: string, params: Record<string, string> = {}) => {
  const search = new URLSearchParams(params).toString()
  return search ? `${path}?${search}` : path
}

const PHOTO_PEOPLE = [SLUGS.mariana, SLUGS.ruiz, SLUGS.rodrigo].map((slug) => findSpecialist(slug)!)

const RUIZ = `/especialistas/${SLUGS.ruiz}`
const RUIZ_SLOT = { fecha: '2029-04-24', hora: '10:30' }
const SEARCH_011 = { q: 'Cardiología', especialidad: 'cardiologia' }

const GROUPS: { id: string; title: string; states: State[] }[] = [
  {
    id: 'estados-v1',
    title: 'Vista 1 · Búsqueda',
    states: [
      { frames: '01.1 (180:2666) · 01.5 (180:3261)', label: 'Resultados', href: url('/', SEARCH_011) },
      { frames: '01.2 (180:2869)', label: 'Hoja de filtros', steps: '«Filtrar y ordenar» en Resultados, por debajo de 64rem' },
      { frames: '01.3 (180:3038) · 01.6 (180:3625)', label: 'Vacío', href: url('/', { q: 'Neurocirugía pediátrica' }) },
      { frames: '01.4 (180:3116) · 01.7 (180:3900)', label: 'Carga', href: url('/', { ...SEARCH_011, escenario: 'lenta' }) },
      { frames: '01.8 (345:9322) · 01.9 (345:9509)', label: 'Aviso activado', steps: '«Avisarme» en la tarjeta de Rodrigo, en Resultados' },
    ],
  },
  {
    id: 'estados-v2',
    title: 'Vista 2 · Perfil y selección de horario',
    states: [
      { frames: '02.1 (223:4980) · 02.5 (236:5881)', label: 'Horarios', href: url(RUIZ, RUIZ_SLOT) },
      { frames: '02.2 (236:5186)', label: 'Hoja del calendario', steps: '«Ver mes completo» en Horarios, por debajo de 64rem' },
      { frames: '02.3 (236:5560) · 02.6 (236:6276)', label: 'Sin horarios', href: url(RUIZ, { fecha: '2029-04-23' }) },
      { frames: '02.4 (236:5722)', label: 'Confirmación previa', href: url(`${RUIZ}/confirmar`, RUIZ_SLOT) },
    ],
  },
  {
    id: 'estados-v3',
    title: 'Vista 3 · Datos del paciente',
    states: [
      { frames: '03.1 (258:1327) · 03.3 (258:3180)', label: 'Formulario', href: url(`${RUIZ}/datos`, RUIZ_SLOT) },
      { frames: '03.2 (258:1505) · 03.4 (258:5354)', label: 'Errores', steps: 'En Formulario, correo «karla@», motivo sin elegir, aviso sin marcar y «Confirmar cita»' },
      { frames: '03.5 (343:8940) · 03.6 (345:9098)', label: 'Reserva fallida', href: url(`${RUIZ}/datos`, { ...RUIZ_SLOT, escenario: 'ocupada' }), steps: 'motivo «Primera consulta», las dos casillas y «Confirmar cita»' },
    ],
  },
  {
    id: 'estados-v4',
    title: 'Vista 4 · Confirmación y Mis citas',
    states: [
      { frames: '04.1 (277:5908) · 04.4 (284:6687)', label: 'Cita reservada', href: '/citas/c1/confirmada' },
      { frames: '04.2 (284:6341) · 04.5 (284:6833)', label: 'Mis citas', href: '/mis-citas' },
      { frames: '04.3 (284:6521) · 04.6 (284:7066)', label: 'Diálogo de cancelar', steps: '«Cancelar cita» del Dr. Molina, en Mis citas' },
      { frames: '04.8 (339:8548) · 04.9 (339:8737)', label: 'Cita cancelada', steps: '«Cancelar cita» dentro del diálogo' },
      { frames: '04.7 (284:7273)', label: 'Menú de cuenta', steps: 'Botón «Karla Sánchez» del header, desde 64rem' },
      { frames: '02.7 (357:6603) · 02.8 (357:6811)', label: 'Reprogramar', href: url('/mis-citas/c3/reprogramar', { fecha: '2029-05-17', hora: '17:00' }) },
    ],
  },
  {
    id: 'estados-sin-frame',
    title: 'Piezas sin frame (diseño §7) y 404',
    states: [
      { frames: '§7.1', label: 'Página genérica', href: '/fuera-de-alcance' },
      { frames: '§7.2', label: 'Aviso de reprogramación', steps: '«Confirmar hora» en Reprogramar' },
      { frames: 'D1', label: 'Página no encontrada', href: '/no-existe' },
    ],
  },
]

export default function KitStates() {
  return (
    <AppLayout>
      <div className="c-kit">
        <div className="o-stack o-stack--gap-4">
          <title>Estados de demo · Kit · Salvia</title>
          <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
            Estados de demo
          </h1>
          <p>
            <BackLink href="/kit">Kit del sistema</BackLink>
          </p>
          <p>
            Cada estado de las 32 pantallas de Figma, con el frame móvil y el de escritorio. Los que no
            tienen dirección propia dicen qué hacer para llegar a ellos.
          </p>
        </div>

        <section className="c-kit__section" aria-labelledby="estados-fotos">
          <h2 className="c-kit__heading" id="estados-fotos">
            Fotos de avatar
          </h2>
          <p>
            Las tres personas con foto en Figma, en Small (48) y Medium (64). Recorte por foto: de los
            ojos a la barbilla, el 30 % del lado, con los ojos al 40 % desde arriba.
          </p>
          <ul className="o-cluster o-cluster--gap-5 o-cluster--align-center" role="list" id="estados-fotos-lista">
            {PHOTO_PEOPLE.map((person) => (
              <li className="o-cluster o-cluster--gap-3 o-cluster--align-center" key={person.slug}>
                <Avatar size="small" initial={person.initial} photo={PHOTOS[person.slug]} />
                <Avatar size="medium" initial={person.initial} photo={PHOTOS[person.slug]} />
                <span>{person.name}</span>
              </li>
            ))}
          </ul>
        </section>

        {GROUPS.map((group) => (
          <section className="c-kit__section" aria-labelledby={group.id} key={group.id}>
            <h2 className="c-kit__heading" id={group.id}>
              {group.title}
            </h2>
            <ul className="o-stack o-stack--gap-3" role="list">
              {group.states.map((state) => (
                <li key={state.label}>
                  {state.href ? <Link href={state.href}>{state.label}</Link> : <strong>{state.label}</strong>}
                  {state.steps && <p>{state.href ? `Después: ${state.steps}.` : `${state.steps}.`}</p>}
                  <p className="c-kit__meta">{state.frames}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </AppLayout>
  )
}
