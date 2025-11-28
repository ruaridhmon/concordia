import AdminDashboard from './AdminDashboard';
import { useAuth } from './AuthContext';
import Header from './Header';
import UserDashboard from './UserDashboard';

export default function App() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col">
      <Header />
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
      <footer className="bg-white border-t text-center py-4 text-sm text-neutral-500">
        © {new Date().getFullYear()}
      </footer>
    </div>
  );
}