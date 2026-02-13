import { render, screen, fireEvent } from '@testing-library/react'
import DropInput from '../components/DropInput'
import { vi } from 'vitest'

test('calls onSend when form submitted', () => {
  const mockSend = vi.fn()

  render(<DropInput onSend={mockSend} />)

  const input = screen.getByPlaceholderText('Type a drop...')
  fireEvent.change(input, { target: { value: 'Hello' } })

  fireEvent.click(screen.getByText('Send'))

  expect(mockSend).toHaveBeenCalledWith('Hello')
})
