import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

export default function RiskBadge({ category, score, size = 'md' }) {
  const configs = {
    Low: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      icon: ShieldCheck,
      label: 'Low Risk',
      dot: 'bg-emerald-400'
    },
    Medium: {
      bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
      icon: AlertTriangle,
      label: 'Medium Risk',
      dot: 'bg-amber-400'
    },
    High: {
      bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
      icon: AlertTriangle,
      label: 'High Risk',
      dot: 'bg-orange-400'
    },
    Critical: {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      icon: AlertOctagon,
      label: 'Critical Risk',
      dot: 'bg-rose-400'
    },
    Inconclusive: {
      bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
      icon: HelpCircle,
      label: 'Inconclusive',
      dot: 'bg-slate-400'
    }
  };

  const conf = configs[category] || configs.Inconclusive;
  const Icon = conf.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold'
  }[size] || 'text-sm px-2.5 py-1 gap-1.5';

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${conf.bg} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} animate-pulse`} />
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>{conf.label}</span>
      {score !== undefined && score !== null && (
        <span className="opacity-80 font-mono text-[11px]">({score}/100)</span>
      )}
    </span>
  );
}
