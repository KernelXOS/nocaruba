import { useState } from 'react';
import { Wifi, Users, Bell, Network, Power, RotateCw, Activity, Terminal, Stethoscope, AlertTriangle, Check, X, ExternalLink, CheckCheck, Clock, Tag, MapPin, Cpu } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAPs, useAlerts, useBandwidth, useSwitches, useClients } from '../hooks/useData';
import { api } from '../api/client';
import type { AccessPoint, Alert } from '../types';
import { useThemeStore } from '../store/themeStore';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const { data: aps, isLoading: apsLoad, refetch: refetchAPs } = useAPs();
  const { data: alerts }  = useAlerts();
  const { data: bw }      = useBandwidth();
  const { data: switches } = useSwitches();
  const { data: clients }  = useClients();
  const { isDark } = useThemeStore();
  const qc = useQueryClient();
  
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [acking, setAcking] = useState(false);

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    color: isDark ? '#f8fafc' : '#334155',
    borderRadius: '8px',
    fontSize: '12px',
    backdropFilter: 'blur(8px)'
  };

  const apList      = aps ?? [];
  const onlineAPs   = apList.filter((a: AccessPoint) => a.status === 'online').length;
  const offlineAPs  = apList.filter((a: AccessPoint) => a.status === 'offline').length;
  const totalAPs    = apList.length;
  
  const swList      = switches ?? [];
  const onlineSw    = swList.filter((s: any) => s.status === 'online').length;
  const clientList  = clients ?? [];
  let wifiClients = clientList.filter((c: any) => c.type === 'wireless').length;
  if (wifiClients === 0 && apList.length > 0) {
    wifiClients = apList.reduce((sum: number, ap: AccessPoint) => sum + (ap.clients || 0), 0);
  }

  const unackAlerts = (alerts ?? []).filter((a: Alert) => !a.acknowledged);
  const critAlerts  = unackAlerts.filter((a: Alert) => a.severity === 'critical');

  const topApsByClients = [...apList].sort((a,b) => b.clients - a.clients).slice(0, 5);

  const handleAction = async (ap: AccessPoint, action: 'reboot' | 'power-off' | 'ping' | 'ssh' | 'diag') => {
    setPendingAction(`${ap.serial}-${action}`);
    
    // Simulate actions for new buttons
    if (action === 'ping' || action === 'ssh' || action === 'diag') {
      await new Promise(r => setTimeout(r, 800));
    } else if (action === 'reboot') {
      await api.rebootAP(ap.serial);
    } else {
      if (ap.lldpNeighbor && ap.lldpPort) {
        await api.toggleSwitchPort(ap.lldpNeighbor, ap.lldpPort, false);
      }
    }
    
    setPendingAction(null);
    if (action === 'reboot' || action === 'power-off') {
      refetchAPs();
    }
  };

  const ackAlert = async (alert: Alert) => {
    setAcking(true);
    try {
      await api.acknowledgeAlert(alert.id);
      qc.invalidateQueries({ queryKey: ['alerts'] });
      setSelectedAlert(null);
    } finally {
      setAcking(false);
    }
  };

  const SEV_STYLES = {
    critical: { color: '#ef4444', bg: 'var(--sev-critical-bg)', border: 'var(--sev-critical-border)', label: 'CRÍTICO', pulse: true },
    warning:  { color: '#f59e0b', bg: 'var(--sev-warning-bg)', border: 'var(--sev-warning-border)', label: 'ADVERTENCIA', pulse: false },
    info:     { color: '#3b82f6', bg: 'var(--sev-info-bg)', border: 'var(--sev-info-border)', label: 'INFORMATIVO', pulse: false },
  };

  if (apsLoad) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin glow-btn" />
      </div>
    );
  }

  return (
    <div className="space-y-6 card-enter pb-10">

      {/* ── Alert Detail Modal ─────────────────────────────────────── */}
      {selectedAlert && (() => {
        const sev = SEV_STYLES[selectedAlert.severity];
        const relatedAP = (aps ?? []).find(
          ap => ap.serial === selectedAlert.device ||
                ap.name.toLowerCase() === selectedAlert.device.toLowerCase() ||
                ap.ip === selectedAlert.device
        );
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSelectedAlert(null)}
          >
            <div
              className="relative w-full max-w-lg rounded-lg overflow-hidden card-enter"
              style={{ background: 'var(--panel)', border: `1px solid ${sev.border}`, boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${sev.border}`, background: sev.bg }}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${sev.pulse ? 'animate-pulse' : ''}`} style={{ background: sev.bg, border: `1px solid ${sev.border}` }}>
                    <AlertTriangle size={18} style={{ color: sev.color }} />
                  </div>
                  <div>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>
                      {sev.label}
                    </span>
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--muted)' }}>{selectedAlert.category}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-1.5 rounded-lg hover:opacity-70 transition-opacity" style={{ color: 'var(--muted)' }}>
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Message */}
                <div>
                  <p className="text-base font-semibold text-[color:var(--text)] leading-snug">{selectedAlert.message}</p>
                  {selectedAlert.detail && (
                    <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>{selectedAlert.detail}</p>
                  )}
                </div>

                {/* Device / Serial */}
                <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Cpu size={13} style={{ color: sev.color }} />
                    <span className="text-xs font-bold" style={{ color: 'var(--muted)' }}>DISPOSITIVO AFECTADO</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs mb-1" style={{ color: 'var(--dim)' }}>ID / Serial</p>
                      <p className="text-sm font-mono font-bold" style={{ color: sev.color }}>
                        {relatedAP?.serial || selectedAlert.device}
                      </p>
                    </div>
                    {relatedAP && (
                      <>
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--dim)' }}>Nombre</p>
                          <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>{relatedAP.name}</p>
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--dim)' }}>Modelo</p>
                          <p className="text-sm font-mono" style={{ color: 'var(--text-2)' }}>{relatedAP.model}</p>
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--dim)' }}>IP</p>
                          <p className="text-sm font-mono" style={{ color: '#3b82f6' }}>{relatedAP.ip}</p>
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--dim)' }}>Estado</p>
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{
                            background: relatedAP.status === 'online' ? 'var(--ok-bg)' : 'var(--sev-critical-bg)',
                            color: relatedAP.status === 'online' ? '#10b981' : '#ef4444',
                            border: `1px solid ${relatedAP.status === 'online' ? 'var(--ok-border)' : 'var(--sev-critical-border)'}`,
                          }}>
                            {relatedAP.status === 'online' ? '● Online' : '● Offline'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs mb-1" style={{ color: 'var(--dim)' }}>CPU / Temp</p>
                          <p className="text-sm font-mono" style={{ color: relatedAP.temperature >= 65 ? '#ef4444' : '#f59e0b' }}>
                            {relatedAP.cpuUsage}% · {relatedAP.temperature > 0 ? `${relatedAP.temperature}°C` : '—'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                  {selectedAlert.building && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} />
                      <span>{selectedAlert.building}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Tag size={11} />
                    <span>{selectedAlert.category}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} />
                    <span>{formatDistanceToNow(new Date(selectedAlert.timestamp), { addSuffix: true, locale: es })}</span>
                  </div>
                  <span style={{ color: 'var(--dim)' }}>
                    {format(new Date(selectedAlert.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                {!selectedAlert.acknowledged ? (
                  <button
                    onClick={() => ackAlert(selectedAlert)}
                    disabled={acking}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 disabled:opacity-50"
                    style={{ background: 'var(--ok-bg)', color: '#10b981', border: '1px solid var(--ok-border)' }}
                  >
                    <CheckCheck size={14} />
                    {acking ? 'Reconociendo...' : 'Reconocer alerta'}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
                    <CheckCheck size={14} /> Alerta reconocida
                  </div>
                )}
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--muted)' }}
                >
                  <ExternalLink size={12} /> Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Row 1: Dense KPIs ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="metric-box flex flex-col group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estado de Access Points</span>
            <Wifi size={16} className="text-slate-400 dark:text-[#777777]" />
          </div>
          <div className="flex gap-4 mt-auto">
            <div>
              <div className="text-xs text-slate-500 mb-1">Online</div>
              <div className="text-2xl font-bold text-[#10b981]">{onlineAPs}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Offline</div>
              <div className="text-2xl font-bold text-[#ef4444]">{offlineAPs}</div>
            </div>
          </div>
        </div>

        <div className="metric-box flex flex-col group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clientes Concurrentes</span>
            <Users size={16} className="text-slate-400 dark:text-[#777777]" />
          </div>
          <div className="mt-auto flex items-end gap-3">
            <div className="text-4xl font-bold text-slate-800 dark:text-slate-100">{wifiClients}</div>
            <div className="text-sm font-semibold text-slate-400 dark:text-[color:var(--muted)] mb-1">
              ≈ {onlineAPs > 0 ? Math.round(wifiClients / onlineAPs) : 0} por AP
            </div>
          </div>
        </div>

        <div className="metric-box flex flex-col group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Estado de Switches</span>
            <Network size={16} className="text-slate-400 dark:text-[#777777]" />
          </div>
          <div className="flex gap-4 mt-auto">
            <div>
              <div className="text-xs text-slate-500 mb-1">Operativos</div>
              <div className="text-2xl font-bold text-[#10b981]">{onlineSw}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Total</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{swList.length}</div>
            </div>
          </div>
        </div>

        <div className="metric-box flex flex-col group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Centro de Alertas</span>
            <Bell size={16} className={critAlerts.length > 0 ? "text-[#ef4444] animate-pulse-glow" : "text-slate-400"} />
          </div>
          <div className="flex gap-4 mt-auto">
            <div>
              <div className="text-xs text-slate-500 mb-1">Críticas</div>
              <div className="text-2xl font-bold text-[#ef4444]">{critAlerts.length}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 mb-1">Activas</div>
              <div className="text-2xl font-bold text-[#f59e0b]">{unackAlerts.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: Dense Line Charts ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        <div className="noc-card p-5">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Tráfico Global (Rx / Tx)</h3>
            <div className="flex gap-4 text-[11px] font-medium">
              <span className="text-[#ff8300] flex items-center gap-1">— Rx (Bajada)</span>
              <span className="text-[#10b981] flex items-center gap-1">— Tx (Subida)</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bw ?? []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="rx" stroke="#ff8300" strokeWidth={2.5} dot={false} isAnimationActive={true} />
                <Line type="monotone" dataKey="tx" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="noc-card p-5">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Clientes Concurrentes</h3>
            <div className="flex gap-4 text-[11px] font-medium">
              <span className="text-[#a855f7] flex items-center gap-1">— Dispositivos Activos</span>
            </div>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              {/* Using bw data as a mock for time series since we only have bw mock data generator */}
              <LineChart data={bw ?? []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} dy={10} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} domain={['dataMin - 100', 'dataMax + 100']} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="rx" stroke="#a855f7" strokeWidth={2.5} dot={false} isAnimationActive={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── Row 3: Data Table & Alerts ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Top APs Table with Interactive Buttons */}
        <div className="noc-card xl:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Access Points con mayor carga</h3>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="pb-3 pt-2 pl-3 font-medium">AP Nombre</th>
                  <th className="pb-3 pt-2 font-medium">Ubicación</th>
                  <th className="pb-3 pt-2 font-medium">Clientes</th>
                  <th className="pb-3 pt-2 font-medium">Uso CPU</th>
                  <th className="pb-3 pt-2 font-medium">Temp.</th>
                  <th className="pb-3 pt-2 font-medium text-right pr-3">Panel de Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300">
                {topApsByClients.map((ap, i) => {
                  const isPending = pendingAction?.startsWith(ap.serial);
                  return (
                    <tr key={ap.serial} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                      <td className="py-3 pl-3 font-mono font-medium text-slate-700 dark:text-slate-200">{ap.name}</td>
                      <td className="py-3 truncate max-w-[120px]">{ap.building}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#10b981]/20 text-[#10b981]">
                          {ap.clients}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#10b981] to-[#f59e0b]" style={{ width: `${ap.cpuUsage}%` }} />
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`font-mono text-[11px] font-medium ${ap.temperature >= 65 ? 'text-red-500' : ap.temperature >= 55 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {ap.temperature > 0 ? `${ap.temperature}°C` : '—'}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-right">
                        <div className="flex justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                          
                          <button 
                            onClick={() => handleAction(ap, 'ping')}
                            disabled={isPending || ap.status === 'offline'}
                            className="glow-btn flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-slate-600 dark:text-emerald-400 disabled:opacity-30"
                            title="Ping (Test de Latencia)"
                          >
                            <Activity size={13} />
                          </button>

                          <button 
                            onClick={() => handleAction(ap, 'ssh')}
                            disabled={isPending || ap.status === 'offline'}
                            className="glow-btn flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-slate-600 dark:text-purple-400 disabled:opacity-30"
                            title="Abrir Consola SSH"
                          >
                            <Terminal size={13} />
                          </button>

                          <button 
                            onClick={() => handleAction(ap, 'diag')}
                            disabled={isPending || ap.status === 'offline'}
                            className="glow-btn flex items-center justify-center w-7 h-7 rounded-md bg-slate-100 dark:bg-white/10 hover:bg-orange-100 dark:hover:bg-orange-500/20 text-slate-600 dark:text-orange-400 disabled:opacity-30"
                            title="Ejecutar Diagnóstico"
                          >
                            <Stethoscope size={13} />
                          </button>

                          <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1 self-center" />

                          <button 
                            onClick={() => handleAction(ap, 'reboot')}
                            disabled={isPending || ap.status === 'offline'}
                            className="glow-btn flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 disabled:opacity-30"
                            title="Reiniciar AP (Soft Reboot)"
                          >
                            <RotateCw size={13} />
                          </button>

                          <button 
                            onClick={() => handleAction(ap, 'power-off')}
                            disabled={isPending || ap.status === 'offline' || !ap.lldpNeighbor}
                            className="glow-btn flex items-center justify-center w-7 h-7 rounded-md bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 disabled:opacity-30"
                            title="Cortar Energía PoE del Switch"
                          >
                            <Power size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Alerts List */}
        <div className="noc-card xl:col-span-1 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Alertas Recientes</h3>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {unackAlerts.slice(0, 5).map((a: Alert) => (
              <div
                key={a.id}
                onClick={() => setSelectedAlert(a)}
                className="group flex gap-3 items-start p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all cursor-pointer relative"
              >
                <div className={`p-2 rounded-lg mt-0.5 ${
                  a.severity === 'critical' 
                    ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] dark:shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse-glow' 
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-orange-500 transition-colors">{a.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate font-mono">{a.device}</p>
                </div>
                <div className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--muted)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            ))}

            {unackAlerts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm opacity-50">
                <Check size={32} className="mb-2 text-[#10b981]" />
                No hay alertas activas
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
