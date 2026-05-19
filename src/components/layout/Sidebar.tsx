import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wifi, Network, Server,
  Users, Bell, ChevronRight, Flame,
} from 'lucide-react';
import clsx from 'clsx';
import { useAlerts } from '../../hooks/useData';

const nav = [
  { to: '/',          label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/aps',       label: 'Puntos de Acceso', icon: Wifi },
  { to: '/switches',  label: 'Switches & Puertos', icon: Network },
  { to: '/servers',   label: 'Servidores',       icon: Server },
  { to: '/clients',   label: 'Clientes Activos', icon: Users },
  { to: '/alerts',    label: 'Alertas',          icon: Bell },
  { to: '/heatmap',   label: 'Mapa de Calor',    icon: Flame },
];

export default function Sidebar() {
  const { data: alerts } = useAlerts();
  const unack = alerts?.filter(a => !a.acknowledged).length ?? 0;
  const critical = alerts?.filter(a => !a.acknowledged && a.severity === 'critical').length ?? 0;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-56 flex flex-col"
      style={{ background:'#080c1e', borderRight:'1px solid #1e3460' }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-noc-border">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background:'linear-gradient(135deg,#1d4ed8,#7c3aed)' }}>
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
        </div>
        <div className="leading-tight">
          <div className="text-white font-bold text-sm">PUCESE</div>
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Centro de Operaciones</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => {
          const isBell = to === '/alerts';
          return (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-noc-hover'
              )}
              style={({ isActive }) => isActive ? { background:'linear-gradient(90deg,#1d4ed820,#1d4ed808)', borderLeft:'3px solid #3b82f6', color:'#e2e8f0' } : {}}>
              <Icon size={16} className="flex-shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {isBell && unack > 0 && (
                <span className={clsx('text-xs font-mono px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  critical > 0 ? 'bg-red-600 text-white' : 'bg-amber-500 text-black')}>
                  {unack}
                </span>
              )}
              <ChevronRight size={12} className="opacity-0 group-hover:opacity-40" />
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-noc-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full dot-online inline-block" />
          <span className="text-xs" style={{ color:'#4b7ab5' }}>Sistema Operativo</span>
        </div>
        <div className="text-xs mt-1" style={{ color:'#374d6b' }}>Aruba Central · v8.11.2</div>
      </div>
    </aside>
  );
}
