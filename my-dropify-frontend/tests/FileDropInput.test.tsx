import { render, screen, fireEvent } from "@testing-library/react"
import FileDropInput from "../components/FileDropInput"
import { vi } from "vitest"

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    text: () => Promise.resolve("uploads/test.txt"),
  })
) as any

test("uploads file successfully", async () => {
  render(<FileDropInput sessionCode="123456" />)

  const file = new File(["hello"], "test.txt", { type: "text/plain" })

  const input = screen.getByTestId("file-input")

  await fireEvent.change(input, {
    target: { files: [file] },
  })

  expect(global.fetch).toHaveBeenCalled()
})
