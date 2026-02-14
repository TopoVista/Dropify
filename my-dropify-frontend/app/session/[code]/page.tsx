'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import DropInput from '@/components/DropInput'
import { useWebSocket } from '@/lib/useWebSocket'
import FileDropInput from '@/components/FileDropInput'
import { saveDrops, loadDrops } from '@/lib/db'

type DropType = {
  type: 'text' | 'file'
  content?: string
  path?: string
  created_at: string
}

export default function SessionPage() {
  const params = useParams()
  const code = params?.code as string | undefined

  const [drops, setDrops] = useState<DropType[]>([])
  const [copied, setCopied] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine)
    updateStatus()

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [])

  useEffect(() => {
    if (!code) return

    const loadSessionDrops = async () => {
      if (navigator.onLine) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops`
          )

          if (!res.ok) throw new Error()

          const data = await res.json()

          setDrops(data)
          await saveDrops(code, data)
          return
        } catch {}
      }

      const cached = await loadDrops(code)
      if (cached) {
        setDrops(cached)
      }
    }

    loadSessionDrops()
  }, [code])

  const handleMessage = async (msg: string) => {
    if (!code) return

    let newDrop: DropType

    if (msg.startsWith('FILE:')) {
      const path = msg.replace('FILE:', '')
      newDrop = {
        type: 'file',
        path,
        created_at: new Date().toISOString(),
      }
    } else {
      newDrop = {
        type: 'text',
        content: msg,
        created_at: new Date().toISOString(),
      }
    }

    setDrops((prev) => {
      const updated = [...prev, newDrop]
      saveDrops(code, updated)
      return updated
    })
  }

  if (!code) return null

  useWebSocket(code, handleMessage)

  const handleSend = async (text: string) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${code}/drops/text`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text }),
        }
      )
    } catch {
      alert('You are offline. Drop not sent.')
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Session: {code}</h2>

      {isOffline && <p style={{ color: 'red' }}>You are offline</p>}

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
        {drops.length === 0 && <p>No drops yet</p>}

        {drops.map((d, i) =>
          d.type === 'file' ? (
            <a
              key={i}
              href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${d.path}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download File
            </a>
          ) : (
            <p key={i}>{d.content}</p>
          )
        )}
      </div>
    </div>
  )
}
