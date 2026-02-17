'use client'

import { useState } from 'react'
import Button from '@/components/Button'

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mt-6 space-y-4">

      {/* Mode Toggle */}
      <div className="flex gap-2">
        {['text', 'code'].map((type) => (
          <button
            key={type}
            onClick={() => setMode(type as 'text' | 'code')}
            className={`
              px-4 py-1.5
              rounded-lg
              text-sm font-medium
              transition-all duration-300
              border
              ${
                mode === type
                  ? 'bg-[#1f2937] text-white border-[#7aa2f7] shadow-[0_0_20px_rgba(122,162,247,0.4)]'
                  : 'bg-[#0f1117] text-gray-400 border-[#2d333b] hover:border-[#7aa2f7]'
              }
            `}
          >
            {type === 'text' ? 'Text' : 'Code'}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={mode === 'code' ? 12 : 3}
        placeholder={
          mode === 'code'
            ? 'Paste your code here...'
            : 'Type your message...'
        }
        className={`
          w-full
          px-4 py-3
          rounded-xl
          resize-y
          border border-[#2d333b]
          bg-[#0f1117]
          text-white
          placeholder:text-gray-500
          focus:outline-none
          focus:ring-2
          focus:ring-[#7aa2f7]
          transition-all duration-300
          ${
            mode === 'code'
              ? 'font-mono text-sm'
              : 'text-sm'
          }
        `}
      />

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          label="Send"
          onClick={handleSend}
          disabled={!value.trim()}
        />
      </div>
    </div>
  )
}
