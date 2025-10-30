module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  overrides: [
    {
      files: ['test/**/*.js'],
      env: {
        jest: true,
      },
    },
  ],
  rules: {
    // Custom rules
  },
};