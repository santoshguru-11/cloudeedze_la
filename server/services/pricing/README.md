# Cloud Pricing Services

Comprehensive multi-cloud pricing integration for CloudEdze using official cloud provider APIs and ec2instances.info.

## Overview

This module provides real-time pricing data for:
- **AWS**: EC2 (via ec2instances.info) + All other services (via AWS Pricing API)
- **Azure**: All services (via Azure Retail Prices API - FREE, no auth required)
- **GCP**: All services (via static pricing data)

## Services

### 1. EC2 Instances Pricing Service
Fast and accurate AWS EC2 instance pricing using ec2instances.info data.

```typescript
import { EC2InstancesPricingService } from './pricing';

const ec2Pricing = new EC2InstancesPricingService();

// Get specific instance pricing
const pricing = await ec2Pricing.getInstancePricing('t3.medium', 'us-east-1');
console.log(pricing.pricing.onDemand.monthly); // Monthly cost

// Find best match for requirements
const bestMatch = await ec2Pricing.findBestMatch(2, 8, 'us-east-1'); // 2 vCPUs, 8 GB RAM
```

### 2. AWS Pricing Service
Official AWS Pricing API for RDS, S3, Lambda, EBS, and other AWS services.

```typescript
import { AWSPricingService } from './pricing';

const awsPricing = new AWSPricingService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Get RDS pricing
const rdsPricing = await awsPricing.getRDSPricing('db.t3.medium', 'us-east-1', 'MySQL');

// Get S3 pricing
const s3Pricing = await awsPricing.getS3Pricing('us-east-1', 'Standard');

// Get Lambda pricing
const lambdaPricing = await awsPricing.getLambdaPricing('us-east-1');

// Get EBS volume pricing
const ebsPricing = await awsPricing.getEBSPricing('us-east-1', 'gp3');
```

### 3. Azure Pricing Service
Azure Retail Prices API - **FREE with no authentication required!**

```typescript
import { AzurePricingService } from './pricing';

const azurePricing = new AzurePricingService();

// Get VM pricing
const vmPricing = await azurePricing.getVMPricing('Standard_D2s_v3', 'eastus');

// Get SQL Database pricing
const sqlPricing = await azurePricing.getSQLPricing('S0', 'eastus');

// Get Storage pricing
const storagePricing = await azurePricing.getStoragePricing('eastus', 'Standard_LRS');

// Search any service
const services = await azurePricing.getServicePricing('Virtual Machines', 'eastus');
```

### 4. GCP Pricing Service
Google Cloud Platform pricing using static data.

```typescript
import { GCPPricingService } from './pricing';

const gcpPricing = new GCPPricingService();

// Get Compute Engine pricing
const computePricing = await gcpPricing.getComputePricing('n1-standard-2', 'us-central1');

// Get Cloud SQL pricing
const cloudSQLPricing = await gcpPricing.getCloudSQLPricing('db-n1-standard-1', 'us-central1');

// Get Cloud Storage pricing
const storagePricing = await gcpPricing.getStoragePricing('us-central1', 'STANDARD');

// Get machine specs
const specs = gcpPricing.getMachineSpecs('n1-standard-4'); // { vcpus: 4, memory: 15 }
```

### 5. Unified Pricing Service (Recommended)
Single interface for all cloud providers.

```typescript
import { UnifiedPricingService } from './pricing';

const pricing = new UnifiedPricingService({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Get compute pricing for any provider
const awsCompute = await pricing.getComputePricing('aws', 't3.medium', 'us-east-1');
const azureCompute = await pricing.getComputePricing('azure', 'Standard_D2s_v3', 'eastus');
const gcpCompute = await pricing.getComputePricing('gcp', 'n1-standard-2', 'us-central1');

// Get database pricing for any provider
const awsDatabase = await pricing.getDatabasePricing('aws', 'db.t3.medium', 'us-east-1', 'MySQL');
const azureDatabase = await pricing.getDatabasePricing('azure', 'S0', 'eastus');
const gcpDatabase = await pricing.getDatabasePricing('gcp', 'db-n1-standard-1', 'us-central1');

// Compare pricing across all providers
const comparison = await pricing.comparePricing(4, 16, 'us-east-1'); // 4 vCPUs, 16 GB RAM
comparison.forEach(result => {
  console.log(`${result.provider}: $${result.pricing.monthly}/month`);
});
```

