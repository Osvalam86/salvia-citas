import { useSearchParams } from 'react-router'
import AppLayout, { MAIN_TITLE_ID } from '../components/AppLayout.tsx'
import BackLink from '../components/BackLink.tsx'

// Demo del shell y de o-layout en el catálogo (D9). Parámetros:
// - aside=inicio|fin: el aside va antes o después en el DOM, que es también el
//   orden visual (o-layout nunca reordena).
// - lineas=1|2|3: alto de la barra de demo, para comprobar que el
//   scroll-padding sigue a la barra presente (criterio 2.4.11).

const columnItems = Array.from({ length: 30 }, (_, index) => index + 1)
const asideItems = Array.from({ length: 5 }, (_, index) => index + 1)
const barLines = [
  'Barra de demo: su alto lo mide el shell.',
  'Segunda línea: la barra crece y el scroll-padding la sigue.',
  'Tercera línea: el foco sigue sin quedar debajo.',
]

export default function KitLayout() {
  const [params] = useSearchParams()
  const side = params.get('aside') === 'fin' ? 'end' : 'start'
  const lines = Math.min(Math.max(Number(params.get('lineas')) || 1, 1), barLines.length)

  const aside = (
    <aside className="c-kit__panel" aria-labelledby="kit-layout-aside">
      <h2 className="c-kit__heading" id="kit-layout-aside">
        Aside
      </h2>
      <p>320 desde lg; apilado por debajo.</p>
      {asideItems.map((item) => (
        <button type="button" key={item}>
          Aside {item}
        </button>
      ))}
    </aside>
  )

  const column = (
    <section className="c-kit__panel" aria-labelledby="kit-layout-columna">
      <h2 className="c-kit__heading" id="kit-layout-columna">
        Columna
      </h2>
      <p>Fluida. Correo sin cortes: karla.sanchez@ejemplo.com</p>
      {columnItems.map((item) => (
        <button type="button" key={item}>
          {item === columnItems.length ? 'Último elemento de la página' : `Columna ${item}`}
        </button>
      ))}
    </section>
  )

  const bar = (
    <div className="c-kit-bar">
      <div className="o-wrapper o-stack o-stack--gap-1">
        {barLines.slice(0, lines).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )

  return (
    <AppLayout bar={bar}>
      <div className="c-kit">
        <h1 className="c-kit__title" id={MAIN_TITLE_ID} tabIndex={-1}>
          Layout · aside al {side === 'start' ? 'inicio' : 'final'}
        </h1>
        <p>
          <BackLink href="/kit">Kit del sistema</BackLink>
        </p>
        <div className={`o-layout o-layout--aside-${side}`}>
          {side === 'start' ? aside : column}
          {side === 'start' ? column : aside}
        </div>
      </div>
    </AppLayout>
  )
}
