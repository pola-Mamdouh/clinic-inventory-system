import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'teal', delay = 0 }) {
  const colorMap = {
    teal:   { bg: 'from-teal-500/20 to-teal-600/5', icon: 'bg-teal-500/20 text-teal-400', border: 'border-teal-500/10' },
    cyan:   { bg: 'from-cyan-500/20 to-cyan-600/5',  icon: 'bg-cyan-500/20 text-cyan-400',  border: 'border-cyan-500/10' },
    violet: { bg: 'from-violet-500/20 to-violet-600/5', icon: 'bg-violet-500/20 text-violet-400', border: 'border-violet-500/10' },
    amber:  { bg: 'from-amber-500/20 to-amber-600/5',  icon: 'bg-amber-500/20 text-amber-400',  border: 'border-amber-500/10' },
    red:    { bg: 'from-red-500/20 to-red-600/5',   icon: 'bg-red-500/20 text-red-400',   border: 'border-red-500/10' },
    emerald:{ bg: 'from-emerald-500/20 to-emerald-600/5', icon: 'bg-emerald-500/20 text-emerald-400', border: 'border-emerald-500/10' },
  };

  const c = colorMap[color] || colorMap.teal;
  const isPositive = trend > 0;

  return (
    <div
      className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-5 animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="font-display text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      {trendLabel && <p className="text-slate-600 text-xs mt-1">{trendLabel}</p>}
    </div>
  );
}
