import globals from "globals";
import js from "@eslint/js";
import ts from "typescript-eslint";
import imprt from 'eslint-plugin-import';
import jsx from '@stylistic/eslint-plugin-jsx';

/**
 * @type {import('typescript-eslint').Config}
 */
export default (_files, ignores, files = _files.map(f => f + '/*.{js,mjs,cjs,ts}?(x)')) => [
  ...ts.configs.recommended.map(c => ({
    ...c,
    files,
    ignores
  })),
  {
    files,
    ignores,
    languageOptions: {
      globals: globals.browser,
      parser: ts.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true
        }
      },
    },
    plugins: {
      '@typescript-eslint': ts.plugin,
      import: imprt,
      ts,
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import/resolver": {
        "typescript": {
          "alwaysTryTypes": true,

          "project": [
            "packages/*/tsconfig.json",
            "apps/*/tsconfig.json"
          ]
        }
      }
    },
    rules: {
      semi: 'error',
      quotes: [
        'error',
        'single',
        {
          allowTemplateLiterals: true,
        },
      ],
      'jsx-quotes': ['warn', 'prefer-double'],
      'no-multiple-empty-lines': 'error',
      'import/no-useless-path-segments': [
        'error',
        {
          noUselessIndex: true,
        },
      ],
      'import/consistent-type-specifier-style': [
        'warn',
        'prefer-top-level',
      ],
      'sort-imports': [
        'warn',
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

      'comma-dangle': [
        'warn',
        'always-multiline',
      ],
      'object-curly-spacing': [
        'warn',
        'always',
      ],
      'array-bracket-spacing': [
        'warn',
        'never',
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: false,
        },
      ],
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-empty-object-type': 'warn',
      // Should only be allowed in `extends` clauses, but alas - not configurable
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-empty-object-type': ['warn', {
        allowInterfaces: 'with-single-extends',
      }],
    }
  }
];

export { jsx, ts, js };