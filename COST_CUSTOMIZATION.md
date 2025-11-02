# 💰 Cost Customization Feature

## Overview

The Cost Customization feature allows users to model different deployment scenarios with varying:
- **Environment types** (production, staging, development, testing, QA, demo, disaster-recovery)
- **Running schedules** (24/7, business hours, weekends-only, custom schedules)
- **Pricing models** (on-demand, reserved instances 1yr/3yr, savings plans, spot instances)

This enables accurate cost forecasting and optimization recommendations based on actual usage patterns.

---

## ✨ Features

### 1. Environment-Based Configuration
Define different environments with specific characteristics:
- Production (high availability, 24/7)
- Staging (business hours)
- Development (limited hours, spot instances)
- Testing/QA (scheduled shutdown)
- Demo environments
- Disaster recovery (standby resources)

### 2. Flexible Running Schedules
Configure when resources are actually running:
- **Always-on**: 24/7 operation (730 hours/month)
- **Business hours**: 9am-5pm Mon-Fri (173 hours/month)
- **Extended business**: 8am-8pm Mon-Fri (260 hours/month)
- **Weekdays only**: 24 hours Mon-Fri (520 hours/month)
- **Development**: 8am-6pm Mon-Fri (217 hours/month)
- **Custom schedules**: Define your own hours/days

### 3. Pricing Model Options
Choose the most cost-effective pricing strategy:
- **On-Demand**: Pay as you go, no commitment
- **Reserved 1-Year**: 30-40% savings with annual commitment
- **Reserved 3-Year**: 50-60% savings with multi-year commitment
- **Savings Plans**: Up to 45% savings with flexible commitment
- **Spot Instances**: Up to 70% savings (conservative estimate)

### 4. Intelligent Recommendations
Get AI-powered suggestions for:
- Optimal pricing models based on environment type
- Schedule optimization opportunities
- Reserved instance vs spot instance tradeoffs
- Cost reduction strategies

---

## 🗄️ Database Schema

```sql
CREATE TABLE cost_customizations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  environment_type VARCHAR(100) NOT NULL,
  running_schedule JSONB NOT NULL,
  pricing_model    JSONB NOT NULL,
  tags             JSONB,
  is_default       BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_customizations_user_id ON cost_customizations(user_id);
CREATE INDEX idx_cost_customizations_environment_type ON cost_customizations(environment_type);
```

---

## 🔌 API Endpoints

### 1. Get All Customizations
```http
GET /api/cost-customizations
Authorization: Required (Cookie-based session)

Response:
{
  "success": true,
  "customizations": [
    {
      "id": "uuid",
      "name": "Production 24/7",
      "environmentType": "production",
      "runningSchedule": { ... },
      "pricingModel": { ... },
      "createdAt": "2025-10-31T..."
    }
  ]
}
```

### 2. Create Customization
```http
POST /api/cost-customizations
Authorization: Required
Content-Type: application/json

{
  "name": "Production Environment - 24/7",
  "description": "Always-on production with reserved instances",
  "environment": {
    "name": "Production",
    "type": "production",
    "description": "Main production environment"
  },
  "runningSchedule": {
    "hoursPerDay": 24,
    "daysPerWeek": 7,
    "schedule": "24/7",
    "hoursPerMonth": 730
  },
  "pricingModel": {
    "type": "reserved-3yr",
    "commitment": "partial-upfront"
  },
  "tags": {
    "environment": "production",
    "criticality": "high"
  }
}

Response:
{
  "success": true,
  "customization": { ... }
}
```

### 3. Get Specific Customization
```http
GET /api/cost-customizations/:id
Authorization: Required

Response:
{
  "success": true,
  "customization": { ... }
}
```

### 4. Update Customization
```http
PUT /api/cost-customizations/:id
Authorization: Required
Content-Type: application/json

{
  "name": "Updated name",
  "environment": { ... },
  "runningSchedule": { ... },
  "pricingModel": { ... }
}
```

### 5. Delete Customization
```http
DELETE /api/cost-customizations/:id
Authorization: Required

Response:
{
  "success": true,
  "message": "Cost customization deleted successfully"
}
```

