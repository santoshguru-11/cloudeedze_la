import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown, Shield, Zap, Wallet, AlertTriangle } from "lucide-react";

export interface PricingModel {
  type: 'on-demand' | 'reserved-1yr' | 'reserved-3yr' | 'savings-plan' | 'spot';
  commitment?: 'no-upfront' | 'partial-upfront' | 'all-upfront';
  computeSavingsPlan?: number;
  spotMaxPrice?: number;
}

interface PricingModelSelectorProps {
  value: PricingModel;
  onChange: (value: PricingModel) => void;
}

const pricingOptions = [
  {
    value: 'on-demand' as const,
    name: 'On-Demand',
    icon: DollarSign,
    savings: '0%',
    description: 'Pay as you go with no commitment',
    color: 'bg-gray-500',
    pros: ['No upfront cost', 'Maximum flexibility', 'No long-term commitment'],
    cons: ['Highest hourly cost', 'No discounts'],
    bestFor: 'Short-term workloads, unpredictable usage'
  },
  {
    value: 'reserved-1yr' as const,
    name: 'Reserved 1-Year',
    icon: Shield,
    savings: '30-40%',
    description: '1-year commitment with discounts',
    color: 'bg-blue-500',
    pros: ['30-40% savings', 'Predictable costs', '1-year flexibility'],
    cons: ['Upfront payment may be required', 'Less flexible than on-demand'],
    bestFor: 'Stable workloads, known capacity needs'
  },
  {
    value: 'reserved-3yr' as const,
    name: 'Reserved 3-Year',
    icon: Wallet,
    savings: '50-60%',
    description: '3-year commitment with maximum savings',
    color: 'bg-green-500',
    pros: ['50-60% savings', 'Best long-term value', 'Guaranteed capacity'],
    cons: ['Long commitment', 'Upfront payment often required'],
    bestFor: 'Steady-state workloads, long-term projects'
  },
  {
    value: 'savings-plan' as const,
    name: 'Savings Plan',
    icon: TrendingDown,
    savings: 'Up to 45%',
    description: 'Flexible commitment with savings',
    color: 'bg-purple-500',
    pros: ['Up to 45% savings', 'Flexible usage', 'Apply across services'],
    cons: ['Commitment required', 'Complex to optimize'],
    bestFor: 'Variable workloads, multi-service usage'
  },
  {
    value: 'spot' as const,
    name: 'Spot Instances',
    icon: Zap,
    savings: 'Up to 90%',
    description: 'Use spare capacity at huge discounts',
    color: 'bg-yellow-500',
    pros: ['70-90% savings', 'No commitment', 'Great for batch jobs'],
    cons: ['Can be interrupted', 'Less reliable', 'Not for production'],
    bestFor: 'Fault-tolerant workloads, batch processing'
  }
];

const commitmentOptions = [
  { value: 'no-upfront' as const, label: 'No Upfront', description: 'Pay monthly, moderate savings' },
  { value: 'partial-upfront' as const, label: 'Partial Upfront', description: 'Pay ~50% upfront, better savings' },
  { value: 'all-upfront' as const, label: 'All Upfront', description: 'Pay 100% upfront, maximum savings' }
];

export function PricingModelSelector({ value, onChange }: PricingModelSelectorProps) {
  const selectedOption = pricingOptions.find(opt => opt.value === value.type);

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold">Pricing Model</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the pricing strategy that best fits your workload
        </p>
      </div>

      <RadioGroup
        value={value.type}
        onValueChange={(type) => onChange({ ...value, type: type as PricingModel['type'] })}
        className="space-y-3"
      >
        {pricingOptions.map((option) => {
          const isSelected = value.type === option.value;

          return (
            <Card
              key={option.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onChange({ ...value, type: option.value })}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <div className="flex items-center gap-2">
                      <option.icon className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle className="text-sm">{option.name}</CardTitle>
                        <CardDescription className="text-xs">{option.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${option.color} text-white`}>
                    {option.savings}
                  </Badge>
                </div>
              </CardHeader>

              {isSelected && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-medium text-green-600 mb-1">✓ Advantages:</p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        {option.pros.map((pro, i) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium text-orange-600 mb-1">⚠ Considerations:</p>
                      <ul className="space-y-0.5 text-muted-foreground">
                        {option.cons.map((con, i) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      <strong>Best for:</strong> {option.bestFor}
                    </p>
                  </div>

                  {/* Commitment Options for Reserved Instances */}
                  {(value.type === 'reserved-1yr' || value.type === 'reserved-3yr') && (
                    <div className="space-y-3 pt-2 border-t">
                      <Label htmlFor="commitment-type" className="text-sm">
                        Payment Option
                      </Label>
                      <Select
                        value={value.commitment || 'no-upfront'}
                        onValueChange={(commitment) =>
                          onChange({ ...value, commitment: commitment as PricingModel['commitment'] })
                        }
                      >
                        <SelectTrigger id="commitment-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {commitmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Savings Plan Coverage */}
                  {value.type === 'savings-plan' && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="savings-plan-coverage" className="text-sm">
                          Compute Coverage
                        </Label>
                        <Badge variant="outline">{value.computeSavingsPlan || 100}%</Badge>
                      </div>
                      <Slider
                        id="savings-plan-coverage"
                        min={0}
                        max={100}
                        step={5}
                        value={[value.computeSavingsPlan || 100]}
                        onValueChange={([val]) => onChange({ ...value, computeSavingsPlan: val })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Percentage of compute resources covered by savings plan
                      </p>
                    </div>
                  )}

                  {/* Spot Instance Warning */}
                  {value.type === 'spot' && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-800">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-xs text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium">Production Workload Warning</p>
                        <p className="mt-1">
                          Spot instances can be interrupted with little notice. Not recommended for production
                          environments requiring high availability.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </RadioGroup>

      {/* Summary */}
      {selectedOption && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Selected Pricing Model
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium">{selectedOption.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estimated savings:</span>
              <span className="font-medium text-green-600">{selectedOption.savings}</span>
            </div>
            {value.commitment && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment option:</span>
                <span className="font-medium capitalize">{value.commitment.replace('-', ' ')}</span>
              </div>
            )}
            {value.computeSavingsPlan !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coverage:</span>
                <span className="font-medium">{value.computeSavingsPlan}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
