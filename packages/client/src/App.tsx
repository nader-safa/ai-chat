// import { useState, useEffect } from 'react'
import { Button } from './components/ui/button'

function App() {
  // const [message, setMessage] = useState('THIS IS A TEST')

  // useEffect(() => {
  //   fetch('/api/v1/health')
  //     .then(response => response.json())
  //     .then(data => setMessage(data.message))
  // }, [])

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p>WELCOME TO AI CHAT</p>

      <Button>Click me</Button>
    </div>
  )
}

export default App
