import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UploadIcon, FileIcon, CheckCircle, Server, Database, HardDrive, Network, Shield, Monitor, FileText, Settings2, Plus, BarChart3, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EnvironmentSelector, type EnvironmentConfig } from '@/components/cost-customization/environment-selector';
import { ScheduleConfigurator, type RunningSchedule } from '@/components/cost-customization/schedule-configurator';
import { PricingModelSelector, type PricingModel } from '@/components/cost-customization/pricing-model-selector';
import { CostCalculatorWidget, type CustomizedCostResult } from '@/components/cost-customization/cost-calculator-widget';
import { CostAnalysisResults } from '@/components/cost-analysis-results';

const environmentTypes = [
  { value: 'production', label: 'Production', color: 'bg-red-100 text-red-800' },
  { value: 'staging', label: 'Staging', color: 'bg-orange-100 text-orange-800' },
  { value: 'development', label: 'Development', color: 'bg-blue-100 text-blue-800' },
  { value: 'testing', label: 'Testing', color: 'bg-green-100 text-green-800' },
  { value: 'qa', label: 'QA', color: 'bg-purple-100 text-purple-800' },
  { value: 'demo', label: 'Demo', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'disaster-recovery', label: 'DR', color: 'bg-gray-100 text-gray-800' }
];

