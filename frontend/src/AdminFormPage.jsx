import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from './config'

export default function AdminFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [rounds, setRounds] = useState([])
  const token = localStorage.getItem('access_token')

  useEffect(() => {
    loadForm()
    loadRounds()
  }, [id])

  async function loadForm() {
    const r = await fetch(`${API_BASE_URL}/forms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await r.json()
    setForm(data)
  }

  async function loadRounds() {
    const r = await fetch(`${API_BASE_URL}/forms/${id}/rounds`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const d = await r.json()
    setRounds(d)
  }

  async function closeRound() {
    await fetch(`${API_BASE_URL}/forms/${id}/close_round`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    loadRounds()
  }

  async function nextRound() {
    await fetch(`${API_BASE_URL}/forms/${id}/next_round`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    loadRounds()
  }

  if (!form) return <div>Loading…</div>

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <button onClick={() => navigate('/')} className="underline text-blue-600">
        ← Back
      </button>

      <h1 className="text-2xl font-bold my-4">{form.title}</h1>

      <h2 className="text-lg font-semibold mb-2">Rounds</h2>

      {rounds.map(r => (
        <div key={r.id} className="border p-3 rounded mb-2 bg-white">
          <p>Round {r.round_number}</p>
          <p>{r.is_active ? 'Active' : 'Closed'}</p>
        </div>
      ))}

      <div className="mt-4 space-x-4">
        <button
          onClick={closeRound}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Close Current Round
        </button>

        <button
          onClick={nextRound}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Open Next Round
        </button>
      </div>

      <div className="mt-8">
        <a
          href={`/admin/form/${id}/summary`}
          className="underline text-blue-600"
        >
          Open Summary Page
        </a>
      </div>
    </div>
  )
}
