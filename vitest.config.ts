import { defineConfig } from 'vitest/config'

const lfs = process.env.VITEST_LFS === '1'

export default defineConfig({
    test: {
        include: lfs
            ? ['**/src/**/*.lfs.test.{ts,mjs}', '**/test/**/*.lfs.test.{ts,mjs}']
            : ['**/src/**/*.test.{ts,mjs}', '**/test/**/*.test.{ts,mjs}'],
        exclude: [
            '**/node_modules/**',
            '**/lib/**',
            '**/dist/**',
            ...(lfs ? [] : ['**/*.lfs.test.*']),
        ],
        passWithNoTests: true,
    },
})
