/**
 * Cloud Pricing API Service
 * Fetches real-time pricing data from cloud provider APIs
 */

import { EC2 } from '@aws-sdk/client-ec2';
import { Pricing } from '@aws-sdk/client-pricing';

interface PricingData {
  provider: string;
  service: string;
  instanceType?: string;
  region: string;
  pricePerHour: number;
  pricePerMonth: number;
  currency: string;
  lastUpdated: Date;
}

export class CloudPricingAPIService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 3600000; // 1 hour in milliseconds

  /**
   * Fetch AWS EC2 pricing using AWS Pricing API
   */
  async fetchAWSEC2Pricing(region: string, instanceType: string): Promise<PricingData | null> {
    const cacheKey = `aws-ec2-${region}-${instanceType}`;

    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // AWS Pricing API is only available in us-east-1 and ap-south-1
      const pricing = new Pricing({ region: 'us-east-1' });

      const params = {
        ServiceCode: 'AmazonEC2',
        Filters: [
          {
            Type: 'TERM_MATCH',
            Field: 'instanceType',
            Value: instanceType
          },
          {
            Type: 'TERM_MATCH',
            Field: 'location',
            Value: this.mapAWSRegionToLocation(region)
          },
          {
            Type: 'TERM_MATCH',
            Field: 'operatingSystem',
            Value: 'Linux'
          },
          {
            Type: 'TERM_MATCH',
            Field: 'tenancy',
            Value: 'Shared'
          },
          {
            Type: 'TERM_MATCH',
            Field: 'preInstalledSw',
            Value: 'NA'
          },
          {
            Type: 'TERM_MATCH',
            Field: 'capacitystatus',
            Value: 'Used'
          }
        ],
        MaxResults: 1
      };

      const response = await pricing.getProducts(params);

      if (!response.PriceList || response.PriceList.length === 0) {
        console.warn(`No pricing data found for ${instanceType} in ${region}`);
        return null;
      }

      // Parse the pricing data
      const priceData = JSON.parse(response.PriceList[0]);
      const onDemand = priceData.terms.OnDemand;
      const firstKey = Object.keys(onDemand)[0];
      const priceDimensions = onDemand[firstKey].priceDimensions;
      const dimensionKey = Object.keys(priceDimensions)[0];
      const pricePerHour = parseFloat(priceDimensions[dimensionKey].pricePerUnit.USD);

      const result: PricingData = {
        provider: 'aws',
        service: 'ec2',
        instanceType,
        region,
        pricePerHour,
        pricePerMonth: pricePerHour * 730, // Average hours per month
        currency: 'USD',
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error fetching AWS pricing:', error);
      return null;
    }
  }

  /**
   * Fetch Azure VM pricing using Azure Rate Card API
   */
  async fetchAzureVMPricing(region: string, vmSize: string): Promise<PricingData | null> {
    const cacheKey = `azure-vm-${region}-${vmSize}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Azure Retail Prices API (no authentication required)
      const apiUrl = 'https://prices.azure.com/api/retail/prices';
      const filter = `serviceName eq 'Virtual Machines' and armRegionName eq '${region}' and armSkuName eq '${vmSize}' and priceType eq 'Consumption'`;

      const response = await fetch(`${apiUrl}?$filter=${encodeURIComponent(filter)}`);

      if (!response.ok) {
        console.error('Azure pricing API error:', response.statusText);
        return null;
      }

      const data = await response.json();

      if (!data.Items || data.Items.length === 0) {
        console.warn(`No Azure pricing data found for ${vmSize} in ${region}`);
        return null;
      }

      const pricePerHour = data.Items[0].retailPrice;

      const result: PricingData = {
        provider: 'azure',
        service: 'vm',
        instanceType: vmSize,
        region,
        pricePerHour,
        pricePerMonth: pricePerHour * 730,
        currency: data.Items[0].currencyCode || 'USD',
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error fetching Azure pricing:', error);
      return null;
    }
  }

  /**
   * Fetch GCP Compute Engine pricing using Cloud Billing API
   */
  async fetchGCPComputePricing(region: string, machineType: string): Promise<PricingData | null> {
    const cacheKey = `gcp-compute-${region}-${machineType}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // GCP Cloud Billing Catalog API
      const apiUrl = 'https://cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus';

      // Note: This requires a GCP API key
      // For now, we'll use the public catalog
      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error('GCP pricing API error:', response.statusText);
        return null;
      }

      const data = await response.json();

      // Filter for the specific machine type
      const sku = data.skus?.find((s: any) =>
        s.description.includes(machineType) &&
        s.category.resourceFamily === 'Compute' &&
        s.serviceRegions.includes(region)
      );

      if (!sku) {
        console.warn(`No GCP pricing data found for ${machineType} in ${region}`);
        return null;
      }

      // Parse pricing tiers
      const pricingInfo = sku.pricingInfo[0];
      const nanos = pricingInfo.pricingExpression.tieredRates[0].unitPrice.nanos;
      const units = pricingInfo.pricingExpression.tieredRates[0].unitPrice.units || 0;

      const pricePerHour = parseFloat(units) + (nanos / 1000000000);

      const result: PricingData = {
        provider: 'gcp',
        service: 'compute',
        instanceType: machineType,
        region,
        pricePerHour,
        pricePerMonth: pricePerHour * 730,
        currency: pricingInfo.currencyCode || 'USD',
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error fetching GCP pricing:', error);
      return null;
    }
  }

  /**
   * Fetch Oracle Cloud pricing
   */
  async fetchOCIPricing(region: string, shape: string): Promise<PricingData | null> {
    const cacheKey = `oci-${region}-${shape}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Oracle Cloud uses a different pricing model
      // For flexible shapes, pricing is per OCPU and memory

      // Note: Oracle doesn't have a public pricing API like AWS/Azure
      // We'll use their documented pricing
      const ociPricing: Record<string, { ocpu: number; memory: number }> = {
        'VM.Standard.E4.Flex': { ocpu: 0.015, memory: 0.0015 }, // per hour
        'VM.Standard.E3.Flex': { ocpu: 0.0255, memory: 0.00255 },
        'VM.Optimized3.Flex': { ocpu: 0.03, memory: 0.003 }
      };

      const pricing = ociPricing[shape];

      if (!pricing) {
        console.warn(`No OCI pricing data found for ${shape}`);
        return null;
      }

      // Assume 2 OCPU and 16GB RAM for standard calculation
      const pricePerHour = (pricing.ocpu * 2) + (pricing.memory * 16);

      const result: PricingData = {
        provider: 'oracle',
        service: 'compute',
        instanceType: shape,
        region,
        pricePerHour,
        pricePerMonth: pricePerHour * 730,
        currency: 'USD',
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      console.error('Error fetching OCI pricing:', error);
      return null;
    }
  }

  /**
   * Fetch storage pricing
   */
  async fetchStoragePricing(provider: string, storageType: string, region: string): Promise<number | null> {
    const cacheKey = `${provider}-storage-${storageType}-${region}`;

    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      switch (provider) {
        case 'aws':
          return await this.fetchAWSStoragePricing(storageType, region);
        case 'azure':
          return await this.fetchAzureStoragePricing(storageType, region);
        case 'gcp':
          return await this.fetchGCPStoragePricing(storageType, region);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error fetching ${provider} storage pricing:`, error);
      return null;
    }
  }

  private async fetchAWSStoragePricing(storageType: string, region: string): Promise<number | null> {
    try {
      const pricing = new Pricing({ region: 'us-east-1' });

      const serviceCode = storageType === 'object' ? 'AmazonS3' : 'AmazonEBS';

      const params = {
        ServiceCode: serviceCode,
        Filters: [
          {
            Type: 'TERM_MATCH',
            Field: 'location',
            Value: this.mapAWSRegionToLocation(region)
          },
          {
            Type: 'TERM_MATCH',
            Field: 'volumeApiName',
            Value: storageType === 'block' ? 'gp3' : undefined
          }
        ].filter(f => f.Value !== undefined),
        MaxResults: 1
      };

      const response = await pricing.getProducts(params);

      if (!response.PriceList || response.PriceList.length === 0) {
        return null;
      }

      const priceData = JSON.parse(response.PriceList[0]);
      const onDemand = priceData.terms.OnDemand;
      const firstKey = Object.keys(onDemand)[0];
      const priceDimensions = onDemand[firstKey].priceDimensions;
      const dimensionKey = Object.keys(priceDimensions)[0];
      const pricePerGB = parseFloat(priceDimensions[dimensionKey].pricePerUnit.USD);

      return pricePerGB;

    } catch (error) {
      console.error('Error fetching AWS storage pricing:', error);
      return null;
    }
  }

  private async fetchAzureStoragePricing(storageType: string, region: string): Promise<number | null> {
    try {
      const apiUrl = 'https://prices.azure.com/api/retail/prices';
      const serviceName = storageType === 'object' ? 'Storage' : 'Storage';
      const filter = `serviceName eq '${serviceName}' and armRegionName eq '${region}'`;

      const response = await fetch(`${apiUrl}?$filter=${encodeURIComponent(filter)}`);

      if (!response.ok) return null;

      const data = await response.json();

      if (!data.Items || data.Items.length === 0) return null;

      return data.Items[0].retailPrice;

    } catch (error) {
      console.error('Error fetching Azure storage pricing:', error);
      return null;
    }
  }

  private async fetchGCPStoragePricing(storageType: string, region: string): Promise<number | null> {
    // GCP storage pricing is relatively stable
    // For production, integrate with Cloud Billing API
    const gcpStoragePricing: Record<string, number> = {
      'standard': 0.020,
      'nearline': 0.010,
      'coldline': 0.004,
      'archive': 0.0012
    };

    return gcpStoragePricing[storageType] || 0.020;
  }

  /**
   * Map AWS region code to location name
   */
  private mapAWSRegionToLocation(region: string): string {
    const regionMap: Record<string, string> = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'eu-west-1': 'EU (Ireland)',
      'eu-central-1': 'EU (Frankfurt)'
    };

    return regionMap[region] || 'US East (N. Virginia)';
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
