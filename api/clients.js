import { arubaGet, mapClient, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const [wifi, wired] = await Promise.allSettled([
      arubaGet('/monitoring/v1/clients/wireless', { calculate_total: true }),
      arubaGet('/monitoring/v1/clients/wired',    { calculate_total: true }),
    ]);
    const wirelessList = wifi.status  === 'fulfilled' ? (wifi.value.clients  || []).map(mapClient) : [];
    const wiredList    = wired.status === 'fulfilled' ? (wired.value.clients || []).map(c => ({ ...mapClient(c), type: 'wired' })) : [];
    res.json([...wirelessList, ...wiredList]);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
