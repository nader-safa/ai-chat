import dotenv from 'dotenv'
import type { Request, Response } from 'express'
import express from 'express'
import { chatController } from './controllers/chat.controller'

dotenv.config()

const app = express()

app.use(express.json())

const port = process.env.PORT || 3000

app.get('/', (req: Request, res: Response) => {
  res.send(`Hello World!!`)
})

app.post('/api/v1/chat', chatController.sendMessage)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
