import type { AriaAttributes, MouseEventHandler, ReactNode, Ref } from 'react'
import { Link as RouterLink } from 'react-router'
import type { FocusState } from '../hooks/useRouteFocus.ts'
import Icon from './Icon.tsx'
import type { IconName } from './iconNames.ts'

type BaseProps = {
  /**
   * Style de UI/Button. Primary es la base: una por pantalla y nunca dentro de
   * una lista. Destructive, solo en el diálogo de confirmación.
   */
  variant?: 'primary' | 'secondary' | 'destructive'
  /** Iconos de 20, decorativos: el nombre accesible es siempre la etiqueta. */
  leadingIcon?: IconName
  trailingIcon?: IconName
  /** Clase de elemento del padre para colocarlo (mezcla BEM), p. ej. FILL. */
  className?: string
  'aria-describedby'?: string
  children: ReactNode
}

// Sin href: <button>. Los atributos de estado solo existen en esta forma: en
// un enlace, aria-pressed o aria-expanded no tienen sentido.
type AsButton = BaseProps & {
  href?: never
  download?: never
  /** submit en formularios. El envío nunca se deshabilita. */
  type?: 'button' | 'submit'
  /**
   * id del formulario al que envía, cuando el botón vive fuera de él: el
   * envío de UI/Booking Bar está en la barra del shell, fuera de main.
   */
  form?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  'aria-haspopup'?: AriaAttributes['aria-haspopup']
  'aria-expanded'?: AriaAttributes['aria-expanded']
  /** Con aria-expanded: el id del panel que abre (menú de cuenta, 4.4). */
  'aria-controls'?: string
  'aria-pressed'?: AriaAttributes['aria-pressed']
  /** Para devolverle el foco por script (Escape en el menú de cuenta). */
  ref?: Ref<HTMLButtonElement>
}

type LinkOnly = {
  type?: never
  form?: never
  onClick?: never
  ref?: never
  'aria-haspopup'?: never
  'aria-expanded'?: never
  'aria-controls'?: never
  'aria-pressed'?: never
}

// href interno: navega con React Router. `state` nombra el destino del foco
// tras navegar (D12): lo lee useRouteFocus si cambia la ruta, o la vista si
// solo cambia `search`.
type AsLink = BaseProps &
  LinkOnly & {
    href: string
    download?: never
    state?: FocusState
  }

// href + download: <a download> nativo. La etiqueta debe anunciar la descarga.
type AsDownload = BaseProps &
  LinkOnly & {
    href: string
    download: true | string
    state?: never
  }

export type ButtonProps = AsButton | AsLink | AsDownload

// UI/Button: una sola clase c-button para las tres formas.
export default function Button(props: ButtonProps) {
  const { variant = 'primary', leadingIcon, trailingIcon, className, children, ref } = props
  const classes = ['c-button', variant !== 'primary' && `c-button--${variant}`, className]
    .filter(Boolean)
    .join(' ')

  // La etiqueta ocupa el ancho sobrante (Figma: Label en FILL en las acciones
  // de bloque): con un icono, el icono queda junto al padding y el texto se
  // centra en el resto.
  const content = (
    <>
      {leadingIcon && <Icon name={leadingIcon} size={20} />}
      <span className="c-button__label">{children}</span>
      {trailingIcon && <Icon name={trailingIcon} size={20} />}
    </>
  )

  if (props.href === undefined) {
    return (
      <button
        ref={ref}
        type={props.type ?? 'button'}
        form={props.form}
        className={classes}
        onClick={props.onClick}
        aria-describedby={props['aria-describedby']}
        aria-haspopup={props['aria-haspopup']}
        aria-expanded={props['aria-expanded']}
        aria-controls={props['aria-controls']}
        aria-pressed={props['aria-pressed']}
      >
        {content}
      </button>
    )
  }

  if (props.download !== undefined) {
    return (
      <a
        href={props.href}
        download={props.download}
        className={classes}
        aria-describedby={props['aria-describedby']}
      >
        {content}
      </a>
    )
  }

  return (
    <RouterLink to={props.href} state={props.state} className={classes} aria-describedby={props['aria-describedby']}>
      {content}
    </RouterLink>
  )
}
