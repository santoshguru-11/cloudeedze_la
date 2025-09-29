import { ResourceManagementClient } from '@azure/arm-resources';
import { DefaultAzureCredential } from '@azure/identity';

export interface AzureCredentials {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
}

export interface AzureResource {
  id: string;
  name: string;
  type: string;
  service: string;
  location: string;
  resourceGroup: string;
  tags?: Record<string, string>;
  state: string;
  costDetails?: {
    size?: string;
    tier?: string;
    vcpus?: number;
    memory?: number;
    storage?: number;
  };
}

export interface AzureInventory {
  resources: AzureResource[];
  summary: {
    totalResources: number;
    services: Record<string, number>;
    locations: Record<string, number>;
    resourceGroups: Record<string, number>;
  };
  scanDate: string;
}

export class AzureInventoryService {
  private credentials: AzureCredentials;
  private client: ResourceManagementClient;

  constructor(credentials: AzureCredentials) {
    this.credentials = credentials;
    
    // Use service principal authentication
    const credential = new DefaultAzureCredential();
    this.client = new ResourceManagementClient(credential, credentials.subscriptionId);
  }

  async discoverResources(): Promise<AzureInventory> {
    const resources: AzureResource[] = [];
    const summary = {
      totalResources: 0,
      services: {} as Record<string, number>,
      locations: {} as Record<string, number>,
      resourceGroups: {} as Record<string, number>
    };

    try {
      // Get all resource groups first
      const resourceGroups = await this.getResourceGroups();
      
      // Discover resources in each resource group
      for (const rg of resourceGroups) {
        const rgResources = await this.discoverResourcesInGroup(rg.name!);
        resources.push(...rgResources);
      }

      // Update summary
      summary.totalResources = resources.length;
      resources.forEach(resource => {
        const service = this.extractServiceFromType(resource.type);
        summary.services[service] = (summary.services[service] || 0) + 1;
        summary.locations[resource.location] = (summary.locations[resource.location] || 0) + 1;
        summary.resourceGroups[resource.resourceGroup] = (summary.resourceGroups[resource.resourceGroup] || 0) + 1;
      });

      return {
        resources,
        summary,
        scanDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error discovering Azure resources:', error);
      throw error;
    }
  }

  private async getResourceGroups() {
    const resourceGroups = [];
    for await (const rg of this.client.resourceGroups.list()) {
      resourceGroups.push(rg);
    }
    return resourceGroups;
  }

  private async discoverResourcesInGroup(resourceGroupName: string): Promise<AzureResource[]> {
    const resources: AzureResource[] = [];

    try {
      for await (const resource of this.client.resources.listByResourceGroup(resourceGroupName)) {
        const azureResource: AzureResource = {
          id: resource.id || 'unknown',
          name: resource.name || 'unnamed',
          type: resource.type || 'unknown',
          service: this.extractServiceFromType(resource.type || ''),
          location: resource.location || 'unknown',
          resourceGroup: resourceGroupName,
          tags: resource.tags || {},
          state: 'active', // Azure doesn't have a direct state concept like AWS
          costDetails: this.extractCostDetails(resource.type || '', resource.name || '')
        };

        resources.push(azureResource);
      }
    } catch (error) {
      console.error(`Error discovering resources in resource group ${resourceGroupName}:`, error);
    }

    return resources;
  }

  private extractServiceFromType(resourceType: string): string {
    const parts = resourceType.split('/');
    if (parts.length >= 2) {
      const provider = parts[0].replace('Microsoft.', '');
      return provider;
    }
    return 'Unknown';
  }

  private extractCostDetails(resourceType: string, resourceName: string): any {
    // Simplified cost details extraction based on resource type
    const lowerType = resourceType.toLowerCase();
    
    if (lowerType.includes('virtualmachines')) {
      // Extract VM size from name or use default
      return {
        size: this.extractVMSize(resourceName),
        vcpus: this.getVCPUsFromVMSize(resourceName),
        memory: this.getMemoryFromVMSize(resourceName)
      };
    } else if (lowerType.includes('storage')) {
      return {
        tier: 'Standard', // Default, would need additional API calls to get actual tier
        storage: 100 // Default, would need additional API calls
      };
    } else if (lowerType.includes('database')) {
      return {
        tier: 'Standard',
        size: 'S1' // Default
      };
    }

    return {};
  }

  private extractVMSize(resourceName: string): string {
    // In practice, you'd make an additional API call to get VM details
    // This is a simplified version
    return 'Standard_B2s'; // Default
  }

  private getVCPUsFromVMSize(vmSize: string): number {
    const vcpuMap: Record<string, number> = {
      'Standard_B1s': 1,
      'Standard_B2s': 2,
      'Standard_B4ms': 4,
      'Standard_D2s_v3': 2,
      'Standard_D4s_v3': 4,
      'Standard_D8s_v3': 8,
      'Standard_F2s_v2': 2,
      'Standard_F4s_v2': 4,
      'Standard_F8s_v2': 8
    };
    
    return vcpuMap[vmSize] || 2;
  }

  private getMemoryFromVMSize(vmSize: string): number {
    const memoryMap: Record<string, number> = {
      'Standard_B1s': 1,
      'Standard_B2s': 4,
      'Standard_B4ms': 16,
      'Standard_D2s_v3': 8,
      'Standard_D4s_v3': 16,
      'Standard_D8s_v3': 32,
      'Standard_F2s_v2': 4,
      'Standard_F4s_v2': 8,
      'Standard_F8s_v2': 16
    };
    
    return memoryMap[vmSize] || 4;
  }
}