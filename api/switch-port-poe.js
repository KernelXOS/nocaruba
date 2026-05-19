import { arubaGetAll, arubaPut, setCors } from './_lib.js';

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { switchName, port, enabled } = req.body;
  const action = enabled ? 'encender' : 'apagar';
  const state  = enabled ? 'Up' : 'Down';

  // Paso 1: buscar el serial del switch por nombre
  let switchSerial = null;
  try {
    const switches = await arubaGetAll('/monitoring/v1/switches', 'switches');
    const sw = switches.find(s =>
      s.name && switchName && (
        s.name.toLowerCase() === switchName.toLowerCase() ||
        s.name.toLowerCase().includes(switchName.toLowerCase()) ||
        switchName.toLowerCase().includes(s.name.toLowerCase())
      )
    );
    if (sw) switchSerial = sw.serial;
  } catch { /* token vencido — continuamos sin serial */ }

  if (!switchSerial) {
    return res.json({
      success: false,
      manual:  true,
      message: `Token vencido — no se pudo obtener el serial del switch.\n\nPara ${action} el AP manualmente:\nSwitch: ${switchName || 'Ver LLDP'}\nPuerto PoE: ${port}\n\nEn CLI: interface ${port} → ${enabled ? 'no shutdown' : 'shutdown'}`,
    });
  }

  // Paso 2: intentar controlar el puerto con múltiples endpoints Aruba
  const enc = port.replace(/\//g, '%2F');
  const PATHS = [
    `/configuration/v1/switch/${switchSerial}/ports/${enc}`,
    `/configuration/v2/switch/${switchSerial}/ports/${enc}`,
    `/configuration/v1/switch/${switchSerial}/port/${enc}`,
  ];

  for (const apiPath of PATHS) {
    try {
      await arubaPut(apiPath, { admin_state: state, poe_enabled: enabled });
      return res.json({
        success: true,
        message: enabled
          ? `Puerto PoE ${port} habilitado en ${switchName}. El AP se encenderá en ~2 minutos.`
          : `Puerto PoE ${port} deshabilitado en ${switchName}. El AP se apagará en segundos.`,
      });
    } catch { /* siguiente path */ }
  }

  res.json({
    success: false,
    manual:  true,
    message: `API no pudo controlar el puerto (switch puede ser no compatible).\n\nPara ${action} el AP:\nSwitch: ${switchName}\nPuerto PoE: ${port}`,
  });
}
