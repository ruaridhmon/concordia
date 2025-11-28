import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [forms, setForms] = useState([]);
  const [newFormTitle, setNewFormTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState(['']);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/forms`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => setForms(Array.isArray(d) ? d : []));
    }
  }, [token]);

  const createForm = async () => {
    const res = await fetch(`${API_BASE_URL}/create_form`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        title: newFormTitle,
        questions: newQuestions.filter(q => q.trim() !== ''),
        allow_join: true,
        join_code: String(Math.floor(10000 + Math.random() * 90000))
      })
    });
    if (!res.ok) {
      alert(`Save failed: ${res.status}`);
      return;
    }

    const created = await res.json();
    setForms(prev => [...prev, created]);
    setNewFormTitle('');
    setNewQuestions(['']);
  };

  return (
    <div className="flex-grow p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create a New Form</h2>
          <input
            type="text"
            placeholder="Form title"
            value={newFormTitle}
            onChange={e => setNewFormTitle(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 mb-4"
          />
          {newQuestions.map((q, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Question ${i + 1}`}
              value={q}
              onChange={e => {
                const updated = [...newQuestions];
                updated[i] = e.target.value;
                setNewQuestions(updated);
              }}
              className="w-full border rounded-lg px-3 py-2 mb-2"
            />
          ))}
          <div className="flex justify-between mt-3">
            <button
              type="button"
              onClick={() => setNewQuestions([...newQuestions, ''])}
              className="text-blue-600 underline"
            >
              + Add question
            </button>
            <button
              type="button"
              onClick={createForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Save Form
            </button>
          </div>
        </div>

        {forms.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Existing Forms</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="p-3">Form Title</th>
                    <th>Join Code</th>
                    <th>Participants</th>
                    <th>Current Round</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((f: any) => (
                    <tr key={f.id} className="border-b">
                      <td className="p-3 font-medium">{f.title}</td>
                      <td>
                        <code className="bg-neutral-200 px-2 py-1 rounded">
                          {f.join_code}
                        </code>
                      </td>
                      <td>{f.participant_count}</td>
                      <td>{f.current_round}</td>
                      <td className="text-right">
                        <a href={`/admin/form/${f.id}`} className="text-blue-600 underline">
                          Edit
                        </a>
                        <a href={`/admin/form/${f.id}/summary`} className="text-blue-600 underline ml-4">
                          Summary
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
