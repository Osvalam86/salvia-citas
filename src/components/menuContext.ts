import { createContext } from 'react'

// Lo que hace el menú cuando se activa uno de sus ítems (cerrarse). Menu lo
// provee y MenuItem lo llama antes de navegar o de ejecutar su acción.
export const MenuSelectContext = createContext<() => void>(() => {})
