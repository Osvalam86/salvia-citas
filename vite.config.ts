import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  // Un chunk por librería (7.2): la entrada los importa de forma estática y
  // Vite los precarga con modulepreload en index.html, sin ronda extra. React
  // tiene la prioridad más alta para que ni React Router ni React Aria lo
  // arrastren con sus dependencias. La app se queda en la entrada.
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 3 },
            { name: 'react-router', test: /node_modules[\\/]react-router[\\/]/, priority: 2 },
            {
              name: 'react-aria',
              test: /node_modules[\\/](react-aria|react-aria-components|react-stately|@react-aria|@react-stately|@react-types|@internationalized)[\\/]/,
              priority: 2,
            },
          ],
        },
      },
    },
  },
})
