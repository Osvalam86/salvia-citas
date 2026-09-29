import { useLayoutEffect } from 'react'

/**
 * Título de la pestaña (D15, 2.4.2). Escribe `document.title`, que reutiliza
 * el único <title> del documento: el estático de index.html («Salvia», el
 * respaldo sin JS). Sustituye al <title> de React 19, que se sumaba a ese y
 * dejaba dos en el head (el HTML solo admite uno).
 *
 * Efecto de layout: el título cambia en el mismo commit que el h1 de la
 * vista, antes del efecto de foco de ruta (useRouteFocus, useEffect).
 */
export default function useDocumentTitle(title: string) {
  useLayoutEffect(() => {
    document.title = title
  }, [title])
}
