import { useEffect, useId, useRef, type FormEvent, type ReactNode, type RefObject } from 'react'
import IconButton from './IconButton.tsx'

type SheetProps = {
  /** Título de la hoja («Filtrar y ordenar»): el h2, el nombre del diálogo y su primer foco. */
  title: string
  /** El disparador: recibe el foco al cerrar, se aplique o no. */
  returnFocus: RefObject<HTMLElement | null>
  /** «Cerrar» o Escape: se descarta lo que haya en la hoja. */
  onDismiss: () => void
  /** Envío del formulario de la hoja. La hoja ya está cerrada y el fondo, activo. */
  onSubmit: () => void
  /** Acciones del pie, dentro del formulario: el envío es un type="submit". */
  footer: ReactNode
  /** Cuerpo, dentro del formulario. */
  children: ReactNode
}

// Hoja a pantalla completa (c-sheet; Figma 01.2). No es uno de los 34:
// excepción declarada en D5. Se monta al abrirse y se desmonta al cerrarse,
// así que su estado (el borrador de filtros) nace y muere con ella.
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
// Orden al enviar: close() antes de avisar al padre y de devolver el foco: con
// el diálogo abierto la página es inert y el disparador no podría recibirlo.
// Chromium ya devuelve el foco al cerrar (al elemento que lo tenía antes de
// showModal()); el explícito es el respaldo para Safari y Firefox, como en
// UI/Dialog (DESIGN.md, Pendientes, fase 7).
export default function Sheet({ title, returnFocus, onDismiss, onSubmit, footer, children }: SheetProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const submitted = useRef(false)
  const titleId = useId()

  // StrictMode repite el efecto: con la hoja ya abierta no se vuelve a abrir.
  useEffect(() => {
    const element = dialog.current
    if (!element || element.open) return
    element.showModal()
    heading.current?.focus()
  }, [])

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
    dialog.current?.close()
    returnFocus.current?.focus()
    onSubmit()
  }

  return (
    <dialog ref={dialog} className="c-sheet" aria-labelledby={titleId} aria-modal="true" onClose={handleClose}>
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
