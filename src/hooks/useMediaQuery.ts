import { useCallback, useSyncExternalStore } from 'react'
import { minWidth, type Breakpoint } from '../breakpoints.ts'

// D7: cuando entre móvil y escritorio cambia el control o el flujo, se
// renderiza uno solo. Misma consulta que tools.respond-to(), así que CSS y
// React cambian a la vez; con la letra del navegador al 200 %, los dos pasan
// a 2048 (rem en una media query es la letra del navegador, no la del html).
export default function useMediaQuery(size: Breakpoint): boolean {
  const query = minWidth(size)

  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    [query],
  )

  return useSyncExternalStore(subscribe, () => matchMedia(query).matches)
}
