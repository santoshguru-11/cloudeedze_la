/**
 * EC2 Instances Pricing Service
 * Uses ec2instances.info API for fast and accurate EC2 instance pricing
 */

export interface EC2InstanceSpecs {
  instanceType: string;
  vcpus: number;
  memory: number; // GB
  storage: string;
  networkPerformance: string;
  pricing: {
    onDemand: {
      hourly: number;
      monthly: number;
    };
    spot?: {
      hourly: number;
      monthly: number;
    };
  };
  region: string;
}

export class EC2InstancesPricingService {
  private apiBaseUrl = 'https://api.vantage.sh/v1';
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.VANTAGE_API_KEY;
  }

  /**
   * Get EC2 instance pricing and specifications
   */
  async getInstancePricing(instanceType: string, region: string): Promise<EC2InstanceSpecs | null> {
    try {
      // For now, use direct fetch to ec2instances.info data
      // In production, use Vantage API with proper authentication
      const response = await fetch(
        `https://instances.vantage.sh/instances.json`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch EC2 pricing: ${response.statusText}`);
      }

      const data = await response.json();
      const instance = data.find((i: any) => i.instance_type === instanceType);

      if (!instance) {
        console.warn(`Instance type ${instanceType} not found in EC2 instances data`);
        return null;
      }

      // Get pricing for specific region
      const regionPricing = instance.pricing[region] || instance.pricing['us-east-1'];

      return {
        instanceType: instance.instance_type,
        vcpus: instance.vCPU,
        memory: instance.memory,
        storage: instance.storage || 'EBS Only',
        networkPerformance: instance.network_performance || 'Unknown',
        pricing: {
          onDemand: {
            hourly: parseFloat(regionPricing?.linux?.ondemand || '0'),
            monthly: parseFloat(regionPricing?.linux?.ondemand || '0') * 730, // 730 hours/month
          },
          spot: regionPricing?.linux?.spot ? {
            hourly: parseFloat(regionPricing.linux.spot),
            monthly: parseFloat(regionPricing.linux.spot) * 730,
          } : undefined,
        },
        region,
      };
    } catch (error) {
      console.error('Error fetching EC2 instance pricing:', error);
      return null;
    }
  }

  /**
   * Get all available instance types for a region
   */
  async getAllInstances(region: string = 'us-east-1'): Promise<EC2InstanceSpecs[]> {
    try {
      const response = await fetch(
        `https://instances.vantage.sh/instances.json`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch EC2 instances: ${response.statusText}`);
      }

      const data = await response.json();
      const instances: EC2InstanceSpecs[] = [];

      for (const instance of data) {
        const regionPricing = instance.pricing[region] || instance.pricing['us-east-1'];

        if (regionPricing && regionPricing.linux) {
          instances.push({
            instanceType: instance.instance_type,
            vcpus: instance.vCPU,
            memory: instance.memory,
            storage: instance.storage || 'EBS Only',
            networkPerformance: instance.network_performance || 'Unknown',
            pricing: {
              onDemand: {
                hourly: parseFloat(regionPricing.linux.ondemand || '0'),
                monthly: parseFloat(regionPricing.linux.ondemand || '0') * 730,
              },
              spot: regionPricing.linux.spot ? {
                hourly: parseFloat(regionPricing.linux.spot),
                monthly: parseFloat(regionPricing.linux.spot) * 730,
              } : undefined,
            },
            region,
          });
        }
      }

      return instances;
    } catch (error) {
      console.error('Error fetching all EC2 instances:', error);
      return [];
    }
  }

  /**
   * Find best matching instance for given requirements
   */
  async findBestMatch(vcpus: number, memory: number, region: string = 'us-east-1'): Promise<EC2InstanceSpecs | null> {
    const instances = await this.getAllInstances(region);

    // Filter instances that meet minimum requirements
    const matchingInstances = instances.filter(
      i => i.vcpus >= vcpus && i.memory >= memory
    );

    if (matchingInstances.length === 0) {
      return null;
    }

    // Sort by price and return cheapest
    matchingInstances.sort((a, b) =>
      a.pricing.onDemand.monthly - b.pricing.onDemand.monthly
    );

    return matchingInstances[0];
  }
}
