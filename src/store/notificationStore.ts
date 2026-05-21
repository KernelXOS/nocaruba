import { create } from 'zustand';

export type ToastType = 'critical' | 'warning' | 'success' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  device?: string;
  timestamp: number;
}

interface NotificationStore {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'timestamp'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  push: (t) =>
    set((s) => ({
      toasts: [
        { ...t, id: Math.random().toString(36).slice(2), timestamp: Date.now() },
        ...s.toasts,
      ].slice(0, 8), // máx 8 notificaciones a la vez
    })),
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  dismissAll: () => set({ toasts: [] }),
}));
