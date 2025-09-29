import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

interface UploadResponse {
  success: boolean;
  message: string;
  summary: {
    totalResources: number;
    totalMonthlyCost: number;
    totalYearlyCost: number;
  };
  requirements: InfrastructureRequirement[];
  costEstimates: CostEstimate[];
}

export default function ExcelToIaC() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingTerraform, setIsGeneratingTerraform] = useState(false);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);

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

  const downloadTerraform = async () => {
    setIsGeneratingTerraform(true);
    try {
      const response = await fetch('/api/excel-to-iac/generate-terraform', {
        method: 'POST',
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
      a.download = `infrastructure-${Date.now()}.tf`;
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

  const downloadCSV = async () => {
    setIsGeneratingCSV(true);
    try {
      const response = await fetch('/api/excel-to-iac/generate-csv', {
        method: 'POST',
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
      a.download = `cost-estimate-${Date.now()}.csv`;
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

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={downloadTerraform}
                disabled={isGeneratingTerraform}
                className="flex items-center gap-2"
              >
                <Code className="h-4 w-4" />
                {isGeneratingTerraform ? 'Generating...' : 'Download Terraform Code'}
              </Button>
              <Button
                variant="outline"
                onClick={downloadCSV}
                disabled={isGeneratingCSV}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {isGeneratingCSV ? 'Generating...' : 'Download Cost Estimate CSV'}
              </Button>
            </div>

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
              <AlertDescription className="text-green-600">
                {uploadResponse.message} You can now download the Terraform code and cost estimates.
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>
    </div>
  );
}