### 6. Calculate Costs with Customization
```http
POST /api/cost-customizations/calculate
Authorization: Required
Content-Type: application/json

{
  "baseMonthlyCost": 1000,
  "customization": {
    "environment": {
      "name": "Development",
      "type": "development"
    },
    "runningSchedule": {
      "hoursPerDay": 10,
      "daysPerWeek": 5,
      "schedule": "8am-6pm Mon-Fri"
    },
    "pricingModel": {
      "type": "spot"
    }
  }
}

Response:
{
  "success": true,
  "result": {
    "baseCost": 1000,
    "customizedCost": 89.73,
    "savings": 910.27,
    "savingsPercentage": 91.03,
    "breakdown": {
      "runningHoursDiscount": 703.29,
      "pricingModelDiscount": 206.98,
      "totalDiscount": 910.27
    },
    "details": {
      "hoursPerMonth": 217,
      "utilizationPercentage": 29.73,
      "effectiveHourlyRate": 0.41
    }
  },
  "recommendations": [
    "Low utilization detected (29.7%). Consider using spot instances...",
    "Dev/test environment using spot instances - good choice for cost optimization!"
  ]
}
```

### 7. Get Schedule Templates
```http
GET /api/cost-customizations/templates/schedules
Authorization: Required

Response:
{
  "success": true,
  "templates": {
    "always-on": {
      "hoursPerDay": 24,
      "daysPerWeek": 7,
      "schedule": "24/7",
      "hoursPerMonth": 730
    },
    "business-hours": {
      "hoursPerDay": 8,
      "daysPerWeek": 5,
      "schedule": "9am-5pm Mon-Fri",
      "hoursPerMonth": 173
    },
    ...
  }
}
```

### 8. Get Pricing Model Recommendations
```http
POST /api/cost-customizations/recommendations/pricing-model
Authorization: Required
Content-Type: application/json

{
  "environmentType": "production",
  "expectedRuntime": "continuous"
}

Response:
{
  "success": true,
  "recommendation": {
    "type": "reserved-3yr",
    "commitment": "partial-upfront"
  }
}
```

---

## 📊 Discount Rates

### Reserved Instances (1 Year)
- **No Upfront**: 30% savings
- **Partial Upfront**: 35% savings
- **All Upfront**: 40% savings

### Reserved Instances (3 Year)
- **No Upfront**: 50% savings
- **Partial Upfront**: 55% savings
- **All Upfront**: 60% savings

### Savings Plans
- **1-Year Commitment**: Up to 45% savings
- **Configurable Coverage**: 0-100% of compute resources

### Spot Instances
- **Conservative Estimate**: 70% savings
- **Best For**: Non-critical, interruptible workloads

### Dev/Test Bonus
- **Additional 5%** discount for development and testing environments

---

## 💻 Service Layer

### CostCustomizationService

Located at: `server/services/cost-customization-service.ts`

**Key Methods:**

```typescript
// Calculate costs with customizations
calculateCustomizedCost(
  baseMonthlyCost: number,
  customization: CostCustomization
): CustomizedCostResult

// Get recommended pricing model
getRecommendedPricingModel(
  environmentType: string,
  expectedRuntime: 'continuous' | 'scheduled' | 'sporadic'
): PricingModel

// Get schedule templates
getScheduleTemplates(): Record<string, RunningSchedule>

// Generate optimization recommendations
generateRecommendations(
  baseMonthlyCost: number,
  currentCustomization: CostCustomization
): string[]

// Compare multiple environments
compareEnvironments(
  baseMonthlyCost: number,
  environments: CostCustomization[]
): Array<{ environment: string; result: CustomizedCostResult }>
```

---

## 🎯 Use Cases

### 1. Development Environment Optimization
**Scenario:** Dev team works 8am-6pm Mon-Fri

```typescript
{
  environment: { type: 'development' },
  runningSchedule: { hoursPerDay: 10, daysPerWeek: 5 },  // 217 hrs/month
  pricingModel: { type: 'spot' }
}

Result: ~91% cost savings vs 24/7 on-demand
```

