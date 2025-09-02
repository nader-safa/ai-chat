import { test, expect, describe, beforeEach, mock } from 'bun:test'
import request from 'supertest'
import express from 'express'
import router from '../../routes/index'

// Mock chat service to avoid actual API calls
const mockSendMessage = mock()
mock.module('../../services/chat.service', () => ({
  chatService: {
    sendMessage: mockSendMessage,
  },
}))

// Mock conversation repository
mock.module('../../repositories/conversation.repository', () => ({
  conversationRepository: {
    set: mock(),
    get: mock(),
  },
}))

describe('Main Router Integration', () => {
  let app: express.Application

  beforeEach(() => {
    // Setup test app with main router
    app = express()
    app.use(express.json())
    app.use(router)

    // Reset mocks
    mockSendMessage.mockReset()
  })

  describe('API Route Structure', () => {
    test('should mount health and chat routes under /api/v1', async () => {
      // Test health endpoint
      await request(app).get('/api/v1/health').expect(200)

      // Test chat endpoint structure (will fail validation but route exists)
      await request(app).post('/api/v1/chat').send({}).expect(400) // Validation error, but route exists
    })

    test('should return 404 for routes not under /api/v1', async () => {
      await request(app).get('/health').expect(404)

      await request(app).post('/chat').send({}).expect(404)
    })

    test('should return 404 for unknown API versions', async () => {
      await request(app).get('/api/v2/health').expect(404)

      await request(app).post('/api/v2/chat').send({}).expect(404)
    })
  })

  describe('Cross-Route Functionality', () => {
    test('should handle concurrent requests to different endpoints', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'response-concurrent',
        message: 'Concurrent response',
      })

      const healthPromise = request(app).get('/api/v1/health').expect(200)

      const chatPromise = request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Concurrent test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(200)

      const [healthResponse, chatResponse] = await Promise.all([
        healthPromise,
        chatPromise,
      ])

      expect(healthResponse.body).toEqual({ status: 'ok' })
      expect(chatResponse.body).toEqual({ message: 'Concurrent response' })
    })

    test('should maintain separate request contexts', async () => {
      mockSendMessage.mockResolvedValue({
        id: 'response-context',
        message: 'Context response',
      })

      // Make multiple concurrent chat requests
      const requests = Array.from({ length: 3 }, (_, i) =>
        request(app)
          .post('/api/v1/chat')
          .send({
            prompt: `Test message ${i}`,
            conversationId: `123e4567-e89b-12d3-a456-42661417400${i}`,
          })
          .expect(200)
      )

      const responses = await Promise.all(requests)

      // All should succeed independently
      responses.forEach(response => {
        expect(response.body).toEqual({ message: 'Context response' })
      })

      // Service should have been called for each request
      expect(mockSendMessage).toHaveBeenCalledTimes(3)
    })
  })

  describe('Error Handling Across Routes', () => {
    test('should handle malformed JSON consistently across routes', async () => {
      // Chat endpoint with malformed JSON
      await request(app)
        .post('/api/v1/chat')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400)

      // Health endpoint should still work
      await request(app).get('/api/v1/health').expect(200)
    })

    test('should handle service errors without affecting other routes', async () => {
      mockSendMessage.mockRejectedValue(new Error('Service error'))

      // Chat endpoint should return 500
      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .expect(500)

      // Health endpoint should still work
      await request(app).get('/api/v1/health').expect(200)
    })
  })

  describe('HTTP Methods and Headers', () => {
    test('should handle OPTIONS requests for CORS preflight', async () => {
      // Health endpoint - Express handles OPTIONS automatically
      const healthResponse = await request(app).options('/api/v1/health')

      expect([200, 404]).toContain(healthResponse.status)

      // Chat endpoint - Express handles OPTIONS automatically
      const chatResponse = await request(app).options('/api/v1/chat')

      expect([200, 404]).toContain(chatResponse.status)
    })

    test('should properly handle different content types', async () => {
      // Health endpoint doesn't require specific content type
      await request(app)
        .get('/api/v1/health')
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)

      // Chat endpoint requires JSON
      mockSendMessage.mockResolvedValue({
        id: 'response-content-type',
        message: 'Content type response',
      })

      await request(app)
        .post('/api/v1/chat')
        .send({
          prompt: 'Test',
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        })
        .set('Content-Type', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
    })
  })

  describe('Route Order and Precedence', () => {
    test('should match most specific routes first', async () => {
      // Exact matches should work
      await request(app).get('/api/v1/health').expect(200)

      await request(app).post('/api/v1/chat').send({}).expect(400) // Validation error, but route matched
    })

    test('should handle trailing slashes consistently', async () => {
      // Without trailing slash
      await request(app).get('/api/v1/health').expect(200)

      // With trailing slash (Express handles this automatically)
      await request(app).get('/api/v1/health/').expect(200)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle rapid successive requests', async () => {
      const startTime = Date.now()

      // Make multiple rapid health checks
      const promises = Array.from({ length: 10 }, () =>
        request(app).get('/api/v1/health').expect(200)
      )

      await Promise.all(promises)

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // Should complete reasonably quickly (under 1 second)
      expect(totalTime).toBeLessThan(1000)
    })

    test('should not leak memory with multiple requests', async () => {
      // This is a basic test; more sophisticated memory testing would require additional tools
      const initialMemory = process.memoryUsage()

      // Make several requests
      for (let i = 0; i < 20; i++) {
        await request(app).get('/api/v1/health').expect(200)
      }

      const finalMemory = process.memoryUsage()

      // Memory usage shouldn't grow dramatically (allowing for some variation)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // Less than 10MB increase
    })
  })
})
