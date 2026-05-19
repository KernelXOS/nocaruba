import { arubaGetAll, mapAP, loadCSVAPs, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [rawAPs, rawClients] = await Promise.allSettled([
      arubaGetAll('/monitoring/v2/aps', 'aps', { calculate_client_count: true }),
      arubaGetAll('/monitoring/v1/clients/wireless', 'clients'),
    ]);
    const aps     = rawAPs.status     === 'fulfilled' ? rawAPs.value     : [];
    const clients = rawClients.status === 'fulfilled' ? rawClients.value : [];

    if (aps.length === 0) {
      const csv = loadCSVAPs();
      if (csv.length > 0) return res.json(csv);
    }

    const clientsPerSerial = {};
    for (const c of clients) {
      const s = c.associated_device;
      if (s) clientsPerSerial[s] = (clientsPerSerial[s] || 0) + 1;
    }
    res.json(aps.map(ap => mapAP(ap, clientsPerSerial)));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
