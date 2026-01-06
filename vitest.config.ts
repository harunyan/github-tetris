import { defineConfig } from 'vitest/config'

// Define V8 coverage shape locally (keeps type-safety without importing internal types)
type MyV8Coverage = {
  provider: 'v8'
  reporter?: string[]
  include?: string[]
  exclude?: string[]
  all?: boolean
  [key: string]: unknown
}

const coverage: MyV8Coverage = {
  provider: 'v8',
  reporter: ['text', 'lcov'],
  all: true,
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['src/**/*.test.*']
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    coverage
  }
})