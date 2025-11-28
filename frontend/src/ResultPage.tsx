import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from './config'

export default function ResultPage() {
  const [html, setHtml] = useState('')
  const [email, setEmail] = useState('')
  const [responses, setResponses] = useState({
    accuracy: '',
    influence: '',
    furtherThoughts: '',
    usability: '',
  })
  const hadSummary = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/')
      return
    }

    const load = async () => {
      try {
        const me = await fetch(`${API_BASE_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())

        setEmail(me.email || '')

        const feedback = await fetch(`${API_BASE_URL}/has_submitted_feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())

        if (feedback.submitted === true) {
          navigate('/thank-you', { replace: true })
          return
        }

        const summary = await fetch(`${API_BASE_URL}/summary_text`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())

        if (!summary.summary?.trim()) {
          navigate('/waiting', { replace: true })
          return
        }

        setHtml(summary.summary)
        hadSummary.current = true
      } catch (err) {
        console.error('ResultPage load error:', err)
        navigate('/waiting', { replace: true })
      }
    }

    load()
  }, [navigate])

  useEffect(() => {
    const ws = new WebSocket(
      `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${new URL(API_BASE_URL).host}/ws`
    )


    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'summary_updated') {
          const newHtml = (msg.html ?? msg.summary ?? '').trim()
          if (!newHtml && hadSummary.current) {
            navigate('/waiting', { replace: true })
          } else if (newHtml) {
            hadSummary.current = true
            setHtml(newHtml)
          }
        }
      } catch (err) {
        console.error('WebSocket parse error:', err)
      }
    }

    return () => ws.close()
  }, [navigate])

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setResponses((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function autoResize(e: React.ChangeEvent<HTMLTextAreaElement>) {
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = localStorage.getItem('access_token')
    fetch(`${API_BASE_URL}/submit_feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(responses)
    }).then(() => navigate('/thank-you'))
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">
      <header className="bg-white border-b shadow-sm w-full">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">SAC Collaborative Consensus</h1>
          <div className="text-sm text-neutral-700 mb-1">Logged in as <strong>{email}</strong></div>
          <button onClick={logout} className="text-sm text-red-600 underline">Log out</button>
        </div>
      </header>

      <main className="flex-grow px-4 py-6 max-w-6xl mx-auto space-y-8">
        <div className="bg-white border rounded-2xl shadow-lg p-10 max-w-3xl mx-auto space-y-6">
          <h3 className="text-lg font-semibold">Final Synthesis</h3>
          <div className="prose prose-neutral text-sm" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl shadow-lg p-10 w-full space-y-6">
          <h3 className="text-lg font-semibold">Post-Synthesis Feedback</h3>

          {[
            ['accuracy', 'Does this summary accurately reflect your viewpoint?'],
            ['influence', 'Has this synthesis affected your viewpoint in any way?'],
            ['furtherThoughts', 'Are there any further thoughts you\'d like to add?'],
            ['usability', 'How did you find using the platform?'],
          ].map(([name, label]) => (
            <div key={name}>
              <label className="text-sm text-neutral-700 block mb-1">{label}</label>
              <textarea
                name={name}
                rows={2}
                onInput={autoResize}
                className="w-full border rounded-lg px-4 py-2 resize-none overflow-hidden scroll-mt-24 focus:outline-none focus:ring-2 focus:ring-blue-200"
                onChange={handleChange}
                value={responses[name]}
                required
              />
            </div>
          ))}

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md">
            Submit Feedback
          </button>
        </form>
      </main>

      <footer className="bg-white border-t text-center py-4 text-sm text-neutral-500">
        © {new Date().getFullYear()} – Final summary presented above
      </footer>
    </div>
  )
}
