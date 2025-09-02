import { test, expect, describe, beforeEach, mock } from 'bun:test'
import request from 'supertest'
import express from 'express'
import chatRouter from '../../../routes/v1/chat.router'

// Mock the entire chat service and repository chain to avoid complexity
const mockSendMessage = mock()
const mockRepositorySet = mock()

mock.module('../../../services/chat.service', () => ({
  chatService: {
    sendMessage: mockSendMessage,
  },
}))

mock.module('../../../repositories/conversation.repository', () => ({
  conversationRepository: {
    set: mockRepositorySet,
    get: mock(),
  },
}))

// Import the actual controller after mocking its dependencies
const { chatController } = await import('../../../controllers/chat.controller')

describe('Chat Router', () => {
  let app: express.Application

  beforeEach(() => {
    // Setup test app
    app = express()
    app.use(express.json())
    app.use('/api/v1', chatRouter)

    // Reset mocks
    mockSendMessage.mockReset()
    mockRepositorySet.mockReset()
  })

  describe('POST /api/v1/chat', () => {
    test('should route to chat controller successfully', async () => {
      // Mock successful response
      mockSendMessage.mockResolvedValue({
        id: 'response-123',
        message: 'Chat response from service',
      })

      const chatRequest = {
        prompt: 'Hello, world!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/api/v1/chat')
        .send(chatRequest)
        .expect(200)

      expect(response.body).toEqual({
        message: 'Chat response from service',
      })

      // Verify service was called
      expect(mockSendMessage).toHaveBeenCalledTimes(1)
    })

    test('should handle valid requests through the full stack', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'response-456',
        message: 'Stack test response',
      })

      const response = await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Test request',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      expect(response.body).toEqual({
        message: 'Stack test response',
      })

      expect(mockSendMessage).toHaveBeenCalledWith(
        'Test request',
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })

    test('should handle service errors', async () => {
      mockSendMessage.mockRejectedValue(new Error('Service error'))

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Error test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(500)
    })

    test('should handle requests with custom headers', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'response-headers',
        message: 'Headers handled',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Header test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .set('User-Agent', 'Test-Agent')
        .set('X-Custom-Header', 'custom-value')
        .expect(200)

      expect(mockSendMessage).toHaveBeenCalled()
    })
  })

  describe('Route Method Restrictions', () => {
    test('should only accept POST requests', async () => {
      // GET should return 404
      await request(app).get('/api/v1/chat').expect(404)

      // PUT should return 404
      await request(app).put('/api/v1/chat').send({}).expect(404)

      // DELETE should return 404
      await request(app).delete('/api/v1/chat').expect(404)

      // PATCH should return 404
      await request(app).patch('/api/v1/chat').send({}).expect(404)
    })

    test('should handle OPTIONS requests for CORS', async () => {
      // OPTIONS might be used for CORS preflight
      // Since we don't have CORS middleware, Express will respond with 200 and Allow header
      const response = await request(app).options('/api/v1/chat')

      // Express automatically handles OPTIONS with a 200 status and Allow header
      expect([200, 404]).toContain(response.status)
    })
  })

  describe('Route Path Matching', () => {
    test('should match exact path /chat', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'path-test',
        message: 'Path matched',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Exact path test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      expect(mockSendMessage).toHaveBeenCalled()
    })

    test('should not match similar paths', async () => {
      // These should not match the /chat route
      await request(app).post('/api/v1/chats').send({}).expect(404)

      await request(app).post('/api/v1/chat/extra').send({}).expect(404)

      await request(app).post('/api/v1/chatroom').send({}).expect(404)
    })

    test('should handle trailing slashes correctly', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'slash-test',
        message: 'Slash handled',
      })

      // Without trailing slash
      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'No slash test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      // With trailing slash (Express typically handles this)
      await request(app)
        .post('/api/v1/chat/')
        .send({
          prompt: 'With slash test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      expect(mockSendMessage).toHaveBeenCalledTimes(2)
    })
  })

  describe('Router Configuration', () => {
    test('should be an Express Router instance', () => {
      expect(chatRouter).toBeDefined()
      expect(typeof chatRouter).toBe('function')
      // Express routers are functions with additional properties
      expect(chatRouter.stack).toBeDefined()
    })

    test('should have exactly one route configured', () => {
      // The router should have one layer for the POST /chat route
      expect(chatRouter.stack).toHaveLength(1)
      expect(chatRouter.stack[0].route.path).toBe('/chat')
      expect(chatRouter.stack[0].route.methods.post).toBe(true)
    })

    test('should export as default', async () => {
      const { default: importedRouter } = await import(
        '../../../routes/v1/chat.router'
      )
      expect(importedRouter).toBe(chatRouter)
    })
  })

  describe('Integration with Express Middleware', () => {
    test('should work with body parsing middleware', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'middleware-test',
        message: 'Middleware working',
      })

      const requestBody = {
        prompt: 'Middleware test',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      await request(app).post('/api/v1/chat').send(requestBody).expect(200)

      expect(mockSendMessage).toHaveBeenCalledWith(
        'Middleware test',
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })

    test('should work with JSON parsing', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'json-test',
        message: 'JSON parsed',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'JSON test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .set('Content-Type', 'application/json')
        .expect(200)

      expect(mockSendMessage).toHaveBeenCalled()
    })
  })

  describe('Error Propagation', () => {
    test('should handle service errors gracefully', async () => {
      mockSendMessage.mockRejectedValue(new Error('Service threw error'))

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Error propagation test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(500)
    })

    test('should handle async service errors', async () => {
      mockSendMessage.mockRejectedValue(new Error('Async service error'))

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Async error test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(500)
    })
  })
})
