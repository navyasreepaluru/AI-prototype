import React from 'react';

export default function RiskGauge({ score, category }) {
  const normalizedScore = Math.min(Math.max(score || 0, 0), 100);

  const getColor = (cat) => {
    switch (cat) {
      case 'Critical':
        return { bar: 'bg-gradient-to-r from-orange-500 to-rose-600', text: 'text-rose-400', glow: 'shadow-rose-500/30' };
      case 'High':
        return { bar: 'bg-gradient-to-r from-amber-500 to-orange-500', text: 'text-orange-400', glow: 'shadow-orange-500/30' };
      case 'Medium':
        return { bar: 'bg-gradient-to-r from-yellow-400 to-amber-500', text: 'text-amber-400', glow: 'shadow-amber-500/30' };
      case 'Low':
        return { bar: 'bg-gradient-to-r from-teal-400 to-emerald-500', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' };
      default:
        return { bar: 'bg-slate-500', text: 'text-slate-400', glow: 'shadow-slate-500/30' };
    }
  };

  const style = getColor(category);

  return (
    <div className="bg-[#0c1222] border border-[#1e293b] rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
      {/* Background ambient gradient */}
      <div className={`absolute inset-0 opacity-10 blur-xl ${style.bar}`} />

      <div className="relative z-10">
        <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-2">
          Calculated Threat Index
        </div>
        <div className="flex items-baseline justify-center gap-1 my-3">
          <span className={`text-6xl font-black font-mono tracking-tight ${style.text}`}>
            {normalizedScore}
          </span>
          <span className="text-slate-500 text-xl font-mono">/100</span>
        </div>

        <div className="text-sm font-semibold tracking-wide uppercase mt-1 mb-4">
          <span className={`${style.text} px-3 py-1 rounded-full bg-slate-900/60 border border-slate-700/60`}>
            {category || 'Evaluated'} Level
          </span>
        </div>

        {/* Progress Bar with markers */}
        <div className="w-full bg-slate-800/80 rounded-full h-3 p-0.5 overflow-hidden border border-slate-700/40">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out shadow-md ${style.bar}`}
            style={{ width: `${Math.max(normalizedScore, 4)}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 px-1">
          <span>0 (Safe)</span>
          <span>25 (Low)</span>
          <span>55 (Med)</span>
          <span>80 (High)</span>
          <span>100 (Critical)</span>
        </div>
      </div>
    </div>
  );
}
