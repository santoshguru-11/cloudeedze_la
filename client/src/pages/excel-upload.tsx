import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Zap, FileText } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import CostResults from '@/components/cost-results';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  headers: string[];
  sampleData: any[][];
}

interface UploadResult {
  success: boolean;
  analysisId: string;
  scanId?: string;
  resources: any[];
  summary: {
    totalResources: number;
    byProvider: Record<string, number>;
    byType: Record<string, number>;
    totalCost: number;
  };
  costAnalysis: {
    analysisId: string;
    results: any;
  };
  webhookTriggered?: boolean;
  googleSheets?: {
    success: boolean;
    spreadsheetUrl?: string;
    spreadsheetId?: string;
    error?: string;
  };
}

export default function ExcelUpload() {
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisName, setAnalysisName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValidationResult(null);
      setUploadResult(null);
      setError('');
      
      // Auto-validate the file
      validateFile(file);
    }
  };

  const validateFile = async (file: File) => {
    setIsValidating(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('excelFile', file);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.cloudedze.ai';
      const response = await fetch(`${API_BASE_URL}/api/excel/validate`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      
      const result = await response.json();
      setValidationResult(result);
      
      if (!result.isValid) {
        setError(`File validation failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError('Failed to validate file. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsUploading(true);
    setError('');
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('excelFile', selectedFile);
      formData.append('analysisName', analysisName || `Excel Analysis - ${new Date().toLocaleDateString()}`);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.cloudedze.ai';
      const response = await fetch(`${API_BASE_URL}/api/excel/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();

      if (result.success) {
        setUploadResult(result);
        setProgress(100);

        // No auto-redirect - let user choose where to go
      } else {
        setError(result.message || 'Upload failed. Please try again.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.cloudedze.ai';
      const response = await fetch(`${API_BASE_URL}/api/excel/template`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cloud-resources-template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to download template. Please try again.');
      }
    } catch (error) {
      console.error('Template download error:', error);
      setError('Failed to download template. Please try again.');
    }
  };

  const testWebhook = async () => {
    setTestingWebhook(true);
    setWebhookTestResult(null);
    setError('');
    
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.cloudedze.ai';
      const response = await fetch(`${API_BASE_URL}/api/test/webhook`, {
        method: 'POST',
        credentials: 'include'
      });
      
      const result = await response.json();
      setWebhookTestResult(result);
      
      if (!result.success) {
        setError(result.message || 'Webhook test failed');
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      setError('Webhook test failed. Please try again.');
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!uploadResult?.scanId) return;

    setGeneratingReport(true);
    setError('');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.cloudedze.ai';
      const response = await fetch(`${API_BASE_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scanId: uploadResult.scanId })
      });

      const result = await response.json();

      if (result.success) {
        // Show success message and redirect to reports page
        setLocation('/reports');
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

  const resetForm = () => {
    setSelectedFile(null);
    setAnalysisName('');
    setValidationResult(null);
    setUploadResult(null);
    setError('');
    setProgress(0);
    setWebhookTestResult(null);
    setGeneratingReport(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Helmet>
        <title>File Upload - DZlens</title>
        <meta name="description" content="Upload files with cloud resource details for cost analysis and optimization." />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/dZlens.png" alt="DZlens" className="h-12 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Excel Upload & Analysis</h1>
          <p className="text-gray-600">
            Upload an Excel file with your cloud resource details for instant cost analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Upload Excel File
              </CardTitle>
              <CardDescription>
                Upload your cloud resource data in Excel format for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Download */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Need a template?</p>
                  <p className="text-sm text-blue-700">Download our Excel template with sample data</p>
                </div>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* Webhook Test */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-green-900">Test n8n Integration</p>
                  <p className="text-sm text-green-700">Test the webhook connection to your n8n workflow</p>
                </div>
                <Button onClick={testWebhook} variant="outline" size="sm" disabled={testingWebhook}>
                  {testingWebhook ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Test Webhook
                    </>
                  )}
                </Button>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="excelFile">Select File</Label>
                <Input
                  id="excelFile"
                  type="file"
                  accept="*/*"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  disabled={isUploading}
                />
                <p className="text-sm text-gray-500">
                  Any file type supported (Max 10MB)
                </p>
              </div>

              {/* Analysis Name */}
              <div className="space-y-2">
                <Label htmlFor="analysisName">Analysis Name (Optional)</Label>
                <Input
                  id="analysisName"
                  value={analysisName}
                  onChange={(e) => setAnalysisName(e.target.value)}
                  placeholder="Enter a name for this analysis"
                  disabled={isUploading}
                />
              </div>

              {/* Validation Status */}
              {isValidating && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Validating file format...</span>
                </div>
              )}

              {validationResult && (
                <div className="space-y-2">
                  <Alert className="border-blue-200 bg-blue-50">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      File is ready for analysis! 
                      {validationResult.warnings && validationResult.warnings.length > 0 && (
                        <span className="block mt-1 text-sm">
                          <strong>Note:</strong> {validationResult.warnings.join(', ')}
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Webhook Test Result */}
              {webhookTestResult && (
                <Alert className={webhookTestResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {webhookTestResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={webhookTestResult.success ? "text-green-800" : "text-red-800"}>
                    <div className="space-y-2">
                      <p><strong>Webhook Test Result:</strong></p>
                      <p>Status: {webhookTestResult.webhookStatus}</p>
                      {webhookTestResult.response && (
                        <div className="text-xs bg-white p-2 rounded border">
                          <pre>{JSON.stringify(JSON.parse(webhookTestResult.response), null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Progress Bar */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing file...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload & Analyze
                    </>
                  )}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Preview</CardTitle>
              <CardDescription>
                Preview of your uploaded data and analysis results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadResult ? (
                <div className="space-y-4">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold">Upload completed successfully!</p>
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
                          <Button
                            onClick={() => setLocation(`/results/${uploadResult.analysisId}`)}
                            variant="outline"
                            size="sm"
                          >
                            View Cost Analysis
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  {uploadResult.webhookTriggered && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Zap className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        n8n workflow triggered successfully! Your data has been sent to the automation pipeline.
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadResult.googleSheets && (
                    uploadResult.googleSheets.success ? (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          <div className="flex items-center justify-between">
                            <span>File uploaded to Google Sheets!</span>
                            <a 
                              href={uploadResult.googleSheets.spreadsheetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-green-600 hover:text-green-800 underline"
                            >
                              Open Sheet
                            </a>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Google Sheets upload failed: {uploadResult.googleSheets.error}
                        </AlertDescription>
                      </Alert>
                    )
                  )}

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Resources:</span>
                          <span className="ml-2 font-medium">{uploadResult.summary.totalResources}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Cost:</span>
                          <span className="ml-2 font-medium">${uploadResult.summary.totalCost.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">By Provider</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(uploadResult.summary.byProvider).map(([provider, count]) => (
                          <Badge key={provider} variant="secondary">
                            {provider}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">By Type</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(uploadResult.summary.byType).map(([type, count]) => (
                          <Badge key={type} variant="outline">
                            {type}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Display multi-cloud cost analysis */}
                  {uploadResult.costAnalysis && uploadResult.costAnalysis.results && (
                    <div className="mt-8">
                      <CostResults
                        results={uploadResult.costAnalysis.results}
                        analysisId={uploadResult.costAnalysis.analysisId}
                      />
                    </div>
                  )}
                </div>
              ) : validationResult ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>File:</strong> {selectedFile?.name}</p>
                      <p><strong>Size:</strong> {(selectedFile?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Columns:</strong> {validationResult.headers?.length || 0}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Detected Columns</h4>
                    <div className="flex flex-wrap gap-1">
                      {validationResult.headers?.map((header, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {header}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {validationResult.sampleData?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Sample Data</h4>
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <pre>{JSON.stringify(validationResult.sampleData[0], null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Upload an Excel file to see analysis preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use Excel Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Download Template</h4>
                <p className="text-gray-600">
                  Download our Excel template with sample data and required column headers.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Fill Your Data</h4>
                <p className="text-gray-600">
                  Replace the sample data with your actual cloud resource information.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Upload & Analyze</h4>
                <p className="text-gray-600">
                  Upload your Excel file and get instant cost analysis and optimization recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
