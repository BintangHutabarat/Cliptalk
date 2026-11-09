import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['vendor', 'node_modules', 'public', 'bootstrap/ssr', 'docs', 'storage'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    reactHooks.configs.flat['recommended-latest'],
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        rules: { '@typescript-eslint/no-explicit-any': 'error' },
    },
);
