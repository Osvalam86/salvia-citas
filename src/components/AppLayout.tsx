import { useLayoutEffect, useRef, type ReactNode } from 'react'

type AppLayoutProps = {
  /** Header de la vista (móvil o escritorio). */
  header?: ReactNode
  /** Barra inferior: Bottom Nav, Booking Bar o Action Bar. Por D7, solo bajo lg. */
  bar?: ReactNode
  children: ReactNode
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
