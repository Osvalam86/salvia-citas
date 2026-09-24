import { Link as RouterLink } from 'react-router'
import Icon from './Icon.tsx'

type Common = {
  /** Página de resultados (parámetro `pagina`, D1). Lo construye la vista. */
  href: string
}

type ToPage = Common & {
  page: number
  /** La página actual: aria-current="page". */
  current?: boolean
  direction?: never
}

// «Anterior» y «Siguiente» no tienen variante no disponible: en los extremos
// se omiten (lo decide Pagination), así que no admiten current.
type ToSibling = Common & {
  direction: 'previous' | 'next'
  page?: never
  current?: never
}

export type PageLinkProps = ToPage | ToSibling

// UI/Page Link: <a> de paginación. El número va precedido de «Página» oculto:
// un «2» suelto en la lista de enlaces del lector es ambiguo, y el nombre
// sigue conteniendo el texto visible (2.5.3).
export default function PageLink(props: PageLinkProps) {
  if (props.direction !== undefined) {
    const previous = props.direction === 'previous'
    return (
      <RouterLink to={props.href} className="c-page-link">
        {previous && <Icon name="caret-left" size={20} />}
        {previous ? 'Anterior' : 'Siguiente'}
        {!previous && <Icon name="caret-right" size={20} />}
      </RouterLink>
    )
  }

  return (
    <RouterLink to={props.href} className="c-page-link" aria-current={props.current ? 'page' : undefined}>
      <span className="u-sr-only">Página </span>
      {props.page}
    </RouterLink>
  )
}
