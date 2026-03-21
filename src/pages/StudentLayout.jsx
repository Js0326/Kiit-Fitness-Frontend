import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Dumbbell, CalendarDays, Bell, MessageSquare, LogOut, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',              label: 'Home',      icon: Home },
  { to: '/gyms',          label: 'Gyms',      icon: Dumbbell },
  { to: '/book',          label: 'Book',      icon: CalendarDays },
  { to: '/attendance',    label: 'Stats',     icon: BarChart3 },
  { to: '/notifications', label: 'Alerts',    icon: Bell },
  { to: '/complaints',    label: 'Grievance', icon: MessageSquare },
];

export default function StudentLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-lg mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-surface-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <Dumbbell size={16} className="text-white" />
          </div>
          <span className="font-display font-bold tracking-wider uppercase text-sm">KIIT Fitness</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:block">{profile?.name?.split(' ')[0]}</span>
          <button onClick={handleLogout} className="btn-ghost p-2" title="Logout">
            <LogOut size={18} className="text-gray-500" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-surface/95 backdrop-blur border-t border-surface-border z-30 px-2 safe-area-pb">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
              <Icon size={22} />
              <span className="text-[9px] font-semibold tracking-wide">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
