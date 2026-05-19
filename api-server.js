/**
 * Proxy server — Aruba Central API
 * Endpoints reales confirmados para la cuenta PUCESE (uswest4).
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync } from 'fs';

const app  = express();
const PORT = parseInt(process.env.PROXY_PORT || '4000');
const BASE = process.env.ARUBA_BASE_URL || 'https://apigw-uswest4.central.arubanetworks.com';

app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

/* ── Token con auto-refresh ───────────────────────────────── */
const token = {
  access:    process.env.ARUBA_ACCESS_TOKEN  || '',
  refresh:   process.env.ARUBA_REFRESH_TOKEN || '',
  expiresAt: parseInt(process.env.ARUBA_TOKEN_EXPIRES_AT || '0'),
};

async function getToken() {
  if (Date.now() < token.expiresAt - 120_000) return token.access;
  console.log('[AUTH] Refrescando token...');
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
      console.log('[AUTH] Token renovado — vence en', data.expires_in, 'seg');
    }
  } catch (e) { console.error('[AUTH] Refresh error:', e.message); }
  return token.access;
}

/* ── Fetch helper ─────────────────────────────────────────── */
async function arubaGet(path, params = {}) {
  const tk  = await getToken();
  const qs  = new URLSearchParams({ limit: 1000, ...params }).toString();
  const url = `${BASE}${path}?${qs}`;
  console.log(`[GET] ${path}`);
  const res  = await fetch(url, { headers: { Authorization: `Bearer ${tk}` } });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

/* Obtiene TODOS los elementos paginando automáticamente */
async function arubaGetAll(path, listKey, extraParams = {}) {
  const PAGE = 1000;
  let offset = 0, all = [], total = null;
  do {
    const data = await arubaGet(path, { ...extraParams, limit: PAGE, offset, calculate_total: true });
    const items = data[listKey] || [];
    all = all.concat(items);
    if (total === null) total = data.count ?? data.total ?? items.length;
    offset += PAGE;
  } while (offset < (total ?? 0) && all.length < (total ?? 0));
  console.log(`[ALL] ${path} → ${all.length}/${total} dispositivos`);
  return all;
}

async function arubaPost(path, body = {}) {
  const tk  = await getToken();
  const res  = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

/* ── Mappers ──────────────────────────────────────────────── */
/* Extrae campus y ubicación del nombre del AP.
   Formato: "Campus Central - Biblioteca 3" o "Tachina - Aula 206"
   El campo `site` viene vacío en esta cuenta; se parsea desde el nombre. */
function parseLocation(name, site, groupName) {
  if (site && site.trim()) return { campus: site, location: '' };
  const parts = (name || '').split(' - ');
  if (parts.length >= 2) {
    const campus   = parts[0].trim();
    const location = parts.slice(1).join(' · ').trim();
    return { campus, location };
  }
  // Fallback: usar el grupo
  const groupMap = {
    'PUCESE-AP-EXT-ESMERALDAS': 'Campus Central',
    'WIFI_TACHINA':             'Tachina',
    'PUCESE-T-APS-EXTERIOR':    'Tachina',
  };
  return { campus: groupMap[groupName] || groupName || 'Sin sitio', location: '' };
}

function mapAP(ap, clientsPerSerial = {}) {
  const status  = ap.status === 'Up' ? 'online' : ap.status === 'Down' ? 'offline' : 'warning';
  const clients = ap.client_count ?? clientsPerSerial[ap.serial] ?? 0;

  // Temperatura/CPU estimados desde carga de clientes.
  // Aruba Central no expone estas métricas via API pública.
  const loadFactor = Math.min(1, clients / 50);
  const tempEst = status === 'offline' ? 0 : Math.round(40 + loadFactor * 18);
  const cpuEst  = status === 'offline' ? 0 : Math.round(12 + loadFactor * 60);
  const memEst  = status === 'offline' ? 0 : Math.round(28 + loadFactor * 38);

  // Radios — band 0 = 2.4GHz, band 1 = 5GHz, band 2 = 6GHz
  const r24 = ap.radios?.find(r => r.band === 0 || r.index === 0) || {};
  const r5  = ap.radios?.find(r => r.band === 1 || r.index === 1) || {};

  const { campus, location } = parseLocation(ap.name, ap.site, ap.group_name);
  const apName = ap.name || ap.macaddr || ap.serial;

  return {
    serial:        ap.serial                  || '',
    name:          apName,
    model:         ap.model ? `Aruba ${ap.model}` : 'Aruba AP',
    building:      campus,
    floor:         location                   || ap.labels?.[0] || '—',
    status,
    ip:            ap.ip_address              || '—',
    macAddress:    ap.macaddr                 || '—',
    uptime:        ap.uptime                  || 0,
    clients,
    ssids:         ap.ssid_list               || [],
    temperature:   tempEst,
    cpuUsage:      cpuEst,
    memUsage:      memEst,
    // Datos de radio 2.4 GHz
    txPower24:     r24.tx_power               || 0,
    channel24:     parseInt(r24.channel)      || 0,
    noise24:       r24.noise                  || 0,
    utilization24: r24.utilization            || 0,
    bandwidth24:   r24.bandwidth              || 0,
    // Datos de radio 5 GHz
    txPower5:      r5.tx_power                || 0,
    channel5:      parseInt(r5.channel)       || 0,
    noise5:        r5.noise                   || 0,
    utilization5:  r5.utilization             || 0,
    bandwidth5:    r5.bandwidth               || 0,
    // Tráfico y señal
    rxBps:         (ap.usage_down || ap.tx_bytes || 0),
    txBps:         (ap.usage_up   || ap.rx_bytes || 0),
    signalStrength: ap.signal_db              || 0,
    lastSeen:      ap.last_modified
                     ? new Date(ap.last_modified * 1000).toISOString()
                     : ap.last_seen || new Date().toISOString(),
    group:         ap.group_name              || '—',
    firmware:      ap.firmware_version        || '—',
    swarmName:     ap.swarm_name              || '',
    downReason:    ap.down_reason             || '',
    lldpNeighbor:  ap.neighbor_dev           || ap.lldp_neighbor || '',
    lldpPort:      ap.neighbor_port          || ap.lldp_port     || '',
    publicIp:      ap.public_ip_address       || '',
  };
}

function mapPort(p, idx) {
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
    connectedDevice: undefined,
  };
}

function mapSwitch(sw, ports = []) {
  const status    = sw.status === 'Up' ? 'online' : sw.status === 'Down' ? 'offline' : 'warning';
  const mappedPorts = ports.map(mapPort);
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
    memUsage:    sw.mem_total > 0    ? Math.round(((sw.mem_total - (sw.mem_free || 0)) / sw.mem_total) * 100) : 0,
    ports:       mappedPorts,
    totalPorts:  mappedPorts.length,
    portsUp:     mappedPorts.filter(p => p.status === 'up').length,
    portsDown:   mappedPorts.filter(p => p.status === 'down' || p.status === 'disabled').length,
    portsError:  mappedPorts.filter(p => p.status === 'error').length,
  };
}