## Environment Variables

Add these to your `.env` file:

```bash
# AWS Credentials (required for AWS Pricing API)
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key

# Vantage API Key (optional - for ec2instances.info)
# Get free API key at: https://console.vantage.sh/
VANTAGE_API_KEY=your-vantage-api-key

# GCP API Key (optional)
GCP_API_KEY=your-gcp-api-key

# Pricing Cache TTL (in hours)
PRICING_CACHE_TTL=24
```

## Caching

All pricing services include built-in caching with 24-hour TTL to minimize API calls.

```typescript
// Clear cache when needed
awsPricing.clearCache();
azurePricing.clearCache();
gcpPricing.clearCache();

// Or clear all caches at once
pricing.clearAllCaches();
```

## Integration with Cost Calculator

Example of integrating with CloudEdze cost calculator:

```typescript
import { UnifiedPricingService } from './services/pricing';

export class CostCalculator {
  private pricingService: UnifiedPricingService;

  constructor() {
    this.pricingService = new UnifiedPricingService({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  async calculateCosts(requirements: InfrastructureRequirements) {
    // Get real-time pricing for AWS
    const awsPricing = await this.pricingService.getComputePricing(
      'aws',
      requirements.compute.instanceType,
      requirements.compute.region
    );

    // Get real-time pricing for Azure
    const azurePricing = await this.pricingService.getComputePricing(
      'azure',
      requirements.compute.azureVMSize,
      requirements.compute.azureRegion
    );

    // Compare and return results
    return {
      aws: awsPricing?.pricing.monthly || 0,
      azure: azurePricing?.pricing.monthly || 0,
      // ... other providers
    };
  }
}
```

## API Rate Limits

| Provider | Rate Limit | Authentication Required | Cost |
|----------|------------|------------------------|------|
| **ec2instances.info** | Generous (no official limit) | Optional (API key) | Free |
| **AWS Pricing API** | 20 req/sec | Yes (AWS credentials) | Free |
| **Azure Retail Prices API** | No limit | **No** | Free |
| **GCP** | N/A (static data) | No | Free |

## Data Freshness

- **EC2 Instances**: Updated daily by Vantage
- **AWS Pricing API**: Real-time from AWS
- **Azure Retail Prices**: Real-time from Microsoft
- **GCP**: Static data (updated periodically)

## Error Handling

All methods return `null` on error and log warnings/errors to console:

```typescript
const pricing = await ec2Pricing.getInstancePricing('invalid-type', 'us-east-1');
if (pricing === null) {
  // Handle error - fallback to static pricing or show message
  console.log('Failed to fetch pricing, using fallback');
}
```

## Testing

```bash
# Test EC2 pricing
npm run test:pricing:ec2

# Test AWS pricing
npm run test:pricing:aws

# Test Azure pricing
npm run test:pricing:azure

# Test all pricing services
npm run test:pricing
```

## Migration from Static Pricing

### Before (Static):
```typescript
const pricing = this.pricing.compute['aws']['standard'];
const cost = vcpus * pricing.vcpu * 24 * 30;
```

### After (Dynamic):
```typescript
const pricing = await this.pricingService.getComputePricing('aws', 't3.medium', 'us-east-1');
const cost = pricing?.pricing.monthly || 0;
```

## Future Improvements

- [ ] Add database caching layer (PostgreSQL)
- [ ] Implement Reserved Instance pricing
- [ ] Add Savings Plans calculations
- [ ] Support spot pricing recommendations
- [ ] Add historical pricing trends
- [ ] Implement cost forecasting
- [ ] Add multi-year pricing projections

## Support

For issues or questions:
- GitHub Issues: https://github.com/Chat4ED/CloudEdze/issues
- Email: darbhasantosh11@gmail.com

## License

MIT License - see LICENSE file for details
