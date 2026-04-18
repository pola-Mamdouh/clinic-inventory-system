import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Stethoscope, LayoutDashboard, Users, Calendar,
  Package, ClipboardList, LogOut, ChevronRight, Database, UserCog,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'from-rose-500 to-pink-600',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    nav: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'      },
      { to: '/admin',        icon: UserCog,         label: 'Manage Doctors' },
      { to: '/patients',     icon: Users,           label: 'Patients'       },
      { to: '/appointments', icon: Calendar,        label: 'Appointments'   },
      { to: '/setup',        icon: Database,        label: 'Seed Database'  },
    ],
  },
  receptionist: {
    label: 'Receptionist',
    color: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    nav: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
      { to: '/patients',     icon: Users,           label: 'Patients'     },
      { to: '/appointments', icon: Calendar,        label: 'Appointments' },
      { to: '/setup',        icon: Database,        label: 'Seed Database'},
    ],
  },
  doctor: {
    label: 'Doctor',
    color: 'from-teal-500 to-cyan-600',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    nav: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard'       },
      { to: '/appointments', icon: ClipboardList,   label: 'My Appointments' },
      { to: '/setup',        icon: Database,        label: 'Seed Database'   },
    ],
  },
  inventory: {
    label: 'Inventory Manager',
    color: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    nav: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'    },
      { to: '/inventory', icon: Package,         label: 'Inventory'    },
      { to: '/setup',     icon: Database,        label: 'Seed Database'},
    ],
  },
};

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.doctor;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full z-40 flex flex-col
        bg-navy-900 border-r border-white/5
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5 min-h-[72px]">
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-glow-teal`}>
          <Stethoscope className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="font-display text-sm font-bold text-white leading-tight">MediCore</p>
            <p className="text-[10px] text-slate-500 font-sans uppercase tracking-widest">ERP System</p>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/5 animate-fade-in">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold uppercase tracking-wider ${config.badge}`}>
            <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {config.label}
          </div>
          <p className="text-slate-400 text-xs mt-1.5 truncate">{user?.email}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {config.nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
              ${isActive
                ? `bg-gradient-to-r ${config.color} text-white shadow-glow-teal`
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon className="flex-shrink-0 w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            {!collapsed && (
              <span className="animate-fade-in flex-1">{label}</span>
            )}
            {!collapsed && (
              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 pb-2 border-t border-white/5 pt-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
        >
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
          {!collapsed && <span className="animate-fade-in">Collapse</span>}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-medium mt-1"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="animate-fade-in">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
