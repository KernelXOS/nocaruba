interface Props {
  value: number;
  max?: number;
  warnAt?: number;
  critAt?: number;
  label?: string;
  unit?: string;
}

export default function ThermoBar({ value, max = 100, warnAt = 65, critAt = 75, label, unit = '%' }: Props) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= critAt ? '#ef4444' : value >= warnAt ? '#f59e0b' : '#10b981';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs" style={{ color:'#6b8bb5' }}>{label}</span>
          <span className="text-xs font-mono font-semibold" style={{ color }}>{value}{unit}</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ background:'#1e3460' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${color}aa, ${color})` }}
        />
      </div>
    </div>
  );
}
