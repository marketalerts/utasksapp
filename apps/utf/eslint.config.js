import BaseConfig from 'lint-config-utf';

const files = ['**/src/**'];
const ignores = ['**/schema.ts', '**/*.config.ts', "**/.output/**", "**/.vinxi/**"];

const longParentPath = "{.,"
  + Array.from({ length: 10 }, (_, i) => "../".repeat(i + 1).slice(0, -1)).join(",")
  + "}";

/**
 * @type {import('typescript-eslint').Config}
 */
export default [
  ...BaseConfig(files, ignores),
  {
    files,
    ignores,
    rules: {
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
              pattern: '{f/**/*.ui,#/**/ui/**,#/**/ui,ui/**}',
              group: 'object',
              position: 'before',
            },
            {
              pattern: '{f/**,#/**}',
              group: 'parent',
              position: 'before',
            },
            {
              pattern: './ui/*',
              group: 'object',
            },
            {
              pattern: `${longParentPath}/{ui/elements,elements}/*`,
              group: 'object',
            },
            {
              pattern: `${longParentPath}/ui`,
              group: 'object',
            },
            {
              pattern: `**/ui`,
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
    }
  },
];