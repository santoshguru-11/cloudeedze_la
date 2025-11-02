/**
 * Azure Retail Prices API Service
 * Uses Azure Retail Prices API for all Azure services
 * FREE API with no authentication required!
 */

export interface AzureServicePricing {
  service: string;
  skuName: string;
  region: string;
  price: {
    hourly?: number;
    monthly?: number;
    perGB?: number;
  };
  unit: string;
  currency: string;
  productName: string;
}

export class AzurePricingService {
  private apiBaseUrl = 'https://prices.azure.com/api/retail/prices';
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.cache = new Map();
  }

  /**
   * Get Azure VM pricing
   */
  async getVMPricing(vmSize: string, region: string): Promise<AzureServicePricing | null> {
    const cacheKey = `vm-${vmSize}-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const filter = `serviceName eq 'Virtual Machines' and armSkuName eq '${vmSize}' and armRegionName eq '${region}' and priceType eq 'Consumption'`;
      const url = `${this.apiBaseUrl}?$filter=${encodeURIComponent(filter)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        console.warn(`No pricing found for VM ${vmSize} in ${region}`);
        return null;
      }

      const item = data.Items[0];
      const pricing: AzureServicePricing = {
        service: 'Virtual Machines',
        skuName: item.armSkuName,
        region: item.armRegionName,
        price: {
          hourly: item.retailPrice,
          monthly: item.retailPrice * 730, // 730 hours per month
        },
        unit: item.unitOfMeasure,
        currency: item.currencyCode,
        productName: item.productName,
      };

      this.setCache(cacheKey, pricing);
      return pricing;
    } catch (error) {
      console.error('Error fetching Azure VM pricing:', error);
      return null;
    }
  }

  /**
   * Get Azure SQL Database pricing
   */
  async getSQLPricing(tier: string, region: string): Promise<AzureServicePricing | null> {
    const cacheKey = `sql-${tier}-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const filter = `serviceName eq 'SQL Database' and skuName eq '${tier}' and armRegionName eq '${region}' and priceType eq 'Consumption'`;
      const url = `${this.apiBaseUrl}?$filter=${encodeURIComponent(filter)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        console.warn(`No pricing found for SQL tier ${tier} in ${region}`);
        return null;
      }

      const item = data.Items[0];
      const pricing: AzureServicePricing = {
        service: 'SQL Database',
        skuName: item.skuName,
        region: item.armRegionName,
        price: {
          hourly: item.retailPrice,
          monthly: item.retailPrice * 730,
        },
        unit: item.unitOfMeasure,
        currency: item.currencyCode,
        productName: item.productName,
      };

      this.setCache(cacheKey, pricing);
      return pricing;
    } catch (error) {
      console.error('Error fetching Azure SQL pricing:', error);
      return null;
    }
  }

  /**
   * Get Azure Storage pricing
   */
  async getStoragePricing(region: string, storageType: string = 'Standard_LRS'): Promise<AzureServicePricing | null> {
    const cacheKey = `storage-${storageType}-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const filter = `serviceName eq 'Storage' and armRegionName eq '${region}' and skuName eq '${storageType}' and priceType eq 'Consumption'`;
      const url = `${this.apiBaseUrl}?$filter=${encodeURIComponent(filter)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        console.warn(`No pricing found for storage ${storageType} in ${region}`);
        return null;
      }

      const item = data.Items[0];
      const pricing: AzureServicePricing = {
        service: 'Storage',
        skuName: item.skuName,
        region: item.armRegionName,
        price: {
          perGB: item.retailPrice,
        },
        unit: item.unitOfMeasure,
        currency: item.currencyCode,
        productName: item.productName,
      };

      this.setCache(cacheKey, pricing);
      return pricing;
    } catch (error) {
      console.error('Error fetching Azure Storage pricing:', error);
      return null;
    }
  }

  /**
   * Get Azure Cosmos DB pricing
   */
  async getCosmosDBPricing(region: string): Promise<AzureServicePricing | null> {
    const cacheKey = `cosmosdb-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const filter = `serviceName eq 'Azure Cosmos DB' and armRegionName eq '${region}' and priceType eq 'Consumption'`;
      const url = `${this.apiBaseUrl}?$filter=${encodeURIComponent(filter)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        console.warn(`No pricing found for Cosmos DB in ${region}`);
        return null;
      }

      const item = data.Items[0];
      const pricing: AzureServicePricing = {
        service: 'Azure Cosmos DB',
        skuName: item.skuName,
        region: item.armRegionName,
        price: {
          hourly: item.retailPrice,
          monthly: item.retailPrice * 730,
        },
        unit: item.unitOfMeasure,
        currency: item.currencyCode,
        productName: item.productName,
      };

      this.setCache(cacheKey, pricing);
      return pricing;
    } catch (error) {
      console.error('Error fetching Azure Cosmos DB pricing:', error);
      return null;
    }
  }

  /**
   * Search for any Azure service pricing
   */
  async getServicePricing(serviceName: string, region: string, skuName?: string): Promise<AzureServicePricing[]> {
    try {
      let filter = `serviceName eq '${serviceName}' and armRegionName eq '${region}' and priceType eq 'Consumption'`;
      if (skuName) {
        filter += ` and skuName eq '${skuName}'`;
      }

      const url = `${this.apiBaseUrl}?$filter=${encodeURIComponent(filter)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        return [];
      }

      return data.Items.map((item: any) => ({
        service: item.serviceName,
        skuName: item.skuName,
        region: item.armRegionName,
        price: {
          hourly: item.retailPrice,
          monthly: item.retailPrice * 730,
          perGB: item.unitOfMeasure.includes('GB') ? item.retailPrice : undefined,
        },
        unit: item.unitOfMeasure,
        currency: item.currencyCode,
        productName: item.productName,
      }));
    } catch (error) {
      console.error('Error fetching Azure service pricing:', error);
      return [];
    }
  }

  /**
   * Get all available regions for a service
   */
  async getAvailableRegions(serviceName: string): Promise<string[]> {
    try {
      const filter = `serviceName eq '${serviceName}' and priceType eq 'Consumption'`;
      const url = `${this.apiBaseUrl}?$filter=${encodeURIComponent(filter)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Azure API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        return [];
      }

      const regions = new Set<string>();
      data.Items.forEach((item: any) => {
        if (item.armRegionName) {
          regions.add(item.armRegionName);
        }
      });

      return Array.from(regions);
    } catch (error) {
      console.error('Error fetching Azure regions:', error);
      return [];
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): AzureServicePricing | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: AzureServicePricing): void {
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
