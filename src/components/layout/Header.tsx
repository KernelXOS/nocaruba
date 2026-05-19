import { useState, useEffect, useRef } from 'react';
import { LogOut, RefreshCw, Wifi, Cloud, CloudOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';
import { useAPs } from '../../hooks/useData';
import { api } from '../../api/client';

export default function Header() {
  const { user, logout } = useAuthStore();
  const qc         = useQueryClient();
  const isFetching = useIsFetching();
  const { data: aps } = useAPs();

  const [now,         setNow]         = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [proxyStatus, setProxyStatus] = useState<{ connected: boolean } | null>(null);
  const prevFetching  = useRef(0);

  // Reloj
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Detectar cuándo termina una carga → actualizar "hace X seg"
  useEffect(() => {
    if (prevFetching.current > 0 && isFetching === 0) {
      setLastUpdated(new Date());
    }
    prevFetching.current = isFetching;
  }, [isFetching]);

  // Estado del proxy Aruba Central
  useEffect(() => {
    const check = async () => {
      const st = await api.getProxyStatus();
      setProxyStatus(st ? { connected: true } : { connected: false });
    };
    check();
    const iv = setInterval(check, 15_000);
    return () => clearInterval(iv);
  }, []);

  const refresh = () => qc.invalidateQueries();

  const apList    = aps ?? [];
  const onlineAPs = apList.filter(a => a.status === 'online').length;
  const warnAPs   = apList.filter(a => a.status === 'warning').length;
  const health    = apList.length > 0 ? Math.round(((onlineAPs + warnAPs * 0.5) / apList.length) * 100) : 0;
  const healthColor = health >= 90 ? '#10b981' : health >= 70 ? '#f59e0b' : '#ef4444';

  // "hace X seg" — máximo 60s antes de mostrar minutos
  const secAgo = lastUpdated ? Math.round((now.getTime() - lastUpdated.getTime()) / 1000) : null;
  const agoLabel = secAgo === null ? null
    : secAgo < 5  ? 'ahora'
    : secAgo < 60 ? `hace ${secAgo}s`
    : `hace ${Math.floor(secAgo / 60)}m`;

  return (
    <header
      className="fixed top-0 left-56 right-0 z-20 h-14 flex items-center px-6 gap-3"
      style={{ background: '#080c1e', borderBottom: '1px solid #1e3460' }}
    >
      {/* Título */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Wifi size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />
        <div className="truncate">
          <span className="font-semibold text-sm text-white">Centro de Operaciones de Red</span>
          <span className="text-xs ml-2 hidden xl:inline" style={{ color: '#4b7ab5' }}>
            PUCESE — Pontificia Universidad Católica del Ecuador Sede Esmeraldas
          </span>
        </div>
      </div>

      {/* Badge Aruba Central */}
      {proxyStatus !== null && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs flex-shrink-0"
          style={{
            background: proxyStatus.connected ? '#10b98110' : '#ef444410',
            border: `1px solid ${proxyStatus.connected ? '#10b98130' : '#ef444430'}`,
          }}
        >
          {proxyStatus.connected
            ? <Cloud size={11} style={{ color: '#10b981' }} />
            : <CloudOff size={11} style={{ color: '#ef4444' }} />}
          <span style={{ color: proxyStatus.connected ? '#10b981' : '#ef4444' }}>
            {proxyStatus.connected ? 'Aruba Central' : 'Demo'}
          </span>
        </div>
      )}

      {/* Salud de red */}
      {apList.length > 0 && (
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono flex-shrink-0"
          style={{ background: '#0d1526', border: `1px solid ${healthColor}40` }}
        >
          <span style={{ color: '#6b8bb5' }}>RED</span>
          <span className="font-bold" style={{ color: healthColor }}>{health}%</span>
        </div>
      )}

      {/* Spinner de carga + "hace Xs" */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isFetching > 0 ? (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
            style={{ background: '#3b82f615', border: '1px solid #3b82f630' }}>
            <RefreshCw size={11} style={{ color: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#3b82f6' }}>Actualizando…</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs"
            style={{ background: '#10b98110', border: '1px solid #10b98125' }}>
            <span className="w-1.5 h-1.5 rounded-full dot-online inline-block" />
            <span style={{ color: '#10b981' }}>EN VIVO</span>
            {agoLabel && (
              <span style={{ color: '#10b98180', fontSize: 10 }}>· {agoLabel}</span>
            )}
          </div>
        )}

        {/* Botón manual */}
        <button onClick={refresh} className="p-1.5 rounded-lg hover:bg-noc-hover" title="Forzar actualización">
          <RefreshCw size={14} style={{ color: '#4b7ab5' }} />
        </button>
      </div>

      {/* Reloj */}
      <div className="text-xs font-mono flex-shrink-0" style={{ color: '#4b7ab5' }}>
        <div>{now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        <div style={{ color: '#2a3f6e', fontSize: 10 }}>
          {now.toLocaleDateString('es-EC', { weekday: 'short', day: '2-digit', month: 'short' })}
        </div>
      </div>

      {/* Usuario */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)' }}
        >
          {user?.name?.[0] ?? 'A'}
        </div>
        <div className="text-xs hidden lg:block">
          <div className="text-white font-medium leading-none">{user?.name}</div>
          <div style={{ color: '#4b7ab5', fontSize: 10 }}>Super Admin</div>
        </div>
        <button onClick={logout} className="p-1.5 rounded hover:bg-noc-hover ml-1" title="Cerrar sesión">
          <LogOut size={14} style={{ color: '#6b7280' }} />
        </button>
      </div>
    </header>
  );
}
