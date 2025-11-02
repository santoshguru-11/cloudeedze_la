/**
 * AWS Pricing API Service
 * Uses AWS Pricing API for RDS, S3, Lambda, and other AWS services
 */

import AWS from 'aws-sdk';

export interface AWSServicePricing {
  service: string;
  instanceType?: string;
  region: string;
  price: {
    hourly?: number;
    monthly?: number;
    perGB?: number;
    perRequest?: number;
  };
  unit: string;
  description: string;
}

export class AWSPricingService {
  private pricing: AWS.Pricing;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  constructor(credentials?: { accessKeyId: string; secretAccessKey: string }) {
    // AWS Pricing API is only available in us-east-1
    this.pricing = new AWS.Pricing({
      region: 'us-east-1',
      ...(credentials && {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
      }),
    });
    this.cache = new Map();
  }

  /**
   * Get RDS instance pricing
   */
  async getRDSPricing(instanceType: string, region: string, engine: string = 'MySQL'): Promise<AWSServicePricing | null> {
    const cacheKey = `rds-${instanceType}-${region}-${engine}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = {
        ServiceCode: 'AmazonRDS',
        Filters: [
          {
            Type: 'TERM_MATCH',
            Field: 'instanceType',
            Value: instanceType,
          },
          {
            Type: 'TERM_MATCH',
            Field: 'location',
            Value: this.regionToLocation(region),
          },
          {
            Type: 'TERM_MATCH',
            Field: 'databaseEngine',
            Value: engine,
          },
          {
            Type: 'TERM_MATCH',
            Field: 'deploymentOption',
            Value: 'Single-AZ',
          },
        ],
      };

      const response = await this.pricing.getProducts(params).promise();
      const pricing = this.parseAWSPricingResponse(response, 'RDS');

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching RDS pricing:', error);
      return null;
    }
  }

  /**
   * Get S3 storage pricing
   */
  async getS3Pricing(region: string, storageClass: string = 'Standard'): Promise<AWSServicePricing | null> {
    const cacheKey = `s3-${region}-${storageClass}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = {
        ServiceCode: 'AmazonS3',
        Filters: [
          {
            Type: 'TERM_MATCH',
            Field: 'location',
            Value: this.regionToLocation(region),
          },
          {
            Type: 'TERM_MATCH',
            Field: 'storageClass',
            Value: storageClass,
          },
          {
            Type: 'TERM_MATCH',
            Field: 'productFamily',
            Value: 'Storage',
          },
        ],
      };

      const response = await this.pricing.getProducts(params).promise();
      const pricing = this.parseAWSPricingResponse(response, 'S3');

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching S3 pricing:', error);
      return null;
    }
  }

  /**
   * Get Lambda pricing
   */
  async getLambdaPricing(region: string): Promise<AWSServicePricing | null> {
    const cacheKey = `lambda-${region}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = {
        ServiceCode: 'AWSLambda',
        Filters: [
          {
            Type: 'TERM_MATCH',
            Field: 'location',
            Value: this.regionToLocation(region),
          },
          {
            Type: 'TERM_MATCH',
            Field: 'group',
            Value: 'AWS-Lambda-Duration',
          },
        ],
      };

      const response = await this.pricing.getProducts(params).promise();
      const pricing = this.parseAWSPricingResponse(response, 'Lambda');

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching Lambda pricing:', error);
      return null;
    }
  }

  /**
   * Get EBS volume pricing
   */
  async getEBSPricing(region: string, volumeType: string = 'gp3'): Promise<AWSServicePricing | null> {
    const cacheKey = `ebs-${region}-${volumeType}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = {
        ServiceCode: 'AmazonEC2',
        Filters: [
          {
            Type: 'TERM_MATCH',
            Field: 'location',
            Value: this.regionToLocation(region),
          },
          {
            Type: 'TERM_MATCH',
            Field: 'productFamily',
            Value: 'Storage',
          },
          {
            Type: 'TERM_MATCH',
            Field: 'volumeApiName',
            Value: volumeType,
          },
        ],
      };

      const response = await this.pricing.getProducts(params).promise();
      const pricing = this.parseAWSPricingResponse(response, 'EBS');

      if (pricing) {
        this.setCache(cacheKey, pricing);
      }

      return pricing;
    } catch (error) {
      console.error('Error fetching EBS pricing:', error);
      return null;
    }
  }

  /**
   * Parse AWS Pricing API response
   */
  private parseAWSPricingResponse(response: AWS.Pricing.GetProductsResponse, service: string): AWSServicePricing | null {
    if (!response.PriceList || response.PriceList.length === 0) {
      return null;
    }

    try {
      const priceItem = JSON.parse(response.PriceList[0]);
      const terms = priceItem.terms?.OnDemand;

      if (!terms) return null;

      const termKey = Object.keys(terms)[0];
      const priceDimensions = terms[termKey]?.priceDimensions;

      if (!priceDimensions) return null;

      const dimensionKey = Object.keys(priceDimensions)[0];
      const pricePerUnit = priceDimensions[dimensionKey]?.pricePerUnit?.USD;

      if (!pricePerUnit) return null;

      const hourlyPrice = parseFloat(pricePerUnit);

      return {
        service,
        instanceType: priceItem.product?.attributes?.instanceType,
        region: priceItem.product?.attributes?.location,
        price: {
          hourly: hourlyPrice,
          monthly: hourlyPrice * 730, // 730 hours per month average
          perGB: hourlyPrice, // For storage services
        },
        unit: priceDimensions[dimensionKey]?.unit || 'Hrs',
        description: priceDimensions[dimensionKey]?.description || '',
      };
    } catch (error) {
      console.error('Error parsing AWS pricing response:', error);
      return null;
    }
  }

  /**
   * Convert AWS region code to location name
   */
  private regionToLocation(region: string): string {
    const regionMap: Record<string, string> = {
      'us-east-1': 'US East (N. Virginia)',
      'us-east-2': 'US East (Ohio)',
      'us-west-1': 'US West (N. California)',
      'us-west-2': 'US West (Oregon)',
      'eu-west-1': 'EU (Ireland)',
      'eu-west-2': 'EU (London)',
      'eu-west-3': 'EU (Paris)',
      'eu-central-1': 'EU (Frankfurt)',
      'ap-south-1': 'Asia Pacific (Mumbai)',
      'ap-southeast-1': 'Asia Pacific (Singapore)',
      'ap-southeast-2': 'Asia Pacific (Sydney)',
      'ap-northeast-1': 'Asia Pacific (Tokyo)',
      'ap-northeast-2': 'Asia Pacific (Seoul)',
      'ca-central-1': 'Canada (Central)',
      'sa-east-1': 'South America (Sao Paulo)',
    };

    return regionMap[region] || region;
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): AWSServicePricing | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: AWSServicePricing): void {
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
