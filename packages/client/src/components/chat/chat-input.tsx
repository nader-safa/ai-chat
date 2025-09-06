import { useForm } from 'react-hook-form'
import { FaArrowUp, FaSpinner } from 'react-icons/fa'
import { Button } from '../ui/button'

export type ChatFormData = {
  prompt: string
}

type Props = {
  onSubmit: (data: ChatFormData) => void
}

const ChatInput = ({ onSubmit }: Props) => {
  const { register, handleSubmit, reset, formState } = useForm<ChatFormData>({
    defaultValues: {
      prompt: '',
    },
  })

  const handleFormSubmit = handleSubmit((data: ChatFormData) => {
    reset({ prompt: '' })
    onSubmit(data)
  })

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleFormSubmit()
    }
  }

  return (
    <form
      onSubmit={handleFormSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2 items-end border-2 border-gray-300 rounded-3xl p-4 relative"
    >
      <textarea
        {...register('prompt', {
          required: true,
          validate: value => value.trim().length > 0,
        })}
        autoFocus
        placeholder="Ask me anything"
        className="w-full border-0 focus:outline-none resize-none h-28"
        maxLength={1000}
      />
      <Button
        className="w-9 h-9 rounded-full absolute right-4 bottom-4"
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

export default ChatInput
