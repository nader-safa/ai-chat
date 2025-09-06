import { FaArrowUp, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { useRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import TypingIndicator from './chat/typing-indicator'

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
  const [error, setError] = useState<string | null>(null)

  const lastMsgRef = useRef<HTMLDivElement | null>(null)

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    defaultValues: {
      prompt: '',
    },
  })

  useEffect(() => {
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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

  const onCopyMessage = (e: React.ClipboardEvent<HTMLParagraphElement>) => {
    const selection = window.getSelection()?.toString().trim()
    if (selection) {
      e.preventDefault()
      e.clipboardData.setData('text/plain', selection)
    }
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-2 mb-4 flex-1 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            ref={index === messages.length - 1 ? lastMsgRef : null}
            onCopy={onCopyMessage}
            className={cn(
              'px-4 py-2 rounded-xl',
              message.role === 'user' && 'bg-blue-600 text-white self-end',
              message.role === 'assistant' && 'bg-gray-200 self-start'
            )}
          >
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        ))}
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
