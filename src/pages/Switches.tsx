import { useState } from 'react';
import { Network, AlertTriangle, Router, Activity, Cpu, MemoryStick } from 'lucide-react';
import StatusDot from '../components/ui/StatusDot';
import ThermoBar from '../components/ui/ThermoBar';
import { useSwitches, useGateways } from '../hooks/useData';
import type { NetworkSwitch, SwitchPort, Gateway } from '../types';
import clsx from 'clsx';

/* ── helpers ──────────────────────────────────────────────── */
const portColor = (p: SwitchPort) => {
  if (p.status === 'up')       return { bg:'#10b98140', border:'#10b98160', text:'#10b981' };
  if (p.status === 'error')    return { bg:'#ef444450', border:'#ef444470', text:'#ef4444' };
  if (p.status === 'disabled') return { bg:'#374d6b20', border:'#374d6b40', text:'#374d6b' };
  return                              { bg:'#1e346030', border:'#1e346050', text:'#374d6b' };
};

function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b/1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b/1e6).toFixed(1)} MB`;
  return `${(b/1e3).toFixed(0)} KB`;
}
function fmtUptime(s: number) {
  if (!s) return '—';
  const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

/* ── Port tooltip ─────────────────────────────────────────── */
function PortTooltip({ port }: { port: SwitchPort }) {
  return (
    <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs pointer-events-none w-48"
      style={{ background:'#0d1526', border:'1px solid #2a3f6e', boxShadow:'0 8px 24px #00000060' }}>
      <div className="font-semibold text-white mb-1">Puerto {port.name}</div>
      <div style={{ color:'#6b8bb5' }}>{port.description}</div>
      <div className="mt-1.5 space-y-0.5 font-mono">
        <div className="flex justify-between">
          <span style={{ color:'#374d6b' }}>Estado</span>
          <span style={{ color: portColor(port).text }}>{port.status.toUpperCase()}</span>
        </div>
        {port.status === 'up' && <>
          <div className="flex justify-between">
            <span style={{ color:'#374d6b' }}>Velocidad</span>
            <span style={{ color:'#e2e8f0' }}>{port.speed} Mbps</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color:'#374d6b' }}>VLAN</span>
            <span style={{ color:'#e2e8f0' }}>{port.vlan}</span>
          </div>
          {port.poe && <div className="flex justify-between">
            <span style={{ color:'#374d6b' }}>PoE</span>
            <span style={{ color:'#f59e0b' }}>{port.poeWatts}W</span>
          </div>}
          <div className="flex justify-between">
            <span style={{ color:'#374d6b' }}>Rx</span>
            <span style={{ color:'#10b981' }}>{fmtBytes(port.rxBytes)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color:'#374d6b' }}>Tx</span>
            <span style={{ color:'#3b82f6' }}>{fmtBytes(port.txBytes)}</span>
          </div>
        </>}
        {port.errors > 0 && <div className="flex justify-between">
          <span style={{ color:'#374d6b' }}>Errores</span>
          <span style={{ color:'#ef4444' }}>{port.errors}</span>
        </div>}
      </div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
        style={{ borderLeft:'5px solid transparent', borderRight:'5px solid transparent', borderTop:'5px solid #2a3f6e' }} />
    </div>
  );
}

/* ── Switch card ──────────────────────────────────────────── */
function SwitchCard({ sw }: { sw: NetworkSwitch }) {
  const [expanded, setExpanded]     = useState(false);
  const [hoveredPort, setHoveredPort] = useState<string | null>(null);
  const errPorts = sw.ports.filter(p => p.status === 'error');

  return (
    <div className="noc-card overflow-hidden">
      <div className="p-4 flex items-start justify-between cursor-pointer hover:bg-noc-hover transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg mt-0.5 flex-shrink-0" style={{ background:'#8b5cf615' }}>
            <Network size={16} style={{ color:'#8b5cf6' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-white">{sw.name}</span>
              <StatusDot status={sw.status} size={7} label />
            </div>
            <div className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>
              {sw.model} · {sw.building} · <span className="font-mono">{sw.ip}</span>
            </div>
            <div className="text-xs mt-0.5 font-mono" style={{ color:'#374d6b', fontSize:10 }}>
              S/N: {sw.serial} · FW: {sw.firmware}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs font-mono">
              <span style={{ color:'#10b981' }}>{sw.portsUp} up</span>
              {' · '}
              <span style={{ color:'#6b7280' }}>{sw.portsDown} down</span>
              {sw.portsError > 0 && <> · <span style={{ color:'#ef4444' }}>{sw.portsError} err</span></>}
            </div>
            <div className="text-xs mt-0.5" style={{ color:'#374d6b', fontSize:10 }}>
              Uptime: {fmtUptime(sw.uptime)}
            </div>
          </div>
          <span className="text-xs" style={{ color:'#4b7ab5' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <div className="px-4 pb-3 grid grid-cols-3 gap-3">
        <ThermoBar value={sw.temperature} max={80} warnAt={50} critAt={65} label="Temperatura" unit="°C" />
        <ThermoBar value={sw.cpuUsage}    warnAt={70} critAt={85} label="CPU" />
        <ThermoBar value={sw.memUsage}    warnAt={80} critAt={90} label="RAM" />
      </div>

      {errPorts.length > 0 && (
        <div className="mx-4 mb-3 rounded-lg p-2 space-y-1" style={{ background:'#ef444410', border:'1px solid #ef444430' }}>
          {errPorts.map(p => (
            <div key={p.portId} className="flex items-center gap-2 text-xs" style={{ color:'#ef4444' }}>
              <AlertTriangle size={11} />
              <span className="font-mono">Puerto {p.name}</span>
              <span style={{ color:'#6b8bb5' }}>—</span>
              <span>{p.description}</span>
              {p.errors > 0 && <span className="ml-auto font-mono" style={{ color:'#ef444480' }}>{p.errors} err</span>}
            </div>
          ))}
        </div>
      )}

      {/* Port map */}
      <div className="px-4 pb-4">
        <div className="text-xs mb-2 flex items-center justify-between" style={{ color:'#4b7ab5' }}>
          <span>Mapa de puertos ({sw.totalPorts} puertos)</span>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background:'#10b98140', border:'1px solid #10b98160' }} />Activo</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background:'#ef444450', border:'1px solid #ef444470' }} />Error</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background:'#1e346030', border:'1px solid #1e346050' }} />Inactivo</span>
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background:'#0a0f1f', border:'1px solid #1e3460' }}>
          <div className="flex flex-wrap gap-1">
            {sw.ports.map(p => {
              const c = portColor(p);
              const isHigh = p.speed >= 10000;
              return (
                <div key={p.portId} className="relative"
                  onMouseEnter={() => setHoveredPort(p.portId)}
                  onMouseLeave={() => setHoveredPort(null)}>
                  <div className="port-cell" style={{
                    width: isHigh ? 28 : 22, height: isHigh ? 28 : 22,
                    background: c.bg, border: `1px solid ${c.border}`, borderRadius: 3, position:'relative',
                  }}>
                    {p.poe && p.poeWatts > 0 && (
                      <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full" style={{ background:'#f59e0b' }} />
                    )}
                    {p.status === 'error' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ color:'#ef4444', fontSize:10, fontWeight:'bold' }}>!</span>
                      </div>
                    )}
                    {isHigh && p.status === 'up' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span style={{ color:'#10b981', fontSize:8 }}>↑↓</span>
                      </div>
                    )}
                  </div>
                  {hoveredPort === p.portId && <PortTooltip port={p} />}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {sw.ports.map(p => (
              <div key={p.portId} style={{ width: p.speed >= 10000 ? 28 : 22, textAlign:'center' }}>
                <span style={{ color:'#1e3460', fontSize:8, fontFamily:'monospace' }}>
                  {p.name.length <= 3 ? p.name : p.portId}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t" style={{ borderColor:'#1e3460' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background:'#0d1526', borderBottom:'1px solid #1e3460' }}>
                  {['Puerto','Descripción','Estado','Velocidad','VLAN','PoE','Rx','Tx','Errores'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-medium" style={{ color:'#4b7ab5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sw.ports.filter(p => p.status !== 'down' || p.errors > 0).map(p => {
                  const c = portColor(p);
                  return (
                    <tr key={p.portId} style={{ borderBottom:'1px solid #1e346020' }}>
                      <td className="px-3 py-2 font-mono font-semibold" style={{ color: c.text }}>{p.name}</td>
                      <td className="px-3 py-2" style={{ color:'#e2e8f0' }}>{p.description}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full font-mono" style={{ background: c.bg, color: c.text, fontSize:10 }}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color:'#6b8bb5' }}>{p.speed ? `${p.speed}M` : '—'}</td>
                      <td className="px-3 py-2 font-mono" style={{ color:'#4b7ab5' }}>{p.vlan}</td>
                      <td className="px-3 py-2">
                        {p.poe ? <span style={{ color:'#f59e0b' }}>{p.poeWatts}W</span> : <span style={{ color:'#2a3f6e' }}>—</span>}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color:'#10b981' }}>{p.rxBytes ? fmtBytes(p.rxBytes) : '—'}</td>
                      <td className="px-3 py-2 font-mono" style={{ color:'#3b82f6' }}>{p.txBytes ? fmtBytes(p.txBytes) : '—'}</td>
                      <td className="px-3 py-2 font-mono">
                        {p.errors > 0
                          ? <span style={{ color:'#ef4444' }} className="flex items-center gap-1"><AlertTriangle size={10}/>{p.errors}</span>
                          : <span style={{ color:'#2a3f6e' }}>0</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Gateway card ─────────────────────────────────────────── */
function GatewayCard({ gw }: { gw: Gateway }) {
  return (
    <div className="noc-card p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg flex-shrink-0" style={{ background:'#06b6d415' }}>
          <Router size={18} style={{ color:'#06b6d4' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-white">{gw.name}</span>
            <StatusDot status={gw.status} size={7} label />
            <span className="text-xs px-2 py-0.5 rounded-full font-mono"
              style={{ background:'#06b6d415', color:'#06b6d4', border:'1px solid #06b6d430' }}>
              {gw.role}
            </span>
          </div>
          <div className="text-xs" style={{ color:'#4b7ab5' }}>
            {gw.model} · {gw.building} · <span className="font-mono">{gw.ip}</span>
          </div>
          <div className="text-xs font-mono mt-0.5" style={{ color:'#374d6b', fontSize:10 }}>
            S/N: {gw.serial} · MAC: {gw.macAddress} · FW: {gw.firmware}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div className="rounded p-2" style={{ background:'#0d1526' }}>
              <div className="text-xs" style={{ color:'#4b7ab5' }}>Uptime</div>
              <div className="text-xs font-mono font-bold mt-0.5" style={{ color:'#10b981' }}>{fmtUptime(gw.uptime)}</div>
            </div>
            <div className="rounded p-2" style={{ background:'#0d1526' }}>
              <div className="text-xs" style={{ color:'#4b7ab5' }}>Túneles</div>
              <div className="text-xs font-mono font-bold mt-0.5" style={{ color:'#8b5cf6' }}>{gw.tunnels}</div>
            </div>
            <div className="rounded p-2" style={{ background:'#0d1526' }}>
              <div className="text-xs" style={{ color:'#4b7ab5' }}>Grupo</div>
              <div className="text-xs font-mono mt-0.5 truncate" style={{ color:'#6b8bb5' }}>{gw.group}</div>
            </div>
            <div className="rounded p-2" style={{ background:'#0d1526' }}>
              <div className="text-xs" style={{ color:'#4b7ab5' }}>Última vez</div>
              <div className="text-xs font-mono mt-0.5" style={{ color:'#4b7ab5', fontSize:9 }}>
                {new Date(gw.lastSeen).toLocaleString('es-EC')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <ThermoBar value={gw.cpuUsage} warnAt={70} critAt={85} label="CPU" />
            <ThermoBar value={gw.memUsage} warnAt={80} critAt={90} label="RAM" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────── */
export default function Switches() {
  const { data: switches, isLoading: swLoad } = useSwitches();
  const { data: gateways, isLoading: gwLoad } = useGateways();
  const [tab, setTab] = useState<'switches' | 'gateways'>('switches');

  const sw  = switches ?? [];
  const gws = gateways ?? [];

  const totalPorts  = sw.reduce((s, x) => s + x.totalPorts, 0);
  const totalUp     = sw.reduce((s, x) => s + x.portsUp,    0);
  const totalDown   = sw.reduce((s, x) => s + x.portsDown,  0);
  const totalErrors = sw.reduce((s, x) => s + x.portsError, 0);
  const totalDevices = sw.length + gws.length;

  return (
    <div className="space-y-4 card-enter">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Infraestructura de Red</h1>
          <p className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>
            Switches, gateways y controladores — PUCESE · {totalDevices} dispositivos
          </p>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
          <button onClick={() => setTab('switches')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all')}
            style={{
              background: tab === 'switches' ? '#1d4ed8' : 'transparent',
              color: tab === 'switches' ? '#fff' : '#4b7ab5',
            }}>
            <Network size={12} /> Switches ({sw.length})
          </button>
          <button onClick={() => setTab('gateways')}
            className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all')}
            style={{
              background: tab === 'gateways' ? '#06b6d4' : 'transparent',
              color: tab === 'gateways' ? '#fff' : '#4b7ab5',
            }}>
            <Router size={12} /> Gateways ({gws.length})
          </button>
        </div>
      </div>

      {/* ── Tab: Switches ──────────────────────────────────── */}
      {tab === 'switches' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Switches',         value: sw.length,   color:'#8b5cf6' },
              { label:'Puertos Activos',  value: totalUp,     color:'#10b981' },
              { label:'Puertos Inactivos',value: totalDown,   color:'#6b7280' },
              { label:'Puertos con Error',value: totalErrors, color:'#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="noc-card p-3">
                <div className="text-xs" style={{ color:'#6b8bb5' }}>{label}</div>
                <div className="text-2xl font-mono font-bold mt-1" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {swLoad ? (
            <div className="noc-card p-10 text-center">
              <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs" style={{ color:'#4b7ab5' }}>Cargando switches y puertos desde Aruba Central...</p>
            </div>
          ) : sw.length === 0 ? (
            <div className="noc-card p-10 text-center text-sm" style={{ color:'#374d6b' }}>
              No se encontraron switches
            </div>
          ) : (
            <div className="space-y-4">
              {sw.map((s: NetworkSwitch) => <SwitchCard key={s.serial} sw={s} />)}
            </div>
          )}
        </>
      )}

      {/* ── Tab: Gateways ─────────────────────────────────── */}
      {tab === 'gateways' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Total Gateways',  value: gws.length,                                                color:'#06b6d4' },
              { label:'En Línea',        value: gws.filter(g => g.status === 'online').length,             color:'#10b981' },
              { label:'Con Problemas',   value: gws.filter(g => g.status !== 'online').length,             color:'#f59e0b' },
              { label:'Túneles Activos', value: gws.reduce((s, g) => s + (g.tunnels || 0), 0),            color:'#8b5cf6' },
            ].map(({ label, value, color }) => (
              <div key={label} className="noc-card p-3">
                <div className="text-xs" style={{ color:'#6b8bb5' }}>{label}</div>
                <div className="text-2xl font-mono font-bold mt-1" style={{ color }}>{value}</div>
              </div>
            ))}
          </div>

          {gwLoad ? (
            <div className="noc-card p-10 text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs" style={{ color:'#4b7ab5' }}>Buscando gateways en Aruba Central...</p>
            </div>
          ) : gws.length === 0 ? (
            <div className="noc-card p-8 text-center">
              <Router size={32} className="mx-auto mb-3" style={{ color:'#2a3f6e' }} />
              <p className="text-sm font-medium" style={{ color:'#4b7ab5' }}>No se encontraron gateways</p>
              <p className="text-xs mt-1" style={{ color:'#374d6b' }}>
                La cuenta PUCESE puede no tener Aruba Gateways o Mobility Controllers registrados en Central.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {gws.map((g: Gateway) => <GatewayCard key={g.serial} gw={g} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
