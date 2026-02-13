import { render, screen } from '@testing-library/react'
import Button from '../components/Button'

test('renders button with text', () => {
  render(<Button label="Click me" />)
  expect(screen.getByText('Click me')).toBeInTheDocument()
})
