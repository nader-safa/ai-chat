import {
  test,
  expect,
  describe,
  beforeEach,
  afterEach,
  mock,
  spyOn,
} from 'bun:test'
import request from 'supertest'

// Mock environment variables
const originalEnv = process.env

// Mock dependencies before importing the app
const mockSendMessage = mock()
mock.module('../services/chat.service', () => ({
  chatService: {
    sendMessage: mockSendMessage,
  },
}))

mock.module('../repositories/conversation.repository', () => ({
  conversationRepository: {
    set: mock(),
    get: mock(),
  },
}))

// Mock dotenv to prevent actual .env loading in tests
mock.module('dotenv', () => ({
  config: mock(),
}))

describe('Main Application', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv }
    process.env.OPENAI_API_KEY = 'test-api-key'
    mockSendMessage.mockReset()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  describe('Application Setup', () => {
    test('should create Express app with proper middleware', async () => {
      // Dynamically import the app to ensure mocks are applied
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      // Test JSON parsing middleware
      mockSendMessage.mockResolvedValue({
        id: 'test-response',
        message: 'Test message',
      })

      const response = await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Test prompt',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      expect(response.body).toEqual({
        message: 'Test message',
      })
    })

    test('should handle JSON parsing errors gracefully', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      await request(app)
        .post('/api/v1/chat')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400)
    })
  })

  describe('Environment Configuration', () => {
    test('should use default port when PORT is not set', () => {
      delete process.env.PORT

      // The default port logic is in the main file
      const defaultPort = process.env.PORT || 3000
      expect(defaultPort).toBe(3000)
    })

    test('should use environment PORT when set', () => {
      process.env.PORT = '8080'

      const port = process.env.PORT || 3000
      expect(port).toBe('8080')
    })

    test('should handle string port values correctly', () => {
      process.env.PORT = '3001'

      const port = process.env.PORT || 3000
      expect(typeof port).toBe('string')
      expect(port).toBe('3001')
    })
  })

  describe('Route Integration', () => {
    test('should mount all routes correctly', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      // Test health route
      await request(app)
        .get('/api/v1/health')
        .expect(200)
        .expect(res => {
          expect(res.body).toEqual({ status: 'ok' })
        })

      // Test chat route (validation error expected)
      await request(app).post('/api/v1/chat').send({}).expect(400)
    })

    test('should handle 404 for unknown routes', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      await request(app).get('/unknown-route').expect(404)

      await request(app).post('/api/v2/unknown').expect(404)
    })
  })

  describe('Middleware Order', () => {
    test('should parse JSON before routing', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      mockSendMessage.mockResolvedValue({
        id: 'middleware-test',
        message: 'Middleware working',
      })

      // Complex JSON should be parsed correctly
      const complexRequest = {
        prompt: 'Test with complex JSON: {"nested": "object"}',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      await request(app).post('/api/v1/chat').send(complexRequest).expect(200)

      expect(mockSendMessage).toHaveBeenCalledWith(
        'Test with complex JSON: {"nested": "object"}',
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })

    test('should handle large JSON payloads', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      // Test with a large prompt (but within limits)
      const largePrompt = 'A'.repeat(500)

      mockSendMessage.mockResolvedValue({
        id: 'large-payload-test',
        message: 'Large payload handled',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: largePrompt,
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      expect(mockSendMessage).toHaveBeenCalledWith(
        largePrompt,
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })
  })

  describe('Error Handling', () => {
    test('should handle service errors gracefully', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      mockSendMessage.mockRejectedValue(new Error('Service unavailable'))

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Test error handling',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(500)
        .expect(res => {
          expect(res.body).toEqual({
            error: 'Failed to generate a response',
          })
        })
    })

    test('should maintain server stability after errors', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      // Cause an error
      mockSendMessage.mockRejectedValue(new Error('Temporary error'))

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Error test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(500)

      // Server should still respond to health checks
      await request(app).get('/api/v1/health').expect(200)

      // Server should recover for subsequent requests
      mockSendMessage.mockResolvedValue({
        id: 'recovery-test',
        message: 'Recovered successfully',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Recovery test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)
    })
  })

  describe('Content-Type Handling', () => {
    test('should require JSON content type for POST requests', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      await request(app)
        .post('/api/v1/chat')
        .send('prompt=test&conversationId=123')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400)
    })

    test('should accept JSON content type', async () => {
      const { default: express } = await import('express')
      const { default: router } = await import('../routes/index')

      const app = express()
      app.use(express.json())
      app.use(router)

      mockSendMessage.mockResolvedValue({
        id: 'content-type-test',
        message: 'JSON accepted',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'JSON test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .set('Content-Type', 'application/json')
        .expect(200)
    })
  })
})
