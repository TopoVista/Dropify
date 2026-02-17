'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createSession, joinSession } from '../lib/api'
import Button from '@/components/Button'

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
    if (!code.trim()) return
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
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="w-full max-w-md p-8 rounded-xl border border-[#2d333b] bg-[#161b22]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(122,162,247,0.15)]">

        <h2 className="text-xl font-semibold mb-6 text-white text-center">
          Start or Join a Session
        </h2>

        <input
          placeholder="Enter session code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="
            w-full mb-4
            px-4 py-2.5
            rounded-lg
            bg-[#0f1117]
            border border-[#2d333b]
            text-white
            placeholder:text-gray-500
            focus:outline-none
            focus:ring-2
            focus:ring-[#7aa2f7]
            transition-all
          "
        />

        <div className="flex flex-col gap-3">
          <Button
            label={loading ? 'Creating...' : 'Create Session'}
            onClick={handleCreate}
            disabled={loading}
          />

          <Button
            label={loading ? 'Joining...' : 'Join Session'}
            onClick={handleJoin}
            disabled={loading}
          />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
