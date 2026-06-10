import { useState } from 'react';
import {
  Bell, CheckCheck, AlertTriangle, Info, Filter, X, Wifi, WifiOff,
  Thermometer, Cpu, Server, RefreshCw, Phone, Network,
  ChevronRight, Clock, MapPin, Hash, Monitor, Zap, Activity,
  AlertOctagon, CheckCircle, LifeBuoy, Radio, Download,
} from 'lucide-react';
import { exportCsv } from '../utils/exportCsv';
import { useAlerts, useAPs, useSwitches } from '../hooks/useData';
import { api } from '../api/client';
import type { Alert, AlertSeverity, AccessPoint, NetworkSwitch } from '../types';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';

/* ── Colores por severidad ──────────────────────────────────── */
const SEV: Record<AlertSeverity, { color: string; bg: string; border: string; icon: JSX.Element; label: string }> = {
  critical: { color:'#ef4444', bg:'var(--sev-critical-bg)', border:'var(--sev-critical-border)', icon:<AlertTriangle size={14} style={{ color:'#ef4444' }} />, label:'Crítico' },
  warning:  { color:'#f59e0b', bg:'var(--sev-warning-bg)', border:'var(--sev-warning-border)', icon:<AlertTriangle size={14} style={{ color:'#f59e0b' }} />, label:'Advertencia' },
  info:     { color:'#3b82f6', bg:'var(--sev-info-bg)', border:'var(--sev-info-border)', icon:<Info size={14} style={{ color:'#3b82f6' }} />,          label:'Info' },
};

/* ── Pasos de diagnóstico y acciones según categoría ────────── */
interface ActionPlan {
  diagnosis: string[];
  steps: { icon: JSX.Element; text: string; priority: 'high' | 'medium' | 'low' }[];
  buttons: { label: string; icon: JSX.Element; color: string; action: string }[];
}

