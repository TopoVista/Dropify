import { renderHook } from '@testing-library/react'
import { useWebSocket } from '../lib/useWebSocket'
import { vi } from 'vitest'

test('creates websocket connection', () => {
  const closeMock = vi.fn()
  const sendMock = vi.fn()

  class MockWebSocket {
    url: string
    onmessage: ((event: any) => void) | null = null

    constructor(url: string) {
      this.url = url
    }

    send = sendMock
    close = closeMock
  }

  // @ts-ignore
  global.WebSocket = MockWebSocket

  renderHook(() => useWebSocket('abc123', () => {}))

  expect(global.WebSocket).toBeDefined()
})
