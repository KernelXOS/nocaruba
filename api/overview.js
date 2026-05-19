import { arubaGetAll, arubaGet, loadCSVAPs, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [apRes, swRes, notifRes] = await Promise.allSettled([
      arubaGetAll('/monitoring/v2/aps', 'aps', { calculate_client_count: true }),
      arubaGetAll('/monitoring/v1/switches', 'switches'),
      arubaGet('/central/v1/notifications', { size: 100 }),
    ]);

    let aps    = apRes.status    === 'fulfilled' ? apRes.value : [];
    const sws  = swRes.status    === 'fulfilled' ? swRes.value : [];
    const notifs = notifRes.status === 'fulfilled' ? (notifRes.value.notifications || []) : [];

    const fromCSV = aps.length === 0;
    if (fromCSV) aps = loadCSVAPs();

    const online  = fromCSV ? aps.filter(a => a.status === 'online').length  : aps.filter(a => a.status === 'Up').length;
    const offline = fromCSV ? aps.filter(a => a.status === 'offline').length : aps.filter(a => a.status === 'Down').length;
    const warning = aps.length - online - offline;
    const clients = fromCSV
      ? aps.reduce((s, a) => s + (a.clients || 0), 0)
      : aps.reduce((s, a) => s + (a.client_count || 0), 0);
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
}