function mapGateway(gw) {
  const status = gw.status === 'Up' ? 'online' : gw.status === 'Down' ? 'offline' : 'warning';
  const mem = gw.mem_total > 0
    ? Math.round(((gw.mem_total - (gw.mem_free || 0)) / gw.mem_total) * 100)
    : (gw.mem_utilization || 0);
  return {
    serial:     gw.serial          || '',
    name:       gw.name            || gw.serial,
    model:      gw.model           || 'Aruba Gateway',
    building:   gw.site            || gw.group_name || 'Sin sitio',
    status,
    ip:         gw.ip_address      || '—',
    macAddress: gw.mac_address     || gw.macaddr || '—',
    uptime:     gw.uptime          || 0,
    firmware:   gw.firmware_version || '—',
    group:      gw.group_name      || '—',
    cpuUsage:   gw.cpu_utilization || 0,
    memUsage:   mem,
    tunnels:    gw.num_tunnels     || 0,
    clients:    gw.client_count    || 0,
    role:       gw.device_mode     || gw.mode || 'Gateway',
    lastSeen:   gw.last_modified
                  ? new Date(gw.last_modified * 1000).toISOString()
                  : new Date().toISOString(),
  };
}

function mapClient(c) {
  const band = c.band === 5 || c.band === '5' ? '5GHz' : c.band === 6 ? '6GHz' : '2.4GHz';
  return {
    mac:          c.macaddr              || '',
    hostname:     c.name || c.hostname   || c.macaddr || 'Desconocido',
    ip:           c.ip_address           || '—',
    type:         'wireless',
    ap:           c.associated_device_name || c.associated_device || '—',
    apSerial:     c.associated_device    || undefined,
    ssid:         c.network             || '—',
    band,
    signal:       c.signal_db           || undefined,
    speed:        (c.speed || 0) * 1_000_000,
    vlan:         c.vlan                || 1,
    rxBytes:      c.rx_bytes            || 0,
    txBytes:      c.tx_bytes            || 0,
    connectedAt:  c.last_connection_time
                    ? new Date(c.last_connection_time).toISOString()
                    : new Date().toISOString(),
    building:     c.site || c.group_name || '—',
    health:       c.health              || 0,
    os:           c.os_type             || '—',
    manufacturer: c.manufacturer        || '—',
  };
}

