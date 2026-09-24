import { ListBoxItem } from 'react-aria-components'
import Icon from './Icon.tsx'

export type TimeSlotProps = {
  /** «10:30». Es también la clave de la opción en la lista. */
  time: string
  available: boolean
  /** Solo en la primera hora libre, con Booking Bar en Missing (§5.2). */
  describedBy?: string
}

// UI/Time Slot: opción de SlotList (spike-rac § R2, camino B). Para RAC todas
// las horas son seleccionables y enfocables; la hora llena lleva aria-disabled
// por render y la guarda de SlotList descarta su selección. El estilo de llena
// lee [aria-disabled='true'], no confía en que RAC suprima hover o pressed.
//
// El render recibe la unión div | a (ListBoxItem puede ser enlace): la rama
// del enlace existe para que compile; una hora nunca lleva href (§ 2.6).
export default function TimeSlot({ time, available, describedBy }: TimeSlotProps) {
  return (
    <ListBoxItem
      id={time}
      textValue={time}
      className="c-time-slot"
      render={({ children, ...props }) =>
        'href' in props ? (
          <a {...props}>{children}</a>
        ) : (
          <div {...props} aria-disabled={available ? undefined : true} aria-describedby={describedBy}>
            {children}
          </div>
        )
      }
    >
      {({ isSelected }) => (
        <>
          {isSelected && <Icon name="check" size={20} />}
          <span className="c-time-slot__time">{time}</span>
        </>
      )}
    </ListBoxItem>
  )
}
