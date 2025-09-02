import express from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'
import OpenAI from 'openai'
import z from 'zod'
import { conversationRepository } from './repositories/conversation.repository'

dotenv.config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: prompt,
      temperature: 0.2,
      max_output_tokens: 50,
      previous_response_id: conversationRepository.get(conversationId),
    })

    conversationRepository.set(conversationId, response.id)

    res.json({ message: response.output_text })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate a response' })
  }
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
