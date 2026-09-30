import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { bookingStepLoader, confirmedLoader, myAppointmentsLoader, rescheduleLoader, specialistLoader } from './views/loaders.ts'
import NotFound from './views/NotFound.tsx'
import RootLayout from './views/RootLayout.tsx'
import RouteError from './views/RouteError.tsx'

// Rutas de la app (DESIGN.md, D1): las 8 de las vistas con sus guardas, el
// 404 y el catálogo, que va también en producción (D9).
const guarded = { errorElement: <RouteError /> }

// Carga diferida por ruta (7.2, D12): cada vista es su propio chunk y el
// router lo pide antes del commit, como un loader, así que la página de origen
// sigue montada hasta que llega la nueva, sin Suspense ni frame intermedio.
// Loaders y errorElement siguen estáticos: las guardas no esperan a la red. El
// 404 tampoco (RouteError pinta NotFound).
const view = (load: () => Promise<{ default: ComponentType }>) => ({
  lazy: { Component: async () => (await load()).default },
})

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Mientras llega el chunk de la carga completa, nada: #root vacío, como
    // antes de que corra el JS. Tiene que ser un componente: con null, el
    // router no lo ve y avisa en consola.
    HydrateFallback: () => null,
    children: [
      { path: '/', ...view(() => import('./views/Search.tsx')) },
      { path: '/especialistas/:slug', ...view(() => import('./views/Specialist.tsx')), loader: specialistLoader, ...guarded },
      { path: '/especialistas/:slug/confirmar', ...view(() => import('./views/ConfirmBooking.tsx')), loader: bookingStepLoader, ...guarded },
      { path: '/especialistas/:slug/datos', ...view(() => import('./views/PatientData.tsx')), loader: bookingStepLoader, ...guarded },
      { path: '/citas/:id/confirmada', ...view(() => import('./views/BookingConfirmed.tsx')), loader: confirmedLoader, ...guarded },
      { path: '/mis-citas', ...view(() => import('./views/MyAppointments.tsx')), loader: myAppointmentsLoader },
      { path: '/mis-citas/:id/reprogramar', ...view(() => import('./views/Reschedule.tsx')), loader: rescheduleLoader, ...guarded },
      { path: '/fuera-de-alcance', ...view(() => import('./views/OutOfScope.tsx')) },
      { path: '/kit', ...view(() => import('./views/Kit.tsx')) },
      { path: '/kit/layout', ...view(() => import('./views/KitLayout.tsx')) },
      { path: '/kit/navegacion', ...view(() => import('./views/KitNav.tsx')) },
      { path: '/kit/resultados', ...view(() => import('./views/KitResults.tsx')) },
      { path: '/kit/fecha-hora', ...view(() => import('./views/KitDateTime.tsx')) },
      { path: '/kit/citas', ...view(() => import('./views/KitAppointments.tsx')) },
      { path: '/kit/estados', ...view(() => import('./views/KitStates.tsx')) },
      { path: '*', element: <NotFound /> },
    ],
  },
])
