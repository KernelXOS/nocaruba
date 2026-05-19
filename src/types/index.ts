export type DeviceStatus = 'online' | 'offline' | 'warning' | 'rebooting';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type PortStatus = 'up' | 'down' | 'error' | 'disabled';

export interface AccessPoint {
  serial: string; name: string; model: string;
  building: string; floor: string; status: DeviceStatus;
  ip: string; macAddress: string; uptime: number;
  clients: number; ssids: string[]; temperature: number;
  cpuUsage: number; memUsage: number;
  // Radio 2.4 GHz
  txPower24: number; channel24: number; noise24: number;
  utilization24?: number; bandwidth24?: number;
  // Radio 5 GHz
  txPower5: number; channel5: number; noise5: number;
  utilization5?: number; bandwidth5?: number;
  // Traffic & signal
  rxBps: number; txBps: number; signalStrength: number;
  lastSeen: string; group: string; firmware: string;
  swarmName?: string; downReason?: string;
  lldpNeighbor?: string; lldpPort?: string; publicIp?: string;
}

export interface SwitchPort {
  portId: string; name: string; status: PortStatus;
  speed: number; duplex: string; vlan: number;
  poe: boolean; poeWatts: number;
  rxBytes: number; txBytes: number;
  errors: number; description: string;
  connectedDevice?: string;
}

export interface NetworkSwitch {
  serial: string; name: string; model: string;
  building: string; status: DeviceStatus;
  ip: string; uptime: number; firmware: string;
  temperature: number; cpuUsage: number; memUsage: number;
  ports: SwitchPort[];
  totalPorts: number; portsUp: number; portsDown: number; portsError: number;
}

export interface Server {
  id: string; name: string; role: string;
  ip: string; os: string; status: DeviceStatus;
  cpuUsage: number; memUsage: number; diskUsage: number;
  temperature: number; uptime: number;
  services: { name: string; status: 'running' | 'stopped' | 'warning' }[];
}

export interface Client {
  mac: string; hostname: string; ip: string;
  type: 'wireless' | 'wired';
  ap?: string; apSerial?: string;
  ssid?: string; band?: '2.4GHz' | '5GHz' | '6GHz';
  signal?: number; speed: number; vlan: number;
  rxBytes: number; txBytes: number;
  connectedAt: string; building?: string;
}

export interface Alert {
  id: string; severity: AlertSeverity; category: string;
  device: string; message: string; detail?: string;
  timestamp: string; acknowledged: boolean; building?: string;
}

export interface BandwidthPoint { time: string; rx: number; tx: number; }

export interface Gateway {
  serial: string; name: string; model: string;
  building: string; status: DeviceStatus;
  ip: string; macAddress: string; uptime: number;
  firmware: string; group: string;
  cpuUsage: number; memUsage: number;
  tunnels: number; clients: number;
  role: string; lastSeen: string;
}

export interface NetworkOverview {
  totalAPs: number; onlineAPs: number; offlineAPs: number; warningAPs: number;
  totalClients: number; wirelessClients: number; wiredClients: number;
  activeAlerts: number; criticalAlerts: number;
  totalSwitches: number; onlineSwitches: number;
  totalServers: number; onlineServers: number;
  networkHealth: number; totalBandwidthRx: number; totalBandwidthTx: number;
  rfHealth: number;
}
