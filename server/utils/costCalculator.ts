import { InfrastructureRequirements, CloudProvider, CostCalculationResult } from "@shared/schema";
import pricingData from "../data/pricing.json";
import { UnifiedPricingService } from "../services/pricing/unified-pricing-service";

export class CostCalculator {
  private pricing = pricingData;
  private pricingService: UnifiedPricingService;
  private useRealTimePricing: boolean;

  constructor(useRealTimePricing: boolean = true) {
    this.useRealTimePricing = useRealTimePricing && !!process.env.AWS_ACCESS_KEY_ID;

    if (this.useRealTimePricing) {
      this.pricingService = new UnifiedPricingService({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      });
      console.log('✅ Cost calculator initialized with real-time pricing APIs');
    } else {
      console.log('⚠️ Cost calculator using static pricing (AWS credentials not configured)');
    }
  }

  async calculateCosts(requirements: InfrastructureRequirements): Promise<CostCalculationResult> {
    const providers = ['aws', 'azure', 'gcp', 'oracle'] as const;
    const results: CloudProvider[] = [];

    // BACKWARD COMPATIBILITY: Convert old format (compute as object) to new format (compute as array)
    if (!Array.isArray(requirements.compute)) {
      console.log('⚠️ Converting old compute format (object) to new format (array)');
      requirements = {
        ...requirements,
        compute: [requirements.compute as any]
      };
    }

    // Calculate region multiplier for fallback static pricing (use first compute config's region)
    const primaryRegion = requirements.compute[0]?.region || 'us-east-1';
    const regionMultiplier = this.pricing.regions[primaryRegion as keyof typeof this.pricing.regions]?.multiplier || 1.0;

    // Calculate costs for each provider (in parallel)
    const providerCalculations = await Promise.all(
      providers.map(async (provider) => {
        try {
          const compute = await this.calculateCompute(provider, requirements, regionMultiplier);
          const storage = await this.calculateStorage(provider, requirements);
          const database = await this.calculateDatabase(provider, requirements, regionMultiplier);
          const networking = await this.calculateNetworking(provider, requirements);

          const total = compute + storage + database + networking;

          return {
            name: provider.toUpperCase(),
            compute: Math.round(compute * 100) / 100,
            storage: Math.round(storage * 100) / 100,
            database: Math.round(database * 100) / 100,
            networking: Math.round(networking * 100) / 100,
            total: Math.round(total * 100) / 100,
          };
        } catch (error) {
          console.error(`Error calculating costs for ${provider}:`, error);
          // Return fallback calculation
          return this.calculateProviderFallback(provider, requirements, regionMultiplier);
        }
      })
    );

    results.push(...providerCalculations);

    // Sort by total cost
    results.sort((a, b) => a.total - b.total);

    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];
    const potentialSavings = Math.round((mostExpensive.total - cheapest.total) * 100) / 100;

    // Calculate multi-cloud optimization
    const multiCloudOption = this.calculateMultiCloudOptimization(results);

