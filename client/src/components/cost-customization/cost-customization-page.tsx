import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Save, Calculator, Settings2, DollarSign } from "lucide-react";
import { EnvironmentSelector, type EnvironmentConfig } from "./environment-selector";
import { ScheduleConfigurator, type RunningSchedule } from "./schedule-configurator";
import { PricingModelSelector, type PricingModel } from "./pricing-model-selector";
import { CostCalculatorWidget, type CustomizedCostResult } from "./cost-calculator-widget";

interface CostCustomization {
  name: string;
  description?: string;
  environment: EnvironmentConfig;
  runningSchedule: RunningSchedule;
  pricingModel: PricingModel;
}

export function CostCustomizationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("configure");
  const [baseMonthlyCost, setBaseMonthlyCost] = useState<number>(1000);
  const [isSaving, setIsSaving] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CustomizedCostResult | null>(null);

  const [customization, setCustomization] = useState<CostCustomization>({
    name: "",
    description: "",
    environment: {
      name: "Production",
      type: "production",
      description: ""
    },
    runningSchedule: {
      hoursPerDay: 24,
      daysPerWeek: 7,
      schedule: "24/7"
    },
    pricingModel: {
      type: "on-demand"
    }
  });

  const handleSaveCustomization = async () => {
    if (!customization.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a name for this customization",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/cost-customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(customization)
      });

      if (!response.ok) {
        throw new Error('Failed to save customization');
      }

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Cost customization saved successfully",
        });
      } else {
        throw new Error(data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save customization",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings2 className="h-8 w-8 text-primary" />
          Cost Customization
        </h1>
        <p className="text-muted-foreground">
          Configure environment-specific pricing, running schedules, and pricing models to optimize your cloud costs
        </p>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Base Cost Input
              </CardTitle>
              <CardDescription>
                Enter the baseline monthly cost (24/7 on-demand pricing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="base-cost">Base Monthly Cost</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="base-cost"
                      type="number"
                      min="0"
                      step="100"
                      value={baseMonthlyCost}
                      onChange={(e) => setBaseMonthlyCost(parseFloat(e.target.value) || 0)}
                      className="pl-9"
                      placeholder="1000"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setBaseMonthlyCost(1000)}
                  disabled={baseMonthlyCost === 1000}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="configure">Configuration</TabsTrigger>
              <TabsTrigger value="calculate">Calculate</TabsTrigger>
              <TabsTrigger value="save">Save</TabsTrigger>
            </TabsList>

            <TabsContent value="configure" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">1. Environment Configuration</CardTitle>
                  <CardDescription>
                    Define the environment type and purpose
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EnvironmentSelector
                    value={customization.environment}
                    onChange={(environment) => setCustomization({ ...customization, environment })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">2. Running Schedule</CardTitle>
                  <CardDescription>
                    Configure when resources will be active
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScheduleConfigurator
                    value={customization.runningSchedule}
                    onChange={(runningSchedule) => setCustomization({ ...customization, runningSchedule })}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3. Pricing Model</CardTitle>
                  <CardDescription>
                    Choose the optimal pricing strategy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PricingModelSelector
                    value={customization.pricingModel}
                    onChange={(pricingModel) => setCustomization({ ...customization, pricingModel })}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("calculate")} size="lg">
                  Continue to Calculate
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="calculate" className="space-y-6 mt-6">
              <CostCalculatorWidget
                baseMonthlyCost={baseMonthlyCost}
                environment={customization.environment}
                runningSchedule={customization.runningSchedule}
                pricingModel={customization.pricingModel}
                onCalculate={setCalculationResult}
              />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("configure")}>
                  Back to Configuration
                </Button>
                <Button onClick={() => setActiveTab("save")} size="lg">
                  Save Customization
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="save" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Save Cost Customization</CardTitle>
                  <CardDescription>
                    Give this configuration a name and description for future reference
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customization-name">Customization Name *</Label>
                    <Input
                      id="customization-name"
                      placeholder="e.g., Production 24/7 with Reserved Instances"
                      value={customization.name}
                      onChange={(e) => setCustomization({ ...customization, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customization-description">Description (Optional)</Label>
                    <Input
                      id="customization-description"
                      placeholder="Add notes about this configuration..."
                      value={customization.description || ''}
                      onChange={(e) => setCustomization({ ...customization, description: e.target.value })}
                    />
                  </div>

                  {calculationResult && (
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Environment:</span>
                          <span className="font-medium">{customization.environment.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base Cost:</span>
                          <span className="font-medium">${calculationResult.baseCost.toFixed(2)}/mo</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Optimized Cost:</span>
                          <span className="font-medium text-green-600">
                            ${calculationResult.customizedCost.toFixed(2)}/mo
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-muted-foreground">Monthly Savings:</span>
                          <span className="font-bold text-green-600">
                            ${calculationResult.savings.toFixed(2)} ({calculationResult.savingsPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("calculate")}>
                  Back to Calculate
                </Button>
                <Button
                  onClick={handleSaveCustomization}
                  disabled={isSaving || !customization.name.trim()}
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Customization'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-4">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Live Preview</CardTitle>
              <CardDescription className="text-xs">
                Real-time cost estimation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <CostCalculatorWidget
                baseMonthlyCost={baseMonthlyCost}
                environment={customization.environment}
                runningSchedule={customization.runningSchedule}
                pricingModel={customization.pricingModel}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
