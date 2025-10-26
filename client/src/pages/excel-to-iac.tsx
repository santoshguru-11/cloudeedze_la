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
  BarChart3
} from 'lucide-react';

interface InfrastructureRequirement {
  slNo: number;
  applicationName: string;
  workloadType: string;
  cpuName: string;
  ramGB: number;
  dataSpaceGB: number;
  category: string;
  site: string;
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

export default function ExcelToIaC() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingTerraform, setIsGeneratingTerraform] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportName, setReportName] = useState('');

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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: isUploading
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Helmet>
        <title>Excel to Infrastructure as Code - Cloudedze</title>
        <meta name="description" content="Convert Excel infrastructure requirements to Terraform code and get cost estimates" />
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {uploadResponse.summary.totalResources}
                  </div>
                  <p className="text-sm text-gray-600">Infrastructure components</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Monthly Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ${uploadResponse.summary.totalMonthlyCost.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600">Estimated per month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Yearly Cost
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    ${uploadResponse.summary.totalYearlyCost.toFixed(2)}
                  </div>
                  <p className="text-sm text-gray-600">Estimated per year</p>
                </CardContent>
              </Card>
            </div>

            {/* Multi-Cloud Cost Comparison */}
            {uploadResponse.multiCloudCosts && (
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
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Infrastructure Requirements
                </CardTitle>
                <CardDescription>
                  Parsed from your Excel file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadResponse.requirements.map((req, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{req.applicationName}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{req.workloadType}</Badge>
                            <Badge variant="outline">{req.category}</Badge>
                            <Badge variant="outline">{req.site}</Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div>Instance: {req.cpuName}</div>
                          <div>RAM: {req.ramGB}GB</div>
                          {req.dataSpaceGB > 0 && <div>Storage: {req.dataSpaceGB}GB</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Analysis
                </CardTitle>
                <CardDescription>
                  Detailed cost breakdown by service
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {uploadResponse.costEstimates.map((cost, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {getServiceIcon(cost.service)}
                          <div>
                            <h3 className="font-semibold">{cost.resourceName}</h3>
                            <p className="text-sm text-gray-600">{cost.service}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            ${cost.monthlyEstimate.toFixed(2)}/month
                          </div>
                          <div className="text-sm text-gray-600">
                            ${cost.yearlyEstimate.toFixed(2)}/year
                          </div>
                        </div>
                      </div>
                      <Separator className="my-2" />
                      <p className="text-sm text-gray-600">{cost.configuration}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Success Message */}
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{uploadResponse.message}</p>
                    <p className="text-sm mt-1">You can download the Terraform code and cost estimates, or generate a PDF report.</p>
                  </div>
                  {uploadResponse.scanId && (
                    <div className="space-y-3 mt-3">
                      <div className="space-y-2">
                        <Label htmlFor="reportName" className="text-sm font-medium text-green-900">
                          Report Name (optional)
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
                          Leave empty to use default name: Infrastructure-Report-{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).replace(/\s/g, '-')}
                        </p>
                      </div>
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
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  );
}