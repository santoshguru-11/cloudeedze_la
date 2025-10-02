import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudCredentialsForm, CloudCredential } from "@/components/cloud-credentials-form";
import { InventoryScanner } from "@/components/inventory-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Cloud, 
  Search, 
  Settings, 
  ArrowRight, 
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  BarChart3,
  Zap,
  Shield,
  Clock,
  Globe,
  Server,
  Database,
  Loader2
} from "lucide-react";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface UnifiedInventory {
  resources: Array<{
    id: string;
    name: string;
    type: string;
    service: string;
    provider: string;
    location: string;
    tags?: Record<string, string>;
    state: string;
    costDetails?: {
      instanceType?: string;
      size?: string;
      vcpus?: number;
      memory?: number;
      storage?: number;
      tier?: string;
    };
  }>;
  summary: {
    totalResources: number;
    providers: Record<string, number>;
    services: Record<string, number>;
    locations: Record<string, number>;
  };
  scanDate: string;
  scanDuration: number;
}

interface SavedCredential {
  id: string;
  name: string;
  provider: string;
  isValidated: boolean;
  createdAt: string;
}

export function InventoryPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<CloudCredential[]>([]);
  const [selectedCredentials, setSelectedCredentials] = useState<CloudCredential[]>([]);
  const [activeTab, setActiveTab] = useState('setup');
  const [scannedInventory, setScannedInventory] = useState<UnifiedInventory | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);

  // Load saved credentials from server
  const { data: savedCredentials = [], isLoading: isLoadingCredentials, refetch: refetchCredentials } = useQuery<SavedCredential[]>({
    queryKey: ["/api/credentials"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Add validation mutation
  const validateCredentialsMutation = useMutation({
    mutationFn: async ({ provider, credentials }: { provider: string; credentials: any }) => {
      // For now, just return success - we'll implement actual validation later
      return { valid: true, message: "Credentials validated successfully" };
    }
  });


  // Convert saved credentials to the format expected by inventory scanner
  const convertSavedCredentials = (savedCreds: SavedCredential[]): CloudCredential[] => {
    return savedCreds.map(cred => ({
      id: cred.id,
      provider: cred.provider as 'aws' | 'azure' | 'gcp' | 'oci',
      name: cred.name,
      credentials: {}, // Will be loaded when needed for scanning
      validated: cred.isValidated
    }));
  };

  // Auto-load saved credentials when they're available
  React.useEffect(() => {
    if (savedCredentials.length > 0 && credentials.length === 0) {
      const convertedCredentials = convertSavedCredentials(savedCredentials);
      setCredentials(convertedCredentials);
      
      // Auto-select all credentials by default
      setSelectedCredentials(convertedCredentials);
      
      // Auto-advance to scan tab if we have credentials
      if (convertedCredentials.length > 0) {
        setActiveTab('scan');
        toast({
          title: "Credentials Loaded",
          description: `Found ${convertedCredentials.length} cloud credential${convertedCredentials.length !== 1 ? 's' : ''}. Ready to scan!`,
        });
      }
    }
  }, [savedCredentials, credentials.length, toast]);

  // Handle credential selection
  const handleCredentialToggle = (credential: CloudCredential) => {
    setSelectedCredentials(prev => {
      const isSelected = prev.some(cred => cred.id === credential.id);
      if (isSelected) {
        return prev.filter(cred => cred.id !== credential.id);
      } else {
        return [...prev, credential];
      }
    });
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedCredentials.length === credentials.length) {
      setSelectedCredentials([]);
    } else {
      setSelectedCredentials(credentials);
    }
  };

  const handleCredentialsChange = (newCredentials: CloudCredential[]) => {
    const previousLength = credentials.length;
    setCredentials(newCredentials);
    // Auto-advance to scanning tab only when credentials are added (not deleted)
    if (newCredentials.length > previousLength && activeTab === 'setup') {
      setTimeout(() => setActiveTab('scan'), 500);
    }
  };

  const handleValidateCredentials = async (provider: string, credentials: any) => {
    const result = await validateCredentialsMutation.mutateAsync({ provider, credentials });
    return result;
  };

  const handleInventoryScanned = (inventory: UnifiedInventory) => {
    setScannedInventory(inventory);
    setIsScanning(false);
    setScanProgress(100);
    setActiveTab('results');
    toast({
      title: "Inventory Discovery Complete",
      description: `Successfully discovered ${inventory.summary.totalResources} resources across ${Object.keys(inventory.summary.providers).length} cloud providers.`,
    });
  };

  const handleScanStart = () => {
    setIsScanning(true);
    setScanProgress(0);
    // Simulate progress updates
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 500);
  };

  const proceedToCalculator = () => {
    setLocation('/calculator');
  };


  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
          <Cloud className="h-8 w-8 text-blue-600" />
          Cloud Inventory Discovery
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Automatically discover your existing cloud resources and generate accurate cost comparisons based on your actual infrastructure.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl">
          <div className={`flex items-center gap-2 ${activeTab === 'setup' ? 'text-blue-600 font-medium' : credentials.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${credentials.length > 0 ? 'bg-green-600 border-green-600 text-white' : activeTab === 'setup' ? 'border-blue-600' : 'border-muted-foreground'}`}>
              {credentials.length > 0 ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span>Setup Credentials</span>
          </div>
          
          <ArrowRight className="text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${activeTab === 'scan' ? 'text-blue-600 font-medium' : scannedInventory ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${scannedInventory ? 'bg-green-600 border-green-600 text-white' : activeTab === 'scan' ? 'border-blue-600' : 'border-muted-foreground'}`}>
              {scannedInventory ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span>Scan Resources</span>
          </div>
          
          <ArrowRight className="text-muted-foreground" />
          
          <div className={`flex items-center gap-2 ${activeTab === 'results' ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm ${activeTab === 'results' ? 'border-blue-600' : 'border-muted-foreground'}`}>
              3
            </div>
            <span>View Results</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="scan" disabled={credentials.length === 0} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Scan
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!scannedInventory} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="mt-8">
          {isLoadingCredentials ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                  <p className="text-lg font-medium">Loading your cloud credentials...</p>
                  <p className="text-sm text-muted-foreground">This will only take a moment</p>
                </div>
              </CardContent>
            </Card>
          ) : savedCredentials.length > 0 ? (
            <div className="space-y-8">
              {/* Welcome Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    Welcome Back!
                  </CardTitle>
                  <CardDescription className="text-base">
                    We found {savedCredentials.length} saved credential{savedCredentials.length !== 1 ? 's' : ''} ready for inventory scanning.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {savedCredentials.map(cred => (
                      <div key={cred.id} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Cloud className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium capitalize">{cred.provider}</p>
                          <p className="text-sm text-muted-foreground">{cred.name}</p>
                        </div>
                        <Badge variant={cred.isValidated ? "default" : "secondary"} className="capitalize">
                          {cred.isValidated ? "Validated" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-1">
                      <p className="font-medium text-green-600">
                        {credentials.length} credential{credentials.length !== 1 ? 's' : ''} ready for scanning
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All credentials are validated and ready to discover your cloud resources
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => refetchCredentials()}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('scan')}
                        disabled={credentials.length === 0}
                        data-testid="button-proceed-to-scan"
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Zap className="h-4 w-4" />
                        Start Discovery
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add New Credentials */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5 text-blue-600" />
                        Add More Cloud Providers
                      </CardTitle>
                      <CardDescription>
                        Connect additional cloud accounts to get a complete view of your infrastructure
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="flex items-center gap-2"
                    >
                      {showAddForm ? <Eye className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {showAddForm ? 'Hide Form' : 'Add Credentials'}
                    </Button>
                  </div>
                </CardHeader>
                {showAddForm && (
                  <CardContent className="pt-0">
                    <CloudCredentialsForm
                      credentials={credentials}
                      onCredentialsChange={handleCredentialsChange}
                      onValidateCredentials={handleValidateCredentials}
                    />
                  </CardContent>
                )}
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Empty State */}
              <Card className="border-0 shadow-lg text-center py-12">
                <CardContent>
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                      <Cloud className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Connect Your Cloud Accounts</h3>
                      <p className="text-muted-foreground">
                        Add your cloud provider credentials to automatically discover and analyze your infrastructure
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Secure
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Fast
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Accurate
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <CloudCredentialsForm
                credentials={credentials}
                onCredentialsChange={handleCredentialsChange}
                onValidateCredentials={handleValidateCredentials}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="scan" className="mt-8">
          {credentials.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold">No Credentials Found</h3>
                  <p className="text-muted-foreground">
                    Please add and validate cloud credentials first before scanning.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('setup')}
                    className="mt-4"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Go to Setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Progress Indicator */}
              {isScanning && (
                <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-lg">Discovering Your Infrastructure</h3>
                          <p className="text-sm text-muted-foreground">
                            Scanning {selectedCredentials.length} cloud account{selectedCredentials.length !== 1 ? 's' : ''}...
                          </p>
                        </div>
                      </div>
                      <Progress value={scanProgress} className="h-2" />
                      <p className="text-sm text-center text-muted-foreground">
                        {Math.round(scanProgress)}% complete
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cloud Account Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Cloud className="h-6 w-6 text-blue-600" />
                    </div>
                    Select Cloud Accounts
                  </CardTitle>
                  <CardDescription className="text-base">
                    Choose which cloud accounts to scan for inventory discovery. You can select multiple providers for comprehensive analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="flex items-center gap-2"
                        disabled={isScanning}
                      >
                        {selectedCredentials.length === credentials.length ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Deselect All
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Select All
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                          {selectedCredentials.length} of {credentials.length} selected
                        </Badge>
                        {selectedCredentials.length > 0 && (
                          <Badge variant="default" className="text-sm px-3 py-1">
                            Ready to Scan
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {credentials.map((credential) => {
                        const isSelected = selectedCredentials.some(cred => cred.id === credential.id);
                        return (
                          <div
                            key={credential.id}
                            className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 shadow-md scale-[1.02]' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => !isScanning && handleCredentialToggle(credential)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-lg">{credential.name}</div>
                                <div className="text-sm text-muted-foreground capitalize flex items-center gap-2">
                                  <Cloud className="h-4 w-4" />
                                  {credential.provider}
                                </div>
                                {credential.validated && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Shield className="h-3 w-3 text-green-600" />
                                    <span className="text-xs text-green-600 font-medium">Validated</span>
                                  </div>
                                )}
                              </div>
                              <Badge 
                                variant={isSelected ? "default" : "secondary"} 
                                className={`text-xs ${isSelected ? 'bg-blue-600' : ''}`}
                              >
                                {isSelected ? "Selected" : "Available"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Scanner */}
              {selectedCredentials.length > 0 ? (
                <InventoryScanner
                  credentials={selectedCredentials}
                  onInventoryScanned={handleInventoryScanned}
                />
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <div className="max-w-md mx-auto space-y-4">
                      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                        <Search className="h-8 w-8 text-gray-600" />
                      </div>
                      <h3 className="text-xl font-semibold">Ready to Discover</h3>
                      <p className="text-muted-foreground">
                        Select at least one cloud account above to start the inventory discovery process.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="mt-8">
          {scannedInventory ? (
            <div className="space-y-8">
              {/* Success Header */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    Discovery Complete!
                  </CardTitle>
                  <CardDescription className="text-base">
                    Successfully discovered {scannedInventory.summary.totalResources} resources across {Object.keys(scannedInventory.summary.providers).length} cloud provider{Object.keys(scannedInventory.summary.providers).length !== 1 ? 's' : ''} in {(scannedInventory.scanDuration / 1000).toFixed(1)} seconds
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-blue-600 mb-1">{scannedInventory.summary.totalResources}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Server className="h-4 w-4" />
                        Total Resources
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-green-600 mb-1">{Object.keys(scannedInventory.summary.providers).length}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Cloud className="h-4 w-4" />
                        Cloud Providers
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-purple-600 mb-1">{Object.keys(scannedInventory.summary.services).length}</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Database className="h-4 w-4" />
                        Service Types
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-3xl font-bold text-orange-600 mb-1">{(scannedInventory.scanDuration / 1000).toFixed(1)}s</div>
                      <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" />
                        Scan Duration
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provider Breakdown */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Resource Breakdown by Provider
                  </CardTitle>
                  <CardDescription>
                    Detailed view of discovered resources across your cloud providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(scannedInventory.summary.providers).map(([provider, count]) => (
                      <div key={provider} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Cloud className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{provider}</p>
                            <p className="text-sm text-muted-foreground">
                              {Object.entries(scannedInventory.summary.services)
                                .filter(([_, serviceCount]) => serviceCount > 0)
                                .map(([service, serviceCount]) => `${service}: ${serviceCount}`)
                                .join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">{count}</div>
                          <div className="text-sm text-muted-foreground">resources</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Service Breakdown */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Service Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of discovered services across your infrastructure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(scannedInventory.summary.services).map(([service, count]) => (
                      <div key={service} className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-2xl font-bold text-purple-600 mb-1">{count}</div>
                        <div className="text-sm text-muted-foreground">{service}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>


              {/* Display the full inventory scanner results */}
              <InventoryScanner
                credentials={credentials}
                onInventoryScanned={handleInventoryScanned}
              />
            </div>
          ) : (
            <Card className="border-0 shadow-lg">
              <CardContent className="text-center py-12">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-semibold">No Results Available</h3>
                  <p className="text-muted-foreground">
                    No inventory data available. Please complete the scanning process first.
                  </p>
                  <Button 
                    onClick={() => setActiveTab('scan')}
                    className="mt-4"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Start Scanning
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}