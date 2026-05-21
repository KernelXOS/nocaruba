import { arubaGet, mapClient, setCors } from './_lib.js';

function extractClients(data) {
  if (!data) return [];
  if (Array.isArray(data))             return data;
  if (Array.isArray(data.clients))     return data.clients;
  if (Array.isArray(data.client_list)) return data.client_list;
  return [];
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [wifi, wired] = await Promise.allSettled([
      arubaGet('/monitoring/v1/clients/wireless', { calculate_total: true, limit: 1000 }),
      arubaGet('/monitoring/v1/clients/wired',    { calculate_total: true, limit: 1000 }),
    ]);
    const wirelessList = wifi.status  === 'fulfilled' ? extractClients(wifi.value).map(mapClient)                              : [];
    const wiredList    = wired.status === 'fulfilled' ? extractClients(wired.value).map(c => ({ ...mapClient(c), type: 'wired' })) : [];
    res.json([...wirelessList, ...wiredList]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
