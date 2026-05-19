import { Server, Thermometer, Cpu, HardDrive, MemoryStick, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import StatusDot from '../components/ui/StatusDot';
import ThermoBar from '../components/ui/ThermoBar';
import { useServers } from '../hooks/useData';
import type { Server as ServerType } from '../types';

function fmtUptime(s: number) {
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  return `${d}d ${h}h`;
}

const svcIcons = {
  running: <CheckCircle size={11} style={{ color:'#10b981' }} />,
  stopped: <XCircle    size={11} style={{ color:'#ef4444' }} />,
  warning: <AlertCircle size={11} style={{ color:'#f59e0b' }} />,
};

function ServerCard({ srv }: { srv: ServerType }) {
  const tempColor = srv.temperature >= 75 ? '#ef4444' : srv.temperature >= 65 ? '#f59e0b' : '#10b981';

  return (
    <div className="noc-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl" style={{ background:'#06b6d415' }}>
            <Server size={18} style={{ color:'#06b6d4' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">{srv.name}</span>
              <StatusDot status={srv.status} size={7} label />
            </div>
            <div className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>{srv.role}</div>
            <div className="text-xs font-mono mt-0.5" style={{ color:'#3b82f6' }}>{srv.ip}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono" style={{ color: tempColor }}>
            <Thermometer size={10} className="inline mr-1" />{srv.temperature}°C
          </div>
          <div className="text-xs mt-1" style={{ color:'#374d6b', fontSize:10 }}>
            {srv.os}
          </div>
          <div className="text-xs mt-0.5 font-mono" style={{ color:'#2a3f6e', fontSize:10 }}>
            UP: {fmtUptime(srv.uptime)}
          </div>
        </div>
      </div>

      {/* Thermal gauge — big visual */}
      <div className="mb-4 rounded-xl p-3" style={{ background:'#0a0f1f', border:'1px solid #1e3460' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color:'#6b8bb5' }}>
            <Thermometer size={11} className="inline mr-1" />Temperatura
          </span>
          <span className="text-lg font-mono font-bold" style={{ color: tempColor }}>
            {srv.temperature}°C
          </span>
        </div>
        {/* Visual thermometer bar */}
        <div className="relative h-4 rounded-full overflow-hidden" style={{ background:'#1e3460' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${(srv.temperature / 90) * 100}%`,
              background: `linear-gradient(90deg, #10b981, ${srv.temperature >= 75 ? '#ef4444' : srv.temperature >= 65 ? '#f59e0b' : '#10b981'})`,
            }} />
          {/* threshold markers */}
          <div className="absolute top-0 bottom-0 w-px" style={{ left:`${(65/90)*100}%`, background:'#f59e0b60' }} />
          <div className="absolute top-0 bottom-0 w-px" style={{ left:`${(75/90)*100}%`, background:'#ef444460' }} />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color:'#2a3f6e', fontSize:9 }}>
          <span>0°C</span><span style={{ color:'#f59e0b60' }}>65°C aviso</span><span style={{ color:'#ef444660' }}>75°C crítico</span><span>90°C</span>
        </div>
      </div>

      {/* Resource bars */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg p-3 text-center" style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
          <Cpu size={14} style={{ color:'#8b5cf6', margin:'0 auto 4px' }} />
          <div className="text-lg font-mono font-bold" style={{ color: srv.cpuUsage >= 85 ? '#ef4444' : srv.cpuUsage >= 70 ? '#f59e0b' : '#8b5cf6' }}>
            {srv.cpuUsage}%
          </div>
          <div className="text-xs mt-1" style={{ color:'#374d6b' }}>CPU</div>
          <div className="mt-2"><ThermoBar value={srv.cpuUsage} warnAt={70} critAt={85} /></div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
          <MemoryStick size={14} style={{ color:'#3b82f6', margin:'0 auto 4px' }} />
          <div className="text-lg font-mono font-bold" style={{ color: srv.memUsage >= 90 ? '#ef4444' : srv.memUsage >= 80 ? '#f59e0b' : '#3b82f6' }}>
            {srv.memUsage}%
          </div>
          <div className="text-xs mt-1" style={{ color:'#374d6b' }}>RAM</div>
          <div className="mt-2"><ThermoBar value={srv.memUsage} warnAt={80} critAt={90} /></div>
        </div>
        <div className="rounded-lg p-3 text-center" style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
          <HardDrive size={14} style={{ color:'#06b6d4', margin:'0 auto 4px' }} />
          <div className="text-lg font-mono font-bold" style={{ color: srv.diskUsage >= 90 ? '#ef4444' : srv.diskUsage >= 75 ? '#f59e0b' : '#06b6d4' }}>
            {srv.diskUsage}%
          </div>
          <div className="text-xs mt-1" style={{ color:'#374d6b' }}>Disco</div>
          <div className="mt-2"><ThermoBar value={srv.diskUsage} warnAt={75} critAt={90} /></div>
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color:'#6b8bb5' }}>Servicios</div>
        <div className="grid grid-cols-2 gap-1.5">
          {srv.services.map(svc => (
            <div key={svc.name} className="flex items-center gap-2 rounded px-2 py-1.5"
              style={{
                background: svc.status === 'running' ? '#10b98108' : svc.status === 'warning' ? '#f59e0b10' : '#ef444410',
                border: `1px solid ${svc.status === 'running' ? '#10b98125' : svc.status === 'warning' ? '#f59e0b25' : '#ef444425'}`,
              }}>
              {svcIcons[svc.status]}
              <span className="text-xs truncate" style={{ color: svc.status === 'running' ? '#d1fae5' : svc.status === 'warning' ? '#fef3c7' : '#fee2e2' }}>
                {svc.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Servers() {
  const { data: servers, isLoading } = useServers();

  const avgTemp = servers ? Math.round(servers.reduce((s, v) => s + v.temperature, 0) / servers.length) : 0;
  const avgCpu  = servers ? Math.round(servers.reduce((s, v) => s + v.cpuUsage,    0) / servers.length) : 0;
  const avgMem  = servers ? Math.round(servers.reduce((s, v) => s + v.memUsage,    0) / servers.length) : 0;
  const critical = servers?.filter(s => s.temperature >= 75 || s.cpuUsage >= 85).length ?? 0;

  return (
    <div className="space-y-4 card-enter">
      <div>
        <h1 className="text-lg font-bold text-white">Servidores e Infraestructura</h1>
        <p className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>
          Temperatura, recursos y servicios del Data Center — PUCESE
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Servidores Online', value:`${servers?.filter(s=>s.status==='online').length ?? 0}/${servers?.length ?? 0}`, color:'#10b981' },
          { label:'Temp. Promedio',    value:`${avgTemp}°C`,  color: avgTemp >= 70 ? '#ef4444' : avgTemp >= 60 ? '#f59e0b' : '#10b981' },
          { label:'CPU Promedio',      value:`${avgCpu}%`,   color: avgCpu >= 70 ? '#f59e0b' : '#8b5cf6' },
          { label:'RAM Promedio',      value:`${avgMem}%`,   color: avgMem >= 80 ? '#f59e0b' : '#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="noc-card p-3">
            <div className="text-xs" style={{ color:'#6b8bb5' }}>{label}</div>
            <div className="text-2xl font-mono font-bold mt-1" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {critical > 0 && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
          style={{ background:'#ef444415', border:'1px solid #ef444440' }}>
          <Thermometer size={16} style={{ color:'#ef4444' }} />
          <span style={{ color:'#ef4444' }}>
            <strong>{critical} servidor{critical > 1 ? 'es' : ''}</strong> con temperatura o CPU en nivel crítico — revisar refrigeración del rack
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="noc-card p-8 text-center text-sm" style={{ color:'#4b7ab5' }}>Cargando servidores...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(servers ?? []).map(s => <ServerCard key={s.id} srv={s} />)}
        </div>
      )}
    </div>
  );
}
