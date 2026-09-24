import { Link as RouterLink } from 'react-router'
import { PATHS } from './destinations.ts'

// Wordmark «Salvia» de UI/Header/Desktop y UI/Header/Mobile. No es uno de los
// 34 componentes: bloque propio porque lo comparten los dos headers
// (excepción a D5). Lleva a «/», que es la búsqueda: el producto no tiene
// página de inicio propia.
export default function Wordmark() {
  return (
    <RouterLink to={PATHS.especialistas} className="c-wordmark">
      Salvia
    </RouterLink>
  )
}
