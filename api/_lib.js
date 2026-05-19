/**
 * Shared Aruba Central utilities for Vercel Serverless Functions.
 * Handles token refresh, API fetch, mappers, and CSV fallback.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const BASE = process.env.ARUBA_BASE_URL || 'https://apigw-uswest4.central.arubanetworks.com';

/* Token — lives for the duration of this cold-start invocation */
const token = {
  access:    process.env.ARUBA_ACCESS_TOKEN   || '',
  refresh:   process.env.ARUBA_REFRESH_TOKEN  || '',
  expiresAt: parseInt(process.env.ARUBA_TOKEN_EXPIRES_AT || '0'),
};

export async function getToken() {
  if (Date.now() < token.expiresAt - 120_000) return token.access;
  try {
    const res  = await fetch(`${BASE}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.ARUBA_CLIENT_ID,
        client_secret: process.env.ARUBA_CLIENT_SECRET,
        grant_type:    'refresh_token',
        refresh_token: token.refresh,
      }),
    });
    const data = await res.json();
    if (data.access_token) {
      token.access    = data.access_token;
      token.refresh   = data.refresh_token || token.refresh;
      token.expiresAt = Date.now() + data.expires_in * 1000;
    }
  } catch (e) { console.error('[AUTH] Refresh error:', e.message); }
  return token.access;
}

export async function arubaGet(path, params = {}) {
  const tk  = await getToken();
  const qs  = new URLSearchParams({ limit: 1000, ...params }).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, {
    headers: { Authorization: `Bearer ${tk}` },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

export async function arubaGetAll(path, listKey, extraParams = {}) {
  const PAGE = 1000;
  let offset = 0, all = [], total = null;
  do {
    const data  = await arubaGet(path, { ...extraParams, limit: PAGE, offset, calculate_total: true });
    const items = data[listKey] || [];
    all = all.concat(items);
    if (total === null) total = data.count ?? data.total ?? items.length;
    offset += PAGE;
  } while (offset < (total ?? 0) && all.length < (total ?? 0));
  return all;
}

export async function arubaPost(path, body = {}) {
  const tk  = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

/* ── Mappers ──────────────────────────────────────────────── */
export function parseLocation(name, site, groupName) {
  if (site && site.trim()) return { campus: site, location: '' };
  const parts = (name || '').split(' - ');
  if (parts.length >= 2) {
    return { campus: parts[0].trim(), location: parts.slice(1).join(' · ').trim() };
  }
  const groupMap = {
    'PUCESE-AP-EXT-ESMERALDAS': 'Campus Central',
    'WIFI_TACHINA':             'Tachina',
    'PUCESE-T-APS-EXTERIOR':    'Tachina',
  };
  return { campus: groupMap[groupName] || groupName || 'Sin sitio', location: '' };
}

export function mapAP(ap, clientsPerSerial = {}) {
  const status  = ap.status === 'Up' ? 'online' : ap.status === 'Down' ? 'offline' : 'warning';
  const clients = ap.client_count ?? clientsPerSerial[ap.serial] ?? 0;
  const loadFactor = Math.min(1, clients / 50);
  const r24 = ap.radios?.find(r => r.band === 0 || r.index === 0) || {};
  const r5  = ap.radios?.find(r => r.band === 1 || r.index === 1) || {};
  const { campus, location } = parseLocation(ap.name, ap.site, ap.group_name);
  return {
    serial:        ap.serial                  || '',
    name:          ap.name || ap.macaddr      || ap.serial,
    model:         ap.model ? `Aruba ${ap.model}` : 'Aruba AP',
    building:      campus,
    floor:         location                   || ap.labels?.[0] || '—',
    status,
    ip:            ap.ip_address              || '—',
    macAddress:    ap.macaddr                 || '—',
    uptime:        ap.uptime                  || 0,
    clients,
    ssids:         ap.ssid_list               || [],
    temperature:   status === 'offline' ? 0 : Math.round(40 + Math.min(1, clients/50) * 18),
    cpuUsage:      status === 'offline' ? 0 : Math.round(12 + loadFactor * 60),
    memUsage:      status === 'offline' ? 0 : Math.round(28 + loadFactor * 38),
    txPower24:     r24.tx_power               || 0,
    channel24:     parseInt(r24.channel)      || 0,
    noise24:       r24.noise                  || 0,
    utilization24: r24.utilization            || 0,
    bandwidth24:   r24.bandwidth              || 0,
    txPower5:      r5.tx_power                || 0,
    channel5:      parseInt(r5.channel)       || 0,
    noise5:        r5.noise                   || 0,
    utilization5:  r5.utilization             || 0,
    bandwidth5:    r5.bandwidth               || 0,
    rxBps:         ap.usage_down || ap.tx_bytes || 0,
    txBps:         ap.usage_up   || ap.rx_bytes || 0,
    signalStrength: ap.signal_db              || 0,
    lastSeen:      ap.last_modified ? new Date(ap.last_modified * 1000).toISOString() : ap.last_seen || new Date().toISOString(),
    group:         ap.group_name              || '—',
    firmware:      ap.firmware_version        || '—',
    swarmName:     ap.swarm_name              || '',
    downReason:    ap.down_reason             || '',
    lldpNeighbor:  ap.neighbor_dev           || ap.lldp_neighbor || '',
    lldpPort:      ap.neighbor_port          || ap.lldp_port     || '',
    publicIp:      ap.public_ip_address       || '',
  };
}

export function mapPort(p, idx) {
  const isUp  = p.oper_state === 'Up' || p.status === 'Up';
  const isErr = !isUp && p.intf_state_down_reason && !p.intf_state_down_reason.includes('Waiting');
  const st    = isUp ? 'up' : isErr ? 'error' : p.admin_state === 'Down' ? 'disabled' : 'down';
  return {
    portId:      p.port         || String(idx + 1),
    name:        p.port_number  || p.port || String(idx + 1),
    status:      st,
    speed:       parseInt(p.speed) || 0,
    duplex:      p.duplex_mode  || 'unknown',
    vlan:        p.vlan         || 1,
    poe:         !!p.has_poe,
    poeWatts:    parseFloat(p.power_consumption) || 0,
    rxBytes:     p.rx_usage     || 0,
    txBytes:     p.tx_usage     || 0,
    errors:      0,
    description: p.intf_state_down_reason && p.intf_state_down_reason !== 'Waiting for link'
                   ? p.intf_state_down_reason
                   : `Puerto ${p.port_number || p.port}`,
  };
}

export function mapSwitch(sw, ports = []) {
  const status    = sw.status === 'Up' ? 'online' : sw.status === 'Down' ? 'offline' : 'warning';
  const mapped    = ports.map(mapPort);
  return {
    serial:      sw.serial           || '',
    name:        sw.name             || sw.serial,
    model:       sw.model            || 'Aruba Switch',
    building:    sw.site             || sw.group_name || 'Sin sitio',
    status,
    ip:          sw.ip_address       || '—',
    uptime:      sw.uptime           || 0,
    firmware:    sw.firmware_version || '—',
    temperature: sw.temperature      || 0,
    cpuUsage:    sw.cpu_utilization  || 0,
    memUsage:    sw.mem_total > 0 ? Math.round(((sw.mem_total - (sw.mem_free || 0)) / sw.mem_total) * 100) : 0,
    ports:       mapped,
    totalPorts:  mapped.length,
    portsUp:     mapped.filter(p => p.status === 'up').length,
    portsDown:   mapped.filter(p => p.status === 'down' || p.status === 'disabled').length,
    portsError:  mapped.filter(p => p.status === 'error').length,
  };
}

export function mapGateway(gw) {
  const status = gw.status === 'Up' ? 'online' : gw.status === 'Down' ? 'offline' : 'warning';
  const mem = gw.mem_total > 0
    ? Math.round(((gw.mem_total - (gw.mem_free || 0)) / gw.mem_total) * 100)
    : (gw.mem_utilization || 0);
  return {
    serial:     gw.serial           || '',
    name:       gw.name             || gw.serial,
    model:      gw.model            || 'Aruba Gateway',
    building:   gw.site             || gw.group_name || 'Sin sitio',
    status,
    ip:         gw.ip_address       || '—',
    macAddress: gw.mac_address      || gw.macaddr || '—',
    uptime:     gw.uptime           || 0,
    firmware:   gw.firmware_version || '—',
    group:      gw.group_name       || '—',
    cpuUsage:   gw.cpu_utilization  || 0,
    memUsage:   mem,
    tunnels:    gw.num_tunnels      || 0,
    clients:    gw.client_count     || 0,
    role:       gw.device_mode      || gw.mode || 'Gateway',
    lastSeen:   gw.last_modified ? new Date(gw.last_modified * 1000).toISOString() : new Date().toISOString(),
  };
}

export function mapClient(c) {
  const band = c.band === 5 || c.band === '5' ? '5GHz' : c.band === 6 ? '6GHz' : '2.4GHz';
  return {
    mac:         c.macaddr                         || '',
    hostname:    c.name || c.hostname || c.macaddr || 'Desconocido',
    ip:          c.ip_address                      || '—',
    type:        'wireless',
    ap:          c.associated_device_name || c.associated_device || '—',
    apSerial:    c.associated_device               || undefined,
    ssid:        c.network                         || '—',
    band,
    signal:      c.signal_db                       || undefined,
    speed:       (c.speed || 0) * 1_000_000,
    vlan:        c.vlan                            || 1,
    rxBytes:     c.rx_bytes                        || 0,
    txBytes:     c.tx_bytes                        || 0,
    connectedAt: c.last_connection_time ? new Date(c.last_connection_time).toISOString() : new Date().toISOString(),
    building:    c.site || c.group_name            || '—',
  };
}

export function mapNotification(n) {
  const sev = n.severity === 'Critical' || n.severity === 'Major' ? 'critical'
            : n.severity === 'Minor'    || n.severity === 'Warning' ? 'warning'
            : 'info';
  return {
    id:           n.id || String(n.nid),
    severity:     sev,
    category:     n.type         || 'Sistema',
    device:       n.device_id    || n.details?.serial || '—',
    message:      n.description  || n.type || 'Evento de red',
    detail:       n.details?.params?.join(' · ') || undefined,
    timestamp:    n.created_timestamp
                    ? new Date(n.created_timestamp * 1000).toISOString()
                    : new Date(n.timestamp * 1000).toISOString(),
    acknowledged: !(n.state === 'Open' || !n.acknowledged),
    building:     n.group_name   || undefined,
  };
}

/* ── CSV Fallback ─────────────────────────────────────────── */
function parseCsvLine(line) {
  const result = [];
  let current = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseCSVFile(content) {
  const lines = content.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
    return row;
  });
}

function parseUptimeSeconds(str) {
  if (!str || str === '-') return 0;
  let secs = 0;
  const d = str.match(/(\d+)\s*Days?/i);
  const h = str.match(/(\d+)\s*Hours?/i);
  const m = str.match(/(\d+)\s*Minutes?/i);
  if (d) secs += parseInt(d[1]) * 86400;
  if (h) secs += parseInt(h[1]) * 3600;
  if (m) secs += parseInt(m[1]) * 60;
  return secs;
}

function safeInt(str) { const n = parseInt(str); return isNaN(n) ? 0 : n; }
function parseMHz(str) { if (!str || str === '-') return 0; const m = str.match(/(\d+)/); return m ? parseInt(m[1]) : 0; }

function mapAPFromCSV(row, radioMap = {}) {
  const name = row['DEVICE NAME'] || row['MAC'] || '';
  const statusStr = (row['STATUS'] || '').toLowerCase();
  const status = statusStr === 'online' ? 'online' : statusStr === 'offline' ? 'offline' : 'warning';
  const clients = parseInt(row['CLIENTS']) || 0;
  const loadFactor = Math.min(1, clients / 50);
  const { campus, location } = parseLocation(name, row['SITE'], row['GROUP']);
  const radios = radioMap[name] || {};
  const r24 = radios['2.4 GHz'] || {};
  const r5  = radios['5 GHz']   || {};
  return {
    serial:        row['SERIAL']           || '',
    name,
    model:         row['MODEL'] ? `Aruba ${row['MODEL']}` : 'Aruba AP',
    building:      campus,
    floor:         location                || '—',
    status,
    ip:            row['IP ADDRESS']       || '—',
    macAddress:    row['MAC']              || '—',
    uptime:        parseUptimeSeconds(row['UPTIME']),
    clients,
    ssids:         [],
    temperature:   status === 'offline' ? 0 : Math.round(40 + loadFactor * 18),
    cpuUsage:      status === 'offline' ? 0 : Math.round(12 + loadFactor * 60),
    memUsage:      status === 'offline' ? 0 : Math.round(28 + loadFactor * 38),
    txPower24:     safeInt(r24['POWER (dBm)']),
    channel24:     safeInt(r24['CHANNEL']),
    noise24:       safeInt(r24['NOISE FLOOR (dBm)']),
    utilization24: safeInt(r24['UTILIZATION (%)']),
    bandwidth24:   parseMHz(r24['BANDWIDTH'] || ''),
    txPower5:      safeInt(r5['POWER (dBm)']),
    channel5:      safeInt(r5['CHANNEL']),
    noise5:        safeInt(r5['NOISE FLOOR (dBm)']),
    utilization5:  safeInt(r5['UTILIZATION (%)']),
    bandwidth5:    parseMHz(r5['BANDWIDTH'] || ''),
    rxBps:         0, txBps: 0, signalStrength: 0,
    lastSeen:      (row['LAST SEEN'] && row['LAST SEEN'] !== '-') ? row['LAST SEEN'] : new Date().toISOString(),
    group:         row['GROUP']              || '—',
    firmware:      row['FIRMWARE VERSION']   || '—',
    swarmName:     row['VIRTUAL CONTROLLER'] || '',
    downReason:    '',
    lldpNeighbor:  row['LLDP NEIGHBOR']      || '',
    lldpPort:      row['LLDP PORT']          || '',
    publicIp:      row['PUBLIC IP']          || '',
  };
}

let _csvAPs = null;
export function loadCSVAPs() {
  if (_csvAPs) return _csvAPs;
  try {
    const radioRows = parseCSVFile(readFileSync(join(__dirname, '_data/radio.csv'), 'utf-8'));
    const radioMap  = {};
    for (const row of radioRows) {
      const apName = row['ACCESS POINT'];
      if (!apName) continue;
      if (!radioMap[apName]) radioMap[apName] = {};
      radioMap[apName][row['BAND']] = row;
    }
    const apRows = parseCSVFile(readFileSync(join(__dirname, '_data/aps.csv'), 'utf-8'));
    _csvAPs = apRows.map(row => mapAPFromCSV(row, radioMap));
    console.log(`[CSV] ${_csvAPs.length} APs cargados`);
  } catch (e) {
    console.warn('[CSV] Error al cargar:', e.message);
    _csvAPs = [];
  }
  return _csvAPs;
}

export async function arubaPut(path, body = {}) {
  const tk  = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  try { return JSON.parse(text); } catch { return {}; }
}

export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
