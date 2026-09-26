import { useSyncExternalStore } from 'react'

// Avisos pedidos (D16, diseño §7.3): el conmutador «Avisarme» → «Te
// avisaremos». Almacén en memoria con clave por médico, sin sembrar y
// reiniciado al recargar, como las citas (D13). Cruza vistas: el estado
// sobrevive a ir al perfil y volver, y el mismo conmutador gobierna «Avisarme
// si se libera un hueco» de la vista 2 (la clave por médico lo liga al
// médico, no al día; lo decide V2b).

export function createNotifyStore() {
  let notified: ReadonlySet<string> = new Set()
  const listeners = new Set<() => void>()

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => notified,
    has: (slug: string) => notified.has(slug),
    toggle(slug: string) {
      const next = new Set(notified)
      if (!next.delete(slug)) next.add(slug)
      notified = next
      listeners.forEach((listener) => listener())
    },
  }
}

export const notifyStore = createNotifyStore()

/** Médicos con aviso pedido. */
export function useNotified() {
  return useSyncExternalStore(notifyStore.subscribe, notifyStore.getSnapshot)
}
