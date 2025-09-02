import { conversationRepository } from '../repositories/conversation.repository'
import { OpenAI } from 'openai/client.js'

// Implementation Details
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ChatResponse {
  id: string
  message: string
}

// Public Interface
export const chatService = {
  sendMessage: async (
    prompt: string,
    conversationId: string
  ): Promise<ChatResponse> => {
    const response = await openaiClient.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 50,
      previous_response_id: conversationRepository.get(conversationId),
    })

    conversationRepository.set(conversationId, response.id)

    return {
      id: response.id,
      message: response.output_text,
    }
  },
}
