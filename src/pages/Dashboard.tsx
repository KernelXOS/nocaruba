import { Wifi, Users, Bell, Server, Network, Activity, Thermometer, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from '../components/ui/KPICard';
import StatusDot from '../components/ui/StatusDot';
import ThermoBar from '../components/ui/ThermoBar';
import { useAPs, useAlerts, useBandwidth, useServers, useSwitches, useClients, useGateways } from '../hooks/useData';
import type { AccessPoint, Alert } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const severityColor = { critical:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
const severityBg    = { critical:'#ef444415', warning:'#f59e0b15', info:'#3b82f615' };
const severityIcon  = { critical:'🔴', warning:'🟡', info:'🔵' };

function fmtBps(bps: number) {
  if (bps >= 1e9) return `${(bps/1e9).toFixed(1)} Gbps`;
  if (bps >= 1e6) return `${(bps/1e6).toFixed(1)} Mbps`;
  if (bps >= 1e3) return `${(bps/1e3).toFixed(0)} Kbps`;
  return `${bps} bps`;
}
function fmtUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

export default function Dashboard() {
  const { data: aps,     isLoading: apsLoad } = useAPs();
  const { data: alerts }  = useAlerts();
  const { data: bw }      = useBandwidth();
  const { data: servers } = useServers();
  const { data: switches } = useSwitches();
  const { data: clients }  = useClients();
  const { data: gateways } = useGateways();

  // Compute overview from live data (avoids a separate endpoint that can silently return zeros)
  const apList      = aps ?? [];
  const onlineAPs   = apList.filter(a => a.status === 'online').length;
  const warningAPs  = apList.filter(a => a.status === 'warning').length;
  const offlineAPs  = apList.filter(a => a.status === 'offline').length;
  const totalAPs    = apList.length;
  const swList      = switches ?? [];
  const onlineSw    = swList.filter(s => s.status === 'online').length;
  const clientList  = clients ?? [];
  const wifiClients = clientList.filter(c => c.type === 'wireless').length;
  const health      = totalAPs > 0 ? Math.round(((onlineAPs + warningAPs * 0.5) / totalAPs) * 100) : 100;
  const healthColor = health >= 90 ? '#10b981' : health >= 70 ? '#f59e0b' : '#ef4444';
  const totalRxMbps = (apList.reduce((s, a) => s + (a.rxBps || 0), 0) / 1_000_000).toFixed(1);
  const totalTxMbps = (apList.reduce((s, a) => s + (a.txBps || 0), 0) / 1_000_000).toFixed(1);

  const unackAlerts = (alerts ?? []).filter(a => !a.acknowledged);
  const critAlerts  = unackAlerts.filter(a => a.severity === 'critical');

  if (apsLoad) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color:'#4b7ab5' }}>Cargando datos de red...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 card-enter">
      {/* ── KPI Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard title="APs en Línea"    value={onlineAPs}              sub={`de ${totalAPs} totales`}               icon={Wifi}    color="#10b981" />
        <KPICard title="APs Advertencia" value={warningAPs}             sub="requieren atención"                     icon={Wifi}    color="#f59e0b" />
        <KPICard title="APs Offline"     value={offlineAPs}             sub="fuera de línea"                         icon={Wifi}    color="#ef4444" critical={offlineAPs > 0} />
        <KPICard title="Clientes WiFi"   value={wifiClients || clientList.length} sub="dispositivos conectados"      icon={Users}   color="#3b82f6" />
        <KPICard title="Alertas Activas" value={unackAlerts.length}     sub={`${critAlerts.length} críticas`}        icon={Bell}    color="#ef4444" critical={critAlerts.length > 0} />
        <KPICard title="Switches Online" value={`${onlineSw}/${swList.length}`}   sub={`+ ${(gateways ?? []).length} gateways`} icon={Network} color="#8b5cf6" />
        <KPICard title="Servidores"      value={`${(servers ?? []).filter(s => s.status === 'online').length}/${(servers ?? []).length}`} sub="operativos" icon={Server} color="#06b6d4" />
        <KPICard title="Salud de Red"    value={`${health}%`}           sub="índice general"                         icon={Activity} color={healthColor} />
      </div>

      {/* ── Row 2: APs + Alertas ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* AP Grid */}
        <div className="xl:col-span-2 noc-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <Wifi size={15} style={{ color:'#3b82f6' }} />
              Puntos de Acceso — Estado General
            </h2>
            <span className="text-xs font-mono" style={{ color:'#4b7ab5' }}>{aps?.length} APs</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {(aps ?? []).map((ap: AccessPoint) => (
              <div key={ap.serial}
                className="rounded-lg p-3 cursor-pointer transition-all duration-150 hover:scale-[1.02]"
                style={{
                  background: ap.status === 'offline' ? '#1a0a0a' : ap.status === 'warning' ? '#1a1400' : '#0d1a10',
                  border: `1px solid ${ap.status === 'offline' ? '#7f1d1d' : ap.status === 'warning' ? '#78350f' : '#14532d'}40`,
                }}>
                <div className="flex items-center justify-between mb-1.5">
                  <StatusDot status={ap.status} size={7} />
                  <span className="text-xs font-mono" style={{ color:'#4b7ab5', fontSize:10 }}>
                    {ap.clients > 0 ? `${ap.clients}c` : '—'}
                  </span>
                </div>
                <div className="text-xs font-medium text-white truncate leading-tight"
                  title={ap.name} style={{ fontSize:11 }}>
                  {ap.name.replace('AP-', '')}
                </div>
                <div className="text-xs mt-1" style={{ color:'#4b7ab5', fontSize:10 }}>
                  {ap.building.replace('Edificio ','Ed. ')}
                </div>
                {ap.status !== 'offline' && (
                  <div className="mt-1.5">
                    <ThermoBar value={ap.temperature} max={90} warnAt={60} critAt={70} unit="°C" />
                  </div>
                )}
                {ap.status === 'offline' && (
                  <div className="text-xs mt-1" style={{ color:'#ef444480', fontSize:10 }}>
                    ✕ Sin conexión
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Alertas */}
        <div className="noc-card p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <Bell size={15} style={{ color:'#ef4444' }} />
              Alertas Activas
            </h2>
            {critAlerts.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-mono text-white" style={{ background:'#ef4444' }}>
                {critAlerts.length} críticas
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto max-h-80">
            {unackAlerts.length === 0 && (
              <div className="text-center py-8 text-sm" style={{ color:'#2a3f6e' }}>
                ✓ Sin alertas activas
              </div>
            )}
            {unackAlerts.map((a: Alert) => (
              <div key={a.id} className="rounded-lg p-3 transition-all"
                style={{ background: severityBg[a.severity], border:`1px solid ${severityColor[a.severity]}25` }}>
                <div className="flex items-start gap-2">
                  <span className="text-xs mt-0.5">{severityIcon[a.severity]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{a.message}</div>
                    <div className="text-xs mt-0.5 truncate" style={{ color:'#6b8bb5' }}>{a.device}</div>
                    <div className="text-xs mt-0.5" style={{ color:'#374d6b', fontSize:10 }}>
                      {formatDistanceToNow(new Date(a.timestamp), { addSuffix:true, locale:es })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <a href="/alerts" className="block mt-3 text-center text-xs py-2 rounded-lg transition-colors hover:bg-noc-hover"
            style={{ color:'#3b82f6', borderTop:'1px solid #1e3460' }}>
            Ver todas las alertas →
          </a>
        </div>
      </div>

      {/* ── Row 3: Bandwidth + Temperatura ──────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Bandwidth Chart */}
        <div className="xl:col-span-2 noc-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-white flex items-center gap-2">
              <Activity size={15} style={{ color:'#10b981' }} />
              Tráfico de Red — Últimos 30 min
            </h2>
            <div className="flex gap-4 text-xs font-mono">
              <span style={{ color:'#10b981' }}>↓ {totalRxMbps} Mbps</span>
              <span style={{ color:'#3b82f6' }}>↑ {totalTxMbps} Mbps</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={bw ?? []} margin={{ top:5, right:5, left:-20, bottom:0 }}>
              <defs>
                <linearGradient id="gRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e346040" />
              <XAxis dataKey="time" tick={{ fill:'#4b7ab5', fontSize:10 }} tickLine={false} interval={4} />
              <YAxis tick={{ fill:'#4b7ab5', fontSize:10 }} tickLine={false} unit=" Mb" />
              <Tooltip
                contentStyle={{ background:'#0d1526', border:'1px solid #1e3460', borderRadius:8, fontSize:12 }}
                labelStyle={{ color:'#6b8bb5' }}
                formatter={(v: number, n: string) => [`${v} Mbps`, n === 'rx' ? 'Descarga' : 'Subida']}
              />
              <Legend formatter={v => v === 'rx' ? 'Descarga (Rx)' : 'Subida (Tx)'} wrapperStyle={{ fontSize:11 }} />
              <Area type="monotone" dataKey="rx" stroke="#10b981" strokeWidth={2} fill="url(#gRx)" dot={false} />
              <Area type="monotone" dataKey="tx" stroke="#3b82f6" strokeWidth={2} fill="url(#gTx)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Temperatura servidores */}
        <div className="noc-card p-4">
          <h2 className="font-semibold text-sm text-white flex items-center gap-2 mb-4">
            <Thermometer size={15} style={{ color:'#f59e0b' }} />
            Temperatura Servidores
          </h2>
          <div className="space-y-4">
            {(servers ?? []).map(s => (
              <div key={s.id}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <div className="text-xs font-medium text-white">{s.name}</div>
                    <div className="text-xs" style={{ color:'#4b7ab5', fontSize:10 }}>{s.role}</div>
                  </div>
                  <StatusDot status={s.status} size={7} />
                </div>
                <ThermoBar value={s.temperature} max={90} warnAt={65} critAt={75} label="Temp" unit="°C" />
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  <ThermoBar value={s.cpuUsage} warnAt={70} critAt={85} label="CPU" />
                  <ThermoBar value={s.memUsage} warnAt={80} critAt={90} label="RAM" />
                  <ThermoBar value={s.diskUsage} warnAt={75} critAt={90} label="Disco" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 4: Switches resumen ──────────────────────── */}
      <div className="noc-card p-4">
        <h2 className="font-semibold text-sm text-white flex items-center gap-2 mb-4">
          <Network size={15} style={{ color:'#8b5cf6' }} />
          Estado de Switches — Resumen de Puertos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(switches ?? []).map(sw => {
            const errPorts = sw.ports.filter(p => p.status === 'error');
            return (
              <div key={sw.serial} className="rounded-lg p-3"
                style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-xs font-semibold text-white">{sw.name}</div>
                    <div className="text-xs" style={{ color:'#4b7ab5', fontSize:10 }}>{sw.model} · {sw.building}</div>
                  </div>
                  <StatusDot status={sw.status} size={8} />
                </div>
                {/* port strip */}
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {sw.ports.slice(0, 24).map(p => (
                    <div key={p.portId} className="port-cell" title={`Puerto ${p.name}: ${p.status} — ${p.description}`}
                      style={{
                        background: p.status === 'up' ? '#10b98150' : p.status === 'error' ? '#ef444460' : p.status === 'disabled' ? '#374d6b30' : '#1e346040',
                        border: `1px solid ${p.status === 'up' ? '#10b98130' : p.status === 'error' ? '#ef444440' : '#1e3460'}`,
                      }} />
                  ))}
                </div>
                <div className="flex gap-3 text-xs font-mono">
                  <span style={{ color:'#10b981' }}>▲ {sw.portsUp} up</span>
                  <span style={{ color:'#6b7280' }}>▼ {sw.portsDown} down</span>
                  {sw.portsError > 0 && <span style={{ color:'#ef4444' }}>✕ {sw.portsError} error</span>}
                </div>
                {errPorts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {errPorts.map(p => (
                      <div key={p.portId} className="text-xs px-2 py-1 rounded flex items-center gap-1.5"
                        style={{ background:'#ef444415', color:'#ef4444', fontSize:10 }}>
                        <AlertTriangle size={10} />
                        Puerto {p.name}: {p.description} ({p.errors} errores)
                      </div>
                    ))}
                  </div>
                )}
                <ThermoBar value={sw.temperature} max={80} warnAt={50} critAt={65} label="Temp" unit="°C" />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 5: Clientes top APs ──────────────────────── */}
      <div className="noc-card p-4">
        <h2 className="font-semibold text-sm text-white flex items-center gap-2 mb-4">
          <Users size={15} style={{ color:'#06b6d4' }} />
          Top APs por Número de Clientes
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...(aps ?? [])].sort((a,b) => b.clients - a.clients).slice(0,8).map((ap: AccessPoint) => (
            <div key={ap.serial} className="text-center rounded-lg p-3"
              style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
              <div className="text-xl font-mono font-bold" style={{ color:'#06b6d4' }}>{ap.clients}</div>
              <div className="text-xs text-white mt-1 truncate" style={{ fontSize:10 }}>
                {ap.name.replace('AP-','').split('-').slice(0,2).join('-')}
              </div>
              <div className="text-xs mt-0.5" style={{ color:'#374d6b', fontSize:9 }}>
                {ap.building.replace('Edificio ','').replace('Lab.','Lab')}
              </div>
              <div className="mt-1.5 flex justify-center gap-1">
                <StatusDot status={ap.status} size={6} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
