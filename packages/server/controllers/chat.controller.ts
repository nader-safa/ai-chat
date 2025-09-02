import { chatService } from '../services/chat.service'
import type { Request, Response } from 'express'
import z from 'zod'
import { conversationRepository } from '../repositories/conversation.repository'

// Implementation Details
const chatSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must be less than 1000 characters'),
  conversationId: z.uuid(),
})

// Public Interface
export const chatController = {
  sendMessage: async (req: Request, res: Response) => {
    const parseResult = chatSchema.safeParse(req.body)

    if (!parseResult.success) {
      return res.status(400).json(z.treeifyError(parseResult.error))
    }

    try {
      const { prompt, conversationId } = req.body

      const response = await chatService.sendMessage(prompt, conversationId)

      conversationRepository.set(conversationId, response.id)

      res.json({ message: response.message })
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate a response' })
    }
  },
}
