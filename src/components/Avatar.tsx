import { useState } from 'react'

const PIXELS = { small: 48, medium: 64, large: 96 } as const

export type AvatarPhoto = { src: string; srcSet?: string }

type AvatarProps = {
  /** Size de UI/Avatar: Small 48, Medium 64, Large 96. */
  size: keyof typeof PIXELS
  /** Respaldo cuando no hay foto, mientras carga o si no carga. */
  initial: string
  /** Foto de la persona (src/data/photos.ts). Sin ella, o si falla, la inicial. */
  photo?: AvatarPhoto
  /** Atributo loading del img: lazy por debajo del pliegue (Result Card). */
  loading?: 'eager' | 'lazy'
  /**
   * Atributo sizes del img. Por defecto, el lado de `size`; quien cambia el
   * tamaño con --avatar-size (Result Card, 48 en Stacked y 64 en Row) da el suyo.
   */
  sizes?: string
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Avatar: decorativo. El nombre está en el texto de al lado, así que el
// contenedor va aria-hidden y la foto con alt vacío. Como en Figma, la foto va
// sobre la inicial: mientras carga, o si falla, se ve la inicial y el círculo
// nunca queda vacío. Si falla, la foto se retira.
export default function Avatar({ size, initial, photo, loading = 'eager', sizes, className }: AvatarProps) {
  const [failed, setFailed] = useState(false)
  const classes = ['c-avatar', `c-avatar--${size}`, className].filter(Boolean).join(' ')
  const pixels = PIXELS[size]

  return (
    <span className={classes} aria-hidden="true">
      <span className="c-avatar__initial">{initial}</span>
      {photo && !failed && (
        <img
          className="c-avatar__photo"
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={photo.srcSet ? (sizes ?? `${pixels / 16}rem`) : undefined}
          alt=""
          width={pixels}
          height={pixels}
          loading={loading}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  )
}
