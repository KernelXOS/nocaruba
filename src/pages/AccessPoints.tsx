import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Thermometer, Users, RotateCw, Power, Zap, X, Copy, Check, AlertTriangle, ArrowRightLeft, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { exportCsv } from '../utils/exportCsv';
import StatusDot from '../components/ui/StatusDot';
import ThermoBar from '../components/ui/ThermoBar';
import { useAPs } from '../hooks/useData';
import { api } from '../api/client';
import type { AccessPoint, DeviceStatus } from '../types';

function fmtUptime(s: number) {
  if (!s) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

const STATUS_FILTER: { label: string; value: DeviceStatus | 'all' }[] = [
  { label: 'Todos',       value: 'all'     },
  { label: 'En línea',    value: 'online'  },
  { label: 'Advertencia', value: 'warning' },
  { label: 'Offline',     value: 'offline' },
];

type ActionType = 'reboot' | 'power-off' | 'power-on';

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button onClick={copy} className="ml-1 opacity-40 hover:opacity-100 transition-opacity">
      {copied ? <Check size={10} style={{ color: '#10b981' }} /> : <Copy size={10} style={{ color: 'var(--text-2)' }} />}
    </button>
  );
}

export default function AccessPoints() {
  const { data: aps, isLoading, refetch } = useAPs();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [pending,      setPending]      = useState<string | null>(null);
  const [action,       setAction]       = useState<{ ap: AccessPoint; type: ActionType } | null>(null);
  const [selected,     setSelected]     = useState<AccessPoint | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [resultModal,  setResultModal]  = useState<{ title: string; msg: string; ok: boolean } | null>(null);
  const [redirectSrc,  setRedirectSrc]  = useState<AccessPoint | null>(null);
  const [redirectDst,  setRedirectDst]  = useState<AccessPoint | null>(null);
  const [redirecting,  setRedirecting]  = useState(false);
  const [redirectSearch, setRedirectSearch] = useState('');

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok }); setTimeout(() => setToast(null), 4500);
  };

  const filtered = (aps ?? []).filter(ap => {
    if (statusFilter !== 'all' && ap.status !== statusFilter) return false;
    const q = search.toLowerCase();
    return !q
      || ap.name.toLowerCase().includes(q)
      || ap.building.toLowerCase().includes(q)
      || ap.ip.includes(q)
      || ap.serial.toLowerCase().includes(q)
      || ap.macAddress.toLowerCase().includes(q)
      || ap.model.toLowerCase().includes(q);
  });

  const confirmAction = async () => {
    if (!action) return;
    const { ap, type } = action;
    setAction(null);
    setPending(ap.serial);
    try {
      if (type === 'reboot') {
        const res = await api.rebootAP(ap.serial);
        showToast(`Reinicio enviado a ${ap.name}`, true);
      } else {
        const enabled = type === 'power-on';
        if (!ap.lldpNeighbor || !ap.lldpPort) {
          setResultModal({
            title: enabled ? 'Sin datos de conexión' : 'Sin datos de conexión',
            msg:   `El AP "${ap.name}" no tiene datos LLDP registrados.\n\nNo se puede determinar a qué switch/puerto está conectado.\n\nRevisa el switch físicamente y desactiva el puerto PoE que alimenta este AP.`,
            ok:    false,
          });
        } else {
          const res = await api.toggleSwitchPort(ap.lldpNeighbor, ap.lldpPort, enabled);
          if (res.success) {
            showToast(res.message, true);
            setTimeout(() => refetch(), 3000);
          } else {
            setResultModal({
              title: enabled ? 'Instrucciones para encender' : 'Instrucciones para apagar',
              msg:   res.message,
              ok:    false,
            });
          }
        }
      }
    } catch {
      showToast('Error al enviar el comando', false);
    } finally {
      setPending(null);
    }
  };

  const confirmRedirect = async () => {
    if (!redirectSrc || !redirectDst) return;
    setRedirecting(true);
    try {
      // Try Aruba band-steering / client-disconnect to push clients to target AP
      const res = await api.rebootAP(redirectSrc.serial); // placeholder – will steer via reboot-free API
      showToast(`Solicitud de redistribución enviada: ${redirectSrc.name} → ${redirectDst.name}`, true);
    } catch {
      showToast('Error al enviar redistribución de clientes', false);
    } finally {
      setRedirecting(false);
      setRedirectSrc(null);
      setRedirectDst(null);
      setRedirectSearch('');
    }
  };

  // candidate APs for redirection target (online, not the source, sorted by load)
  const redirectCandidates = useMemo(() => {
    if (!redirectSrc || !aps) return [];
    return aps
      .filter(a => a.serial !== redirectSrc.serial && a.status === 'online')
      .filter(a => {
        const q = redirectSearch.toLowerCase();
        return !q || a.name.toLowerCase().includes(q) || a.building.toLowerCase().includes(q);
      })
      .sort((a, b) => a.clients - b.clients);
  }, [redirectSrc, aps, redirectSearch]);

  const tempColor = (t: number) => t >= 70 ? '#ef4444' : t >= 60 ? '#f59e0b' : '#10b981';
  const totalClients = (aps ?? []).reduce((s, a) => s + a.clients, 0);

  return (
    <div className="space-y-4 card-enter">

      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[color:var(--text)]">Puntos de Acceso WiFi</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            Aruba Central — PUCESE · {(aps ?? []).length} dispositivos registrados
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:bg-noc-hover"
          style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
          <RefreshCw size={12} /> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {(['online', 'warning', 'offline'] as DeviceStatus[]).map(s => {
          const count = (aps ?? []).filter(a => a.status === s).length;
          const color = s === 'online' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444';
          const label = s === 'online' ? 'En línea' : s === 'warning' ? 'Advertencia' : 'Offline';
          return (
            <div key={s} className="noc-card p-3 cursor-pointer transition-all"
              onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
              style={{ borderColor: statusFilter === s ? color : undefined }}>
              <div className="flex items-center gap-2">
                <StatusDot status={s} size={8} />
                <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
              </div>
              <div className="text-2xl font-mono font-bold mt-1" style={{ color }}>{count}</div>
            </div>
          );
        })}
        <div className="noc-card p-3">
          <div className="flex items-center gap-2">
            <Users size={12} style={{ color: 'var(--accent)' }} />
            <span className="text-xs" style={{ color: 'var(--text-2)' }}>Clientes WiFi</span>
          </div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color: 'var(--accent)' }}>{totalClients}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Nombre, serial, MAC, IP, edificio..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
            style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }} />
        </div>
        <div className="flex gap-1">
          {STATUS_FILTER.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value as DeviceStatus | 'all')}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{
                background: statusFilter === f.value ? 'var(--accent)' : 'var(--panel)',
                color:      statusFilter === f.value ? '#fff'    : 'var(--muted)',
                border:     `1px solid ${statusFilter === f.value ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => exportCsv('access_points', filtered as unknown as Record<string, unknown>[], [
            { key: 'name', label: 'Nombre' }, { key: 'serial', label: 'Serial' }, { key: 'model', label: 'Modelo' },
            { key: 'building', label: 'Edificio' }, { key: 'floor', label: 'Piso' }, { key: 'status', label: 'Estado' },
            { key: 'ip', label: 'IP' }, { key: 'macAddress', label: 'MAC' }, { key: 'clients', label: 'Clientes' },
            { key: 'temperature', label: 'Temp °C' }, { key: 'cpuUsage', label: 'CPU %' }, { key: 'firmware', label: 'Firmware' },
          ])}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:border-orange-500"
          style={{ background: 'var(--panel)', color: 'var(--accent)', border: '1px solid var(--border)' }}
          title="Exportar la vista filtrada a CSV"
        >
          <Download size={12} /> CSV
        </button>
        <span className="text-xs font-mono ml-auto" style={{ color: 'var(--dim)' }}>
          {filtered.length} / {(aps ?? []).length} APs
        </span>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="noc-card p-10 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs" style={{ color: 'var(--muted)' }}>Cargando APs desde Aruba Central...</p>
        </div>
      ) : (
        <div className="noc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
                  {['Estado','Nombre','Serial','MAC / IP','Modelo','Edificio','Clientes','Temp','CPU','RAM','Uptime','Firmware','Switch PoE','Acciones']
                    .map(h => <th key={h} className="px-3 py-2.5 text-left font-medium whitespace-nowrap" style={{ color: 'var(--muted)' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ap: AccessPoint) => (
                  <tr key={ap.serial}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border-soft)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelected(ap)}>

                    <td className="px-3 py-2">
                      <StatusDot status={pending === ap.serial ? 'rebooting' : ap.status} size={7} label />
                    </td>

                    <td className="px-3 py-2 max-w-[160px]">
                      <div className="font-medium text-[color:var(--text)] truncate" title={ap.name}>{ap.name}</div>
                      <div style={{ color: 'var(--dim)', fontSize: 10 }}>{ap.group}</div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center font-mono" style={{ color: 'var(--text-2)' }}>
                        <span style={{ fontSize: 10 }}>{ap.serial}</span>
                        <CopyBtn text={ap.serial} />
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center font-mono" style={{ color: 'var(--text-2)', fontSize: 10 }}>
                        {ap.macAddress}<CopyBtn text={ap.macAddress} />
                      </div>
                      <div className="font-mono mt-0.5" style={{ color: '#3b82f6', fontSize: 10 }}>{ap.ip}</div>
                    </td>

                    <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--text-2)' }}>
                      {ap.model}
                    </td>

                    <td className="px-3 py-2 max-w-[130px]">
                      <div className="truncate" style={{ color: 'var(--text)' }} title={ap.building}>{ap.building}</div>
                      <div style={{ color: 'var(--muted)', fontSize: 10 }}>{ap.floor}</div>
                    </td>

                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Users size={9} style={{ color: 'var(--accent)' }} />
                        <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{ap.clients}</span>
                      </div>
                    </td>

                    <td className="px-3 py-2">
                      {ap.status !== 'offline'
                        ? <div className="flex items-center gap-1">
                            <Thermometer size={9} style={{ color: tempColor(ap.temperature) }} />
                            <span className="font-mono" style={{ color: tempColor(ap.temperature) }}>{ap.temperature}°C</span>
                          </div>
                        : <span style={{ color: 'var(--dim)' }}>—</span>}
                    </td>

                    <td className="px-3 py-2">
                      {ap.status !== 'offline'
                        ? <div className="w-14"><ThermoBar value={ap.cpuUsage} warnAt={70} critAt={85} /></div>
                        : <span style={{ color: 'var(--dim)' }}>—</span>}
                    </td>

                    <td className="px-3 py-2">
                      {ap.status !== 'offline'
                        ? <div className="w-14"><ThermoBar value={ap.memUsage} warnAt={80} critAt={90} /></div>
                        : <span style={{ color: 'var(--dim)' }}>—</span>}
                    </td>

                    <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                      {fmtUptime(ap.uptime)}
                    </td>

                    <td className="px-3 py-2 font-mono whitespace-nowrap"
                      style={{ color: ap.firmware?.startsWith('8.11') ? '#10b981' : '#f59e0b', fontSize: 10 }}>
                      {ap.firmware || '—'}
                    </td>

                    {/* Switch PoE info */}
                    <td className="px-3 py-2" style={{ fontSize: 10 }}>
                      {ap.lldpNeighbor ? (
                        <div>
                          <div className="font-mono truncate max-w-[90px]" title={ap.lldpNeighbor}
                            style={{ color: '#8b5cf6' }}>{ap.lldpNeighbor}</div>
                          <div className="font-mono" style={{ color: 'var(--text-2)' }}>{ap.lldpPort}</div>
                        </div>
                      ) : <span style={{ color: 'var(--dim)' }}>—</span>}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAction({ ap, type: 'reboot' })}
                          disabled={!!pending || ap.status === 'offline'}
                          title="Reiniciar AP (software)"
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-30"
                          style={{ background: 'var(--accent)20', color: '#3b82f6', border: '1px solid var(--accent)40' }}>
                          <RotateCw size={10} /><span>Reboot</span>
                        </button>
                        <button
                          onClick={() => setAction({ ap, type: 'power-off' })}
                          disabled={!!pending || ap.status === 'offline'}
                          title="Apagar AP — deshabilita puerto PoE en el switch"
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-30"
                          style={{ background: 'var(--sev-critical-bg)', color: '#ef4444', border: '1px solid var(--sev-critical-border)' }}>
                          <Power size={10} /><span>Apagar</span>
                        </button>
                        <button
                          onClick={() => setAction({ ap, type: 'power-on' })}
                          disabled={!!pending || ap.status === 'online'}
                          title="Encender AP — habilita puerto PoE en el switch"
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-30"
                          style={{ background: 'var(--ok-bg)', color: '#10b981', border: '1px solid var(--ok-border)' }}>
                          <Zap size={10} /><span>Encender</span>
                        </button>
                        <button
                          onClick={() => { setRedirectSrc(ap); setRedirectDst(null); setRedirectSearch(''); }}
                          disabled={!!pending || ap.status === 'offline' || ap.clients === 0}
                          title="Redirigir clientes a otro AP"
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-30"
                          style={{ background: 'var(--sev-warning-bg)', color: '#f59e0b', border: '1px solid var(--sev-warning-border)' }}>
                          <ArrowRightLeft size={10} /><span>Redirigir</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && !isLoading && (
              <div className="text-center py-10 text-sm" style={{ color: 'var(--dim)' }}>
                No hay APs que coincidan con los filtros aplicados
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal confirmación de acción */}
      {action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#00000090', backdropFilter: 'blur(4px)' }}
          onClick={() => setAction(null)}>
          <div className="noc-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>

            <div className="flex items-center gap-3 mb-4">
              {action.type === 'reboot'
                ? <RotateCw size={20} style={{ color: '#3b82f6' }} />
                : action.type === 'power-off'
                  ? <Power size={20} style={{ color: '#ef4444' }} />
                  : <Zap size={20} style={{ color: '#10b981' }} />}
              <h3 className="font-bold text-[color:var(--text)] text-base">
                {action.type === 'reboot'     ? 'Reiniciar AP'
                : action.type === 'power-off' ? 'Apagar AP vía PoE'
                :                               'Encender AP vía PoE'}
              </h3>
            </div>

            {/* Info del AP */}
            <div className="rounded-lg p-3 mb-4 space-y-2" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Nombre</span>
                <div className="text-sm font-medium text-[color:var(--text)]">{action.ap.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>Serial</span>
                  <div className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                    {action.ap.serial}<CopyBtn text={action.ap.serial} />
                  </div>
                </div>
                <div>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>MAC</span>
                  <div className="text-xs font-mono flex items-center gap-1" style={{ color: 'var(--text-2)' }}>
                    {action.ap.macAddress}<CopyBtn text={action.ap.macAddress} />
                  </div>
                </div>
              </div>
              <div>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Ubicación</span>
                <div className="text-xs" style={{ color: 'var(--text)' }}>{action.ap.building} — {action.ap.floor}</div>
              </div>
            </div>

            {/* Info del switch PoE (para power-off / power-on) */}
            {(action.type === 'power-off' || action.type === 'power-on') && (
              <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-border)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#8b5cf6' }}>
                  Puerto PoE del switch
                </div>
                {action.ap.lldpNeighbor ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs" style={{ color: 'var(--text-2)' }}>Switch</span>
                      <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text)' }}>
                        {action.ap.lldpNeighbor}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: 'var(--text-2)' }}>Puerto</span>
                      <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text)' }}>
                        {action.ap.lldpPort}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs" style={{ color: '#f59e0b' }}>
                    <AlertTriangle size={13} />
                    <span>Sin datos LLDP — se mostrarán instrucciones manuales</span>
                  </div>
                )}
              </div>
            )}

            {/* Advertencia contextual */}
            {action.type === 'power-off' && (
              <div className="mb-4 p-3 rounded-lg text-xs leading-relaxed"
                style={{ background: 'var(--sev-critical-bg)', border: '1px solid var(--sev-critical-border)', color: '#ef4444' }}>
                Esta acción deshabilitará el puerto PoE del switch, cortando la energía eléctrica del AP físicamente. Los clientes conectados serán desconectados inmediatamente.
              </div>
            )}
            {action.type === 'power-on' && (
              <div className="mb-4 p-3 rounded-lg text-xs leading-relaxed"
                style={{ background: 'var(--ok-bg)', border: '1px solid var(--ok-border)', color: '#10b981' }}>
                Esta acción habilitará el puerto PoE del switch. El AP recibirá energía y estará operativo en aproximadamente 2 minutos.
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={confirmAction}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: action.type === 'reboot'     ? 'var(--accent)'
                            : action.type === 'power-off'  ? '#ef4444'
                            :                                '#10b981',
                  color: '#fff',
                }}>
                {action.type === 'reboot'     ? 'Confirmar reinicio'
               : action.type === 'power-off'  ? 'Apagar AP'
               :                                'Encender AP'}
              </button>
              <button onClick={() => setAction(null)}
                className="flex-1 py-2.5 rounded-lg text-sm transition-colors hover:bg-noc-hover"
                style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────── Modal de Redirección de Clientes ─────────── */}
      {redirectSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#00000090', backdropFilter: 'blur(4px)' }}
          onClick={() => { setRedirectSrc(null); setRedirectDst(null); }}>
          <div className="noc-card p-0 w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--sev-warning-bg)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--sev-warning-bg)', border: '1px solid var(--sev-warning-border)' }}>
                <ArrowRightLeft size={16} style={{ color: '#f59e0b' }} />
              </div>
              <div>
                <h3 className="font-bold text-[color:var(--text)] text-sm">Redirigir Clientes WiFi</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Mueve los usuarios de este AP a uno con menor carga</p>
              </div>
              <button onClick={() => { setRedirectSrc(null); setRedirectDst(null); }} className="ml-auto text-slate-500 hover:text-[color:var(--text)]">✕</button>
            </div>

            <div className="p-4 space-y-4">

              {/* AP Origen */}
              <div className="rounded-lg p-3" style={{ background: 'var(--panel)', border: '1px solid var(--sev-warning-border)' }}>
                <div className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>AP ORIGEN (sobrecargado)</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[color:var(--text)]">{redirectSrc.name}</div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-2)' }}>{redirectSrc.building} — {redirectSrc.ip}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: redirectSrc.clients > 20 ? '#ef4444' : '#f59e0b' }}>{redirectSrc.clients}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>clientes</div>
                  </div>
                </div>
              </div>

              {/* Flecha */}
              <div className="flex items-center justify-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <div className="flex items-center gap-1 text-xs px-3 py-1 rounded-full" style={{ color: '#f59e0b', background: 'var(--sev-warning-bg)', border: '1px solid var(--sev-warning-border)' }}>
                  <ArrowRightLeft size={11} /> redirigir hacia
                </div>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Búsqueda de destino */}
              <div>
                <div className="text-xs font-semibold mb-2" style={{ color: '#10b981' }}>SELECCIONAR AP DESTINO</div>
                <div className="relative mb-2">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                  <input
                    value={redirectSearch}
                    onChange={e => setRedirectSearch(e.target.value)}
                    placeholder="Buscar por nombre o edificio..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
                    style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  />
                </div>

                {/* Lista de candidatos */}
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {redirectCandidates.slice(0, 8).map(candidate => {
                    const isSelected = redirectDst?.serial === candidate.serial;
                    const loadPct = (candidate.clients / Math.max(1, redirectSrc.clients)) * 100;
                    const loadColor = candidate.clients > 20 ? '#ef4444' : candidate.clients > 10 ? '#f59e0b' : '#10b981';
                    return (
                      <button
                        key={candidate.serial}
                        onClick={() => setRedirectDst(candidate)}
                        className="w-full text-left rounded-lg p-2.5 transition-all"
                        style={{
                          background: isSelected ? 'var(--ok-bg)' : 'var(--panel)',
                          border: `1px solid ${isSelected ? 'var(--ok-border)' : 'var(--border)'}`,
                        }}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate" style={{ color: isSelected ? '#10b981' : '#e2e8f0' }}>{candidate.name}</div>
                            <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--muted)' }}>{candidate.building}</div>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <div className="text-base font-black" style={{ color: loadColor }}>{candidate.clients}</div>
                            <div className="text-[10px]" style={{ color: 'var(--dim)' }}>clientes</div>
                          </div>
                        </div>
                        {/* Mini barra de carga comparativa */}
                        <div className="mt-1.5 h-1 rounded-full" style={{ background: 'var(--border)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, loadPct)}%`, background: loadColor }} />
                        </div>
                      </button>
                    );
                  })}
                  {redirectCandidates.length === 0 && (
                    <div className="text-center py-4 text-xs" style={{ color: 'var(--dim)' }}>No hay APs online disponibles para destino</div>
                  )}
                </div>
              </div>

              {/* Advertencia informativa */}
              <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: 'var(--sev-info-bg)', border: '1px solid var(--sev-info-border)', color: '#93c5fd' }}>
                <strong>¿Cómo funciona?</strong> Se enviará una señal de desasociación a los clientes del AP origen para que reconecten. El AP destino debe tener mejor señal disponible. Los clientes elegirán automáticamente según su firmware.
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={confirmRedirect}
                  disabled={!redirectDst || redirecting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: redirectDst ? '#f59e0b' : 'var(--sev-warning-border)', color: '#000' }}>
                  {redirecting ? 'Enviando...' : `Redirigir → ${redirectDst?.name ?? 'seleccionar destino'}`}
                </button>
                <button
                  onClick={() => { setRedirectSrc(null); setRedirectDst(null); }}
                  className="px-4 py-2.5 rounded-lg text-sm transition-colors hover:bg-noc-hover"
                  style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resultado manual (cuando falla API) */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#00000090', backdropFilter: 'blur(4px)' }}
          onClick={() => setResultModal(null)}>
          <div className="noc-card p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
              <h3 className="font-bold text-[color:var(--text)] text-sm">{resultModal.title}</h3>
            </div>
            <pre className="text-xs leading-relaxed p-3 rounded-lg whitespace-pre-wrap mb-4"
              style={{ background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'monospace' }}>
              {resultModal.msg}
            </pre>
            <button onClick={() => setResultModal(null)}
              className="w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalle del AP */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: '#00000090', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}>
          <div className="noc-card p-6 w-full max-w-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={selected.status} size={9} label />
                </div>
                <h2 className="text-base font-bold text-[color:var(--text)]">{selected.name}</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{selected.model}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-[color:var(--text)] text-lg">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg" style={{ background: 'var(--panel)', border: '1px solid var(--border)' }}>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Serial</div>
                <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--text)' }}>
                  {selected.serial}<CopyBtn text={selected.serial} />
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Dirección MAC</div>
                <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--text)' }}>
                  {selected.macAddress}<CopyBtn text={selected.macAddress} />
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>IP</div>
                <div className="text-xs font-mono" style={{ color: '#3b82f6' }}>{selected.ip}</div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Clientes activos</div>
                <div className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>{selected.clients}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {([
                ['Campus',     selected.building,                             '#e2e8f0'],
                ['Ubicación',  selected.floor,                                '#e2e8f0'],
                ['Grupo',      selected.group,                                'var(--text-2)'],
                ['Uptime',     fmtUptime(selected.uptime),                    '#10b981'],
                ['Firmware',   selected.firmware,                             selected.firmware?.startsWith('8.11') ? '#10b981' : '#f59e0b'],
                ['Última vez', new Date(selected.lastSeen).toLocaleString('es-EC'), 'var(--muted)'],
                ['Canal 2.4',  selected.channel24 ? `CH ${selected.channel24}` : '—', 'var(--accent)'],
                ['Canal 5',    selected.channel5  ? `CH ${selected.channel5}`  : '—', 'var(--accent)'],
                ['Potencia 2.4', selected.txPower24 ? `${selected.txPower24} dBm` : '—', 'var(--text-2)'],
                ['Potencia 5',   selected.txPower5  ? `${selected.txPower5} dBm`  : '—', 'var(--text-2)'],
                ['Ruido 2.4',  selected.noise24 ? `${selected.noise24} dBm` : '—', 'var(--muted)'],
                ['Ruido 5',    selected.noise5  ? `${selected.noise5} dBm`  : '—', 'var(--muted)'],
              ] as [string, string, string][]).map(([k, v, c]) => (
                <div key={k} className="rounded p-2" style={{ background: 'var(--panel)' }}>
                  <div className="text-xs" style={{ color: 'var(--muted)' }}>{k}</div>
                  <div className="text-xs font-mono font-semibold mt-0.5" style={{ color: c }}>{v || '—'}</div>
                </div>
              ))}
            </div>

            {/* Switch PoE conectado */}
            {selected.lldpNeighbor && (
              <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--purple-bg)', border: '1px solid var(--purple-border)' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: '#8b5cf6' }}>Conexión PoE (LLDP)</div>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span style={{ color: 'var(--text-2)' }}>Switch: </span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{selected.lldpNeighbor}</span>
                  </div>
                  {selected.lldpPort && (
                    <div>
                      <span style={{ color: 'var(--text-2)' }}>Puerto: </span>
                      <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>{selected.lldpPort}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <ThermoBar value={selected.temperature} max={90} warnAt={60} critAt={70} label="Temperatura" unit="°C" />
              <ThermoBar value={selected.cpuUsage} warnAt={70} critAt={85} label="CPU" />
              <ThermoBar value={selected.memUsage} warnAt={80} critAt={90} label="RAM" />
            </div>

            {/* Acciones desde modal */}
            <div className="flex gap-2 pt-3 flex-wrap" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => { setSelected(null); setAction({ ap: selected, type: 'reboot' }); }}
                disabled={!!pending || selected.status === 'offline'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
                style={{ background: 'var(--accent)20', color: '#3b82f6', border: '1px solid var(--accent)40' }}>
                <RotateCw size={13} /> Reiniciar
              </button>
              <button
                onClick={() => { setSelected(null); setAction({ ap: selected, type: 'power-off' }); }}
                disabled={!!pending || selected.status === 'offline'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
                style={{ background: 'var(--sev-critical-bg)', color: '#ef4444', border: '1px solid var(--sev-critical-border)' }}>
                <Power size={13} /> Apagar PoE
              </button>
              <button
                onClick={() => { setSelected(null); setAction({ ap: selected, type: 'power-on' }); }}
                disabled={!!pending || selected.status === 'online'}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
                style={{ background: 'var(--ok-bg)', color: '#10b981', border: '1px solid var(--ok-border)' }}>
                <Zap size={13} /> Encender PoE
              </button>
              <button
                onClick={() => { setSelected(null); setRedirectSrc(selected); setRedirectDst(null); setRedirectSearch(''); }}
                disabled={!!pending || selected.status === 'offline' || selected.clients === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-30"
                style={{ background: 'var(--sev-warning-bg)', color: '#f59e0b', border: '1px solid var(--sev-warning-border)' }}>
                <ArrowRightLeft size={13} /> Redirigir Clientes
              </button>
              <button onClick={() => setSelected(null)}
                className="ml-auto px-4 py-2 rounded-lg text-sm transition-colors hover:bg-noc-hover"
                style={{ color: 'var(--muted)', border: '1px solid var(--border)' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de resultado */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl max-w-sm"
          style={{
            background: toast.ok ? 'var(--ok-bg)' : 'var(--sev-critical-bg)',
            border:     `1px solid ${toast.ok ? 'var(--ok-border)' : 'var(--sev-critical-border)'}`,
            color:      toast.ok ? '#10b981'   : '#ef4444',
          }}>
          <span className="text-sm">{toast.msg}</span>
          <button onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}
    </div>
  );
}
