import type { ReactNode } from 'react'

type Note =
  | {
      /** Nota bajo la acción; la acción la recibe como aria-describedby. */
      note: string
      noteId: string
    }
  | { note?: never; noteId?: never }

type ActionBarProps = Note & {
  /** La acción principal de la pantalla (UI/Button Primary), en FILL. */
  children: ReactNode
}

// Action Bar (c-action-bar; Figma 02.4 y vista 3 en móvil): patrón de
// pantalla, sin ser de los 34 (D5). Va en el hueco de barra del shell
// (ViewLayout con `bar`), así que por D7 solo existe bajo lg. Pieza a sangre:
// el interior es o-wrapper (DESIGN.md § Tramo intermedio). Sin nota en la
// reserva fallida (03.5): la nota nombraba una cita que ya no está reservada.
export default function ActionBar({ children, note, noteId }: ActionBarProps) {
  return (
    <div className="c-action-bar">
      <div className="o-wrapper c-action-bar__inner">
        {children}
        {note && (
          <p className="c-action-bar__note" id={noteId}>
            {note}
          </p>
        )}
      </div>
    </div>
  )
}
