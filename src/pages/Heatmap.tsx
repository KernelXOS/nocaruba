import { useEffect, useRef, useState, useMemo } from 'react';
import { useAPs, useClients } from '../hooks/useData';
import type { AccessPoint } from '../types';
import { Thermometer, Wifi, Users, RefreshCw, ZoomIn, ZoomOut, Layers, Target, Activity, AlertTriangle, Power } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';

/* ── Zonas del campus PUCESE (posición relativa 0–1) ───────── */
const ZONES: { key: string; label: string; x: number; y: number; w: number; h: number; color: string }[] = [
  { key:'campus-admin',    label:'Administrativo',      x:0.02, y:0.04, w:0.22, h:0.30, color:'#3b82f6' },
  { key:'campus-biblio',   label:'Biblioteca Central',  x:0.26, y:0.04, w:0.18, h:0.30, color:'#3b82f6' },
  { key:'campus-aulas-a',  label:'Bloque Aulas A',      x:0.02, y:0.38, w:0.20, h:0.28, color:'#8b5cf6' },
  { key:'campus-aulas-b',  label:'Bloque Aulas B',      x:0.24, y:0.38, w:0.20, h:0.28, color:'#8b5cf6' },
  { key:'campus-lab',      label:'Laboratorios',        x:0.46, y:0.04, w:0.18, h:0.30, color:'#3b82f6' },
  { key:'campus-cafe',     label:'Cafetería / Bar',     x:0.46, y:0.38, w:0.10, h:0.28, color:'#8b5cf6' },
  { key:'campus-gym',      label:'Gimnasio',            x:0.58, y:0.38, w:0.08, h:0.28, color:'#8b5cf6' },
  { key:'santacruz-b1',    label:'SC Bloque 1',         x:0.68, y:0.04, w:0.14, h:0.30, color:'#0ea5e9' },
  { key:'santacruz-b2',    label:'SC Bloque 2',         x:0.84, y:0.04, w:0.14, h:0.30, color:'#0ea5e9' },
  { key:'santacruz-aulas', label:'SC Aulas',            x:0.68, y:0.38, w:0.30, h:0.28, color:'#06b6d4' },
  { key:'tachina-of',      label:'Tachina Oficinas',    x:0.02, y:0.70, w:0.22, h:0.26, color:'#10b981' },
  { key:'tachina-patio',   label:'Tachina Patio',       x:0.26, y:0.70, w:0.18, h:0.26, color:'#10b981' },
  { key:'tachina-ext',     label:'Tachina Exterior',    x:0.46, y:0.70, w:0.20, h:0.26, color:'#14b8a6' },
  { key:'tachina-otros',   label:'Tachina Otros',       x:0.68, y:0.70, w:0.30, h:0.26, color:'#14b8a6' },
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
    x: zone.x + 0.04 + jx * (zone.w - 0.08),
    y: zone.y + 0.06 + jy * (zone.h - 0.12),
  };
}

