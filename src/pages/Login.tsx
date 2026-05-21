import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const { isDark } = useThemeStore();
  
  const [email, setEmail] = useState('admin@pucese.edu.ec');
  const [password, setPassword] = useState('Admin123!');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      login(user, token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-200 bg-slate-50 dark:bg-[#0b1120]">
      <div className="w-full max-w-md">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-noc-primary dark:bg-[#1a2b4c] shadow-lg mb-4">
            <Wifi size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 tracking-tight">NOC Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pontificia Universidad Católica<br />del Ecuador Sede Esmeraldas
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 transition-colors duration-200">
          <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
            <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
              Acceso restringido — personal autorizado
            </span>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Correo institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg text-sm transition-colors border outline-none
                         bg-white dark:bg-[#0f172a] 
                         text-slate-900 dark:text-slate-100
                         border-slate-300 dark:border-slate-700 
                         focus:border-noc-primary dark:focus:border-blue-500 focus:ring-1 focus:ring-noc-primary dark:focus:ring-blue-500"
                placeholder="usuario@pucese.edu.ec"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm transition-colors border outline-none
                           bg-white dark:bg-[#0f172a] 
                           text-slate-900 dark:text-slate-100
                           border-slate-300 dark:border-slate-700 
                           focus:border-noc-primary dark:focus:border-blue-500 focus:ring-1 focus:ring-noc-primary dark:focus:ring-blue-500"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 mt-2 rounded-lg text-sm font-semibold text-white transition-all duration-200
                       bg-noc-primary hover:bg-[#152442] dark:bg-blue-600 dark:hover:bg-blue-700
                       disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Autenticando...' : 'Iniciar sesión'}
            </button>
          </form>

        </div>
          
        {/* Footer info */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-500 mt-6">
          admin@pucese.edu.ec · Admin123!
        </p>
      </div>
    </div>
  );
}
