// Sesión simulada (diseño §1 y §6): la app arranca con Karla Sánchez con la
// sesión iniciada. Una sola fuente para el header (nombre corto), los campos de
// la vista 3 (nombre completo y correo, Figma 03.1) y el correo de la
// confirmación.
export const SESSION = {
  /** Valor de «Nombre completo» (Figma 03.1). */
  fullName: 'Karla Sánchez Bautista',
  /** Botón de cuenta del header de escritorio (UI/Header/Desktop Signed-in). */
  shortName: 'Karla Sánchez',
  email: 'karla.sanchez@ejemplo.com',
} as const