/* ── Paleta de colores térmica continua (Magma/Turbo style) ─────────────────────── */
function buildColormap(): Uint8ClampedArray {
  const cm = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let r, g, b;
    // Enhanced vibrant thermal palette
    if (t < 0.2) {
      r = 0; g = 0; b = Math.round(t * 5 * 255); // Black to Blue
    } else if (t < 0.4) {
      r = 0; g = Math.round((t - 0.2) * 5 * 255); b = 255; // Blue to Cyan
    } else if (t < 0.6) {
      r = Math.round((t - 0.4) * 5 * 255); g = 255; b = Math.round(255 - (t - 0.4) * 5 * 255); // Cyan to Yellow
    } else if (t < 0.8) {
      r = 255; g = Math.round(255 - (t - 0.6) * 5 * 255); b = 0; // Yellow to Red
    } else {
      r = 255; g = Math.round((t - 0.8) * 5 * 255); b = Math.round((t - 0.8) * 5 * 255); // Red to White
    }
    cm[i * 4 + 0] = r;
    cm[i * 4 + 1] = g;
    cm[i * 4 + 2] = b;
    // Lower alpha curve to let the blueprint show through in low-density areas
    cm[i * 4 + 3] = Math.round(Math.pow(t, 1.2) * 200); 
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
  isDark: boolean
) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d')!;

  // Clear background (transparent to let CSS handle it)
  ctx.clearRect(0, 0, W, H);

  // Zonas del campus (Blueprint Style)
  if (showZones) {
    ZONES.forEach(z => {
      const x = z.x * W, y = z.y * H, w = z.w * W, h = z.h * H;
      
      // Neon Outline
      ctx.strokeStyle = isDark ? `${z.color}50` : `${z.color}80`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 4]); // Dashed tech lines
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.stroke();
      ctx.setLineDash([]); // Reset

      // Subtle fill
      ctx.fillStyle = isDark ? `${z.color}05` : `${z.color}10`;
      ctx.fill();

      // Etiqueta de zona
      ctx.fillStyle = isDark ? `${z.color}90` : `${z.color}`;
      ctx.font = `bold ${Math.max(9, Math.min(12, w * 0.1))}px Inter, monospace`;
      ctx.textAlign = 'left';
      ctx.fillText(z.label.toUpperCase(), x + 8, y + 16);
    });
  }

  // ── Capa de calor continua ──────────────────────────────────────────
  const offCanvas = document.createElement('canvas');
  offCanvas.width = W; offCanvas.height = H;
  const off = offCanvas.getContext('2d')!;

  const onlineAPs = aps.filter(a => a.status !== 'offline');
  // Much larger radius for overlapping/blending
  const radius = Math.round(Math.min(W, H) * 0.22); 

  onlineAPs.forEach(ap => {
    const pos = assignZone(ap);
    const cx  = pos.x * W;
    const cy  = pos.y * H;
    // Intensity scaling
    const intensity = Math.max(0.15, ap.clients / Math.max(1, maxClients));

    const grad = off.createRadialGradient(cx, cy, 0, cx, cy, radius);
    // Exponential falloff for smooth merging
    grad.addColorStop(0,   `rgba(255, 255, 255, ${intensity * 0.9})`);
    grad.addColorStop(0.3, `rgba(255, 255, 255, ${intensity * 0.5})`);
    grad.addColorStop(0.6, `rgba(255, 255, 255, ${intensity * 0.15})`);
    grad.addColorStop(1,   'rgba(255, 255, 255, 0)');

    off.fillStyle = grad;
    // Use lighter operation to add up thermal heat
    off.globalCompositeOperation = 'lighter';
    off.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  });

  // Aplicar colormap térmico
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
  
  // Draw heat with global alpha blending
  ctx.globalAlpha = 0.85;
  ctx.drawImage(offCanvas, 0, 0);
  ctx.globalAlpha = 1.0;

  // ── APs como puntos "Target" ────────────────────────────────────────
  if (showAPs) {
    onlineAPs.forEach(ap => {
      const pos = assignZone(ap);
      const cx  = pos.x * W;
      const cy  = pos.y * H;
      const statusColor = ap.status === 'warning' ? '#f59e0b' : '#10b981';

      // Anillo radar
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.strokeStyle = `${statusColor}60`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Punto central
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = statusColor;
      ctx.fill();

      // Número de clientes (Estilo HUD)
      if (ap.clients > 0) {
        ctx.font = 'bold 9px monospace';
        ctx.textAlign  = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle  = isDark ? '#ffffff' : '#334155';
        ctx.fillText(String(ap.clients), cx + 12, cy);
      }
    });

    // APs offline (X marks the spot)
    aps.filter(a => a.status === 'offline').forEach(ap => {
      const pos = assignZone(ap);
      const cx  = pos.x * W;
      const cy  = pos.y * H;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 3, cy - 3); ctx.lineTo(cx + 3, cy + 3);
      ctx.moveTo(cx + 3, cy - 3); ctx.lineTo(cx - 3, cy + 3);
      ctx.stroke();
    });
  }

  // Etiquetas de super-sectores
  if (showZones) {
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textBaseline = 'top';
    [
      { label:'CAMPUS CENTRAL [SECTOR A]', x:0.24, y:0.01 },
      { label:'SANTA CRUZ [SECTOR B]',     x:0.76, y:0.01 },
      { label:'TACHINA [SECTOR C]',        x:0.38, y:0.68 },
    ].forEach(({ label, x, y }) => {
      ctx.textAlign = 'center';
      ctx.fillStyle = isDark ? '#ffffff30' : '#00000030';
      ctx.fillText(label, x * W, y * H);
    });
  }
}

