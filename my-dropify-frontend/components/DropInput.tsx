'use client'

import { useState } from 'react'

type Props = {
  onSend: (text: string, type: 'text' | 'code') => void
}

export default function DropInput({ onSend }: Props) {
  const [value, setValue] = useState('')
  const [mode, setMode] = useState<'text' | 'code'>('text')

  const handleSend = () => {
    if (!value.trim()) return
    onSend(value, mode)
    setValue('')
  }

  return (
    <div style={{ marginTop: 20 }}>
      {/* Mode Toggle */}
      <div style={{ marginBottom: 8 }}>
        <button
          onClick={() => setMode('text')}
          style={{
            marginRight: 8,
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: mode === 'text' ? '#222' : '#eee',
            color: mode === 'text' ? '#fff' : '#000',
            cursor: 'pointer',
          }}
        >
          Text
        </button>

        <button
          onClick={() => setMode('code')}
          style={{
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #ccc',
            background: mode === 'code' ? '#222' : '#eee',
            color: mode === 'code' ? '#fff' : '#000',
            cursor: 'pointer',
          }}
        >
          Code
        </button>
      </div>

      {/* Input */}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={mode === 'code' ? 14 : 3}
        style={{
          width: '100%',
          padding: 12,
          borderRadius: 8,
          border: '1px solid #ccc',
          resize: 'vertical',
          fontFamily: mode === 'code' ? 'monospace' : 'inherit',
          fontSize: 14,
          background: mode === 'code' ? '#1e1e1e' : '#fff',
          color: mode === 'code' ? '#d4d4d4' : '#000',
          whiteSpace: 'pre',
        }}
        placeholder={
          mode === 'code'
            ? 'Paste your code here...'
            : 'Type your message...'
        }
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        style={{
          marginTop: 10,
          padding: '8px 16px',
          borderRadius: 6,
          border: 'none',
          background: '#0070f3',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Send
      </button>
    </div>
  )
}
