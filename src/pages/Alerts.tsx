import { useState } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, Filter } from 'lucide-react';
import { useAlerts } from '../hooks/useData';
import { api } from '../api/client';
import type { Alert, AlertSeverity } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

const SEV: Record<AlertSeverity, { color: string; bg: string; icon: JSX.Element; label: string }> = {
  critical: { color:'#ef4444', bg:'#ef444415', icon:<AlertTriangle size={14} style={{ color:'#ef4444' }} />, label:'Crítico' },
  warning:  { color:'#f59e0b', bg:'#f59e0b15', icon:<AlertTriangle size={14} style={{ color:'#f59e0b' }} />, label:'Advertencia' },
  info:     { color:'#3b82f6', bg:'#3b82f615', icon:<Info size={14} style={{ color:'#3b82f6' }} />,          label:'Info' },
};

export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | AlertSeverity | 'unack'>('unack');
  const [acking, setAcking] = useState<string | null>(null);

  const counts = {
    all:      (alerts ?? []).length,
    unack:    (alerts ?? []).filter(a => !a.acknowledged).length,
    critical: (alerts ?? []).filter(a => a.severity === 'critical').length,
    warning:  (alerts ?? []).filter(a => a.severity === 'warning').length,
    info:     (alerts ?? []).filter(a => a.severity === 'info').length,
  };

  const filtered = (alerts ?? []).filter(a => {
    if (filter === 'unack') return !a.acknowledged;
    if (filter === 'all')   return true;
    return a.severity === filter;
  });

  const ack = async (id: string) => {
    setAcking(id);
    try {
      await api.acknowledgeAlert(id);
      qc.invalidateQueries({ queryKey: ['alerts'] });
    } finally {
      setAcking(null);
    }
  };

  const ackAll = async () => {
    const unack = (alerts ?? []).filter(a => !a.acknowledged);
    for (const a of unack) await ack(a.id);
  };

  const FILTERS = [
    { key:'unack',    label:'Sin reconocer', count: counts.unack,    color:'#ef4444' },
    { key:'all',      label:'Todas',          count: counts.all,      color:'#6b8bb5' },
    { key:'critical', label:'Críticas',       count: counts.critical, color:'#ef4444' },
    { key:'warning',  label:'Advertencias',   count: counts.warning,  color:'#f59e0b' },
    { key:'info',     label:'Informativas',   count: counts.info,     color:'#3b82f6' },
  ] as const;

  return (
    <div className="space-y-4 card-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Centro de Alertas</h1>
          <p className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>
            Eventos y notificaciones de red — PUCESE
          </p>
        </div>
        {counts.unack > 0 && (
          <button onClick={ackAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
            style={{ background:'#10b98115', color:'#10b981', border:'1px solid #10b98130' }}>
            <CheckCheck size={13} /> Reconocer todas ({counts.unack})
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Sin Reconocer</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#ef4444' }}>{counts.unack}</div>
        </div>
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Críticas</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#ef4444' }}>{counts.critical}</div>
        </div>
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Advertencias</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#f59e0b' }}>{counts.warning}</div>
        </div>
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Informativas</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#3b82f6' }}>{counts.info}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} style={{ color:'#4b7ab5' }} />
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: filter === f.key ? `${f.color}20` : '#0d1526',
              color: filter === f.key ? f.color : '#4b7ab5',
              border: `1px solid ${filter === f.key ? `${f.color}50` : '#1e3460'}`,
            }}>
            {f.label}
            <span className="font-mono px-1 rounded" style={{ background:`${f.color}20`, color: f.color }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="noc-card p-8 text-center text-sm" style={{ color:'#4b7ab5' }}>Cargando alertas...</div>
      ) : filtered.length === 0 ? (
        <div className="noc-card p-12 text-center">
          <CheckCheck size={32} style={{ color:'#10b981', margin:'0 auto 12px' }} />
          <div className="text-sm font-medium text-white">Sin alertas activas</div>
          <div className="text-xs mt-1" style={{ color:'#4b7ab5' }}>La red opera normalmente</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a: Alert) => {
            const s = SEV[a.severity];
            return (
              <div key={a.id}
                className="noc-card p-4 transition-all duration-200"
                style={{ opacity: a.acknowledged ? 0.55 : 1, borderColor: a.acknowledged ? undefined : `${s.color}30` }}>
                <div className="flex items-start gap-4">
                  {/* Severity icon */}
                  <div className="flex-shrink-0 p-2 rounded-lg mt-0.5" style={{ background: s.bg }}>
                    {s.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                            style={{ background: s.bg, color: s.color, border:`1px solid ${s.color}30` }}>
                            {s.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background:'#1e346030', color:'#6b8bb5' }}>
                            {a.category}
                          </span>
                          {a.building && (
                            <span className="text-xs" style={{ color:'#374d6b' }}>📍 {a.building}</span>
                          )}
                          {a.acknowledged && (
                            <span className="text-xs flex items-center gap-1" style={{ color:'#10b981' }}>
                              <CheckCheck size={10} /> Reconocida
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-sm text-white mt-1.5">{a.message}</div>
                        {a.detail && (
                          <div className="text-xs mt-1" style={{ color:'#6b8bb5' }}>{a.detail}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color:'#4b7ab5' }}>
                          <span className="font-mono">{a.device}</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(a.timestamp), { addSuffix:true, locale:es })}</span>
                          <span style={{ color:'#2a3f6e' }}>
                            {format(new Date(a.timestamp), "dd/MM/yyyy HH:mm:ss")}
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      {!a.acknowledged && (
                        <button onClick={() => ack(a.id)} disabled={acking === a.id}
                          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
                          style={{ background:'#10b98115', color:'#10b981', border:'1px solid #10b98130' }}>
                          <CheckCheck size={12} />
                          {acking === a.id ? '...' : 'Reconocer'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