/* ── Componente principal ─────────────────────────────────── */
export default function Heatmap() {
  const { data: aps,     isLoading: apsLoad  } = useAPs();
  const { data: clients, isLoading: cliLoad  } = useClients();
  const { isDark } = useThemeStore();
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

    renderHeatmap(canvas, aps, maxClients, showZones, showAPs, isDark);
  }, [aps, maxClients, showZones, showAPs, isDark]);

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
    <div className="space-y-6 card-enter pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Target className="text-cyan-500" />
            Radar de Cobertura
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análisis térmico y estructural de densidad WiFi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowZones(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showZones ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-transparent'}`}>
            <Layers size={16} /> Estructura
          </button>
          <button onClick={() => setShowAPs(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showAPs ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-transparent'}`}>
            <Wifi size={16} /> Dispositivos
          </button>
          <div className="h-6 w-px bg-slate-300 dark:bg-white/10 mx-1" />
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"><ZoomIn size={16} /></button>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"><ZoomOut size={16} /></button>
          <button onClick={() => { if (aps) renderHeatmap(canvasRef.current!, aps, maxClients, showZones, showAPs, isDark); }}
            className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Antenas Activas', value: onlineCount,   color:'text-emerald-500', bg:'bg-emerald-500/10' },
          { label:'Fueras de Línea', value: offlineCount,  color:'text-red-500',     bg:'bg-red-500/10' },
          { label:'Clientes Totales',value: totalClients,  color:'text-cyan-500',    bg:'bg-cyan-500/10' },
          { label:'Pico por Antena', value: maxClients,    color:'text-purple-500',  bg:'bg-purple-500/10' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="metric-box flex flex-col group hover:-translate-y-1 transition-transform">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Canvas + Sidebar */}
      <div className="flex flex-col xl:flex-row gap-6">

        {/* Mapa principal */}
        <div className="flex-1 noc-card p-0 overflow-hidden relative border-slate-200 dark:border-white/10">
          
          {/* Fondo Blueprint (CSS Grid) */}
          <div className="absolute inset-0 blueprint-grid dark:opacity-40 opacity-10 pointer-events-none" />

          {/* Scanner Line */}
          {!isLoading && <div className="radar-scanner" />}

          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <div className="text-center">
                <div className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 animate-pulse">Analizando radiación electromagnética...</p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className="w-full relative z-10 overflow-auto scrollbar-hide">
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="block mx-auto min-w-[800px]"
                style={{
                  width: `${zoom * 100}%`,
                  cursor: 'crosshair',
                }}
              />
            </div>
          )}

          {/* Leyenda Térmica flotante */}
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 noc-card p-3 shadow-lg z-20 bg-white/90 dark:bg-[#0B0E14]/90 backdrop-blur">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Baja Señal</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alta Congestión</span>
            </div>
            <div className="h-2 rounded-full w-full mb-3 shadow-inner" style={{
              background:'linear-gradient(90deg, rgba(0,0,255,0.2), #00f, #0ff, #0f0, #ff0, #f00, #fff)'
            }} />
            <div className="flex items-center gap-4 text-[10px] font-medium text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Operativo</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500" /> Advertencia</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full border-2 border-red-500" /> Desconectado</span>
            </div>
          </div>
        </div>

        {/* Panel lateral de zonas */}
        <div className="w-full xl:w-80 flex-shrink-0 noc-card flex flex-col overflow-hidden border-slate-200 dark:border-white/10">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Activity size={16} className="text-purple-500" />
              Sectores Estructurales
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {zoneStats.map((z, i) => {
              const pct = z.totalClients / Math.max(1, zoneStats[0].totalClients) * 100;
              const colorClass = pct > 66 ? 'bg-red-500 text-red-500' : pct > 33 ? 'bg-amber-500 text-amber-500' : 'bg-emerald-500 text-emerald-500';
              
              return (
                <div key={z.key} className="group rounded-xl p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate pr-2 group-hover:text-cyan-500 transition-colors">{z.label}</span>
                    <span className={`text-sm font-black ${colorClass.split(' ')[1]}`}>{z.totalClients}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mb-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${colorClass.split(' ')[0]}`}
                      style={{ width:`${pct}%` }} />
                  </div>
                  <div className="flex justify-between items-end text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col">
                      <span>{z.onlineAPs}/{z.totalAPs} Antenas</span>
                      <span>Pico: {z.maxSignal} usr</span>
                    </div>
                    <span className="font-mono text-slate-400 dark:text-slate-600 text-lg leading-none">#{i + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabla de APs Críticos */}
      <div className="noc-card flex flex-col overflow-hidden border-slate-200 dark:border-white/10">
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Users size={16} className="text-cyan-500" />
            Ranking de Antenas por Carga
          </h3>
        </div>
        <div className="overflow-x-auto p-2">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400">
                <th className="px-3 py-3 font-medium">#</th>
                <th className="px-3 py-3 font-medium">Dispositivo</th>
                <th className="px-3 py-3 font-medium">Ubicación</th>
                <th className="px-3 py-3 font-medium">Estado</th>
                <th className="px-3 py-3 font-medium text-center">Conexiones</th>
                <th className="px-3 py-3 font-medium">Saturación</th>
                <th className="px-3 py-3 font-medium">Temperatura</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {[...(aps ?? [])].sort((a, b) => b.clients - a.clients).slice(0, 15).map((ap, i) => {
                const pct      = (ap.clients / Math.max(1, maxClients)) * 100;
                const barColor = pct > 70 ? 'bg-red-500' : pct > 40 ? 'bg-amber-500' : 'bg-emerald-500';
                const stColor  = ap.status === 'online' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : ap.status === 'warning' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' : 'text-red-500 bg-red-500/10 border-red-500/20';
                
                return (
                  <tr key={ap.serial}
                    className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelected(ap)}>
                    <td className="px-3 py-3 font-mono font-bold text-slate-400 dark:text-slate-600">
                      {String(i + 1).padStart(2, '0')}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 transition-colors">{ap.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{ap.serial}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400">{ap.building || ap.group}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${stColor}`}>
                        {ap.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="font-black text-sm">{ap.clients}</span>
                    </td>
                    <td className="px-3 py-3 w-40">
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width:`${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`font-mono font-medium ${ap.temperature >= 65 ? 'text-red-500' : ap.temperature >= 55 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {ap.temperature > 0 ? `${ap.temperature}°C` : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal interactivo HUD */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-[#0B0E14]/80 backdrop-blur-sm transition-all"
          onClick={() => setSelected(null)}>
          <div className="noc-card p-0 w-80 shadow-2xl border-cyan-500/30 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 flex justify-between items-start">
              <div>
                <div className="text-lg font-black text-slate-800 dark:text-white leading-tight">{selected.name}</div>
                <div className="text-xs mt-1 font-mono text-cyan-600 dark:text-cyan-400">{selected.serial}</div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-700 dark:hover:text-white transition-colors">✕</button>
            </div>
            
            <div className="p-4 space-y-3 text-xs">
              {[
                ['Estado de Red', selected.status.toUpperCase(), selected.status === 'online' ? 'text-emerald-500' : selected.status === 'warning' ? 'text-amber-500' : 'text-red-500'],
                ['Usuarios Conectados',  selected.clients, 'text-cyan-500 text-sm font-black'],
                ['Dirección IPv4', selected.ip, 'text-purple-500 font-mono'],
                ['Grupo Lógico', selected.group, 'text-slate-600 dark:text-slate-300'],
                ['Versión Firmware', selected.firmware, 'text-slate-500 font-mono'],
                ['Térmica CPU', selected.temperature > 0 ? `${selected.temperature}°C` : '—', selected.temperature >= 65 ? 'text-red-500 font-bold' : 'text-emerald-500'],
              ].map(([k, v, c]) => (
                <div key={k as string} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{k}</span>
                  <span className={c as string}>{String(v)}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/10">
              {(selected.clients / maxClients * 100) > 70 && (
                <div className="text-[11px] font-medium rounded-lg p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 mb-2">
                  <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5" />
                  Saturación detectada. Sugerimos habilitar band-steering.
                </div>
              )}
              {selected.status === 'offline' && (
                <div className="text-[11px] font-medium rounded-lg p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 mb-2">
                  <Power size={14} className="inline mr-1.5 -mt-0.5" />
                  Equipo inalcanzable. Revise suministro PoE en switch.
                </div>
              )}
              <button className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs transition-colors glow-btn shadow-lg shadow-cyan-500/30">
                Ejecutar Diagnóstico Completo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
