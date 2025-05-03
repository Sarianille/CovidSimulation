import { defineConfig } from 'vite'
import 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
    clearScreen: false,
    server: {
        host: "127.0.0.1",
    },
    root: 'src',
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.test.js'],
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
        setupFiles: './tests/setupTests.js'
    }
})