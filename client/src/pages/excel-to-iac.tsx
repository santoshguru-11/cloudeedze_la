import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Helmet } from 'react-helmet-async';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Download,
  DollarSign,
  Server,
  Database,
  Network,
  HardDrive,
  AlertCircle,
  CheckCircle,
  Code,
  BarChart3,
  Settings2,
  ArrowRight,
  Plus,
  Edit
} from 'lucide-react';
import { EnvironmentSelector, type EnvironmentConfig } from '@/components/cost-customization/environment-selector';
import { ScheduleConfigurator, type RunningSchedule } from '@/components/cost-customization/schedule-configurator';
import { PricingModelSelector, type PricingModel } from '@/components/cost-customization/pricing-model-selector';
import { CostCalculatorWidget, type CustomizedCostResult } from '@/components/cost-customization/cost-calculator-widget';
import { CostAnalysisResults } from '@/components/cost-analysis-results';

interface InfrastructureRequirement {
  slNo: number;
  applicationName: string;
  workloadType: string;
  cpuName: string;
  ramGB: number;
  dataSpaceGB: number;
  category: string;
  site: string;
  environment?: string; // Added for environment assignment
}

interface CostEstimate {
  resourceName: string;
  service: string;
  monthlyEstimate: number;
  yearlyEstimate: number;
  configuration: string;
}

interface MultiCloudCost {
  estimates: CostEstimate[];
  totalMonthly: number;
  totalYearly: number;
}

interface UploadResponse {
  success: boolean;
  message: string;
  scanId?: string;
  analysisId?: string;
  summary: {
    totalResources: number;
    totalMonthlyCost: number;
    totalYearlyCost: number;
  };
  requirements: InfrastructureRequirement[];
  costEstimates: CostEstimate[];
  multiCloudCosts?: {
    aws: MultiCloudCost;
    azure: MultiCloudCost;
    gcp: MultiCloudCost;
    oci: MultiCloudCost;
  };
}

const environmentTypes = [
  { value: 'production', label: 'Production', color: 'bg-red-100 text-red-800' },
  { value: 'staging', label: 'Staging', color: 'bg-orange-100 text-orange-800' },
  { value: 'development', label: 'Development', color: 'bg-blue-100 text-blue-800' },
  { value: 'testing', label: 'Testing', color: 'bg-green-100 text-green-800' },
  { value: 'qa', label: 'QA', color: 'bg-purple-100 text-purple-800' },
  { value: 'demo', label: 'Demo', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'disaster-recovery', label: 'DR', color: 'bg-gray-100 text-gray-800' }
];

