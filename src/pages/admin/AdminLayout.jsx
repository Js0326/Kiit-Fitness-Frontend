import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { LayoutDashboard, QrCode, Dumbbell, Users, MessageSquare, Bell, LogOut, ShieldCheck } from 'lucide-react';

const navItems = [
  { to: '/admin',               label: 'Dashboard',     icon: LayoutDashboard, end: true },
  { to: '/admin/scanner',       label: 'QR Scanner',    icon: QrCode },
  { to: '/admin/students',      label: 'Students',      icon: Users },
  { to: '/admin/gym',           label: 'Manage Gym',    icon: Dumbbell },
  { to: '/admin/complaints',    label: 'Complaints',    icon: MessageSquare },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminLayout() {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-56 border-r border-surface-border bg-surface-raised">
        <div className="p-5 border-b border-surface-border">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={20} className="text-brand" />
            <span className="font-display font-bold tracking-wider uppercase text-sm">Admin</span>
          </div>
          <p className="text-xs text-gray-500 truncate">{profile?.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive ? 'bg-brand/10 text-brand' : 'text-gray-400 hover:text-white hover:bg-surface'}`}>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-surface-border">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white px-3 py-2 w-full">
            <LogOut size={16} />Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-surface-border px-4 py-3 flex items-center justify-between">
          <span className="font-display font-bold tracking-wider text-sm flex items-center gap-1.5">
            <ShieldCheck size={18} className="text-brand" />Admin Panel
          </span>
          <button onClick={handleLogout} className="btn-ghost p-2"><LogOut size={18} className="text-gray-500" /></button>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-surface-border z-30 px-2 safe-area-pb">
          <div className="flex justify-around py-2">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
                <Icon size={20} />
                <span className="text-[9px] font-semibold tracking-wide">{label.split(' ')[0]}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
