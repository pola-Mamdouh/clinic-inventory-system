import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Stethoscope, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { seedUserRoles } from '../../firebase/seeder';

const DEMO_ACCOUNTS = [
  { label: 'Admin',        email: 'admin@clinic.com',        icon: '⚙️'  },
  { label: 'Receptionist', email: 'receptionist@clinic.com', icon: '🗂️' },
  { label: 'Doctor',       email: 'doctor@clinic.com',       icon: '👨‍⚕️' },
  { label: 'Inventory',    email: 'inventory@clinic.com',    icon: '📦' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const cred = await login(email, password);
      // Write role to Firestore users collection on every login
      await seedUserRoles(cred.user);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message.includes('invalid-credential')
        ? 'Invalid email or password'
        : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('clinic123');
  };

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center relative overflow-hidden">
      {/* Background grid & glow */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-glow-teal mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">
            MediCore <span className="text-teal-400">ERP</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-sans">Clinic Management System</p>
        </div>

        {/* Card */}
        <div className="bg-navy-900/80 backdrop-blur-sm border border-white/5 rounded-2xl p-8 shadow-glass">
          <h2 className="font-display text-xl font-semibold text-white mb-6">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@clinic.com"
                className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-glow-teal disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Demo Accounts</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <span className="text-lg">{acc.icon}</span>
                  <span className="text-xs text-slate-400 group-hover:text-white transition-colors font-medium">
                    {acc.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-600 text-center mt-2">Password: <span className="text-slate-500 font-mono">clinic123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
