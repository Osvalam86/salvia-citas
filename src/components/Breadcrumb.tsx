import { Link as RouterLink } from 'react-router'

type Crumb = { label: string; href: string }

type BreadcrumbProps = {
  /** Niveles con enlace, de la raíz hacia abajo. Uno (Levels=2) o dos (Levels=3). */
  levels: [Crumb] | [Crumb, Crumb]
  /** Nivel actual: texto, no enlace. */
  current: string
}

// UI/Breadcrumb. Solo en escritorio y nunca en los destinos de primer nivel
// (diseño §4.3). La raíz es «Especialistas» (/): no hay nivel «Inicio».
// El separador va con aria-hidden y no en un ::before: el content de un
// pseudo-elemento entra en el árbol de accesibilidad en varios navegadores.
export default function Breadcrumb({ levels, current }: BreadcrumbProps) {
  return (
    <nav className="c-breadcrumb" aria-label="Ruta de navegación">
      <ol className="c-breadcrumb__list" role="list">
        {levels.map(({ label, href }) => (
          <li className="c-breadcrumb__item" key={href}>
            <RouterLink to={href} className="c-breadcrumb__link">
              {label}
            </RouterLink>
            <span className="c-breadcrumb__separator" aria-hidden="true">
              /
            </span>
          </li>
        ))}
        <li className="c-breadcrumb__item">
          <span className="c-breadcrumb__current" aria-current="page">
            {current}
          </span>
        </li>
      </ol>
    </nav>
  )
}
