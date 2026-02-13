const API_URL = 'http://localhost:8000'

export async function createSession() {
  const res = await fetch(`${API_URL}/sessions`, {
    method: 'POST',
  })

  if (!res.ok) throw new Error('Failed to create session')

  return res.json()
}

export async function joinSession(code: string) {
  const res = await fetch(`${API_URL}/sessions/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })

  if (!res.ok) throw new Error('Invalid session code')

  return res.json()
}