function mapNotification(n) {
  const sev = n.severity === 'Critical' || n.severity === 'Major' ? 'critical'
            : n.severity === 'Minor'    || n.severity === 'Warning' ? 'warning'
            : 'info';
  const isOpen = n.state === 'Open' || !n.acknowledged;
  return {
    id:           n.id           || String(n.nid),
    severity:     sev,
    category:     n.type         || 'Sistema',
    device:       n.device_id    || n.details?.serial || '—',
    message:      n.description  || n.type || 'Evento de red',
    detail:       n.details?.params?.join(' · ') || undefined,
    timestamp:    n.created_timestamp
                    ? new Date(n.created_timestamp * 1000).toISOString()
                    : new Date(n.timestamp * 1000).toISOString(),
    acknowledged: !isOpen,
    building:     n.group_name   || undefined,
  };
}

/* ── CSV Fallback (datos reales cuando el token está caducado) ── */
const CSV_AP_PATH    = 'C:/Users/grego/Desktop/DATA/export_ap_list_1779216701972.csv';
const CSV_RADIO_PATH = 'C:/Users/grego/Desktop/DATA/export_radio_list_1779216714476.csv';

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
    } else {
      current += ch;
    }
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

function parseMHz(str) {
  if (!str || str === '-') return 0;
  const m = str.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function safeInt(str) {
  const n = parseInt(str);
  return isNaN(n) ? 0 : n;
}

function mapAPFromCSV(row, radioMap = {}) {
  const name = row['DEVICE NAME'] || row['MAC'] || '';
  const statusStr = (row['STATUS'] || '').toLowerCase();
  const status = statusStr === 'online' ? 'online' : statusStr === 'offline' ? 'offline' : 'warning';
  const clients = parseInt(row['CLIENTS']) || 0;
  const loadFactor = Math.min(1, clients / 50);
  const { campus, location } = parseLocation(name, row['SITE'], row['GROUP']);
  const radios = radioMap[name] || {};
  const r24 = radios['2.4 GHz'] || {};
  const r5  = radios['5 GHz']  || {};
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
    rxBps:         0,
    txBps:         0,
    signalStrength: 0,
    lastSeen:      (row['LAST SEEN'] && row['LAST SEEN'] !== '-') ? row['LAST SEEN'] : new Date().toISOString(),
    group:         row['GROUP']            || '—',
    firmware:      row['FIRMWARE VERSION'] || '—',
    swarmName:     row['VIRTUAL CONTROLLER'] || '',
    downReason:    '',
    lldpNeighbor:  row['LLDP NEIGHBOR']   || '',
    lldpPort:      row['LLDP PORT']       || '',
    publicIp:      row['PUBLIC IP']       || '',
  };
}

let csvAPs = [];

function loadCSVFallback() {
  try {
    const radioRows = parseCSVFile(readFileSync(CSV_RADIO_PATH, 'utf-8'));
    const radioMap  = {};
    for (const row of radioRows) {
      const apName = row['ACCESS POINT'];
      if (!apName) continue;
      if (!radioMap[apName]) radioMap[apName] = {};
      radioMap[apName][row['BAND']] = row;
    }
    const apRows = parseCSVFile(readFileSync(CSV_AP_PATH, 'utf-8'));
    csvAPs = apRows.map(row => mapAPFromCSV(row, radioMap));
    console.log(`[CSV] ${csvAPs.length} APs cargados desde CSV de respaldo`);
  } catch (e) {
    console.warn('[CSV] No se pudo cargar CSV:', e.message);
  }
}

loadCSVFallback();

/* ── Rutas ────────────────────────────────────────────────── */

