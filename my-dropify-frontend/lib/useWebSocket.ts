import { useEffect, useRef } from 'react'

export function useWebSocket(
  code: string | undefined,
  onMessage: (msg: any) => void,
) {
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

    let socket: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      socket = new WebSocket(`${wsUrl}/ws/${code}`)
      wsRef.current = socket

      socket.onopen = () => {
        console.log('WebSocket connected')
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage(data)
        } catch (err) {
          console.error('WebSocket message parse error:', err)
        }
      }

      socket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      socket.onclose = () => {
        console.log('WebSocket closed')

        // 🔥 auto reconnect after 2s
        reconnectTimeout = setTimeout(() => {
          console.log('Reconnecting WebSocket...')
          connect()
        }, 2000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (socket) socket.close()
    }
  }, [code, onMessage])

  const send = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  return { send }
}
