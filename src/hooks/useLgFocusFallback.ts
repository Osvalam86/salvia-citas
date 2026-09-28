import { useLayoutEffect, useRef } from 'react'
import { MAIN_TITLE_ID } from '../components/AppLayout.tsx'

/**
 * Al cruzar lg cambian de control piezas de la vista (D7: Back Link y
 * breadcrumb, barra y su equivalente en línea, tira y calendario). Si el foco
 * estaba en una de ellas, cae en body: va al h1, el respaldo de D12, en el
 * mismo commit, sin pasar un frame por body.
 */
export default function useLgFocusFallback(isDesktop: boolean) {
  const wasDesktop = useRef(isDesktop)
  useLayoutEffect(() => {
    if (wasDesktop.current === isDesktop) return
    wasDesktop.current = isDesktop
    if (!document.activeElement || document.activeElement === document.body) {
      document.getElementById(MAIN_TITLE_ID)?.focus({ preventScroll: true })
    }
  }, [isDesktop])
}
