import { ReactNode } from 'react';
import clsx from 'clsx';

interface KPICardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  color?: string;
  variant?: 'default' | 'primary';
  critical?: boolean;
}

export default function KPICard({ title, value, sub, icon, color = '#f59e0b', variant = 'default', critical }: KPICardProps) {
  const isPrimary = variant === 'primary';
  
  return (
    <div className={clsx(
      "noc-card p-6 relative overflow-hidden flex flex-col justify-between transition-colors duration-200",
      isPrimary ? "bg-noc-primary text-white dark:bg-[#1a2b4c]" : "bg-white text-slate-800 dark:bg-[#1e293b] dark:text-slate-100",
      critical && !isPrimary && "border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
    )}>
      
      <div className="flex items-start justify-between">
        <div>
          <h3 className={clsx("text-sm font-medium mb-2", isPrimary ? "text-slate-200" : "text-slate-500 dark:text-slate-400")}>{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight">{value}</span>
          </div>
        </div>
        <div className={clsx("p-2.5 rounded-xl", isPrimary ? "bg-white/10" : "bg-orange-50 dark:bg-orange-500/10")} style={!isPrimary ? { color: color } : { color: 'white' }}>
          {icon}
        </div>
      </div>
      
      {sub && (
        <div className={clsx("text-xs font-medium mt-4", isPrimary ? "text-slate-300" : "text-slate-400 dark:text-slate-500")}>
          {sub}
        </div>
      )}
    </div>
  );
}
