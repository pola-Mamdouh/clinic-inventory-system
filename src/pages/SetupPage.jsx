import { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Users, Calendar, Package, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../components/layout/Header';
import { seedDatabase } from '../firebase/seeder';

const COLLECTIONS = [
  { key: 'patients',     icon: Users,     label: 'Patients',     desc: '5 sample patients with full profiles', color: 'teal' },
  { key: 'appointments', icon: Calendar,  label: 'Appointments', desc: "5 appointments including today's schedule", color: 'cyan' },
  { key: 'inventory',    icon: Package,   label: 'Inventory',    desc: '10 items — 3 intentionally low stock to demo alerts', color: 'violet' },
];

const COLOR_MAP = {
  teal:   { icon: 'bg-teal-500/20 text-teal-400', border: 'border-teal-500/20' },
  cyan:   { icon: 'bg-cyan-500/20 text-cyan-400',   border: 'border-cyan-500/20' },
  violet: { icon: 'bg-violet-500/20 text-violet-400', border: 'border-violet-500/20' },
};

export default function SetupPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | running | done | error
  const [progress, setProgress] = useState('');
  const [results, setResults] = useState(null);

  const runSeed = async () => {
    setStatus('running');
    setProgress('Connecting to Firestore...');
    try {
      const res = await seedDatabase((msg) => setProgress(msg));
      setResults(res);
      setStatus('done');
      toast.success('Database seeded successfully!');
    } catch (err) {
      setStatus('error');
      toast.error('Seeding failed: ' + err.message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="Database Setup" subtitle="One-click data seeder" />

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

          {/* Hero card */}
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-1">Seed Sample Data</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Populates your Firestore database with realistic demo data — patients, appointments,
                  and inventory items. Collections are only created if they don't already exist.
                </p>
              </div>
            </div>
          </div>

          {/* What will be created */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What gets seeded</p>
            {COLLECTIONS.map(({ key, icon: Icon, label, desc, color }) => {
              const c = COLOR_MAP[color];
              const skipped  = results?.skipped?.includes(key);
              const created  = results && !skipped;
              return (
                <div key={key} className={`flex items-center gap-4 bg-navy-900 border ${c.border} rounded-xl px-5 py-4`}>
                  <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  {status === 'done' && (
                    skipped
                      ? <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-medium">Already exists</span>
                      : <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Created
                        </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress */}
          {status === 'running' && (
            <div className="flex items-center gap-3 bg-navy-900 border border-white/5 rounded-xl px-5 py-4 animate-fade-in">
              <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-slate-300">{progress}</p>
            </div>
          )}

          {/* Success summary */}
          {status === 'done' && results && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-4 animate-bounce-in">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-300">Seeding complete</p>
              </div>
              <div className="text-xs text-emerald-400/70 space-y-1">
                {results.patients > 0 && <p>✓ {results.patients} patients created</p>}
                {results.appointments > 0 && <p>✓ {results.appointments} appointments created</p>}
                {results.inventory > 0 && <p>✓ {results.inventory} inventory items created</p>}
                {results.skipped.length > 0 && (
                  <p className="text-amber-400/70">⚠ Skipped (already had data): {results.skipped.join(', ')}</p>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-4">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Seeding failed</p>
                <p className="text-xs text-red-400/70 mt-1">Check that your Firebase config is correct and Firestore is enabled.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {status !== 'done' ? (
              <button
                onClick={runSeed}
                disabled={status === 'running'}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-glow-teal disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === 'running' ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {status === 'running' ? 'Seeding...' : 'Seed Database Now'}
              </button>
            ) : (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-glow-teal"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {status !== 'running' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all text-sm font-medium"
              >
                Skip
              </button>
            )}
          </div>

          <p className="text-xs text-slate-600">
            This page is only needed once. After seeding, all data is managed directly through the app's forms.
          </p>
        </div>
      </div>
    </div>
  );
}
