import { test, expect, describe, beforeEach, mock, spyOn } from 'bun:test'

// Mock OpenAI first before importing anything else
const mockCreate = mock()

// Mock the OpenAI module
mock.module('openai/client.js', () => ({
  OpenAI: class {
    constructor() {
      this.responses = {
        create: mockCreate,
      }
    }
  },
}))

// Mock conversation repository to avoid cross-test interference
const mockRepositoryGet = mock()
const mockRepositorySet = mock()

mock.module('../../repositories/conversation.repository', () => ({
  conversationRepository: {
    get: mockRepositoryGet,
    set: mockRepositorySet,
  },
}))

// Now import the service after mocking its dependencies
const { chatService } = await import('../../services/chat.service')

describe('Chat Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockCreate.mockReset()
    mockRepositoryGet.mockReset()
    mockRepositorySet.mockReset()
  })

  describe('sendMessage', () => {
    test('should send message and return response successfully', async () => {
      const mockResponse = {
        id: 'response-123',
        output_text: 'Hello! How can I help you today?',
      }

      mockCreate.mockResolvedValue(mockResponse)

      const prompt = 'Hello, ChatGPT!'
      const conversationId = 'conv-123'

      const result = await chatService.sendMessage(prompt, conversationId)

      expect(result).toEqual({
        id: 'response-123',
        message: 'Hello! How can I help you today?',
      })

      // Verify OpenAI was called with correct parameters
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        input: prompt,
        temperature: 0.2,
        max_output_tokens: 50,
        previous_response_id: undefined, // First message in conversation
      })
    })

    test('should include previous response ID for continuing conversations', async () => {
      const conversationId = 'existing-conv-123'
      const previousResponseId = 'previous-response-456'

      // Set up existing conversation mock
      mockRepositoryGet.mockReturnValue(previousResponseId)

      const mockResponse = {
        id: 'new-response-789',
        output_text: 'This is a follow-up response.',
      }

      mockCreate.mockResolvedValue(mockResponse)

      const prompt = 'Continue our conversation'

      await chatService.sendMessage(prompt, conversationId)

      // Verify OpenAI was called with previous response ID
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        input: prompt,
        temperature: 0.2,
        max_output_tokens: 50,
        previous_response_id: previousResponseId,
      })
    })

    test('should update conversation repository with new response ID', async () => {
      const mockResponse = {
        id: 'new-response-999',
        output_text: 'Response text',
      }

      mockCreate.mockResolvedValue(mockResponse)

      const conversationId = 'conv-for-update'
      const prompt = 'Test prompt'

      await chatService.sendMessage(prompt, conversationId)

      // Verify repository was updated with new response ID
      expect(mockRepositorySet).toHaveBeenCalledWith(
        conversationId,
        'new-response-999'
      )
    })

    test('should handle different prompt lengths', async () => {
      const testCases = [
        { prompt: 'Hi', description: 'short prompt' },
        {
          prompt:
            'Tell me about artificial intelligence and its applications in modern society',
          description: 'medium prompt',
        },
        { prompt: 'A'.repeat(500), description: 'long prompt' },
      ]

      for (const { prompt, description } of testCases) {
        const mockResponse = {
          id: `response-${description}`,
          output_text: `Response for ${description}`,
        }

        mockCreate.mockResolvedValue(mockResponse)

        const result = await chatService.sendMessage(prompt, 'test-conv')

        expect(result.message).toBe(`Response for ${description}`)
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            input: prompt,
          })
        )

        mockCreate.mockReset()
      }
    })
  })

  describe('error handling', () => {
    test('should throw error when OpenAI API fails', async () => {
      const error = new Error('OpenAI API Error')
      mockCreate.mockRejectedValue(error)

      const prompt = 'Test prompt'
      const conversationId = 'test-conv'

      await expect(
        chatService.sendMessage(prompt, conversationId)
      ).rejects.toThrow('OpenAI API Error')
    })

    test('should handle invalid response gracefully', async () => {
      // Mock invalid response (missing required fields)
      mockCreate.mockResolvedValue({
        id: 'response-123',
        // Missing output_text
      })

      const prompt = 'Test prompt'
      const conversationId = 'test-conv'

      const result = await chatService.sendMessage(prompt, conversationId)

      // Service should still return a response, but with undefined message
      expect(result.id).toBe('response-123')
      expect(result.message).toBeUndefined()
    })

    test('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.name = 'TimeoutError'
      mockCreate.mockRejectedValue(timeoutError)

      const prompt = 'Test prompt'
      const conversationId = 'test-conv'

      await expect(
        chatService.sendMessage(prompt, conversationId)
      ).rejects.toThrow('Request timeout')
    })
  })

  describe('configuration validation', () => {
    test('should use correct model configuration', async () => {
      const mockResponse = {
        id: 'response-123',
        output_text: 'Test response',
      }

      mockCreate.mockResolvedValue(mockResponse)

      await chatService.sendMessage('test', 'conv-123')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          temperature: 0.2,
          max_output_tokens: 50,
        })
      )
    })

    test('should handle special characters in prompts', async () => {
      const specialPrompts = [
        'Hello! @#$%^&*()',
        'Multi\nline\nprompt',
        'Prompt with "quotes" and \'apostrophes\'',
        '🚀 Emoji prompt 🎉',
      ]

      for (const prompt of specialPrompts) {
        const mockResponse = {
          id: 'response-special',
          output_text: 'Special response',
        }

        mockCreate.mockResolvedValue(mockResponse)

        const result = await chatService.sendMessage(prompt, 'special-conv')

        expect(result.message).toBe('Special response')
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            input: prompt,
          })
        )

        mockCreate.mockReset()
      }
    })
  })
})
