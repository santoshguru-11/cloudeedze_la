/**
 * Unified Pricing Service
 * Combines all cloud provider pricing services into a single interface
 */

import { EC2InstancesPricingService } from './ec2-instances-pricing';
import { AWSPricingService } from './aws-pricing-service';
import { AzurePricingService } from './azure-pricing-service';
import { GCPPricingService } from './gcp-pricing-service';

export interface UnifiedPricing {
  provider: 'aws' | 'azure' | 'gcp' | 'oracle';
  service: string;
  instanceType?: string;
  region: string;
  pricing: {
    hourly?: number;
    monthly?: number;
    perGB?: number;
  };
  specs?: {
    vcpus?: number;
    memory?: number;
    storage?: string;
  };
  currency: string;
}

export class UnifiedPricingService {
  private ec2Pricing: EC2InstancesPricingService;
  private awsPricing: AWSPricingService;
  private azurePricing: AzurePricingService;
  private gcpPricing: GCPPricingService;

  constructor(awsCredentials?: { accessKeyId: string; secretAccessKey: string }) {
    this.ec2Pricing = new EC2InstancesPricingService();
    this.awsPricing = new AWSPricingService(awsCredentials);
    this.azurePricing = new AzurePricingService();
    this.gcpPricing = new GCPPricingService();
  }

  /**
   * Get compute instance pricing for any cloud provider
   */
  async getComputePricing(
    provider: 'aws' | 'azure' | 'gcp',
    instanceType: string,
    region: string
  ): Promise<UnifiedPricing | null> {
    try {
      switch (provider) {
        case 'aws':
          return await this.getAWSComputePricing(instanceType, region);
        case 'azure':
          return await this.getAzureComputePricing(instanceType, region);
        case 'gcp':
          return await this.getGCPComputePricing(instanceType, region);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${provider} compute pricing:`, error);
      return null;
    }
  }

  /**
   * Get database pricing for any cloud provider
   */
  async getDatabasePricing(
    provider: 'aws' | 'azure' | 'gcp',
    instanceType: string,
    region: string,
    engine?: string
  ): Promise<UnifiedPricing | null> {
    try {
      switch (provider) {
        case 'aws':
          const rdsPricing = await this.awsPricing.getRDSPricing(instanceType, region, engine);
          if (!rdsPricing) return null;
          return {
            provider: 'aws',
            service: 'RDS',
            instanceType,
            region,
            pricing: {
              hourly: rdsPricing.price.hourly,
              monthly: rdsPricing.price.monthly,
            },
            currency: 'USD',
          };

        case 'azure':
          const sqlPricing = await this.azurePricing.getSQLPricing(instanceType, region);
          if (!sqlPricing) return null;
          return {
            provider: 'azure',
            service: 'SQL Database',
            instanceType,
            region,
            pricing: {
              hourly: sqlPricing.price.hourly,
              monthly: sqlPricing.price.monthly,
            },
            currency: sqlPricing.currency,
          };

        case 'gcp':
          const cloudSQLPricing = await this.gcpPricing.getCloudSQLPricing(instanceType, region);
          if (!cloudSQLPricing) return null;
          return {
            provider: 'gcp',
            service: 'Cloud SQL',
            instanceType,
            region,
            pricing: {
              hourly: cloudSQLPricing.price.hourly,
              monthly: cloudSQLPricing.price.monthly,
            },
            currency: cloudSQLPricing.currency,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${provider} database pricing:`, error);
      return null;
    }
  }

