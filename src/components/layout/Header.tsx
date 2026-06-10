import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut, RefreshCw, Sun, Moon, Search, Bell, AlertTriangle,
  ChevronDown, User,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useAlerts, useProxyStatus } from '../../hooks/useData';

const TITLES: Record<string, string> = {
  '/': 'Dashboard — Centro de Operaciones',
  '/aps': 'Access Points',
  '/switches': 'Switches',
  '/servers': 'Servidores',
  '/clients': 'Clientes Conectados',
  '/alerts': 'Centro de Alertas',
  '/heatmap': 'Mapa de Calor WiFi',
  '/reports': 'Reportes y Analítica',
};

export default function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [now, setNow] = useState(new Date());
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  const { isDark, toggleTheme } = useThemeStore();
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: alerts } = useAlerts();
  const { data: proxyStatus } = useProxyStatus();

  const isLive = !!proxyStatus;
  const unack = (alerts ?? []).filter(a => !a.acknowledged).slice(0, 6);
  const critCount = unack.filter(a => a.severity === 'critical').length;
  const title = TITLES[location.pathname] ?? 'Centro de Operaciones';

  /* Reloj en vivo (precisión de minuto) */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(t);
  }, []);

  /* Refresca todos los datos en tiempo real */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await qc.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const openPalette = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setShowProfile(false);
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setShowBell(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 fixed top-0 right-0 left-56 bg-white dark:bg-[#0f0f0f] border-b border-slate-200 dark:border-[#222222] z-20 flex items-center justify-between px-6 transition-colors duration-200 print:hidden">
      {/* Título + estado de conexión */}
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-slate-800 dark:text-slate-100 text-base font-semibold tracking-tight truncate">{title}</h2>
        <span
          className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-[#8a8a8a] flex-shrink-0 border-l border-slate-200 dark:border-[#2a2a2a] pl-3"
          title={isLive ? 'Conectado a Aruba Central' : 'Proxy no disponible — mostrando datos de demostración'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isLive ? 'Aruba Central' : 'Datos de demostración'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Reloj */}
        <div className="hidden lg:block mr-2 text-right leading-tight">
          <span className="block text-[13px] font-medium text-slate-600 dark:text-slate-300 tabular-nums">
            {now.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="block text-[10px] text-slate-400 dark:text-[#7a7a7a]">
            {now.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Búsqueda global */}
        <button
          onClick={openPalette}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 dark:text-slate-500 bg-slate-100/70 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-orange-400 dark:hover:border-orange-500/40 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Búsqueda global (Ctrl+K)"
        >
          <Search size={14} />
          <span>Buscar...</span>
          <kbd className="kbd ml-1">Ctrl K</kbd>
        </button>

        {/* Notificaciones */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setShowBell(v => !v)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Notificaciones"
          >
            <Bell size={18} className={critCount > 0 ? 'animate-pulse-glow text-red-500' : ''} />
            {unack.length > 0 && (
              <span className={`absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${critCount > 0 ? 'bg-red-500' : 'bg-amber-500'}`}>
                {unack.length}
              </span>
            )}
          </button>

          {showBell && (
            <div className="absolute right-0 top-12 w-80 rounded-lg overflow-hidden shadow-2xl card-enter bg-white dark:bg-[color:var(--panel)] border border-slate-200 dark:border-[color:var(--border)] z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[color:var(--border)] flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Alertas sin reconocer</span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-[color:var(--muted)]">{unack.length} activas</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {unack.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-[color:var(--muted)]">Sin alertas pendientes</div>
                ) : unack.map(a => (
                  <button
                    key={a.id}
                    onClick={() => { setShowBell(false); navigate('/alerts'); }}
                    className="w-full flex items-start gap-2.5 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-b border-slate-50 dark:border-[color:var(--border-soft)]"
                  >
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6' }} />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{a.message}</span>
                      <span className="block text-[10px] text-slate-400 dark:text-[color:var(--muted)] truncate">
                        {a.device} · {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true, locale: es })}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setShowBell(false); navigate('/alerts'); }}
                className="w-full py-2.5 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-t border-slate-100 dark:border-[color:var(--border)]"
              >
                Ver centro de alertas →
              </button>
            </div>
          )}
        </div>

        {/* Tema */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          title="Alternar tema"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Refresh real */}
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors ${isRefreshing ? 'animate-spin text-orange-500' : ''}`}
          title="Actualizar todos los datos"
        >
          <RefreshCw size={18} />
        </button>

        {/* Perfil */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(v => !v)}
            className="flex items-center gap-1.5 p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
            title="Cuenta"
          >
            <User size={18} />
            <ChevronDown size={12} className={`transition-transform ${showProfile ? 'rotate-180' : ''}`} />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-60 rounded-lg overflow-hidden shadow-2xl card-enter bg-white dark:bg-[color:var(--panel)] border border-slate-200 dark:border-[color:var(--border)] z-50">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[color:var(--border)]">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name ?? 'Administrador NOC'}</p>
                <p className="text-[11px] text-slate-400 dark:text-[color:var(--muted)] truncate">{user?.email ?? ''}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-500/30">
                  {user?.role?.replace('_', ' ') ?? 'admin'}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
