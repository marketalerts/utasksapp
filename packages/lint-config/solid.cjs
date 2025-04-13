const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  parser: "@typescript-eslint/parser",
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx']
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project,
      },
    },
  },
  plugins: [
    '@typescript-eslint',
    'import',
  ],
  rules: {
    semi: 'error',
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],
    'no-multiple-empty-lines': 'error',
    'import/no-useless-path-segments': [
      'error',
      {
        noUselessIndex: true,
      },
    ],
    'import/consistent-type-specifier-style': [
      'error',
      'prefer-top-level',
    ],
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true,
        ignoreMemberSort: true,
        memberSyntaxSortOrder: [
          'none',
          'all',
          'multiple',
          'single',
        ],
        allowSeparatedGroups: true,
      },
    ],
    'import/order': [
      'warn',
      {
        distinctGroup: true,
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'unknown',
        ],
        pathGroups: [
          {
            pattern: '{shared/**/ui/*,shared/**/ui/**/*,shared/**/*.ui,ui/**}',
            group: 'object',
            position: 'before',
          },
          {
            pattern: 'shared/**',
            group: 'internal',
          },
          {
            pattern: '{locales/**,./locales,f/**/locales}',
            group: 'sibling',
            position: 'after',
          },
          {
            pattern: 'f/**/*.ui',
            group: 'object',
            position: 'before',
          },
          {
            pattern: 'f/**',
            group: 'parent',
            position: 'before',
          },
          {
            pattern: './ui/*',
            group: 'object',
          },
          {
            pattern: './**/*.ui',
            group: 'object',
          },
          {
            pattern: './*.ui',
            group: 'object',
          },
          {
            pattern: '?(icons|i)/**/**.{sv,pn,jp?(e)}g',
            group: 'unknown',
          },
        ],
        pathGroupsExcludedImportTypes: [],
        alphabetize: {
          order: 'desc',
          orderImportKind: 'desc',
        },
        'newlines-between': 'always',
      },
    ],
    'comma-dangle': [
      'error',
      'always-multiline',
    ],
    'object-curly-spacing': [
      'error',
      'always',
    ],
    'array-bracket-spacing': [
      'error',
      'never',
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
        disallowTypeAnnotations: false,
      },
    ],
    '@typescript-eslint/ban-types': 'off',
  },
};
