'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)

      if (online) {
        router.refresh()
      }
    }

    updateStatus()

    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
    }
  }, [router])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 32, marginBottom: 20 }}>
        📡 You are offline
      </h1>

      <p style={{ marginBottom: 30 }}>
        Dropify is running in offline mode.
        <br />
        Some features like sending drops may not work.
      </p>

      <button
        onClick={() => router.push('/')}
        style={{
          padding: '10px 20px',
          borderRadius: 6,
          border: 'none',
          background: '#000',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        Go to Home
      </button>

      {isOnline && (
        <p style={{ marginTop: 20, color: 'green' }}>
          Connection restored. Reloading...
        </p>
      )}
    </div>
  )
}
