import { arubaGet, mapNotification, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const data = await arubaGet('/central/v1/notifications', { size: 200 });
    res.json((data.notifications || []).map(mapNotification));
  } catch (e) { res.status(500).json({ error: e.message }); }
}
