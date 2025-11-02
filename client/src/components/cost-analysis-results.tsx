import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, PiggyBank, Shuffle, Zap, Server, Download, FileText, Save } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CostAnalysisData {
  providers: {
    oracle: { total: number; breakdown: Record<string, number> };
    gcp: { total: number; breakdown: Record<string, number> };
    azure: { total: number; breakdown: Record<string, number> };
    aws: { total: number; breakdown: Record<string, number> };
  };
  services: string[];
  multiCloudRecommendation?: {
    total: number;
    breakdown: Record<string, string>;
  };
}

interface CostAnalysisResultsProps {
  data: CostAnalysisData;
  onExportCSV?: () => void;
  onGeneratePDF?: () => void;
  onSaveAnalysis?: () => void;
}

export function CostAnalysisResults({ data, onExportCSV, onGeneratePDF, onSaveAnalysis }: CostAnalysisResultsProps) {
  // Calculate summary metrics
  const providers = Object.entries(data.providers).map(([name, info]) => ({
    name: name.toUpperCase(),
    total: info.total,
    breakdown: info.breakdown
  }));

  const cheapest = providers.reduce((min, p) => p.total < min.total ? p : min);
  const mostExpensive = providers.reduce((max, p) => p.total > max.total ? p : max);
  const potentialSavings = mostExpensive.total - cheapest.total;
  const savingsPercentage = ((potentialSavings / mostExpensive.total) * 100).toFixed(0);

  // Multi-cloud should only show savings if different providers are better for different services
  // Otherwise, it should match or be slightly higher than the cheapest single provider
  const multiCloud = data.multiCloudRecommendation || {
    total: cheapest.total * 1.02, // Slightly higher due to multi-cloud complexity overhead
    breakdown: {}
  };

  // Colors for providers
  const providerColors: Record<string, string> = {
    ORACLE: '#F80000',
    GCP: '#4285F4',
    AZURE: '#0078D4',
    AWS: '#FF9900'
  };

  // Calculate service totals for pie chart
  const serviceCategories = ['Compute', 'Networking'];
  const serviceTotals = serviceCategories.reduce((acc, service) => {
    acc[service] = providers.reduce((sum, p) => sum + (p.breakdown[service] || 0), 0) / providers.length;
    return acc;
  }, {} as Record<string, number>);

  const totalServiceCost = Object.values(serviceTotals).reduce((sum, cost) => sum + cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cost Analysis Results</h1>
        <p className="text-gray-600 mt-1">
          Comprehensive cost breakdown across all cloud providers with optimization recommendations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cheapest Option */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-green-700">Cheapest Option</CardDescription>
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">${cheapest.total.toFixed(2)}/mo</div>
            <p className="text-sm text-green-700 mt-1">{cheapest.name}</p>
          </CardContent>
        </Card>

        {/* Most Expensive */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-red-700">Most Expensive</CardDescription>
              <TrendingUp className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">${mostExpensive.total.toFixed(2)}/mo</div>
            <p className="text-sm text-red-700 mt-1">{mostExpensive.name}</p>
          </CardContent>
        </Card>

        {/* Potential Savings */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-blue-700">Potential Savings</CardDescription>
              <PiggyBank className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">${potentialSavings.toFixed(2)}/mo</div>
            <p className="text-sm text-blue-700 mt-1">-{savingsPercentage}% reduction</p>
          </CardContent>
        </Card>

        {/* Multi-Cloud Strategy */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-purple-700">Multi-Cloud Strategy</CardDescription>
              <Shuffle className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">${multiCloud.total.toFixed(2)}/mo</div>
            <p className="text-sm text-purple-700 mt-1">
              {multiCloud.total > cheapest.total ? 'Resilience Premium' : 'Best Value'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Cost Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cost Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-around gap-4 px-4">
              {providers.map((provider) => {
                // More dramatic scaling - use only 20% baseline to amplify visual differences
                const baselineHeight = 20; // Only 20% baseline
                const rangeHeight = 80; // 80% for the actual differences
                const costRange = mostExpensive.total - cheapest.total;
                const costAboveMin = provider.total - cheapest.total;

                // Apply exponential scaling for even more dramatic effect
                const proportionalValue = costRange > 0 ? (costAboveMin / costRange) : 0;
                const amplifiedValue = Math.pow(proportionalValue, 0.7); // Exponential amplification
                const proportionalHeight = amplifiedValue * rangeHeight;
                const heightPercent = baselineHeight + proportionalHeight;

                const savingsVsCheapest = provider.total - cheapest.total;
                const savingsPercent = cheapest.total > 0 ? ((savingsVsCheapest / cheapest.total) * 100).toFixed(1) : '0';

                return (
                  <div key={provider.name} className="flex-1 flex flex-col items-center gap-2">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">${provider.total.toFixed(0)}</div>
                      {provider.name !== cheapest.name && (
                        <div className="text-xs text-red-600 font-bold">+{savingsPercent}%</div>
                      )}
                      {provider.name === cheapest.name && (
                        <div className="text-xs text-green-600 font-bold">BEST</div>
                      )}
                    </div>
                    <div
                      className="w-full rounded-t transition-all hover:opacity-80 relative shadow-md"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: providerColors[provider.name],
                        minHeight: '40px'
                      }}
                    />
                    <div className="text-sm font-bold">{provider.name}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Service Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Service Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {Object.entries(serviceTotals).map((entry, index, arr) => {
                    const [service, cost] = entry;
                    const percentage = (cost / totalServiceCost) * 100;
                    const previousPercentages = arr.slice(0, index).reduce((sum, [, c]) => sum + (c / totalServiceCost) * 100, 0);
                    const strokeDasharray = `${percentage} ${100 - percentage}`;
                    const strokeDashoffset = -previousPercentages;
                    const colors = ['#4285F4', '#34A853'];

                    return (
                      <circle
                        key={service}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={colors[index]}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span className="text-sm">Compute</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-sm" />
                <span className="text-sm">Networking</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service-by-Service Comparison */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle>Service-by-Service Comparison</CardTitle>
          </div>
          <CardDescription>Detailed cost analysis by service category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-around gap-8 px-4">
            {serviceCategories.map((service) => {
              const serviceCosts = providers.map(p => p.breakdown[service] || 0);
              const maxCost = Math.max(...serviceCosts);
              const minCost = Math.min(...serviceCosts.filter(c => c > 0));

              return (
                <div key={service} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-2 items-end h-48">
                    {providers.map((provider) => {
                      const cost = provider.breakdown[service] || 0;

                      // More dramatic scaling with exponential amplification
                      const baselineHeight = 15; // Lower baseline for more drama
                      const rangeHeight = 85; // More range for differences
                      const costRange = maxCost - minCost;
                      const costAboveMin = cost - minCost;

                      // Exponential amplification
                      const proportionalValue = (costRange > 0 && cost > 0) ? (costAboveMin / costRange) : 0;
                      const amplifiedValue = Math.pow(proportionalValue, 0.6);
                      const proportionalHeight = amplifiedValue * rangeHeight;
                      const heightPercent = cost > 0 ? baselineHeight + proportionalHeight : 0;

                      const isCheapest = cost > 0 && cost === minCost;

                      return (
                        <div key={provider.name} className="flex-1 flex flex-col items-center gap-1">
                          <div className={`text-xs font-bold ${isCheapest ? 'text-green-600' : 'text-gray-700'}`}>
                            ${cost.toFixed(0)}
                          </div>
                          <div
                            className="w-full rounded-t relative shadow-sm"
                            style={{
                              height: `${heightPercent}%`,
                              backgroundColor: providerColors[provider.name],
                              minHeight: cost > 0 ? '25px' : '0',
                              opacity: isCheapest ? 1 : 0.8,
                              border: isCheapest ? '2px solid #10b981' : 'none'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-sm font-bold">{service}</div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-4 mt-4 flex-wrap">
            {providers.map((provider) => (
              <div key={provider.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: providerColors[provider.name] }} />
                <span className="text-sm">{provider.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Cloud Cost Intelligence */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <CardTitle>Advanced Cloud Cost Intelligence</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{savingsPercentage}%</div>
              <div className="text-sm font-medium text-gray-700 mt-1">Cost Optimization</div>
              <div className="text-xs text-gray-600">vs most expensive option</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">{data.services.length}</div>
              <div className="text-sm font-medium text-gray-700 mt-1">Active Services</div>
              <div className="text-xs text-gray-600">across your infrastructure</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cost Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Service</TableHead>
                  {providers.map((provider) => (
                    <TableHead key={provider.name} className="text-center">
                      {provider.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.services.map((service) => (
                  <TableRow key={service}>
                    <TableCell className="font-medium">{service}</TableCell>
                    {providers.map((provider) => {
                      const cost = provider.breakdown[service] || 0;
                      const isLowest = cost > 0 && cost === Math.min(...providers.map(p => p.breakdown[service] || Infinity).filter(c => c > 0));
                      return (
                        <TableCell key={provider.name} className="text-center">
                          <span className={isLowest && cost > 0 ? 'text-green-600 font-semibold' : ''}>
                            ${cost.toFixed(2)}/mo
                          </span>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                <TableRow className="bg-gray-50 font-bold">
                  <TableCell>Total Monthly Cost</TableCell>
                  {providers.map((provider) => (
                    <TableCell key={provider.name} className="text-center">
                      ${provider.total.toFixed(2)}/mo
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single-Cloud Recommendation */}
        <Card className="border-green-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <CardTitle>Single-Cloud Recommendation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-green-600">{cheapest.name}</div>
              <p className="text-sm text-gray-600 mt-1">
                {cheapest.name} offers the best overall value at ${cheapest.total.toFixed(2)}/month with comprehensive
                service coverage and competitive pricing across all categories.
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-green-900">
                {savingsPercentage}% savings compared to AWS
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-Cloud Optimization */}
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shuffle className="h-5 w-5 text-purple-500" />
              <CardTitle>Multi-Cloud Strategy</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ${multiCloud.total.toFixed(2)}/month
              </div>
              <p className="text-sm text-gray-600 mt-2">
                A multi-cloud approach using best-in-class services from multiple providers
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Best service availability across regions</li>
                <li>• Avoid vendor lock-in</li>
                <li>• Enhanced redundancy and disaster recovery</li>
              </ul>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-sm font-semibold text-purple-900">
                {multiCloud.total > cheapest.total
                  ? `+${(multiCloud.total - cheapest.total).toFixed(2)}/month premium for multi-cloud benefits`
                  : `Same cost as ${cheapest.name} with added resilience`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onExportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
        <Button variant="outline" onClick={onGeneratePDF}>
          <FileText className="h-4 w-4 mr-2" />
          Generate PDF Report
        </Button>
        <Button onClick={onSaveAnalysis} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Analysis
        </Button>
      </div>
    </div>
  );
}
