import { useState, useEffect, useRef } from 'react';
import { Menu, LogOut, RefreshCw, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function Header() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const logout = useAuthStore(s => s.logout);
  const user = useAuthStore(s => s.user);
  const { isDark, toggleTheme } = useThemeStore();
  const profileRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 fixed top-0 right-0 left-56 bg-[#ffffff]/90 dark:bg-[#0B0E14]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 z-20 flex items-center justify-between px-8 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <h2 className="text-[#334155] dark:text-slate-100 text-xl font-medium tracking-tight">Dashboard Centro de Operaciones</h2>
        <button className="text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800">
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          title="Alternar tema"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <button 
          onClick={handleRefresh}
          className={`p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
        >
          <RefreshCw size={18} />
        </button>

        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="p-2 rounded-lg text-slate-400 hover:text-[#1a2b4c] dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
