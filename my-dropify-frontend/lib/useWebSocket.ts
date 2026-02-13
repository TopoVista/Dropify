import { useEffect, useRef } from 'react'

export function useWebSocket(code: string, onMessage: (msg: string) => void) {
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${code}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      onMessage(event.data)
    }

    return () => {
      ws.close()
    }
  }, [code, onMessage])

  const send = (message: string) => {
    wsRef.current?.send(message)
  }

  return { send }
}
