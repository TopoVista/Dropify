'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const createSession = async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions`,
        { method: 'POST' }
      )

      const data = await res.json()
      router.push(`/session/${data.code}`)
    } catch {
      alert('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  const joinSession = () => {
    if (!code.trim()) return
    router.push(`/session/${code}`)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f1117',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        color: '#e6edf3',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          background: '#161b22',
          padding: 40,
          borderRadius: 16,
          border: '1px solid #2d333b',
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          Dropify
        </h1>

        <p
          style={{
            textAlign: 'center',
            marginBottom: 40,
            color: '#8b949e',
          }}
        >
          Instant real-time drop sharing
        </p>

        <button
          onClick={createSession}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 20px',
            marginBottom: 20,
            background: '#7aa2f7',
            border: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            color: '#0f1117',
          }}
        >
          {loading ? 'Creating...' : 'Create Session'}
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter session code"
            style={{
              flex: 1,
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #2d333b',
              background: '#0f1117',
              color: '#e6edf3',
              outline: 'none',
            }}
          />

          <button
            onClick={joinSession}
            style={{
              padding: '12px 18px',
              borderRadius: 10,
              border: '1px solid #2d333b',
              background: '#21262d',
              color: '#e6edf3',
              cursor: 'pointer',
            }}
          >
            Join
          </button>
        </div>
      </div>
    </div>
  )
}
