import { useState, useEffect } from 'react';
import { Minus, Plus, Package, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import { getInventory } from '../../firebase/inventory';
import { consumeInventoryItems } from '../../firebase/inventory';
import { addExamination } from '../../firebase/examinations';
import { updateAppointment } from '../../firebase/appointments';

export default function ExaminationModal({ open, onClose, appointment, onComplete }) {
  const [inventory, setInventory] = useState([]);
  const [selected, setSelected] = useState({});
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'confirm' | 'success'

  useEffect(() => {
    if (open) {
      setLoading(true);
      setSelected({});
      setDiagnosis('');
      setPrescription('');
      setNotes('');
      setStep('form');
      getInventory()
        .then(items => setInventory(items.filter(i => i.quantity > 0)))
        .finally(() => setLoading(false));
    }
  }, [open]);

  const adjust = (id, delta) => {
    setSelected(prev => {
      const max = inventory.find(i => i.id === id)?.quantity || 0;
      const current = prev[id] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      if (next === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  };

  const usedItems = Object.entries(selected).map(([id, quantity]) => ({ id, quantity }));
  const usedCount = usedItems.reduce((s, i) => s + i.quantity, 0);

  const handleSubmit = async () => {
    if (!diagnosis.trim()) { toast.error('Please enter a diagnosis'); return; }
    setSubmitting(true);
    try {
      // Step 1: Atomic inventory decrement
      if (usedItems.length > 0) {
        await consumeInventoryItems(usedItems);
      }

      // Step 2: Save examination record
      await addExamination({
        appointmentId: appointment?.id,
        patientName: appointment?.patientName,
        doctorName: appointment?.doctorName,
        diagnosis,
        prescription,
        notes,
        usedSupplies: usedItems.map(item => ({
          ...item,
          name: inventory.find(i => i.id === item.id)?.name || item.id,
        })),
      });

      // Step 3: Mark appointment as completed
      if (appointment?.id) {
        await updateAppointment(appointment.id, { status: 'completed' });
      }

      setStep('success');
      toast.success('Examination completed & inventory updated!');
      setTimeout(() => { onComplete?.(); onClose(); }, 1800);
    } catch (err) {
      toast.error(err.message || 'Failed to complete examination');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Conduct Examination" size="xl">
      {step === 'success' ? (
        <div className="flex flex-col items-center py-10 animate-bounce-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-1">Examination Complete</h3>
          <p className="text-slate-400 text-sm">Inventory updated via atomic transaction</p>
          {usedCount > 0 && (
            <div className="mt-4 flex items-center gap-2 px-4 py-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
              <Zap className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-300">{usedCount} supply unit(s) consumed</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Patient info banner */}
          {appointment && (
            <div className="bg-navy-800 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{appointment.patientName}</p>
                <p className="text-xs text-slate-400">{appointment.reason} · {appointment.date} {appointment.time}</p>
              </div>
              <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg font-medium">In Progress</span>
            </div>
          )}

          {/* Clinical notes */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Diagnosis *</label>
              <textarea
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                rows={2}
                placeholder="Enter diagnosis..."
                className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Prescription</label>
              <textarea
                value={prescription}
                onChange={e => setPrescription(e.target.value)}
                rows={2}
                placeholder="Prescribed medications & dosage..."
                className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 resize-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider font-medium">Doctor's Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                placeholder="Additional observations..."
                className="w-full bg-navy-800 border border-white/10 text-white placeholder-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-500/50 resize-none transition-all"
              />
            </div>
          </div>

          {/* Supplies selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-semibold text-white">Used Supplies & Medicines</h3>
              </div>
              {usedCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2.5 py-1 rounded-lg">
                  <Zap className="w-3 h-3" />
                  {usedCount} units selected
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">No items in stock</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {inventory.map(item => {
                  const qty = selected[item.id] || 0;
                  const isLow = item.quantity <= (item.lowStockThreshold || 5);
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        qty > 0
                          ? 'bg-teal-500/10 border-teal-500/30'
                          : 'bg-navy-800 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium text-white truncate">{item.name}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs text-slate-500">Stock: {item.quantity} {item.unit}</span>
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => adjust(item.id, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`w-7 text-center text-sm font-bold ${qty > 0 ? 'text-teal-400' : 'text-slate-500'}`}>
                          {qty}
                        </span>
                        <button
                          onClick={() => adjust(item.id, 1)}
                          disabled={qty >= item.quantity}
                          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center disabled:opacity-30 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Atomic transaction note */}
          {usedCount > 0 && (
            <div className="flex items-start gap-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
              <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-300/80">
                <span className="font-semibold text-amber-400">Atomic Transaction:</span> All inventory quantities will be decremented simultaneously. If any item runs out mid-transaction, the entire operation is rolled back.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !diagnosis.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center gap-2 shadow-glow-teal"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Complete Examination
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
