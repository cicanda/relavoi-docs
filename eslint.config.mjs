import globals from 'globals';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * This is Docusaurus, not Next, so eslint-config-next does not belong here:
 * its value is the @next/next plugin, and every rule in it is about an app
 * router that this repo does not have. The equivalent coverage for a React and
 * TypeScript site is typescript-eslint plus the React and hooks plugins, which
 * is what eslint-config-next is mostly made of anyway.
 *
 * Errors fail the build, warnings do not. Plain `eslint` with no
 * --max-warnings.
 */
export default [
  {
    ignores: ['build/**', '.docusaurus/**', 'node_modules/**', 'static/**'],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', '*.ts'],
    ...react.configs.flat.recommended,
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions,
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.flat.recommended.rules,
      // Docusaurus provides the JSX runtime, so no React import is needed.
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    // check-em-dashes.js is a CommonJS Node script, run by CI and by hand.
    // require is correct there.
    files: ['*.js'],
    languageOptions: { globals: { ...globals.node } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
];
