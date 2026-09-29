import { useLayoutEffect, useRef } from 'react'
import { MAIN_TITLE_ID } from '../components/AppLayout.tsx'

/**
 * Respaldo del foco al h1 (D12) cuando lo que lo tenía deja de existir sin un
 * evento previo que pueda moverlo. Tras el commit en que cambia `trigger`, si
 * el foco cayó en body, va al h1, en el mismo commit y sin pasar un frame por
 * body. Si no está en body, no hace nada: otra pieza ya lo colocó.
 *
 * Disparadores:
 * - Cruzar lg (`isDesktop`): cambian de control piezas de la vista (D7: Back
 *   Link y breadcrumb, barra y su equivalente en línea, tira y calendario).
 * - El aviso visible de Mis citas (V4b): se retira al cambiar de entrada del
 *   historial con el mismo pathname, y su título pudo tener el foco.
 *
 * No distingue «el foco estaba en lo que se desmontó» de «ya estaba en body»:
 * en los dos casos va al h1 (límite declarado).
 */
export default function useFocusFallback(trigger: unknown) {
  const previous = useRef(trigger)
  useLayoutEffect(() => {
    if (Object.is(previous.current, trigger)) return
    previous.current = trigger
    if (!document.activeElement || document.activeElement === document.body) {
      document.getElementById(MAIN_TITLE_ID)?.focus({ preventScroll: true })
    }
  }, [trigger])
}
