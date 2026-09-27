import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
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

  // Con la lista recién montada («Ver horarios del martes 24», V2a), RAC pinta
  // sus opciones en un segundo commit, después de los efectos de layout de
  // quien la monta: si la opción aún no existe, se espera a que aparezca. El
  // observador corre antes de pintar, así que no se ve un frame sin foco. Se
  // desconecta al encontrarla, al desmontar la lista y si la búsqueda deja de
  // tener sentido (cambia la primera hora libre: otro día).
  //
  // El efecto de montaje rearma la espera: StrictMode desmonta y vuelve a
  // montar los efectos de la lista nueva después del efecto de layout de
  // quien pidió el foco, y la limpieza habría cortado la espera en desarrollo.
  const pending = useRef<string | null>(null)
  const observer = useRef<MutationObserver | null>(null)
  const stop = () => {
    observer.current?.disconnect()
    observer.current = null
  }
  const arm = () => {
    const root = listRef.current
    const key = pending.current
    if (!root || !key) return
    const selector = `[data-key="${CSS.escape(key)}"]`
    const take = () => {
      const option = root.querySelector<HTMLElement>(selector)
      if (!option) return false
      pending.current = null
      stop()
      option.focus()
      return true
    }
    if (take() || observer.current) return
    observer.current = new MutationObserver(take)
    observer.current.observe(root, { childList: true, subtree: true })
  }

  // Solo al montar y desmontar: arm y stop leen refs.
  useEffect(() => {
    arm()
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (pending.current && pending.current !== firstAvailable) {
      pending.current = null
      stop()
    }
  }, [firstAvailable])

  useImperativeHandle(ref, () => ({
    focusFirstAvailable: () => {
      stop()
      pending.current = firstAvailable ?? null
      arm()
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
