'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSession, joinSession } from '../lib/api'



export default function SessionForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await createSession()
      router.push(`/session/${data.code}`)
    } catch {
      setError('Could not create session')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await joinSession(code)
      router.push(`/session/${data.code}`)
    } catch {
      setError('Invalid session code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <input
        placeholder="Enter code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleCreate} disabled={loading}>
        Create Session
      </button>
      <button onClick={handleJoin} disabled={loading}>
        Join Session
      </button>
      {error && <p>{error}</p>}
    </div>
  )
}
