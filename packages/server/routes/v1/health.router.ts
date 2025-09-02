import express from 'express'

import type { Request, Response } from 'express'

const healthRouter = express.Router()

healthRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

export default healthRouter
