import { AWSSimpleInventoryService as AWSInventoryService, AWSCredentials, AWSInventory } from './aws-inventory-simple.js';
import { AzureInventoryService, AzureCredentials, AzureInventory } from './azure-inventory.js';
import { GCPInventoryService, GCPCredentials, GCPInventory } from './gcp-inventory.js';
import { OCIInventoryService, OCICredentials, OCIInventory } from './oci-inventory.js';


export interface CloudCredentials {
  provider: 'aws' | 'azure' | 'gcp' | 'oci';
  credentials: AWSCredentials | AzureCredentials | GCPCredentials | OCICredentials;
}

export interface UnifiedResource {
  id: string;
  name: string;
  type: string;
  service: string;
  provider: string;
  location: string;
  tags?: Record<string, string>;
  state: string;
  costDetails?: {
    instanceType?: string;
    size?: string;
    vcpus?: number;
    memory?: number;
    storage?: number;
    tier?: string;
  };
}

export interface UnifiedInventory {
  resources: UnifiedResource[];
  summary: {
    totalResources: number;
    providers: Record<string, number>;
    services: Record<string, number>;
    locations: Record<string, number>;
  };
  scanDate: string;
  scanDuration: number; // in milliseconds
}

export interface InventoryScanRequest {
  credentials: CloudCredentials[];
  scanOptions?: {
    includeServices?: string[];
    excludeServices?: string[];
    regions?: string[];
    resourceGroups?: string[];
  };
}

export interface InventoryToCostMapping {
  compute: {
    vcpus: number;
    ram: number;
    instanceType: 'general-purpose' | 'compute-optimized' | 'memory-optimized' | 'storage-optimized';
    region: string;
    operatingSystem: 'linux' | 'windows';
    bootVolume: {
      size: number;
      type: 'ssd-gp3' | 'ssd-gp2' | 'ssd-io2' | 'hdd-standard';
      iops: number;
    };
  };
  storage: {
    objectStorage: {
      size: number;
      tier: 'standard' | 'infrequent-access' | 'glacier' | 'deep-archive';
      requests: number;
    };
    blockStorage: {
      size: number;
      type: 'ssd-gp3' | 'ssd-io2' | 'hdd-st1';
      iops: number;
    };
  };
  database: {
    relational: {
      engine: 'mysql' | 'postgresql' | 'oracle' | 'sql-server' | 'mariadb';
      instanceClass: 'micro' | 'small' | 'medium' | 'large' | 'xlarge';
      storage: number;
      multiAZ: boolean;
    };
  };
  networking: {
    bandwidth: number;
    loadBalancer: 'none' | 'application' | 'network';
  };
}

