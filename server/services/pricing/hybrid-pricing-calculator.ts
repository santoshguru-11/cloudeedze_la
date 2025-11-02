/**
 * Hybrid Pricing Calculator
 * Uses live API data when available, falls back to static pricing
 */

import { CloudPricingAPIService } from './cloud-pricing-api.js';
import { ComprehensiveCostCalculator } from '../../utils/comprehensiveCostCalculator.js';
import { InfrastructureRequirements, CostCalculationResult } from '@shared/schema';

export class HybridPricingCalculator {
  private apiService: CloudPricingAPIService;
  private staticCalculator: ComprehensiveCostCalculator;
  private useApiPricing: boolean;

  constructor(useApiPricing: boolean = true) {
    this.apiService = new CloudPricingAPIService();
    this.staticCalculator = new ComprehensiveCostCalculator();
    this.useApiPricing = useApiPricing;
  }

  /**
   * Calculate costs using API pricing with static fallback
   */
  async calculateCosts(requirements: InfrastructureRequirements): Promise<CostCalculationResult> {
    if (!this.useApiPricing) {
      // Use static pricing only
      console.log('📊 Using static pricing data');
      return this.staticCalculator.calculateCosts(requirements);
    }

    try {
      console.log('🌐 Attempting to fetch live pricing data...');

      // Get static results as fallback
      const staticResults = this.staticCalculator.calculateCosts(requirements);

      // Try to enhance with API pricing
      const apiEnhancedResults = await this.enhanceWithApiPricing(requirements, staticResults);

      console.log('✅ Successfully fetched live pricing data');
      return apiEnhancedResults;

    } catch (error) {
      console.warn('⚠️ API pricing failed, falling back to static pricing:', error);
      return this.staticCalculator.calculateCosts(requirements);
    }
  }

  /**
   * Enhance static results with live API pricing
   */
  private async enhanceWithApiPricing(
    requirements: InfrastructureRequirements,
    staticResults: CostCalculationResult
  ): Promise<CostCalculationResult> {

    const region = requirements.compute.region || 'ap-south-1';

    // Fetch live pricing for each provider in parallel
    const [awsPricing, azurePricing, gcpPricing, ociPricing] = await Promise.allSettled([
      this.fetchAWSPricing(requirements, region),
      this.fetchAzurePricing(requirements, region),
      this.fetchGCPPricing(requirements, region),
      this.fetchOCIPricing(requirements, region)
    ]);

    // Update results with API data where available
    const enhancedProviders = staticResults.providers.map(provider => {
      let apiData: any = null;

      switch (provider.name) {
        case 'AWS':
          if (awsPricing.status === 'fulfilled' && awsPricing.value) {
            apiData = awsPricing.value;
          }
          break;
        case 'AZURE':
          if (azurePricing.status === 'fulfilled' && azurePricing.value) {
            apiData = azurePricing.value;
          }
          break;
        case 'GCP':
          if (gcpPricing.status === 'fulfilled' && gcpPricing.value) {
            apiData = gcpPricing.value;
          }
          break;
        case 'ORACLE':
          if (ociPricing.status === 'fulfilled' && ociPricing.value) {
            apiData = ociPricing.value;
          }
          break;
      }

      if (apiData) {
        // Merge API data with static data
        return {
          ...provider,
          compute: apiData.compute || provider.compute,
          storage: apiData.storage || provider.storage,
          total: (apiData.compute || provider.compute) +
                 (apiData.storage || provider.storage) +
                 provider.database +
                 provider.networking +
                 provider.licensing,
          dataSource: 'api' as const
        };
      }

      return {
        ...provider,
        dataSource: 'static' as const
      };
    });

    return {
      ...staticResults,
      providers: enhancedProviders as any,
      lastUpdated: new Date().toISOString(),
      dataSource: 'hybrid'
    };
  }

  /**
   * Fetch AWS pricing from API
   */
  private async fetchAWSPricing(requirements: InfrastructureRequirements, region: string) {
    const instanceType = this.selectAWSInstanceType(
      requirements.compute.vcpus,
      requirements.compute.ram
    );

    const computePricing = await this.apiService.fetchAWSEC2Pricing(region, instanceType);
    const storagePricing = await this.apiService.fetchStoragePricing('aws', 'block', region);

    if (!computePricing) return null;

    return {
      compute: computePricing.pricePerMonth,
      storage: (storagePricing || 0.08) * requirements.storage.blockStorage,
      instanceType,
      lastUpdated: computePricing.lastUpdated
    };
  }

