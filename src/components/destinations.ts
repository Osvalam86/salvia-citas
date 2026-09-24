// Destinos de la navegación (D1). Ayuda, Cuenta, Iniciar sesión, Crear
// cuenta y Cerrar sesión van a la página genérica de lo que queda fuera del
// caso de estudio (diseño §1; la ruta llega en la fase 6).
export const PATHS = {
  especialistas: '/',
  misCitas: '/mis-citas',
  fueraDeAlcance: '/fuera-de-alcance',
} as const

/** Pestañas del header de escritorio que pueden ser la actual. «Ayuda» nunca lo es. */
export type HeaderDestination = 'especialistas' | 'mis-citas'

/** Destinos de la barra inferior. */
export type BottomNavDestination = HeaderDestination | 'cuenta'
