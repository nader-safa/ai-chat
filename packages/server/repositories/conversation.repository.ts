// Implementation Details
const conversations = new Map<string, string>()

// Public Interface
export const conversationRepository = {
  get: (conversationId: string) => {
    return conversations.get(conversationId)
  },
  set: (conversationId: string, responseId: string) => {
    conversations.set(conversationId, responseId)
  },
}
