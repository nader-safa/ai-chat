import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/v1/hello')
      .then(response => response.json())
      .then(data => setMessage(data.message))
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>{message}</p>

      <Button>Click me</Button>
    </div>
  )
}

export default App
