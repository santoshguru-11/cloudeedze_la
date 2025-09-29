import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Server, 
  Database, 
  HardDrive, 
  Cloud, 
  AlertCircle, 
  CheckCircle,
  Clock,
  BarChart3,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { CloudCredential } from "./cloud-credentials-form";
import CostResults from "./cost-results";

interface UnifiedResource {
  id: string;
  name: string;
  type: string;
  service: string;
  provider: string;
  location: string;
  tags?: Record<string, string>;
  state: string;
  compartmentName?: string;
  costDetails?: {
    instanceType?: string;
    size?: string;
    vcpus?: number;
    memory?: number;
    storage?: number;
    tier?: string;
  };
}

interface UnifiedInventory {
  resources: UnifiedResource[];
  summary: {
    totalResources: number;
    providers: Record<string, number>;
    services: Record<string, number>;
    locations: Record<string, number>;
  };
  scanDate: string;
  scanDuration: number;
}

interface InventoryScannerProps {
  credentials: CloudCredential[];
  onInventoryScanned: (inventory: UnifiedInventory) => void;
}

const getServiceIcon = (service: string | undefined) => {
  if (!service) return <Cloud className="h-4 w-4" />;
  const lowerService = service.toLowerCase();
  if (lowerService.includes('compute') || lowerService.includes('ec2')) return <Server className="h-4 w-4" />;
  if (lowerService.includes('database') || lowerService.includes('sql') || lowerService.includes('rds')) return <Database className="h-4 w-4" />;
  if (lowerService.includes('storage') || lowerService.includes('s3') || lowerService.includes('ebs')) return <HardDrive className="h-4 w-4" />;
  return <Cloud className="h-4 w-4" />;
};

const getStateColor = (state: string | undefined) => {
  if (!state) return 'bg-gray-500';
  const lowerState = state.toLowerCase();
  if (lowerState.includes('running') || lowerState.includes('active')) return 'bg-green-500';
  if (lowerState.includes('stopped') || lowerState.includes('terminated')) return 'bg-red-500';
  if (lowerState.includes('pending') || lowerState.includes('starting')) return 'bg-yellow-500';
  return 'bg-gray-500';
};

