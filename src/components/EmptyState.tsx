import type { ReactNode } from 'react'
import Icon from './Icon.tsx'
import type { IconName } from './iconNames.ts'

type EmptyStateProps = {
  /** Glifo de la placa: magnifying-glass en la búsqueda, calendar-blank sin horarios. */
  icon: IconName
  /**
   * El título es el encabezado de la columna (diseño §3.7): h2 en la búsqueda,
   * donde sustituye al h2 «Resultados»; h3 en el «sin horarios» de la vista 2.
   */
  headingLevel: 2 | 3
  title: string
  help: string
  /** Acciones, todas Secondary: el vacío ocupa el sitio de una lista. */
  children: ReactNode
}

// Estado vacío de pantalla (c-empty-state). No es uno de los 34: excepción
// declarada en D5, como PageHeader. Ocupa el hueco de la lista con el marco de
// la tarjeta. La raíz es el contenedor (sin padding, como el li de Result
// Card) y __box la caja con el marco. Las acciones llevan la mezcla
// c-empty-state__action.
export default function EmptyState({ icon, headingLevel, title, help, children }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <div className="c-empty-state">
      <div className="c-empty-state__box">
        <span className="c-empty-state__badge">
          <Icon name={icon} size={24} />
        </span>
        <div className="c-empty-state__message">
          <Heading className="c-empty-state__title">{title}</Heading>
          <p className="c-empty-state__help">{help}</p>
        </div>
        <div className="c-empty-state__actions">{children}</div>
      </div>
    </div>
  )
}
