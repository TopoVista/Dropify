import { useEffect, useRef } from 'react'

export function useWebSocket(code: string, onMessage: (msg: string) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!code) return

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) {
      console.error('NEXT_PUBLIC_BACKEND_URL is not defined')
      return
    }

    const wsUrl = backendUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')

    const socket = new WebSocket(`${wsUrl}/ws/${code}`)
    wsRef.current = socket

    socket.onopen = () => {
      console.log('WebSocket connected')
    }

    socket.onmessage = (event) => {
      onMessage(event.data)
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    socket.onclose = () => {
      console.log('WebSocket closed')
    }

    return () => {
      socket.close()
    }
  }, [code, onMessage])

  const send = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
    }
  }

  return { send }
}
