import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
// Fuentes alojadas (D11): Fraunces con los ejes wght y opsz; Inter solo wght.
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/inter/wght.css'
import './styles/main.scss'
import { router } from './router.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