    return {
      providers: results,
      cheapest,
      mostExpensive,
      potentialSavings,
      multiCloudOption,
      recommendations: {
        singleCloud: `${cheapest.name} offers the best overall value at $${cheapest.total}/month with competitive pricing across all services`,
        multiCloud: `Hybrid approach could save an additional $${Math.round((cheapest.total - multiCloudOption.cost) * 100) / 100}/month by optimizing service placement`
      }
    };
  }

  private async calculateCompute(
    provider: string,
    req: InfrastructureRequirements,
    regionMultiplier: number
  ): Promise<number> {
    let totalComputeCost = 0;

    // Loop through all compute configurations
    for (const computeConfig of req.compute) {
      const instances = computeConfig.instances || 1;

      // Try real-time pricing first (but skip if credentials are failing)
      if (this.useRealTimePricing && provider !== 'oracle') {
        try {
          const pricing = await this.pricingService.getComputePricing(
            provider as 'aws' | 'azure' | 'gcp',
            this.getInstanceTypeForProvider(provider, computeConfig),
            this.getRegionForProvider(provider, computeConfig)
          );

          if (pricing && pricing.pricing.monthly) {
            const configCost = pricing.pricing.monthly * instances;
            console.log(`✅ ${provider.toUpperCase()} compute (${instances}x): $${configCost}/month (real-time pricing)`);
            totalComputeCost += configCost;
            continue;
          } else {
            console.log(`⚠️ ${provider.toUpperCase()} real-time pricing returned null, using static pricing`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to get real-time pricing for ${provider}, falling back to static:`, error.message || error);
        }
      }

      // Fallback to static pricing for this config
      const configCost = this.calculateComputeStaticForConfig(provider, computeConfig, regionMultiplier);
      console.log(`📊 ${provider.toUpperCase()} compute (${instances}x): $${configCost}/month per instance (static pricing, ${computeConfig.vcpus} vCPUs, ${computeConfig.ram}GB RAM)`);
      totalComputeCost += configCost * instances;
    }

    return totalComputeCost;
  }

  private calculateComputeStatic(
    provider: string,
    req: InfrastructureRequirements,
    regionMultiplier: number
  ): number {
    let totalComputeCost = 0;

    // Loop through all compute configurations
    for (const computeConfig of req.compute) {
      const instances = computeConfig.instances || 1;
      const configCost = this.calculateComputeStaticForConfig(provider, computeConfig, regionMultiplier);
      totalComputeCost += configCost * instances;
    }

    return totalComputeCost;
  }

  private calculateComputeStaticForConfig(
    provider: string,
    computeConfig: InfrastructureRequirements['compute'][0],
    regionMultiplier: number
  ): number {
    const pricing = this.pricing.compute[provider as keyof typeof this.pricing.compute];
    const instancePricing = pricing[computeConfig.instanceType];

    const vcpuCost = computeConfig.vcpus * instancePricing.vcpu * 24 * 30;
    const ramCost = computeConfig.ram * instancePricing.ram * 24 * 30;

    return (vcpuCost + ramCost) * regionMultiplier;
  }

  private async calculateStorage(provider: string, req: InfrastructureRequirements): Promise<number> {
    // Try real-time pricing first
    if (this.useRealTimePricing && provider !== 'oracle') {
      try {
        const pricing = await this.pricingService.getStoragePricing(
          provider as 'aws' | 'azure' | 'gcp',
          this.getRegionForProvider(provider, req),
          req.storage.type
        );

        if (pricing && pricing.pricing.perGB) {
          const monthlyCost = req.storage.size * pricing.pricing.perGB;
          console.log(`✅ ${provider.toUpperCase()} storage: $${monthlyCost}/month (real-time pricing)`);
          return monthlyCost;
        }
      } catch (error) {
        console.warn(`Failed to get real-time storage pricing for ${provider}, falling back to static`);
      }
    }

    // Fallback to static pricing
    const pricing = this.pricing.storage[provider as keyof typeof this.pricing.storage];
    return req.storage.size * pricing[req.storage.type];
  }

  private async calculateDatabase(
    provider: string,
    req: InfrastructureRequirements,
    regionMultiplier: number
  ): Promise<number> {
    // Try real-time pricing first
    if (this.useRealTimePricing && provider !== 'oracle') {
      try {
        const pricing = await this.pricingService.getDatabasePricing(
          provider as 'aws' | 'azure' | 'gcp',
          this.getDatabaseInstanceType(provider, req),
          this.getRegionForProvider(provider, req),
          req.database.engine
        );

        if (pricing && pricing.pricing.monthly) {
          console.log(`✅ ${provider.toUpperCase()} database: $${pricing.pricing.monthly}/month (real-time pricing)`);
          return pricing.pricing.monthly;
        }
      } catch (error) {
        console.warn(`Failed to get real-time database pricing for ${provider}, falling back to static`);
      }
    }

    // Fallback to static pricing
    const pricing = this.pricing.database[provider as keyof typeof this.pricing.database];
    return req.database.size * pricing[req.database.engine] * regionMultiplier;
  }

  private async calculateNetworking(provider: string, req: InfrastructureRequirements): Promise<number> {
    // Networking still uses static pricing (no real-time API available)
    const pricing = this.pricing.networking[provider as keyof typeof this.pricing.networking];
    const bandwidthCost = req.networking.bandwidth * pricing.bandwidth;
    const loadBalancerCost = pricing.load_balancer[req.networking.loadBalancer];

    return bandwidthCost + loadBalancerCost;
  }

  private calculateMultiCloudOptimization(providers: CloudProvider[]): { cost: number; breakdown: Record<string, string> } {
    // Find cheapest option for each service
    const cheapestCompute = providers.reduce((min, p) => p.compute < min.compute ? p : min);
    const cheapestStorage = providers.reduce((min, p) => p.storage < min.storage ? p : min);
    const cheapestDatabase = providers.reduce((min, p) => p.database < min.database ? p : min);
    const cheapestNetworking = providers.reduce((min, p) => p.networking < min.networking ? p : min);

    const totalCost = cheapestCompute.compute + cheapestStorage.storage +
                     cheapestDatabase.database + cheapestNetworking.networking;

    return {
      cost: Math.round(totalCost * 100) / 100,
      breakdown: {
        compute: cheapestCompute.name,
        storage: cheapestStorage.name,
        database: cheapestDatabase.name,
        networking: cheapestNetworking.name
      }
    };
  }

  /**
   * Helper: Get instance type for specific provider
   */
  private getInstanceTypeForProvider(provider: string, computeConfig: InfrastructureRequirements['compute'][0]): string {
    // Map generic instance type to provider-specific
    switch (provider) {
      case 'aws':
        return computeConfig.instanceType === 'standard' ? 't3.medium' :
               computeConfig.instanceType === 'memory-optimized' ? 'r5.large' : 't3.medium';
      case 'azure':
        return computeConfig.instanceType === 'standard' ? 'Standard_D2s_v3' :
               computeConfig.instanceType === 'memory-optimized' ? 'Standard_E2s_v3' : 'Standard_D2s_v3';
      case 'gcp':
        return computeConfig.instanceType === 'standard' ? 'n1-standard-2' :
               computeConfig.instanceType === 'memory-optimized' ? 'n1-highmem-2' : 'n1-standard-2';
      default:
        return 't3.medium';
    }
  }

  /**
   * Helper: Get database instance type for specific provider
   */
  private getDatabaseInstanceType(provider: string, req: InfrastructureRequirements): string {
    switch (provider) {
      case 'aws':
        return 'db.t3.medium';
      case 'azure':
        return 'S0'; // Basic tier
      case 'gcp':
        return 'db-n1-standard-1';
      default:
        return 'db.t3.medium';
    }
  }

  /**
   * Helper: Get region for specific provider
   */
  private getRegionForProvider(provider: string, computeConfig: InfrastructureRequirements['compute'][0]): string {
    const region = computeConfig.region;

    switch (provider) {
      case 'azure':
        // Map AWS regions to Azure regions
        const azureRegionMap: Record<string, string> = {
          'us-east-1': 'eastus',
          'us-west-1': 'westus',
          'us-west-2': 'westus2',
          'eu-west-1': 'westeurope',
          'ap-southeast-1': 'southeastasia',
        };
        return azureRegionMap[region] || 'eastus';

      case 'gcp':
        // Map AWS regions to GCP regions
        const gcpRegionMap: Record<string, string> = {
          'us-east-1': 'us-east1',
          'us-west-1': 'us-west1',
          'us-west-2': 'us-west2',
          'eu-west-1': 'europe-west1',
          'ap-southeast-1': 'asia-southeast1',
        };
        return gcpRegionMap[region] || 'us-central1';

      default:
        return region;
    }
  }

  /**
   * Fallback calculation using static pricing
   */
  private calculateProviderFallback(
    provider: string,
    requirements: InfrastructureRequirements,
    regionMultiplier: number
  ): CloudProvider {
    const compute = this.calculateComputeStatic(provider, requirements, regionMultiplier);
    const storage = requirements.storage.size * this.pricing.storage[provider as keyof typeof this.pricing.storage][requirements.storage.type];
    const database = requirements.database.size * this.pricing.database[provider as keyof typeof this.pricing.database][requirements.database.engine] * regionMultiplier;
    const networking = requirements.networking.bandwidth * this.pricing.networking[provider as keyof typeof this.pricing.networking].bandwidth +
                      this.pricing.networking[provider as keyof typeof this.pricing.networking].load_balancer[requirements.networking.loadBalancer];

    const total = compute + storage + database + networking;

    return {
      name: provider.toUpperCase(),
      compute: Math.round(compute * 100) / 100,
      storage: Math.round(storage * 100) / 100,
      database: Math.round(database * 100) / 100,
      networking: Math.round(networking * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Clear pricing cache
   */
  clearCache(): void {
    if (this.pricingService) {
      this.pricingService.clearAllCaches();
      console.log('✅ Pricing cache cleared');
    }
  }
}
