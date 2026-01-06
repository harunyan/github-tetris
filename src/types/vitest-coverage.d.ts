import 'vitest'

declare module 'vitest' {
  // Add `all` option to V8 coverage options (Vitest accepts it even if type defs may omit it)
  interface CoverageV8Options {
    all?: boolean
  }
}
