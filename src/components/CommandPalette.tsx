import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, LayoutDashboard, Wifi, Network, Server, Users, Bell, Map,
  PieChart, Sun, Moon, LogOut, CornerDownLeft, AlertTriangle,
} from 'lucide-react';
import { useAPs, useSwitches, useServers, useClients, useAlerts } from '../hooks/useData';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';

interface Item {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  icon: JSX.Element;
  keywords: string;
  action: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useThemeStore();
  const logout = useAuthStore(s => s.logout);

  const { data: aps } = useAPs();
  const { data: switches } = useSwitches();
  const { data: servers } = useServers();
  const { data: clients } = useClients();
  const { data: alerts } = useAlerts();

  /* Atajo global Ctrl+K / Cmd+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const close = useCallback(() => setOpen(false), []);
  const go = useCallback((to: string) => { navigate(to); setOpen(false); }, [navigate]);

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { id: 'p-dash', group: 'Páginas', title: 'Dashboard', subtitle: 'Vista general del NOC', icon: <LayoutDashboard size={15} />, keywords: 'dashboard inicio home resumen', action: () => go('/') },
      { id: 'p-aps', group: 'Páginas', title: 'Access Points', subtitle: 'Inventario y control de APs', icon: <Wifi size={15} />, keywords: 'access points aps wifi antenas', action: () => go('/aps') },
      { id: 'p-sw', group: 'Páginas', title: 'Switches', subtitle: 'Estado de puertos y PoE', icon: <Network size={15} />, keywords: 'switches puertos poe red', action: () => go('/switches') },
      { id: 'p-srv', group: 'Páginas', title: 'Servidores', subtitle: 'Infraestructura del Data Center', icon: <Server size={15} />, keywords: 'servidores servers datacenter', action: () => go('/servers') },
      { id: 'p-cli', group: 'Páginas', title: 'Clientes', subtitle: 'Dispositivos conectados', icon: <Users size={15} />, keywords: 'clientes usuarios dispositivos', action: () => go('/clients') },
      { id: 'p-al', group: 'Páginas', title: 'Alertas', subtitle: 'Centro de alertas y diagnóstico', icon: <Bell size={15} />, keywords: 'alertas alarmas eventos', action: () => go('/alerts') },
      { id: 'p-heat', group: 'Páginas', title: 'Mapa de Calor', subtitle: 'Cobertura WiFi del campus', icon: <Map size={15} />, keywords: 'mapa calor heatmap cobertura', action: () => go('/heatmap') },
      { id: 'p-rep', group: 'Páginas', title: 'Reportes', subtitle: 'Analítica y exportación de datos', icon: <PieChart size={15} />, keywords: 'reportes informes analitica exportar csv', action: () => go('/reports') },
    ];

    const actions: Item[] = [
      { id: 'a-theme', group: 'Acciones', title: isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro', icon: isDark ? <Sun size={15} /> : <Moon size={15} />, keywords: 'tema claro oscuro theme dark light', action: () => { toggleTheme(); close(); } },
      { id: 'a-logout', group: 'Acciones', title: 'Cerrar sesión', icon: <LogOut size={15} />, keywords: 'cerrar sesion salir logout', action: () => { logout(); close(); } },
    ];

    const apItems: Item[] = (aps ?? []).map(ap => ({
      id: `ap-${ap.serial}`, group: 'Access Points',
      title: ap.name, subtitle: `${ap.ip} · ${ap.building} · ${ap.status === 'online' ? 'En línea' : ap.status === 'warning' ? 'Advertencia' : 'Offline'}`,
      icon: <Wifi size={15} />, keywords: `${ap.name} ${ap.serial} ${ap.ip} ${ap.macAddress} ${ap.building} ${ap.model}`.toLowerCase(),
      action: () => go('/aps'),
    }));

    const swItems: Item[] = (switches ?? []).map(sw => ({
      id: `sw-${sw.serial}`, group: 'Switches',
      title: sw.name, subtitle: `${sw.ip} · ${sw.building} · ${sw.portsUp}/${sw.totalPorts} puertos`,
      icon: <Network size={15} />, keywords: `${sw.name} ${sw.serial} ${sw.ip} ${sw.building} ${sw.model}`.toLowerCase(),
      action: () => go('/switches'),
    }));

    const srvItems: Item[] = (servers ?? []).map(s => ({
      id: `srv-${s.id}`, group: 'Servidores',
      title: s.name, subtitle: `${s.ip} · ${s.role}`,
      icon: <Server size={15} />, keywords: `${s.name} ${s.ip} ${s.role} ${s.os}`.toLowerCase(),
      action: () => go('/servers'),
    }));

    const alertItems: Item[] = (alerts ?? []).filter(a => !a.acknowledged).map(a => ({
      id: `al-${a.id}`, group: 'Alertas activas',
      title: a.message, subtitle: `${a.device}${a.building ? ' · ' + a.building : ''}`,
      icon: <AlertTriangle size={15} style={{ color: a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#3b82f6' }} />,
      keywords: `${a.message} ${a.device} ${a.category}`.toLowerCase(),
      action: () => go('/alerts'),
    }));

    const cliItems: Item[] = (clients ?? []).map(c => ({
      id: `cli-${c.mac}`, group: 'Clientes',
      title: c.hostname, subtitle: `${c.ip} · ${c.mac} · ${c.ap ?? ''}`,
      icon: <Users size={15} />, keywords: `${c.hostname} ${c.ip} ${c.mac}`.toLowerCase(),
      action: () => go('/clients'),
    }));

    return [...pages, ...actions, ...apItems, ...swItems, ...srvItems, ...alertItems, ...cliItems];
  }, [aps, switches, servers, clients, alerts, isDark, go, close, toggleTheme, logout]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Sin búsqueda: páginas, acciones y alertas activas
      return items.filter(i => ['Páginas', 'Acciones', 'Alertas activas'].includes(i.group)).slice(0, 14);
    }
    const terms = q.split(/\s+/);
    return items
      .filter(i => terms.every(t => i.keywords.includes(t) || i.title.toLowerCase().includes(t)))
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => setActive(0), [query]);

  /* Navegación con teclado */
  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && filtered[active]) { e.preventDefault(); filtered[active].action(); }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  let lastGroup = '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onMouseDown={close}
    >
      <div
        className="w-full max-w-xl rounded-lg overflow-hidden card-enter shadow-2xl bg-white dark:bg-[color:var(--panel)] border border-slate-200 dark:border-[color:var(--border)]"
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-[color:var(--border)]">
          <Search size={16} className="text-slate-400 dark:text-[color:var(--muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Buscar dispositivos, clientes, alertas o páginas..."
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-[color:var(--dim)]"
          />
          <kbd className="kbd">ESC</kbd>
        </div>

        {/* Resultados */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-[color:var(--muted)]">
              Sin resultados para «{query}»
            </div>
          )}
          {filtered.map((item, i) => {
            const showGroup = item.group !== lastGroup;
            lastGroup = item.group;
            return (
              <div key={item.id}>
                {showGroup && (
                  <div className="px-4 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[color:var(--dim)]">
                    {item.group}
                  </div>
                )}
                <button
                  data-idx={i}
                  onClick={item.action}
                  onMouseMove={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === active ? 'bg-orange-50 dark:bg-orange-500/10' : ''
                  }`}
                >
                  <span className={`flex-shrink-0 ${i === active ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-[color:var(--muted)]'}`}>
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm truncate ${i === active ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="block text-xs truncate text-slate-400 dark:text-[color:var(--muted)]">{item.subtitle}</span>
                    )}
                  </span>
                  {i === active && <CornerDownLeft size={13} className="flex-shrink-0 text-orange-500" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-100 dark:border-[color:var(--border)] text-[11px] text-slate-400 dark:text-[color:var(--dim)]">
          <span className="flex items-center gap-1.5"><kbd className="kbd">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1.5"><kbd className="kbd">↵</kbd> abrir</span>
          <span className="flex items-center gap-1.5 ml-auto"><kbd className="kbd">Ctrl</kbd>+<kbd className="kbd">K</kbd> abrir/cerrar</span>
        </div>
      </div>
    </div>
  );
}
