import { arubaGetAll, arubaGet, mapSwitch, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const list = await arubaGetAll('/monitoring/v1/switches', 'switches');
    const BATCH = 8;
    const withPorts = [];
    for (let i = 0; i < list.length; i += BATCH) {
      const chunk   = list.slice(i, i + BATCH);
      const results = await Promise.all(chunk.map(async sw => {
        try {
          const pd = await arubaGet(`/monitoring/v1/switches/${sw.serial}/ports`);
          return mapSwitch(sw, pd.ports || []);
        } catch { return mapSwitch(sw, []); }
      }));
      withPorts.push(...results);
    }
    res.json(withPorts);
  } catch (e) { res.status(500).json({ error: e.message }); }
}
