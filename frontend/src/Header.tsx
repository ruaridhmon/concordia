import { useAuth } from './AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Collaborative Consensus
          </h1>
          {user && (
            <p className="text-sm text-neutral-500">
              Logged in as <strong>{user.email}</strong>
            </p>
          )}
        </div>
        {user && (
          <button onClick={logout} className="text-sm text-red-600 underline">
            Log out
          </button>
        )}
      </div>
    </header>
  );
}
