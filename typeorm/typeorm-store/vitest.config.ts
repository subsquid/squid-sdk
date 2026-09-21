import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['lib/test/**/*.test.js'],
        exclude: ['**/node_modules/**'],
        setupFiles: ['dotenv/config'],
        globals: true,
        fileParallelism: false,
        testTimeout: 30_000,
    },
})