  /**
   * Fetch Azure pricing from API
   */
  private async fetchAzurePricing(requirements: InfrastructureRequirements, region: string) {
    // Map region to Azure region name
    const azureRegion = this.mapToAzureRegion(region);

    const vmSize = this.selectAzureVMSize(
      requirements.compute.vcpus,
      requirements.compute.ram
    );

    const computePricing = await this.apiService.fetchAzureVMPricing(azureRegion, vmSize);
    const storagePricing = await this.apiService.fetchStoragePricing('azure', 'block', azureRegion);

    if (!computePricing) return null;

    return {
      compute: computePricing.pricePerMonth,
      storage: (storagePricing || 0.10) * requirements.storage.blockStorage,
      vmSize,
      lastUpdated: computePricing.lastUpdated
    };
  }

  /**
   * Fetch GCP pricing from API
   */
  private async fetchGCPPricing(requirements: InfrastructureRequirements, region: string) {
    const gcpRegion = this.mapToGCPRegion(region);

    const machineType = this.selectGCPMachineType(
      requirements.compute.vcpus,
      requirements.compute.ram
    );

    const computePricing = await this.apiService.fetchGCPComputePricing(gcpRegion, machineType);
    const storagePricing = await this.apiService.fetchStoragePricing('gcp', 'standard', gcpRegion);

    if (!computePricing) return null;

    return {
      compute: computePricing.pricePerMonth,
      storage: (storagePricing || 0.04) * requirements.storage.blockStorage,
      machineType,
      lastUpdated: computePricing.lastUpdated
    };
  }

  /**
   * Fetch OCI pricing
   */
  private async fetchOCIPricing(requirements: InfrastructureRequirements, region: string) {
    const shape = 'VM.Standard.E4.Flex';

    const computePricing = await this.apiService.fetchOCIPricing(region, shape);

    if (!computePricing) return null;

    return {
      compute: computePricing.pricePerMonth,
      storage: 0.0255 * requirements.storage.blockStorage, // OCI block volume pricing
      shape,
      lastUpdated: computePricing.lastUpdated
    };
  }

  /**
   * Select appropriate AWS instance type based on requirements
   */
  private selectAWSInstanceType(vcpu: number, ram: number): string {
    if (vcpu <= 2 && ram <= 4) return 't3.medium';
    if (vcpu <= 2 && ram <= 8) return 't3.large';
    if (vcpu <= 4 && ram <= 8) return 'm5.xlarge';
    if (vcpu <= 4 && ram <= 16) return 'm5.2xlarge';
    if (vcpu <= 8 && ram <= 16) return 'm5.2xlarge';
    if (vcpu <= 8 && ram <= 32) return 'm5.4xlarge';
    if (ram / vcpu > 4) return 'r5.xlarge'; // Memory-optimized
    return 'm5.xlarge';
  }

  /**
   * Select appropriate Azure VM size
   */
  private selectAzureVMSize(vcpu: number, ram: number): string {
    if (vcpu <= 2 && ram <= 4) return 'Standard_B2s';
    if (vcpu <= 2 && ram <= 8) return 'Standard_B2ms';
    if (vcpu <= 4 && ram <= 16) return 'Standard_D4s_v3';
    if (vcpu <= 8 && ram <= 32) return 'Standard_D8s_v3';
    if (ram / vcpu > 4) return 'Standard_E4s_v3'; // Memory-optimized
    return 'Standard_D4s_v3';
  }

  /**
   * Select appropriate GCP machine type
   */
  private selectGCPMachineType(vcpu: number, ram: number): string {
    if (vcpu <= 2) return 'n2-standard-2';
    if (vcpu <= 4) return 'n2-standard-4';
    if (vcpu <= 8) return 'n2-standard-8';
    if (ram / vcpu > 4) return 'n2-highmem-4'; // Memory-optimized
    return 'n2-standard-4';
  }

  /**
   * Region mapping helpers
   */
  private mapToAzureRegion(awsRegion: string): string {
    const regionMap: Record<string, string> = {
      'ap-south-1': 'centralindia',
      'us-east-1': 'eastus',
      'us-west-2': 'westus2',
      'eu-west-1': 'westeurope'
    };
    return regionMap[awsRegion] || 'centralindia';
  }

  private mapToGCPRegion(awsRegion: string): string {
    const regionMap: Record<string, string> = {
      'ap-south-1': 'asia-south1',
      'us-east-1': 'us-east1',
      'us-west-2': 'us-west2',
      'eu-west-1': 'europe-west1'
    };
    return regionMap[awsRegion] || 'asia-south1';
  }

  /**
   * Get pricing data source info
   */
  getPricingInfo(): any {
    return {
      useApiPricing: this.useApiPricing,
      cacheStats: this.apiService.getCacheStats(),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear pricing cache
   */
  clearCache(): void {
    this.apiService.clearCache();
  }
}
