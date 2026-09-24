import PageLink from './PageLink.tsx'

type PaginationProps = {
  /** Página actual, desde 1. */
  current: number
  /** Número de páginas (34 resultados a 4 por página: 9). */
  total: number
  /** Destino de cada página: la vista pone el parámetro `pagina` (D1). */
  hrefFor: (page: number) => string
}

type Item = number | 'gap'

// Truncado (diseño §4.4): siempre la primera y la última, la actual y sus
// vecinas. Un salto de una sola página muestra el número (una celda «…»
// ocupa lo mismo); uno de dos o más, «…».
function paginationItems(current: number, total: number): Item[] {
  const pages = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b)
  const items: Item[] = []
  for (const page of pages) {
    const previous = items.at(-1)
    if (typeof previous === 'number' && page - previous === 2) items.push(previous + 1)
    else if (typeof previous === 'number' && page - previous > 2) items.push('gap')
    items.push(page)
  }
  return items
}

// UI/Pagination (escritorio; en móvil, UI/Load More). Sin resumen propio: el
// recuento vive en la cabecera de resultados. «Anterior» se omite en la
// primera página y «Siguiente» en la última. El «…» va fuera del árbol
// accesible: el salto entre números ya dice que hay páginas omitidas. Con una
// sola página no hay navegación.
export default function Pagination({ current, total, hrefFor }: PaginationProps) {
  if (total <= 1) return null
  const items = paginationItems(current, total)

  return (
    <nav className="c-pagination" aria-label="Paginación">
      <ul className="c-pagination__list" role="list">
        {current > 1 && (
          <li>
            <PageLink href={hrefFor(current - 1)} direction="previous" />
          </li>
        )}
        {items.map((item, index) =>
          item === 'gap' ? (
            <li className="c-pagination__gap" aria-hidden="true" key={`gap-${index}`}>
              …
            </li>
          ) : (
            <li key={item}>
              <PageLink href={hrefFor(item)} page={item} current={item === current} />
            </li>
          ),
        )}
        {current < total && (
          <li>
            <PageLink href={hrefFor(current + 1)} direction="next" />
          </li>
        )}
      </ul>
    </nav>
  )
}
