import { nextJsConfig } from '@repo/eslint-config/next-js';

const eslintConfig = [
  {
    ignores: ['.next/**', 'out/**', 'node_modules/**', 'public/**'],
  },
  ...nextJsConfig,
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
];

export default eslintConfig;
