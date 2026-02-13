'use client'

import { useState } from 'react'

export default function DropInput({ onSend }: { onSend: (msg: string) => void }) {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a drop..."
      />
      <button type="submit">Send</button>
    </form>
  )
}
