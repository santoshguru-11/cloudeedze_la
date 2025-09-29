import { AssetServiceClient } from '@google-cloud/asset';

export interface GCPCredentials {
  projectId: string;
  keyFilename?: string;
  credentials?: object;
}

export interface GCPResource {
  id: string;
  name: string;
  type: string;
  service: string;
  location: string;
  tags?: Record<string, string>;
  state: string;
  costDetails?: {
    machineType?: string;
    vcpus?: number;
    memory?: number;
    storage?: number;
    diskSize?: number;
  };
}

export interface GCPInventory {
  resources: GCPResource[];
  summary: {
    totalResources: number;
    services: Record<string, number>;
    locations: Record<string, number>;
  };
  scanDate: string;
}

export class GCPInventoryService {
  private credentials: GCPCredentials;
  private client: AssetServiceClient;

  constructor(credentials: GCPCredentials) {
    this.credentials = credentials;
    
    const clientOptions: any = {
      projectId: credentials.projectId
    };

    if (credentials.keyFilename) {
      clientOptions.keyFilename = credentials.keyFilename;
    } else if (credentials.credentials) {
      clientOptions.credentials = credentials.credentials;
    }

    this.client = new AssetServiceClient(clientOptions);
  }

  async discoverResources(): Promise<GCPInventory> {
    const resources: GCPResource[] = [];
    const summary = {
      totalResources: 0,
      services: {} as Record<string, number>,
      locations: {} as Record<string, number>
    };

    try {
      // Discover Compute Engine instances
      const computeResources = await this.discoverComputeInstances();
      resources.push(...computeResources);

      // Discover Cloud SQL instances
      const sqlResources = await this.discoverCloudSQLInstances();
      resources.push(...sqlResources);

      // Discover Cloud Storage buckets
      const storageResources = await this.discoverStorageBuckets();
      resources.push(...storageResources);

      // Discover Cloud Functions
      const functionResources = await this.discoverCloudFunctions();
      resources.push(...functionResources);

      // Discover GKE clusters
      const gkeResources = await this.discoverGKEClusters();
      resources.push(...gkeResources);

      // Update summary
      summary.totalResources = resources.length;
      resources.forEach(resource => {
        summary.services[resource.service] = (summary.services[resource.service] || 0) + 1;
        summary.locations[resource.location] = (summary.locations[resource.location] || 0) + 1;
      });

      return {
        resources,
        summary,
        scanDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error discovering GCP resources:', error);
      throw error;
    }
  }

  private async discoverComputeInstances(): Promise<GCPResource[]> {
    const resources: GCPResource[] = [];
    const parent = `projects/${this.credentials.projectId}`;

    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ['compute.googleapis.com/Instance'],
      });

      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const instanceData = asset.resource.data as any;
          const location = this.extractLocationFromAssetName(asset.name || '');
          
          resources.push({
            id: instanceData.id || asset.name || 'unknown',
            name: instanceData.name || 'unnamed',
            type: 'Instance',
            service: 'Compute Engine',
            location,
            tags: this.extractLabels(instanceData.labels),
            state: instanceData.status || 'unknown',
            costDetails: {
              machineType: this.extractMachineType(instanceData.machineType),
              vcpus: this.getVCPUsFromMachineType(instanceData.machineType),
              memory: this.getMemoryFromMachineType(instanceData.machineType)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error discovering Compute Engine instances:', error);
    }

    return resources;
  }

  private async discoverCloudSQLInstances(): Promise<GCPResource[]> {
    const resources: GCPResource[] = [];
    const parent = `projects/${this.credentials.projectId}`;

    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ['sqladmin.googleapis.com/Instance'],
      });

      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const instanceData = asset.resource.data as any;
          const location = instanceData.region || 'unknown';
          
