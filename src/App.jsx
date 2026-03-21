import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Public
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';

// Student
import StudentLayout      from './pages/StudentLayout';
import DashboardPage      from './pages/DashboardPage';
import GymsPage           from './pages/GymsPage';
import GymDetailPage      from './pages/GymDetailPage';
import BookingPage        from './pages/BookingPage';
import NotificationsPage  from './pages/NotificationsPage';
import ComplaintsPage     from './pages/ComplaintsPage';
import AttendancePage     from './pages/AttendancePage';

// Admin
import AdminLayout        from './pages/admin/AdminLayout';
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminScanner       from './pages/admin/AdminScanner';
import AdminGymEdit       from './pages/admin/AdminGymEdit';
import AdminStudents      from './pages/admin/AdminStudents';
import AdminComplaints    from './pages/admin/AdminComplaints';
import AdminNotifications from './pages/admin/AdminNotifications';

// Super Admin
import SuperAdminPage     from './pages/superadmin/SuperAdminPage';

const Spinner = () => (
  <div className="min-h-screen bg-surface flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
  </div>
);

function ProtectedRoute({ children, role }) {
  const { firebaseUser, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!firebaseUser) return <Navigate to="/login" replace />;
  if (role === 'admin'      && profile?.role !== 'admin'      && profile?.role !== 'superadmin') return <Navigate to="/" replace />;
  if (role === 'superadmin' && profile?.role !== 'superadmin') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { firebaseUser, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (firebaseUser && profile) {
    if (profile.role === 'superadmin') return <Navigate to="/superadmin" replace />;
    if (profile.role === 'admin')      return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Student */}
      <Route path="/" element={<ProtectedRoute><StudentLayout /></ProtectedRoute>}>
        <Route index                element={<DashboardPage />} />
        <Route path="gyms"          element={<GymsPage />} />
        <Route path="gyms/:gymId"   element={<GymDetailPage />} />
        <Route path="book"          element={<BookingPage />} />
        <Route path="attendance"    element={<AttendancePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="complaints"    element={<ComplaintsPage />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index                  element={<AdminDashboard />} />
        <Route path="scanner"         element={<AdminScanner />} />
        <Route path="gym"             element={<AdminGymEdit />} />
        <Route path="students"        element={<AdminStudents />} />
        <Route path="complaints"      element={<AdminComplaints />} />
        <Route path="notifications"   element={<AdminNotifications />} />
      </Route>

      {/* Super Admin */}
      <Route path="/superadmin" element={<ProtectedRoute role="superadmin"><SuperAdminPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
