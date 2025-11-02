/**
 * Cost Customization Service
 * Handles environment-specific pricing, running hours, and savings plans
 */

export interface EnvironmentConfig {
  name: string;
  type: 'production' | 'staging' | 'development' | 'testing' | 'qa' | 'demo' | 'disaster-recovery';
  description?: string;
}

export interface RunningSchedule {
  hoursPerDay: number;        // 1-24 hours per day
  daysPerWeek: number;         // 1-7 days per week
  hoursPerMonth?: number;      // Alternative: specify total hours per month
  timezone?: string;           // For scheduling context
  schedule?: string;           // e.g., "9am-5pm Mon-Fri"
}

export interface PricingModel {
  type: 'on-demand' | 'reserved-1yr' | 'reserved-3yr' | 'savings-plan' | 'spot';
  commitment?: 'no-upfront' | 'partial-upfront' | 'all-upfront';
  computeSavingsPlan?: number; // Percentage of compute covered by savings plan (0-100)
  spotMaxPrice?: number;       // Maximum spot price willing to pay
}

export interface CostCustomization {
  environment: EnvironmentConfig;
  runningSchedule: RunningSchedule;
  pricingModel: PricingModel;
  tags?: Record<string, string>;  // For cost allocation
}

export interface CustomizedCostResult {
  baseCost: number;              // Full on-demand cost (24/7)
  customizedCost: number;        // Cost with customizations applied
  savings: number;               // Amount saved
  savingsPercentage: number;     // Percentage saved
  breakdown: {
    runningHoursDiscount: number;
    pricingModelDiscount: number;
    totalDiscount: number;
  };
  details: {
    hoursPerMonth: number;
    utilizationPercentage: number;
    effectiveHourlyRate: number;
  };
}

export class CostCustomizationService {
  /**
   * Calculate cost with environment customizations
   */
  calculateCustomizedCost(
    baseMonthlyCost: number,
    customization: CostCustomization
  ): CustomizedCostResult {
    // Step 1: Calculate running hours adjustment
    const runningHoursResult = this.calculateRunningHoursDiscount(
      baseMonthlyCost,
      customization.runningSchedule
    );

    // Step 2: Calculate pricing model discount
    const pricingModelResult = this.calculatePricingModelDiscount(
      runningHoursResult.adjustedCost,
      customization.pricingModel,
      customization.environment.type
    );

    // Step 3: Calculate total savings
    const totalDiscount = runningHoursResult.discount + pricingModelResult.discount;
    const finalCost = baseMonthlyCost - totalDiscount;
    const savings = baseMonthlyCost - finalCost;
    const savingsPercentage = (savings / baseMonthlyCost) * 100;

    return {
      baseCost: baseMonthlyCost,
      customizedCost: finalCost,
      savings,
      savingsPercentage,
      breakdown: {
        runningHoursDiscount: runningHoursResult.discount,
        pricingModelDiscount: pricingModelResult.discount,
        totalDiscount
      },
      details: {
        hoursPerMonth: runningHoursResult.hoursPerMonth,
        utilizationPercentage: runningHoursResult.utilizationPercentage,
        effectiveHourlyRate: finalCost / runningHoursResult.hoursPerMonth
      }
    };
  }

