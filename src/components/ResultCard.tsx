import { useId, type Ref } from 'react'
import Avatar, { type AvatarPhoto } from './Avatar.tsx'
import Button from './Button.tsx'
import Icon from './Icon.tsx'
import Tag from './Tag.tsx'

type Specialist = {
  /** Nombre con tratamiento («Dra. Elena Ruiz Arellano»): el h3 de la tarjeta. */
  name: string
  specialty: string
  location: string
  /** Modalidad de consulta (UI/Tag). */
  modality: string
  /** Respaldo del avatar. */
  initial: string
  photo?: AvatarPhoto
  /**
   * sizes y loading de la foto. Los decide la vista, que sabe qué ancho tiene
   * la lista (y con él, Stacked o Row) y qué tarjetas quedan bajo el pliegue.
   */
  photoSizes?: string
  photoLoading?: 'eager' | 'lazy'
  /**
   * Destino de foco programático (tabIndex -1): «Ver más especialistas» lleva
   * el foco al nombre de la primera tarjeta nueva.
   */
  nameRef?: Ref<HTMLHeadingElement>
}

type Available = Specialist & {
  state: 'available'
  /** «Próxima cita: mar 24 abr, 10:30». */
  nextSlot: string
  /** Perfil del especialista: «Ver horarios» navega, no es un botón. */
  href: string
}

// El CTA es un conmutador (diseño §7.3): aria-pressed, la etiqueta pasa a «Te
// avisaremos» con check y el foco se queda en el botón. Controlado: el estado
// lo guarda quien compone la lista.
type Full = Specialist & {
  state: 'full'
  /** «Sin disponibilidad · próximo cupo en mayo». */
  nextOpening: string
  notifyPressed: boolean
  onNotifyToggle: () => void
}

// Loading no admite datos: el esqueleto no sabe de quién es.
type Loading = { state: 'loading' } & { [K in keyof Specialist]?: never }

export type ResultCardProps = Available | Full | Loading

// UI/Result Card. La raíz es el <li> de la lista de resultados y es el
// contenedor de la container query (DESIGN.md § Contenedores); la caja que
// cambia de forma es __card, su hijo. La tarjeta no es interactiva: solo su CTA.
export default function ResultCard(props: ResultCardProps) {
  const nameId = useId()

  if (props.state === 'loading') return <ResultCardSkeleton />

  const { name, specialty, location, modality, initial, photo, photoSizes, photoLoading, nameRef } = props
  const available = props.state === 'available'

  return (
    <li className="c-result-card">
      <div className="c-result-card__card">
        <Avatar
          size="small"
          initial={initial}
          photo={photo}
          sizes={photoSizes}
          loading={photoLoading}
          className="c-result-card__avatar"
        />
        <div className="c-result-card__summary">
          <div className="c-result-card__heading">
            <h3 className="c-result-card__name" id={nameId} ref={nameRef} tabIndex={-1}>
              {name}
            </h3>
            <p className="c-result-card__specialty">{specialty}</p>
          </div>
          <div className="c-result-card__meta">
            <p className="c-result-card__location">
              <Icon name="map-pin" size={20} />
              <span className="c-result-card__text">{location}</span>
            </p>
            <Tag>{modality}</Tag>
          </div>
        </div>
        <div className="c-result-card__footer">
          <p className={`c-result-card__availability c-result-card__availability--${props.state}`}>
            <span className="c-result-card__icon-slot">
              <Icon name={available ? 'calendar-check' : 'calendar-blank'} size={20} />
            </span>
            <span className="c-result-card__text">{available ? props.nextSlot : props.nextOpening}</span>
          </p>
          {available ? (
            <Button variant="secondary" href={props.href} aria-describedby={nameId} className="c-result-card__action">
              Ver horarios
            </Button>
          ) : (
            <Button
              variant="secondary"
              aria-pressed={props.notifyPressed}
              aria-describedby={nameId}
              leadingIcon={props.notifyPressed ? 'check' : undefined}
              onClick={props.onNotifyToggle}
              className="c-result-card__action"
            >
              {props.notifyPressed ? 'Te avisaremos' : 'Avisarme'}
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}

// State=Loading: misma anatomía que Available, línea a línea, con barras en
// lugar de texto. Fuera del árbol accesible (el li entero): la lista no cuenta
// esqueletos como resultados; lo que se anuncia mientras carga lo decide la
// región viva de la cabecera de resultados, no la tarjeta.
function ResultCardSkeleton() {
  return (
    <li className="c-result-card" aria-hidden="true">
      <div className="c-result-card__card">
        <span className="c-result-card__avatar c-result-card__bone c-result-card__bone--avatar" />
        <div className="c-result-card__summary">
          <div className="c-result-card__heading">
            <span className="c-result-card__line c-result-card__line--name">
              <span className="c-result-card__bone c-result-card__bone--name" />
            </span>
            <span className="c-result-card__lines">
              <span className="c-result-card__line">
                <span className="c-result-card__bone c-result-card__bone--specialty" />
              </span>
              <span className="c-result-card__line c-result-card__line--stacked">
                <span className="c-result-card__bone c-result-card__bone--specialty-end" />
              </span>
            </span>
          </div>
          <div className="c-result-card__meta">
            <span className="c-result-card__line c-result-card__line--caption">
              <span className="c-result-card__bone c-result-card__bone--location" />
            </span>
            <span className="c-result-card__bone c-result-card__bone--modality" />
          </div>
        </div>
        <div className="c-result-card__footer">
          <span className="c-result-card__line">
            <span className="c-result-card__bone c-result-card__bone--next" />
          </span>
          <span className="c-result-card__bone c-result-card__bone--action" />
        </div>
      </div>
    </li>
  )
}
