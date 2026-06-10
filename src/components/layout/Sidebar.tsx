import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wifi, Network, Server,
  Users, Bell, Map, PieChart
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useAlerts, useProxyStatus } from '../../hooks/useData';

const NAV_GROUPS = [
  {
    title: 'General',
    items: [
      { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
      { to: '/reports',  label: 'Reportes',  icon: PieChart },
    ],
  },
  {
    title: 'Infraestructura',
    items: [
      { to: '/aps',      label: 'Access Points', icon: Wifi },
      { to: '/switches', label: 'Switches',      icon: Network },
      { to: '/servers',  label: 'Servidores',    icon: Server },
      { to: '/clients',  label: 'Clientes',      icon: Users },
    ],
  },
  {
    title: 'Monitoreo',
    items: [
      { to: '/alerts',   label: 'Alertas',       icon: Bell },
      { to: '/heatmap',  label: 'Mapa de Calor', icon: Map },
    ],
  },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { data: alerts } = useAlerts();
  const { data: proxyStatus } = useProxyStatus();
  const isLive = !!proxyStatus;
  const unack = alerts?.filter(a => !a.acknowledged).length ?? 0;
  const critical = alerts?.filter(a => !a.acknowledged && a.severity === 'critical').length ?? 0;

  const initials = (user?.name ?? 'Administrador NOC')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-56 flex flex-col bg-white dark:bg-[#0f0f0f] border-r border-slate-200 dark:border-[#222222] print:hidden">
      {/* Marca */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-100 dark:border-[#1c1c1c]">
        <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-[#ea580c] dark:bg-[#ff8300]">
          <Wifi size={17} className="text-white dark:text-black" strokeWidth={2.5} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">PUCESE NOC</p>
          <p className="text-[10px] text-slate-400 dark:text-[#7a7a7a] truncate">Centro de Operaciones</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_GROUPS.map(group => (
          <div key={group.title} className="mb-5">
            <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-[#666666]">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => {
                const isBell = to === '/alerts';
                return (
                  <NavLink key={to} to={to} end={to === '/'}
                    className={({ isActive }) => clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors relative',
                      isActive
                        ? 'text-[#c2410c] dark:text-[#ff8300] bg-[#ea580c]/[0.07] dark:bg-[#ff8300]/[0.08] font-medium'
                        : 'text-slate-600 dark:text-[#a3a3a3] hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-[#ea580c] dark:bg-[#ff8300]" />}
                        <Icon size={16} className="flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                        <span className="flex-1 truncate">{label}</span>
                        {isBell && unack > 0 && (
                          <span className={clsx('text-[10px] font-semibold px-1.5 py-px rounded min-w-[18px] text-center tabular-nums',
                            critical > 0
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30')}>
                            {unack}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Usuario + estado del sistema */}
      <div className="px-3 py-3 border-t border-slate-100 dark:border-[#1c1c1c] space-y-3">
        <div className="flex items-center gap-2 px-2">
          <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', isLive ? 'dot-online' : 'dot-warning')} />
          <p className="text-[11px] text-slate-500 dark:text-[#8a8a8a] truncate">
            {isLive ? 'Conectado a Aruba Central' : 'Datos de demostración'}
          </p>
        </div>
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-200 dark:bg-[#262626] text-[10px] font-semibold text-slate-600 dark:text-slate-300">
            {initials}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name || 'Administrador NOC'}</p>
            <p className="text-[10px] text-slate-400 dark:text-[#7a7a7a] truncate">{user?.email || 'admin@pucese.edu.ec'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
