
import { NetworkService, NetworkDiagram } from './types';

export const MOCK_SERVICES: NetworkService[] = [
  {
    id: '1',
    name: 'Plex',
    description: 'High-definition home media server and streaming center.',
    hostname: 'media-server.local',
    port: 32400,
    icon: 'play_circle',
    type: 'internal',
    url: 'http://192.168.1.50:32400'
  },
  {
    id: '2',
    name: 'Home Assistant',
    description: 'Centralized automation and smart device controller.',
    hostname: 'hassio.local',
    port: 8123,
    icon: 'home_filled',
    type: 'internal',
    url: 'http://192.168.1.10:8123'
  },
  {
    id: '3',
    name: 'Pi-hole',
    description: 'Network-wide ad blocking and private DNS filtering.',
    hostname: 'pihole.local',
    port: 80,
    icon: 'shield_with_heart',
    type: 'internal',
    url: 'http://192.168.1.5:80'
  },
  {
    id: '4',
    name: 'TrueNAS',
    description: 'Enterprise-grade network storage and file management.',
    hostname: 'nas.local',
    port: 443,
    icon: 'hard_drive_2',
    type: 'internal',
    url: 'https://192.168.1.20'
  },
  {
    id: '5',
    name: 'GitHub',
    description: 'Cloud-based repository and project management.',
    hostname: 'github.com',
    port: 443,
    icon: 'code_blocks',
    type: 'external',
    url: 'https://github.com'
  },
  {
    id: '6',
    name: 'Proxmox',
    description: 'Virtualization management platform for servers.',
    hostname: 'proxmox.local',
    port: 8006,
    icon: 'view_quilt',
    type: 'internal',
    url: 'https://192.168.1.100:8006'
  }
];

export const MOCK_DIAGRAMS: NetworkDiagram[] = [
  {
    id: 'd1',
    filename: 'network_topology_2024.png',
    description: 'Main infrastructure layout',
    metadata: '3840 x 2160',
    size: '2.4 MB',
    lastUpdated: '2h ago',
    imageUrl: 'https://picsum.photos/seed/network1/2000/1500'
  },
  {
    id: 'd2',
    filename: 'rack_layout_v2.png',
    description: 'Server rack mounting plan',
    metadata: '1920 x 1080',
    size: '1.1 MB',
    lastUpdated: 'Yesterday',
    imageUrl: 'https://picsum.photos/seed/network2/1600/1200'
  },
  {
    id: 'd3',
    filename: 'ip_address_map.png',
    description: 'VLAN & Static IP assignments',
    metadata: '2500 x 1400',
    size: '850 KB',
    lastUpdated: '3 days ago',
    imageUrl: 'https://picsum.photos/seed/network3/1800/1400'
  }
];
