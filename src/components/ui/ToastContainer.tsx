import { useEffect } from 'react';
import { X, Wifi, WifiOff, AlertTriangle, Info, CheckCircle, BellRing } from 'lucide-react';
import { useNotificationStore, type Toast, type ToastType } from '../../store/notificationStore';

const CONFIG: Record<ToastType, {
  bg: string; border: string; icon: JSX.Element;
  bar: string; titleColor: string;
}> = {
  critical: {
    bg:         '#1a0a0a',
    border:     '#ef444460',
    bar:        '#ef4444',
    titleColor: '#ef4444',
    icon:       <WifiOff size={18} style={{ color: '#ef4444' }} />,
  },
  warning: {
    bg:         '#1a140a',
    border:     '#f59e0b60',
    bar:        '#f59e0b',
    titleColor: '#f59e0b',
    icon:       <AlertTriangle size={18} style={{ color: '#f59e0b' }} />,
  },
  success: {
    bg:         '#0a1a10',
    border:     '#10b98160',
    bar:        '#10b981',
    titleColor: '#10b981',
    icon:       <CheckCircle size={18} style={{ color: '#10b981' }} />,
  },
  info: {
    bg:         '#0a1020',
    border:     '#3b82f660',
    bar:        '#3b82f6',
    titleColor: '#3b82f6',
    icon:       <Info size={18} style={{ color: '#3b82f6' }} />,
  },
};

const AUTO_DISMISS_MS: Record<ToastType, number> = {
  critical: 10_000,
  warning:  7_000,
  success:  4_000,
  info:     5_000,
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useNotificationStore((s) => s.dismiss);
  const cfg     = CONFIG[toast.type];

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS[toast.type]);
    return () => clearTimeout(t);
  }, [toast.id]);

  return (
    <div
      className="card-enter relative flex gap-3 items-start rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background:   cfg.bg,
        border:       `1px solid ${cfg.border}`,
        boxShadow:    `0 4px 24px ${cfg.bar}18, 0 0 0 1px ${cfg.bar}10`,
        padding:      '12px 14px 12px 12px',
        minWidth:     280,
        maxWidth:     360,
        backdropFilter: 'blur(12px)',
      }}
      onClick={() => dismiss(toast.id)}
    >
      {/* Barra lateral de color */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: cfg.bar }}
      />

      {/* Barra de progreso (auto-dismiss) */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-b-xl"
        style={{
          background: cfg.bar,
          width:      '100%',
          animation:  `shrink ${AUTO_DISMISS_MS[toast.type]}ms linear forwards`,
          opacity:    0.5,
        }}
      />

      <div className="flex-shrink-0 mt-0.5 ml-1">{cfg.icon}</div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: cfg.titleColor }}>{toast.title}</p>
        <p className="text-sm text-white mt-0.5 leading-snug truncate">{toast.message}</p>
        {toast.device && (
          <p className="text-xs mt-1 font-mono truncate" style={{ color: '#4b7ab5' }}>
            {toast.device}
          </p>
        )}
      </div>

      <button
        className="flex-shrink-0 p-0.5 opacity-40 group-hover:opacity-100 transition-opacity"
        style={{ color: '#6b8bb5' }}
        onClick={(e) => { e.stopPropagation(); dismiss(toast.id); }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismissAll } = useNotificationStore();

  if (toasts.length === 0) return null;

  return (
    <>
      {/* Keyframe animation */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>

      <div
        className="fixed z-[100] flex flex-col gap-2"
        style={{ top: 72, right: 16, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}
      >
        {/* Header si hay múltiples */}
        {toasts.length > 1 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4b7ab5' }}>
              <BellRing size={11} />
              <span>{toasts.length} notificaciones</span>
            </div>
            <button
              onClick={dismissAll}
              className="text-xs hover:opacity-70 transition-opacity"
              style={{ color: '#374d6b' }}
            >
              Limpiar todo
            </button>
          </div>
        )}

        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </div>
    </>
  );
}
