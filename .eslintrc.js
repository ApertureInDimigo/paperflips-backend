// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    // TypeScript ESLint recommended style 적용
    'plugin:@typescript-eslint/eslint-recommended',
  ],
  rules: {
    'linebreak-style': 0, 
    'import/extensions': 'off',
  },
};