export default function TerraformUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Resource management with environments
  const [resources, setResources] = useState<any[]>([]);
  const [resourceEnvironments, setResourceEnvironments] = useState<Record<string, string>>({});

  // Add Resource Dialog State
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);

  // Save Analysis Dialog State
  const [saveAnalysisDialogOpen, setSaveAnalysisDialogOpen] = useState(false);
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [analysisNameInput, setAnalysisNameInput] = useState('');

  const [newResource, setNewResource] = useState({
    name: '',
    type: 'compute',
    service: 'Compute',
    provider: 'aws',
    location: 'us-east-1',
    state: 'active',
    instanceType: 't3.medium',
    vcpus: 2,
    memory: 4,
    storage: 50,
    environment: 'production',
    // Additional fields for different resource types
    storageService: 'EBS',
    storageClass: 'gp3',
    iops: 3000,
    databaseService: 'RDS',
    databaseEngine: 'postgres',
    // Serverless fields
    runtime: 'nodejs20.x',
    memoryMB: 256,
    timeout: 30,
    concurrency: 100,
    // Container fields
    containerService: 'ECS',
    taskCpu: 256,
    taskMemory: 512,
    containerCount: 1,
    // Networking fields
    networkType: 'VPC',
    bandwidth: 100,
    // Monitoring fields
    monitoringService: 'CloudWatch',
    retentionDays: 7
  });

  // Handler for resource type change
  const handleResourceTypeChange = (newService: string) => {
    const baseResource = {
      name: newResource.name,
      type: newService.toLowerCase(),
      service: newService,
      provider: newResource.provider,
      location: newResource.location,
      state: newResource.state,
      environment: newResource.environment
    };

    switch (newService) {
      case 'Compute':
        setNewResource({
          ...baseResource,
          instanceType: 't3.medium',
          vcpus: 2,
          memory: 4,
          storage: 50
        } as any);
        break;
      case 'Storage':
        setNewResource({
          ...baseResource,
          storageService: newResource.provider === 'aws' ? 'EBS' : 'Block Volume',
          storageClass: 'gp3',
          storage: 100,
          iops: 3000
        } as any);
        break;
      case 'Database':
        setNewResource({
          ...baseResource,
          databaseService: newResource.provider === 'aws' ? 'RDS' : 'Cloud SQL',
          databaseEngine: 'postgres',
          instanceType: 'db.t3.medium',
          storage: 100
        } as any);
        break;
      case 'Serverless':
        setNewResource({
          ...baseResource,
          runtime: 'nodejs20.x',
          memoryMB: 256,
          timeout: 30,
          concurrency: 100
        } as any);
        break;
      case 'Container':
        setNewResource({
          ...baseResource,
          containerService: newResource.provider === 'aws' ? 'ECS' : 'Kubernetes',
          taskCpu: 256,
          taskMemory: 512,
          containerCount: 1
        } as any);
        break;
      case 'Networking':
        setNewResource({
          ...baseResource,
          networkType: 'VPC',
          bandwidth: 100
        } as any);
        break;
      case 'Monitoring':
        setNewResource({
          ...baseResource,
          monitoringService: newResource.provider === 'aws' ? 'CloudWatch' : 'Monitor',
          retentionDays: 7
        } as any);
        break;
      default:
        setNewResource({
          ...baseResource,
          instanceType: 't3.medium',
          storage: 50
        } as any);
    }
  };

  // Cost Customization State
  const [customizedCostResult, setCustomizedCostResult] = useState<CustomizedCostResult | null>(null);
  const [customization, setCustomization] = useState({
    environment: {
      name: "Production",
      type: "production" as const,
      description: ""
    },
    runningSchedule: {
      hoursPerDay: 24,
      daysPerWeek: 7,
      schedule: "24/7",
      hoursPerMonth: 730
    },
    pricingModel: {
      type: "on-demand" as const
    }
  });

  // Show comprehensive cost analysis results
  const [showComprehensiveResults, setShowComprehensiveResults] = useState(false);

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'compute':
        return <Server className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'networking':
        return <Network className="h-4 w-4" />;
      case 'monitoring':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getStateBadgeClass = (state: string) => {
    switch (state.toLowerCase()) {
      case 'active':
      case 'running':
        return 'bg-green-100 text-green-800';
      case 'stopped':
      case 'stopping':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'starting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getResourceSpecs = (costDetails: any) => {
    if (!costDetails) return '-';
    
    const specs = [];
    
    // CPU and Memory
    if (costDetails.vcpus && costDetails.memory) {
      specs.push(`${costDetails.vcpus} vCPU, ${costDetails.memory}GB RAM`);
    }
    
    // Storage
    if (costDetails.storage) {
      const storageSize = costDetails.storage > 1024 ? 
        `${(costDetails.storage / 1024).toFixed(1)}TB` : 
        `${costDetails.storage}GB`;
      specs.push(`${storageSize} ${costDetails.storageType || 'storage'}`);
    }
    
    // Database specific
    if (costDetails.engine) {
      specs.push(`${costDetails.engine} ${costDetails.engineVersion || ''}`);
    }
    
    // IOPS
    if (costDetails.iops) {
      specs.push(`${costDetails.iops} IOPS`);
    }
    
    // Network
    if (costDetails.cidrBlock) {
      specs.push(`CIDR: ${costDetails.cidrBlock}`);
    }
    
    // Function specific
    if (costDetails.runtime) {
      specs.push(`${costDetails.runtime} (${costDetails.memory}MB)`);
    }
    
    // Container specific
    if (costDetails.nodeCount) {
      specs.push(`${costDetails.nodeCount} nodes`);
    }
    
    return specs.length > 0 ? specs.join(', ') : '-';
  };

  const analyzeMutation = useMutation({
    mutationFn: async (uploadResult: any) => {
      if (uploadResult.costAnalysis) {
        // Cost analysis already generated, navigate to results
        return { analysis: { analysisId: uploadResult.costAnalysis.analysisId } };
      } else {
        // Generate cost analysis from inventory
        return await apiRequest("POST", "/api/inventory/analyze-costs", {
          inventory: uploadResult.inventory,
          scanId: uploadResult.scanId
        });
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/analyses"] });
      toast({
        title: "Success",
        description: "Terraform state analyzed successfully",
      });
      if (data?.analysis?.analysisId) {
        navigate(`/results/${data.analysis.analysisId}`);
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to analyze Terraform state",
        variant: "destructive",
      });
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.tfstate') && !file.name.endsWith('.json')) {
      toast({
        title: "Invalid File",
        description: "Please select a .tfstate or .json file",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleEnvironmentChange = (resourceId: string, environment: string) => {
    setResourceEnvironments(prev => ({
      ...prev,
      [resourceId]: environment
    }));
  };

  const handleSubmitNewResource = () => {
    if (!newResource.name.trim()) {
      return; // Don't add if name is empty
    }

    const resourceToAdd = {
      id: `custom-${Date.now()}`,
      name: newResource.name,
      type: newResource.type,
      service: newResource.service,
      provider: newResource.provider,
      location: newResource.location,
      state: newResource.state,
      costDetails: {
        instanceType: newResource.instanceType,
        vcpus: newResource.vcpus,
        memory: newResource.memory,
        storage: newResource.storage
      }
    };

    setResources([...resources, resourceToAdd]);
    setResourceEnvironments(prev => ({
      ...prev,
      [resourceToAdd.id]: newResource.environment
    }));

    // Reset form and close dialog
    setNewResource({
      name: '',
      type: 'compute',
      service: 'Compute',
      provider: 'aws',
      location: 'us-east-1',
      state: 'active',
      instanceType: 't3.medium',
      vcpus: 2,
      memory: 4,
      storage: 50,
      environment: 'production',
      storageService: 'EBS',
      storageClass: 'gp3',
      iops: 3000,
      databaseService: 'RDS',
      databaseEngine: 'postgres'
    });
    setAddResourceDialogOpen(false);
  };

  const parseAndAnalyzeTerraform = async () => {
    if (!selectedFile) return;

    try {
      const fileContent = await selectedFile.text();
      const terraformState = JSON.parse(fileContent);
      
      // Send to server for parsing and analysis
      const response = await apiRequest("POST", "/api/terraform/parse", {
        terraformState
      });
      const result = await response.json();
      
      if (result.success) {
        setUploadResult({
          scanId: result.scanId,
          inventory: result.inventory,
          costAnalysis: result.costAnalysis
        });

        // Initialize resources with default production environment
        if (result.inventory?.resources) {
          setResources(result.inventory.resources);
          const defaultEnvs: Record<string, string> = {};
          result.inventory.resources.forEach((resource: any) => {
            defaultEnvs[resource.id] = 'production';
          });
          setResourceEnvironments(defaultEnvs);
        }

        toast({
          title: "Terraform State Parsed",
          description: `Found ${result.inventory.resources?.length || 0} resources and generated cost analysis`,
        });
      } else {
        throw new Error(result.message || "Failed to parse Terraform state");
      }
    } catch (error) {
      console.error("Terraform parsing error:", error);
      toast({
        title: "Parse Error",
        description: error instanceof Error ? error.message : "Failed to parse Terraform state file. Please check the file format.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!uploadResult?.scanId) return;

    setGeneratingReport(true);

    try {
      const response = await apiRequest("POST", "/api/reports/generate", {
        scanId: uploadResult.scanId
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: "Report generated successfully. Redirecting to Reports page...",
        });
        // Redirect to reports page after a short delay
        setTimeout(() => {
          navigate('/reports');
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: result.message || 'Failed to generate report',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleGenerateComprehensiveCostAnalysis = () => {
    if (!uploadResult) return;

    // Generate comprehensive cost analysis and show results
    setShowComprehensiveResults(true);

    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAnalysis = () => {
    if (!uploadResult?.costAnalysis?.analysisId) {
      toast({
        title: "Error",
        description: "No analysis to save",
        variant: "destructive",
      });
      return;
    }
    setSaveAnalysisDialogOpen(true);
  };

  const handleConfirmSaveAnalysis = async () => {
    if (!uploadResult?.costAnalysis?.analysisId) return;

    setSavingAnalysis(true);
    try {
      const analysisName = analysisNameInput.trim() || `Terraform-Analysis-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}`;

      const response = await apiRequest("POST", "/api/cost-analysis/save", {
        analysisId: uploadResult.costAnalysis.analysisId,
        customName: analysisName,
        results: getCostAnalysisData()
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Analysis saved successfully as "${analysisName}"!`,
        });
        setSaveAnalysisDialogOpen(false);
        setAnalysisNameInput('');
      } else {
        toast({
          title: "Error",
          description: result.message || 'Failed to save analysis',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Save analysis error:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingAnalysis(false);
    }
  };

  // Prepare cost analysis data for the results component
  const getCostAnalysisData = () => {
    if (!uploadResult) return null;

    // Calculate baseline cost from resources
    const baselineCost = uploadResult.inventory.resources.reduce((total: number, resource: any) =>
      total + (resource.costDetails?.estimatedMonthlyCost || 0), 0) || 200;

    return {
      providers: {
        oracle: {
          total: baselineCost * 0.88, // Oracle typically cheapest
          breakdown: {
            Compute: baselineCost * 0.60,
            Networking: baselineCost * 0.15,
            Storage: baselineCost * 0.08,
            Database: baselineCost * 0.05
          }
        },
        gcp: {
          total: baselineCost * 0.93,
          breakdown: {
            Compute: baselineCost * 0.63,
            Networking: baselineCost * 0.16,
            Storage: baselineCost * 0.09,
            Database: baselineCost * 0.05
          }
        },
        azure: {
          total: baselineCost * 0.96,
          breakdown: {
            Compute: baselineCost * 0.66,
            Networking: baselineCost * 0.16,
            Storage: baselineCost * 0.09,
            Database: baselineCost * 0.05
          }
        },
        aws: {
          total: baselineCost,
          breakdown: {
            Compute: baselineCost * 0.69,
            Networking: baselineCost * 0.17,
            Storage: baselineCost * 0.09,
            Database: baselineCost * 0.05
          }
        }
      },
      services: ['Compute', 'Licensing', 'Storage', 'Database', 'Networking', 'Analytics', 'AI/ML', 'Security', 'Monitoring', 'Backup']
    };
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Terraform State Upload - Cloudedze</title>
        <meta name="description" content="Upload your Terraform state files to automatically analyze your infrastructure and calculate cloud costs." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Terraform State Analysis</h1>
        <p className="text-gray-600">
          Upload your Terraform state file (.tfstate) to automatically analyze your infrastructure and calculate costs.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Show Comprehensive Results or Configuration Flow */}
        {showComprehensiveResults && uploadResult ? (
          <>
            {/* Back Button */}
            <Button
              onClick={() => setShowComprehensiveResults(false)}
              variant="outline"
              className="mb-4"
            >
              <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
              Back to Configuration
            </Button>

            {/* Comprehensive Cost Analysis Results */}
            <CostAnalysisResults
              data={getCostAnalysisData()!}
              onExportCSV={() => {
                toast({
                  title: "Export CSV",
                  description: "CSV export functionality coming soon",
                });
              }}
              onGeneratePDF={handleGenerateReport}
              onSaveAnalysis={handleSaveAnalysis}
            />

            {/* Success Message - shown after comprehensive results */}
            <Alert className="border-green-200 bg-green-50 mt-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">Resources discovered successfully!</p>
                    <p className="text-sm mt-1">Cost analysis complete. You can save the analysis or generate a PDF report.</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5" />
              Upload Terraform State File
            </CardTitle>
            <CardDescription>
              Upload a .tfstate file to parse your infrastructure resources and calculate costs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              data-testid="drop-zone"
            >
              {selectedFile ? (
                <div className="space-y-4">
                  <FileIcon className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={parseAndAnalyzeTerraform} data-testid="button-parse">
                      Parse & Analyze
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedFile(null);
                        setUploadResult(null);
                      }}
                      data-testid="button-clear"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-medium">Drop your .tfstate file here</p>
                    <p className="text-gray-500">or click to browse</p>
                  </div>
                  <input
                    type="file"
                    accept=".tfstate,.json"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                    id="file-input"
                    data-testid="input-file"
                  />
                  <Button asChild>
                    <label htmlFor="file-input" className="cursor-pointer">
                      Browse Files
                    </label>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {uploadResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Parsed Resources
              </CardTitle>
              <CardDescription>
                Resources found in your Terraform state file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadResult.inventory.summary.totalResources}
                  </div>
                  <div className="text-sm text-gray-600">Total Resources</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Object.keys(uploadResult.inventory.summary.providers).length}
                  </div>
                  <div className="text-sm text-gray-600">Providers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(uploadResult.inventory.summary.services).length}
                  </div>
                  <div className="text-sm text-gray-600">Services</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.keys(uploadResult.inventory.summary.regions).length}
                  </div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
              </div>

              {/* Success Message with Actions */}
              <Alert className="border-green-200 bg-green-50 mb-6">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">Terraform state parsed successfully!</p>
                      <p className="text-sm mt-1">Click "Generate Report" to create a PDF report for this analysis.</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={handleGenerateReport}
                        disabled={generatingReport}
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {generatingReport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-1" />
                            Generate Report
                          </>
                        )}
                      </Button>
                      {uploadResult.costAnalysis && (
                        <Button
                          onClick={() => navigate(`/results/${uploadResult.costAnalysis.analysisId}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Cost Analysis
                        </Button>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Resources Table */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Discovered Resources</h3>
                  <Dialog open={addResourceDialogOpen} onOpenChange={setAddResourceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Resource</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new infrastructure resource
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {/* Step 1: Cloud Provider - Choose cloud first */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="provider">Cloud Provider *</Label>
                            <Select
                              value={newResource.provider}
                              onValueChange={(value) => setNewResource({...newResource, provider: value})}
                            >
                              <SelectTrigger id="provider">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aws">AWS</SelectItem>
                                <SelectItem value="azure">Azure</SelectItem>
                                <SelectItem value="gcp">GCP</SelectItem>
                                <SelectItem value="oci">Oracle Cloud (OCI)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="service">Resource Type *</Label>
                            <Select
                              value={newResource.service}
                              onValueChange={handleResourceTypeChange}
                            >
                              <SelectTrigger id="service">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Compute">Compute</SelectItem>
                                <SelectItem value="Database">Database</SelectItem>
                                <SelectItem value="Storage">Storage</SelectItem>
                                <SelectItem value="Serverless">Serverless</SelectItem>
                                <SelectItem value="Container">Container</SelectItem>
                                <SelectItem value="Networking">Networking</SelectItem>
                                <SelectItem value="Monitoring">Monitoring</SelectItem>
                                <SelectItem value="Security">Security</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Step 2: Resource Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="resourceName">Resource Name *</Label>
                            <Input
                              id="resourceName"
                              value={newResource.name}
                              onChange={(e) => setNewResource({...newResource, name: e.target.value})}
                              placeholder="e.g., web-server-1, db-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="resourceType">Resource Type Tag</Label>
                            <Input
                              id="resourceType"
                              value={newResource.type}
                              onChange={(e) => setNewResource({...newResource, type: e.target.value})}
                              placeholder="e.g., compute, database"
                            />
                          </div>
                        </div>

                        {/* Step 3: Resource Specifications - Dynamic based on service */}
                        {newResource.service === 'Compute' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="instanceType">Instance/VM Type</Label>
                                <Input
                                  id="instanceType"
                                  value={newResource.instanceType}
                                  onChange={(e) => setNewResource({...newResource, instanceType: e.target.value})}
                                  placeholder="e.g., t3.medium, Standard_D2s_v3"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="vcpus">vCPUs</Label>
                                <Input
                                  id="vcpus"
                                  type="number"
                                  min="1"
                                  value={newResource.vcpus}
                                  onChange={(e) => setNewResource({...newResource, vcpus: parseInt(e.target.value) || 0})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="memory">Memory (GB)</Label>
                                <Input
                                  id="memory"
                                  type="number"
                                  min="1"
                                  value={newResource.memory}
                                  onChange={(e) => setNewResource({...newResource, memory: parseInt(e.target.value) || 0})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="storage">Storage (GB)</Label>
                                <Input
                                  id="storage"
                                  type="number"
                                  min="0"
                                  value={newResource.storage}
                                  onChange={(e) => setNewResource({...newResource, storage: parseInt(e.target.value) || 0})}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Storage' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="storageService">Storage Service</Label>
                                <Select
                                  value={newResource.storageService}
                                  onValueChange={(value) => setNewResource({...newResource, storageService: value})}
                                >
                                  <SelectTrigger id="storageService">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {newResource.provider === 'aws' && (
                                      <>
                                        <SelectItem value="S3">S3 (Object Storage)</SelectItem>
                                        <SelectItem value="EBS">EBS (Block Storage)</SelectItem>
                                        <SelectItem value="EFS">EFS (File Storage)</SelectItem>
                                        <SelectItem value="FSx">FSx (Managed File System)</SelectItem>
                                        <SelectItem value="Glacier">Glacier (Archive)</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'azure' && (
                                      <>
                                        <SelectItem value="Blob Storage">Blob Storage</SelectItem>
                                        <SelectItem value="Managed Disks">Managed Disks</SelectItem>
                                        <SelectItem value="Files">Azure Files</SelectItem>
                                        <SelectItem value="Queue Storage">Queue Storage</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'gcp' && (
                                      <>
                                        <SelectItem value="Cloud Storage">Cloud Storage</SelectItem>
                                        <SelectItem value="Persistent Disk">Persistent Disk</SelectItem>
                                        <SelectItem value="Filestore">Filestore</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'oci' && (
                                      <>
                                        <SelectItem value="Object Storage">Object Storage</SelectItem>
                                        <SelectItem value="Block Volume">Block Volume</SelectItem>
                                        <SelectItem value="File Storage">File Storage</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="storageClass">Storage Class/Tier</Label>
                                <Select
                                  value={newResource.storageClass}
                                  onValueChange={(value) => setNewResource({...newResource, storageClass: value})}
                                >
                                  <SelectTrigger id="storageClass">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="gp3">General Purpose (gp3/Standard)</SelectItem>
                                    <SelectItem value="io2">Provisioned IOPS (io2/Premium)</SelectItem>
                                    <SelectItem value="st1">Throughput Optimized (st1/Cool)</SelectItem>
                                    <SelectItem value="sc1">Cold Storage (sc1/Archive)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="storage">Storage Size (GB)</Label>
                                <Input
                                  id="storage"
                                  type="number"
                                  min="1"
                                  value={newResource.storage}
                                  onChange={(e) => setNewResource({...newResource, storage: parseInt(e.target.value) || 0})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="iops">IOPS (Optional)</Label>
                                <Input
                                  id="iops"
                                  type="number"
                                  min="0"
                                  value={newResource.iops}
                                  onChange={(e) => setNewResource({...newResource, iops: parseInt(e.target.value) || 0})}
                                  placeholder="e.g., 3000"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Database' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="databaseService">Database Service</Label>
                                <Select
                                  value={newResource.databaseService}
                                  onValueChange={(value) => setNewResource({...newResource, databaseService: value})}
                                >
                                  <SelectTrigger id="databaseService">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {newResource.provider === 'aws' && (
                                      <>
                                        <SelectItem value="RDS">RDS (Relational)</SelectItem>
                                        <SelectItem value="Aurora">Aurora</SelectItem>
                                        <SelectItem value="DynamoDB">DynamoDB (NoSQL)</SelectItem>
                                        <SelectItem value="DocumentDB">DocumentDB</SelectItem>
                                        <SelectItem value="Neptune">Neptune (Graph)</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'azure' && (
                                      <>
                                        <SelectItem value="SQL Database">Azure SQL Database</SelectItem>
                                        <SelectItem value="Cosmos DB">Cosmos DB</SelectItem>
                                        <SelectItem value="MySQL">Azure Database for MySQL</SelectItem>
                                        <SelectItem value="PostgreSQL">Azure Database for PostgreSQL</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'gcp' && (
                                      <>
                                        <SelectItem value="Cloud SQL">Cloud SQL</SelectItem>
                                        <SelectItem value="Cloud Spanner">Cloud Spanner</SelectItem>
                                        <SelectItem value="Firestore">Firestore</SelectItem>
                                        <SelectItem value="Bigtable">Bigtable</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="databaseEngine">Database Engine</Label>
                                <Select
                                  value={newResource.databaseEngine}
                                  onValueChange={(value) => setNewResource({...newResource, databaseEngine: value})}
                                >
                                  <SelectTrigger id="databaseEngine">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="postgres">PostgreSQL</SelectItem>
                                    <SelectItem value="mysql">MySQL</SelectItem>
                                    <SelectItem value="mariadb">MariaDB</SelectItem>
                                    <SelectItem value="sqlserver">SQL Server</SelectItem>
                                    <SelectItem value="oracle">Oracle</SelectItem>
                                    <SelectItem value="mongodb">MongoDB</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="instanceType">Instance Type</Label>
                                <Input
                                  id="instanceType"
                                  value={newResource.instanceType}
                                  onChange={(e) => setNewResource({...newResource, instanceType: e.target.value})}
                                  placeholder="e.g., db.t3.medium"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="storage">Storage (GB)</Label>
                                <Input
                                  id="storage"
                                  type="number"
                                  min="20"
                                  value={newResource.storage}
                                  onChange={(e) => setNewResource({...newResource, storage: parseInt(e.target.value) || 0})}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Serverless' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="runtime">Runtime</Label>
                                <Select
                                  value={newResource.runtime}
                                  onValueChange={(value) => setNewResource({...newResource, runtime: value})}
                                >
                                  <SelectTrigger id="runtime">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="nodejs20.x">Node.js 20.x</SelectItem>
                                    <SelectItem value="nodejs18.x">Node.js 18.x</SelectItem>
                                    <SelectItem value="python3.12">Python 3.12</SelectItem>
                                    <SelectItem value="python3.11">Python 3.11</SelectItem>
                                    <SelectItem value="java17">Java 17</SelectItem>
                                    <SelectItem value="java11">Java 11</SelectItem>
                                    <SelectItem value="dotnet8">\.NET 8</SelectItem>
                                    <SelectItem value="go1.x">Go 1.x</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="memoryMB">Memory (MB)</Label>
                                <Select
                                  value={newResource.memoryMB?.toString()}
                                  onValueChange={(value) => setNewResource({...newResource, memoryMB: parseInt(value)})}
                                >
                                  <SelectTrigger id="memoryMB">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="128">128 MB</SelectItem>
                                    <SelectItem value="256">256 MB</SelectItem>
                                    <SelectItem value="512">512 MB</SelectItem>
                                    <SelectItem value="1024">1024 MB (1 GB)</SelectItem>
                                    <SelectItem value="2048">2048 MB (2 GB)</SelectItem>
                                    <SelectItem value="4096">4096 MB (4 GB)</SelectItem>
                                    <SelectItem value="8192">8192 MB (8 GB)</SelectItem>
                                    <SelectItem value="10240">10240 MB (10 GB)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="timeout">Timeout (seconds)</Label>
                                <Input
                                  id="timeout"
                                  type="number"
                                  min="1"
                                  max="900"
                                  value={newResource.timeout}
                                  onChange={(e) => setNewResource({...newResource, timeout: parseInt(e.target.value) || 30})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="concurrency">Concurrent Executions</Label>
                                <Input
                                  id="concurrency"
                                  type="number"
                                  min="1"
                                  value={newResource.concurrency}
                                  onChange={(e) => setNewResource({...newResource, concurrency: parseInt(e.target.value) || 100})}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Container' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="containerService">Container Service</Label>
                                <Select
                                  value={newResource.containerService}
                                  onValueChange={(value) => setNewResource({...newResource, containerService: value})}
                                >
                                  <SelectTrigger id="containerService">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {newResource.provider === 'aws' && (
                                      <>
                                        <SelectItem value="ECS">ECS (Elastic Container Service)</SelectItem>
                                        <SelectItem value="EKS">EKS (Kubernetes)</SelectItem>
                                        <SelectItem value="Fargate">Fargate (Serverless)</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'azure' && (
                                      <>
                                        <SelectItem value="Container Instances">Container Instances</SelectItem>
                                        <SelectItem value="AKS">AKS (Kubernetes)</SelectItem>
                                        <SelectItem value="Container Apps">Container Apps</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'gcp' && (
                                      <>
                                        <SelectItem value="GKE">GKE (Kubernetes)</SelectItem>
                                        <SelectItem value="Cloud Run">Cloud Run</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'oci' && (
                                      <>
                                        <SelectItem value="OKE">OKE (Kubernetes)</SelectItem>
                                        <SelectItem value="Container Instances">Container Instances</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="containerCount">Container Count</Label>
                                <Input
                                  id="containerCount"
                                  type="number"
                                  min="1"
                                  value={newResource.containerCount}
                                  onChange={(e) => setNewResource({...newResource, containerCount: parseInt(e.target.value) || 1})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="taskCpu">CPU (vCPU units)</Label>
                                <Select
                                  value={newResource.taskCpu?.toString()}
                                  onValueChange={(value) => setNewResource({...newResource, taskCpu: parseInt(value)})}
                                >
                                  <SelectTrigger id="taskCpu">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="256">0.25 vCPU</SelectItem>
                                    <SelectItem value="512">0.5 vCPU</SelectItem>
                                    <SelectItem value="1024">1 vCPU</SelectItem>
                                    <SelectItem value="2048">2 vCPU</SelectItem>
                                    <SelectItem value="4096">4 vCPU</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="taskMemory">Memory (MB)</Label>
                                <Select
                                  value={newResource.taskMemory?.toString()}
                                  onValueChange={(value) => setNewResource({...newResource, taskMemory: parseInt(value)})}
                                >
                                  <SelectTrigger id="taskMemory">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="512">512 MB</SelectItem>
                                    <SelectItem value="1024">1 GB</SelectItem>
                                    <SelectItem value="2048">2 GB</SelectItem>
                                    <SelectItem value="4096">4 GB</SelectItem>
                                    <SelectItem value="8192">8 GB</SelectItem>
                                    <SelectItem value="16384">16 GB</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Networking' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="networkType">Network Type</Label>
                                <Select
                                  value={newResource.networkType}
                                  onValueChange={(value) => setNewResource({...newResource, networkType: value})}
                                >
                                  <SelectTrigger id="networkType">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {newResource.provider === 'aws' && (
                                      <>
                                        <SelectItem value="VPC">VPC (Virtual Private Cloud)</SelectItem>
                                        <SelectItem value="ALB">Application Load Balancer</SelectItem>
                                        <SelectItem value="NLB">Network Load Balancer</SelectItem>
                                        <SelectItem value="NAT Gateway">NAT Gateway</SelectItem>
                                        <SelectItem value="VPN">VPN Gateway</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'azure' && (
                                      <>
                                        <SelectItem value="VNet">Virtual Network</SelectItem>
                                        <SelectItem value="Load Balancer">Load Balancer</SelectItem>
                                        <SelectItem value="Application Gateway">Application Gateway</SelectItem>
                                        <SelectItem value="VPN Gateway">VPN Gateway</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'gcp' && (
                                      <>
                                        <SelectItem value="VPC">VPC Network</SelectItem>
                                        <SelectItem value="Cloud Load Balancer">Cloud Load Balancer</SelectItem>
                                        <SelectItem value="Cloud NAT">Cloud NAT</SelectItem>
                                        <SelectItem value="VPN">Cloud VPN</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="bandwidth">Bandwidth (Mbps)</Label>
                                <Input
                                  id="bandwidth"
                                  type="number"
                                  min="0"
                                  value={newResource.bandwidth}
                                  onChange={(e) => setNewResource({...newResource, bandwidth: parseInt(e.target.value) || 100})}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Monitoring' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="monitoringService">Monitoring Service</Label>
                                <Select
                                  value={newResource.monitoringService}
                                  onValueChange={(value) => setNewResource({...newResource, monitoringService: value})}
                                >
                                  <SelectTrigger id="monitoringService">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {newResource.provider === 'aws' && (
                                      <>
                                        <SelectItem value="CloudWatch">CloudWatch</SelectItem>
                                        <SelectItem value="X-Ray">X-Ray</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'azure' && (
                                      <>
                                        <SelectItem value="Azure Monitor">Azure Monitor</SelectItem>
                                        <SelectItem value="Application Insights">Application Insights</SelectItem>
                                      </>
                                    )}
                                    {newResource.provider === 'gcp' && (
                                      <>
                                        <SelectItem value="Cloud Monitoring">Cloud Monitoring</SelectItem>
                                        <SelectItem value="Cloud Trace">Cloud Trace</SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="retentionDays">Retention (Days)</Label>
                                <Input
                                  id="retentionDays"
                                  type="number"
                                  min="1"
                                  max="365"
                                  value={newResource.retentionDays}
                                  onChange={(e) => setNewResource({...newResource, retentionDays: parseInt(e.target.value) || 7})}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {newResource.service === 'Security' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="instanceType">Security Service</Label>
                                <Input
                                  id="instanceType"
                                  value={newResource.instanceType}
                                  onChange={(e) => setNewResource({...newResource, instanceType: e.target.value})}
                                  placeholder="e.g., Security Group, WAF, Firewall"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="storage">Rules/Policies Count</Label>
                                <Input
                                  id="storage"
                                  type="number"
                                  min="0"
                                  value={newResource.storage}
                                  onChange={(e) => setNewResource({...newResource, storage: parseInt(e.target.value) || 0})}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Step 4: Location and Environment */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location / Region</Label>
                            <Input
                              id="location"
                              value={newResource.location}
                              onChange={(e) => setNewResource({...newResource, location: e.target.value})}
                              placeholder="e.g., us-east-1, eastus"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Select
                              value={newResource.state}
                              onValueChange={(value) => setNewResource({...newResource, state: value})}
                            >
                              <SelectTrigger id="state">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="stopped">Stopped</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="terminated">Terminated</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newResourceEnv">Environment</Label>
                          <Select
                            value={newResource.environment}
                            onValueChange={(value) => setNewResource({...newResource, environment: value})}
                          >
                            <SelectTrigger id="newResourceEnv">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {environmentTypes.map((env) => (
                                <SelectItem key={env.value} value={env.value}>
                                  <Badge className={env.color} variant="outline">
                                    {env.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setAddResourceDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSubmitNewResource}
                          disabled={!newResource.name.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add Resource
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
                        <TableHead>State</TableHead>
                        <TableHead>Shape/Type</TableHead>
                        <TableHead>Specifications</TableHead>
                        <TableHead>Environment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resources.slice(0, 50).map((resource: any) => (
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
                          <TableCell>
                            <Badge className={getStateBadgeClass(resource.state)}>
                              {resource.state}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {resource.costDetails?.instanceType ||
                             resource.costDetails?.shape ||
                             resource.costDetails?.vm_size ||
                             resource.costDetails?.machine_type ||
                             resource.costDetails?.storageType || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {getResourceSpecs(resource.costDetails)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={resourceEnvironments[resource.id] || 'production'}
                              onValueChange={(value) => handleEnvironmentChange(resource.id, value)}
                            >
                              <SelectTrigger className="w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {environmentTypes.map((env) => (
                                  <SelectItem key={env.value} value={env.value}>
                                    <Badge className={env.color} variant="outline">
                                      {env.label}
                                    </Badge>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {resources.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing first 50 resources of {resources.length} total resources.
                  </p>
                )}

              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost Customization Section - Always Visible */}
        {uploadResult && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Settings2 className="h-6 w-6 text-blue-600" />
                Cost Optimization Configuration
              </CardTitle>
              <CardDescription>
                Customize your environment settings to calculate optimized costs based on your actual usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Environment */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                      1
                    </div>
                    <CardTitle className="text-lg">Environment Configuration</CardTitle>
                  </div>
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

              {/* Step 2: Schedule */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                      2
                    </div>
                    <CardTitle className="text-lg">Running Schedule</CardTitle>
                  </div>
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

              {/* Step 3: Pricing Model */}
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                      3
                    </div>
                    <CardTitle className="text-lg">Pricing Model</CardTitle>
                  </div>
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

              {/* Step 4: Calculate Optimized Costs */}
              <Card className="border-2 border-green-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold">
                      4
                    </div>
                    <CardTitle className="text-lg">Optimized Cost Analysis</CardTitle>
                  </div>
                  <CardDescription>
                    See how much you can save with your customization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CostCalculatorWidget
                    baseMonthlyCost={uploadResult.inventory.resources.reduce((total: number, resource: any) =>
                      total + (resource.costDetails?.estimatedMonthlyCost || 0), 0)}
                    environment={customization.environment}
                    runningSchedule={customization.runningSchedule}
                    pricingModel={customization.pricingModel}
                    onCalculate={setCustomizedCostResult}
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* Generate Comprehensive Cost Analysis Button */}
        {uploadResult && (
          <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-purple-900">Ready to See Your Full Cost Analysis?</h3>
                  <p className="text-sm text-purple-700 mt-2">
                    Generate a comprehensive multi-cloud cost comparison with detailed breakdowns, sustainability metrics, and optimization recommendations
                  </p>
                </div>
                <Button
                  onClick={handleGenerateComprehensiveCostAnalysis}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Generate Full Cost Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
          </>
        )}
      </div>

      {/* Save Analysis Dialog */}
      <Dialog open={saveAnalysisDialogOpen} onOpenChange={setSaveAnalysisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Analysis</DialogTitle>
            <DialogDescription>
              Provide a custom name for your analysis or leave blank to use the default name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-name">Analysis Name</Label>
              <Input
                id="analysis-name"
                placeholder={`Terraform-Analysis-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}`}
                value={analysisNameInput}
                onChange={(e) => setAnalysisNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleConfirmSaveAnalysis();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSaveAnalysisDialogOpen(false);
                setAnalysisNameInput('');
              }}
              disabled={savingAnalysis}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSaveAnalysis}
              disabled={savingAnalysis}
            >
              {savingAnalysis ? 'Saving...' : 'Save Analysis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}