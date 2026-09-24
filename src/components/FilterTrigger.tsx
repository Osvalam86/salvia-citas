import type { MouseEventHandler, Ref } from 'react'
import Button from './Button.tsx'

type FilterTriggerProps = {
  /** Filtros aplicados. El orden no cuenta como filtro; con 0 no hay contador. */
  count: number
  onClick?: MouseEventHandler<HTMLButtonElement>
  /** Al cerrar la hoja «Filtrar y ordenar», el foco vuelve a este botón. */
  ref?: Ref<HTMLButtonElement>
}

// UI/Filter Trigger (móvil): UI/Button Secondary con el contador en píldora.
// c-filter-trigger se mezcla en el mismo nodo que c-button y solo aloja
// __count: la anatomía es la del botón. El número visible va aria-hidden y el
// nombre lo completa un texto oculto: «Filtrar y ordenar, 1 filtro aplicado».
export default function FilterTrigger({ count, onClick, ref }: FilterTriggerProps) {
  return (
    <Button
      variant="secondary"
      leadingIcon="sliders-horizontal"
      aria-haspopup="dialog"
      onClick={onClick}
      ref={ref}
      className="c-filter-trigger"
    >
      Filtrar y ordenar
      {count > 0 && (
        <>
          <span className="u-sr-only">
            , {count} {count === 1 ? 'filtro aplicado' : 'filtros aplicados'}
          </span>
          <span className="c-filter-trigger__count" aria-hidden="true">
            {count}
          </span>
        </>
      )}
    </Button>
  )
}
