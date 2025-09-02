import express from 'express'
import { chatController } from '../../controllers/chat.controller'

const chatRouter = express.Router()

chatRouter.post('/chat', chatController.sendMessage)

export default chatRouter
