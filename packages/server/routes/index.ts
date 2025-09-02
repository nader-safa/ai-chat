import chatRouter from './v1/chat.router'
import express from 'express'
import healthRouter from './v1/health.router'

const router = express.Router()

router.use('/api/v1', [chatRouter, healthRouter])

export default router
