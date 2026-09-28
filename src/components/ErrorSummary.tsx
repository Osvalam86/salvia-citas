import type { MouseEvent, Ref } from 'react'
import Icon from './Icon.tsx'
import Link from './Link.tsx'

export type ErrorSummaryItem = {
  /** id del control con error: destino del enlace. */
  id: string
  /** Nombre del campo, no el mensaje: el mensaje vive junto al campo (diseño §5.3). */
  label: string
}

type ErrorSummaryProps = {
  items: ErrorSummaryItem[]
  /** El h2 recibe el foco al enviar (tabIndex -1): la pantalla lo enfoca. */
  headingRef: Ref<HTMLHeadingElement>
}

// Enlace → control, sin entrada de historial (diseño §5.3): el foco va al
// control sin desplazar y después su etiqueta (o la legend del grupo, en una
// casilla o un radio) se desplaza al inicio de la vista, así que el control
// queda debajo y por encima de la barra (2.4.11).
function goToControl(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const control = document.getElementById(id)
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement || control instanceof HTMLTextAreaElement)) return
  event.preventDefault()
  control.focus({ preventScroll: true })
  const grouped = control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')
  const label = grouped ? control.closest('fieldset')?.querySelector('legend') : control.labels?.[0]
  const target = label ?? control
  target.scrollIntoView({ block: 'start' })
}

// Resumen de errores (c-error-summary; diseño §5.3, Figma 03.2 y 03.4).
// Patrón de pantalla, no uno de los 34: el número de enlaces varía (D5). Solo
// existe tras un envío fallido. El contenedor es un div sin rol; el foco va al
// h2, que se anuncia al recibirlo, así que no es región viva (diseño §4.6).
export default function ErrorSummary({ items, headingRef }: ErrorSummaryProps) {
  const count = items.length

  return (
    <div className="c-error-summary">
      <div className="c-error-summary__heading">
        <span className="c-error-summary__icon-slot">
          <Icon name="warning-circle" size={20} className="c-error-summary__icon" />
        </span>
        <h2 className="c-error-summary__title" ref={headingRef} tabIndex={-1}>
          {`Corrige ${count} ${count === 1 ? 'campo' : 'campos'} para continuar`}
        </h2>
      </div>
      <ul className="c-error-summary__list" role="list">
        {items.map((item) => (
          <li key={item.id}>
            <Link href={`#${item.id}` as const} onClick={(event) => goToControl(event, item.id)}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
