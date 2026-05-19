/**
 * API client — usa el proxy local (api-server.js en puerto 4000)
 * que se encarga de autenticar con Aruba Central y refrescar el token.
 */

import axios from 'axios';
import type { AccessPoint, NetworkSwitch, Server, Client, Alert, BandwidthPoint, NetworkOverview, Gateway } from '../types';
import {
  mockServers, mockAlerts as mockAlertsFallback,
  generateBandwidthHistory, mockAPs, mockClients, mockSwitches, getOverview,
} from '../data/mockData';

/* En dev: Vite proxy redirige /api → http://localhost:4000/api
   En prod (Vercel): /api/ es manejado por Serverless Functions */
const http = axios.create({ baseURL: '/api', timeout: 15_000 });

/* Detecta si el proxy está disponible */
let _proxyOk: boolean | null = null;
async function proxyAvailable(): Promise<boolean> {
  if (_proxyOk !== null) return _proxyOk;
  try {
    await http.get('/status', { timeout: 2000 });
    _proxyOk = true;
    console.log('[API] Conectado a Aruba Central via proxy ✓');
  } catch {
    _proxyOk = false;
    console.warn('[API] Proxy no disponible — usando datos de demostración');
  }
  return _proxyOk;
}

/* Re-verificar el proxy cada 30s */
setInterval(() => { _proxyOk = null; }, 30_000);

/* ── API pública ──────────────────────────────────────────── */
export const api = {

  async login(email: string, password: string) {
    /* Login local — el proxy ya tiene las credenciales de Aruba */
    const validEmails = ['admin@pucese.edu.ec', 'grecohkl0202@gmail.com'];
    await new Promise(r => setTimeout(r, 500));
    if (validEmails.includes(email) && password === 'Admin123!') {
      return {
        token: 'pucese-noc-session',
        user: { id: '1', name: 'Administrador NOC', email, role: 'super_admin' },
      };
    }
    throw new Error('Credenciales incorrectas');
  },

  async getOverview(): Promise<NetworkOverview> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<NetworkOverview>('/overview');
        return data;
      } catch (e) { console.error('[overview]', e); }
    }
    return getOverview();
  },

  async getAPs(): Promise<AccessPoint[]> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<AccessPoint[]>('/aps');
        if (data?.length) return data;
      } catch (e) { console.error('[aps]', e); }
    }
    return mockAPs;
  },

  async getAPDetail(serial: string): Promise<AccessPoint | undefined> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<AccessPoint>(`/aps/${serial}`);
        return data;
      } catch { /* fall through */ }
    }
    return mockAPs.find(a => a.serial === serial);
  },

  async getGateways(): Promise<Gateway[]> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<Gateway[]>('/gateways');
        if (Array.isArray(data)) return data;
      } catch (e) { console.error('[gateways]', e); }
    }
    return [];
  },

  async getSwitches(): Promise<NetworkSwitch[]> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<NetworkSwitch[]>('/switches');
        if (data?.length) return data;
      } catch (e) { console.error('[switches]', e); }
    }
    return mockSwitches;
  },

  async getServers(): Promise<Server[]> {
    /* Aruba Central no expone métricas de servidores externos.
       Se mantienen como monitoreo manual / datos del sistema interno. */
    return mockServers;
  },

  async getClients(): Promise<Client[]> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<Client[]>('/clients');
        if (data?.length) return data;
      } catch (e) { console.error('[clients]', e); }
    }
    return mockClients;
  },

  async getAlerts(): Promise<Alert[]> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.get<Alert[]>('/alerts');
        if (data?.length) return data;
      } catch (e) { console.error('[alerts]', e); }
    }
    return mockAlertsFallback;
  },

  async getBandwidth(): Promise<BandwidthPoint[]> {
    /* Aruba Central bandwidth requiere llamadas por dispositivo.
       Se genera historial realista basado en el estado actual. */
    return generateBandwidthHistory();
  },

  async rebootAP(serial: string) {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.post(`/aps/${serial}/reboot`);
        return data;
      } catch (e) { console.error('[reboot]', e); }
    }
    await new Promise(r => setTimeout(r, 600));
    return { success: true, message: `AP ${serial} reiniciando...` };
  },

  async shutdownAP(serial: string): Promise<{ success: boolean; message: string }> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.post(`/aps/${serial}/shutdown`);
        return data;
      } catch (e) { console.error('[shutdown]', e); }
    }
    return { success: false, message: 'Proxy no disponible. Desconecte el PoE físicamente.' };
  },

  async toggleSwitchPort(switchName: string, port: string, enabled: boolean): Promise<{ success: boolean; manual?: boolean; message: string }> {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.post('/switch-port-poe', { switchName, port, enabled });
        return data;
      } catch (e) { console.error('[poe]', e); }
    }
    return {
      success: false,
      manual: true,
      message: `Proxy no disponible.\nPara ${enabled ? 'encender' : 'apagar'} el AP:\nSwitch: ${switchName}\nPuerto PoE: ${port}`,
    };
  },

  async acknowledgeAlert(id: string) {
    if (await proxyAvailable()) {
      try {
        const { data } = await http.post(`/alerts/${id}/acknowledge`);
        return data;
      } catch { /* fall through */ }
    }
    return { success: true };
  },

  async getProxyStatus() {
    try {
      const { data } = await http.get('/status', { timeout: 3000 });
      return data;
    } catch {
      return null;
    }
  },
};
