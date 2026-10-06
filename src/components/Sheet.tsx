import { useEffect, useId, useRef, type FormEvent, type MouseEvent, type PointerEvent, type ReactNode, type RefObject } from 'react'
import IconButton from './IconButton.tsx'

type SheetProps = {
  /**
   * full: a pantalla completa, sin velo (01.2, «Filtrar y ordenar»). bottom:
   * hoja inferior con el alto de su contenido, sobre el velo (02.2, «Elige
   * una fecha»); un clic en el velo la cierra como «Cerrar».
   */
  variant?: 'full' | 'bottom'
  /** Título de la hoja: el h2, el nombre del diálogo y, sin initialFocus, su primer foco. */
  title: string
  /** Primer foco, si no es el título: el día seleccionado del calendario (panel 02.0). */
  initialFocus?: (dialog: HTMLDialogElement) => HTMLElement | null
  /** El disparador: recibe el foco al cerrar, se aplique o no. */
  returnFocus: RefObject<HTMLElement | null>
  /** «Cerrar» o Escape: se descarta lo que haya en la hoja. */
  onDismiss: () => void
  /** Envío del formulario de la hoja. Se llama con la hoja aún abierta; después se cierra y el foco vuelve. */
  onSubmit: () => void
  /** Acciones del pie, dentro del formulario: el envío es un type="submit". */
  footer: ReactNode
  /** Cuerpo, dentro del formulario. */
  children: ReactNode
}

// Hoja a pantalla completa (c-sheet; Figma 01.2) o inferior (c-sheet--bottom;
// Figma 02.2). No es uno de los 34: excepción declarada en D5. Se monta al
// abrirse y se desmonta al cerrarse, así que su estado (el borrador de
// filtros o de fecha) nace y muere con ella.
//
// <dialog> nativo con showModal(), como UI/Dialog: capa superior, fondo inert
// y Escape por el evento cancel. role dialog (panel 01.0), nombrado por su
// título, que recibe el foco al abrir. Tab y Mayús+Tab pueden salir al marco
// del navegador (Chromium), nunca a la página.
//
// Cabecera y pie fijos y el cuerpo con scroll; el formulario envuelve cuerpo y
// pie como columna flex, así el envío es nativo (Intro en un control lo
// envía) sin `form=`.
//
// Orden al enviar (7.6): primero se avisa al padre, después close() y por
// último el foco. El padre aplica lo que haya en la hoja; si lo pinta en el
// acto (la de filtros, con flushSync), el disparador ya lleva su nombre nuevo
// («2 filtros aplicados») cuando recibe el foco y el lector lo anuncia así.
// Avisando después, el foco llegaba con el nombre anterior y el cambio no se
// volvía a anunciar (hallazgo de 7.4, N1.11). Sin pintar en el acto (la hoja
// del calendario) el orden no cambia nada: React aplica tras el manejador. El
// foco va después de close(): con el diálogo abierto la página es inert y el
// disparador no podría recibirlo. Chromium ya lo devuelve al cerrar (al
// elemento que lo tenía antes de showModal()); el explícito es el respaldo
// para Safari y Firefox, como en UI/Dialog.
export default function Sheet({ variant = 'full', title, initialFocus, returnFocus, onDismiss, onSubmit, footer, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const submitted = useRef(false)
  const pressedOnScrim = useRef(false)
  const titleId = useId()

  // StrictMode repite el efecto: con la hoja ya abierta no se vuelve a abrir.
  useEffect(() => {
    const element = dialog.current
    if (!element || element.open) return
    element.showModal()
    ;(initialFocus?.(element) ?? heading.current)?.focus()
    // Solo al abrir: initialFocus no reabre la hoja.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Velo de la hoja inferior: el ::backdrop es del propio <dialog>, así que
  // un clic en él llega al dialog fuera de su caja. Cierra solo si el botón
  // se pulsó y se soltó en el velo: arrastrar desde la hoja y soltar fuera
  // (el click va al ancestro común, el dialog) no cierra.
  const onScrim = (event: PointerEvent<HTMLDialogElement> | MouseEvent<HTMLDialogElement>) => {
    const element = dialog.current
    if (!element || event.target !== element) return false
    const box = element.getBoundingClientRect()
    return event.clientY < box.top || event.clientY > box.bottom || event.clientX < box.left || event.clientX > box.right
  }
  const scrimHandlers =
    variant === 'bottom'
      ? {
          onPointerDown: (event: PointerEvent<HTMLDialogElement>) => {
            pressedOnScrim.current = onScrim(event)
          },
          onClick: (event: MouseEvent<HTMLDialogElement>) => {
            if (pressedOnScrim.current && onScrim(event)) dialog.current?.close()
            pressedOnScrim.current = false
          },
        }
      : {}

  // Todo cierre pasa por aquí: «Cerrar», Escape y el envío.
  const handleClose = () => {
    if (submitted.current) {
      submitted.current = false
      return
    }
    returnFocus.current?.focus()
    onDismiss()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitted.current = true
    onSubmit()
    dialog.current?.close()
    returnFocus.current?.focus()
  }

  return (
    <dialog
      ref={dialog}
      className={variant === 'bottom' ? 'c-sheet c-sheet--bottom' : 'c-sheet'}
      aria-labelledby={titleId}
      aria-modal="true"
      onClose={handleClose}
      {...scrimHandlers}
    >
      <div className="c-sheet__header">
        <div className="o-wrapper c-sheet__heading">
          <h2 className="c-sheet__title" id={titleId} ref={heading} tabIndex={-1}>
            {title}
          </h2>
          <IconButton icon="x" label="Cerrar" onClick={() => dialog.current?.close()} className="c-sheet__close" />
        </div>
      </div>
      <form className="c-sheet__form" onSubmit={submit}>
        <div className="c-sheet__body">
          <div className="o-wrapper c-sheet__content">{children}</div>
        </div>
        <div className="c-sheet__footer">
          <div className="o-wrapper c-sheet__actions">{footer}</div>
        </div>
      </form>
    </dialog>
  )
}
