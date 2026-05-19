import { useState, useMemo } from 'react';
import { Search, Wifi, Signal, Clock } from 'lucide-react';
import { useClients } from '../hooks/useData';
import type { Client } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b/1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b/1e6).toFixed(1)} MB`;
  return `${(b/1e3).toFixed(0)} KB`;
}
function fmtSpeed(bps: number) {
  if (bps >= 1e9) return `${(bps/1e9).toFixed(0)} Gbps`;
  if (bps >= 1e6) return `${(bps/1e6).toFixed(0)} Mbps`;
  return `${(bps/1e3).toFixed(0)} Kbps`;
}
function signalColor(s: number | undefined) {
  if (!s) return '#6b7280';
  if (s > -60) return '#10b981';
  if (s > -70) return '#f59e0b';
  return '#ef4444';
}
function signalLabel(s: number | undefined) {
  if (!s) return '—';
  if (s > -60) return 'Excelente';
  if (s > -70) return 'Buena';
  if (s > -80) return 'Regular';
  return 'Débil';
}

const PAGE_SIZE = 25;

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const [search, setSearch] = useState('');
  const [ssidFilter, setSsidFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [bandFilter, setBandFilter] = useState('all');
  const [page, setPage] = useState(1);

  const ssids    = useMemo(() => ['all', ...new Set((clients ?? []).map(c => c.ssid ?? '').filter(Boolean))], [clients]);
  const buildings = useMemo(() => ['all', ...new Set((clients ?? []).map(c => c.building ?? '').filter(Boolean))], [clients]);

  const filtered = useMemo(() => (clients ?? []).filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.hostname.toLowerCase().includes(q) || c.ip.includes(q) || c.mac.includes(q) || (c.ap ?? '').toLowerCase().includes(q);
    const matchSsid     = ssidFilter === 'all'     || c.ssid === ssidFilter;
    const matchBuilding = buildingFilter === 'all' || c.building === buildingFilter;
    const matchBand     = bandFilter === 'all'     || c.band === bandFilter;
    return matchQ && matchSsid && matchBuilding && matchBand;
  }), [clients, search, ssidFilter, buildingFilter, bandFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const byBand = useMemo(() => ({
    '2.4GHz': (clients ?? []).filter(c => c.band === '2.4GHz').length,
    '5GHz':   (clients ?? []).filter(c => c.band === '5GHz').length,
  }), [clients]);

  const bySsid = useMemo(() => {
    const m: Record<string, number> = {};
    (clients ?? []).forEach(c => { if (c.ssid) m[c.ssid] = (m[c.ssid] ?? 0) + 1; });
    return m;
  }, [clients]);

  return (
    <div className="space-y-4 card-enter">
      <div>
        <h1 className="text-lg font-bold text-white">Clientes Activos</h1>
        <p className="text-xs mt-0.5" style={{ color:'#4b7ab5' }}>
          Dispositivos conectados a la red inalámbrica — PUCESE
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Total Conectados</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#3b82f6' }}>
            {(clients ?? []).length}
          </div>
        </div>
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Banda 2.4 GHz</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#f59e0b' }}>{byBand['2.4GHz']}</div>
        </div>
        <div className="noc-card p-3">
          <div className="text-xs" style={{ color:'#6b8bb5' }}>Banda 5 GHz</div>
          <div className="text-2xl font-mono font-bold mt-1" style={{ color:'#10b981' }}>{byBand['5GHz']}</div>
        </div>
        <div className="noc-card p-3">
          <div className="text-xs mb-2" style={{ color:'#6b8bb5' }}>Por SSID</div>
          <div className="space-y-1">
            {Object.entries(bySsid).map(([ssid, n]) => (
              <div key={ssid} className="flex items-center gap-2">
                <div className="h-1 rounded-full flex-1" style={{ background:'#1e3460' }}>
                  <div className="h-full rounded-full" style={{ width:`${(n/(clients?.length||1))*100}%`, background:'#3b82f6' }} />
                </div>
                <span className="text-xs font-mono w-8 text-right" style={{ color:'#3b82f6' }}>{n}</span>
                <span className="text-xs truncate max-w-[80px]" style={{ color:'#4b7ab5', fontSize:10 }}>{ssid}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#4b7ab5' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar hostname, IP, MAC, AP..."
            className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none w-52"
            style={{ background:'#0d1526', border:'1px solid #1e3460', color:'#e2e8f0' }} />
        </div>

        {[
          { label:'SSID', value: ssidFilter, options: ssids, set: (v: string) => { setSsidFilter(v); setPage(1); } },
          { label:'Edificio', value: buildingFilter, options: buildings, set: (v: string) => { setBuildingFilter(v); setPage(1); } },
        ].map(({ label, value, options, set }) => (
          <select key={label} value={value} onChange={e => set(e.target.value)}
            className="px-2 py-2 rounded-lg text-xs outline-none"
            style={{ background:'#0d1526', border:'1px solid #1e3460', color: value === 'all' ? '#4b7ab5' : '#e2e8f0' }}>
            <option value="all">Todos los {label}s</option>
            {options.filter(o => o !== 'all').map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}

        <div className="flex gap-1">
          {['all','2.4GHz','5GHz'].map(b => (
            <button key={b} onClick={() => { setBandFilter(b); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: bandFilter === b ? '#1d4ed8' : '#0d1526', color: bandFilter === b ? '#fff' : '#4b7ab5', border:`1px solid ${bandFilter === b ? '#3b82f6' : '#1e3460'}` }}>
              {b === 'all' ? 'Todas las bandas' : b}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono ml-auto" style={{ color:'#374d6b' }}>
          {filtered.length} clientes · pág {page}/{totalPages || 1}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="noc-card p-8 text-center text-sm" style={{ color:'#4b7ab5' }}>Cargando clientes...</div>
      ) : (
        <div className="noc-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background:'#0d1526', borderBottom:'1px solid #1e3460' }}>
                  {['Hostname','IP','MAC','AP / SSID','Banda','Señal','Velocidad','Rx / Tx','Edificio','Conectado hace'].map(h => (
                    <th key={h} className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color:'#4b7ab5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((c: Client, i) => (
                  <tr key={`${c.mac}-${i}`}
                    style={{ borderBottom:'1px solid #1e346020' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#182548')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-white">{c.hostname}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color:'#3b82f6' }}>{c.ip}</td>
                    <td className="px-3 py-2.5 font-mono" style={{ color:'#4b7ab5', fontSize:10 }}>{c.mac}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Wifi size={10} style={{ color:'#6b8bb5' }} />
                        <span style={{ color:'#e2e8f0', fontSize:10 }}>{c.ap?.replace('AP-','')}</span>
                      </div>
                      <div style={{ color:'#374d6b', fontSize:10 }}>{c.ssid}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-1.5 py-0.5 rounded font-mono text-xs"
                        style={{ background: c.band === '5GHz' ? '#10b98115' : '#f59e0b15', color: c.band === '5GHz' ? '#10b981' : '#f59e0b', fontSize:10 }}>
                        {c.band}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <Signal size={10} style={{ color: signalColor(c.signal) }} />
                        <span style={{ color: signalColor(c.signal) }}>{c.signal} dBm</span>
                      </div>
                      <div style={{ color:'#374d6b', fontSize:10 }}>{signalLabel(c.signal)}</div>
                    </td>
                    <td className="px-3 py-2.5 font-mono" style={{ color:'#8b5cf6' }}>{fmtSpeed(c.speed)}</td>
                    <td className="px-3 py-2.5 font-mono">
                      <div style={{ color:'#10b981', fontSize:10 }}>↓ {fmtBytes(c.rxBytes)}</div>
                      <div style={{ color:'#3b82f6', fontSize:10 }}>↑ {fmtBytes(c.txBytes)}</div>
                    </td>
                    <td className="px-3 py-2.5" style={{ color:'#6b8bb5', fontSize:10 }}>{c.building}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1" style={{ color:'#4b7ab5', fontSize:10 }}>
                        <Clock size={9} />
                        {formatDistanceToNow(new Date(c.connectedAt), { addSuffix: false, locale: es })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 border-t" style={{ borderColor:'#1e3460' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded text-xs transition-colors disabled:opacity-30 hover:bg-noc-hover"
                style={{ color:'#4b7ab5', border:'1px solid #1e3460' }}>
                ← Anterior
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = page <= 4 ? i + 1 : page + i - 3;
                if (p < 1 || p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-7 h-7 rounded text-xs transition-colors"
                    style={{ background: page === p ? '#1d4ed8' : 'transparent', color: page === p ? '#fff' : '#4b7ab5' }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded text-xs transition-colors disabled:opacity-30 hover:bg-noc-hover"
                style={{ color:'#4b7ab5', border:'1px solid #1e3460' }}>
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