function getActionPlan(alert: Alert, ap?: AccessPoint | null, sw?: NetworkSwitch | null): ActionPlan {
  const cat = (alert.category || '').toLowerCase();
  const msg = (alert.message   || '').toLowerCase();

  /* AP OFFLINE */
  if (msg.includes('desconectado') || msg.includes('offline') || cat.includes('ap offline')) {
    return {
      diagnosis: [
        ap?.downReason ? `Razón reportada: ${ap.downReason}` : 'El AP no responde a pings desde el controlador',
        ap?.lldpNeighbor ? `Conectado al switch: ${ap.lldpNeighbor} · Puerto: ${ap.lldpPort}` : 'Verificar conexión física al switch de acceso',
        ap?.uptime === 0 ? 'Uptime en 0 — posible corte de energía o cable' : `Último uptime: ${Math.floor((ap?.uptime ?? 0) / 3600)}h`,
      ],
      steps: [
        { icon: <Zap size={14} />,     text: 'Verificar alimentación PoE en el switch de acceso', priority: 'high' },
        { icon: <Network size={14} />, text: 'Confirmar que el cable Ethernet llega al AP', priority: 'high' },
        { icon: <RefreshCw size={14} />, text: 'Si PoE está activo, reiniciar el puerto del switch', priority: 'medium' },
        { icon: <Radio size={14} />,   text: 'Verificar configuración de VLAN de management', priority: 'medium' },
        { icon: <Phone size={14} />,   text: 'Si persiste, escalar al proveedor Aruba o revisar físicamente', priority: 'low' },
      ],
      buttons: [
        { label: 'Ping AP', icon: <Activity size={13} />, color: '#3b82f6', action: `ping ${ap?.ip ?? alert.device}` },
        { label: 'Ver en Aruba', icon: <Monitor size={13} />, color: '#6366f1', action: 'aruba-central' },
        { label: 'Reconocer', icon: <CheckCheck size={13} />, color: '#10b981', action: 'ack' },
      ],
    };
  }

  /* TEMPERATURA */
  if (msg.includes('temperatura') || msg.includes('°c') || cat.includes('temp')) {
    const temp = ap?.temperature ?? parseInt(msg.match(/(\d+)/)?.[1] ?? '0');
    return {
      diagnosis: [
        `Temperatura actual: ${temp}°C (umbral crítico: 70°C)`,
        temp > 80  ? 'Temperatura muy peligrosa — daño permanente posible' :
        temp > 70  ? 'Temperatura crítica — riesgo de shutdown automático' :
                    'Temperatura elevada — monitorizar',
        'Posible causa: ventilación bloqueada, AC deficiente o alta carga de clientes',
      ],
      steps: [
        { icon: <Thermometer size={14} />, text: 'Verificar ventilación del área donde está el AP', priority: 'high' },
        { icon: <Cpu size={14} />,        text: `Revisar carga de clientes actual: ${ap?.clients ?? '?'} clientes conectados`, priority: 'high' },
        { icon: <RefreshCw size={14} />,  text: 'Reiniciar el AP si la temperatura supera 75°C', priority: 'medium' },
        { icon: <MapPin size={14} />,     text: 'Revisar físicamente la instalación — posible obstrucción de rejillas', priority: 'medium' },
        { icon: <Phone size={14} />,      text: 'Si hay AC en la sala, verificar que funcione correctamente', priority: 'low' },
      ],
      buttons: [
        { label: 'Reiniciar AP', icon: <RefreshCw size={13} />, color: '#f59e0b', action: 'reboot' },
        { label: 'Ver en Aruba', icon: <Monitor size={13} />, color: '#6366f1', action: 'aruba-central' },
        { label: 'Reconocer', icon: <CheckCheck size={13} />, color: '#10b981', action: 'ack' },
      ],
    };
  }

  /* CPU ALTO */
  if (msg.includes('cpu') || cat.includes('cpu')) {
    const cpu = ap?.cpuUsage ?? parseInt(msg.match(/(\d+)%/)?.[1] ?? '0');
    return {
      diagnosis: [
        `CPU actual: ${cpu}% (umbral de alerta: 70%)`,
        `Clientes conectados: ${ap?.clients ?? '?'} — exceso puede saturar el procesador`,
        'Posibles causas: demasiados clientes, interferencia RF, escaneo de red',
      ],
      steps: [
        { icon: <Cpu size={14} />,      text: 'Verificar número de clientes y redistribuir si supera 30 por AP', priority: 'high' },
        { icon: <Radio size={14} />,    text: 'Revisar interferencias RF en el canal actual', priority: 'high' },
        { icon: <RefreshCw size={14} />, text: 'Reiniciar el AP para liberar memoria y procesos', priority: 'medium' },
        { icon: <Network size={14} />,  text: 'Considerar habilitar band steering hacia 5GHz', priority: 'medium' },
        { icon: <Activity size={14} />, text: 'Monitorizar por 15 min para ver si baja naturalmente', priority: 'low' },
      ],
      buttons: [
        { label: 'Reiniciar AP', icon: <RefreshCw size={13} />, color: '#f59e0b', action: 'reboot' },
        { label: 'Ver clientes', icon: <Wifi size={13} />, color: '#3b82f6', action: 'clients' },
        { label: 'Reconocer', icon: <CheckCheck size={13} />, color: '#10b981', action: 'ack' },
      ],
    };
  }

  /* ERRORES CRC / PUERTO */
  if (msg.includes('crc') || msg.includes('puerto') || msg.includes('port') || cat.includes('puerto')) {
    return {
      diagnosis: [
        'Errores CRC indican problemas de capa física — cable o SFP defectuoso',
        sw ? `Switch afectado: ${sw.name} · IP: ${sw.ip}` : `Switch: ${alert.device}`,
        'Un puerto con CRC alto puede causar pérdida de paquetes y degradar la red',
      ],
      steps: [
        { icon: <Network size={14} />, text: 'Reemplazar el cable de red conectado al puerto con errores', priority: 'high' },
        { icon: <Zap size={14} />,     text: 'Verificar conectores RJ45 — posible corrosión o daño físico', priority: 'high' },
        { icon: <RefreshCw size={14} />, text: 'Deshabilitar y habilitar el puerto para limpiar contadores', priority: 'medium' },
        { icon: <Activity size={14} />, text: 'Revisar velocidad/duplex negociada — forzar a 1G Full si es necesario', priority: 'medium' },
        { icon: <Server size={14} />,  text: 'Si persiste, mover el dispositivo a otro puerto del switch', priority: 'low' },
      ],
      buttons: [
        { label: 'Deshabilitar puerto', icon: <Zap size={13} />, color: '#ef4444', action: 'disable-port' },
        { label: 'Ver switch', icon: <Server size={13} />, color: '#6366f1', action: 'switches' },
        { label: 'Reconocer', icon: <CheckCheck size={13} />, color: '#10b981', action: 'ack' },
      ],
    };
  }

  /* DEFAULT */
  return {
    diagnosis: [
      alert.detail ?? 'Sin información adicional del API',
      `Dispositivo: ${alert.device}`,
      `Categoría: ${alert.category}`,
    ],
    steps: [
      { icon: <Activity size={14} />, text: 'Verificar el estado del dispositivo en Aruba Central', priority: 'high' },
      { icon: <RefreshCw size={14} />, text: 'Reiniciar el dispositivo si no hay comunicación', priority: 'medium' },
      { icon: <Phone size={14} />,    text: 'Escalar al equipo de redes si persiste por más de 30 min', priority: 'low' },
    ],
    buttons: [
      { label: 'Ver en Aruba', icon: <Monitor size={13} />, color: '#6366f1', action: 'aruba-central' },
      { label: 'Reconocer', icon: <CheckCheck size={13} />, color: '#10b981', action: 'ack' },
    ],
  };
}

