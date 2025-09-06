import { useState, useEffect } from 'react'
import ChatBot from './components/chat-bot'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('localhost:3000/api/v1/health')
      .then(response => response.json())
      .then(data => setMessage(data.status))
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">ChatBot</h1>
      <p>{message}</p>
      <ChatBot />
    </div>
  )
}

export default App
