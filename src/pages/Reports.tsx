import { useMemo } from 'react';
import {
  Download, Printer, FileText, Activity, HeartPulse, Wifi,
  ThermometerSun, Users, AlertTriangle, Gauge,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { useAPs, useSwitches, useClients, useAlerts, useBandwidth } from '../hooks/useData';
import { useThemeStore } from '../store/themeStore';
import { exportCsv } from '../utils/exportCsv';

const SEV_COLORS: Record<string, string> = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
const BAND_COLORS: Record<string, string> = { '2.4GHz': '#f59e0b', '5GHz': '#10b981', '6GHz': '#8b5cf6' };

function fmtUptime(s: number) {
  if (!s) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

export default function Reports() {
  const { data: aps } = useAPs();
  const { data: switches } = useSwitches();
  const { data: clients } = useClients();
  const { data: alerts } = useAlerts();
  const { data: bw } = useBandwidth();
  const { isDark } = useThemeStore();

  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipStyle = {
    backgroundColor: isDark ? 'rgba(20,20,20,0.95)' : '#ffffff',
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
    color: isDark ? '#f8fafc' : '#334155',
    borderRadius: '8px', fontSize: '12px',
  };

  const apList = aps ?? [];
  const alertList = alerts ?? [];
  const clientList = clients ?? [];

  /* ── Métricas calculadas ──────────────────────────────────── */
  const stats = useMemo(() => {
    const online = apList.filter(a => a.status === 'online').length;
    const warning = apList.filter(a => a.status === 'warning').length;
    const health = apList.length ? Math.round(((online + warning * 0.5) / apList.length) * 100) : 0;
    const avgUptime = apList.length ? apList.reduce((s, a) => s + a.uptime, 0) / apList.length : 0;
    const avgTemp = (() => {
      const withTemp = apList.filter(a => a.temperature > 0);
      return withTemp.length ? Math.round(withTemp.reduce((s, a) => s + a.temperature, 0) / withTemp.length) : 0;
    })();
    const totalClients = clientList.length || apList.reduce((s, a) => s + a.clients, 0);
    const unack = alertList.filter(a => !a.acknowledged).length;
    return { health, avgUptime, avgTemp, totalClients, unack };
  }, [apList, clientList, alertList]);

  /* Clientes por edificio */
  const byBuilding = useMemo(() => {
    const m: Record<string, number> = {};
    apList.forEach(ap => { m[ap.building] = (m[ap.building] ?? 0) + ap.clients; });
    return Object.entries(m)
      .map(([name, clientes]) => ({ name: name.replace('Edificio ', 'Ed. '), clientes }))
      .sort((a, b) => b.clientes - a.clientes);
  }, [apList]);

  /* Alertas por severidad */
  const bySeverity = useMemo(() => {
    const m: Record<string, number> = { critical: 0, warning: 0, info: 0 };
    alertList.forEach(a => { m[a.severity] = (m[a.severity] ?? 0) + 1; });
    return [
      { name: 'Críticas', value: m.critical, key: 'critical' },
      { name: 'Advertencias', value: m.warning, key: 'warning' },
      { name: 'Informativas', value: m.info, key: 'info' },
    ].filter(s => s.value > 0);
  }, [alertList]);

  /* Clientes por banda */
  const byBand = useMemo(() => {
    const m: Record<string, number> = {};
    clientList.forEach(c => { if (c.band) m[c.band] = (m[c.band] ?? 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [clientList]);

  /* Temperatura por AP (top 10 más calientes) */
  const byTemp = useMemo(() =>
    [...apList]
      .filter(a => a.temperature > 0)
      .sort((a, b) => b.temperature - a.temperature)
      .slice(0, 10)
      .map(a => ({ name: a.name.replace('AP-', ''), temp: a.temperature })),
  [apList]);

  /* Top APs por tráfico */
  const byTraffic = useMemo(() =>
    [...apList]
      .sort((a, b) => (b.rxBps + b.txBps) - (a.rxBps + a.txBps))
      .slice(0, 8)
      .map(a => ({ name: a.name.replace('AP-', ''), mbps: +(((a.rxBps + a.txBps) / 1e6).toFixed(1)) })),
  [apList]);

  /* ── Exportaciones ────────────────────────────────────────── */
  const exportAPs = () => exportCsv('inventario_aps', apList as unknown as Record<string, unknown>[], [
    { key: 'name', label: 'Nombre' }, { key: 'serial', label: 'Serial' }, { key: 'model', label: 'Modelo' },
    { key: 'building', label: 'Edificio' }, { key: 'floor', label: 'Piso' }, { key: 'status', label: 'Estado' },
    { key: 'ip', label: 'IP' }, { key: 'macAddress', label: 'MAC' }, { key: 'clients', label: 'Clientes' },
    { key: 'temperature', label: 'Temperatura °C' }, { key: 'cpuUsage', label: 'CPU %' },
    { key: 'memUsage', label: 'RAM %' }, { key: 'firmware', label: 'Firmware' },
  ]);

  const exportClients = () => exportCsv('clientes_conectados', clientList as unknown as Record<string, unknown>[], [
    { key: 'hostname', label: 'Hostname' }, { key: 'ip', label: 'IP' }, { key: 'mac', label: 'MAC' },
    { key: 'ap', label: 'AP' }, { key: 'ssid', label: 'SSID' }, { key: 'band', label: 'Banda' },
    { key: 'signal', label: 'Señal dBm' }, { key: 'vlan', label: 'VLAN' }, { key: 'building', label: 'Edificio' },
  ]);

  const exportAlerts = () => exportCsv('historial_alertas', alertList as unknown as Record<string, unknown>[], [
    { key: 'severity', label: 'Severidad' }, { key: 'category', label: 'Categoría' },
    { key: 'device', label: 'Dispositivo' }, { key: 'message', label: 'Mensaje' },
    { key: 'detail', label: 'Detalle' }, { key: 'building', label: 'Edificio' },
    { key: 'timestamp', label: 'Fecha' }, { key: 'acknowledged', label: 'Reconocida' },
  ]);

  const exportSwitches = () => exportCsv('inventario_switches', (switches ?? []) as unknown as Record<string, unknown>[], [
    { key: 'name', label: 'Nombre' }, { key: 'serial', label: 'Serial' }, { key: 'model', label: 'Modelo' },
    { key: 'building', label: 'Edificio' }, { key: 'status', label: 'Estado' }, { key: 'ip', label: 'IP' },
    { key: 'totalPorts', label: 'Puertos' }, { key: 'portsUp', label: 'Puertos UP' },
    { key: 'portsError', label: 'Puertos con error' }, { key: 'firmware', label: 'Firmware' },
  ]);

  const healthColor = stats.health >= 90 ? '#10b981' : stats.health >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-6 card-enter pb-10 print-area">

      {/* ── Encabezado ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-[color:var(--text)]">Reportes y Analítica</h1>
          <p className="text-xs mt-0.5 text-slate-500 dark:text-[color:var(--muted)]">
            Resumen ejecutivo de la red PUCESE — generado el {new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          {[
            { label: 'APs', fn: exportAPs },
            { label: 'Switches', fn: exportSwitches },
            { label: 'Clientes', fn: exportClients },
            { label: 'Alertas', fn: exportAlerts },
          ].map(b => (
            <button key={b.label} onClick={b.fn}
              className="glow-btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-white/5 border border-slate-200 dark:border-[color:var(--border)] text-slate-600 dark:text-orange-400 hover:border-orange-400 dark:hover:border-orange-500/50 transition-colors">
              <Download size={13} /> CSV {b.label}
            </button>
          ))}
          <button onClick={() => window.print()}
            className="glow-btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-orange-600 text-white hover:bg-orange-500 transition-colors">
            <Printer size={13} /> Imprimir reporte
          </button>
        </div>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="metric-box">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Salud de la Red</span>
            <HeartPulse size={16} style={{ color: healthColor }} />
          </div>
          <div className="text-3xl font-bold" style={{ color: healthColor }}>{stats.health}%</div>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${stats.health}%`, background: healthColor }} />
          </div>
        </div>
        <div className="metric-box">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Uptime Promedio</span>
            <Gauge size={16} className="text-[#ff8300]" />
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{fmtUptime(stats.avgUptime)}</div>
          <p className="text-[10px] mt-1 text-slate-400 dark:text-[color:var(--dim)]">sobre {apList.length} APs</p>
        </div>
        <div className="metric-box">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Temp. Promedio</span>
            <ThermometerSun size={16} className={stats.avgTemp >= 60 ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.avgTemp}°C</div>
          <p className="text-[10px] mt-1 text-slate-400 dark:text-[color:var(--dim)]">umbral crítico: 70°C</p>
        </div>
        <div className="metric-box">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Clientes Totales</span>
            <Users size={16} className="text-[#a855f7]" />
          </div>
          <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.totalClients}</div>
          <p className="text-[10px] mt-1 text-slate-400 dark:text-[color:var(--dim)]">
            ≈ {apList.length ? Math.round(stats.totalClients / Math.max(1, apList.filter(a => a.status !== 'offline').length)) : 0} por AP activo
          </p>
        </div>
        <div className="metric-box">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Alertas Activas</span>
            <AlertTriangle size={16} className={stats.unack > 0 ? 'text-[#ef4444]' : 'text-slate-400'} />
          </div>
          <div className="text-3xl font-bold" style={{ color: stats.unack > 0 ? '#ef4444' : '#10b981' }}>{stats.unack}</div>
          <p className="text-[10px] mt-1 text-slate-400 dark:text-[color:var(--dim)]">sin reconocer</p>
        </div>
      </div>

      {/* ── Fila 1: clientes por edificio + severidad ────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="noc-card p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Wifi size={14} className="text-orange-500" /> Clientes por Edificio
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byBuilding} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9 }} interval={0} angle={-25} dy={12} height={50} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="clientes" fill="#ff8300" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="noc-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" /> Alertas por Severidad
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bySeverity} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                  {bySeverity.map(s => <Cell key={s.key} fill={SEV_COLORS[s.key]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Fila 2: tráfico + bandas ─────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="noc-card p-5 xl:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-emerald-500" /> Top APs por Tráfico (Mbps)
          </h3>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTraffic} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 9 }} width={110} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="mbps" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="noc-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Wifi size={14} className="text-purple-500" /> Clientes por Banda
          </h3>
          <div className="h-[240px]">
            {byBand.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byBand} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={4} strokeWidth={0}>
                    {byBand.map(b => <Cell key={b.name} fill={BAND_COLORS[b.name] ?? '#3b82f6'} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, color: textColor }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-[color:var(--muted)]">Sin datos de banda</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fila 3: temperatura + tráfico histórico ──────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="noc-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <ThermometerSun size={14} className="text-red-400" /> APs con Mayor Temperatura (°C)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byTemp} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 8 }} interval={0} angle={-25} dy={12} height={50} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} domain={[0, 80]} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                <Bar dataKey="temp" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {byTemp.map(t => (
                    <Cell key={t.name} fill={t.temp >= 65 ? '#ef4444' : t.temp >= 55 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="noc-card p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <FileText size={14} className="text-blue-400" /> Tráfico de la Última Media Hora (Mbps)
          </h3>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bw ?? []} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="repRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff8300" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ff8300" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="repTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} minTickGap={30} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="rx" stroke="#ff8300" strokeWidth={2} fill="url(#repRx)" name="Rx" />
                <Area type="monotone" dataKey="tx" stroke="#10b981" strokeWidth={2} fill="url(#repTx)" name="Tx" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
