import express from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'
import z from 'zod'
import { chatService } from './services/chat.service'
import { conversationRepository } from './repositories/conversation.repository'

dotenv.config()

const app = express()

app.use(express.json())

const port = process.env.PORT || 3000

app.get('/', (req: Request, res: Response) => {
  res.send(`Hello World!!`)
})

app.get('/api/v1/hello', (req: Request, res: Response) => {
  res.json({ message: 'Hello World!!' })
})

const chatSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, 'Prompt is required')
    .max(1000, 'Prompt must be less than 1000 characters'),
  conversationId: z.uuid(),
})

app.post('/api/v1/chat', async (req: Request, res: Response) => {
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
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
