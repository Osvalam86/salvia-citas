import Button from './Button.tsx'

type LoadMoreProps = {
  /** Resultados en la lista. */
  shown: number
  total: number
  /** Mientras llegan las 4 tarjetas: un clic se ignora (el botón no se deshabilita). */
  busy?: boolean
  onLoadMore: () => void
}

// UI/Load More (móvil; en escritorio, UI/Pagination). Progress se deriva:
// Complete cuando ya se ven todos. La etiqueta del botón es estable: el número
// vive en el recuento, así el nombre accesible no cambia con cada carga. El
// recuento no es región viva: al terminar, quien compone la lista lleva el
// foco al nombre de la primera tarjeta nueva, y eso ya lo anuncia (diseño
// §4.6: o foco o región viva).
export default function LoadMore({ shown, total, busy = false, onLoadMore }: LoadMoreProps) {
  if (shown >= total) {
    return (
      <div className="c-load-more">
        <p className="c-load-more__count">Has visto los {total} especialistas</p>
      </div>
    )
  }

  return (
    <div className="c-load-more">
      <p className="c-load-more__count">
        Mostrando {shown} de {total} especialistas
      </p>
      <Button
        variant="secondary"
        onClick={() => {
          if (!busy) onLoadMore()
        }}
        className="c-load-more__action"
      >
        Ver más especialistas
      </Button>
    </div>
  )
}
