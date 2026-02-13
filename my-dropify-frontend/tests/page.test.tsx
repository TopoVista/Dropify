import { render, screen } from '@testing-library/react'
import Page from '../app/page'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

test('renders dropify heading', () => {
  render(<Page />)
  expect(screen.getByText('Dropify')).toBeInTheDocument()
})
