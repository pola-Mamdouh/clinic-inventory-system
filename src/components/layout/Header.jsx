import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle, onMenuClick }) {
  const { user, role } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  const roleColors = {
    receptionist: 'from-violet-500 to-purple-600',
    doctor: 'from-teal-500 to-cyan-600',
    inventory: 'from-amber-500 to-orange-600',
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-navy-900/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white transition-all">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-teal-400" />
        </button>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${roleColors[role] || 'from-teal-500 to-cyan-600'} flex items-center justify-center text-white text-xs font-bold cursor-default`}>
          {initials}
        </div>
      </div>
    </header>
  );
}