export class CloudInventoryService {
  async scanMultipleProviders(request: InventoryScanRequest): Promise<UnifiedInventory> {
    const startTime = Date.now();
    const allResources: UnifiedResource[] = [];
    const summary = {
      totalResources: 0,
      providers: {} as Record<string, number>,
      services: {} as Record<string, number>,
      locations: {} as Record<string, number>
    };

    const scanPromises = request.credentials.map(cred => this.scanSingleProvider(cred));
    
    try {
      const results = await Promise.allSettled(scanPromises);
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const provider = request.credentials[i].provider;
        
        if (result.status === 'fulfilled') {
          const inventory = result.value;
          const unifiedResources = this.convertToUnifiedFormat(inventory, provider);
          allResources.push(...unifiedResources);
        } else {
          console.error(`Failed to scan ${provider}:`, result.reason);
        }
      }

      // Update summary
      summary.totalResources = allResources.length;
      allResources.forEach(resource => {
        summary.providers[resource.provider] = (summary.providers[resource.provider] || 0) + 1;
        summary.services[resource.service] = (summary.services[resource.service] || 0) + 1;
        summary.locations[resource.location] = (summary.locations[resource.location] || 0) + 1;
      });

      const endTime = Date.now();

      return {
        resources: allResources,
        summary,
        scanDate: new Date().toISOString(),
        scanDuration: endTime - startTime
      };
    } catch (error) {
      console.error('Error scanning multiple providers:', error);
      throw error;
    }
  }

  private async scanSingleProvider(cloudCredentials: CloudCredentials): Promise<AWSInventory | AzureInventory | GCPInventory | OCIInventory> {
    console.log(`Scanning ${cloudCredentials.provider} with credentials:`, JSON.stringify(cloudCredentials.credentials, null, 2));
    
    // Add timeout wrapper for each provider scan
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Scan timeout for ${cloudCredentials.provider} after 2 minutes`)), 2 * 60 * 1000);
    });
    
    try {
      let scanPromise: Promise<AWSInventory | AzureInventory | GCPInventory | OCIInventory>;
      
      switch (cloudCredentials.provider) {
        case 'aws':
          const awsService = new AWSInventoryService(cloudCredentials.credentials as AWSCredentials);
          scanPromise = awsService.discoverResources();
          break;
        
        case 'azure':
          const azureService = new AzureInventoryService(cloudCredentials.credentials as AzureCredentials);
          scanPromise = azureService.discoverResources();
          break;
        
        case 'gcp':
          const gcpService = new GCPInventoryService(cloudCredentials.credentials as GCPCredentials);
          scanPromise = gcpService.discoverResources();
          break;
        
        case 'oci':
          const ociService = new OCIInventoryService(cloudCredentials.credentials as OCICredentials);
          scanPromise = ociService.discoverResources();
          break;
        
        default:
          throw new Error(`Unsupported provider: ${cloudCredentials.provider}`);
      }
      
      // Race between the scan and timeout
      return await Promise.race([scanPromise, timeoutPromise]) as AWSInventory | AzureInventory | GCPInventory | OCIInventory;
      
    } catch (error) {
      console.error(`Failed to scan ${cloudCredentials.provider}:`, error);
      // Return empty inventory instead of crashing
      return {
        resources: [],
        summary: {
          totalResources: 0,
          byService: {},
          byRegion: {},
          byState: {}
        },
        metadata: {
          scanTime: new Date().toISOString(),
          region: (cloudCredentials.credentials as any).region || 'unknown',
          provider: cloudCredentials.provider
        }
      } as any;
    }
  }

  private convertToUnifiedFormat(
    inventory: AWSInventory | AzureInventory | GCPInventory | OCIInventory, 
    provider: string
  ): UnifiedResource[] {
   console.log(`Converting inventory for ${provider}:`, JSON.stringify(inventory, null, 2));
    
    // Handle cases where inventory might be undefined or malformed
    if (!inventory || !inventory.resources || !Array.isArray(inventory.resources)) {
      console.warn(`Invalid inventory format for ${provider}:`, inventory);
      return [];
    }
    
    const unifiedResources = inventory.resources.map(resource => ({
      ...resource,
      provider,
      location: 'location' in resource ? resource.location : (resource as any).region || 'unknown'
    }));
    
    console.log(`Converted ${unifiedResources.length} resources for ${provider}`);
    return unifiedResources;
  }

  generateCostRequirementsFromInventory(inventory: UnifiedInventory): InventoryToCostMapping {
    const requirements: InventoryToCostMapping = {
      compute: {
        vcpus: 0,
        ram: 0,
        instanceType: 'general-purpose',
        region: 'us-east-1',
        operatingSystem: 'linux',
        bootVolume: {
          size: 0,
          type: 'ssd-gp3',
          iops: 3000
        }
      },
      storage: {
        objectStorage: {
          size: 0,
          tier: 'standard',
          requests: 10000
        },
        blockStorage: {
          size: 0,
          type: 'ssd-gp3',
          iops: 3000
        }
      },
      database: {
        relational: {
          engine: 'mysql',
          instanceClass: 'small',
          storage: 0,
          multiAZ: false
        }
      },
      networking: {
        bandwidth: 0,
        loadBalancer: 'none'
      }
    };

    // Aggregate compute resources
    const computeResources = inventory.resources.filter(r => 
      r.service === 'EC2' || r.service === 'Compute Engine' || (r.service && r.service.includes('Virtual')) || r.service === 'OCI Compute'
    );

    computeResources.forEach(resource => {
      if (resource.costDetails) {
        requirements.compute.vcpus += resource.costDetails.vcpus || 0;
        requirements.compute.ram += resource.costDetails.memory || 0;
        requirements.compute.bootVolume.size += 30; // Default boot volume size
      }
    });

    // Aggregate storage resources
    const storageResources = inventory.resources.filter(r => 
      r.service === 'S3' || r.service === 'Cloud Storage' || r.service === 'EBS' || r.type === 'Bucket' || r.service === 'OCI Storage'
    );

    storageResources.forEach(resource => {
      if (resource.costDetails) {
        if (resource.type === 'Bucket' || resource.service === 'S3' || resource.service === 'Cloud Storage') {
          requirements.storage.objectStorage.size += resource.costDetails.storage || 100;
        } else {
          requirements.storage.blockStorage.size += resource.costDetails.storage || 0;
        }
      }
    });

    // Aggregate database resources
    const dbResources = inventory.resources.filter(r => 
      r.service === 'RDS' || r.service === 'Cloud SQL' || (r.type && r.type.includes('SQL')) || r.service === 'OCI Database'
    );

    dbResources.forEach(resource => {
      if (resource.costDetails) {
        requirements.database.relational.storage += resource.costDetails.storage || 0;
      }
    });

    // Determine load balancer usage
    const lbResources = inventory.resources.filter(r => 
      r.service === 'ELB' || r.type === 'LoadBalancer'
    );

    if (lbResources.length > 0) {
      requirements.networking.loadBalancer = 'application';
    }

    // Estimate bandwidth based on number of resources
    requirements.networking.bandwidth = Math.max(1, Math.floor(inventory.resources.length * 10));

    return requirements;
  }

  async generateAutomaticCostAnalysis(inventory: UnifiedInventory) {
    const requirements = this.generateCostRequirementsFromInventory(inventory);
    
    // Here you would integrate with your existing cost calculation logic
    // For now, return the requirements that can be fed into your cost calculator
    return {
      inventory,
      costRequirements: requirements,
      recommendations: {
        optimization: this.generateOptimizationRecommendations(inventory),
        rightSizing: this.generateRightSizingRecommendations(inventory),
        costSavings: this.generateCostSavingsRecommendations(inventory)
      }
    };
  }

  private generateOptimizationRecommendations(inventory: UnifiedInventory): string[] {
    const recommendations: string[] = [];
    const { resources } = inventory;

    // Check for idle resources
    const stoppedResources = resources.filter(r => r.state === 'stopped' || r.state === 'TERMINATED');
    if (stoppedResources.length > 0) {
      recommendations.push(`Found ${stoppedResources.length} stopped/terminated resources that may be generating costs`);
    }

    // Check for untagged resources
    const untaggedResources = resources.filter(r => !r.tags || Object.keys(r.tags).length === 0);
    if (untaggedResources.length > 0) {
      recommendations.push(`${untaggedResources.length} resources are untagged - consider adding cost allocation tags`);
    }

    // Check for old resources
    const oldResources = resources.filter(r => {
      const name = (r.name || "").toLowerCase();
      return name.includes('test') || name.includes('temp') || name.includes('old');
    });
    if (oldResources.length > 0) {
      recommendations.push(`Found ${oldResources.length} resources with test/temp/old in their names - review for cleanup`);
    }

    return recommendations;
  }

  private generateRightSizingRecommendations(inventory: UnifiedInventory): string[] {
    const recommendations: string[] = [];
    const computeResources = inventory.resources.filter(r => 
      r.service === 'EC2' || r.service === 'Compute Engine' || r.service.includes('Virtual')
    );

    // Simple right-sizing logic based on instance types
    const oversizedInstances = computeResources.filter(r => {
      if (r.costDetails && r.costDetails.vcpus) {
        return r.costDetails.vcpus > 8; // Arbitrary threshold
      }
      return false;
    });

    if (oversizedInstances.length > 0) {
      recommendations.push(`${oversizedInstances.length} compute instances may be oversized - consider right-sizing`);
    }

    return recommendations;
  }

  private generateCostSavingsRecommendations(inventory: UnifiedInventory): string[] {
    const recommendations: string[] = [];
    const { summary } = inventory;

    if (summary.providers.aws && summary.providers.azure) {
      recommendations.push('Multi-cloud setup detected - consider workload consolidation for better pricing');
    }

    if (summary.totalResources > 50) {
      recommendations.push('Large infrastructure detected - consider reserved instances or committed use discounts');
    }

    return recommendations;
  }
}