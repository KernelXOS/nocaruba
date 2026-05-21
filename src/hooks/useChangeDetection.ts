/**
 * useChangeDetection — detecta cambios en APs y alertas
 * y dispara notificaciones toast en tiempo real.
 */
import { useEffect, useRef } from 'react';
import { useAPs, useAlerts } from './useData';
import { useNotificationStore } from '../store/notificationStore';
import type { AccessPoint, Alert } from '../types';

export function useChangeDetection() {
  const { data: aps }    = useAPs();
  const { data: alerts } = useAlerts();
  const push             = useNotificationStore((s) => s.push);

  /* ── APs: detectar desconexiones y reconexiones ── */
  const prevAPs = useRef<Map<string, string>>(new Map()); // serial → status
  const initialized = useRef(false);

  useEffect(() => {
    if (!aps || aps.length === 0) return;

    // Primera carga: solo guardar estado, no notificar
    if (!initialized.current) {
      aps.forEach((ap: AccessPoint) => prevAPs.current.set(ap.serial, ap.status));
      initialized.current = true;
      return;
    }

    aps.forEach((ap: AccessPoint) => {
      const prev = prevAPs.current.get(ap.serial);
      if (prev === undefined) {
        // AP nuevo detectado
        push({
          type: 'info',
          title: 'Nuevo dispositivo',
          message: `${ap.name} apareció en la red`,
          device: ap.serial,
        });
      } else if (prev !== 'offline' && ap.status === 'offline') {
        // AP se desconectó
        push({
          type: 'critical',
          title: '⚠ AP desconectado',
          message: ap.name,
          device: `${ap.serial} · ${ap.building}`,
        });
      } else if (prev === 'offline' && ap.status === 'online') {
        // AP volvió a conectarse
        push({
          type: 'success',
          title: '✓ AP reconectado',
          message: ap.name,
          device: `${ap.serial} · ${ap.building}`,
        });
      } else if (prev !== 'warning' && ap.status === 'warning') {
        // AP en estado de advertencia
        push({
          type: 'warning',
          title: 'AP con advertencia',
          message: ap.name,
          device: `${ap.serial} · ${ap.building}`,
        });
      }
      prevAPs.current.set(ap.serial, ap.status);
    });
  }, [aps]);

  /* ── Alertas: detectar nuevas alertas no reconocidas ── */
  const prevAlertIds = useRef<Set<string>>(new Set());
  const alertsInit   = useRef(false);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    if (!alertsInit.current) {
      alerts.forEach((a: Alert) => prevAlertIds.current.add(a.id));
      alertsInit.current = true;
      return;
    }

    alerts.forEach((a: Alert) => {
      if (!prevAlertIds.current.has(a.id) && !a.acknowledged) {
        push({
          type:    a.severity === 'critical' ? 'critical' : a.severity === 'warning' ? 'warning' : 'info',
          title:   a.severity === 'critical' ? '🔴 Alerta crítica' : a.severity === 'warning' ? '🟡 Advertencia' : '🔵 Información',
          message: a.message,
          device:  a.device,
        });
        prevAlertIds.current.add(a.id);
      }
    });
  }, [alerts]);
}
