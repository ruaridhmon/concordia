import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from './config'

export default function WaitingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    const fetchMeAndCheckSummary = async () => {
      try {
        // get user info
        const res = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setEmail(data.email || '')
        }
      } catch (err) {
        console.error('[WaitingPage] ❌ Fetch error:', err)
      }

      // only open websocket if still waiting
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${new URL(API_BASE_URL).host}/ws`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WaitingPage] ✅ WebSocket connected')
      }

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.type === 'summary_updated') {
            console.log('[WaitingPage] 🟢 Summary update received — navigating to /result')
            navigate('/result', { replace: true })
          }
        } catch (err) {
          console.error('[WaitingPage] ❌ Failed to parse message:', err)
        }
      }

      ws.onerror = (err) => {
        console.error('[WaitingPage] ❌ WebSocket error:', err)
      }

      ws.onclose = () => {
        console.log('[WaitingPage] 🔌 WebSocket closed')
      }

      return () => {
        ws.close()
      }
    }

    fetchMeAndCheckSummary()
  }, [navigate])

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Collaborative Consensus
            </h1>
            <p className="text-sm text-neutral-500">
              Logged in as <strong>{email}</strong>
            </p>
          </div>
          <button onClick={logout} className="text-sm text-red-600 underline">
            Log out
          </button>
        </div>
      </header>

      <main className="flex-grow px-4 py-6 max-w-6xl mx-auto flex justify-center items-center">
        <div className="bg-white border rounded-2xl shadow-lg p-10 max-w-3xl w-full text-center space-y-6">
          <h2 className="text-2xl font-semibold">Thank you for your submission</h2>
          <p className="text-lg text-neutral-700 max-w-md mx-auto">
            Your response has been recorded. You will be notified when the next round begins.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-sm text-blue-600 underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>

      <footer className="bg-white border-t text-center py-4 text-sm text-neutral-500">
        © {new Date().getFullYear()} – Waiting for next round…
      </footer>
    </div>
  )
}
