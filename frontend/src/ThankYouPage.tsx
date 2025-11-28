import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from './config'

export default function ThankYouPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('access_token')
      if (!token) return

      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setEmail(data.email || '')
        }
      } catch {}
    }

    fetchMe()
  }, [])

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">SAC Collaborative Consensus</h1>
          <div className="text-sm text-neutral-700 mb-1">Logged in as <strong>{email}</strong></div>
          <button onClick={logout} className="text-sm text-red-600 underline">Log out</button>
        </div>
      </header>

      <main className="flex-grow px-4 py-6 max-w-6xl mx-auto flex justify-center items-center">
        <div className="bg-white border rounded-2xl shadow-lg p-10 max-w-3xl w-full text-center space-y-4">
          <h2 className="text-2xl font-semibold">Thank you for your submission</h2>
          <p className="text-lg text-neutral-700 max-w-md mx-auto">
            Your reflections have been recorded successfully.
          </p>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            We appreciate your contribution to this collaborative process.
          </p>
        </div>
      </main>

      <footer className="bg-white border-t text-center py-4 text-sm text-neutral-500">
        © {new Date().getFullYear()} – Feedback complete
      </footer>
    </div>
  )
}
