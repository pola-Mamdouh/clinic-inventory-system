import { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, Phone, Mail, History, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import SearchBar from '../components/ui/SearchBar';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import PatientHistoryModal from '../components/patients/PatientHistoryModal';
import FieldError from '../components/ui/FieldError';
import { getPatients, addPatient, updatePatient, deletePatient } from '../firebase/patients';
import { useFormValidation } from '../hooks/useFormValidation';
import { required, email as emailRule, egyptianPhone, inputCls } from '../utils/validators';

const PATIENT_SCHEMA = {
  firstName: [required('First name is required')],
  lastName:  [required('Last name is required')],
  email:     [emailRule()],
  phone:     [egyptianPhone()],
};

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', gender: '', bloodType: '', address: '', notes: ''
};

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);

  const { errors, submitted, validateField, validateAll, resetValidation } = useFormValidation(PATIENT_SCHEMA);

  const load = async () => {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); resetValidation(); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); resetValidation(); setModalOpen(true); };
  // Always reset form on close — prevents stale data appearing in the next "New Patient" modal
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(EMPTY_FORM); resetValidation(); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateAll(form)) return;
    setSaving(true);
    try {
      if (editing) {
        // Strip non-data fields (id, createdAt) — sending them back would overwrite createdAt
        // with a client-side value and is generally unsafe.
        const { id: _id, createdAt: _createdAt, ...updateData } = form;
        await updatePatient(editing.id, updateData);
        toast.success('Patient updated');
      } else {
        await addPatient(form);
        toast.success('Patient registered');
      }
      await load();
      closeModal();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this patient?')) return;
    try {
      await deletePatient(id);
      toast.success('Patient deleted');
      setPatients(p => p.filter(x => x.id !== id));
    } catch {
      toast.error('Delete failed');
    }
  };

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName} ${p.email} ${p.phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const genderBadge = g => g === 'Male' ? 'info' : g === 'Female' ? 'purple' : 'default';

  return (
    <div className="flex flex-col h-full">
      <Header title="Patients" subtitle="Manage registered patients" />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, phone..." />
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-glow-teal"
          >
            <Plus className="w-4 h-4" />
            New Patient
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: patients.length, color: 'text-teal-400' },
            { label: 'Male', value: patients.filter(p => p.gender === 'Male').length, color: 'text-cyan-400' },
            { label: 'Female', value: patients.filter(p => p.gender === 'Female').length, color: 'text-violet-400' },
            { label: 'Today', value: patients.filter(p => {
              const d = p.createdAt?.toDate?.();
              return d && new Date(d).toDateString() === new Date().toDateString();
            }).length, color: 'text-amber-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-navy-900 border border-white/5 rounded-xl px-4 py-3 text-center">
              <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={UserCircle} title="No patients found" description="Register a new patient to get started." />
        ) : (
          <div className="bg-navy-900 border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Patient', 'Contact', 'Gender', 'Blood Type', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((p, i) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center text-teal-400 text-sm font-bold flex-shrink-0">
                            {p.firstName?.[0]}{p.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{p.firstName} {p.lastName}</p>
                            {p.dateOfBirth && <p className="text-xs text-slate-500">DOB: {p.dateOfBirth}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {p.email && <div className="flex items-center gap-1.5 text-xs text-slate-400"><Mail className="w-3 h-3" />{p.email}</div>}
                        {p.phone && <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5"><Phone className="w-3 h-3" />{p.phone}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={genderBadge(p.gender)}>{p.gender || '—'}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm text-slate-300">{p.bloodType || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setHistoryPatient(p)}
                            title="Medical History"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-violet-500/20 hover:text-violet-400 text-slate-400 transition-all"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => openEdit(p)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-teal-500/20 hover:text-teal-400 text-slate-400 transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Medical history viewer */}
      <PatientHistoryModal
        open={!!historyPatient}
        onClose={() => setHistoryPatient(null)}
        patient={historyPatient}
      />

      {/* Add / edit modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Patient' : 'Register Patient'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'First Name *', key: 'firstName', type: 'text' },
              { label: 'Last Name *', key: 'lastName', type: 'text' },
              { label: 'Email', key: 'email', type: 'email' },
              { label: 'Phone', key: 'phone', type: 'tel', placeholder: '01XXXXXXXXX' },
              { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
              { label: 'Address', key: 'address', type: 'text' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={e => {
                    let val = e.target.value;
                    // Phone: strip non-digits and cap at 11 characters
                    if (key === 'phone') {
                      val = val.replace(/\D/g, '').slice(0, 11);
                      setForm({ ...form, [key]: val });
                      validateField('phone', val);
                    } else {
                      setForm({ ...form, [key]: val });
                      // Only re-validate fields with rules after first submit attempt
                      if (submitted && PATIENT_SCHEMA[key]) validateField(key, val);
                    }
                  }}
                  className={inputCls(!!(errors[key]))}
                />
                <FieldError message={errors[key]} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Gender</label>
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}
                className="w-full bg-navy-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
              >
                <option value="">Select...</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Blood Type</label>
              <select
                value={form.bloodType}
                onChange={e => setForm({ ...form, bloodType: e.target.value })}
                className="w-full bg-navy-800 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all"
              >
                <option value="">Select...</option>
                {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Allergies, chronic conditions, etc."
              className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {editing ? 'Save Changes' : 'Register Patient'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
