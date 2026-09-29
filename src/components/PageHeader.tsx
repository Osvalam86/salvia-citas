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
  /**
   * Pasos de la reserva (BookingSteps) sobre el h1, a space-4 (Figma 02.4:
   * Heading Group). No se combina con `profile`.
   */
  steps?: ReactNode
  /**
   * Insignia de éxito junto al título (confirmación, 04.1 y 04.4): decorativa,
   * el h1 ya lo dice (panel 04.0). Encima del título por debajo de lg y a su
   * lado desde lg. No se combina con `profile`.
   */
  success?: boolean
}

// Encabezado de página de las vistas (c-page-header). No es uno de los 34:
// excepción declarada en D5. Su API crece vista por vista: en V1a, el
// subtítulo; en V2a, el retroceso y el perfil; en V2b, los pasos; en V3, el
// grupo de título y subtítulo (__title-group); en V4a, la insignia de éxito
// (__headline); en el cierre de la fase 5, __heading en toda vista sin perfil.
export default function PageHeader({ title, subtitle, back, profile, steps, success = false }: PageHeaderProps) {
  const h1 = (
    <h1 className={profile ? 'c-page-header__title c-page-header__title--profile' : 'c-page-header__title'} id={MAIN_TITLE_ID} tabIndex={-1}>
      {title}
    </h1>
  )
  // Título y subtítulo a space-2 en su propio grupo (Figma 04.1: Title
  // Group): el hueco de la raíz, entre el retroceso y lo que sigue, crece
  // desde lg y este no.
  const heading = subtitle ? (
    <div className="c-page-header__title-group">
      {h1}
      <p className="c-page-header__subtitle">{subtitle}</p>
    </div>
  ) : (
    h1
  )
  const headline = success ? (
    <div className="c-page-header__headline">
      <span className="c-page-header__badge" aria-hidden="true">
        <Icon name="check" size={24} />
      </span>
      {heading}
    </div>
  ) : (
    heading
  )

  return (
    <div className={profile ? 'c-page-header c-page-header--profile' : 'c-page-header'}>
      {back}
      {profile ? (
        <div className="c-page-header__profile">
          <div className="c-page-header__identity">
            {profile.avatar}
            {h1}
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
        // Siempre presente, con pasos o sin ellos: si los pasos cambian de
        // plataforma (V3 y V4a solo los llevan bajo lg), el padre del h1 no
        // cambia y el h1 es el mismo nodo al cruzar lg.
        <div className="c-page-header__heading">
          {steps}
          {headline}
        </div>
      )}
    </div>
  )
}
