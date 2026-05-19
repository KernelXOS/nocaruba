import { arubaPost, setCors } from '../../_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  const { serial } = req.query;
  try {
    await arubaPost(`/configuration/v2/ap_settings/${serial}`, { admin_state: false });
    res.json({ success: true, message: 'AP desactivado remotamente.' });
  } catch {
    res.json({
      success: false,
      message: `El AP ${serial} opera vía PoE. Para apagarlo físicamente, desconecte el puerto PoE en el switch. El reinicio remoto (Reboot) sí está disponible.`,
    });
  }
}
