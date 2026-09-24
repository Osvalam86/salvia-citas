import { CalendarDate } from '@internationalized/date'
import { MAX_DATE } from './clock.ts'

// Especialistas (D4, universo). 47: los 34 de Cardiología de la búsqueda de
// 01.1 (4 fijos de Figma y 30 generados), los 4 de Mis citas que no son de
// cardiología (§6) y 9 generados para que cada especialidad del filtro, sin
// consulta, dé al menos un resultado. Todo es literal o determinista: las
// capturas y las aserciones de scripts/check-data.mjs dependen de ello.
//
// Sin fotos: este módulo lo importa Node (check-data) y no puede cargar
// .webp. Las fotos van por slug en photos.ts.

export const AREAS = {
  cardiologia: 'Cardiología',
  dermatologia: 'Dermatología',
  pediatria: 'Pediatría',
  ginecologia: 'Ginecología',
  'medicina-interna': 'Medicina interna',
  traumatologia: 'Traumatología',
  oftalmologia: 'Oftalmología',
  'medicina-general': 'Medicina general',
  'nutricion-clinica': 'Nutrición clínica',
} as const

export type Area = keyof typeof AREAS

/** Opciones del filtro Especialidad, en el orden de Figma (01.2, 01.5). */
export const FILTER_AREAS = ['cardiologia', 'dermatologia', 'pediatria', 'ginecologia', 'medicina-interna', 'traumatologia'] as const satisfies readonly Area[]

// Clínicas: una por colonia. Nombres de Figma; «Clínica Doctores» y «Clínica
// Pedregal» sustituyen a dos instituciones reales (diseño §6). Direcciones
// ficticias salvo Roma Norte y Polanco, que salen de Figma (02.4, 02.8).
export const CLINICS = {
  condesa: { name: 'Clínica Condesa', neighborhood: 'Condesa', address: 'Av. Michoacán 45, Condesa' },
  'del-valle': { name: 'Consultorio Del Valle', neighborhood: 'Del Valle', address: 'Av. Coyoacán 1520, Del Valle' },
  doctores: { name: 'Clínica Doctores', neighborhood: 'Doctores', address: 'Dr. Vértiz 210, Doctores' },
  napoles: { name: 'Consultorio Nápoles', neighborhood: 'Nápoles', address: 'Av. Insurgentes Sur 745, Nápoles' },
  pedregal: { name: 'Clínica Pedregal', neighborhood: 'Pedregal', address: 'Periférico Sur 890, Pedregal' },
  polanco: { name: 'Clínica Polanco', neighborhood: 'Polanco', address: 'Av. Ejército Nacional 456, Polanco' },
  'roma-norte': { name: 'Clínica Roma Norte', neighborhood: 'Roma Norte', address: 'Av. Álvaro Obregón 123, Roma Norte' },
} as const

export type Neighborhood = keyof typeof CLINICS

/** Opciones de Ubicación: las colonias de los datos, en orden alfabético. La inicial, «Ciudad de México», es la ausencia del parámetro. */
export const NEIGHBORHOODS = Object.keys(CLINICS) as Neighborhood[]

export const CITY = 'Ciudad de México'

/** Solo las dos etiquetas de UI/Tag que existen en Figma. */
export const MODALITIES = {
  presencial: 'Presencial',
  'presencial-video': 'Presencial y videoconsulta',
} as const

export type Modality = keyof typeof MODALITIES

export type Specialist = {
  slug: string
  /** Con tratamiento: «Dra. Elena Ruiz Arellano». */
  name: string
  initial: string
  area: Area
  /** Línea de especialidad de la tarjeta y el perfil («Cardiología · 12 años de experiencia»). */
  specialtyLine: string
  years: number
  clinic: Neighborhood
  modality: Modality
  /** Solo para ordenar por «Cercanía»; no se muestra. */
  distanceKm: number
  /** Último día con agenda publicada: límite de la generación y del selector. */
  publishedUntil: CalendarDate
}

