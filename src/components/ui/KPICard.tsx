import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  title: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: string;
  accent?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  critical?: boolean;
}

export default function KPICard({ title, value, sub, icon: Icon, color = '#3b82f6', accent, trend, trendLabel, critical }: Props) {
  return (
    <div className={clsx('noc-card p-4 flex flex-col gap-3 relative overflow-hidden transition-all duration-200 cursor-default',
      critical && 'border-red-600/40 shadow-red-900/20 shadow-lg')}
      style={accent ? { borderColor: `${color}40` } : {}}>

      {/* Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ background: color, transform:'translate(30%, -30%)' }} />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ background:`${color}18` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-xs font-medium" style={{ color:'#6b8bb5' }}>{title}</span>
        </div>
        {critical && (
          <span className="text-xs px-1.5 py-0.5 rounded font-mono dot-critical text-white" style={{ fontSize:10 }}>
            CRÍTICO
          </span>
        )}
      </div>

      <div>
        <div className="stat-value" style={{ color: critical ? '#ef4444' : color }}>{value}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>{sub}</div>}
      </div>

      {trendLabel && (
        <div className={clsx('text-xs flex items-center gap-1', trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400')}>
          <span>{trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}</span>
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}
