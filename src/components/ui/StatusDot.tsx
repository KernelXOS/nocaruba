import clsx from 'clsx';
import type { DeviceStatus } from '../../types';

const classes: Record<DeviceStatus, string> = {
  online:    'dot-online',
  warning:   'dot-warning',
  offline:   'dot-offline',
  rebooting: 'dot-warning',
};
const colors: Record<DeviceStatus, string> = {
  online:    '#10b981',
  warning:   '#f59e0b',
  offline:   '#6b7280',
  rebooting: '#f59e0b',
};
const labels: Record<DeviceStatus, string> = {
  online:    'En línea',
  warning:   'Advertencia',
  offline:   'Fuera de línea',
  rebooting: 'Reiniciando',
};

interface Props { status: DeviceStatus; label?: boolean; size?: number; }

export default function StatusDot({ status, label, size = 8 }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={clsx('rounded-full inline-block flex-shrink-0', classes[status])}
        style={{ width: size, height: size, backgroundColor: colors[status] }}
      />
      {label && (
        <span className="text-xs" style={{ color: colors[status] }}>{labels[status]}</span>
      )}
    </span>
  );
}