  /**
   * Calculate discount based on running hours
   */
  private calculateRunningHoursDiscount(
    baseMonthlyCost: number,
    schedule: RunningSchedule
  ): { adjustedCost: number; discount: number; hoursPerMonth: number; utilizationPercentage: number } {
    const fullMonthHours = 730; // Average hours per month (365 days * 24 hours / 12 months)

    // Calculate actual running hours per month
    let runningHoursPerMonth: number;

    if (schedule.hoursPerMonth) {
      // Direct specification
      runningHoursPerMonth = schedule.hoursPerMonth;
    } else {
      // Calculate from daily/weekly schedule
      const hoursPerDay = Math.min(schedule.hoursPerDay, 24);
      const daysPerWeek = Math.min(schedule.daysPerWeek, 7);
      const weeksPerMonth = 4.33; // Average weeks per month
      runningHoursPerMonth = hoursPerDay * (daysPerWeek / 7) * 30; // Approximate 30 days per month
    }

    // Cap at full month hours
    runningHoursPerMonth = Math.min(runningHoursPerMonth, fullMonthHours);

    // Calculate utilization percentage
    const utilizationPercentage = (runningHoursPerMonth / fullMonthHours) * 100;

    // Calculate proportional cost
    const adjustedCost = (baseMonthlyCost * runningHoursPerMonth) / fullMonthHours;
    const discount = baseMonthlyCost - adjustedCost;

    return {
      adjustedCost,
      discount,
      hoursPerMonth: runningHoursPerMonth,
      utilizationPercentage
    };
  }

  /**
   * Calculate discount based on pricing model
   */
  private calculatePricingModelDiscount(
    adjustedCost: number,
    pricingModel: PricingModel,
    environmentType: string
  ): { adjustedCost: number; discount: number } {
    let discountPercentage = 0;

    switch (pricingModel.type) {
      case 'on-demand':
        // No discount
        discountPercentage = 0;
        break;

      case 'reserved-1yr':
        // Reserved Instance 1 Year discounts
        switch (pricingModel.commitment) {
          case 'no-upfront':
            discountPercentage = 30; // ~30% savings
            break;
          case 'partial-upfront':
            discountPercentage = 35; // ~35% savings
            break;
          case 'all-upfront':
            discountPercentage = 40; // ~40% savings
            break;
          default:
            discountPercentage = 30;
        }
        break;

      case 'reserved-3yr':
        // Reserved Instance 3 Year discounts
        switch (pricingModel.commitment) {
          case 'no-upfront':
            discountPercentage = 50; // ~50% savings
            break;
          case 'partial-upfront':
            discountPercentage = 55; // ~55% savings
            break;
          case 'all-upfront':
            discountPercentage = 60; // ~60% savings
            break;
          default:
            discountPercentage = 50;
        }
        break;

      case 'savings-plan':
        // Savings Plan (flexible commitment)
        const coveragePercentage = pricingModel.computeSavingsPlan || 100;
        const baseSavings = 45; // ~45% savings for 1-year commitment
        discountPercentage = (baseSavings * coveragePercentage) / 100;
        break;

      case 'spot':
        // Spot instances (high variability, but can be up to 90% cheaper)
        // Use conservative estimate for cost calculations
        discountPercentage = 70; // ~70% savings (conservative)
        // Note: Actual spot prices vary greatly
        break;

      default:
        discountPercentage = 0;
    }

    // Apply environment-specific adjustments
    if (environmentType === 'development' || environmentType === 'testing') {
      // Dev/Test environments often have additional discounts
      discountPercentage += 5; // Additional 5% for dev/test
    }

    // Calculate discount
    const discount = (adjustedCost * discountPercentage) / 100;
    const finalCost = adjustedCost - discount;

    return {
      adjustedCost: finalCost,
      discount
    };
  }

  /**
   * Get recommended pricing model based on environment type
   */
  getRecommendedPricingModel(environmentType: string, expectedRuntime: 'continuous' | 'scheduled' | 'sporadic'): PricingModel {
    switch (environmentType) {
      case 'production':
        if (expectedRuntime === 'continuous') {
          return {
            type: 'reserved-3yr',
            commitment: 'partial-upfront'
          };
        } else {
          return {
            type: 'savings-plan',
            computeSavingsPlan: 80
          };
        }

      case 'staging':
        return {
          type: 'reserved-1yr',
          commitment: 'no-upfront'
        };

      case 'development':
      case 'testing':
      case 'qa':
        if (expectedRuntime === 'sporadic') {
          return {
            type: 'spot'
          };
        } else {
          return {
            type: 'on-demand'
          };
        }

      case 'demo':
        return {
          type: 'on-demand'
        };

      case 'disaster-recovery':
        return {
          type: 'reserved-1yr',
          commitment: 'all-upfront' // Lowest cost for standby resources
        };

      default:
        return {
          type: 'on-demand'
        };
    }
  }

