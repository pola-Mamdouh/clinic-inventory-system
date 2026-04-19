import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './components/auth/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import InventoryPage from './pages/InventoryPage';
import SetupPage from './pages/SetupPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
  const { role, loading } = useAuth();
  // Wait for auth to finish resolving — without this guard, RoleRoute redirects
  // to /dashboard while role is still null (before getUserRole resolves).
  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }
  return roles.includes(role) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Admin-only: doctor management */}
        <Route path="/admin" element={
          <RoleRoute roles={['admin']}>
            <AdminPage />
          </RoleRoute>
        } />

        {/* Patients: admin + receptionist + doctor */}
        <Route path="/patients" element={
          <RoleRoute roles={['admin', 'receptionist', 'doctor']}>
            <PatientsPage />
          </RoleRoute>
        } />

        {/* Appointments: all roles (doctor gets filtered view) */}
        <Route path="/appointments" element={<AppointmentsPage />} />

        {/* Inventory: admin + inventory + doctor */}
        <Route path="/inventory" element={
          <RoleRoute roles={['admin', 'inventory', 'doctor']}>
            <InventoryPage />
          </RoleRoute>
        } />

        {/* Setup / seed: admin only */}
        <Route path="/setup" element={
          <RoleRoute roles={['admin']}>
            <SetupPage />
          </RoleRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0A1E35',
              color: '#f8fafc',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              padding: '12px 16px',
            },
            success: {
              iconTheme: { primary: '#14B8A6', secondary: '#020B18' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#020B18' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