/** Nombre sin tratamiento, en minúsculas y sin acentos, unido por guiones. */
export function slugify(name: string) {
  return name
    .replace(/^Dra?\.\s+/, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
}

/** Primera letra del nombre de pila. */
const initialOf = (name: string) => name.replace(/^Dra?\.\s+/, '')[0]

type Seed = Pick<Specialist, 'name' | 'area' | 'specialtyLine' | 'years' | 'clinic' | 'modality' | 'distanceKm'> & {
  publishedUntil?: CalendarDate
}

const specialist = ({ publishedUntil = MAX_DATE, ...seed }: Seed): Specialist => ({
  ...seed,
  slug: slugify(seed.name),
  initial: initialOf(seed.name),
  publishedUntil,
})

// Fijos: los 4 de la primera página de 01.1 (líneas literales de Figma) y los
// 4 de Mis citas que no son de cardiología (§6).
const FIXED: Specialist[] = [
  specialist({ name: 'Dra. Mariana Cifuentes Poza', area: 'cardiologia', specialtyLine: 'Cardiología pediátrica · 15 años', years: 15, clinic: 'condesa', modality: 'presencial-video', distanceKm: 2.1 }),
  specialist({ name: 'Dra. Elena Ruiz Arellano', area: 'cardiologia', specialtyLine: 'Cardiología · 12 años de experiencia', years: 12, clinic: 'roma-norte', modality: 'presencial', distanceKm: 1.4 }),
  specialist({ name: 'Dr. Joaquín Bermúdez Lara', area: 'cardiologia', specialtyLine: 'Cardiología intervencionista · 8 años', years: 8, clinic: 'pedregal', modality: 'presencial', distanceKm: 12.3 }),
  specialist({ name: 'Dr. Rodrigo Alcántara Vela', area: 'cardiologia', specialtyLine: 'Electrofisiología · 20 años', years: 20, clinic: 'doctores', modality: 'presencial', distanceKm: 4.6, publishedUntil: new CalendarDate(2029, 4, 30) }),
  specialist({ name: 'Dr. Andrés Molina Paz', area: 'dermatologia', specialtyLine: 'Dermatología · 10 años', years: 10, clinic: 'del-valle', modality: 'presencial', distanceKm: 5.8 }),
  specialist({ name: 'Dr. Iván Cortés Naranjo', area: 'oftalmologia', specialtyLine: 'Oftalmología · 9 años de experiencia', years: 9, clinic: 'polanco', modality: 'presencial', distanceKm: 6.9 }),
  specialist({ name: 'Dr. Tomás Ibarra Solís', area: 'medicina-general', specialtyLine: 'Medicina general · 14 años', years: 14, clinic: 'roma-norte', modality: 'presencial', distanceKm: 1.4 }),
  specialist({ name: 'Dra. Paula Serrano Vidal', area: 'nutricion-clinica', specialtyLine: 'Nutrición clínica · 7 años', years: 7, clinic: 'napoles', modality: 'presencial', distanceKm: 4.9 }),
]

// Generados: nombres literales (mitad Dra., mitad Dr., sin personas
// conocidas). Los 30 primeros son de Cardiología; el resto completa las
// especialidades del filtro.
const GENERATED_NAMES: [string, Area][] = [
  ['Dra. Lucía Herrera Campos', 'cardiologia'],
  ['Dr. Sergio Navarro Ibáñez', 'cardiologia'],
  ['Dra. Valeria Ortega Salinas', 'cardiologia'],
  ['Dr. Héctor Rangel Pineda', 'cardiologia'],
  ['Dra. Fernanda Aguilar Ríos', 'cardiologia'],
  ['Dr. Emilio Castañeda Luna', 'cardiologia'],
  ['Dra. Regina Morales Tapia', 'cardiologia'],
  ['Dr. Arturo Delgado Fuentes', 'cardiologia'],
  ['Dra. Natalia Robles Cervantes', 'cardiologia'],
  ['Dr. Gustavo Mejía Olvera', 'cardiologia'],
  ['Dra. Carolina Espinosa Vargas', 'cardiologia'],
  ['Dr. Ricardo Salazar Montes', 'cardiologia'],
  ['Dra. Daniela Padilla Rosas', 'cardiologia'],
  ['Dr. Javier Cárdenas Villalobos', 'cardiologia'],
  ['Dra. Sofía Guerrero Beltrán', 'cardiologia'],
  ['Dr. Manuel Estrada Quiroz', 'cardiologia'],
  ['Dra. Adriana Zamora Nieto', 'cardiologia'],
  ['Dr. Fernando Lozano Carrillo', 'cardiologia'],
  ['Dra. Gabriela Rivas Medina', 'cardiologia'],
  ['Dr. Óscar Valdez Sandoval', 'cardiologia'],
  ['Dra. Mónica Cabrera Ochoa', 'cardiologia'],
  ['Dr. Raúl Figueroa Arriaga', 'cardiologia'],
  ['Dra. Ximena Paredes Galindo', 'cardiologia'],
  ['Dr. Eduardo Mendoza Trejo', 'cardiologia'],
  ['Dra. Claudia Barrera Montoya', 'cardiologia'],
  ['Dr. Alejandro Ponce Márquez', 'cardiologia'],
  ['Dra. Patricia Duarte Villegas', 'cardiologia'],
  ['Dr. Mauricio Acosta Rendón', 'cardiologia'],
  ['Dra. Laura Bravo Casillas', 'cardiologia'],
  ['Dr. Diego Sepúlveda Orozco', 'cardiologia'],
  ['Dra. Renata Vega Colín', 'dermatologia'],
  ['Dra. Isabel Carmona Díaz', 'pediatria'],
  ['Dr. Pablo Guzmán Arce', 'pediatria'],
  ['Dra. Beatriz Solano Treviño', 'ginecologia'],
  ['Dra. Mariela Ontiveros Garza', 'ginecologia'],
  ['Dr. Julián Ferrer Nava', 'medicina-interna'],
  ['Dra. Alejandra Rueda Serna', 'medicina-interna'],
  ['Dr. Rafael Ugalde Bonilla', 'traumatologia'],
  ['Dr. Leonardo Corona Álvarez', 'traumatologia'],
]

const CARDIOLOGY_LINES = [
  'Cardiología',
  'Cardiología clínica',
  'Ecocardiografía',
  'Insuficiencia cardiaca',
  'Rehabilitación cardiaca',
  'Cardiología pediátrica',
  'Electrofisiología',
  'Cardiología intervencionista',
]

const GENERATED: Specialist[] = GENERATED_NAMES.map(([name, area], i) => {
  const years = 4 + ((i * 7) % 25)
  const line = area === 'cardiologia' ? CARDIOLOGY_LINES[i % CARDIOLOGY_LINES.length] : AREAS[area]
  return specialist({
    name,
    area,
    specialtyLine: `${line} · ${years} años`,
    years,
    clinic: NEIGHBORHOODS[i % NEIGHBORHOODS.length],
    modality: i % 3 === 0 ? 'presencial-video' : 'presencial',
    distanceKm: 0.5 + ((i * 37) % 146) / 10,
  })
})

/** Slugs de los generados de Cardiología: abril ocupado, primer hueco desde el 2 de mayo (D4, orden). */
export const GENERATED_CARDIOLOGY = new Set(GENERATED.filter((s) => s.area === 'cardiologia').map((s) => s.slug))

export const SPECIALISTS: Specialist[] = [...FIXED, ...GENERATED]

export const SLUGS = {
  mariana: 'mariana-cifuentes-poza',
  ruiz: 'elena-ruiz-arellano',
  joaquin: 'joaquin-bermudez-lara',
  rodrigo: 'rodrigo-alcantara-vela',
  molina: 'andres-molina-paz',
  cortes: 'ivan-cortes-naranjo',
  ibarra: 'tomas-ibarra-solis',
  serrano: 'paula-serrano-vidal',
} as const

export function findSpecialist(slug: string | undefined, specialists = SPECIALISTS) {
  return specialists.find((s) => s.slug === slug)
}
