import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Selector de un className, literal o plantilla, que contiene la clase de
// bloque como token completo y no contiene el modificador obligatorio.
// Límite: una clase compuesta en ejecución (variable, función) no se comprueba.
const missingModifier = (block, modifier) => {
  const has = (token) => `/(^|\\s)${token}(\\s|$)/`
  const hasPrefix = (prefix) => `/(^|\\s)${prefix}/`
  const attribute = "JSXAttribute[name.name='className']"
  return [
    `${attribute} > Literal[value=${has(block)}]:not([value=${hasPrefix(modifier)}])`,
    `${attribute} > JSXExpressionContainer > TemplateLiteral:has(TemplateElement[value.raw=${has(block)}]):not(:has(TemplateElement[value.raw=${hasPrefix(modifier)}]))`,
  ].join(', ')
}

const objectModifierRules = [
  {
    selector: missingModifier('o-stack', 'o-stack--gap-'),
    message: 'o-stack sin modificador de gap. Declara siempre el gap, también o-stack--gap-0.',
  },
  {
    selector: missingModifier('o-cluster', 'o-cluster--gap-'),
    message: 'o-cluster sin modificador de gap. Declara siempre el gap, también o-cluster--gap-0.',
  },
  {
    selector: missingModifier('o-cluster', 'o-cluster--align-'),
    message: 'o-cluster sin modificador de alineación (--align-start, --align-center o --align-end).',
  },
]

export default defineConfig([
  globalIgnores(['dist', 'scripts/verify/out']),
  {
    // Scripts de Node: contraste (pnpm contrast) y verificación (pnpm verify).
    files: ['scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.strict,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Safari (VoiceOver) quita la semántica de lista a un ul/ol sin
      // marcadores; el reset los quita solo con role="list" explícito.
      // El rol no es redundante aquí: se permite solo en ul/ol y solo `list`.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      // El tipo de React acepta cualquier texto en autoComplete (admite
      // combinaciones de tokens), así que el compilador no para un token mal
      // escrito. La regla sí, también en el componente que envuelve al input.
      'jsx-a11y/autocomplete-valid': ['error', { inputComponents: ['FieldText'] }],
      // Un solo array: en flat config, otro bloque con esta regla sustituiría
      // al anterior en lugar de sumarse.
      //
      // jsx-a11y no lo detecta: un div/span sin role es `generic`, que prohíbe
      // el nombrado. El nombre se ignora (semantic-markup, reglas ARIA).
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "JSXOpeningElement[name.name=/^(div|span)$/]:not(:has(JSXAttribute[name.name='role'])) > JSXAttribute[name.name=/^aria-label(ledby)?$/]",
          message:
            'aria-label/aria-labelledby en un div o span sin role se ignora (rol generic). Usa un elemento con rol que admita nombre.',
        },
        // Objetos con modificadores obligatorios (05-objects): todo o-stack y
        // o-cluster lleva gap, también el 0, y o-cluster además alineación.
        // Un olvido y una decisión no deben verse iguales.
        ...objectModifierRules,
      ],
    },
  },
])