### 2. Production High Availability
**Scenario:** Mission-critical 24/7 application

```typescript
{
  environment: { type: 'production' },
  runningSchedule: { hoursPerDay: 24, daysPerWeek: 7 },  // 730 hrs/month
  pricingModel: { type: 'reserved-3yr', commitment: 'partial-upfront' }
}

Result: 55% cost savings with guaranteed capacity
```

### 3. Staging Environment
**Scenario:** Testing during business hours

```typescript
{
  environment: { type: 'staging' },
  runningSchedule: { hoursPerDay: 8, daysPerWeek: 5 },  // 173 hrs/month
  pricingModel: { type: 'on-demand' }
}

Result: 76% cost savings from reduced runtime
```

### 4. Disaster Recovery
**Scenario:** Standby resources with minimal cost

```typescript
{
  environment: { type: 'disaster-recovery' },
  runningSchedule: { hoursPerDay: 1, daysPerWeek: 7 },  // 30 hrs/month (health checks)
  pricingModel: { type: 'reserved-1yr', commitment: 'all-upfront' }
}

Result: ~96% cost savings for standby infrastructure
```

---

## 🎨 Frontend Integration (Pending)

### Planned UI Components:

1. **Environment Selector**
   - Dropdown with predefined environment types
   - Custom description field
   - Visual indicators for criticality

2. **Schedule Configurator**
   - Slider for hours per day (1-24)
   - Day selector (Mon-Sun)
   - Quick templates (24/7, business hours, etc.)
   - Visual calendar representation

3. **Pricing Model Selector**
   - Cards showing each pricing option
   - Estimated savings comparison
   - Commitment level selector
   - Spot price risk indicator

4. **Cost Calculator Widget**
   - Real-time cost calculation
   - Savings visualization (charts)
   - Side-by-side comparisons
   - Export to CSV/PDF

5. **Recommendations Panel**
   - AI-powered optimization suggestions
   - Cost-saving opportunities
   - Risk warnings (e.g., spot for production)

---

## 📈 Example Calculations

### Example 1: Dev Environment
**Base Cost:** $1,000/month (24/7 on-demand)

**Configuration:**
- Environment: Development
- Schedule: 10 hours/day, 5 days/week (217 hrs/month)
- Pricing: Spot instances

**Result:**
- **Customized Cost:** $89.73/month
- **Savings:** $910.27 (91%)
- **Running Hours Discount:** $703.29 (70%)
- **Pricing Model Discount:** $206.98 (21%)

### Example 2: Production with Reserved
**Base Cost:** $5,000/month (24/7 on-demand)

**Configuration:**
- Environment: Production
- Schedule: 24/7 (730 hrs/month)
- Pricing: 3-year reserved, partial upfront

**Result:**
- **Customized Cost:** $2,250/month
- **Savings:** $2,750 (55%)
- **Running Hours Discount:** $0 (100% utilization)
- **Pricing Model Discount:** $2,750 (55%)

---

## 🚀 Next Steps

### Phase 1: Backend (✅ Complete)
- [x] Database schema
- [x] Service layer
- [x] API endpoints
- [x] Storage methods
- [x] Cost calculation logic

### Phase 2: Frontend (Pending)
- [ ] Environment selector component
- [ ] Schedule configurator
- [ ] Pricing model selector
- [ ] Cost calculator widget
- [ ] Recommendations panel
- [ ] Multi-environment comparison view

### Phase 3: Advanced Features (Future)
- [ ] Historical cost tracking
- [ ] Budget alerts based on customizations
- [ ] Automatic schedule adjustment based on usage
- [ ] Multi-year cost projections
- [ ] Reserved instance portfolio optimization
- [ ] Spot price trend analysis

---

## 📝 Notes

- All calculations use conservative estimates
- Actual cloud provider pricing may vary
- Spot instance pricing is highly variable
- Reserved instance pricing assumes standard instance types
- Dev/test discounts are approximate and provider-dependent

---

**Implementation Date:** October 31, 2025
**Status:** Backend Complete ✅ | Frontend Pending 🚧
**Version:** 1.0.0
