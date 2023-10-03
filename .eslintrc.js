module.exports = {
    env: {
        es2022: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:react-hooks/recommended'
    ],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 12,
        sourceType: 'module',
    },
    ignorePatterns: ['functions/node_modules/**', 'node_modules'],
    plugins: ['react', '@typescript-eslint', 'react-hooks', 'prettier', 'eslint-plugin-tsdoc'],
    rules: {
        'tsdoc/syntax': 0,
        indent: ['warn', 4, { SwitchCase: 1 }],
        'linebreak-style': ['error', 'unix'],
        quotes: ['warn', 'single'],
        semi: ['error', 'never'],
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'prefer-const': [
            'warn',
            {
                destructuring: 'any',
                ignoreReadBeforeAssign: false,
            },
        ],
        'no-async-promise-executor': 'warn',
        'no-restricted-syntax': [
            'error',
            {
                selector: 'TSEnumDeclaration',
                message: 'Don`t declare enums',
            },
        ],
        '@typescript-eslint/no-var-requires': 0,
        // 'complexity': ['warn', 20]
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
}
