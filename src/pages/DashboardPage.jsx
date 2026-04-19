import { useState, useEffect } from 'react';
import { Users, Calendar, Package, Activity, AlertTriangle, ClipboardCheck, Stethoscope, Clock } from 'lucide-react';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import ExaminationModal from '../components/examination/ExaminationModal';
import { useAuth } from '../context/AuthContext';
import { getPatients } from '../firebase/patients';
import { getAppointments, getDoctorAppointments } from '../firebase/appointments';
import { getInventory } from '../firebase/inventory';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState({ patients: 0, appointments: 0, inventory: 0, lowStock: 0 });
  const [todayAppts, setTodayAppts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examModal, setExamModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  const load = async () => {
    try {
      // Doctors should only see their own appointments — never all patients' data
      const appointmentFetch = role === 'doctor'
        ? getDoctorAppointments(user.uid)
        : getAppointments();

      const [patients, appts, inv] = await Promise.all([
        getPatients(), appointmentFetch, getInventory(),
      ]);

      const todayList = appts.filter(a => a.date === today && a.status !== 'cancelled');
      const lowStock  = inv.filter(i => i.quantity <= (i.lowStockThreshold || 5));

      setStats({
        patients: patients.length,
        // Count only today's active appointments so the stat matches the "Today's Appointments" panel
        appointments: appts.filter(a => a.date === today && (a.status === 'scheduled' || a.status === 'in-progress')).length,
        inventory: inv.length,
        lowStock: lowStock.length,
      });
      setTodayAppts(todayList.slice(0, 8));
      setLowStockItems(lowStock.slice(0, 5));
      setRecentPatients(patients.slice(0, 5));
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Re-run load when role or uid changes (role is resolved asynchronously after mount)
  useEffect(() => {
    if (role) load();
  }, [role, user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const openExamination = (appt) => { setSelectedAppt(appt); setExamModal(true); };

  const STATUS_MAP = { scheduled: 'info', 'in-progress': 'warning', completed: 'success', cancelled: 'danger' };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const SUBTITLE_MAP = {
    admin: 'System overview',
    receptionist: 'Front desk overview',
    doctor: 'Clinical overview',
    inventory: 'Stock management overview',
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle={SUBTITLE_MAP[role]} />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Patients" value={stats.patients} icon={Users} color="teal" trend={12} trendLabel="vs last month" delay={0} />
          <StatCard title="Today's Active" value={stats.appointments} icon={Calendar} color="cyan" trendLabel="scheduled today" delay={100} />
          <StatCard title="Inventory Items" value={stats.inventory} icon={Package} color="violet" delay={200} />
          <StatCard title="Low Stock Alerts" value={stats.lowStock} icon={AlertTriangle} color={stats.lowStock > 0 ? 'red' : 'emerald'} delay={300} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2 bg-navy-900 border border-white/5 rounded-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-400" />
                <h2 className="font-display font-semibold text-white text-sm">Today's Appointments</h2>
              </div>
              <span className="text-xs text-slate-500">{today}</span>
            </div>
            <div className="divide-y divide-white/5">
              {todayAppts.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-slate-500">
                  <Clock className="w-8 h-8 mb-2 text-slate-700" />
                  <p className="text-sm">No appointments today</p>
                </div>
              ) : (
                todayAppts.map((a, i) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold flex-shrink-0">
                        {a.patientName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{a.patientName}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {a.time}
                          {a.doctorName && <span>· {a.doctorName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_MAP[a.status] || 'default'} dot>{a.status}</Badge>
                      {/* Show Examine button for both scheduled and in-progress appointments */}
                      {role === 'doctor' && (a.status === 'scheduled' || a.status === 'in-progress') && (
                        <button
                          onClick={() => openExamination(a)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 text-xs font-semibold rounded-lg transition-all border border-teal-500/20"
                        >
                          <Stethoscope className="w-3 h-3" />
                          Examine
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Low Stock Alerts */}
            {(role === 'inventory' || role === 'doctor' || role === 'admin') && (
              <div className="bg-navy-900 border border-white/5 rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '150ms' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
                    <h2 className="font-display font-semibold text-white text-sm">Low Stock</h2>
                  </div>
                  {lowStockItems.length > 0 && (
                    <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-semibold">
                      {lowStockItems.length} alert{lowStockItems.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {lowStockItems.length === 0 ? (
                    <p className="text-center text-xs text-slate-600 py-4">All stock levels normal</p>
                  ) : (
                    lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-red-500/5 border border-red-500/10 rounded-xl px-3 py-2.5">
                        <div>
                          <p className="text-xs font-semibold text-white">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-400">{item.quantity}</p>
                          <p className="text-xs text-slate-600">{item.unit} left</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Recent Patients */}
            {role !== 'inventory' && (
              <div className="bg-navy-900 border border-white/5 rounded-2xl overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
                <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
                  <Users className="w-4 h-4 text-violet-400" />
                  <h2 className="font-display font-semibold text-white text-sm">Recent Patients</h2>
                </div>
                <div className="divide-y divide-white/5">
                  {recentPatients.length === 0 ? (
                    <p className="text-center text-xs text-slate-600 py-6">No patients registered</p>
                  ) : (
                    recentPatients.map(p => (
                      <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                        <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold flex-shrink-0">
                          {p.firstName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{p.firstName} {p.lastName}</p>
                          <p className="text-[10px] text-slate-500">{p.gender} · {p.bloodType || 'N/A'}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Activity summary for inventory role */}
            {role === 'inventory' && (
              <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20 rounded-2xl p-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-semibold text-white">Quick Summary</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total Items</span>
                    <span className="text-teal-400 font-semibold">{stats.inventory}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Low Stock</span>
                    <span className={`font-semibold ${stats.lowStock > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{stats.lowStock}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ExaminationModal
        open={examModal}
        onClose={() => { setExamModal(false); setSelectedAppt(null); }}
        appointment={selectedAppt}
        onComplete={load}
      />
    </div>
  );
}
