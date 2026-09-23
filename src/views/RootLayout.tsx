import { Outlet, ScrollRestoration } from 'react-router'

// Ruta raíz: restauración de scroll para todas las vistas (D12). El shell con
// clase (`c-app-layout` o similar) llega en la fase 3.
export default function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
