require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: ['@rushstack/eslint-config/profile/node'],
  parserOptions: { tsconfigRootDir: __dirname },
  rules: {
    'guard-for-in': ['off'],
    'no-explicit-any': ['off'],
    '@typescript-eslint/explicit-member-accessibility': ['off'],
    '@typescript-eslint/typedef': ['off'],
    '@typescript-eslint/naming-convention': ['off'],
    '@typescript-eslint/explicit-function-return-type': ['off'],

    'keyword-spacing': ['error'],
    'arrow-spacing': ['error'],
    'comma-spacing': ['error'],
    'indent': ['error', 2],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],
    'object-curly-spacing': ['error', 'always'],
    'no-trailing-spaces': ['error'],
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 0 }],
  }
};
