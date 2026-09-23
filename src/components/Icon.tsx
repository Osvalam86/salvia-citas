import { ICON_NAMES, type IconName } from './iconNames.ts'

// Los .svg son la fuente de verdad: un solo path, viewBox 0 0 24 24 y
// fill="currentColor". Se leen crudos en compilación (Vite, sin dependencias) y
// se inlinea el trazado; nada entra con innerHTML.
const sources = import.meta.glob<string>('../assets/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const SVG_FORMAT =
  /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 24 24"><path d="([^"]+)" fill="currentColor"\/><\/svg>\s*$/

const paths = new Map<string, string>()

for (const [file, source] of Object.entries(sources)) {
  const name = file.slice(file.lastIndexOf('/') + 1, -'.svg'.length)
  const match = SVG_FORMAT.exec(source)
  if (!match) {
    throw new Error(`Icono «${name}»: no tiene el formato de src/assets/icons (un path, viewBox 0 0 24 24).`)
  }
  paths.set(name, match[1])
}

const missing = ICON_NAMES.filter((name) => !paths.has(name))
const extra = [...paths.keys()].filter((name) => !(ICON_NAMES as readonly string[]).includes(name))
if (missing.length > 0 || extra.length > 0) {
  throw new Error(
    `La lista cerrada de iconos y src/assets/icons difieren. Sin archivo: ${missing.join(', ') || '—'}. Fuera de la lista: ${extra.join(', ') || '—'}.`,
  )
}

type IconProps = {
  name: IconName
  /** 20 junto a texto de 16; 24 en la barra inferior y en los botones de icono. */
  size: 20 | 24
  /** Clase de elemento del padre para colocarlo (mezcla BEM). */
  className?: string
}

// Siempre decorativo: el nombre accesible lo da el texto o el aria-label del
// control. El color se hereda del texto (currentColor).
export default function Icon({ name, size, className }: IconProps) {
  const classes = ['c-icon', `c-icon--${size}`, className].filter(Boolean).join(' ')

  return (
    <svg className={classes} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths.get(name)} fill="currentColor" />
    </svg>
  )
}
