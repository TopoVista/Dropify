import { useEffect, useRef } from 'react'

export function useWebSocket(
  code: string | undefined,
  onMessage: (msg: any) => void,
) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messageHandlerRef = useRef(onMessage)
  const hasConnectedRef = useRef(false)

  // Always keep latest onMessage without re-triggering socket
  messageHandlerRef.current = onMessage

  useEffect(() => {
    if (!code) return

    // Prevent duplicate socket creation
    if (hasConnectedRef.current) return
    hasConnectedRef.current = true

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    if (!backendUrl) return

    const wsUrl = backendUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://')

    let isUnmounted = false

    const connect = () => {
      if (isUnmounted) return

      const socket = new WebSocket(`${wsUrl}/ws/${code}`)
      wsRef.current = socket

      socket.onopen = () => {
        console.log('WebSocket connected')
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          messageHandlerRef.current(data)
        } catch (err) {
          console.error('WebSocket parse error:', err)
        }
      }

      socket.onerror = () => {
        console.log('WebSocket error')
      }

      socket.onclose = () => {
        console.log('WebSocket closed')

        if (!isUnmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000)
        }
      }
    }

    connect()

    return () => {
      isUnmounted = true
      hasConnectedRef.current = false

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [code]) // ✅ ONLY depends on code

  const send = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { send }
}
