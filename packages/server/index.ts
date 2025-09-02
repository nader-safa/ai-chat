import express from 'express'
import type { Request, Response } from 'express'
import dotenv from 'dotenv'
import OpenAI from 'openai'

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

app.post('/api/v1/chat', async (req: Request, res: Response) => {
  const { prompt } = req.body

  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: prompt,
    temperature: 0.2,
    max_output_tokens: 50,
  })

  res.json({ message: response.output_text })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
