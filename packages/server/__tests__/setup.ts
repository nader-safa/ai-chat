/**
 * Test setup file for configuring test environment
 */

// Mock environment variables for tests
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.PORT = '3001'

// Global test timeout
global.setTimeout = (fn: () => void, ms: number) => {
  return setTimeout(fn, ms)
}

export {}
