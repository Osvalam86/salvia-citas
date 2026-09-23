// Stylelint: lo mecánico del checklist de bemit-scss
// (.claude/skills/bemit-scss/references/checklist.md) y las reglas de tokens
// de DESIGN.md. Cuanto más falle aquí, menos depende de que alguien se acuerde.

// BEMIT sin t- (un solo modo, DESIGN.md decisión 5) ni js- (sin CSS, y en
// React no se usan): o-, c-, u-, s- con BEM; is-/has- sin elemento ni modificador.
const name = '[a-z0-9]+(?:-[a-z0-9]+)*'
const bemit = new RegExp(
  `^(?:(?:o|c|u|s)-${name}(?:__${name})?(?:--${name})?|(?:is|has)-${name})$`,
)

// Primitivos: los 20 de color y los tipográficos. Fuera de 01-settings solo se
// consumen roles (--color-*) y grupos --text-* (DESIGN.md, tokens-equivalencias).
// Espaciado, radios y layout no tienen nivel 2: se consumen directos.
const primitive =
  '/var\\(\\s*--(?:color-(?:white|black|(?:neutral|sage|accent|success|red)-\\d+)|font-(?:family|weight|size)-|line-height-|letter-spacing-)/'

export default {
  extends: ['stylelint-config-standard-scss'],
  rules: {
    'selector-class-pattern': [
      bemit,
      {
        resolveNestedSelectors: true,
        message: (selector) => `«${selector}» no sigue BEMIT (o-/c-/u-/s- con BEM, o is-/has-)`,
      },
    ],
    // Tokens en kebab-case y variables locales del bloque con `--_`.
    'custom-property-pattern': '^_?[a-z][a-z0-9]*(?:-[a-z0-9]+)*$',
    'declaration-property-value-disallowed-list': [
      { '/.*/': [primitive] },
      { message: 'Primitivo fuera de 01-settings: consume el rol o el grupo --text-*' },
    ],
    // Ni hex ni nombres de color escritos a mano: el único camino a un color
    // es un rol. `transparent`, `currentColor` y los colores de sistema de
    // forced-colors (Canvas, Highlight…) no son colores con nombre y pasan sin
    // excepción; `currentcolor` va en minúscula por value-keyword-case.
    'color-no-hex': true,
    'color-named': 'never',

    // Especificidad y anidamiento (especificidad-estados.md, sass-moderno.md).
    'selector-max-id': 0,
    'selector-max-specificity': '0,2,0',
    'declaration-no-important': true,
    'max-nesting-depth': [1, { ignoreAtRules: ['include', 'media', 'container', 'supports'] }],

    // rem siempre; px solo en bordes, outline (y su desfase) y radios.
    'unit-disallowed-list': [
      ['px'],
      { ignoreProperties: { px: ['/^border/', '/^outline/', '/radius/'] } },
    ],

    // Safari en iOS escala el texto al girar a horizontal si no recibe el
    // prefijo: es legibilidad real, no un prefijo heredado. Solo esa propiedad.
    'property-no-vendor-prefix': [true, { ignoreProperties: ['/text-size-adjust$/'] }],

    // Los hex vienen de Figma en 6 cifras y `pnpm contrast` los lee así.
    'color-hex-length': 'long',
    // Los nombres de familia van con su mayúscula (Georgia), también en tokens.
    'value-keyword-case': ['lower', { ignoreProperties: ['/^--font-family-/'] }],

    // Formato de comentarios y agrupación: los tokens se agrupan con líneas en
    // blanco, los bloques de comentario separan párrafos con `//` vacío y los
    // comentarios finales de grupo van pegados a su grupo.
    'scss/comment-no-empty': null,
    'custom-property-empty-line-before': null,
    'scss/double-slash-comment-empty-line-before': null,
  },
  overrides: [
    {
      // Los tokens definen los primitivos (en hex) y sus radios en px.
      files: ['src/styles/01-settings/**/*.scss'],
      rules: {
        'declaration-property-value-disallowed-list': null,
        'color-no-hex': null,
        'color-named': null,
      },
    },
    {
      // rem() convierte desde px por definición.
      files: ['src/styles/02-tools/_functions.scss'],
      rules: { 'unit-disallowed-list': null },
    },
    {
      // Única capa con !important (arquitectura.md).
      files: ['src/styles/07-utilities/**/*.scss'],
      rules: { 'declaration-no-important': null },
    },
  ],
}
