import { useState, useEffect } from 'react';
import {
  History, ClipboardList, Pill, FileText, Package,
  Stethoscope, Calendar, Clock, User,
} from 'lucide-react';
import Modal from '../ui/Modal';
import { getPatientExaminations } from '../../firebase/examinations';

/**
 * Full medical-history viewer for a patient.
 *
 * Props
 * ─────
 * open     — boolean
 * onClose  — () => void
 * patient  — patient document object { id, firstName, lastName, bloodType, gender, notes, … }
 */
export default function PatientHistoryModal({ open, onClose, patient }) {
  const [exams, setExams]   = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && patient?.id) {
      setLoading(true);
      getPatientExaminations(patient.id)
        .then(setExams)
        .catch(() => setExams([]))
        .finally(() => setLoading(false));
    }
  }, [open, patient?.id]);

  const formatDate = (exam) => {
    if (exam.date) return exam.date;
    if (exam.createdAt?.seconds) {
      return new Date(exam.createdAt.seconds * 1000).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    }
    return '—';
  };

  const BLOOD_COLOR = {
    'A+': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'A-': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    'B+': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'B-': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'O+': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    'O-': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    'AB+': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    'AB-': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Medical History"
      size="lg"
    >
      {!patient ? null : (
        <div className="space-y-5">

          {/* ── Patient summary card ────────────���──────────────────────── */}
          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/30 to-purple-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-base flex-shrink-0">
                {patient.firstName?.[0]}{patient.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-white">{patient.firstName} {patient.lastName}</p>
                <p className="text-xs text-slate-400">{patient.gender || '—'} · DOB: {patient.dateOfBirth || '—'}</p>
              </div>
              {patient.bloodType && (
                <span className={`text-sm font-bold px-3 py-1.5 rounded-xl border font-mono ${BLOOD_COLOR[patient.bloodType] || 'text-slate-400 bg-white/5 border-white/10'}`}>
                  {patient.bloodType}
                </span>
              )}
            </div>

            {/* Allergies / chronic conditions from patient notes */}
            {patient.notes && (
              <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider mt-0.5 flex-shrink-0">⚠ Notes</span>
                <p className="text-xs text-amber-300/90 leading-relaxed">{patient.notes}</p>
              </div>
            )}
          </div>

          {/* ── Visit count header ─────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">Examination Records</span>
            </div>
            {!loading && (
              <span className="text-xs text-slate-500">
                {exams.length === 0 ? 'No records' : `${exams.length} visit${exams.length > 1 ? 's' : ''}`}
              </span>
            )}
          </div>

          {/* ── Records list ──────────────────────────────────────────── */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : exams.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-600">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-3">
                <Stethoscope className="w-6 h-6 opacity-30" />
              </div>
              <p className="text-sm font-medium text-slate-500">No examination records yet</p>
              <p className="text-xs text-slate-600 mt-1">Records will appear here after the doctor completes an examination</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {exams.map((exam, idx) => (
                <div
                  key={exam.id}
                  className="bg-navy-800/60 border border-white/6 rounded-2xl overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold flex-shrink-0">
                        {exams.length - idx}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span className="text-xs font-semibold text-white">{formatDate(exam)}</span>
                          {exam.time && (
                            <>
                              <Clock className="w-3 h-3 text-slate-600" />
                              <span className="text-xs text-slate-500">{exam.time}</span>
                            </>
                          )}
                        </div>
                        {exam.reason && (
                          <p className="text-[11px] text-slate-500 mt-0.5 italic">Re: {exam.reason}</p>
                        )}
                      </div>
                    </div>
                    {exam.doctorName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User className="w-3 h-3" />
                        {exam.doctorName}
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="px-4 py-3 space-y-2.5">
                    {/* Diagnosis */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-teal-500/15 border border-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ClipboardList className="w-3 h-3 text-teal-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-teal-400 uppercase tracking-wider font-semibold mb-0.5">Diagnosis</p>
                        <p className="text-sm text-white leading-relaxed">{exam.diagnosis}</p>
                      </div>
                    </div>

                    {/* Prescription */}
                    {exam.prescription && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Pill className="w-3 h-3 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold mb-0.5">Prescription</p>
                          <p className="text-sm text-slate-300 leading-relaxed">{exam.prescription}</p>
                        </div>
                      </div>
                    )}

                    {/* Doctor's notes */}
                    {exam.notes && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText className="w-3 h-3 text-violet-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-violet-400 uppercase tracking-wider font-semibold mb-0.5">Doctor's Notes</p>
                          <p className="text-sm text-slate-400 leading-relaxed">{exam.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Used supplies */}
                    {exam.usedSupplies?.length > 0 && (
                      <div className="flex items-start gap-2.5">
                        <div className="w-5 h-5 rounded-md bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Package className="w-3 h-3 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-1">Supplies Used</p>
                          <div className="flex flex-wrap gap-1.5">
                            {exam.usedSupplies.map((s, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium"
                              >
                                {s.name} <span className="text-amber-500">×{s.quantity}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
