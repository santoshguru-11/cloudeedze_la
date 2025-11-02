import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingDown,
  DollarSign,
  Clock,
  Percent,
  Lightbulb,
  ArrowDown,
  ArrowRight
} from "lucide-react";
import type { EnvironmentConfig } from "./environment-selector";
import type { RunningSchedule } from "./schedule-configurator";
import type { PricingModel } from "./pricing-model-selector";

export interface CustomizedCostResult {
  baseCost: number;
  customizedCost: number;
  savings: number;
  savingsPercentage: number;
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

interface CostCalculatorWidgetProps {
  baseMonthlyCost: number;
  environment: EnvironmentConfig;
  runningSchedule: RunningSchedule;
  pricingModel: PricingModel;
  onCalculate?: (result: CustomizedCostResult) => void;
}

export function CostCalculatorWidget({
  baseMonthlyCost,
  environment,
  runningSchedule,
  pricingModel,
  onCalculate
}: CostCalculatorWidgetProps) {
  const [result, setResult] = useState<CustomizedCostResult | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateCosts = async () => {
      if (!baseMonthlyCost || baseMonthlyCost <= 0) {
        setResult(null);
        return;
      }

      setIsCalculating(true);
      setError(null);

      try {
        const response = await fetch('/api/cost-customizations/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            baseMonthlyCost,
            customization: {
              environment,
              runningSchedule,
              pricingModel
            }
          })
        });

        if (!response.ok) {
          throw new Error('Failed to calculate costs');
        }

        const data = await response.json();
        if (data.success) {
          setResult(data.result);
          setRecommendations(data.recommendations || []);
          onCalculate?.(data.result);
        } else {
          throw new Error(data.message || 'Calculation failed');
        }
      } catch (err) {
        console.error('Cost calculation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to calculate costs');
      } finally {
        setIsCalculating(false);
      }
    };

    // Debounce calculations
    const timer = setTimeout(calculateCosts, 500);
    return () => clearTimeout(timer);
  }, [baseMonthlyCost, environment, runningSchedule, pricingModel, onCalculate]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isCalculating) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Calculator
          </CardTitle>
          <CardDescription>
            Enter a base monthly cost to see potential savings
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Cost Summary */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-600" />
            Cost Optimization Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cost Flow */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-1">Base Cost</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                ${result.baseCost.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground" />

            <div className="flex-1 text-center">
              <p className="text-sm text-muted-foreground mb-1">Optimized Cost</p>
              <p className="text-3xl font-bold text-green-600">
                ${result.customizedCost.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>

          {/* Savings Badge */}
          <div className="flex items-center justify-center gap-2 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ArrowDown className="h-5 w-5 text-green-600" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Savings</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">
                  ${result.savings.toFixed(2)}
                </span>
                <Badge className="bg-green-600 text-white">
                  {result.savingsPercentage.toFixed(1)}% off
                </Badge>
              </div>
            </div>
          </div>

          {/* Savings Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Savings Progress</span>
              <span className="font-medium">{result.savingsPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={result.savingsPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Savings Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Running Hours Discount</span>
            </div>
            <span className="font-bold text-blue-600">
              ${result.breakdown.runningHoursDiscount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Pricing Model Discount</span>
            </div>
            <span className="font-bold text-purple-600">
              ${result.breakdown.pricingModelDiscount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <span className="text-sm font-semibold">Total Discount</span>
            <span className="font-bold text-green-600 text-lg">
              ${result.breakdown.totalDiscount.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Usage Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Usage Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hours per month:</span>
            <span className="font-medium">{result.details.hoursPerMonth} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Utilization:</span>
            <span className="font-medium">{result.details.utilizationPercentage.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Effective hourly rate:</span>
            <span className="font-medium">${result.details.effectiveHourlyRate.toFixed(3)}/hour</span>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span className="text-muted-foreground">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
