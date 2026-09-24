import { isRouteErrorResponse, useRouteError } from 'react-router'
import NotFound from './NotFound.tsx'

// Límite de error de las rutas con guarda (D1). Va en cada ruta y no en la
// raíz, para que el 404 se pinte dentro de RootLayout y conserve el foco de
// ruta y la restauración del scroll. Cualquier otro error se relanza.
export default function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFound />
  throw error
}
