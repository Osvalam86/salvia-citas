import { MAIN_TITLE_ID } from './AppLayout.tsx'

type PageHeaderProps = {
  /** El h1 de la vista: destino del salto al contenido y del foco de ruta (D12). */
  title: string
  /** Subtítulo en body/md secundario bajo el h1 (01.x). */
  subtitle?: string
}

// Encabezado de página de las vistas (c-page-header). No es uno de los 34:
// excepción declarada en D5. Su API crece vista por vista: en V1a, el
// subtítulo; Back Link y breadcrumb llegan con las vistas que los usan.
export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="c-page-header">
      <h1 className="c-page-header__title" id={MAIN_TITLE_ID} tabIndex={-1}>
        {title}
      </h1>
      {subtitle && <p className="c-page-header__subtitle">{subtitle}</p>}
    </div>
  )
}
