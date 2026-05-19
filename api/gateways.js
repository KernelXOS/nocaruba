import { arubaGetAll, mapGateway, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();
  const PATHS = [
    { path: '/monitoring/v2/gateways',             key: 'gateways' },
    { path: '/monitoring/v1/gateways',             key: 'gateways' },
    { path: '/monitoring/v2/mobility_controllers', key: 'mcs'      },
    { path: '/monitoring/v1/mobility_controllers', key: 'mcs'      },
  ];
  for (const { path, key } of PATHS) {
    try {
      const data = await arubaGetAll(path, key);
      if (data.length > 0) return res.json(data.map(mapGateway));
    } catch { /* try next */ }
  }
  res.json([]);
}
