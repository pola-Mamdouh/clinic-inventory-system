import { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, Clock, User, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { getAppointments, addAppointment, updateAppointment, deleteAppointment } from '../firebase/appointments';
import { getPatients } from '../firebase/patients';
import { useAuth } from '../context/AuthContext';

const EMPTY_FORM = {
  patientId: '', patientName: '', doctorName: '', date: '',
  time: '', reason: '', status: 'scheduled', priority: 'normal'
};

const STATUS_MAP = {
  scheduled: 'info',
  completed: 'success',
  cancelled: 'danger',
  'in-progress': 'warning',
};

export default function AppointmentsPage() {
  const { role } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    try {
      const [appts, pts] = await Promise.all([getAppointments(), getPatients()]);
      setAppointments(appts);
      setPatients(pts);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a }); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patientName || !form.date || !form.time) { toast.error('Patient, date, and time are required'); return; }
    setSaving(true);
    try {
      if (editing) { await updateAppointment(editing.id, form); toast.success('Appointment updated'); }
      else { await addAppointment(form); toast.success('Appointment booked'); }
      await load();
      closeModal();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this appointment?')) return;
    try { await deleteAppointment(id); toast.success('Deleted'); setAppointments(a => a.filter(x => x.id !== id)); }
    catch { toast.error('Delete failed'); }
  };

  const handleStatusChange = async (id, status) => {
    try { await updateAppointment(id, { status }); setAppointments(a => a.map(x => x.id === id ? { ...x, status } : x)); }
    catch { toast.error('Update failed'); }
  };

  const filtered = appointments.filter(a => {
    const matchSearch = `${a.patientName} ${a.doctorName} ${a.reason}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col h-full">
      <Header title="Appointments" subtitle="Schedule and manage patient appointments" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <SearchBar value={search} onChange={setSearch} placeholder="Search appointments..." />
            <div className="flex gap-1.5">
              {['all', 'scheduled', 'in-progress', 'completed', 'cancelled'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    statusFilter === s
                      ? 'bg-teal-500 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {role === 'receptionist' && (
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-glow-teal"
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </button>
          )}
        </div>

        {/* Today highlight */}
        {(() => {
          const todayAppts = filtered.filter(a => a.date === today);
          if (!todayAppts.length) return null;
          return (
            <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/5 border border-teal-500/20 rounded-2xl p-4">
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Today's Appointments ({todayAppts.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {todayAppts.map(a => (
                  <div key={a.id} className="bg-navy-900/60 rounded-xl p-3 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white truncate">{a.patientName}</p>
                      <Badge variant={STATUS_MAP[a.status] || 'default'} dot>{a.status}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{a.time} · {a.doctorName || 'Unassigned'}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Calendar} title="No appointments found" description="Book a new appointment to get started." />
        ) : (
          <div className="bg-navy-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Patient', 'Doctor', 'Date & Time', 'Reason', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((a, i) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition-colors animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-white">{a.patientName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{a.doctorName || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm text-white">{a.date}</div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />{a.time}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-300 max-w-[160px] truncate">{a.reason || '—'}</p>
                      </td>
                      <td className="px-5 py-4">
                        {role === 'doctor' ? (
                          <select
                            value={a.status}
                            onChange={e => handleStatusChange(a.id, e.target.value)}
                            className="bg-navy-800 border border-white/10 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-teal-500/50 transition-all cursor-pointer"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <Badge variant={STATUS_MAP[a.status] || 'default'} dot>{a.status}</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {role === 'receptionist' && (
                            <>
                              <button onClick={() => openEdit(a)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-slate-400 transition-all">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(a.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Appointment' : 'Book Appointment'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Patient *</label>
            <select
              value={form.patientId}
              onChange={e => {
                const p = patients.find(x => x.id === e.target.value);
                setForm({ ...form, patientId: e.target.value, patientName: p ? `${p.firstName} ${p.lastName}` : '' });
              }}
              className="w-full bg-navy-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
            >
              <option value="">Select patient...</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            </select>
          </div>

          {[
            { label: 'Doctor Name', key: 'doctorName', type: 'text', placeholder: 'Dr. Smith' },
            { label: 'Date *', key: 'date', type: 'date' },
            { label: 'Time *', key: 'time', type: 'time' },
            { label: 'Reason for Visit', key: 'reason', type: 'text', placeholder: 'e.g. Annual checkup' },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Priority</label>
            <div className="flex gap-2">
              {['normal', 'urgent', 'emergency'].map(p => (
                <button
                  key={p} type="button"
                  onClick={() => setForm({ ...form, priority: p })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold capitalize transition-all border ${
                    form.priority === p
                      ? p === 'emergency' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : p === 'urgent' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Save Changes' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
