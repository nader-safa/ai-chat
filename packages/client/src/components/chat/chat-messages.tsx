import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

interface ChatMessagesProps {
  messages: Message[]
}

const ChatMessages = ({ messages }: ChatMessagesProps) => {
  const lastMsgRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const onCopyMessage = (e: React.ClipboardEvent<HTMLParagraphElement>) => {
    const selection = window.getSelection()?.toString().trim()
    if (selection) {
      e.preventDefault()
      e.clipboardData.setData('text/plain', selection)
    }
  }
  return messages.map((message, index) => (
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
  ))
}

export default ChatMessages
