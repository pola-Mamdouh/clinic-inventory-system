import { useState, useEffect } from 'react';
import {
  UserCog, Plus, Stethoscope, Mail, ShieldAlert,
  Eye, EyeOff, Trash2, RefreshCw, BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import { getDoctors } from '../firebase/users';
import { createDoctor, removeDoctorProfile } from '../firebase/admin';

const SPECIALTIES = [
  'General Practice',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'Ophthalmology',
  'ENT (Ear, Nose & Throat)',
  'Psychiatry',
  'Radiology',
  'Anesthesiology',
  'Emergency Medicine',
  'Other',
];

const EMPTY_FORM = {
  name: '', email: '', password: '', confirmPassword: '', specialty: '',
};

// Generate a deterministic avatar gradient from the doctor's name
const avatarGradient = (name = '') => {
  const colors = [
    'from-teal-500 to-cyan-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-green-600',
  ];
  const idx = (name.charCodeAt(0) || 0) % colors.length;
  return colors[idx];
};

const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

export default function AdminPage() {
  const [doctors, setDoctors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deletingId, setDeletingId]   = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setDoctors(await getDoctors());
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const closeModal = () => { setModalOpen(false); setForm(EMPTY_FORM); setShowPw(false); setShowConfirm(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, specialty } = form;

    if (!name.trim())     { toast.error('Full name is required');     return; }
    if (!email.trim())    { toast.error('Email is required');          return; }
    if (!specialty)       { toast.error('Please select a specialty'); return; }
    if (!password)        { toast.error('Password is required');       return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSaving(true);
    try {
      const doc = await createDoctor({ name: name.trim(), email: email.trim(), password, specialty });
      toast.success(`Dr. ${doc.name} registered successfully`);
      closeModal();
      await load();
    } catch (err) {
      toast.error(err.message || 'Failed to create doctor account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doctor) => {
    if (!confirm(`Remove Dr. ${doctor.name}'s access?\n\nThis will delete their profile from the system. They will no longer be able to log in.`)) return;
    setDeletingId(doctor.id);
    try {
      await removeDoctorProfile(doctor.id);
      toast.success(`${doctor.name} removed`);
      setDoctors(d => d.filter(x => x.id !== doctor.id));
    } catch {
      toast.error('Failed to remove doctor');
    } finally {
      setDeletingId(null);
    }
  };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="flex flex-col h-full">
      <Header title="Doctor Management" subtitle="Register and manage doctor accounts" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">

        {/* ── Stats + actions row ────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Stat card */}
          <div className="flex items-center gap-4 bg-navy-900 border border-white/5 rounded-2xl px-5 py-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Registered Doctors</p>
              <p className="text-2xl font-bold text-white font-display">
                {loading ? '—' : doctors.length}
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-glow-teal"
          >
            <Plus className="w-4 h-4" />
            Add New Doctor
          </button>
        </div>

        {/* ── Doctor list ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <UserCog className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-300 font-semibold mb-1">No doctors registered yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Click "Add New Doctor" to create the first doctor account.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-semibold rounded-xl transition-all shadow-glow-teal"
            >
              <Plus className="w-4 h-4" />
              Add First Doctor
            </button>
          </div>
        ) : (
          <div className="bg-navy-900 border border-white/5 rounded-2xl overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Doctor', 'Specialty', 'Email', 'Doctor ID', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {doctors.map((doc, i) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-white/[0.02] transition-colors animate-slide-up"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      {/* Doctor name + avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarGradient(doc.name)} flex items-center justify-center flex-shrink-0 text-xs font-bold text-white`}>
                            {initials(doc.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{doc.name || '—'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <BadgeCheck className="w-3 h-3 text-teal-400" />
                              <span className="text-xs text-teal-400 font-medium">Doctor</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="px-5 py-4">
                        {doc.specialty ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400">
                            {doc.specialty}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{doc.email}</span>
                        </div>
                      </td>

                      {/* Doctor ID (UID) */}
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-slate-500 bg-white/5 px-2 py-1 rounded-lg">
                          {doc.id.slice(0, 8)}…
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all disabled:opacity-40"
                          title="Remove doctor access"
                        >
                          {deletingId === doc.id
                            ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Info note ─────────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/80 leading-relaxed">
            Doctor accounts are created directly in Firebase Authentication. The password you set here
            is the doctor's initial login password. Removing a doctor here deletes their system profile —
            their Firebase Auth account remains but they will lose access on next login.
          </p>
        </div>
      </div>

      {/* ── Add Doctor Modal ───────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={closeModal} title="Register New Doctor" size="md">
        <form onSubmit={handleSave} className="space-y-4">

          {/* Full Name */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Dr. Jane Smith"
              autoFocus
              className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="jane.smith@clinic.com"
              className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
            />
          </div>

          {/* Specialty */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
              Specialty <span className="text-red-400">*</span>
            </label>
            <select
              value={form.specialty}
              onChange={e => set('specialty', e.target.value)}
              className="w-full bg-navy-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
            >
              <option value="">Select specialty…</option>
              {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
              Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">
              Confirm Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
                className={`w-full bg-navy-800 border text-white placeholder-slate-600 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none transition-all ${
                  form.confirmPassword && form.password !== form.confirmPassword
                    ? 'border-red-500/50 focus:border-red-500/70'
                    : form.confirmPassword && form.password === form.confirmPassword
                    ? 'border-teal-500/50'
                    : 'border-white/10 focus:border-teal-500/50'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {saving && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {saving ? 'Creating Account…' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