export default function ExcelToIaC() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingTerraform, setIsGeneratingTerraform] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportName, setReportName] = useState('');

  // Resource management with environments
  const [resources, setResources] = useState<InfrastructureRequirement[]>([]);
  const [resourceEnvironments, setResourceEnvironments] = useState<Record<number, string>>({});

  // Add Resource Dialog State
  const [addResourceDialogOpen, setAddResourceDialogOpen] = useState(false);

  // Save Analysis Dialog State
  const [saveAnalysisDialogOpen, setSaveAnalysisDialogOpen] = useState(false);
  const [savingAnalysis, setSavingAnalysis] = useState(false);
  const [analysisNameInput, setAnalysisNameInput] = useState('');
  const [newResource, setNewResource] = useState({
    applicationName: '',
    workloadType: 'Web Application',
    cpuName: 't3.medium',
    ramGB: 4,
    dataSpaceGB: 50,
    category: 'Compute',
    site: 'AWS',
    environment: 'production',
    // Additional fields for different resource types
    storageService: 'EBS',
    storageClass: 'gp3',
    iops: 3000,
    databaseService: 'RDS',
    databaseEngine: 'postgres',
    networkType: 'VPC',
    containerService: 'ECS',
    // Serverless fields
    runtime: 'nodejs20.x',
    memoryMB: 256,
    timeout: 30,
    concurrency: 100,
    // Container fields
    taskCpu: 256,
    taskMemory: 512,
    containerCount: 1,
    // Monitoring fields
    monitoringService: 'CloudWatch',
    retentionDays: 7,
    bandwidth: 100
  });

  // Handler for resource type (category) change
  const handleCategoryChange = (newCategory: string) => {
    const baseResource = {
      applicationName: newResource.applicationName,
      workloadType: newResource.workloadType,
      category: newCategory,
      site: newResource.site,
      environment: newResource.environment
    };

    switch (newCategory) {
      case 'Compute':
        setNewResource({
          ...baseResource,
          cpuName: 't3.medium',
          ramGB: 4,
          dataSpaceGB: 50
        } as any);
        break;
      case 'Storage':
        setNewResource({
          ...baseResource,
          storageService: newResource.site === 'AWS' ? 'EBS' : 'Block Volume',
          storageClass: 'gp3',
          dataSpaceGB: 100,
          iops: 3000
        } as any);
        break;
      case 'Database':
        setNewResource({
          ...baseResource,
          databaseService: newResource.site === 'AWS' ? 'RDS' : 'Cloud SQL',
          databaseEngine: 'postgres',
          cpuName: 'db.t3.medium',
          dataSpaceGB: 100
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
          containerService: newResource.site === 'AWS' ? 'ECS' : 'Kubernetes',
          taskCpu: 256,
          taskMemory: 512,
          containerCount: 1
        } as any);
        break;
      case 'Network':
        setNewResource({
          ...baseResource,
          networkType: 'VPC',
          bandwidth: 100
        } as any);
        break;
      default:
        setNewResource({
          ...baseResource,
          cpuName: 't3.medium',
          ramGB: 4,
          dataSpaceGB: 50
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
  const [isCalculatingCosts, setIsCalculatingCosts] = useState(false);

  // Calculate costs after inventory is loaded
  const calculateCosts = async (scanId: string, uploadData: UploadResponse) => {
    setIsCalculatingCosts(true);
    try {
      console.log('💰 Calling cost calculation API...');
      const response = await fetch('/api/excel-to-iac/calculate-costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scanId })
      });

      if (!response.ok) {
        throw new Error('Cost calculation failed');
      }

      const costData = await response.json();
      console.log('✅ Cost calculation complete', costData);

      // Update uploadResponse with actual costs
      setUploadResponse({
        ...uploadData,
        analysisId: costData.analysisId,
        summary: {
          ...uploadData.summary,
          totalMonthlyCost: costData.summary.totalMonthlyCost,
          totalYearlyCost: costData.summary.totalYearlyCost
        },
        multiCloudCosts: costData.multiCloudCosts
      });

    } catch (err) {
      console.error('Cost calculation error:', err);
      // Don't fail the whole upload if cost calculation fails
    } finally {
      setIsCalculatingCosts(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('excel', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch('/api/excel-to-iac/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const data: UploadResponse = await response.json();
      setUploadResponse(data);

      // Initialize resources with default production environment
      if (data.requirements) {
        setResources(data.requirements);
        const defaultEnvs: Record<number, string> = {};
        data.requirements.forEach((req) => {
          defaultEnvs[req.slNo] = 'production';
        });
        setResourceEnvironments(defaultEnvs);
      }

      // Automatically trigger cost calculation after inventory is loaded
      if (data.scanId) {
        console.log('📊 Inventory loaded, calculating costs...');
        calculateCosts(data.scanId, data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleEnvironmentChange = (slNo: number, environment: string) => {
    setResourceEnvironments(prev => ({
      ...prev,
      [slNo]: environment
    }));
  };

  const handleSubmitNewResource = () => {
    if (!newResource.applicationName.trim()) {
      return; // Don't add if name is empty
    }

    const newSlNo = Math.max(...resources.map(r => r.slNo), 0) + 1;
    const resourceToAdd: InfrastructureRequirement = {
      slNo: newSlNo,
      ...newResource
    };

    setResources([...resources, resourceToAdd]);
    setResourceEnvironments(prev => ({
      ...prev,
      [newSlNo]: newResource.environment
    }));

    // Reset form and close dialog
    setNewResource({
      applicationName: '',
      workloadType: 'Web Application',
      cpuName: 't3.medium',
      ramGB: 4,
      dataSpaceGB: 50,
      category: 'Compute',
      site: 'AWS',
      environment: 'production',
      storageService: 'EBS',
      storageClass: 'gp3',
      iops: 3000,
      databaseService: 'RDS',
      databaseEngine: 'postgres',
      networkType: 'VPC',
      containerService: 'ECS'
    });
    setAddResourceDialogOpen(false);
  };

  const downloadTerraform = async (provider: 'aws' | 'azure' | 'gcp' | 'oci') => {
    setIsGeneratingTerraform(true);
    try {
      const response = await fetch('/api/excel-to-iac/generate-terraform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate Terraform code');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `infrastructure-${provider}-${Date.now()}.tf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate Terraform code');
    } finally {
      setIsGeneratingTerraform(false);
    }
  };

  const downloadCSV = async (provider: 'aws' | 'azure' | 'gcp' | 'oci' | 'combined') => {
    setIsGeneratingCSV(true);
    try {
      const response = await fetch('/api/excel-to-iac/generate-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to generate cost estimate');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-estimate-${provider}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate cost estimate');
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!uploadResponse?.scanId) return;

    setGeneratingReport(true);
    setError(null);

    try {
      // Use custom report name or generate default
      const finalReportName = reportName.trim() || `Infrastructure-Report-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}`;

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scanId: uploadResponse.scanId,
          reportName: finalReportName
        })
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to reports page
        window.location.href = '/reports';
      } else {
        setError(result.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const getServiceIcon = (service: string) => {
    if (service.includes('EC2')) return <Server className="h-4 w-4" />;
    if (service.includes('RDS')) return <Database className="h-4 w-4" />;
    if (service.includes('EBS') || service.includes('EFS')) return <HardDrive className="h-4 w-4" />;
    if (service.includes('Load Balancer')) return <Network className="h-4 w-4" />;
    return <Server className="h-4 w-4" />;
  };

  const handleGenerateComprehensiveCostAnalysis = () => {
    if (!uploadResponse) return;

    // Generate comprehensive cost analysis and show results
    setShowComprehensiveResults(true);

    // Scroll to top to show results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAnalysis = () => {
    if (!uploadResponse?.analysisId) {
      setError('No analysis to save');
      return;
    }
    // Open the dialog
    setSaveAnalysisDialogOpen(true);
  };

  const handleConfirmSaveAnalysis = async () => {
    if (!uploadResponse?.analysisId) {
      setError('No analysis to save');
      return;
    }

    setSavingAnalysis(true);

    try {
      const analysisName = analysisNameInput.trim() || `Infrastructure-Analysis-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}`;

      const response = await fetch('/api/cost-analysis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          analysisId: uploadResponse.analysisId,
          customName: analysisName,
          results: getCostAnalysisData()
        })
      });

      const result = await response.json();

      if (result.success) {
        // Show success message
        alert(`Analysis saved successfully as "${analysisName}"!\n\nYou can view it in the Analyses page.`);
        setSaveAnalysisDialogOpen(false);
        setAnalysisNameInput('');
      } else {
        setError(result.message || 'Failed to save analysis');
      }
    } catch (error) {
      console.error('Save analysis error:', error);
      setError('Failed to save analysis. Please try again.');
    } finally {
      setSavingAnalysis(false);
    }
  };

  // Prepare cost analysis data for the results component
  const getCostAnalysisData = () => {
    if (!uploadResponse) return null;

    // Calculate costs per provider (using mock data for now - will be replaced with actual API data)
    const baselineCost = uploadResponse.summary.totalMonthlyCost || 200;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Helmet>
        <title>Excel to Infrastructure as Code - Cloudedze</title>
        <meta name="description" content="Convert Excel infrastructure requirements to Terraform code and get cost estimates" />
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Show Comprehensive Results or Configuration Flow */}
        {showComprehensiveResults && uploadResponse ? (
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
              onExportCSV={() => downloadCSV('combined')}
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
                  {uploadResponse.scanId && (
                    <div className="space-y-3 mt-3">
                      <div className="space-y-2">
                        <Label htmlFor="reportName" className="text-sm font-medium text-green-900">
                          Analysis/Report Name (optional)
                        </Label>
                        <Input
                          id="reportName"
                          type="text"
                          placeholder={`Infrastructure-Report-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}`}
                          value={reportName}
                          onChange={(e) => setReportName(e.target.value)}
                          className="max-w-md bg-white border-green-300"
                        />
                        <p className="text-xs text-green-700">
                          This name will be used for both saved analysis and PDF report.
                        </p>
                      </div>
                      <div className="flex gap-2">
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
                              Generate PDF Report
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Excel to Infrastructure as Code</h1>
              <p className="text-gray-600">
                Upload your infrastructure requirements Excel file to generate Terraform code and cost estimates
              </p>
            </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Infrastructure Requirements
            </CardTitle>
            <CardDescription>
              Upload an Excel file with your infrastructure requirements to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the Excel file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 font-medium">
                    Drag & drop your Excel file here, or click to select
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports .xlsx and .xls files
                  </p>
                </div>
              )}
            </div>

            {isUploading && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading and processing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {uploadResponse && (
          <>
            {/* Summary Card - Resources Only */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resources Discovered
                </CardTitle>
                <CardDescription>
                  We found {uploadResponse.summary.totalResources} infrastructure components in your Excel file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white">
                    <span className="text-3xl font-bold">{uploadResponse.summary.totalResources}</span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-blue-900">Infrastructure Resources</p>
                    <p className="text-sm text-blue-700">Configure your environment below to calculate optimized costs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multi-Cloud Cost Comparison - REMOVED, will calculate after customization */}
            {false && uploadResponse.multiCloudCosts && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Multi-Cloud Cost Comparison
                  </CardTitle>
                  <CardDescription>
                    Compare costs across AWS, Azure, GCP, and OCI
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* AWS */}
                    <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <h3 className="font-semibold text-orange-900">AWS</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-orange-600">
                          ${uploadResponse.multiCloudCosts.aws.totalMonthly.toFixed(2)}
                        </div>
                        <p className="text-sm text-orange-700">per month</p>
                        <p className="text-xs text-orange-600">
                          ${uploadResponse.multiCloudCosts.aws.totalYearly.toFixed(2)}/year
                        </p>
                      </div>
                    </div>

                    {/* Azure */}
                    <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h3 className="font-semibold text-blue-900">Azure</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-blue-600">
                          ${uploadResponse.multiCloudCosts.azure.totalMonthly.toFixed(2)}
                        </div>
                        <p className="text-sm text-blue-700">per month</p>
                        <p className="text-xs text-blue-600">
                          ${uploadResponse.multiCloudCosts.azure.totalYearly.toFixed(2)}/year
                        </p>
                      </div>
                    </div>

                    {/* GCP */}
                    <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <h3 className="font-semibold text-red-900">GCP</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-red-600">
                          ${uploadResponse.multiCloudCosts.gcp.totalMonthly.toFixed(2)}
                        </div>
                        <p className="text-sm text-red-700">per month</p>
                        <p className="text-xs text-red-600">
                          ${uploadResponse.multiCloudCosts.gcp.totalYearly.toFixed(2)}/year
                        </p>
                      </div>
                    </div>

                    {/* OCI */}
                    <div className="border rounded-lg p-4 bg-red-50 border-red-300">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 bg-red-700 rounded-full"></div>
                        <h3 className="font-semibold text-red-900">OCI</h3>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-red-700">
                          ${uploadResponse.multiCloudCosts.oci.totalMonthly.toFixed(2)}
                        </div>
                        <p className="text-sm text-red-800">per month</p>
                        <p className="text-xs text-red-700">
                          ${uploadResponse.multiCloudCosts.oci.totalYearly.toFixed(2)}/year
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Best Value Badge */}
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Best Value: {
                          (() => {
                            const costs = uploadResponse.multiCloudCosts;
                            const providers = [
                              { name: 'AWS', cost: costs.aws.totalMonthly },
                              { name: 'Azure', cost: costs.azure.totalMonthly },
                              { name: 'GCP', cost: costs.gcp.totalMonthly },
                              { name: 'OCI', cost: costs.oci.totalMonthly }
                            ];
                            const cheapest = providers.reduce((min, p) => p.cost < min.cost ? p : min);
                            return `${cheapest.name} - $${cheapest.cost.toFixed(2)}/month`;
                          })()
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Multi-Cloud Terraform Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Download Multi-Cloud Terraform Code
                </CardTitle>
                <CardDescription>
                  Generate Terraform code for all major cloud providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    onClick={() => downloadTerraform('aws')}
                    disabled={isGeneratingTerraform}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
                  >
                    <Code className="h-4 w-4" />
                    AWS
                  </Button>
                  <Button
                    onClick={() => downloadTerraform('azure')}
                    disabled={isGeneratingTerraform}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                  >
                    <Code className="h-4 w-4" />
                    Azure
                  </Button>
                  <Button
                    onClick={() => downloadTerraform('gcp')}
                    disabled={isGeneratingTerraform}
                    className="flex items-center gap-2 bg-red-500 hover:bg-red-600"
                  >
                    <Code className="h-4 w-4" />
                    GCP
                  </Button>
                  <Button
                    onClick={() => downloadTerraform('oci')}
                    disabled={isGeneratingTerraform}
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-800"
                  >
                    <Code className="h-4 w-4" />
                    OCI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Multi-Cloud Cost CSV Download */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Download Cost Estimates (CSV)
                </CardTitle>
                <CardDescription>
                  Download detailed cost breakdowns for each provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => downloadCSV('aws')}
                    disabled={isGeneratingCSV}
                    className="flex items-center gap-2 border-orange-300 hover:bg-orange-50"
                  >
                    <Download className="h-4 w-4" />
                    AWS CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadCSV('azure')}
                    disabled={isGeneratingCSV}
                    className="flex items-center gap-2 border-blue-300 hover:bg-blue-50"
                  >
                    <Download className="h-4 w-4" />
                    Azure CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadCSV('gcp')}
                    disabled={isGeneratingCSV}
                    className="flex items-center gap-2 border-red-300 hover:bg-red-50"
                  >
                    <Download className="h-4 w-4" />
                    GCP CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadCSV('oci')}
                    disabled={isGeneratingCSV}
                    className="flex items-center gap-2 border-red-400 hover:bg-red-50"
                  >
                    <Download className="h-4 w-4" />
                    OCI CSV
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => downloadCSV('combined')}
                    disabled={isGeneratingCSV}
                    className="flex items-center gap-2 col-span-2 md:col-span-1 bg-green-600 hover:bg-green-700"
                  >
                    <Download className="h-4 w-4" />
                    {isGeneratingCSV ? 'Generating...' : 'All Providers'}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  💡 Download "All Providers" for a comprehensive comparison across all clouds with savings analysis
                </p>
              </CardContent>
            </Card>

            {/* Infrastructure Requirements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      Infrastructure Requirements
                    </CardTitle>
                    <CardDescription>
                      Parsed from your Excel file - Assign environment to each resource
                    </CardDescription>
                  </div>
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
                            <Label htmlFor="site">Cloud Provider *</Label>
                            <Select
                              value={newResource.site}
                              onValueChange={(value) => setNewResource({...newResource, site: value})}
                            >
                              <SelectTrigger id="site">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AWS">AWS</SelectItem>
                                <SelectItem value="Azure">Azure</SelectItem>
                                <SelectItem value="GCP">GCP</SelectItem>
                                <SelectItem value="OCI">Oracle Cloud (OCI)</SelectItem>
                                <SelectItem value="On-Premise">On-Premise</SelectItem>
                                <SelectItem value="Hybrid">Hybrid</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Resource Type *</Label>
                            <Select
                              value={newResource.category}
                              onValueChange={handleCategoryChange}
                            >
                              <SelectTrigger id="category">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Compute">Compute</SelectItem>
                                <SelectItem value="Database">Database</SelectItem>
                                <SelectItem value="Storage">Storage</SelectItem>
                                <SelectItem value="Serverless">Serverless</SelectItem>
                                <SelectItem value="Container">Container</SelectItem>
                                <SelectItem value="Network">Network</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Step 2: Application Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="applicationName">Application Name *</Label>
                            <Input
                              id="applicationName"
                              value={newResource.applicationName}
                              onChange={(e) => setNewResource({...newResource, applicationName: e.target.value})}
                              placeholder="e.g., Web Server, Database, etc."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="workloadType">Workload Type</Label>
                            <Select
                              value={newResource.workloadType}
                              onValueChange={(value) => setNewResource({...newResource, workloadType: value})}
                            >
                              <SelectTrigger id="workloadType">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Web Application">Web Application</SelectItem>
                                <SelectItem value="Database">Database</SelectItem>
                                <SelectItem value="API Server">API Server</SelectItem>
                                <SelectItem value="Cache">Cache</SelectItem>
                                <SelectItem value="Storage">Storage</SelectItem>
                                <SelectItem value="Message Queue">Message Queue</SelectItem>
                                <SelectItem value="Load Balancer">Load Balancer</SelectItem>
                                <SelectItem value="Container">Container</SelectItem>
                                <SelectItem value="Function">Function</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Step 3: Resource Specifications - Dynamic based on category */}
                        {newResource.category === 'Compute' && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="cpuName">Instance/VM Type</Label>
                                <Input
                                  id="cpuName"
                                  value={newResource.cpuName}
                                  onChange={(e) => setNewResource({...newResource, cpuName: e.target.value})}
                                  placeholder="e.g., t3.medium, Standard_D2s_v3"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="ramGB">RAM (GB)</Label>
                                <Input
                                  id="ramGB"
                                  type="number"
                                  min="1"
                                  value={newResource.ramGB}
                                  onChange={(e) => setNewResource({...newResource, ramGB: parseInt(e.target.value) || 0})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="dataSpaceGB">Storage (GB)</Label>
                                <Input
                                  id="dataSpaceGB"
                                  type="number"
                                  min="0"
                                  value={newResource.dataSpaceGB}
                                  onChange={(e) => setNewResource({...newResource, dataSpaceGB: parseInt(e.target.value) || 0})}
                                />
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
                          </>
                        )}

                        {newResource.category === 'Storage' && (
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
                                    {newResource.site === 'AWS' && (
                                      <>
                                        <SelectItem value="S3">S3 (Object Storage)</SelectItem>
                                        <SelectItem value="EBS">EBS (Block Storage)</SelectItem>
                                        <SelectItem value="EFS">EFS (File Storage)</SelectItem>
                                        <SelectItem value="FSx">FSx (Managed File System)</SelectItem>
                                        <SelectItem value="Glacier">Glacier (Archive)</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'Azure' && (
                                      <>
                                        <SelectItem value="Blob Storage">Blob Storage</SelectItem>
                                        <SelectItem value="Managed Disks">Managed Disks</SelectItem>
                                        <SelectItem value="Files">Azure Files</SelectItem>
                                        <SelectItem value="Queue Storage">Queue Storage</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'GCP' && (
                                      <>
                                        <SelectItem value="Cloud Storage">Cloud Storage</SelectItem>
                                        <SelectItem value="Persistent Disk">Persistent Disk</SelectItem>
                                        <SelectItem value="Filestore">Filestore</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'OCI' && (
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
                                <Label htmlFor="dataSpaceGB">Storage Size (GB)</Label>
                                <Input
                                  id="dataSpaceGB"
                                  type="number"
                                  min="1"
                                  value={newResource.dataSpaceGB}
                                  onChange={(e) => setNewResource({...newResource, dataSpaceGB: parseInt(e.target.value) || 0})}
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
                          </>
                        )}

                        {newResource.category === 'Database' && (
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
                                    {newResource.site === 'AWS' && (
                                      <>
                                        <SelectItem value="RDS">RDS (Relational)</SelectItem>
                                        <SelectItem value="Aurora">Aurora</SelectItem>
                                        <SelectItem value="DynamoDB">DynamoDB (NoSQL)</SelectItem>
                                        <SelectItem value="DocumentDB">DocumentDB</SelectItem>
                                        <SelectItem value="Neptune">Neptune (Graph)</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'Azure' && (
                                      <>
                                        <SelectItem value="SQL Database">Azure SQL Database</SelectItem>
                                        <SelectItem value="Cosmos DB">Cosmos DB</SelectItem>
                                        <SelectItem value="MySQL">Azure Database for MySQL</SelectItem>
                                        <SelectItem value="PostgreSQL">Azure Database for PostgreSQL</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'GCP' && (
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
                                <Label htmlFor="cpuName">Instance Type</Label>
                                <Input
                                  id="cpuName"
                                  value={newResource.cpuName}
                                  onChange={(e) => setNewResource({...newResource, cpuName: e.target.value})}
                                  placeholder="e.g., db.t3.medium"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="dataSpaceGB">Storage (GB)</Label>
                                <Input
                                  id="dataSpaceGB"
                                  type="number"
                                  min="20"
                                  value={newResource.dataSpaceGB}
                                  onChange={(e) => setNewResource({...newResource, dataSpaceGB: parseInt(e.target.value) || 0})}
                                />
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
                          </>
                        )}

                        {newResource.category === 'Serverless' && (
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
                          </>
                        )}

                        {newResource.category === 'Container' && (
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
                                    {newResource.site === 'AWS' && (
                                      <>
                                        <SelectItem value="ECS">ECS (Elastic Container Service)</SelectItem>
                                        <SelectItem value="EKS">EKS (Kubernetes)</SelectItem>
                                        <SelectItem value="Fargate">Fargate (Serverless)</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'Azure' && (
                                      <>
                                        <SelectItem value="Container Instances">Container Instances</SelectItem>
                                        <SelectItem value="AKS">AKS (Kubernetes)</SelectItem>
                                        <SelectItem value="Container Apps">Container Apps</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'GCP' && (
                                      <>
                                        <SelectItem value="GKE">GKE (Kubernetes)</SelectItem>
                                        <SelectItem value="Cloud Run">Cloud Run</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'OCI' && (
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
                          </>
                        )}

                        {newResource.category === 'Network' && (
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
                                    {newResource.site === 'AWS' && (
                                      <>
                                        <SelectItem value="VPC">VPC (Virtual Private Cloud)</SelectItem>
                                        <SelectItem value="ALB">Application Load Balancer</SelectItem>
                                        <SelectItem value="NLB">Network Load Balancer</SelectItem>
                                        <SelectItem value="NAT Gateway">NAT Gateway</SelectItem>
                                        <SelectItem value="VPN">VPN Gateway</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'Azure' && (
                                      <>
                                        <SelectItem value="VNet">Virtual Network</SelectItem>
                                        <SelectItem value="Load Balancer">Load Balancer</SelectItem>
                                        <SelectItem value="Application Gateway">Application Gateway</SelectItem>
                                        <SelectItem value="VPN Gateway">VPN Gateway</SelectItem>
                                      </>
                                    )}
                                    {newResource.site === 'GCP' && (
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
                          </>
                        )}
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
                          disabled={!newResource.applicationName.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Add Resource
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map((req, index) => (
                    <div key={req.slNo} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{req.applicationName}</h3>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary">{req.workloadType}</Badge>
                            <Badge variant="outline">{req.category}</Badge>
                            <Badge variant="outline">{req.site}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm text-gray-600">
                            <div>Instance: {req.cpuName}</div>
                            <div>RAM: {req.ramGB}GB</div>
                            {req.dataSpaceGB > 0 && <div>Storage: {req.dataSpaceGB}GB</div>}
                          </div>
                          <div className="min-w-[150px]">
                            <Label htmlFor={`env-${req.slNo}`} className="text-xs text-gray-600">
                              Environment
                            </Label>
                            <Select
                              value={resourceEnvironments[req.slNo] || 'production'}
                              onValueChange={(value) => handleEnvironmentChange(req.slNo, value)}
                            >
                              <SelectTrigger id={`env-${req.slNo}`} className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {environmentTypes.map((env) => (
                                  <SelectItem key={env.value} value={env.value}>
                                    <div className="flex items-center gap-2">
                                      <Badge className={env.color} variant="outline">
                                        {env.label}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Customization Section - Always Visible */}
            {true && (
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
                        baseMonthlyCost={uploadResponse.summary.totalMonthlyCost}
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
          </>
        )}
          </>
        )}
      </div>

      {/* Save Analysis Dialog */}
      <Dialog open={saveAnalysisDialogOpen} onOpenChange={setSaveAnalysisDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Cost Analysis</DialogTitle>
            <DialogDescription>
              Give your analysis a name to save it for later reference.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="analysis-name">Analysis Name</Label>
              <Input
                id="analysis-name"
                placeholder={`Infrastructure-Analysis-${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}`}
                value={analysisNameInput}
                onChange={(e) => setAnalysisNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !savingAnalysis) {
                    handleConfirmSaveAnalysis();
                  }
                }}
              />
              <p className="text-sm text-gray-500">
                Leave empty to use default name
              </p>
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              {savingAnalysis ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Analysis'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}