          resources.push({
            id: instanceData.name || asset.name || 'unknown',
            name: instanceData.name || 'unnamed',
            type: 'SQL Instance',
            service: 'Cloud SQL',
            location,
            state: instanceData.state || 'unknown',
            costDetails: {
              machineType: instanceData.settings?.tier,
              storage: instanceData.settings?.dataDiskSizeGb
            }
          });
        }
      }
    } catch (error) {
      console.error('Error discovering Cloud SQL instances:', error);
    }

    return resources;
  }

  private async discoverStorageBuckets(): Promise<GCPResource[]> {
    const resources: GCPResource[] = [];
    const parent = `projects/${this.credentials.projectId}`;

    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ['storage.googleapis.com/Bucket'],
      });

      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const bucketData = asset.resource.data as any;
          
          resources.push({
            id: bucketData.id || asset.name || 'unknown',
            name: bucketData.name || 'unnamed',
            type: 'Bucket',
            service: 'Cloud Storage',
            location: bucketData.location || 'unknown',
            state: 'active'
          });
        }
      }
    } catch (error) {
      console.error('Error discovering Cloud Storage buckets:', error);
    }

    return resources;
  }

  private async discoverCloudFunctions(): Promise<GCPResource[]> {
    const resources: GCPResource[] = [];
    const parent = `projects/${this.credentials.projectId}`;

    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ['cloudfunctions.googleapis.com/CloudFunction'],
      });

      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const functionData = asset.resource.data as any;
          const location = this.extractLocationFromAssetName(asset.name || '');
          
          resources.push({
            id: functionData.name || asset.name || 'unknown',
            name: this.extractFunctionName(functionData.name || ''),
            type: 'Function',
            service: 'Cloud Functions',
            location,
            state: functionData.status || 'unknown',
            costDetails: {
              memory: this.extractMemoryFromFunction(functionData.availableMemoryMb)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error discovering Cloud Functions:', error);
    }

    return resources;
  }

  private async discoverGKEClusters(): Promise<GCPResource[]> {
    const resources: GCPResource[] = [];
    const parent = `projects/${this.credentials.projectId}`;

    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ['container.googleapis.com/Cluster'],
      });

      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const clusterData = asset.resource.data as any;
          
          resources.push({
            id: clusterData.name || asset.name || 'unknown',
            name: clusterData.name || 'unnamed',
            type: 'Cluster',
            service: 'GKE',
            location: clusterData.location || 'unknown',
            state: clusterData.status || 'unknown'
          });
        }
      }
    } catch (error) {
      console.error('Error discovering GKE clusters:', error);
    }

    return resources;
  }

  private extractLocationFromAssetName(assetName: string): string {
    const parts = assetName.split('/');
    const zoneIndex = parts.findIndex(part => part === 'zones');
    if (zoneIndex !== -1 && zoneIndex + 1 < parts.length) {
      return parts[zoneIndex + 1];
    }
    const regionIndex = parts.findIndex(part => part === 'regions');
    if (regionIndex !== -1 && regionIndex + 1 < parts.length) {
      return parts[regionIndex + 1];
    }
    return 'unknown';
  }

  private extractLabels(labels: any): Record<string, string> {
    if (!labels || typeof labels !== 'object') return {};
    return labels;
  }

  private extractMachineType(machineTypeUrl: string): string {
    if (!machineTypeUrl) return 'unknown';
    const parts = machineTypeUrl.split('/');
    return parts[parts.length - 1] || 'unknown';
  }

  private extractFunctionName(functionPath: string): string {
    const parts = functionPath.split('/');
    return parts[parts.length - 1] || 'unnamed';
  }

  private extractMemoryFromFunction(memoryMb: number): number {
    return memoryMb || 256;
  }

  private getVCPUsFromMachineType(machineType: string): number {
    if (!machineType) return 1;
    
    const vcpuMap: Record<string, number> = {
      'f1-micro': 1,
      'g1-small': 1,
      'n1-standard-1': 1,
      'n1-standard-2': 2,
      'n1-standard-4': 4,
      'n1-standard-8': 8,
      'n2-standard-2': 2,
      'n2-standard-4': 4,
      'n2-standard-8': 8,
      'e2-micro': 1,
      'e2-small': 1,
      'e2-medium': 1,
      'e2-standard-2': 2,
      'e2-standard-4': 4
    };
    
    return vcpuMap[machineType] || 1;
  }

  private getMemoryFromMachineType(machineType: string): number {
    if (!machineType) return 1;
    
    const memoryMap: Record<string, number> = {
      'f1-micro': 0.6,
      'g1-small': 1.7,
      'n1-standard-1': 3.75,
      'n1-standard-2': 7.5,
      'n1-standard-4': 15,
      'n1-standard-8': 30,
      'n2-standard-2': 8,
      'n2-standard-4': 16,
      'n2-standard-8': 32,
      'e2-micro': 1,
      'e2-small': 2,
      'e2-medium': 4,
      'e2-standard-2': 8,
      'e2-standard-4': 16
    };
    
    return memoryMap[machineType] || 1;
  }
}