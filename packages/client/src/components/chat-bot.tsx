import { FaArrowUp, FaSpinner } from 'react-icons/fa'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'
import { useRef } from 'react'

type FormData = {
  prompt: string
}

const ChatBot = () => {
  const conversationId = useRef(crypto.randomUUID())

  const { register, handleSubmit, reset, formState } = useForm<FormData>({
    defaultValues: {
      prompt: '',
    },
  })

  const onSubmit = async ({ prompt }: FormData) => {
    reset()
    const { data } = await axios.post('/api/v1/chat', {
      prompt,
      conversationId: conversationId.current,
    })

    console.log(data)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  return (
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
  )
}

export default ChatBot
