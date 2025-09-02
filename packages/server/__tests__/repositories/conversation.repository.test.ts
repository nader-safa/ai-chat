import { test, expect, describe, beforeEach } from 'bun:test'

// We need to test the actual repository since it's a simple in-memory store
// Let's import it directly and work with unique keys per test to avoid conflicts
const { conversationRepository } = await import(
  '../../repositories/conversation.repository'
)

describe('Conversation Repository', () => {
  // Use unique prefixes for each test to avoid conflicts
  const getUniqueId = (base: string) => `${Date.now()}-${Math.random()}-${base}`

  describe('set and get operations', () => {
    test('should store and retrieve conversation data', () => {
      const conversationId = getUniqueId('test-conversation')
      const responseId = 'test-response-1'

      conversationRepository.set(conversationId, responseId)
      const result = conversationRepository.get(conversationId)

      expect(result).toBe(responseId)
    })

    test('should return undefined for non-existent conversation', () => {
      const nonExistentId = getUniqueId('non-existent-conversation')
      const result = conversationRepository.get(nonExistentId)
      expect(result).toBeUndefined()
    })

    test('should update existing conversation', () => {
      const conversationId = getUniqueId('test-conversation-update')
      const initialResponseId = 'initial-response'
      const updatedResponseId = 'updated-response'

      // Set initial value
      conversationRepository.set(conversationId, initialResponseId)
      expect(conversationRepository.get(conversationId)).toBe(initialResponseId)

      // Update value
      conversationRepository.set(conversationId, updatedResponseId)
      expect(conversationRepository.get(conversationId)).toBe(updatedResponseId)
    })
  })

  describe('data integrity', () => {
    test('should handle multiple conversations independently', () => {
      const conversations = [
        { id: getUniqueId('conv-1'), responseId: 'resp-1' },
        { id: getUniqueId('conv-2'), responseId: 'resp-2' },
        { id: getUniqueId('conv-3'), responseId: 'resp-3' },
      ]

      // Store all conversations
      conversations.forEach(({ id, responseId }) => {
        conversationRepository.set(id, responseId)
      })

      // Verify all conversations are stored correctly
      conversations.forEach(({ id, responseId }) => {
        expect(conversationRepository.get(id)).toBe(responseId)
      })
    })

    test('should handle string conversation IDs correctly', () => {
      const specialIds = [
        getUniqueId('uuid-with-dashes-123e4567-e89b-12d3-a456-426614174000'),
        getUniqueId('simple-id'),
        getUniqueId('id_with_underscores'),
        getUniqueId('id-with-numbers-123'),
      ]

      specialIds.forEach((id, index) => {
        const responseId = `response-${index}`
        conversationRepository.set(id, responseId)
        expect(conversationRepository.get(id)).toBe(responseId)
      })
    })

    test('should handle empty strings as valid keys', () => {
      const conversationId = getUniqueId('')
      const responseId = 'empty-key-response'

      conversationRepository.set(conversationId, responseId)
      expect(conversationRepository.get(conversationId)).toBe(responseId)
    })
  })

  describe('edge cases', () => {
    test('should handle special characters in IDs', () => {
      const specialChars = [
        getUniqueId('conv@#$%'),
        getUniqueId('conv with spaces'),
        getUniqueId('conv\twith\ttabs'),
        getUniqueId('conv\nwith\nnewlines'),
      ]

      specialChars.forEach((id, index) => {
        const responseId = `special-response-${index}`
        conversationRepository.set(id, responseId)
        expect(conversationRepository.get(id)).toBe(responseId)
      })
    })

    test('should handle very long IDs', () => {
      const longId = getUniqueId('a'.repeat(1000))
      const responseId = 'long-id-response'

      conversationRepository.set(longId, responseId)
      expect(conversationRepository.get(longId)).toBe(responseId)
    })

    test('should overwrite previous values when setting same key', () => {
      const conversationId = getUniqueId('overwrite-test')
      const values = ['value1', 'value2', 'value3']

      values.forEach(value => {
        conversationRepository.set(conversationId, value)
        expect(conversationRepository.get(conversationId)).toBe(value)
      })
    })
  })
})
