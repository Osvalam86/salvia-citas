type TagProps = {
  /** Modalidad de consulta («Presencial», «Presencial y videoconsulta»). */
  children: string
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// UI/Tag: dato no interactivo, sin rol ni foco. Su semántica es la modalidad
// de consulta y no se presta para otra cosa.
export default function Tag({ children, className }: TagProps) {
  const classes = ['c-tag', className].filter(Boolean).join(' ')

  return <span className={classes}>{children}</span>
}
