import type { ReactNode } from 'react'
import { MAIN_TITLE_ID } from './AppLayout.tsx'
import Icon from './Icon.tsx'
import Tag from './Tag.tsx'

type Profile = {
  /** UI/Avatar decorativo, con la mezcla c-page-header__avatar: el nombre es el h1 de al lado. */
  avatar: ReactNode
  /** «Cardiología · 12 años de experiencia» */
  specialty: string
  /** «Clínica Roma Norte · Ciudad de México» */
  location: string
  /** Modalidad (UI/Tag). */
  modality: string
}

type PageHeaderProps = {
  /** El h1 de la vista: destino del salto al contenido y del foco de ruta (D12). */
  title: string
  /** Subtítulo en body/md secundario bajo el h1 (01.x). */
  subtitle?: string
  /**
   * Retroceso antes del h1: UI/Back Link en móvil, UI/Breadcrumb en
   * escritorio, con la mezcla c-page-header__back.
   */
  back?: ReactNode
  /**
   * Perfil del médico (vista 2, 02.1 y 02.5): avatar y h1 en la misma fila,
   * y especialidad, ubicación y modalidad debajo. El mismo orden de DOM en
   * las dos plataformas (panel 02.0).
   */
  profile?: Profile
}

// Encabezado de página de las vistas (c-page-header). No es uno de los 34:
// excepción declarada en D5. Su API crece vista por vista: en V1a, el
// subtítulo; en V2a, el retroceso y el perfil.
export default function PageHeader({ title, subtitle, back, profile }: PageHeaderProps) {
  const heading = (
    <h1 className={profile ? 'c-page-header__title c-page-header__title--profile' : 'c-page-header__title'} id={MAIN_TITLE_ID} tabIndex={-1}>
      {title}
    </h1>
  )

  return (
    <div className={profile ? 'c-page-header c-page-header--profile' : 'c-page-header'}>
      {back}
      {profile ? (
        <div className="c-page-header__profile">
          <div className="c-page-header__identity">
            {profile.avatar}
            {heading}
          </div>
          <p className="c-page-header__specialty">{profile.specialty}</p>
          <div className="c-page-header__meta">
            <p className="c-page-header__location">
              <Icon name="map-pin" size={20} />
              <span className="c-page-header__location-text">{profile.location}</span>
            </p>
            <Tag className="c-page-header__tag">{profile.modality}</Tag>
          </div>
        </div>
      ) : (
        heading
      )}
      {subtitle && <p className="c-page-header__subtitle">{subtitle}</p>}
    </div>
  )
}