  /**
   * Get storage pricing for any cloud provider
   */
  async getStoragePricing(
    provider: 'aws' | 'azure' | 'gcp',
    region: string,
    storageClass?: string
  ): Promise<UnifiedPricing | null> {
    try {
      switch (provider) {
        case 'aws':
          const s3Pricing = await this.awsPricing.getS3Pricing(region, storageClass);
          if (!s3Pricing) return null;
          return {
            provider: 'aws',
            service: 'S3',
            region,
            pricing: {
              perGB: s3Pricing.price.perGB,
            },
            currency: 'USD',
          };

        case 'azure':
          const azureStoragePricing = await this.azurePricing.getStoragePricing(region, storageClass);
          if (!azureStoragePricing) return null;
          return {
            provider: 'azure',
            service: 'Storage',
            region,
            pricing: {
              perGB: azureStoragePricing.price.perGB,
            },
            currency: azureStoragePricing.currency,
          };

        case 'gcp':
          const gcpStoragePricing = await this.gcpPricing.getStoragePricing(region, storageClass);
          if (!gcpStoragePricing) return null;
          return {
            provider: 'gcp',
            service: 'Cloud Storage',
            region,
            pricing: {
              perGB: gcpStoragePricing.price.perGB,
            },
            currency: gcpStoragePricing.currency,
          };

        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${provider} storage pricing:`, error);
      return null;
    }
  }

  /**
   * Compare pricing across all providers for the same specs
   */
  async comparePricing(vcpus: number, memory: number, region: string): Promise<UnifiedPricing[]> {
    const results: UnifiedPricing[] = [];

    // Find best matching instances for each provider
    const [awsMatch, azureMatch, gcpMatch] = await Promise.all([
      this.ec2Pricing.findBestMatch(vcpus, memory, region),
      this.findAzureBestMatch(vcpus, memory, region),
      this.findGCPBestMatch(vcpus, memory, region),
    ]);

    if (awsMatch) {
      results.push({
        provider: 'aws',
        service: 'EC2',
        instanceType: awsMatch.instanceType,
        region: awsMatch.region,
        pricing: {
          hourly: awsMatch.pricing.onDemand.hourly,
          monthly: awsMatch.pricing.onDemand.monthly,
        },
        specs: {
          vcpus: awsMatch.vcpus,
          memory: awsMatch.memory,
          storage: awsMatch.storage,
        },
        currency: 'USD',
      });
    }

    if (azureMatch) {
      results.push(azureMatch);
    }

    if (gcpMatch) {
      results.push(gcpMatch);
    }

    // Sort by monthly price
    results.sort((a, b) => (a.pricing.monthly || 0) - (b.pricing.monthly || 0));

    return results;
  }

  /**
   * Get AWS compute pricing using EC2 instances.info
   */
  private async getAWSComputePricing(instanceType: string, region: string): Promise<UnifiedPricing | null> {
    const ec2Data = await this.ec2Pricing.getInstancePricing(instanceType, region);
    if (!ec2Data) return null;

    return {
      provider: 'aws',
      service: 'EC2',
      instanceType: ec2Data.instanceType,
      region: ec2Data.region,
      pricing: {
        hourly: ec2Data.pricing.onDemand.hourly,
        monthly: ec2Data.pricing.onDemand.monthly,
      },
      specs: {
        vcpus: ec2Data.vcpus,
        memory: ec2Data.memory,
        storage: ec2Data.storage,
      },
      currency: 'USD',
    };
  }

  /**
   * Get Azure compute pricing
   */
  private async getAzureComputePricing(vmSize: string, region: string): Promise<UnifiedPricing | null> {
    const azureData = await this.azurePricing.getVMPricing(vmSize, region);
    if (!azureData) return null;

    return {
      provider: 'azure',
      service: 'Virtual Machines',
      instanceType: azureData.skuName,
      region: azureData.region,
      pricing: {
        hourly: azureData.price.hourly,
        monthly: azureData.price.monthly,
      },
      currency: azureData.currency,
    };
  }

  /**
   * Get GCP compute pricing
   */
  private async getGCPComputePricing(machineType: string, region: string): Promise<UnifiedPricing | null> {
    const gcpData = await this.gcpPricing.getComputePricing(machineType, region);
    if (!gcpData) return null;

    const specs = this.gcpPricing.getMachineSpecs(machineType);

    return {
      provider: 'gcp',
      service: 'Compute Engine',
      instanceType: machineType,
      region: gcpData.region,
      pricing: {
        hourly: gcpData.price.hourly,
        monthly: gcpData.price.monthly,
      },
      specs: specs ? {
        vcpus: specs.vcpus,
        memory: specs.memory,
      } : undefined,
      currency: gcpData.currency,
    };
  }

  /**
   * Find best matching Azure VM
   */
  private async findAzureBestMatch(vcpus: number, memory: number, region: string): Promise<UnifiedPricing | null> {
    // Common Azure VM sizes that match requirements
    const vmSizes = [
      'Standard_B1s', 'Standard_B2s', 'Standard_B4ms',
      'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_D8s_v3',
      'Standard_E2s_v3', 'Standard_E4s_v3', 'Standard_E8s_v3'
    ];

    for (const vmSize of vmSizes) {
      const pricing = await this.getAzureComputePricing(vmSize, region);
      if (pricing) {
        return pricing;
      }
    }

    return null;
  }

  /**
   * Find best matching GCP machine type
   */
  private async findGCPBestMatch(vcpus: number, memory: number, region: string): Promise<UnifiedPricing | null> {
    // Common GCP machine types
    const machineTypes = [
      'e2-micro', 'e2-small', 'e2-medium',
      'e2-standard-2', 'e2-standard-4', 'e2-standard-8',
      'n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'n1-standard-8',
      'n2-standard-2', 'n2-standard-4', 'n2-standard-8'
    ];

    for (const machineType of machineTypes) {
      const specs = this.gcpPricing.getMachineSpecs(machineType);
      if (specs && specs.vcpus >= vcpus && specs.memory >= memory) {
        return await this.getGCPComputePricing(machineType, region);
      }
    }

    return null;
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.awsPricing.clearCache();
    this.azurePricing.clearCache();
    this.gcpPricing.clearCache();
  }
}
