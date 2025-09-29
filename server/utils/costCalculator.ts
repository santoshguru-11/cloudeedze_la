import { InfrastructureRequirements, CloudProvider, CostCalculationResult } from "@shared/schema";
import pricingData from "../data/pricing.json";

export class CostCalculator {
  private pricing = pricingData;

  calculateCosts(requirements: InfrastructureRequirements): CostCalculationResult {
    const providers = ['aws', 'azure', 'gcp', 'oracle'] as const;
    const results: CloudProvider[] = [];

    // Calculate region multiplier
    const regionMultiplier = this.pricing.regions[requirements.compute.region as keyof typeof this.pricing.regions]?.multiplier || 1.0;

    for (const provider of providers) {
      const compute = this.calculateCompute(provider, requirements) * regionMultiplier;
      const storage = this.calculateStorage(provider, requirements);
      const database = this.calculateDatabase(provider, requirements) * regionMultiplier;
      const networking = this.calculateNetworking(provider, requirements);
      
      const total = compute + storage + database + networking;

      results.push({
        name: provider.toUpperCase(),
        compute: Math.round(compute * 100) / 100,
        storage: Math.round(storage * 100) / 100,
        database: Math.round(database * 100) / 100,
        networking: Math.round(networking * 100) / 100,
        total: Math.round(total * 100) / 100,
      });
    }

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

  private calculateCompute(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.compute[provider as keyof typeof this.pricing.compute];
    const instancePricing = pricing[req.compute.instanceType];
    
    const vcpuCost = req.compute.vcpus * instancePricing.vcpu * 24 * 30;
    const ramCost = req.compute.ram * instancePricing.ram * 24 * 30;
    
    return vcpuCost + ramCost;
  }

  private calculateStorage(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.storage[provider as keyof typeof this.pricing.storage];
    return req.storage.size * pricing[req.storage.type];
  }

  private calculateDatabase(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.database[provider as keyof typeof this.pricing.database];
    return req.database.size * pricing[req.database.engine];
  }

  private calculateNetworking(provider: string, req: InfrastructureRequirements): number {
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
}