  /**
   * Get common running schedules templates
   */
  getScheduleTemplates(): Record<string, RunningSchedule> {
    return {
      'always-on': {
        hoursPerDay: 24,
        daysPerWeek: 7,
        schedule: '24/7',
        hoursPerMonth: 730
      },
      'business-hours': {
        hoursPerDay: 8,
        daysPerWeek: 5,
        schedule: '9am-5pm Mon-Fri',
        hoursPerMonth: 173 // ~8 hours * 5 days * 4.33 weeks
      },
      'extended-business': {
        hoursPerDay: 12,
        daysPerWeek: 5,
        schedule: '8am-8pm Mon-Fri',
        hoursPerMonth: 260
      },
      'weekdays-only': {
        hoursPerDay: 24,
        daysPerWeek: 5,
        schedule: '24 hours Mon-Fri',
        hoursPerMonth: 520
      },
      'nights-weekends': {
        hoursPerDay: 16,
        daysPerWeek: 2,
        schedule: 'Sat-Sun + nights',
        hoursPerMonth: 139
      },
      'development': {
        hoursPerDay: 10,
        daysPerWeek: 5,
        schedule: '8am-6pm Mon-Fri',
        hoursPerMonth: 217
      }
    };
  }

  /**
   * Calculate multi-environment cost comparison
   */
  compareEnvironments(
    baseMonthlyCost: number,
    environments: CostCustomization[]
  ): Array<{
    environment: string;
    result: CustomizedCostResult;
  }> {
    return environments.map(env => ({
      environment: env.environment.name,
      result: this.calculateCustomizedCost(baseMonthlyCost, env)
    }));
  }

  /**
   * Generate cost optimization recommendations
   */
  generateRecommendations(
    baseMonthlyCost: number,
    currentCustomization: CostCustomization
  ): string[] {
    const recommendations: string[] = [];
    const currentResult = this.calculateCustomizedCost(baseMonthlyCost, currentCustomization);

    // Check utilization
    if (currentResult.details.utilizationPercentage < 50) {
      recommendations.push(
        `Low utilization detected (${currentResult.details.utilizationPercentage.toFixed(1)}%). Consider using spot instances or on-demand pricing instead of reserved instances.`
      );
    }

    // Check pricing model
    if (currentCustomization.pricingModel.type === 'on-demand' &&
        currentResult.details.utilizationPercentage > 70) {
      recommendations.push(
        'High utilization detected. Consider switching to reserved instances or savings plans for up to 60% cost savings.'
      );
    }

    // Environment-specific recommendations
    if (currentCustomization.environment.type === 'production' &&
        currentCustomization.pricingModel.type === 'spot') {
      recommendations.push(
        '⚠️ Using spot instances for production. Consider reserved instances for better reliability and predictable costs.'
      );
    }

    if ((currentCustomization.environment.type === 'development' ||
         currentCustomization.environment.type === 'testing') &&
        currentCustomization.pricingModel.type === 'reserved-3yr') {
      recommendations.push(
        'Dev/test environment using 3-year reserved instances may be over-committed. Consider on-demand or spot instances for flexibility.'
      );
    }

    // Schedule optimization
    if (currentCustomization.runningSchedule.hoursPerDay === 24 &&
        currentCustomization.runningSchedule.daysPerWeek === 7 &&
        (currentCustomization.environment.type === 'development' ||
         currentCustomization.environment.type === 'testing')) {
      recommendations.push(
        'Dev/test environment running 24/7. Consider scheduled shutdowns during non-business hours to save up to 75% on compute costs.'
      );
    }

    return recommendations;
  }
}
