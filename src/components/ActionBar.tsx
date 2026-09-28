import type { ReactNode } from 'react'

type ActionBarProps = {
  /** La acción principal de la pantalla (UI/Button Primary), en FILL. */
  children: ReactNode
  /** Nota bajo la acción; la acción la recibe como aria-describedby. */
  note: string
  noteId: string
}

// Action Bar (c-action-bar; Figma 02.4 y vista 3 en móvil): patrón de
// pantalla, sin ser de los 34 (D5). Va en el hueco de barra del shell
// (ViewLayout con `bar`), así que por D7 solo existe bajo lg. Pieza a sangre:
// el interior es o-wrapper (DESIGN.md § Tramo intermedio).
export default function ActionBar({ children, note, noteId }: ActionBarProps) {
  return (
    <div className="c-action-bar">
      <div className="o-wrapper c-action-bar__inner">
        {children}
        <p className="c-action-bar__note" id={noteId}>
          {note}
        </p>
      </div>
    </div>
  )
}
