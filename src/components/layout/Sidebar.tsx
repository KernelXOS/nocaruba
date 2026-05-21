import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wifi, Network, Server,
  Users, Bell, Map, PieChart, ChevronRight
} from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useAlerts } from '../../hooks/useData';

const nav = [
  { to: '/',          label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/aps',       label: 'Access Points',   icon: Wifi },
  { to: '/switches',  label: 'Switches',        icon: Network },
  { to: '/servers',   label: 'Servidores',      icon: Server },
  { to: '/clients',   label: 'Clientes',        icon: Users },
  { to: '/alerts',    label: 'Alertas',         icon: Bell },
  { to: '/heatmap',   label: 'Mapa de Calor',   icon: Map },
];

export default function Sidebar() {
  const { user } = useAuthStore();
  const { data: alerts } = useAlerts();
  const unack = alerts?.filter(a => !a.acknowledged).length ?? 0;
  const critical = alerts?.filter(a => !a.acknowledged && a.severity === 'critical').length ?? 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-56 flex flex-col bg-[#ffffff]/90 dark:bg-[#0B0E14]/60 backdrop-blur-xl border-r border-slate-200 dark:border-white/5">
      {/* Profile Section */}
      <div className="flex flex-col items-center justify-center pt-10 pb-6">
        <div className="w-20 h-20 bg-[#162032] rounded-full flex items-center justify-center mb-4 relative shadow-inner">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#1e293b]">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h2 className="text-white font-semibold text-lg tracking-wide uppercase">{user?.name || 'ADMIN NOC'}</h2>
        <p className="text-[#94a3b8] text-xs font-medium">{user?.email || 'admin@pucese.edu.ec'}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1.5 px-3 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => {
          const isBell = to === '/alerts';
          return (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'flex items-center gap-4 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'text-white'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white" />}
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="flex-1 truncate font-medium">{label}</span>
                  {isBell && unack > 0 && (
                    <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center',
                      critical > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')}>
                      {unack}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
