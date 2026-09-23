import { useEffect, useRef, type ReactNode } from 'react'
import Icon from './Icon.tsx'
import IconButton from './IconButton.tsx'
import Link from './Link.tsx'
import type { IconName } from './iconNames.ts'

type Common = {
  /** Qué pasó (Success, Error) o nombre del contexto (Info). Nunca «Error» ni «Éxito». */
  title: string
  /**
   * Nivel del título según dónde vaya el aviso (D14). Sin valor por defecto.
   * El diseño solo usa 2 (tras el h1 de la vista); 3 y 4 existen para otros
   * contextos, como el catálogo /kit.
   */
  headingLevel: 2 | 3 | 4
  /** Cuerpo en tinta, contenido de frase: va dentro de un <p>. */
  body: ReactNode
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// Info: contenido estático. Sin rol, sin foco, sin cierre ni acción; su glifo
// es contextual (por defecto info).
type InfoProps = Common & {
  tone: 'info'
  icon?: IconName
  delivery?: never
  open?: never
  action?: never
  onDismiss?: never
}

// Success y Error: resultado de una acción. Glifo fijo por tono.
type ResultProps = Common & {
  tone: 'success' | 'error'
  icon?: never
  action?: { href: string; label: string }
  /** Muestra el cierre. Al cerrar, el foco va al primer encabezado de la sección. */
  onDismiss?: () => void
}

// O región viva o foco, nunca las dos (diseño §4.6).
// - live: el disparador sigue en pantalla. La región se pinta siempre y solo
//   el aviso depende de `open`: existe antes que el mensaje.
// - focus: el disparador desaparece. Sin rol; el título recibe el foco al montarse.
type LiveProps = ResultProps & { delivery: 'live'; open: boolean }
type FocusProps = ResultProps & { delivery: 'focus'; open?: never }

export type NoticeProps = InfoProps | LiveProps | FocusProps

const TONE_ICON = { success: 'check-circle', error: 'warning-circle' } as const

// UI/Notice: aviso en línea, persistente, donde ocurrió la acción.
export default function Notice(props: NoticeProps) {
  const { tone, title, headingLevel, body, className } = props
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const isFocus = props.delivery === 'focus'
  const openedOnMount = useRef(props.delivery === 'live' && props.open)

  useEffect(() => {
    if (isFocus) titleRef.current?.focus()
  }, [isFocus])

  useEffect(() => {
    if (import.meta.env.DEV && openedOnMount.current) {
      console.error(
        'Notice delivery="live" montado ya abierto: la región no existía antes que el mensaje y puede no anunciarse. Móntalo cerrado y cambia `open`.',
      )
    }
  }, [])

  const dismiss = () => {
    const root = rootRef.current
    const scope = root?.closest('section, main')
    const heading = [...(scope?.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6') ?? [])].find(
      (element) => !root?.contains(element),
    )
    if (heading) {
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1')
      heading.focus()
    }
    if (props.tone !== 'info') props.onDismiss?.()
  }

  const Heading = (['h2', 'h3', 'h4'] as const)[headingLevel - 2]
  const icon: IconName = props.tone === 'info' ? (props.icon ?? 'info') : TONE_ICON[props.tone]
  const classes = ['c-notice', `c-notice--${tone}`, className].filter(Boolean).join(' ')

  const notice = (
    <div className={classes} ref={rootRef}>
      <span className="c-notice__icon-slot">
        <Icon name={icon} size={20} className="c-notice__icon" />
      </span>
      <div className="c-notice__content">
        <div className="c-notice__text">
          <Heading className="c-notice__title" ref={titleRef} tabIndex={isFocus ? -1 : undefined}>
            {title}
          </Heading>
          <p>{body}</p>
        </div>
        {props.tone !== 'info' && props.action && (
          <Link href={props.action.href}>{props.action.label}</Link>
        )}
      </div>
      {props.tone !== 'info' && props.onDismiss && (
        <IconButton icon="x" label="Cerrar aviso" onClick={dismiss} />
      )}
    </div>
  )

  if (props.delivery === 'live') {
    return <div role={tone === 'error' ? 'alert' : 'status'}>{props.open && notice}</div>
  }

  return notice
}
