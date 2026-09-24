import type { AvatarPhoto } from '../components/Avatar.tsx'
import elena96 from '../assets/avatars/elena-ruiz-arellano-96.webp'
import elena192 from '../assets/avatars/elena-ruiz-arellano-192.webp'
import mariana96 from '../assets/avatars/mariana-cifuentes-poza-96.webp'
import mariana192 from '../assets/avatars/mariana-cifuentes-poza-192.webp'
import rodrigo96 from '../assets/avatars/rodrigo-alcantara-vela-96.webp'
import rodrigo192 from '../assets/avatars/rodrigo-alcantara-vela-192.webp'
import { SLUGS } from './specialists.ts'

// Fotos de avatar (§6): solo las tres personas que llevan foto en Figma. El
// resto va con inicial. Aparte de specialists.ts porque Node (check-data) no
// importa .webp. Rostros generados con IA, fuera de MIT y CC BY (LICENSE-DOCS).
const photo = (x1: string, x2: string): AvatarPhoto => ({ src: x1, srcSet: `${x1} 96w, ${x2} 192w` })

export const PHOTOS: Partial<Record<string, AvatarPhoto>> = {
  [SLUGS.mariana]: photo(mariana96, mariana192),
  [SLUGS.ruiz]: photo(elena96, elena192),
  [SLUGS.rodrigo]: photo(rodrigo96, rodrigo192),
}
