import { useEffect, useRef } from 'react'

export function useWebSocket(code: string, onMessage: (msg: string) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!code) return

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!

    const wsUrl = backendUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')

    const ws = new WebSocket(`${wsUrl}/ws/${code}`)

    wsRef.current = ws

    ws.onmessage = (event) => {
      onMessage(event.data)
    }

    ws.onerror = () => {
      console.error('WebSocket error')
    }

    ws.onclose = () => {
      console.log('WebSocket closed')
    }

    return () => {
      ws.close()
    }
  }, [code])

  const send = (message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
    }
  }

  return { send }
}
