import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react'

/**
 * Destino del salto al contenido: el h1 de cada vista lleva este id y
 * tabIndex={-1}, el mismo destino que recibe el foco al cambiar de ruta (D12).
 */
export const MAIN_TITLE_ID = 'contenido'

type AppLayoutProps = {
  /** Header de la vista (móvil o escritorio). */
  header?: ReactNode
  /** Barra inferior: Bottom Nav, Booking Bar o Action Bar. Por D7, solo bajo lg. */
  bar?: ReactNode
  children: ReactNode
}

// Salto al contenido (2.4.1) sin entrada de historial: el foco va al h1 por
// script. Sin JS, o sin destino, funciona como ancla nativa.
function skipToContent(event: MouseEvent<HTMLAnchorElement>) {
  const target = document.getElementById(MAIN_TITLE_ID)
  if (!target) return
  event.preventDefault()
  target.focus()
}

// Shell de la app (c-app-layout). Cada vista lo compone con el chrome que le
// toca. Mide el hueco de la barra y publica su alto en la raíz para el
// scroll-padding (criterio 2.4.11): sigue a la barra presente, con su zona
// segura, el zoom de texto y las etiquetas que parten.
export default function AppLayout({ header, bar, children }: AppLayoutProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const hasBar = Boolean(bar)

  useLayoutEffect(() => {
    const element = barRef.current
    if (!element) return

    const root = document.documentElement
    const observer = new ResizeObserver(([entry]) => {
      root.style.setProperty('--app-layout-bar-size', `${entry.borderBoxSize[0].blockSize}px`)
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
      root.style.removeProperty('--app-layout-bar-size')
    }
  }, [hasBar])

  return (
    <div className="c-app-layout">
      <a
        href={`#${MAIN_TITLE_ID}`}
        className="c-button c-button--secondary c-app-layout__skip"
        onClick={skipToContent}
      >
        Saltar al contenido
      </a>
      {header}
      <main className="c-app-layout__main">
        <div className="o-wrapper o-stack o-stack--gap-6">{children}</div>
      </main>
      {hasBar && (
        <div className="c-app-layout__bar" ref={barRef}>
          {bar}
        </div>
      )}
    </div>
  )
}