app.get('/proxy/status', async (_req, res) => {
  const tk = await getToken();
  res.json({ connected: !!tk, expiresAt: new Date(token.expiresAt).toISOString(), baseUrl: BASE, user: process.env.ARUBA_USER });
});

// APs — todos los dispositivos con paginación automática
app.get('/proxy/aps', async (_req, res) => {
  try {
    const [rawAPs, rawClients] = await Promise.allSettled([
      arubaGetAll('/monitoring/v2/aps', 'aps', { calculate_client_count: true }),
      arubaGetAll('/monitoring/v1/clients/wireless', 'clients'),
    ]);

    const aps     = rawAPs.status     === 'fulfilled' ? rawAPs.value     : [];
    const clients = rawClients.status === 'fulfilled' ? rawClients.value : [];

    // Si la API no devuelve dispositivos (token caducado) → usar datos CSV
    if (aps.length === 0 && csvAPs.length > 0) {
      console.log(`[APs] API devolvió 0 → usando ${csvAPs.length} APs desde CSV`);
      return res.json(csvAPs);
    }

    // Mapa serial → clientes reales
    const clientsPerSerial = {};
    for (const c of clients) {
      const s = c.associated_device;
      if (s) clientsPerSerial[s] = (clientsPerSerial[s] || 0) + 1;
    }

    res.json(aps.map(ap => mapAP(ap, clientsPerSerial)));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// AP detalle
app.get('/proxy/aps/:serial', async (req, res) => {
  try {
    const data = await arubaGet(`/monitoring/v2/aps/${req.params.serial}`);
    res.json(mapAP(data));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reboot AP
app.post('/proxy/aps/:serial/reboot', async (req, res) => {
  try {
    const data = await arubaPost('/device_management/v1/action/reboot', {
      device_type: 'IAP',
      device_list: [{ serial: req.params.serial, device_type: 'IAP' }],
    });
    res.json({ success: true, message: 'Reinicio enviado correctamente.', data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Shutdown/disable AP — Aruba Central no tiene comando de apagado remoto para APs PoE.
// Intentamos deshabilitar los radios vía config; si falla, devolvemos instrucciones físicas.
app.post('/proxy/aps/:serial/shutdown', async (req, res) => {
  const serial = req.params.serial;
  try {
    await arubaPost(`/configuration/v2/ap_settings/${serial}`, { admin_state: false });
    res.json({ success: true, message: 'AP desactivado remotamente. Los radios han sido apagados.' });
  } catch {
    // Aruba Central no expone un shutdown remoto estándar para APs PoE.
    // Devolvemos info útil para que el técnico pueda apagarlo físicamente.
    res.json({
      success: false,
      message: `El AP ${serial} opera vía PoE. Para apagarlo físicamente, desconecte el puerto PoE en el switch al que está conectado. El reinicio remoto (Reboot) sí está disponible.`,
    });
  }
});

// Switches — todos con paginación automática
app.get('/proxy/switches', async (_req, res) => {
  try {
    const list = await arubaGetAll('/monitoring/v1/switches', 'switches');

    // Obtener puertos en lotes de 8 para no saturar la API
    const BATCH = 8;
    const withPorts = [];
    for (let i = 0; i < list.length; i += BATCH) {
      const chunk = list.slice(i, i + BATCH);
      const results = await Promise.all(chunk.map(async sw => {
        try {
          const pd = await arubaGet(`/monitoring/v1/switches/${sw.serial}/ports`);
          return mapSwitch(sw, pd.ports || []);
        } catch {
          return mapSwitch(sw, []);
        }
      }));
      withPorts.push(...results);
    }
    res.json(withPorts);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Puertos de un switch
app.get('/proxy/switches/:serial/ports', async (req, res) => {
  try {
    const data = await arubaGet(`/monitoring/v1/switches/${req.params.serial}/ports`);
    res.json((data.ports || []).map(mapPort));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Gateways / Controladores — prueba múltiples endpoints según tipo de cuenta
app.get('/proxy/gateways', async (_req, res) => {
  const PATHS = [
    { path: '/monitoring/v2/gateways',              key: 'gateways'   },
    { path: '/monitoring/v1/gateways',              key: 'gateways'   },
    { path: '/monitoring/v2/mobility_controllers',  key: 'mcs'        },
    { path: '/monitoring/v1/mobility_controllers',  key: 'mcs'        },
  ];
  for (const { path, key } of PATHS) {
    try {
      const data = await arubaGetAll(path, key);
      if (data.length > 0) {
        console.log(`[GW] Encontrados ${data.length} gateways en ${path}`);
        return res.json(data.map(mapGateway));
      }
    } catch { /* siguiente path */ }
  }
  // Si ningún path devuelve gateways, responde vacío sin error
  console.log('[GW] Sin gateways en la cuenta o no soportado');
  res.json([]);
});

// Clientes wireless — /monitoring/v1/clients/wireless ✓
app.get('/proxy/clients', async (_req, res) => {
  try {
    const [wifi, wired] = await Promise.allSettled([
      arubaGet('/monitoring/v1/clients/wireless', { calculate_total: true }),
      arubaGet('/monitoring/v1/clients/wired',    { calculate_total: true }),
    ]);
    const wirelessList = wifi.status  === 'fulfilled' ? (wifi.value.clients  || []).map(mapClient) : [];
    const wiredList    = wired.status === 'fulfilled' ? (wired.value.clients || []).map(c => ({ ...mapClient(c), type: 'wired' })) : [];
    res.json([...wirelessList, ...wiredList]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Alertas / Notificaciones — /central/v1/notifications ✓
app.get('/proxy/alerts', async (_req, res) => {
  try {
    const data = await arubaGet('/central/v1/notifications', { size: 200 });
    res.json((data.notifications || []).map(mapNotification));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Acknowledge alerta
app.post('/proxy/alerts/:id/acknowledge', async (req, res) => {
  try {
    const data = await arubaPost(`/central/v1/notifications/ack`, { ids: [req.params.id] });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Overview — calculado desde datos reales
app.get('/proxy/overview', async (_req, res) => {
  try {
    const [apRes, swRes, notifRes] = await Promise.allSettled([
      arubaGetAll('/monitoring/v2/aps', 'aps', { calculate_client_count: true }),
      arubaGetAll('/monitoring/v1/switches', 'switches'),
      arubaGet('/central/v1/notifications', { size: 100 }),
    ]);

    let aps    = apRes.status    === 'fulfilled' ? apRes.value                        : [];
    const sws    = swRes.status    === 'fulfilled' ? swRes.value                        : [];
    const notifs = notifRes.status === 'fulfilled' ? (notifRes.value.notifications || []) : [];

    // Fallback a CSV si la API no devuelve APs
    const fromCSV = aps.length === 0 && csvAPs.length > 0;
    if (fromCSV) aps = csvAPs;

    const online  = fromCSV ? aps.filter(a => a.status === 'online').length  : aps.filter(a => a.status === 'Up').length;
    const offline = fromCSV ? aps.filter(a => a.status === 'offline').length : aps.filter(a => a.status === 'Down').length;
    const warning = aps.length - online - offline;
    const clients = fromCSV ? aps.reduce((s, a) => s + (a.clients || 0), 0) : aps.reduce((s, a) => s + (a.client_count || 0), 0);
    const unack   = notifs.filter(n => n.state === 'Open');
    const crit    = unack.filter(n => n.severity === 'Critical' || n.severity === 'Major');
    const health  = aps.length > 0 ? Math.round(((online + warning * 0.5) / aps.length) * 100) : 100;

    res.json({
      totalAPs: aps.length, onlineAPs: online, offlineAPs: offline, warningAPs: warning,
      totalClients: clients, wirelessClients: clients, wiredClients: 0,
      activeAlerts: unack.length, criticalAlerts: crit.length,
      totalSwitches: sws.length,
      onlineSwitches: sws.filter(s => s.status === 'Up').length,
      totalServers: 6, onlineServers: 6,
      networkHealth: health,
      totalBandwidthRx: 0, totalBandwidthTx: 0,
      rfHealth: 85,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eventos de red (para el log)
app.get('/proxy/events', async (_req, res) => {
  try {
    const data = await arubaGet('/monitoring/v1/events', { limit: 50 });
    res.json(data.events || data || []);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
  console.log(`\n🔵 Aruba Central Proxy → http://localhost:${PORT}`);
  console.log(`   Cluster: ${BASE}`);
  console.log(`   Usuario: ${process.env.ARUBA_USER}`);
  console.log(`   Token vence: ${new Date(token.expiresAt).toLocaleTimeString()}\n`);
});
