import js from '@eslint/js'
import globals from 'globals'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
      ],
    },
  },
])
