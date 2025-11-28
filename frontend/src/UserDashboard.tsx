import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';
import { useAuth } from './AuthContext';

export default function UserDashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [myForms, setMyForms] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/my_forms`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => setMyForms(Array.isArray(d) ? d : []));
    }
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode) return;

    const res = await fetch(`${API_BASE_URL}/forms/unlock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ join_code: joinCode.trim() })
    });

    if (!res.ok) {
      setJoinError('Invalid join code.');
      return;
    }

    setJoinCode('');
    // Re-fetch my forms
    fetch(`${API_BASE_URL}/my_forms`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => setMyForms(Array.isArray(d) ? d : []));
  };

  return (
    <main className="flex-grow px-4 py-6 max-w-3xl mx-auto w-full">
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-center">Join a New Form</h2>
        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="text"
            placeholder="Enter join code"
            value={joinCode}
            onChange={e => {
              setJoinCode(e.target.value);
              setJoinError('');
            }}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {joinError && (
            <p className="text-red-500 text-sm text-center">{joinError}</p>
          )}
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
            Join Form
          </button>
        </form>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4">My Forms</h2>
        <ul className="space-y-3">
          {myForms.length === 0 && (
            <p className="text-neutral-600">No forms joined yet.</p>
          )}
          {myForms.map((f: any) => (
            <li
              key={f.id}
              className="border p-4 rounded-lg flex justify-between items-center bg-white shadow"
            >
              <span>{f.title}</span>
              <button
                className="bg-green-600 text-white px-3 py-1 rounded-lg"
                onClick={() => navigate(`/form/${f.id}`)}
              >
                Enter
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
