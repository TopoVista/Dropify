import { ChangeEvent } from 'react'

interface Props {
  sessionCode: string
}

export default function FileDropInput({ sessionCode }: Props) {
  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const file = e.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    await fetch(`http://localhost:8000/sessions/${sessionCode}/drops/file`, {
      method: 'POST',
      body: formData
    })
  }

  return <input type="file" onChange={handleChange} data-testid="file-input"/>
}
