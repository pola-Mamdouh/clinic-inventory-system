const VARIANTS = {
  success:  'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  warning:  'bg-amber-500/15 text-amber-400 border-amber-500/20',
  danger:   'bg-red-500/15 text-red-400 border-red-500/20',
  info:     'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  purple:   'bg-violet-500/15 text-violet-400 border-violet-500/20',
  default:  'bg-slate-500/15 text-slate-400 border-slate-500/20',
};

export default function Badge({ variant = 'default', children, dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${VARIANTS[variant]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
