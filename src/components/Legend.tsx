type Help =
  | {
      /**
       * Ayuda del grupo. Va fuera de <legend> para que el nombre del grupo siga
       * siendo corto; la pantalla pone `helpId` en aria-describedby del fieldset.
       */
      help: string
      helpId: string
    }
  | { help?: never; helpId?: never }

type LegendProps = Help & {
  /** Section: fieldsets de la vista 3. Group: grupos de filtros. */
  level: 'section' | 'group'
  /** D14: <legend><h2>…</h2></legend> cuando la legend es también un encabezado. */
  headingLevel?: 2 | 3
  children: string
}

// UI/Legend: primer hijo de un <fieldset>, que es patrón de pantalla. Pinta
// dos bloques, c-legend y c-legend-help (DESIGN.md, D5).
export default function Legend({ level, headingLevel, help, helpId, children }: LegendProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'

  return (
    <>
      <legend className={`c-legend c-legend--${level}`}>
        {headingLevel ? <Heading className="c-legend__heading">{children}</Heading> : children}
      </legend>
      {help && (
        <p className="c-legend-help" id={helpId}>
          {help}
        </p>
      )}
    </>
  )
}
