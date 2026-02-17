'use client'

import { ChangeEvent, useRef, useState } from 'react'
import Button from '@/components/Button'

interface Props {
  sessionCode: string
}

export default function FileDropInput({ sessionCode }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClick = () => {
    fileRef.current?.click()
  }

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setError('')

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessions/${sessionCode}/drops/file`,
        {
          method: 'POST',
          body: formData,
        },
      )
    } catch {
      setError('Upload failed')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mt-4 space-y-3">

      {/* Hidden File Input */}
      <input
        ref={fileRef}
        type="file"
        onChange={handleChange}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        label={loading ? 'Uploading...' : 'Upload File'}
        onClick={handleClick}
        disabled={loading}
      />

      {error && (
        <p className="text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
