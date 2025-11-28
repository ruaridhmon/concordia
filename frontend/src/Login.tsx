import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link, Navigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, token, isLoading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      await login(email, password);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (token) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-xl shadow max-w-md w-full space-y-4">
        <h1 className="text-xl font-semibold text-center">Login</h1>
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
          disabled={isLoggingIn || isLoading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-blue-400"
        >
          {isLoggingIn ? 'Logging in...' : 'Login'}
        </button>
        <div className="text-sm text-center">
          <Link to="/register" className="text-blue-600 underline">
            No account? Register
          </Link>
        </div>
      </form>
    </div>
  );
}
