import { test, expect, describe, beforeEach, mock, spyOn } from 'bun:test'
import request from 'supertest'
import express from 'express'
import { chatController } from '../../controllers/chat.controller'
import { chatService } from '../../services/chat.service'
import { conversationRepository } from '../../repositories/conversation.repository'

// Mock the chat service
const mockSendMessage = mock()
mock.module('../../services/chat.service', () => ({
  chatService: {
    sendMessage: mockSendMessage,
  },
}))

// Mock the conversation repository
const mockRepositorySet = mock()
mock.module('../../repositories/conversation.repository', () => ({
  conversationRepository: {
    set: mockRepositorySet,
    get: mock(),
  },
}))

describe('Chat Controller', () => {
  let app: express.Application

  beforeEach(() => {
    // Setup test app
    app = express()
    app.use(express.json())
    app.post('/chat', chatController.sendMessage)

    // Reset all mocks
    mockSendMessage.mockReset()
    mockRepositorySet.mockReset()
  })

  describe('POST /chat - Valid Requests', () => {
    test('should handle valid chat request successfully', async () => {
      const mockResponse = {
        id: 'response-123',
        message: 'Hello! How can I help you?',
      }

      mockSendMessage.mockResolvedValue(mockResponse)

      const validRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(validRequest)
        .expect(200)

      expect(response.body).toEqual({
        message: 'Hello! How can I help you?',
      })

      // Verify service was called correctly
      expect(mockSendMessage).toHaveBeenCalledWith(
        'Hello, ChatGPT!',
        '123e4567-e89b-12d3-a456-426614174000'
      )

      // Verify repository was updated
      expect(mockRepositorySet).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        'response-123'
      )
    })

    test('should handle prompts with various lengths', async () => {
      const testCases = [
        {
          prompt: 'Hi',
          description: 'minimal prompt',
        },
        {
          prompt: 'Tell me about artificial intelligence',
          description: 'medium prompt',
        },
        {
          prompt: 'A'.repeat(999), // Just under the 1000 char limit
          description: 'maximum length prompt',
        },
      ]

      for (const { prompt, description } of testCases) {
        const mockResponse = {
          id: `response-${description}`,
          message: `Response for ${description}`,
        }

        mockSendMessage.mockResolvedValue(mockResponse)

        const validRequest = {
          prompt,
          conversationId: '123e4567-e89b-12d3-a456-426614174000',
        }

        const response = await request(app)
          .post('/chat')
          .send(validRequest)
          .expect(200)

        expect(response.body.message).toBe(`Response for ${description}`)

        mockSendMessage.mockReset()
        mockRepositorySet.mockReset()
      }
    })

    test('should trim whitespace from prompts', async () => {
      const mockResponse = {
        id: 'response-trimmed',
        message: 'Trimmed response',
      }

      mockSendMessage.mockResolvedValue(mockResponse)

      const requestWithWhitespace = {
        prompt: '   Hello with spaces   ',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      await request(app).post('/chat').send(requestWithWhitespace).expect(200)

      // Service should receive trimmed prompt (Zod handles trimming)
      expect(mockSendMessage).toHaveBeenCalledWith(
        'Hello with spaces', // Zod trims the whitespace
        '123e4567-e89b-12d3-a456-426614174000'
      )
    })
  })

  describe('POST /chat - Validation Errors', () => {
    test('should return 400 for missing prompt', async () => {
      const invalidRequest = {
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
        // Missing prompt
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      // Zod error should be returned
      expect(response.body).toBeDefined()
      expect(response.status).toBe(400)
      // The exact structure may vary depending on zod version and treeifyError implementation
    })

    test('should return 400 for empty prompt', async () => {
      const invalidRequest = {
        prompt: '',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      expect(response.status).toBe(400)
      expect(response.body).toBeDefined()
    })

    test('should return 400 for prompt with only whitespace', async () => {
      const invalidRequest = {
        prompt: '   \t\n   ',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      expect(response.status).toBe(400)
      expect(response.body).toBeDefined()
    })

    test('should return 400 for prompt exceeding character limit', async () => {
      const invalidRequest = {
        prompt: 'A'.repeat(1001), // Exceeds 1000 char limit
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      expect(response.status).toBe(400)
      expect(response.body).toBeDefined()
    })

    test('should return 400 for missing conversationId', async () => {
      const invalidRequest = {
        prompt: 'Hello, ChatGPT!',
        // Missing conversationId
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      expect(response.status).toBe(400)
      expect(response.body).toBeDefined()
    })

    test('should return 400 for invalid UUID format', async () => {
      const invalidRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: 'not-a-uuid',
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      expect(response.status).toBe(400)
      expect(response.body).toBeDefined()
    })

    test('should return 400 for multiple validation errors', async () => {
      const invalidRequest = {
        prompt: '', // Empty prompt
        conversationId: 'invalid-uuid', // Invalid UUID
      }

      const response = await request(app)
        .post('/chat')
        .send(invalidRequest)
        .expect(400)

      // Should return validation errors
      expect(response.status).toBe(400)
      expect(response.body).toBeDefined()
    })

    test('should return 400 for non-JSON request body', async () => {
      await request(app)
        .post('/chat')
        .send('invalid json string')
        .set('Content-Type', 'application/json')
        .expect(400)
    })
  })

  describe('POST /chat - Service Errors', () => {
    test('should return 500 when chat service throws error', async () => {
      mockSendMessage.mockRejectedValue(new Error('OpenAI API Error'))

      const validRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(validRequest)
        .expect(500)

      expect(response.body).toEqual({
        error: 'Failed to generate a response',
      })

      // Repository should not be called when service fails
      expect(mockRepositorySet).not.toHaveBeenCalled()
    })

    test('should return 500 for network timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockSendMessage.mockRejectedValue(timeoutError)

      const validRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(validRequest)
        .expect(500)

      expect(response.body).toEqual({
        error: 'Failed to generate a response',
      })
    })

    test('should return 500 for unexpected service errors', async () => {
      mockSendMessage.mockRejectedValue('Unexpected string error')

      const validRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      const response = await request(app)
        .post('/chat')
        .send(validRequest)
        .expect(500)

      expect(response.body).toEqual({
        error: 'Failed to generate a response',
      })
    })
  })

  describe('HTTP Method Validation', () => {
    test('should return 404 for GET requests', async () => {
      await request(app).get('/chat').expect(404)
    })

    test('should return 404 for PUT requests', async () => {
      await request(app).put('/chat').expect(404)
    })

    test('should return 404 for DELETE requests', async () => {
      await request(app).delete('/chat').expect(404)
    })
  })

  describe('Content-Type Validation', () => {
    test('should require JSON content type', async () => {
      const validRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      await request(app)
        .post('/chat')
        .send('prompt=Test&conversationId=123')
        .set('Content-Type', 'text/plain')
        .expect(400)
    })

    test('should accept application/json content type', async () => {
      const mockResponse = {
        id: 'response-123',
        message: 'Hello! How can I help you?',
      }

      mockSendMessage.mockResolvedValue(mockResponse)

      const validRequest = {
        prompt: 'Hello, ChatGPT!',
        conversationId: '123e4567-e89b-12d3-a456-426614174000',
      }

      await request(app)
        .post('/chat')
        .send(validRequest)
        .set('Content-Type', 'application/json')
        .expect(200)
    })
  })
})
