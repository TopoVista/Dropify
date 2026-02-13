import { vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SessionForm from '../components/SessionForm'

// 🔹 create one shared push mock
const pushMock = vi.fn()

// 🔹 mock next/navigation ONCE at top level
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

describe('SessionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders create button', () => {
    render(<SessionForm />)
    expect(screen.getByText('Create Session')).toBeInTheDocument()
  })

  test('calls backend when create clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ code: '123456' }),
      } as Response)
    )

    render(<SessionForm />)

    fireEvent.click(screen.getByText('Create Session'))

    expect(global.fetch).toHaveBeenCalled()
  })

  test('navigates on valid join', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ code: '654321' }),
      } as Response)
    )

    render(<SessionForm />)

    const input = screen.getByPlaceholderText('Enter code')
    fireEvent.change(input, { target: { value: '654321' } })

    fireEvent.click(screen.getByText('Join Session'))

    expect(global.fetch).toHaveBeenCalled()
  })

  test('shows error on invalid join', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
      } as Response)
    )

    render(<SessionForm />)

    fireEvent.click(screen.getByText('Join Session'))

    const error = await screen.findByText('Invalid session code')
    expect(error).toBeInTheDocument()
  })
})
