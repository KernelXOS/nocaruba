import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Eye, EyeOff, ShieldCheck, Mail, Lock, Server, Activity, Shield, Sparkles, Sun, Moon } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const { isDark, toggleTheme } = useThemeStore();
  
  const [email, setEmail] = useState('admin@pucese.edu.ec');
  const [password, setPassword] = useState('Admin123!');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); 
    setLoading(true);
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

  const fillDemoCredentials = () => {
    setEmail('admin@pucese.edu.ec');
    setPassword('Admin123!');
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300 bg-white dark:bg-[#050505] overflow-hidden">
      <style>{`
        @keyframes flow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .flow-line {
          stroke-dasharray: 6, 4;
          animation: flow 1.5s linear infinite;
        }
        @keyframes pulseNode {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        .pulse-node {
          animation: pulseNode 3s infinite ease-in-out;
          transform-origin: center;
        }
        .orange-blueprint-grid {
          background-image:
            linear-gradient(rgba(234, 88, 12, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(234, 88, 12, 0.05) 1px, transparent 1px);
          background-size: 24px 24px;
        }
        .dark .orange-blueprint-grid {
          background-image:
            linear-gradient(rgba(255, 131, 0, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 131, 0, 0.04) 1px, transparent 1px);
        }
      `}</style>

      {/* Tema Toggler */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-6 right-6 z-50 p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/70 dark:bg-black/70 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-900 transition-all duration-200 shadow-sm cursor-pointer"
        title="Cambiar tema"
      >
        {isDark ? <Sun size={18} className="text-orange-500" /> : <Moon size={18} className="text-orange-600" />}
      </button>

      {/* Panel Izquierdo: Ilustración del NOC y Estadísticas (Oculto en móvil) */}
      <div className="hidden lg:flex lg:w-3/5 bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white flex-col justify-between p-12 relative overflow-hidden border-r border-slate-200 dark:border-neutral-900 transition-colors duration-300">
        
        {/* Background Blueprint Grid y Gradientes */}
        <div className="absolute inset-0 orange-blueprint-grid opacity-80 pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-orange-500/5 via-transparent to-amber-500/5 dark:from-orange-950/10 dark:to-transparent pointer-events-none" />
        <div className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] rounded-full bg-amber-500/5 dark:bg-amber-500/5 blur-[120px] pointer-events-none" />

        {/* Logo PUCESE y Encabezado de Red */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/25">
            <Wifi size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-orange-600 to-amber-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              PUCESE NOC
            </h2>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-mono tracking-wider uppercase">Centro de Operaciones</p>
          </div>
        </div>

        {/* Visualización de Red SVG */}
        <div className="relative z-10 flex-grow flex items-center justify-center max-h-[420px] my-6">
          <svg viewBox="0 0 800 600" className="w-full h-full max-w-[550px] opacity-90 select-none">
            <defs>
              <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ea580c" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
              </radialGradient>
            </defs>
            
            {/* Círculos concéntricos de fondo */}
            <circle cx="400" cy="300" r="280" fill="url(#glow)" />
            <circle cx="400" cy="300" r="200" fill="none" stroke="#ea580c" strokeWidth="1" strokeDasharray="6,6" opacity="0.25" />
            <circle cx="400" cy="300" r="110" fill="none" stroke="#ea580c" strokeWidth="1" opacity="0.15" />
            
            {/* Líneas de Conexión y Flujo de datos */}
            <line x1="400" y1="300" x2="220" y2="200" stroke="#ea580c" strokeWidth="1.5" className="flow-line" />
            <line x1="400" y1="300" x2="580" y2="200" stroke="#f59e0b" strokeWidth="1.5" className="flow-line" />
            <line x1="400" y1="300" x2="280" y2="420" stroke="#ea580c" strokeWidth="1.5" className="flow-line" strokeDashoffset="5" />
            <line x1="400" y1="300" x2="520" y2="420" stroke="#d97706" strokeWidth="1.5" className="flow-line" />
            
            <line x1="220" y1="200" x2="140" y2="240" stroke="#ea580c" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            <line x1="220" y1="200" x2="180" y2="100" stroke="#ea580c" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            <line x1="580" y1="200" x2="660" y2="240" stroke="#ea580c" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
            <line x1="580" y1="200" x2="620" y2="100" stroke="#ea580c" strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />

            <circle cx="140" cy="240" r="5" fill="#f97316" opacity="0.6" />
            <circle cx="180" cy="100" r="5" fill="#f97316" opacity="0.6" />
            <circle cx="660" cy="240" r="5" fill="#f97316" opacity="0.6" />
            <circle cx="620" cy="100" r="5" fill="#f97316" opacity="0.6" />

            {/* Nodo Central: Core Router */}
            <g className="pulse-node">
              <circle cx="400" cy="300" r="28" fill="#ea580c" stroke="#f97316" strokeWidth="3" className="shadow-lg" />
              <path d="M393,300 L407,300 M400,293 L400,307" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
            
            {/* Nodo 1: Servidores */}
            <g className="pulse-node">
              <circle cx="220" cy="200" r="16" fill="#050505" stroke="#ea580c" strokeWidth="2" />
              <circle cx="220" cy="200" r="24" fill="none" stroke="#ea580c" strokeWidth="1" opacity="0.3" />
            </g>
            
            {/* Nodo 2: APs */}
            <g className="pulse-node">
              <circle cx="580" cy="200" r="16" fill="#050505" stroke="#f59e0b" strokeWidth="2" />
              <circle cx="580" cy="200" r="24" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.3" />
            </g>

            {/* Nodo 3: Switches */}
            <g className="pulse-node">
              <circle cx="280" cy="420" r="16" fill="#050505" stroke="#d97706" strokeWidth="2" />
              <circle cx="280" cy="420" r="24" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.3" />
            </g>

            {/* Nodo 4: Firewall / Seguridad */}
            <g className="pulse-node">
              <circle cx="520" cy="420" r="16" fill="#050505" stroke="#f97316" strokeWidth="2" />
              <circle cx="520" cy="420" r="24" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.3" />
            </g>

            {/* Etiquetas */}
            <text x="400" y="355" fill="#f97316" fontSize="11" fontFamily="JetBrains Mono, monospace" fontWeight="600" textAnchor="middle" letterSpacing="1">CORE GATEWAY</text>
            <text x="220" y="165" fill="#ea580c" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600" textAnchor="middle">SERVIDORES</text>
            <text x="580" y="165" fill="#ea580c" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600" textAnchor="middle">ACCESO INALÁMBRICO</text>
            <text x="280" y="460" fill="#ea580c" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600" textAnchor="middle">CONMUTADORES</text>
            <text x="520" y="460" fill="#ea580c" fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="600" textAnchor="middle">SEGURIDAD ACTIVA</text>
          </svg>
        </div>

        {/* Panel Inferior: Estadísticas en vivo */}
        <div className="relative z-10 grid grid-cols-3 gap-6 bg-white/90 dark:bg-black/60 backdrop-blur-md border border-slate-200 dark:border-neutral-900 rounded-2xl p-5 shadow-sm dark:shadow-none transition-colors duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-[#ff8300]">
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Uptime Red</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">99.98%</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-3 border-x border-slate-200 dark:border-neutral-900 px-4">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-[#ff8300]">
              <Server size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Dispositivos</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">248 Activos</h3>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-2">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-[#ff8300]">
              <Shield size={18} />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Seguridad</p>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Protección WPA3</h3>
            </div>
          </div>
        </div>

      </div>

      {/* Panel Derecho: Formulario de Login */}
      <div className="w-full lg:w-2/5 flex flex-col items-center justify-center p-4 sm:p-10 lg:p-12 relative bg-white dark:bg-[#050505] transition-colors duration-300 overflow-y-auto">
        
        {/* Luces de fondo ambientadoras para el lado del formulario */}
        <div className="absolute top-1/4 -right-12 w-[300px] h-[300px] rounded-full bg-orange-500/5 dark:bg-orange-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 -left-12 w-[250px] h-[250px] rounded-full bg-amber-500/5 dark:bg-amber-500/5 blur-[90px] pointer-events-none" />

        <div className="w-full max-w-md relative z-10 my-auto">
          
          {/* Header en Móvil / Tablet (Oculto en Desktop) */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/20 mb-3 animate-pulse-glow">
              <Wifi size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 mb-1.5 tracking-tight">
              NOC Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Pontificia Universidad Católica del Ecuador Sede Esmeraldas
            </p>
          </div>

          {/* Tarjeta con Glassmorphism */}
          <div className="bg-white/80 dark:bg-black/60 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(234,88,12,0.04)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate-200/80 dark:border-neutral-900 p-6 sm:p-8 lg:p-10 transition-all duration-300">
            
            {/* Header interno para Desktop */}
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                Iniciar Sesión
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Ingresa al Centro de Operaciones de Red.
              </p>
            </div>

            {/* Aviso de seguridad */}
            <div className="flex items-center gap-2.5 mb-6 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40">
              <ShieldCheck size={16} className="text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 tracking-wide uppercase">
                Acceso Personal Autorizado
              </span>
            </div>

            <form onSubmit={submit} className="space-y-5">
              
              {/* Campo Email */}
              <div className="group">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Correo Institucional
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm transition-all duration-200 border outline-none
                             bg-white/50 dark:bg-black/50 
                             text-slate-950 dark:text-slate-100
                             border-slate-200 dark:border-neutral-800
                             focus:border-orange-500 dark:focus:border-orange-500
                             focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/15"
                    placeholder="usuario@pucese.edu.ec"
                  />
                </div>
              </div>

              {/* Campo Password */}
              <div className="group">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-orange-500 dark:group-focus-within:text-orange-400 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-2xl text-sm transition-all duration-200 border outline-none
                             bg-white/50 dark:bg-black/50 
                             text-slate-950 dark:text-slate-100
                             border-slate-200 dark:border-neutral-800
                             focus:border-orange-500 dark:focus:border-orange-500
                             focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/15"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors p-1 rounded-lg cursor-pointer"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="text-xs font-medium p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 animate-pulse-glow">
                  {error}
                </div>
              )}

              {/* Botón Submit */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-2xl text-sm font-bold text-white transition-all duration-300
                         bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700
                         dark:from-orange-600 dark:to-orange-500 dark:hover:from-orange-500 dark:hover:to-orange-600
                         disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-orange-500/20 dark:shadow-orange-950/30 hover:shadow-orange-500/35 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? 'Verificando firma...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Separador de Prueba */}
            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-neutral-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                Entorno de Demo
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-neutral-800"></div>
            </div>

            {/* Botón de Autocompletado */}
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold
                         border border-dashed border-slate-200 dark:border-neutral-800
                         text-slate-600 dark:text-slate-400
                         hover:text-orange-600 dark:hover:text-orange-400
                         hover:border-orange-500 dark:hover:border-orange-500
                         bg-slate-50/50 dark:bg-neutral-900/10
                         hover:bg-orange-50/30 dark:hover:bg-orange-950/20
                         transition-all duration-200 cursor-pointer"
            >
              <Sparkles size={14} className="text-orange-500 animate-pulse" />
              Autocompletar credenciales
            </button>

          </div>

          {/* Información del pie de página */}
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-8">
            PUCESE · Coordinación de Tecnologías de la Información
          </p>
        </div>
      </div>
    </div>
  );
}
