import { arubaPost, setCors } from '../../_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const { serial } = req.query;
  try {
    const data = await arubaPost('/device_management/v1/action/reboot', {
      device_type: 'IAP',
      device_list: [{ serial, device_type: 'IAP' }],
    });
    res.json({ success: true, message: 'Reinicio enviado correctamente.', data });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
