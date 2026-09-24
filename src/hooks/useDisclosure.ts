import { useEffect, useId, useRef, useState } from 'react'

// Disclosure no modal (menú de cuenta, diseño §4.3): un botón con
// aria-expanded y aria-controls y un panel que va justo detrás en el DOM, así
// que Tab lo recorre en orden. Sin trampa de foco, sin inert y sin velo.
//
// Abrir y cerrar con el disparador deja el foco en él. Con el panel abierto:
// - Escape cierra y devuelve el foco al disparador.
// - Salir del grupo con Tab o Shift+Tab cierra; el foco sigue su curso.
// - Un clic fuera cierra; el foco queda donde hizo clic la persona.
// Un foco que se va a ninguna parte (clic en una zona no enfocable del panel,
// cambio de ventana) no cierra: el clic fuera ya lo cubre pointerdown.
export default function useDisclosure() {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const groupRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!open || !group) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && !group.contains(event.relatedTarget)) setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !group.contains(event.target)) setOpen(false)
    }

    group.addEventListener('keydown', onKeyDown)
    group.addEventListener('focusout', onFocusOut)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      group.removeEventListener('keydown', onKeyDown)
      group.removeEventListener('focusout', onFocusOut)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return {
    open,
    toggle: () => setOpen((value) => !value),
    close: () => setOpen(false),
    panelId,
    groupRef,
    triggerRef,
  }
}
