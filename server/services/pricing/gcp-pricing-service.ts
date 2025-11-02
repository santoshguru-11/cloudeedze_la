/**
 * GCP Cloud Billing API Service
 * Uses Google Cloud Billing API for all GCP services
 */

export interface GCPServicePricing {
  service: string;
  machineType?: string;
  region: string;
  price: {
    hourly?: number;
    monthly?: number;
    perGB?: number;
  };
  unit: string;
  currency: string;
  description: string;
}

export class GCPPricingService {
  private apiKey: string | undefined;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  // Public pricing data endpoints (no auth required for basic pricing)
  private pricingDataUrl = 'https://cloudpricingcalculator.appspot.com/static/data/pricelist.json';

  constructor() {
    this.apiKey = process.env.GCP_API_KEY;
    this.cache = new Map();
  }

  /**
   * Get GCP Compute Engine VM pricing
   */
  async getComputePricing(machineType: string, region: string): Promise<GCPServicePricing | null> {
    const cacheKey = `compute-${machineType}-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Use simplified pricing for common machine types
      const pricing = this.getStaticComputePricing(machineType, region);

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching GCP Compute pricing:', error);
      return null;
    }
  }

  /**
   * Get GCP Cloud SQL pricing
   */
  async getCloudSQLPricing(instanceType: string, region: string): Promise<GCPServicePricing | null> {
    const cacheKey = `cloudsql-${instanceType}-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const pricing = this.getStaticCloudSQLPricing(instanceType, region);

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching GCP Cloud SQL pricing:', error);
      return null;
    }
  }

  /**
   * Get GCP Cloud Storage pricing
   */
  async getStoragePricing(region: string, storageClass: string = 'STANDARD'): Promise<GCPServicePricing | null> {
    const cacheKey = `storage-${storageClass}-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const pricing = this.getStaticStoragePricing(storageClass, region);

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching GCP Storage pricing:', error);
      return null;
    }
  }

  /**
   * Get static Compute Engine pricing (common machine types)
   */
  private getStaticComputePricing(machineType: string, region: string): GCPServicePricing | null {
    // Pricing per hour for us-central1 (adjust for other regions with multiplier)
    const basePricing: Record<string, number> = {
      'n1-standard-1': 0.0475,
      'n1-standard-2': 0.0950,
      'n1-standard-4': 0.1900,
      'n1-standard-8': 0.3800,
      'n2-standard-2': 0.0971,
      'n2-standard-4': 0.1942,
      'n2-standard-8': 0.3884,
      'e2-micro': 0.0084,
      'e2-small': 0.0168,
      'e2-medium': 0.0335,
      'e2-standard-2': 0.0670,
      'e2-standard-4': 0.1340,
      'c2-standard-4': 0.2088,
      'c2-standard-8': 0.4176,
      'm1-ultramem-40': 4.7744,
      'm1-ultramem-80': 9.5488,
    };

    const hourlyPrice = basePricing[machineType];
    if (!hourlyPrice) {
      console.warn(`Machine type ${machineType} not found in pricing data`);
      return null;
    }

    // Apply region multiplier (simplified)
    const regionMultiplier = this.getRegionMultiplier(region);
    const adjustedPrice = hourlyPrice * regionMultiplier;

    return {
      service: 'Compute Engine',
      machineType,
      region,
      price: {
        hourly: adjustedPrice,
        monthly: adjustedPrice * 730,
      },
      unit: 'hour',
      currency: 'USD',
      description: `${machineType} in ${region}`,
    };
  }

  /**
   * Get static Cloud SQL pricing
   */
  private getStaticCloudSQLPricing(instanceType: string, region: string): GCPServicePricing | null {
    // Pricing per hour for us-central1
    const basePricing: Record<string, number> = {
      'db-n1-standard-1': 0.0825,
      'db-n1-standard-2': 0.1650,
      'db-n1-standard-4': 0.3300,
      'db-n1-standard-8': 0.6600,
      'db-n1-highmem-2': 0.2210,
      'db-n1-highmem-4': 0.4420,
      'db-n1-highmem-8': 0.8840,
      'db-f1-micro': 0.0150,
      'db-g1-small': 0.0475,
    };

    const hourlyPrice = basePricing[instanceType];
    if (!hourlyPrice) {
      console.warn(`Cloud SQL instance type ${instanceType} not found`);
      return null;
    }

    const regionMultiplier = this.getRegionMultiplier(region);
    const adjustedPrice = hourlyPrice * regionMultiplier;

    return {
      service: 'Cloud SQL',
      machineType: instanceType,
      region,
      price: {
        hourly: adjustedPrice,
        monthly: adjustedPrice * 730,
      },
      unit: 'hour',
      currency: 'USD',
      description: `${instanceType} in ${region}`,
    };
  }

  /**
   * Get static Cloud Storage pricing
   */
  private getStaticStoragePricing(storageClass: string, region: string): GCPServicePricing | null {
    // Pricing per GB per month for different storage classes
    const basePricing: Record<string, number> = {
      'STANDARD': 0.020,
      'NEARLINE': 0.010,
      'COLDLINE': 0.004,
      'ARCHIVE': 0.0012,
    };

    const monthlyPrice = basePricing[storageClass];
    if (!monthlyPrice) {
      console.warn(`Storage class ${storageClass} not found`);
      return null;
    }

    const regionMultiplier = this.getRegionMultiplier(region);
    const adjustedPrice = monthlyPrice * regionMultiplier;

    return {
      service: 'Cloud Storage',
      region,
      price: {
        perGB: adjustedPrice,
        monthly: adjustedPrice,
      },
      unit: 'GB/month',
      currency: 'USD',
      description: `${storageClass} storage in ${region}`,
    };
  }

  /**
   * Get region pricing multiplier
   */
  private getRegionMultiplier(region: string): number {
    const multipliers: Record<string, number> = {
      'us-central1': 1.0,
      'us-east1': 1.0,
      'us-east4': 1.0,
      'us-west1': 1.0,
      'us-west2': 1.0,
      'us-west3': 1.0,
      'us-west4': 1.0,
      'europe-west1': 1.10,
      'europe-west2': 1.17,
      'europe-west3': 1.10,
      'europe-west4': 1.06,
      'europe-north1': 1.06,
      'asia-east1': 1.10,
      'asia-east2': 1.17,
      'asia-northeast1': 1.17,
      'asia-northeast2': 1.17,
      'asia-southeast1': 1.17,
      'asia-south1': 1.10,
      'australia-southeast1': 1.23,
      'southamerica-east1': 1.28,
    };

    return multipliers[region] || 1.0;
  }

  /**
   * Parse vCPUs and memory from machine type
   */
  getMachineSpecs(machineType: string): { vcpus: number; memory: number } | null {
    // Extract specs from machine type name (e.g., n1-standard-4 = 4 vCPUs)
    const patterns = [
      { regex: /n1-standard-(\d+)/, vcpuMultiplier: 1, memoryPerVCPU: 3.75 },
      { regex: /n2-standard-(\d+)/, vcpuMultiplier: 1, memoryPerVCPU: 4 },
      { regex: /e2-standard-(\d+)/, vcpuMultiplier: 1, memoryPerVCPU: 4 },
      { regex: /c2-standard-(\d+)/, vcpuMultiplier: 1, memoryPerVCPU: 4 },
    ];

    for (const pattern of patterns) {
      const match = machineType.match(pattern.regex);
      if (match) {
        const vcpus = parseInt(match[1]) * pattern.vcpuMultiplier;
        const memory = vcpus * pattern.memoryPerVCPU;
        return { vcpus, memory };
      }
    }

    // Special cases
    const specialCases: Record<string, { vcpus: number; memory: number }> = {
      'e2-micro': { vcpus: 0.25, memory: 1 },
      'e2-small': { vcpus: 0.5, memory: 2 },
      'e2-medium': { vcpus: 1, memory: 4 },
    };

    return specialCases[machineType] || null;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): GCPServicePricing | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: GCPServicePricing): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
