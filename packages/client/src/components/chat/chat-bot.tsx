import axios from 'axios'
import { useRef, useState } from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import ChatMessages, { type Message } from './chat-messages'
import TypingIndicator from './typing-indicator'
import ChatInput, { type ChatFormData } from './chat-input'

type ChatResponse = {
  message: string
}

const ChatBot = () => {
  const conversationId = useRef(crypto.randomUUID())

  const [messages, setMessages] = useState<Message[]>([])
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async ({ prompt }: ChatFormData) => {
    try {
      setError(null)

      setIsAssistantTyping(true)
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: prompt,
        },
      ])
      const { data } = await axios.post<ChatResponse>('/api/v1/chat', {
        prompt,
        conversationId: conversationId.current,
      })

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
        },
      ])
    } catch (error) {
      console.error(error)
      setError('Something went wrong, try again later')
    } finally {
      setIsAssistantTyping(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-4 flex-1 overflow-y-auto">
        <ChatMessages messages={messages} />
        {isAssistantTyping && <TypingIndicator />}
        {error && (
          <div className="flex items-center gap-1 px-3 py-3 bg-red-200 self-start rounded-xl">
            <FaExclamationTriangle className="text-red-800" />
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>
      <ChatInput onSubmit={onSubmit} />
    </div>
  )
}

export default ChatBot
