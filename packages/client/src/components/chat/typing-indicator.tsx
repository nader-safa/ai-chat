const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 px-3 py-3 bg-gray-200 self-start rounded-xl">
      <Dot />
      <Dot className="[animation-delay:0.2s]" />
      <Dot className="[animation-delay:0.4s]" />
    </div>
  )
}

// Implementation Details
type DotProps = {
  className?: string
}

const Dot = ({ className }: DotProps) => {
  return (
    <div
      className={`w-2 h-2 rounded-full bg-gray-800 animate-pulse ${className}`}
    />
  )
}

export default TypingIndicator
