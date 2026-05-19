import { useEffect, useRef, useState, useMemo } from 'react';
import { useAPs, useClients } from '../hooks/useData';
import type { AccessPoint } from '../types';
import { Thermometer, Wifi, Users, RefreshCw, ZoomIn, ZoomOut, Layers } from 'lucide-react';

/* ── Zonas del campus PUCESE (posición relativa 0–1) ───────── */
const ZONES: { key: string; label: string; x: number; y: number; w: number; h: number; color: string }[] = [
  { key:'campus-admin',    label:'Administrativo',      x:0.02, y:0.04, w:0.22, h:0.30, color:'#1e3460' },
  { key:'campus-biblio',   label:'Biblioteca Central',  x:0.26, y:0.04, w:0.18, h:0.30, color:'#1e3460' },
  { key:'campus-aulas-a',  label:'Bloque Aulas A',      x:0.02, y:0.38, w:0.20, h:0.28, color:'#1a2f55' },
  { key:'campus-aulas-b',  label:'Bloque Aulas B',      x:0.24, y:0.38, w:0.20, h:0.28, color:'#1a2f55' },
  { key:'campus-lab',      label:'Laboratorios',        x:0.46, y:0.04, w:0.18, h:0.30, color:'#1e3460' },
  { key:'campus-cafe',     label:'Cafetería / Bar',     x:0.46, y:0.38, w:0.10, h:0.28, color:'#1a2f55' },
  { key:'campus-gym',      label:'Gimnasio',            x:0.58, y:0.38, w:0.08, h:0.28, color:'#1a2f55' },
  { key:'santacruz-b1',    label:'SC Bloque 1',         x:0.68, y:0.04, w:0.14, h:0.30, color:'#1e2a4a' },
  { key:'santacruz-b2',    label:'SC Bloque 2',         x:0.84, y:0.04, w:0.14, h:0.30, color:'#1e2a4a' },
  { key:'santacruz-aulas', label:'SC Aulas',            x:0.68, y:0.38, w:0.30, h:0.28, color:'#1a2540' },
  { key:'tachina-of',      label:'Tachina Oficinas',    x:0.02, y:0.70, w:0.22, h:0.26, color:'#1e2a40' },
  { key:'tachina-patio',   label:'Tachina Patio',       x:0.26, y:0.70, w:0.18, h:0.26, color:'#1e2a40' },
  { key:'tachina-ext',     label:'Tachina Exterior',    x:0.46, y:0.70, w:0.20, h:0.26, color:'#1a2035' },
  { key:'tachina-otros',   label:'Tachina Otros',       x:0.68, y:0.70, w:0.30, h:0.26, color:'#1a2035' },
];

/* Asigna zona según el nombre del AP */
function assignZone(ap: AccessPoint): { x: number; y: number } {
  const n = ap.name.toLowerCase();
  const g = (ap.group ?? '').toLowerCase();

  let zone = ZONES.find(z => {
    if (n.includes('tachina') || g.includes('tachina')) {
      if (n.includes('ofic') || n.includes('012') || n.includes('sala'))  return z.key === 'tachina-of';
      if (n.includes('patio') || n.includes('ingreso') || n.includes('ext')) return z.key === 'tachina-patio';
      if (n.includes('exterior')) return z.key === 'tachina-ext';
      return z.key === 'tachina-otros';
    }
    if (n.includes('santa cruz') || n.includes('sc') || g.includes('santa cruz')) {
      if (n.includes('bloque1') || n.includes('bloque 1') || n.includes('b1'))  return z.key === 'santacruz-b1';
      if (n.includes('bloque2') || n.includes('bloque 2') || n.includes('b2'))  return z.key === 'santacruz-b2';
      return z.key === 'santacruz-aulas';
    }
    // Campus Central
    if (n.includes('biblio'))                    return z.key === 'campus-biblio';
    if (n.includes('lab') || n.includes('lab'))  return z.key === 'campus-lab';
    if (n.includes('caf') || n.includes('bar') || n.includes('vip')) return z.key === 'campus-cafe';
    if (n.includes('gym') || n.includes('gimnas'))return z.key === 'campus-gym';
    if (n.includes('aula') && (n.includes('b') || n.includes('2'))) return z.key === 'campus-aulas-b';
    if (n.includes('aula'))                       return z.key === 'campus-aulas-a';
    if (n.includes('admin') || n.includes('rect') || n.includes('doc') || n.includes('dir')) return z.key === 'campus-admin';
    return z.key === 'campus-admin';
  });

  if (!zone) zone = ZONES[0];

  // posición aleatoria pero determinística dentro de la zona
  const seed = ap.serial.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const jx = ((seed * 7919) % 1000) / 1000;
  const jy = ((seed * 6271) % 1000) / 1000;

  return {
    x: zone.x + 0.02 + jx * (zone.w - 0.04),
    y: zone.y + 0.04 + jy * (zone.h - 0.06),
  };
}

