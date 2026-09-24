import { createBrowserRouter } from 'react-router'
import BookingConfirmed from './views/BookingConfirmed.tsx'
import ConfirmBooking from './views/ConfirmBooking.tsx'
import Kit from './views/Kit.tsx'
import KitAppointments from './views/KitAppointments.tsx'
import KitDateTime from './views/KitDateTime.tsx'
import KitLayout from './views/KitLayout.tsx'
import KitNav from './views/KitNav.tsx'
import KitResults from './views/KitResults.tsx'
import KitStates from './views/KitStates.tsx'
import { bookingStepLoader, confirmedLoader, rescheduleLoader, specialistLoader } from './views/loaders.ts'
import MyAppointments from './views/MyAppointments.tsx'
import NotFound from './views/NotFound.tsx'
import OutOfScope from './views/OutOfScope.tsx'
import PatientData from './views/PatientData.tsx'
import Reschedule from './views/Reschedule.tsx'
import RootLayout from './views/RootLayout.tsx'
import RouteError from './views/RouteError.tsx'
import Search from './views/Search.tsx'
import Specialist from './views/Specialist.tsx'

// Rutas de la app (DESIGN.md, D1): las 8 de las vistas con sus guardas, el
// 404 y el catálogo, que va también en producción (D9).
const guarded = { errorElement: <RouteError /> }

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Search /> },
      { path: '/especialistas/:slug', element: <Specialist />, loader: specialistLoader, ...guarded },
      { path: '/especialistas/:slug/confirmar', element: <ConfirmBooking />, loader: bookingStepLoader, ...guarded },
      { path: '/especialistas/:slug/datos', element: <PatientData />, loader: bookingStepLoader, ...guarded },
      { path: '/citas/:id/confirmada', element: <BookingConfirmed />, loader: confirmedLoader, ...guarded },
      { path: '/mis-citas', element: <MyAppointments /> },
      { path: '/mis-citas/:id/reprogramar', element: <Reschedule />, loader: rescheduleLoader, ...guarded },
      { path: '/fuera-de-alcance', element: <OutOfScope /> },
      { path: '/kit', element: <Kit /> },
      { path: '/kit/layout', element: <KitLayout /> },
      { path: '/kit/navegacion', element: <KitNav /> },
      { path: '/kit/resultados', element: <KitResults /> },
      { path: '/kit/fecha-hora', element: <KitDateTime /> },
      { path: '/kit/citas', element: <KitAppointments /> },
      { path: '/kit/estados', element: <KitStates /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
