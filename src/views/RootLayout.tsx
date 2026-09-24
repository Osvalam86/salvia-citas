import { I18nProvider } from 'react-aria-components'
import { Outlet, ScrollRestoration } from 'react-router'

// Ruta raíz: restauración de scroll para todas las vistas (D12). El shell no
// va aquí: cada vista compone AppLayout con el chrome que le toca.
//
// Idioma de React Aria: sin proveedor, RAC toma el del navegador y no el lang
// de <html>, así que en un navegador en inglés el calendario saldría en inglés
// y con el domingo primero. Mismo valor que index.html.
export default function RootLayout() {
  return (
    <I18nProvider locale="es-MX">
      <Outlet />
      <ScrollRestoration />
    </I18nProvider>
  )
}
