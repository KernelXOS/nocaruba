import { arubaPost, setCors } from '../../_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const { id } = req.query;
  try {
    const data = await arubaPost('/central/v1/notifications/ack', { ids: [id] });
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
