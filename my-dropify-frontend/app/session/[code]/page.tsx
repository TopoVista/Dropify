'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import DropInput from '@/components/DropInput'
import { useWebSocket } from '@/lib/useWebSocket'
import FileDropInput from '@/components/FileDropInput'

export default function SessionPage() {
  const params = useParams()
  const code = params.code as string

  const [drops, setDrops] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const handleMessage = (msg: string) => {
    if (msg.startsWith('FILE:')) {
      const path = msg.replace('FILE:', '')
      const fileUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/${path}`
      setDrops((prev) => [...prev, fileUrl])
    } else {
      setDrops((prev) => [...prev, msg])
    }
  }

  useWebSocket(code, handleMessage)

  const handleSend = async (text: string) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops/text`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      }
    )
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Session: {code}</h2>

      <button onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy Code'}
      </button>

      <div style={{ marginTop: 20 }}>
        <img
          src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/qrcode`}
          alt="QR Code"
          width={200}
          height={200}
        />
      </div>

      <DropInput onSend={handleSend} />
      <FileDropInput sessionCode={code} />

      <div style={{ marginTop: 20 }}>
        {drops.map((d, i) =>
          d.startsWith('http') ? (
            <a key={i} href={d} target="_blank" rel="noopener noreferrer">
              Download File
            </a>
          ) : (
            <p key={i}>{d}</p>
          )
        )}
      </div>
    </div>
  )
}
