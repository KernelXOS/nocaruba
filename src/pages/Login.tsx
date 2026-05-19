import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background:'radial-gradient(ellipse at 20% 50%, #0d1f4a 0%, #07091a 60%)' }}>

      {/* Grid bg */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage:'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize:'40px 40px' }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background:'#1d4ed8' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8 pointer-events-none"
        style={{ background:'#7c3aed' }} />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', boxShadow:'0 0 40px #1d4ed840' }}>
            <Wifi size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">NOC Dashboard</h1>
          <p className="text-sm" style={{ color:'#4b7ab5' }}>
            Pontificia Universidad Católica<br />del Ecuador Sede Esmeraldas
          </p>
        </div>

        {/* Form */}
        <div className="noc-card p-6" style={{ boxShadow:'0 25px 60px -12px #00000080' }}>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={14} style={{ color:'#3b82f6' }} />
            <span className="text-xs" style={{ color:'#4b7ab5' }}>Acceso restringido — personal autorizado</span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color:'#6b8bb5' }}>
                Correo institucional
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none transition-all"
                style={{ background:'#0d1526', border:'1px solid #1e3460' }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#1e3460')}
                placeholder="usuario@pucese.edu.ec"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color:'#6b8bb5' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm text-white outline-none transition-all"
                  style={{ background:'#0d1526', border:'1px solid #1e3460' }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.target.style.borderColor = '#1e3460')}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color:'#4b7ab5' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background:'#ef444415', color:'#ef4444', border:'1px solid #ef444430' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 mt-2"
              style={{ background: loading ? '#1d4ed860' : 'linear-gradient(135deg,#1d4ed8,#2563eb)', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Autenticando...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color:'#2a3f6e' }}>
            admin@pucese.edu.ec · Admin123!
          </p>
        </div>
      </div>
    </div>
  );
}
