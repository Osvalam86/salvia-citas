import { MAIN_TITLE_ID } from './AppLayout.tsx'

type PageHeaderProps = {
  /** El h1 de la vista: destino del salto al contenido y del foco de ruta (D12). */
  title: string
}

// Encabezado de página de las vistas (c-page-header). No es uno de los 34:
// excepción declarada en D5. En T1 solo lleva el h1 en page-title; subtítulo,
// Back Link y breadcrumb llegan vista por vista.
export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="c-page-header">
      <h1 className="c-page-header__title" id={MAIN_TITLE_ID} tabIndex={-1}>
        {title}
      </h1>
    </div>
  )
}
