import { Outlet, ScrollRestoration } from 'react-router'

// Ruta raíz: restauración de scroll para todas las vistas (D12). El shell no
// va aquí: cada vista compone AppLayout con el chrome que le toca.
export default function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
