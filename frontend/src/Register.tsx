import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, Navigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, token, isLoading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsRegistering(true);

    try {
      const reg = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ email, password })
      });

      if (!reg.ok) {
        throw new Error('Registration failed');
      }

      await login(email, password);

    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (token) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <form onSubmit={handleRegister} className="bg-white p-10 rounded-xl shadow max-w-md w-full space-y-4">
        <h1 className="text-xl font-semibold text-center">Register</h1>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <button
          type="submit"
          disabled={isRegistering || isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-400"
        >
          {isRegistering ? 'Registering...' : 'Register & Login'}
        </button>
        <div className="text-sm text-center">
          <Link to="/login" className="text-blue-600 underline">
            Already have an account? Login
          </Link>
        </div>
      </form>
    </div>
  );
}