/* ── Paleta de colores para el heatmap ─────────────────────── */
function buildColormap(): Uint8ClampedArray {
  const cm = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r, g, b;
    if (t < 0.25) {
      const s = t / 0.25;
      r = 0; g = Math.round(s * 100); b = Math.round(150 + s * 105);
    } else if (t < 0.5) {
      const s = (t - 0.25) / 0.25;
      r = 0; g = Math.round(100 + s * 155); b = Math.round(255 - s * 255);
    } else if (t < 0.75) {
      const s = (t - 0.5) / 0.25;
      r = Math.round(s * 255); g = 255; b = 0;
    } else {
      const s = (t - 0.75) / 0.25;
      r = 255; g = Math.round(255 - s * 200); b = 0;
    }
    cm[i * 4 + 0] = r;
    cm[i * 4 + 1] = g;
    cm[i * 4 + 2] = b;
    cm[i * 4 + 3] = Math.round(t * 210);
  }
  return cm;
}

const COLORMAP = buildColormap();

/* ── Render del heatmap en canvas ──────────────────────────── */
function renderHeatmap(
  canvas: HTMLCanvasElement,
  aps: AccessPoint[],
  maxClients: number,
  showZones: boolean,
  showAPs: boolean,
) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d')!;

  // Fondo
  ctx.fillStyle = '#07091a';
  ctx.fillRect(0, 0, W, H);

  // Zonas del campus
  if (showZones) {
    ZONES.forEach(z => {
      const x = z.x * W, y = z.y * H, w = z.w * W, h = z.h * H;
      ctx.fillStyle = z.color;
      ctx.strokeStyle = '#1e3460';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Etiqueta de zona
      ctx.fillStyle = '#1e346080';
      ctx.font = `bold ${Math.max(9, Math.min(13, w * 0.12))}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(z.label, x + w / 2, y + 14);
    });
  }

  // ── Capa de calor ──────────────────────────────────────────
  const offCanvas = document.createElement('canvas');
  offCanvas.width = W; offCanvas.height = H;
  const off = offCanvas.getContext('2d')!;

  const onlineAPs = aps.filter(a => a.status !== 'offline');
  const radius = Math.round(Math.min(W, H) * 0.10);

  onlineAPs.forEach(ap => {
    const pos = assignZone(ap);
    const cx  = pos.x * W;
    const cy  = pos.y * H;
    const intensity = Math.max(0.1, ap.clients / Math.max(1, maxClients));

    const grad = off.createRadialGradient(cx, cy, 0, cx, cy, radius * (0.6 + intensity * 0.8));
    const alpha = (0.25 + intensity * 0.55).toFixed(2);
    grad.addColorStop(0,   `rgba(255,255,255,${alpha})`);
    grad.addColorStop(0.4, `rgba(255,255,255,${(parseFloat(alpha) * 0.5).toFixed(2)})`);
    grad.addColorStop(1,   'rgba(255,255,255,0)');

    off.fillStyle = grad;
    off.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  });

  // Aplicar colormap
  const imgData = off.getImageData(0, 0, W, H);
  const data    = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha === 0) continue;
    const idx = alpha * 4;
    data[i]     = COLORMAP[idx];
    data[i + 1] = COLORMAP[idx + 1];
    data[i + 2] = COLORMAP[idx + 2];
    data[i + 3] = COLORMAP[idx + 3];
  }
  off.putImageData(imgData, 0, 0);
  ctx.drawImage(offCanvas, 0, 0);

  // ── APs como puntos ────────────────────────────────────────
  if (showAPs) {
    onlineAPs.forEach(ap => {
      const pos = assignZone(ap);
      const cx  = pos.x * W;
      const cy  = pos.y * H;
      const statusColor = ap.status === 'warning' ? '#f59e0b' : '#10b981';

      // Pulso exterior
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = `${statusColor}30`;
      ctx.fill();

      // Punto central
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.fill();
      ctx.strokeStyle = '#07091a';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Número de clientes
      if (ap.clients > 0) {
        ctx.font = 'bold 8px JetBrains Mono, monospace';
        ctx.textAlign  = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle  = '#fff';
        ctx.fillText(String(ap.clients), cx, cy - 12);
      }
    });

    // APs offline en rojo tenue
    aps.filter(a => a.status === 'offline').forEach(ap => {
      const pos = assignZone(ap);
      ctx.beginPath();
      ctx.arc(pos.x * W, pos.y * H, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ef444460';
      ctx.fill();
    });
  }

  // Etiquetas de sectores
  if (showZones) {
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textBaseline = 'top';
    [
      { label:'CAMPUS CENTRAL', x:0.24, y:0.01 },
      { label:'SANTA CRUZ',     x:0.76, y:0.01 },
      { label:'TACHINA',        x:0.38, y:0.68 },
    ].forEach(({ label, x, y }) => {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2a3f6e';
      ctx.fillText(label, x * W, y * H);
    });
  }
}

/* ── Componente principal ─────────────────────────────────── */
export default function Heatmap() {
  const { data: aps,     isLoading: apsLoad  } = useAPs();
  const { data: clients, isLoading: cliLoad  } = useClients();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showZones, setShowZones] = useState(true);
  const [showAPs,   setShowAPs]   = useState(true);
  const [zoom,      setZoom]      = useState(1);
  const [selected,  setSelected]  = useState<AccessPoint | null>(null);

  const maxClients = useMemo(() =>
    Math.max(1, ...(aps ?? []).map(a => a.clients)),
    [aps]
  );

  const zoneStats = useMemo(() => {
    if (!aps) return [];
    return ZONES.map(z => {
      const zoneAPs = aps.filter(ap => {
        const pos = assignZone(ap);
        return pos.x >= z.x && pos.x <= z.x + z.w && pos.y >= z.y && pos.y <= z.y + z.h;
      });
      return {
        ...z,
        totalAPs:     zoneAPs.length,
        onlineAPs:    zoneAPs.filter(a => a.status === 'online').length,
        totalClients: zoneAPs.reduce((s, a) => s + a.clients, 0),
        maxSignal:    zoneAPs.length ? Math.max(...zoneAPs.map(a => a.clients)) : 0,
      };
    }).filter(z => z.totalAPs > 0).sort((a, b) => b.totalClients - a.totalClients);
  }, [aps]);

  // Pintar canvas cuando cambian datos
  useEffect(() => {
    const canvas = canvasRef.current;
    const cont   = containerRef.current;
    if (!canvas || !cont || !aps) return;

    const W = cont.clientWidth  || 900;
    const H = Math.round(W * 0.58);
    canvas.width  = W;
    canvas.height = H;

    renderHeatmap(canvas, aps, maxClients, showZones, showAPs);
  }, [aps, maxClients, showZones, showAPs]);

  // Click en canvas → seleccionar AP más cercano
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!aps || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx   = (e.clientX - rect.left) / rect.width;
    const my   = (e.clientY - rect.top)  / rect.height;

    let closest: AccessPoint | null = null;
    let minDist = Infinity;
    aps.forEach(ap => {
      const pos  = assignZone(ap);
      const dist = Math.hypot(pos.x - mx, pos.y - my);
      if (dist < minDist) { minDist = dist; closest = ap; }
    });
    if (minDist < 0.04) setSelected(closest);
    else setSelected(null);
  };

  const isLoading = apsLoad || cliLoad;
  const totalClients = (aps ?? []).reduce((s, a) => s + a.clients, 0);
  const onlineCount  = (aps ?? []).filter(a => a.status === 'online').length;
  const offlineCount = (aps ?? []).filter(a => a.status === 'offline').length;

  return (
    <div className="space-y-4 card-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Mapa de Calor WiFi</h1>
          <p className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>
            Densidad de conexiones por zona — Campus PUCESE
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle zones */}
          <button onClick={() => setShowZones(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: showZones ? '#1d4ed820' : '#0d1526', color: showZones ? '#3b82f6' : '#4b7ab5', border:`1px solid ${showZones ? '#3b82f660' : '#1e3460'}` }}>
            <Layers size={12} /> Zonas
          </button>
          {/* Toggle APs */}
          <button onClick={() => setShowAPs(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
            style={{ background: showAPs ? '#10b98120' : '#0d1526', color: showAPs ? '#10b981' : '#4b7ab5', border:`1px solid ${showAPs ? '#10b98140' : '#1e3460'}` }}>
            <Wifi size={12} /> APs
          </button>
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="p-1.5 rounded-lg hover:bg-noc-hover" style={{ color:'#4b7ab5', border:'1px solid #1e3460' }}><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-1.5 rounded-lg hover:bg-noc-hover" style={{ color:'#4b7ab5', border:'1px solid #1e3460' }}><ZoomOut size={14} /></button>
          <button onClick={() => { if (aps) renderHeatmap(canvasRef.current!, aps, maxClients, showZones, showAPs); }}
            className="p-1.5 rounded-lg hover:bg-noc-hover" style={{ color:'#4b7ab5', border:'1px solid #1e3460' }}>
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'APs en Línea',    value: onlineCount,   color:'#10b981', icon: Wifi },
          { label:'APs Offline',     value: offlineCount,  color:'#ef4444', icon: Wifi },
          { label:'Clientes Activos',value: totalClients,  color:'#3b82f6', icon: Users },
          { label:'Máx. por AP',     value: maxClients,    color:'#f59e0b', icon: Thermometer },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="noc-card p-3 flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background:`${color}15` }}>
              <Icon size={15} style={{ color }} />
            </div>
            <div>
              <div className="text-xl font-mono font-bold" style={{ color }}>{value}</div>
              <div className="text-xs" style={{ color:'#6b8bb5' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Canvas + Sidebar */}
      <div className="flex gap-4">

        {/* Mapa principal */}
        <div className="flex-1 noc-card p-3 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm" style={{ color:'#4b7ab5' }}>Generando mapa de calor...</p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} style={{ overflow:'auto' }}>
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                style={{
                  width: `${zoom * 100}%`,
                  cursor: 'crosshair',
                  borderRadius: 8,
                  display: 'block',
                }}
              />
            </div>
          )}

          {/* Leyenda */}
          <div className="flex items-center gap-2 mt-3 px-1">
            <span className="text-xs" style={{ color:'#4b7ab5' }}>Sin conexión</span>
            <div className="flex-1 h-3 rounded-full" style={{
              background:'linear-gradient(90deg, #0d1526, #0064b4, #00c8a0, #ffd700, #ff2200)',
              opacity: 0.8,
            }} />
            <span className="text-xs" style={{ color:'#4b7ab5' }}>Alta densidad</span>
            <div className="flex items-center gap-3 ml-4 text-xs">
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-green-400" />Online</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />Warn</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full" style={{ background:'#ef444460' }} />Offline</span>
            </div>
          </div>
        </div>

        {/* Panel lateral de zonas */}
        <div className="w-64 flex-shrink-0 noc-card p-3">
          <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
            <Thermometer size={13} style={{ color:'#f59e0b' }} />
            Zonas por densidad
          </h3>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {zoneStats.map((z, i) => {
              const pct = z.totalClients / Math.max(1, zoneStats[0].totalClients) * 100;
              const color = pct > 66 ? '#ef4444' : pct > 33 ? '#f59e0b' : '#10b981';
              return (
                <div key={z.key} className="rounded-lg p-2.5"
                  style={{ background:'#0d1526', border:'1px solid #1e3460' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white truncate">{z.label}</span>
                    <span className="text-xs font-mono ml-2 flex-shrink-0" style={{ color }}>{z.totalClients}</span>
                  </div>
                  <div className="h-1.5 rounded-full mb-1.5" style={{ background:'#1e3460' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width:`${pct}%`, background:color }} />
                  </div>
                  <div className="flex gap-3 text-xs" style={{ color:'#4b7ab5', fontSize:10 }}>
                    <span>{z.onlineAPs}/{z.totalAPs} APs</span>
                    <span>máx. {z.maxSignal} cli</span>
                    <span className="ml-auto font-mono">#{i + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla de APs ordenados por clientes */}
      <div className="noc-card p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Users size={14} style={{ color:'#06b6d4' }} />
          Ranking de APs por carga de clientes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom:'1px solid #1e3460', background:'#0d1526' }}>
                {['#','AP','Zona / Grupo','Estado','Clientes','Carga','Temperatura','Firmware'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium" style={{ color:'#4b7ab5' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...(aps ?? [])].sort((a, b) => b.clients - a.clients).slice(0, 20).map((ap, i) => {
                const pct      = (ap.clients / Math.max(1, maxClients)) * 100;
                const barColor = pct > 70 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#10b981';
                const stColor  = ap.status === 'online' ? '#10b981' : ap.status === 'warning' ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={ap.serial}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom:'1px solid #1e346020' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#182548')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setSelected(ap)}>
                    <td className="px-3 py-2 font-mono" style={{ color: i < 3 ? '#f59e0b' : '#374d6b' }}>
                      {i + 1}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-white truncate max-w-[180px]" title={ap.name}>{ap.name}</div>
                      <div className="font-mono" style={{ color:'#374d6b', fontSize:10 }}>{ap.serial}</div>
                    </td>
                    <td className="px-3 py-2" style={{ color:'#6b8bb5' }}>{ap.building || ap.group}</td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-0.5 rounded-full font-mono text-xs" style={{ background:`${stColor}15`, color:stColor }}>
                        {ap.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold" style={{ color: barColor }}>{ap.clients}</td>
                    <td className="px-3 py-2 w-28">
                      <div className="h-2 rounded-full" style={{ background:'#1e3460' }}>
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, background:barColor }} />
                      </div>
                      <div className="text-right font-mono mt-0.5" style={{ color: barColor, fontSize:9 }}>{pct.toFixed(0)}%</div>
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color: ap.temperature >= 65 ? '#ef4444' : ap.temperature >= 55 ? '#f59e0b' : '#10b981' }}>
                      {ap.temperature > 0 ? `${ap.temperature}°C` : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono" style={{ color:'#4b7ab5', fontSize:10 }}>{ap.firmware}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal AP seleccionado */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:'#00000080', backdropFilter:'blur(4px)' }}
          onClick={() => setSelected(null)}>
          <div className="noc-card p-5 w-80" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="text-sm font-bold text-white leading-tight">{selected.name}</div>
                <div className="text-xs mt-0.5 font-mono" style={{ color:'#4b7ab5' }}>{selected.serial}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Estado',    selected.status, selected.status === 'online' ? '#10b981' : selected.status === 'warning' ? '#f59e0b' : '#ef4444'],
                ['Clientes',  selected.clients, '#06b6d4'],
                ['IP',        selected.ip, '#3b82f6'],
                ['Grupo',     selected.group, '#6b8bb5'],
                ['Firmware',  selected.firmware, '#6b8bb5'],
                ['Temperatura', selected.temperature > 0 ? `${selected.temperature}°C` : '—', selected.temperature >= 65 ? '#ef4444' : '#10b981'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between py-1.5 border-b" style={{ borderColor:'#1e346030' }}>
                  <span style={{ color:'#4b7ab5' }}>{k}</span>
                  <span className="font-mono font-semibold" style={{ color: c as string }}>{String(v)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              {(selected.clients / maxClients * 100) > 70 && (
                <div className="text-xs rounded p-2" style={{ background:'#ef444415', color:'#ef4444', border:'1px solid #ef444430' }}>
                  ⚠ Carga alta — considerar balanceo de clientes
                </div>
              )}
              {selected.status === 'offline' && (
                <div className="text-xs rounded p-2" style={{ background:'#ef444415', color:'#ef4444', border:'1px solid #ef444430' }}>
                  ✕ AP sin conexión — verificar PoE y cableado
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
