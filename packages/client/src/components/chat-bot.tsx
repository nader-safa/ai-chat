import { FaArrowUp, FaSpinner } from 'react-icons/fa'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

type FormData = {
  prompt: string
}

type ChatResponse = {
  message: string
}

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const ChatBot = () => {
  const conversationId = useRef(crypto.randomUUID())

  const [messages, setMessages] = useState<Message[]>([])
  const [isAssistantTyping, setIsAssistantTyping] = useState(false)

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    defaultValues: {
      prompt: '',
    },
  })

  const onSubmit = async ({ prompt }: FormData) => {
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
    setIsAssistantTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 mb-4">
        {messages.map((message, index) => (
          <p
            key={index}
            className={cn(
              'px-4 py-2 rounded-xl',
              message.role === 'user' && 'bg-blue-600 text-white self-end',
              message.role === 'assistant' && 'bg-gray-200 self-start'
            )}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </p>
        ))}
        {isAssistantTyping && (
          <div className="flex items-center gap-1 px-3 py-3 bg-gray-200 self-start rounded-xl">
            <div className="w-2 h-2 rounded-full bg-gray-800 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-gray-800 animate-pulse [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-gray-800 animate-pulse [animation-delay:0.4s]" />
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
