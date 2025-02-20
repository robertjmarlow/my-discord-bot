import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        console: "readonly",
        process: "readonly"
      }
    },
    rules: {
      "indent": ["error", 2]
    },
  },
];
