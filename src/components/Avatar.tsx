import { useState } from 'react'

const PIXELS = { small: 48, medium: 64, large: 96 } as const

type AvatarProps = {
  /** Size de UI/Avatar: Small 48, Medium 64, Large 96. */
  size: keyof typeof PIXELS
  /** Respaldo cuando no hay foto o la foto no carga. */
  initial: string
  /** Foto de la persona. Hasta decidir su origen (DESIGN.md, Pendientes) no se usa. */
  photo?: { src: string; srcSet?: string }
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Avatar: decorativo. El nombre está en el texto de al lado, así que el
// contenedor va aria-hidden y la foto con alt vacío. Si la foto falla, vuelve
// a la inicial.
export default function Avatar({ size, initial, photo, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const classes = ['c-avatar', `c-avatar--${size}`, className].filter(Boolean).join(' ')
  const pixels = PIXELS[size]

  return (
    <span className={classes} aria-hidden="true">
      {photo && !failed ? (
        <img
          className="c-avatar__photo"
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={photo.srcSet ? `${pixels / 16}rem` : undefined}
          alt=""
          width={pixels}
          height={pixels}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="c-avatar__initial">{initial}</span>
      )}
    </span>
  )
}
