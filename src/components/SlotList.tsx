import { useImperativeHandle, useRef, type Ref } from 'react'
import { Header, ListBox, ListBoxSection, type Selection } from 'react-aria-components'
import TimeSlot from './TimeSlot.tsx'

export type SlotGroup = {
  label: 'Mañana' | 'Tarde'
  slots: { time: string; available: boolean }[]
}

export type SlotListHandle = {
  /** Foco en la primera hora libre: «Continuar» sin hora, en la fase 5. */
  focusFirstAvailable: () => void
}

type SlotListProps = {
  /** El h2 «Elige hora» de la composición. */
  'aria-labelledby': string
  groups: SlotGroup[]
  value: string | null
  onChange: (time: string) => void
  /** Booking Bar en Missing: el id de su mensaje, en la primera hora libre. */
  describedBy?: string
  ref?: Ref<SlotListHandle>
}

// Lista de horas (excepción a D5: no es uno de los 34, capa «Slot List» de
// Figma). Un ListBoxItem no existe fuera de su ListBox, así que sin ella no
// hay UI/Time Slot. listbox de selección única, un group por franja nombrado
// por su cabecera, layout="grid": las flechas mueven en dos ejes sin
// seleccionar; Intro y Espacio seleccionan.
//
// Camino B del spike: sin disabledKeys, selección controlada con una guarda
// que descarta las horas llenas, y disallowEmptySelection (sin él, un segundo
// Espacio deseleccionaría). Sin div entre la sección y sus opciones: RAC no
// pintaría ninguna (spike § 2.1).
export default function SlotList({ groups, value, onChange, describedBy, ref, ...labelling }: SlotListProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const available = groups.flatMap((g) => g.slots.filter((s) => s.available).map((s) => s.time))
  const firstAvailable = available[0]

  useImperativeHandle(ref, () => ({
    focusFirstAvailable: () => {
      if (!firstAvailable) return
      listRef.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(firstAvailable)}"]`)?.focus()
    },
  }))

  const select = (keys: Selection) => {
    if (keys === 'all') return
    const [key] = keys
    if (typeof key === 'string' && available.includes(key)) onChange(key)
  }

  return (
    <ListBox
      ref={listRef}
      className="c-slot-list"
      layout="grid"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={value === null ? [] : [value]}
      onSelectionChange={select}
      {...labelling}
    >
      {groups.map((group) => (
        <ListBoxSection key={group.label} id={group.label} className="c-slot-list__group">
          <Header className="c-slot-list__label">{group.label}</Header>
          {group.slots.map((slot) => (
            <TimeSlot
              key={slot.time}
              time={slot.time}
              available={slot.available}
              describedBy={slot.time === firstAvailable ? describedBy : undefined}
            />
          ))}
        </ListBoxSection>
      ))}
    </ListBox>
  )
}
