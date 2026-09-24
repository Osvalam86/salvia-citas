import { createBrowserRouter, Navigate } from 'react-router'
import Kit from './views/Kit.tsx'
import KitLayout from './views/KitLayout.tsx'
import KitNav from './views/KitNav.tsx'
import RootLayout from './views/RootLayout.tsx'

// Rutas de la app (DESIGN.md, D1). Hasta la fase 5 solo existe el catálogo,
// que va también en producción (D9); `/` redirige a él.
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Navigate to="/kit" replace /> },
      { path: '/kit', element: <Kit /> },
      { path: '/kit/layout', element: <KitLayout /> },
      { path: '/kit/navegacion', element: <KitNav /> },
    ],
  },
])
