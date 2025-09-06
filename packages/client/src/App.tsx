import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'

function App() {
  const [message, setMessage] = useState('')
  const [count, setCount] = useState(0)

  useEffect(() => {
    fetch('/api/v1/health')
      .then(response => response.json())
      .then(data => setMessage(data.status))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>{message}</p>
      <p>the count is {count}</p>
      <Button onClick={() => setCount(prev => prev + 1)}>Click me</Button>
    </div>
  )
}

export default App
