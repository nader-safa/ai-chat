import axios from 'axios'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FaArrowUp, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import ChatMessages, { type Message } from './chat/chat-messages'
import TypingIndicator from './chat/typing-indicator'
import { Button } from './ui/button'

type FormData = {
  prompt: string
}

type ChatResponse = {
  message: string
}

const ChatBot = () => {
  const conversationId = useRef(crypto.randomUUID())

  const [messages, setMessages] = useState<Message[]>([])
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    defaultValues: {
      prompt: '',
    },
  })

  const onSubmit = async ({ prompt }: FormData) => {
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
      reset()
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(onSubmit)()
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
        className="flex flex-col gap-2 items-end border-2 border-gray-300 rounded-3xl p-4"
      >
        <textarea
          {...register('prompt', {
            required: true,
            validate: value => value.trim().length > 0,
          })}
          autoFocus
          placeholder="Ask me anything"
          className="w-full border-0 focus:outline-none resize-none"
          maxLength={1000}
        />
        <Button
          className="w-9 h-9 rounded-full"
          type="submit"
          disabled={formState.isSubmitting || !formState.isValid}
        >
          {formState.isSubmitting ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <FaArrowUp />
          )}
        </Button>
      </form>
    </div>
  )
}

export default ChatBot
