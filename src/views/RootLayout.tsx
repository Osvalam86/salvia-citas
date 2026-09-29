import { I18nProvider } from 'react-aria-components'
import { Outlet, ScrollRestoration, type Location } from 'react-router'
import useRouteFocus from '../hooks/useRouteFocus.ts'

// Ruta raíz: restauración de scroll y foco de ruta para todas las vistas
// (D12). El shell no va aquí: cada vista compone AppLayout con el chrome que
// le toca.
//
// Idioma de React Aria: sin proveedor, RAC toma el del navegador y no el lang
// de <html>, así que en un navegador en inglés el calendario saldría en inglés
// y con el domingo primero. Mismo valor que index.html.
//
// Clave de la restauración: React Router guarda la posición por
// `location.key`, y toda carga completa lleva la misma, «default». Sin esta
// clave, cargar otra URL en la misma pestaña heredaba el scroll de la anterior
// (4.4 cargaba /kit/navegacion al final, cierre de la fase 5). Solo las cargas
// completas se guardan por URL; la navegación en cliente sigue por su clave.
// Matiz: una URL que se vuelve a escribir en la misma pestaña restaura su
// posición anterior, como una recarga.
const scrollKey = (location: Location) =>
  location.key === 'default' ? location.pathname + location.search : location.key

export default function RootLayout() {
  useRouteFocus()

  return (
    <I18nProvider locale="es-MX">
      <Outlet />
      <ScrollRestoration getKey={scrollKey} />
    </I18nProvider>
  )
}
