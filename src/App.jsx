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
  const { role } = useAuth();
  return roles.includes(role) ? children : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={
          <RoleRoute roles={['receptionist', 'doctor']}>
            <PatientsPage />
          </RoleRoute>
        } />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/inventory" element={
          <RoleRoute roles={['inventory', 'doctor']}>
            <InventoryPage />
          </RoleRoute>
        } />
        <Route path="/setup" element={<SetupPage />} />
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