export function InventoryScanner({ credentials, onInventoryScanned }: InventoryScannerProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [automaticCostAnalysis, setAutomaticCostAnalysis] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  const scanMutation = useMutation({
    mutationFn: async () => {
      console.log('InventoryScanner - Selected credentials:', credentials);
      
      // Send credential IDs to the backend - the backend will load the full credentials
      const scanRequest = {
        credentials: credentials.map(cred => ({
          id: cred.id,
          provider: cred.provider,
          name: cred.name
        }))
      };

      // Get list of selected providers for progress updates
      const selectedProviders = credentials.map(cred => cred.provider);
      const providerNames = {
        'aws': 'AWS',
        'azure': 'Azure',
        'gcp': 'Google Cloud',
        'oci': 'Oracle Cloud'
      };

      // Simulate progress updates based on selected providers
      setScanProgress(10);
      if (selectedProviders.length > 0) {
        setCurrentProvider(`Scanning ${providerNames[selectedProviders[0] as keyof typeof providerNames]}...`);
      }
      
      // Update progress for each selected provider
      selectedProviders.forEach((provider, index) => {
        const progress = 10 + (index + 1) * (80 / selectedProviders.length);
        const delay = (index + 1) * 1000;
        
        setTimeout(() => {
          setScanProgress(progress);
          setCurrentProvider(`Scanning ${providerNames[provider as keyof typeof providerNames]}...`);
        }, delay);
      });

      // Final progress update
      setTimeout(() => {
        setScanProgress(90);
        setCurrentProvider('Finalizing scan and calculating costs...');
      }, (selectedProviders.length + 1) * 1000);

      // Add provider filter to the API request
      const url = selectedProvider !== 'all' 
        ? `/api/inventory/scan?provider=${selectedProvider}`
        : '/api/inventory/scan';
      
      const response = await apiRequest('POST', url, scanRequest);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to scan inventory');
      }

      setScanProgress(100);
      setCurrentProvider('Scan complete!');
      
      return result;
    },
    onSuccess: (result: { inventory: UnifiedInventory; costAnalysis?: any }) => {
      onInventoryScanned(result.inventory);
      // If we got cost analysis automatically, set it
      if (result.costAnalysis) {
        setAutomaticCostAnalysis(result.costAnalysis);
      }
      // Reset progress after 2 seconds
      setTimeout(() => {
        setScanProgress(0);
        setCurrentProvider('');
      }, 2000);
    },
    onError: () => {
      setScanProgress(0);
      setCurrentProvider('');
    }
  });

  const generateCostAnalysisMutation = useMutation({
    mutationFn: async (inventory: UnifiedInventory) => {
      const response = await apiRequest('POST', '/api/inventory/analyze-costs', { inventory });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to analyze costs');
      }

      return result.analysis;
    }
  });

  if (credentials.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cloud Inventory Scanner
          </CardTitle>
          <CardDescription>
            Automatically discover and analyze your existing cloud resources across all providers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please add cloud credentials first to enable inventory scanning.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Cloud Inventory Scanner
          </CardTitle>
          <CardDescription>
            Scan your cloud accounts to discover existing resources and generate automatic cost analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-sm font-medium">Connected accounts:</span>
            {credentials.map(cred => (
              <Badge key={cred.id} variant="outline" className="capitalize">
                {cred.provider}
                {cred.validated && <CheckCircle className="h-3 w-3 ml-1 text-green-500" />}
              </Badge>
            ))}
          </div>

          {scanMutation.isPending && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Scanning Progress</span>
                <span className="text-sm text-muted-foreground">{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="w-full" />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 animate-spin" />
                {currentProvider}
              </p>
            </div>
          )}

          {scanMutation.error && (
            <Alert className="border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-600">
                {scanMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filter by Cloud Provider (Optional)</label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {credentials.map(cred => (
                      <SelectItem key={cred.id} value={cred.provider}>
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          {cred.provider.toUpperCase()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => scanMutation.mutate()}
                disabled={scanMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-start-scan"
              >
                {scanMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Start Inventory Scan
                  </>
                )}
              </Button>
            </div>
            {selectedProvider !== 'all' && (
              <div className="text-sm text-muted-foreground">
                <Cloud className="h-4 w-4 inline mr-1" />
                Will scan only {selectedProvider.toUpperCase()} resources
              </div>
            )}
          </div>

          {scanMutation.isSuccess && scanMutation.data && (
            <InventoryResults 
              inventory={scanMutation.data.inventory} 
              onGenerateCostAnalysis={(inventory) => generateCostAnalysisMutation.mutate(inventory)}
              costAnalysisLoading={generateCostAnalysisMutation.isPending}
              costAnalysisResult={generateCostAnalysisMutation.data}
              automaticCostAnalysis={automaticCostAnalysis}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface InventoryResultsProps {
  inventory: UnifiedInventory;
  onGenerateCostAnalysis: (inventory: UnifiedInventory) => void;
  costAnalysisLoading: boolean;
  costAnalysisResult?: any;
  automaticCostAnalysis?: any;
}

function InventoryResults({ 
  inventory, 
  onGenerateCostAnalysis, 
  costAnalysisLoading, 
  costAnalysisResult,
  automaticCostAnalysis 
}: InventoryResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Filter resources based on service, provider, and search
  const filteredResources = inventory?.resources.filter(resource => {
    const matchesService = serviceFilter === "all" || resource.service === serviceFilter;
    const matchesProvider = providerFilter === "all" || resource.provider === providerFilter;
    const matchesSearch = searchFilter === "" || 
      resource.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchFilter.toLowerCase()) ||
      resource.service.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesService && matchesProvider && matchesSearch;
  }) || [];

  // Get unique services and providers for filter dropdowns
  const availableServices = inventory ? 
    Array.from(new Set(inventory.resources.map(r => r.service))).sort() : [];
  const availableProviders = inventory ? 
    Array.from(new Set(inventory.resources.map(r => r.provider))).sort() : [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Inventory Results
        </CardTitle>
        <CardDescription>
          Discovered {inventory.summary.totalResources} resources across {Object.keys(inventory.summary.providers).length} cloud providers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="analysis">Cost Analysis</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{inventory.summary.totalResources}</div>
                  <p className="text-sm text-muted-foreground">
                    Scanned in {(inventory.scanDuration / 1000).toFixed(1)}s
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Cloud Providers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Object.keys(inventory.summary.providers).length}</div>
                  <div className="flex gap-1 mt-2">
                    {Object.entries(inventory.summary.providers).map(([provider, count]) => (
                      <Badge key={provider} variant="outline" className="text-xs capitalize">
                        {provider}: {count}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Service Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{Object.keys(inventory.summary.services).length}</div>
                  <p className="text-sm text-muted-foreground">Different services</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Services Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(inventory.summary.services)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([service, count]) => (
                        <div key={service} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(service)}
                            <span className="text-sm">{service}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(inventory.summary.locations)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 8)
                      .map(([location, count]) => (
                        <div key={location} className="flex items-center justify-between">
                          <span className="text-sm">{location}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            {/* Filter Controls */}
            <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search resources by name, type, or service..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {availableProviders.map(provider => (
                      <SelectItem key={provider} value={provider}>
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" />
                          {provider.toUpperCase()}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {availableServices.map(service => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="ml-2">
                  {filteredResources.length} of {inventory?.resources.length || 0} resources
                </Badge>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Compartment</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Specs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.slice(0, 100).map((resource) => (
                    <TableRow key={resource.id}>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell>{resource.type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getServiceIcon(resource.service)}
                          {resource.service}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {resource.provider}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{resource.location}</TableCell>
                      <TableCell className="text-sm">
                        {resource.compartmentName || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStateColor(resource.state)}`} />
                          <span className="text-sm">{resource.state}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {resource.costDetails && (
                          <div className="text-xs space-y-1">
                            {resource.costDetails.vcpus && <div>CPU: {resource.costDetails.vcpus}</div>}
                            {resource.costDetails.memory && <div>RAM: {resource.costDetails.memory}GB</div>}
                            {resource.costDetails.storage && <div>Storage: {resource.costDetails.storage}GB</div>}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredResources.length > 100 && (
              <p className="text-sm text-muted-foreground mt-4">
                Showing first 100 resources of {filteredResources.length} filtered results.
              </p>
            )}
            {filteredResources.length === 0 && inventory && inventory.resources.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4 text-center py-8">
                No resources match your current filters. Try adjusting your search or service filter.
              </p>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="mt-6">
            <div className="space-y-4">
              {automaticCostAnalysis ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cost analysis completed automatically! Here's your multi-cloud cost comparison based on your scanned resources.
                    </AlertDescription>
                  </Alert>
                  
                  {/* Display the full cost results */}
                  {console.log('automaticCostAnalysis data:', automaticCostAnalysis)}
                  <CostResults results={automaticCostAnalysis.results || automaticCostAnalysis} analysisId={automaticCostAnalysis.analysisId} />
                </div>
              ) : costAnalysisResult ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cost analysis completed! Based on your discovered resources, we've generated cost requirements for comparison across cloud providers.
                    </AlertDescription>
                  </Alert>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Generated Requirements Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-2xl font-bold">
                            {costAnalysisResult.costRequirements?.compute?.vcpus || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Total vCPUs</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {costAnalysisResult.costRequirements?.compute?.ram || 0}GB
                          </div>
                          <div className="text-sm text-muted-foreground">Total RAM</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {(costAnalysisResult.costRequirements?.storage?.objectStorage?.size || 0) + 
                             (costAnalysisResult.costRequirements?.storage?.blockStorage?.size || 0)}GB
                          </div>
                          <div className="text-sm text-muted-foreground">Total Storage</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold">
                            {costAnalysisResult.costRequirements?.database?.relational?.storage || 0}GB
                          </div>
                          <div className="text-sm text-muted-foreground">Database Storage</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Automated Cost Analysis</h3>
                    <Button
                      onClick={() => onGenerateCostAnalysis(inventory)}
                      disabled={costAnalysisLoading}
                      data-testid="button-generate-cost-analysis"
                    >
                      {costAnalysisLoading ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Generate Cost Analysis
                        </>
                      )}
                    </Button>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Click "Generate Cost Analysis" to automatically convert your discovered resources into cost requirements for multi-cloud comparison.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            <div className="space-y-4">
              {costAnalysisResult?.recommendations ? (
                <div className="grid gap-4">
                  {costAnalysisResult.recommendations.optimization?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Optimization Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {costAnalysisResult.recommendations.optimization.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {costAnalysisResult.recommendations.rightSizing?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          Right-sizing Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {costAnalysisResult.recommendations.rightSizing.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {costAnalysisResult.recommendations.costSavings?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Cost Savings Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {costAnalysisResult.recommendations.costSavings.map((rec: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Generate cost analysis first to see optimization recommendations.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}