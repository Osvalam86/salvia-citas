import type { ReactNode } from 'react'
import { MenuSelectContext } from './menuContext.ts'

type MenuProps = {
  /** Destino del aria-controls del disparador. */
  id: string
  /** Cerrado es hidden: sale del orden de tabulación y del árbol de accesibilidad. */
  open: boolean
  /** Al activar cualquier ítem (cerrar el menú). */
  onSelect: () => void
  /** Clase de elemento del padre para colocarlo (mezcla BEM): posición y capa. */
  className?: string
  children: ReactNode
}

// UI/Menu: panel del menú de cuenta. Disclosure, no role="menu": una lista de
// enlaces y botones con su semántica nativa. El disparador y el
// comportamiento (useDisclosure) los pone quien lo abre; aquí solo el panel.
export default function Menu({ id, open, onSelect, className, children }: MenuProps) {
  const classes = ['c-menu', className].filter(Boolean).join(' ')

  return (
    <MenuSelectContext value={onSelect}>
      <ul id={id} className={classes} role="list" hidden={!open}>
        {children}
      </ul>
    </MenuSelectContext>
  )
}
