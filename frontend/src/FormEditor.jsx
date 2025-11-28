import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API_BASE_URL } from './config'

export default function FormEditor() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState([])
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/')
      return
    }

    fetch(`${API_BASE_URL}/forms/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(form => {
        setTitle(form.title)
        setQuestions(form.questions || [])
        setJoinCode(form.join_code)
        setLoading(false)
      })
  }, [id, navigate])

  async function saveForm() {
    const token = localStorage.getItem('access_token')

    const res = await fetch(`${API_BASE_URL}/forms/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title,
        questions,
        allow_join: true,
        join_code: joinCode
      })
    })

    if (!res.ok) {
      alert('Failed to save edits')
      return
    }

    navigate('/')
  }

  function updateQuestion(i, value) {
    const updated = [...questions]
    updated[i] = value
    setQuestions(updated)
  }

  function addQuestion() {
    setQuestions(prev => [...prev, ''])
  }

  function removeQuestion(i) {
    const updated = questions.filter((_, idx) => idx !== i)
    setQuestions(updated)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-centre justify-centre">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-blue-600 underline"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Form Title</h2>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Questions</h2>
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={q}
                  onChange={e => updateQuestion(i, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
                <button
                  className="text-red-600 text-sm underline"
                  type="button"
                  onClick={() => removeQuestion(i)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addQuestion}
            type="button"
            className="text-blue-600 underline mt-4"
          >
            + Add question
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 flex justify-end items-center space-x-4">
          <button
            onClick={saveForm}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Save Edits
          </button>
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm('Are you sure you want to delete this form?')) return
              await fetch(`${API_BASE_URL}/forms/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
              })
              navigate('/')
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Delete Form
          </button>
        </div>
      </div>
    </div>
  )
}
