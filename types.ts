
export type ServiceType = 'internal' | 'external';

export interface NetworkService {
  id: string;
  name: string;
  description: string;
  hostname: string;
  port: number;
  icon: string;
  type: ServiceType;
  url: string;
}

export interface NetworkDiagram {
  id: string;
  filename: string;
  description: string;
  metadata: string;
  size: string;
  lastUpdated: string;
  imageUrl: string;
}

export type AppView = 'services' | 'diagrams';
