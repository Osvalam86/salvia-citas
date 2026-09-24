import { useEffect, useId, useRef, type ReactNode } from 'react'
import Button from './Button.tsx'

// Etiquetas que no nombran la acción: el botón destructivo dice lo que hace
// («Cancelar cita»), nunca una confirmación genérica (diseño §3.6).
type GenericLabel = 'Aceptar' | 'OK' | 'Sí' | 'Confirmar' | 'Continuar'
type ActionLabel<L extends string> = L extends GenericLabel ? never : L

type DialogProps<L extends string> = {
  open: boolean
  /** Pregunta que nombra la acción («¿Cancelar esta cita?»): el h2 y el nombre del diálogo. */
  title: string
  /** Nombra la cita concreta y la consecuencia: la descripción del diálogo. */
  body: ReactNode
  /** La opción segura («Mantener mi cita»): primera en el DOM y foco inicial. */
  dismissLabel: string
  confirmLabel: ActionLabel<L>
  /** Adonde vuelve el foco al mantener: el disparador que abrió el diálogo. */
  returnFocus: HTMLElement | null
  /** Mantener o Escape. */
  onDismiss: () => void
  /** El diálogo ya está cerrado y el fondo, activo: quien lo abre puede mover el foco. */
  onConfirm: () => void
}

// UI/Dialog, confirmación destructiva. <dialog> nativo con showModal(): capa
// superior (sin z-index), fondo inert, Escape por el evento cancel. El
// elemento es el velo y el contenedor `dialog`; __panel es la caja visible.
//
// Un clic en el velo no cierra: es un alertdialog destructivo y solo lo
// cierran sus dos botones y Escape (que equivale a mantener).
//
// Tab y Mayús+Tab pueden salir al marco del navegador (comportamiento nativo
// de <dialog> en Chromium), pero nunca llegan a la página, que es inert.
//
// Orden al confirmar: close() antes de avisar al padre. Mientras el diálogo
// sigue abierto el resto de la página es inert y no puede recibir el foco, así
// que el aviso que aparece tras cancelar no podría enfocar su título.
export default function Dialog<L extends string>({ open, title, body, dismissLabel, confirmLabel, returnFocus, onDismiss, onConfirm }: DialogProps<L>) {
  const dialog = useRef<HTMLDialogElement>(null)
  const safe = useRef<HTMLButtonElement>(null)
  const confirmed = useRef(false)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      safe.current?.focus()
    }
    if (!open && element.open) element.close()
  }, [open])

  // Todo cierre pasa por aquí: Mantener, Escape y Confirmar.
  const handleClose = () => {
    if (confirmed.current) {
      confirmed.current = false
      return
    }
    returnFocus?.focus()
    onDismiss()
  }

  const confirm = () => {
    confirmed.current = true
    dialog.current?.close()
    onConfirm()
  }

  return (
    <dialog
      ref={dialog}
      className="c-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onClose={handleClose}
    >
      <div className="c-dialog__panel">
        <div className="c-dialog__content">
          <h2 className="c-dialog__title" id={titleId}>
            {title}
          </h2>
          <p id={bodyId}>{body}</p>
        </div>
        <div className="c-dialog__actions">
          <Button variant="secondary" ref={safe} onClick={() => dialog.current?.close()} className="c-dialog__action">
            {dismissLabel}
          </Button>
          <Button variant="destructive" onClick={confirm} className="c-dialog__action">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
