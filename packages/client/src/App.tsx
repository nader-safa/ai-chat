import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/v1/hello')
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
  }, [])

  return <div className='text-red-500 font-bold'>{message}</div>
}

export default App