/* ── Modal de detalle ──────────────────────────────────────── */
function AlertModal({
  alert, ap, sw, onClose, onAck, acking,
}: {
  alert: Alert;
  ap: AccessPoint | null;
  sw: NetworkSwitch | null;
  onClose: () => void;
  onAck: (id: string) => void;
  acking: string | null;
}) {
  const s    = SEV[alert.severity];
  const plan = getActionPlan(alert, ap, sw);
  const ARUBA_BASE = 'https://app.central.arubanetworks.com';

  const handleButton = (action: string) => {
    if (action === 'ack') { onAck(alert.id); return; }
    if (action === 'aruba-central') {
      window.open(`${ARUBA_BASE}/frontend/#/DASHBOARD/NETWORK/ACCESS_POINTS/`, '_blank');
      return;
    }
    if (action === 'clients') { window.location.href = '/clients'; return; }
    if (action === 'switches') { window.location.href = '/switches'; return; }
    // ping, reboot, disable-port — solo informar
    alert && window.open(`${ARUBA_BASE}/frontend/`, '_blank');
  };

  const PRIORITY_STYLE: Record<string, { color: string; bg: string; border: string; label: string }> = {
    high:   { color: '#ef4444', bg: 'var(--sev-critical-bg)', border: 'var(--sev-critical-border)', label: 'URGENTE' },
    medium: { color: '#f59e0b', bg: 'var(--sev-warning-bg)', border: 'var(--sev-warning-border)', label: 'IMPORTANTE' },
    low:    { color: '#3b82f6', bg: 'var(--sev-info-bg)', border: 'var(--sev-info-border)', label: 'OPCIONAL' },
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg"
        style={{
          background: 'var(--panel)',
          border: `1px solid ${s.border}`,
          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: s.bg }}>
              {alert.severity === 'critical'
                ? <AlertOctagon size={22} style={{ color: s.color }} />
                : <AlertTriangle size={22} style={{ color: s.color }} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
                  {s.label}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--panel-3)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {alert.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-[color:var(--text)] mt-1">{alert.message}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Timestamps */}
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: es })}
            </span>
            <span>{format(new Date(alert.timestamp), 'dd/MM/yyyy HH:mm:ss')}</span>
            {alert.building && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} /> {alert.building}
              </span>
            )}
            {alert.acknowledged && (
              <span className="flex items-center gap-1.5 text-green-400">
                <CheckCircle size={12} /> Reconocida
              </span>
            )}
          </div>

          {/* Dispositivo — datos reales del AP */}
          {ap && (
            <div className="rounded-lg p-4 space-y-3"
              style={{ background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--muted)' }}>
                <Radio size={12} /> Dispositivo afectado (datos en tiempo real)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Nombre',   value: ap.name,     icon: <Wifi size={11} /> },
                  { label: 'Serial',   value: ap.serial,   icon: <Hash size={11} /> },
                  { label: 'IP',       value: ap.ip,       icon: <Network size={11} /> },
                  { label: 'Modelo',   value: ap.model,    icon: <Monitor size={11} /> },
                  { label: 'Estado',   value: ap.status,   icon: ap.status === 'offline' ? <WifiOff size={11} /> : <Wifi size={11} /> },
                  { label: 'Clientes', value: `${ap.clients}`, icon: <Activity size={11} /> },
                  { label: 'CPU',      value: `${ap.cpuUsage}%`, icon: <Cpu size={11} /> },
                  { label: 'Temp',     value: `${ap.temperature}°C`, icon: <Thermometer size={11} /> },
                  { label: 'Edificio', value: ap.building, icon: <MapPin size={11} /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} className="p-2.5 rounded-lg"
                    style={{ background: 'var(--panel-3)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: 'var(--muted)' }}>
                      {icon} {label}
                    </div>
                    <div className="text-sm font-mono font-medium truncate"
                      style={{
                        color: label === 'Estado'
                          ? ap.status === 'offline' ? '#ef4444' : ap.status === 'warning' ? '#f59e0b' : '#10b981'
                          : label === 'CPU' && ap.cpuUsage > 70 ? '#f59e0b'
                          : label === 'Temp' && ap.temperature > 65 ? '#ef4444'
                          : '#e2e8f0',
                      }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
              {ap.downReason && (
                <div className="mt-2 p-2.5 rounded-lg text-xs"
                  style={{ background: 'var(--danger-soft)', border: '1px solid var(--sev-critical-border)', color: 'var(--danger-text)' }}>
                  <span className="font-bold">Razón de caída (API):</span> {ap.downReason}
                </div>
              )}
              {ap.lldpNeighbor && (
                <div className="p-2.5 rounded-lg text-xs"
                  style={{ background: 'var(--panel-2)', border: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>
                  <span style={{ color: 'var(--muted)' }}>Conectado a:</span>{' '}
                  <span className="font-mono text-[color:var(--text)]">{ap.lldpNeighbor}</span>
                  {ap.lldpPort && <> · Puerto <span className="font-mono text-[color:var(--text)]">{ap.lldpPort}</span></>}
                </div>
              )}
            </div>
          )}

          {/* Switch data si aplica */}
          {sw && !ap && (
            <div className="rounded-lg p-4"
              style={{ background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
                style={{ color: 'var(--muted)' }}>
                <Server size={12} /> Switch afectado
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                {[
                  ['Nombre', sw.name], ['IP', sw.ip], ['Serial', sw.serial],
                  ['Estado', sw.status], ['CPU', `${sw.cpuUsage}%`], ['Temp', `${sw.temperature}°C`],
                ].map(([l, v]) => (
                  <div key={l}>
                    <span style={{ color: 'var(--muted)' }}>{l}: </span>
                    <span className="font-mono text-[color:var(--text)]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnóstico */}
          <div className="rounded-lg p-4"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: s.color }}>
              <AlertTriangle size={12} /> Diagnóstico
            </div>
            <ul className="space-y-1.5">
              {plan.diagnosis.map((d, i) => (
                <li key={i} className="text-sm flex items-start gap-2" style={{ color: 'var(--text)' }}>
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  {d}
                </li>
              ))}
            </ul>
          </div>

          {/* Pasos de solución */}
          <div className="rounded-lg p-4"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: '#10b981' }}>
              <LifeBuoy size={12} /> Plan de acción
            </div>
            <ol className="space-y-2">
              {plan.steps.map((step, i) => {
                const ps = PRIORITY_STYLE[step.priority];
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                      style={{ background: ps.bg, color: ps.color, border: `1px solid ${ps.border}` }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-[color:var(--text)]">{step.text}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: ps.bg, color: ps.color }}>
                          {ps.label}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 pt-1">
            {plan.buttons.map((btn) => (
              <button key={btn.action}
                onClick={() => handleButton(btn.action)}
                disabled={btn.action === 'ack' && (acking === alert.id || alert.acknowledged)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 active:scale-95"
                style={{
                  background: 'var(--panel-2)',
                  color:      btn.color,
                  border:     '1px solid var(--border)',
                  opacity:    btn.action === 'ack' && alert.acknowledged ? 0.5 : 1,
                }}>
                {btn.icon}
                {btn.action === 'ack' && acking === alert.id ? 'Reconociendo...' : btn.label}
              </button>
            ))}
          </div>

          {/* Detail del API */}
          {alert.detail && (
            <div className="text-xs p-3 rounded-lg font-mono"
              style={{ background: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
              <span style={{ color: 'var(--dim)' }}>API detail: </span>{alert.detail}
            </div>
          )}

          {/* Device raw */}
          <div className="text-xs font-mono" style={{ color: 'var(--border)' }}>
            ID: {alert.id} · Dispositivo: {alert.device}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ─────────────────────────────────────── */
export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const { data: aps }               = useAPs();
  const { data: switches }          = useSwitches();
  const qc                          = useQueryClient();
  const [filter, setFilter]         = useState<'all' | AlertSeverity | 'unack'>('unack');
  const [acking, setAcking]         = useState<string | null>(null);
  const [selected, setSelected]     = useState<Alert | null>(null);

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
      if (selected?.id === id) setSelected(null);
    } finally { setAcking(null); }
  };

  const ackAll = async () => {
    for (const a of (alerts ?? []).filter(a => !a.acknowledged)) await ack(a.id);
  };

  /* Buscar AP relacionado con la alerta */
  const findAP = (alert: Alert): AccessPoint | null => {
    if (!aps) return null;
    const dev = (alert.device || '').toLowerCase();
    return aps.find((ap: AccessPoint) =>
      ap.serial?.toLowerCase() === dev ||
      ap.name?.toLowerCase().includes(dev) ||
      dev.includes(ap.name?.toLowerCase() ?? '') ||
      ap.ip === alert.device
    ) ?? null;
  };

  const findSwitch = (alert: Alert): NetworkSwitch | null => {
    if (!switches) return null;
    const dev = (alert.device || '').toLowerCase();
    return switches.find((sw: NetworkSwitch) =>
      sw.serial?.toLowerCase() === dev ||
      sw.name?.toLowerCase().includes(dev) ||
      dev.includes(sw.name?.toLowerCase() ?? '') ||
      sw.ip === alert.device
    ) ?? null;
  };

  const FILTERS = [
    { key:'unack',    label:'Sin reconocer', count: counts.unack,    color:'#ef4444',        bg:'var(--sev-critical-bg)', border:'var(--sev-critical-border)' },
    { key:'all',      label:'Todas',          count: counts.all,      color:'var(--text-2)',  bg:'var(--panel-3)',         border:'var(--border)' },
    { key:'critical', label:'Críticas',       count: counts.critical, color:'#ef4444',        bg:'var(--sev-critical-bg)', border:'var(--sev-critical-border)' },
    { key:'warning',  label:'Advertencias',   count: counts.warning,  color:'#f59e0b',        bg:'var(--sev-warning-bg)',  border:'var(--sev-warning-border)' },
    { key:'info',     label:'Informativas',   count: counts.info,     color:'#3b82f6',        bg:'var(--sev-info-bg)',     border:'var(--sev-info-border)' },
  ] as const;

  return (
    <div className="space-y-4 card-enter">

      {/* Modal */}
      {selected && (
        <AlertModal
          alert={selected}
          ap={findAP(selected)}
          sw={findSwitch(selected)}
          onClose={() => setSelected(null)}
          onAck={ack}
          acking={acking}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[color:var(--text)]">Centro de Alertas</h1>
          <p className="text-xs mt-0.5" style={{ color:'var(--muted)' }}>
            Eventos y notificaciones de red — PUCESE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv('alertas', filtered as unknown as Record<string, unknown>[], [
              { key:'severity', label:'Severidad' }, { key:'category', label:'Categoría' },
              { key:'device', label:'Dispositivo' }, { key:'message', label:'Mensaje' },
              { key:'detail', label:'Detalle' }, { key:'building', label:'Edificio' },
              { key:'timestamp', label:'Fecha' }, { key:'acknowledged', label:'Reconocida' },
            ])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
            style={{ background:'var(--panel)', color:'var(--accent)', border:'1px solid var(--border)' }}
            title="Exportar la vista filtrada a CSV"
          >
            <Download size={12} /> CSV
          </button>
          {counts.unack > 0 && (
            <button onClick={ackAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
              style={{ background:'var(--ok-bg)', color:'#10b981', border:'1px solid var(--ok-border)' }}>
              <CheckCheck size={13} /> Reconocer todas ({counts.unack})
            </button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Sin Reconocer', value: counts.unack,    color:'#ef4444' },
          { label:'Críticas',      value: counts.critical, color:'#ef4444' },
          { label:'Advertencias',  value: counts.warning,  color:'#f59e0b' },
          { label:'Informativas',  value: counts.info,     color:'#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="noc-card p-3">
            <div className="text-xs" style={{ color:'var(--text-2)' }}>{label}</div>
            <div className="text-2xl font-mono font-bold mt-1" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} style={{ color:'var(--muted)' }} />
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{
              background: filter === f.key ? f.bg : 'var(--panel)',
              color: filter === f.key ? f.color : 'var(--muted)',
              border: `1px solid ${filter === f.key ? f.border : 'var(--border)'}`,
            }}>
            {f.label}
            <span className="font-mono px-1 rounded" style={{ background: f.bg, color: f.color }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      {isLoading ? (
        <div className="noc-card p-8 text-center text-sm" style={{ color:'var(--muted)' }}>Cargando alertas...</div>
      ) : filtered.length === 0 ? (
        <div className="noc-card p-12 text-center">
          <CheckCheck size={32} style={{ color:'#10b981', margin:'0 auto 12px' }} />
          <div className="text-sm font-medium text-[color:var(--text)]">Sin alertas activas</div>
          <div className="text-xs mt-1" style={{ color:'var(--muted)' }}>La red opera normalmente</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a: Alert) => {
            const s = SEV[a.severity];
            return (
              <div key={a.id}
                className="noc-card p-4 transition-all duration-200 cursor-pointer"
                style={{
                  opacity: a.acknowledged ? 0.55 : 1,
                  borderColor: a.acknowledged ? undefined : s.border,
                }}
                onClick={() => setSelected(a)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-lg mt-0.5" style={{ background: s.bg }}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                            style={{ background: s.bg, color: s.color, border:`1px solid ${s.border}` }}>
                            {s.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background:'var(--panel-3)', color:'var(--text-2)', border:'1px solid var(--border)' }}>
                            {a.category}
                          </span>
                          {a.building && (
                            <span className="text-xs" style={{ color:'var(--dim)' }}>{a.building}</span>
                          )}
                          {a.acknowledged && (
                            <span className="text-xs flex items-center gap-1" style={{ color:'#10b981' }}>
                              <CheckCheck size={10} /> Reconocida
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-sm text-[color:var(--text)] mt-1.5">{a.message}</div>
                        {a.detail && (
                          <div className="text-xs mt-1 truncate" style={{ color:'var(--text-2)' }}>{a.detail}</div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs" style={{ color:'var(--muted)' }}>
                          <span className="font-mono">{a.device}</span>
                          <span>·</span>
                          <span>{formatDistanceToNow(new Date(a.timestamp), { addSuffix:true, locale:es })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!a.acknowledged && (
                          <button onClick={e => { e.stopPropagation(); ack(a.id); }}
                            disabled={acking === a.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
                            style={{ background:'var(--ok-bg)', color:'#10b981', border:'1px solid var(--ok-border)' }}>
                            <CheckCheck size={12} />
                            {acking === a.id ? '...' : 'Reconocer'}
                          </button>
                        )}
                        <ChevronRight size={16} style={{ color:'var(--dim)' }} />
                      </div>
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
