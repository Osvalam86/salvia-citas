import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import { MAIN_TITLE_ID } from '../components/AppLayout.tsx'

type FocusState = { focus?: unknown } | null

/**
 * Foco de ruta (D12). Al cambiar `pathname`, el foco va al h1 de la vista
 * (`#contenido`) o al destino que nombre `location.state.focus`; si ese
 * destino ya no existe (history.state sobrevive a la recarga y a Atrás, el
 * aviso del almacén no), al h1. Nunca desplaza: el scroll es de
 * <ScrollRestoration>, que ya lo colocó en su efecto de layout.
 *
 * No actúa en la carga inicial ni cuando solo cambia `search` (filtros,
 * página): eso lo decide la vista. Con StrictMode el efecto se repite con el
 * mismo pathname y la ref lo descarta.
 */
export default function useRouteFocus() {
  const { pathname, state } = useLocation()
  const previous = useRef<string | null>(null)

  useEffect(() => {
    const from = previous.current
    previous.current = pathname
    if (from === null || from === pathname) return

    const named = (state as FocusState)?.focus
    const target = (typeof named === 'string' && document.getElementById(named)) || document.getElementById(MAIN_TITLE_ID)
    target?.focus({ preventScroll: true })
  }, [pathname, state])
}
