import type {
  AccessPoint, NetworkSwitch, Server,
  Client, Alert, BandwidthPoint, NetworkOverview,
} from '../types';

/* ─── Access Points ─────────────────────────────────────────── */
export const mockAPs: AccessPoint[] = [
  { serial:'AP-EP-1F-01', name:'AP-EdifPrincipal-PB-01', model:'Aruba AP-535', building:'Edificio Principal', floor:'Planta Baja', status:'online', ip:'10.10.1.11', macAddress:'00:1a:1e:aa:01:11', uptime:864000, clients:28, ssids:['PUCESE-Estudiantes','PUCESE-Docentes','eduroam'], temperature:48, cpuUsage:34, memUsage:52, txPower24:20, txPower5:23, channel24:6, channel5:36, noise24:-95, noise5:-98, rxBps:4200000, txBps:2100000, signalStrength:-58, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-EP-1F-02', name:'AP-EdifPrincipal-PB-02', model:'Aruba AP-535', building:'Edificio Principal', floor:'Planta Baja', status:'online', ip:'10.10.1.12', macAddress:'00:1a:1e:aa:01:12', uptime:864000, clients:31, ssids:['PUCESE-Estudiantes','PUCESE-Docentes','eduroam'], temperature:51, cpuUsage:41, memUsage:58, txPower24:20, txPower5:23, channel24:11, channel5:48, noise24:-95, noise5:-98, rxBps:5100000, txBps:2800000, signalStrength:-61, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-EP-2F-01', name:'AP-EdifPrincipal-P2-01', model:'Aruba AP-535', building:'Edificio Principal', floor:'Segundo Piso', status:'online', ip:'10.10.1.13', macAddress:'00:1a:1e:aa:01:13', uptime:432000, clients:22, ssids:['PUCESE-Estudiantes','PUCESE-Docentes'], temperature:46, cpuUsage:28, memUsage:44, txPower24:20, txPower5:23, channel24:1, channel5:44, noise24:-96, noise5:-99, rxBps:2800000, txBps:1400000, signalStrength:-55, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-EP-2F-02', name:'AP-EdifPrincipal-P2-02', model:'Aruba AP-505', building:'Edificio Principal', floor:'Segundo Piso', status:'warning', ip:'10.10.1.14', macAddress:'00:1a:1e:aa:01:14', uptime:86400, clients:18, ssids:['PUCESE-Estudiantes'], temperature:67, cpuUsage:78, memUsage:82, txPower24:18, txPower5:20, channel24:6, channel5:149, noise24:-90, noise5:-92, rxBps:1800000, txBps:900000, signalStrength:-68, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.10.0.0' },
  { serial:'AP-ED-1F-01', name:'AP-Docentes-PB-01', model:'Aruba AP-635', building:'Edificio Docentes', floor:'Planta Baja', status:'online', ip:'10.10.2.11', macAddress:'00:1a:1e:aa:02:11', uptime:1728000, clients:12, ssids:['PUCESE-Docentes','PUCESE-Admin'], temperature:44, cpuUsage:22, memUsage:38, txPower24:20, txPower5:23, channel24:1, channel5:36, noise24:-97, noise5:-99, rxBps:1200000, txBps:600000, signalStrength:-52, lastSeen:new Date().toISOString(), group:'PUCESE-Docentes', firmware:'8.11.2.0' },
  { serial:'AP-ED-2F-01', name:'AP-Docentes-P2-01', model:'Aruba AP-635', building:'Edificio Docentes', floor:'Segundo Piso', status:'online', ip:'10.10.2.12', macAddress:'00:1a:1e:aa:02:12', uptime:1728000, clients:9, ssids:['PUCESE-Docentes','PUCESE-Admin'], temperature:43, cpuUsage:19, memUsage:35, txPower24:20, txPower5:23, channel24:11, channel5:149, noise24:-97, noise5:-99, rxBps:900000, txBps:450000, signalStrength:-49, lastSeen:new Date().toISOString(), group:'PUCESE-Docentes', firmware:'8.11.2.0' },
  { serial:'AP-BC-1F-01', name:'AP-Biblioteca-PB-01', model:'Aruba AP-535', building:'Biblioteca Central', floor:'Planta Baja', status:'online', ip:'10.10.3.11', macAddress:'00:1a:1e:aa:03:11', uptime:1296000, clients:35, ssids:['PUCESE-Estudiantes','eduroam'], temperature:53, cpuUsage:45, memUsage:61, txPower24:20, txPower5:23, channel24:6, channel5:40, noise24:-94, noise5:-97, rxBps:6200000, txBps:3100000, signalStrength:-62, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-BC-2F-01', name:'AP-Biblioteca-P2-01', model:'Aruba AP-535', building:'Biblioteca Central', floor:'Segundo Piso', status:'online', ip:'10.10.3.12', macAddress:'00:1a:1e:aa:03:12', uptime:1296000, clients:41, ssids:['PUCESE-Estudiantes','eduroam'], temperature:55, cpuUsage:52, memUsage:68, txPower24:20, txPower5:23, channel24:1, channel5:44, noise24:-93, noise5:-96, rxBps:7800000, txBps:3900000, signalStrength:-60, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-LS-1F-01', name:'AP-LabSistemas-PB-01', model:'Aruba AP-515', building:'Lab. Sistemas', floor:'Planta Baja', status:'online', ip:'10.10.4.11', macAddress:'00:1a:1e:aa:04:11', uptime:691200, clients:44, ssids:['PUCESE-Estudiantes','PUCESE-Lab'], temperature:58, cpuUsage:62, memUsage:71, txPower24:20, txPower5:23, channel24:11, channel5:36, noise24:-92, noise5:-95, rxBps:9600000, txBps:4800000, signalStrength:-64, lastSeen:new Date().toISOString(), group:'PUCESE-Labs', firmware:'8.11.2.0' },
  { serial:'AP-LS-1F-02', name:'AP-LabSistemas-PB-02', model:'Aruba AP-515', building:'Lab. Sistemas', floor:'Planta Baja', status:'online', ip:'10.10.4.12', macAddress:'00:1a:1e:aa:04:12', uptime:691200, clients:38, ssids:['PUCESE-Estudiantes','PUCESE-Lab'], temperature:56, cpuUsage:55, memUsage:66, txPower24:20, txPower5:23, channel24:6, channel5:44, noise24:-92, noise5:-95, rxBps:8500000, txBps:4250000, signalStrength:-61, lastSeen:new Date().toISOString(), group:'PUCESE-Labs', firmware:'8.11.2.0' },
  { serial:'AP-LI-1F-01', name:'AP-LabIdiomas-PB-01', model:'Aruba AP-515', building:'Lab. Idiomas', floor:'Planta Baja', status:'offline', ip:'10.10.5.11', macAddress:'00:1a:1e:aa:05:11', uptime:0, clients:0, ssids:[], temperature:0, cpuUsage:0, memUsage:0, txPower24:0, txPower5:0, channel24:0, channel5:0, noise24:0, noise5:0, rxBps:0, txBps:0, signalStrength:0, lastSeen:new Date(Date.now()-3600000).toISOString(), group:'PUCESE-Labs', firmware:'8.10.0.0' },
  { serial:'AP-AUD-1F-01', name:'AP-Auditorio-PB-01', model:'Aruba AP-655', building:'Auditorio', floor:'Planta Baja', status:'online', ip:'10.10.6.11', macAddress:'00:1a:1e:aa:06:11', uptime:2592000, clients:8, ssids:['PUCESE-Eventos','PUCESE-Docentes'], temperature:41, cpuUsage:15, memUsage:28, txPower24:20, txPower5:23, channel24:1, channel5:149, noise24:-98, noise5:-100, rxBps:580000, txBps:290000, signalStrength:-48, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-REC-1F-01', name:'AP-Rectorado-PB-01', model:'Aruba AP-535', building:'Rectorado', floor:'Planta Baja', status:'online', ip:'10.10.7.11', macAddress:'00:1a:1e:aa:07:11', uptime:3456000, clients:7, ssids:['PUCESE-Admin','PUCESE-Docentes'], temperature:42, cpuUsage:18, memUsage:32, txPower24:20, txPower5:23, channel24:11, channel5:36, noise24:-97, noise5:-100, rxBps:500000, txBps:250000, signalStrength:-50, lastSeen:new Date().toISOString(), group:'PUCESE-Admin', firmware:'8.11.2.0' },
  { serial:'AP-CAF-1F-01', name:'AP-Cafeteria-PB-01', model:'Aruba AP-305', building:'Cafetería', floor:'Planta Baja', status:'warning', ip:'10.10.8.11', macAddress:'00:1a:1e:aa:08:11', uptime:172800, clients:26, ssids:['PUCESE-Estudiantes'], temperature:63, cpuUsage:71, memUsage:78, txPower24:17, txPower5:20, channel24:6, channel5:48, noise24:-88, noise5:-90, rxBps:3300000, txBps:1650000, signalStrength:-72, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.9.0.0' },
  { serial:'AP-CEL-1F-01', name:'AP-CentroEst-PB-01', model:'Aruba AP-535', building:'Centro Estudiantil', floor:'Planta Baja', status:'online', ip:'10.10.9.11', macAddress:'00:1a:1e:aa:09:11', uptime:777600, clients:29, ssids:['PUCESE-Estudiantes','eduroam'], temperature:49, cpuUsage:38, memUsage:55, txPower24:20, txPower5:23, channel24:1, channel5:40, noise24:-95, noise5:-97, rxBps:4000000, txBps:2000000, signalStrength:-59, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-CEL-2F-01', name:'AP-CentroEst-P2-01', model:'Aruba AP-535', building:'Centro Estudiantil', floor:'Segundo Piso', status:'online', ip:'10.10.9.12', macAddress:'00:1a:1e:aa:09:12', uptime:777600, clients:33, ssids:['PUCESE-Estudiantes','eduroam'], temperature:50, cpuUsage:42, memUsage:57, txPower24:20, txPower5:23, channel24:6, channel5:44, noise24:-94, noise5:-97, rxBps:4600000, txBps:2300000, signalStrength:-61, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-GIM-1F-01', name:'AP-Gimnasio-PB-01', model:'Aruba AP-305', building:'Gimnasio', floor:'Planta Baja', status:'online', ip:'10.10.10.11', macAddress:'00:1a:1e:aa:0a:11', uptime:518400, clients:14, ssids:['PUCESE-Estudiantes'], temperature:45, cpuUsage:25, memUsage:40, txPower24:20, txPower5:20, channel24:11, channel5:44, noise24:-95, noise5:-97, rxBps:1500000, txBps:750000, signalStrength:-55, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.11.2.0' },
  { serial:'AP-LAB2-1F-01', name:'AP-LabComp2-PB-01', model:'Aruba AP-515', building:'Lab. Computación 2', floor:'Planta Baja', status:'online', ip:'10.10.11.11', macAddress:'00:1a:1e:aa:0b:11', uptime:345600, clients:36, ssids:['PUCESE-Estudiantes','PUCESE-Lab'], temperature:54, cpuUsage:58, memUsage:65, txPower24:20, txPower5:23, channel24:1, channel5:36, noise24:-93, noise5:-95, rxBps:8200000, txBps:4100000, signalStrength:-62, lastSeen:new Date().toISOString(), group:'PUCESE-Labs', firmware:'8.11.2.0' },
  { serial:'AP-ADM-1F-01', name:'AP-Admin-PB-01', model:'Aruba AP-535', building:'Edificio Admin.', floor:'Planta Baja', status:'online', ip:'10.10.12.11', macAddress:'00:1a:1e:aa:0c:11', uptime:1080000, clients:11, ssids:['PUCESE-Admin','PUCESE-Docentes'], temperature:43, cpuUsage:20, memUsage:36, txPower24:20, txPower5:23, channel24:6, channel5:48, noise24:-97, noise5:-99, rxBps:950000, txBps:475000, signalStrength:-51, lastSeen:new Date().toISOString(), group:'PUCESE-Admin', firmware:'8.11.2.0' },
  { serial:'AP-MED-1F-01', name:'AP-Medicina-PB-01', model:'Aruba AP-535', building:'Facultad Medicina', floor:'Planta Baja', status:'warning', ip:'10.10.13.11', macAddress:'00:1a:1e:aa:0d:11', uptime:259200, clients:21, ssids:['PUCESE-Estudiantes','eduroam'], temperature:61, cpuUsage:65, memUsage:74, txPower24:18, txPower5:21, channel24:11, channel5:40, noise24:-89, noise5:-91, rxBps:2800000, txBps:1400000, signalStrength:-66, lastSeen:new Date().toISOString(), group:'PUCESE-WiFi', firmware:'8.10.0.0' },
];

/* ─── Switches ──────────────────────────────────────────────── */
const makePorts = (count: number, errorRate = 0.06, downRate = 0.12) =>
  Array.from({ length: count }, (_, i) => {
    const isError = i > 0 && i % Math.round(1 / errorRate) === 0;
    const isDown  = !isError && i > 0 && i % Math.round(1 / downRate) === 0;
    const st = isError ? 'error' : isDown ? 'down' : 'up';
    return {
      portId: `${i + 1}`, name: `${i + 1}`,
      status: st as 'up' | 'down' | 'error' | 'disabled',
      speed: st === 'down' ? 0 : st === 'error' ? 100 : 1000,
      duplex: st === 'down' ? 'unknown' : 'full',
      vlan: (i % 4) + 1, poe: i < count * 0.8,
      poeWatts: i < count * 0.8 && st === 'up' ? 12 + (i % 6) : 0,
      rxBytes: st !== 'up' ? 0 : Math.floor(Math.random() * 4_000_000),
      txBytes: st !== 'up' ? 0 : Math.floor(Math.random() * 2_500_000),
      errors: isError ? 120 + (i * 31) % 900 : 0,
      description: st === 'error' ? `Puerto ${i + 1} (CRC/Err)` : `Puerto ${i + 1}`,
    };
  });

export const mockSwitches: NetworkSwitch[] = [
  {
    serial:'SW-CORE-01', name:'SW-Core-Principal', model:'Aruba 6300M-48G-PoE4', building:'Data Center',
    status:'online', ip:'10.10.0.1', uptime:7776000, firmware:'PL.10.13.1019',
    temperature:62, cpuUsage:28, memUsage:41,
    totalPorts:52, portsUp:44, portsDown:5, portsError:3,
    ports:[
      { portId:'1', name:'1/1/1', status:'up', speed:10000, duplex:'full', vlan:99, poe:false, poeWatts:0, rxBytes:45_000_000, txBytes:38_000_000, errors:0, description:'Uplink ISP Principal' },
      { portId:'2', name:'1/1/2', status:'up', speed:10000, duplex:'full', vlan:99, poe:false, poeWatts:0, rxBytes:22_000_000, txBytes:18_000_000, errors:0, description:'Uplink ISP Secundario' },
      { portId:'3', name:'1/1/3', status:'up', speed:10000, duplex:'full', vlan:99, poe:false, poeWatts:0, rxBytes:18_000_000, txBytes:14_000_000, errors:0, description:'Firewall' },
      { portId:'4', name:'1/1/4', status:'up', speed:1000, duplex:'full', vlan:20, poe:false, poeWatts:0, rxBytes:8_200_000, txBytes:5_100_000, errors:0, description:'SW-EdifPrincipal' },
      { portId:'5', name:'1/1/5', status:'up', speed:1000, duplex:'full', vlan:20, poe:false, poeWatts:0, rxBytes:6_400_000, txBytes:4_200_000, errors:0, description:'SW-Biblioteca' },
      { portId:'6', name:'1/1/6', status:'up', speed:1000, duplex:'full', vlan:20, poe:false, poeWatts:0, rxBytes:5_800_000, txBytes:3_900_000, errors:0, description:'SW-Docentes' },
      { portId:'7', name:'1/1/7', status:'up', speed:1000, duplex:'full', vlan:20, poe:false, poeWatts:0, rxBytes:4_100_000, txBytes:2_800_000, errors:0, description:'SW-LabSistemas' },
      { portId:'8', name:'1/1/8', status:'error', speed:100, duplex:'half', vlan:1, poe:false, poeWatts:0, rxBytes:120, txBytes:80, errors:1248, description:'PC-Secretaría (CRC)' },
      { portId:'9', name:'1/1/9', status:'up', speed:1000, duplex:'full', vlan:30, poe:true, poeWatts:7.2, rxBytes:3_100_000, txBytes:1_900_000, errors:0, description:'Cámara-IP-01' },
      { portId:'10', name:'1/1/10', status:'up', speed:1000, duplex:'full', vlan:30, poe:true, poeWatts:7.2, rxBytes:2_900_000, txBytes:1_750_000, errors:0, description:'Cámara-IP-02' },
      { portId:'11', name:'1/1/11', status:'down', speed:0, duplex:'unknown', vlan:1, poe:false, poeWatts:0, rxBytes:0, txBytes:0, errors:0, description:'Reservado' },
      { portId:'12', name:'1/1/12', status:'error', speed:100, duplex:'half', vlan:1, poe:false, poeWatts:0, rxBytes:0, txBytes:0, errors:543, description:'PC-Lab (FCS Err)' },
      ...makePorts(40).map((p, i) => ({ ...p, portId: `${i + 13}`, name: `1/1/${i + 13}` })),
    ],
  },
  {
    serial:'SW-EP-01', name:'SW-EdifPrincipal', model:'Aruba 2930F-48G-PoE', building:'Edificio Principal',
    status:'online', ip:'10.10.1.1', uptime:4320000, firmware:'WC.16.11.0014',
    temperature:48, cpuUsage:18, memUsage:35,
    totalPorts:48, portsUp:38, portsDown:7, portsError:3,
    ports: makePorts(48, 0.065, 0.145),
  },
  {
    serial:'SW-BC-01', name:'SW-Biblioteca', model:'Aruba 2540-48G-PoE', building:'Biblioteca Central',
    status:'online', ip:'10.10.3.1', uptime:3888000, firmware:'YA.16.11.0014',
    temperature:45, cpuUsage:15, memUsage:29,
    totalPorts:48, portsUp:36, portsDown:10, portsError:2,
    ports: makePorts(48, 0.04, 0.21),
  },
  {
    serial:'SW-LS-01', name:'SW-LabSistemas', model:'Aruba 2930F-24G-PoE', building:'Lab. Sistemas',
    status:'online', ip:'10.10.4.1', uptime:2160000, firmware:'WC.16.11.0014',
    temperature:51, cpuUsage:22, memUsage:39,
    totalPorts:24, portsUp:20, portsDown:3, portsError:1,
    ports: makePorts(24, 0.042, 0.125),
  },
  {
    serial:'SW-ED-01', name:'SW-Docentes', model:'Aruba 2540-24G', building:'Edificio Docentes',
    status:'warning', ip:'10.10.2.1', uptime:432000, firmware:'YA.16.10.0012',
    temperature:55, cpuUsage:34, memUsage:48,
    totalPorts:24, portsUp:18, portsDown:4, portsError:2,
    ports: makePorts(24, 0.083, 0.167),
  },
];

/* ─── Servers ───────────────────────────────────────────────── */
export const mockServers: Server[] = [
  { id:'SRV-WEB', name:'SRV-Web-Principal', role:'Servidor Web / Moodle', ip:'10.10.0.10', os:'Ubuntu 22.04 LTS', status:'online', cpuUsage:38, memUsage:62, diskUsage:54, temperature:68, uptime:7776000, services:[{name:'Apache2',status:'running'},{name:'MySQL 8',status:'running'},{name:'Moodle 4.3',status:'running'},{name:'PHP-FPM',status:'running'}] },
  { id:'SRV-BAK', name:'SRV-Respaldo', role:'Backup / NAS', ip:'10.10.0.11', os:'Ubuntu 20.04 LTS', status:'online', cpuUsage:12, memUsage:45, diskUsage:78, temperature:58, uptime:15552000, services:[{name:'Bacula',status:'running'},{name:'NFS',status:'running'},{name:'Rsync',status:'running'}] },
  { id:'SRV-AD', name:'SRV-ActiveDirectory', role:'Active Directory / DNS / DHCP', ip:'10.10.0.12', os:'Windows Server 2022', status:'online', cpuUsage:24, memUsage:71, diskUsage:42, temperature:64, uptime:12960000, services:[{name:'Active Directory',status:'running'},{name:'DNS',status:'running'},{name:'DHCP',status:'running'}] },
  { id:'FW-01', name:'Firewall-UTM', role:'Firewall / IPS / VPN', ip:'10.10.0.2', os:'PAN-OS 11.0', status:'online', cpuUsage:19, memUsage:38, diskUsage:28, temperature:72, uptime:7776000, services:[{name:'Firewall',status:'running'},{name:'IPS/IDS',status:'running'},{name:'VPN',status:'running'},{name:'SSL-Insp',status:'warning'}] },
  { id:'SRV-CTRL', name:'Aruba-Controller', role:'Controladora WiFi / NMS', ip:'10.10.0.13', os:'ArubaOS 10.5', status:'online', cpuUsage:31, memUsage:55, diskUsage:39, temperature:66, uptime:5184000, services:[{name:'Mobility Ctrl',status:'running'},{name:'AirMatch',status:'running'},{name:'ArubaOS',status:'running'}] },
  { id:'SRV-MON', name:'SRV-Monitoreo', role:'Nagios / Grafana / NMS', ip:'10.10.0.14', os:'Ubuntu 22.04 LTS', status:'online', cpuUsage:29, memUsage:67, diskUsage:61, temperature:61, uptime:3456000, services:[{name:'Nagios',status:'running'},{name:'Grafana',status:'running'},{name:'InfluxDB',status:'running'},{name:'Prometheus',status:'running'}] },
];

/* ─── Clients ───────────────────────────────────────────────── */
const H = ['MacBook-Pro','iPhone','Samsung-S23','Dell-Latitude','HP-ProBook','iPad-Air','Xiaomi-12','ThinkPad','Surface-Pro','Chromebook'];
const onlineAPs = mockAPs.filter(a => a.status !== 'offline');

export const mockClients: Client[] = Array.from({ length: 290 }, (_, i) => {
  const ap = onlineAPs[i % onlineAPs.length];
  const ssids = ['PUCESE-Estudiantes','PUCESE-Docentes','eduroam','PUCESE-Lab'];
  return {
    mac: `${['a0','b4','c8','d2','e6','f0'][i%6]}:${(i%256).toString(16).padStart(2,'0')}:4e:${(Math.floor(i/256)%256).toString(16).padStart(2,'0')}:${((i*7)%256).toString(16).padStart(2,'0')}:${((i*13)%256).toString(16).padStart(2,'0')}`,
    hostname: `${H[i%10]}-${String(i+1).padStart(3,'0')}`,
    ip: `10.${10+Math.floor(i/100)}.${Math.floor(i/10)%10}.${(i%200)+10}`,
    type: 'wireless',
    ap: ap.name, apSerial: ap.serial,
    ssid: ssids[i%4], band: i%3===0 ? '2.4GHz' : '5GHz',
    signal: -(45+(i%35)),
    speed: [6,12,54,144,300,450][i%6] * 1_000_000,
    vlan: [10,20,30,40][i%4],
    rxBytes: Math.floor(Math.random()*500_000_000),
    txBytes: Math.floor(Math.random()*200_000_000),
    connectedAt: new Date(Date.now()-(i*120_000+Math.random()*3_600_000)).toISOString(),
    building: ap.building,
  };
});

/* ─── Alerts ────────────────────────────────────────────────── */
export const mockAlerts: Alert[] = [
  { id:'1', severity:'critical', category:'Temperatura', device:'Firewall-UTM', message:'Temperatura crítica: 72°C', detail:'Supera umbral de 70°C — revisar ventilación del rack', timestamp:new Date(Date.now()-300_000).toISOString(), acknowledged:false, building:'Data Center' },
  { id:'2', severity:'critical', category:'Puerto Dañado', device:'SW-Core-Principal', message:'Puerto 1/1/8 con 1.248 errores CRC', detail:'Posible cable dañado en PC-Secretaría — puerto deshabilitado automáticamente', timestamp:new Date(Date.now()-720_000).toISOString(), acknowledged:false, building:'Data Center' },
  { id:'3', severity:'critical', category:'AP Offline', device:'AP-LabIdiomas-PB-01', message:'AP desconectado hace 1h 02m', detail:'Sin respuesta a ping — verificar alimentación PoE y patch cord', timestamp:new Date(Date.now()-3_720_000).toISOString(), acknowledged:false, building:'Lab. Idiomas' },
  { id:'4', severity:'warning', category:'Alto CPU', device:'AP-EdifPrincipal-P2-02', message:'CPU AP al 78% por >15 min', detail:'Posible degradación de servicio — considerar reinicio o balanceo de clientes', timestamp:new Date(Date.now()-900_000).toISOString(), acknowledged:false, building:'Edificio Principal' },
  { id:'5', severity:'warning', category:'Temperatura AP', device:'AP-Cafeteria-PB-01', message:'AP en Cafetería: 63°C', detail:'Temperatura elevada — revisar obstrucción de ventilación o A/C del área', timestamp:new Date(Date.now()-1_800_000).toISOString(), acknowledged:false, building:'Cafetería' },
  { id:'6', severity:'warning', category:'Switch Degradado', device:'SW-Docentes', message:'SW-Docentes con CPU al 34% y temp 55°C', detail:'Firmware desactualizado (YA.16.10.0012) — programar actualización', timestamp:new Date(Date.now()-2_700_000).toISOString(), acknowledged:false, building:'Edificio Docentes' },
  { id:'7', severity:'warning', category:'Interferencia RF', device:'AP-LabSistemas-PB-01', message:'Ruido elevado en 2.4 GHz: -92 dBm', detail:'Posible interferencia en Lab. Sistemas — canal 11 saturado', timestamp:new Date(Date.now()-4_500_000).toISOString(), acknowledged:false, building:'Lab. Sistemas' },
  { id:'8', severity:'warning', category:'Alta Densidad', device:'AP-Biblioteca-P2-01', message:'41 clientes en un solo AP', detail:'Supera recomendación de 30 clientes — considerar agregar AP adicional', timestamp:new Date(Date.now()-5_400_000).toISOString(), acknowledged:true, building:'Biblioteca Central' },
  { id:'9', severity:'info', category:'Firmware', device:'AP-EdifPrincipal-P2-02', message:'Firmware desactualizado: 8.10.0.0', detail:'Versión disponible: 8.11.2.0 — programar actualización en ventana de mantenimiento', timestamp:new Date(Date.now()-7_200_000).toISOString(), acknowledged:true, building:'Edificio Principal' },
  { id:'10', severity:'info', category:'Servicio', device:'Firewall-UTM', message:'SSL Inspection en modo degradado', detail:'Certificado SSL por vencer en 15 días — renovar antes de expiración', timestamp:new Date(Date.now()-10_800_000).toISOString(), acknowledged:false, building:'Data Center' },
  { id:'11', severity:'info', category:'Puerto', device:'SW-EP-01', message:'Puertos 17 y 34 con errores intermitentes', detail:'Detectados ~120 errores en últimas 2h — monitorear', timestamp:new Date(Date.now()-14_400_000).toISOString(), acknowledged:true, building:'Edificio Principal' },
];

/* ─── Bandwidth history ─────────────────────────────────────── */
export function generateBandwidthHistory(n = 30): BandwidthPoint[] {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => ({
    time: new Date(now - (n - i) * 60_000).toLocaleTimeString('es-EC', { hour:'2-digit', minute:'2-digit' }),
    rx: +(15 + Math.sin(i * 0.4) * 8 + Math.random() * 4).toFixed(1),
    tx: +(8 + Math.sin(i * 0.4 + 1) * 4 + Math.random() * 2).toFixed(1),
  }));
}

/* ─── Overview ──────────────────────────────────────────────── */
export function getOverview(): NetworkOverview {
  const on = mockAPs.filter(a => a.status === 'online').length;
  const warn = mockAPs.filter(a => a.status === 'warning').length;
  const off = mockAPs.filter(a => a.status === 'offline').length;
  const unack = mockAlerts.filter(a => !a.acknowledged);
  return {
    totalAPs: mockAPs.length, onlineAPs: on, warningAPs: warn, offlineAPs: off,
    totalClients: mockClients.length,
    wirelessClients: mockClients.filter(c => c.type === 'wireless').length,
    wiredClients: mockClients.filter(c => c.type === 'wired').length,
    activeAlerts: unack.length,
    criticalAlerts: unack.filter(a => a.severity === 'critical').length,
    totalSwitches: mockSwitches.length,
    onlineSwitches: mockSwitches.filter(s => s.status === 'online').length,
    totalServers: mockServers.length,
    onlineServers: mockServers.filter(s => s.status === 'online').length,
    networkHealth: Math.round(((on + warn * 0.5) / mockAPs.length) * 100),
    totalBandwidthRx: 48.2, totalBandwidthTx: 23.8,
    rfHealth: 82,
  };
}
