import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UploadIcon, FileIcon, CheckCircleIcon, Server, Database, HardDrive, Network, Shield, Monitor } from "lucide-react";
import { useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TerraformUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

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
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                Parsed Resources
              </CardTitle>
              <CardDescription>
                Resources found in your Terraform state file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    ${uploadResult.inventory.resources
                      .reduce((total: number, resource: any) => 
                        total + (resource.costDetails?.estimatedMonthlyCost || 0), 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Est. Monthly Cost</div>
                </div>
              </div>

              {/* Resources Table */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Discovered Resources</h3>
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
                        <TableHead>Est. Cost/Month</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadResult.inventory.resources.slice(0, 50).map((resource: any) => (
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
                          <TableCell className="text-sm font-medium">
                            {resource.costDetails?.estimatedMonthlyCost ? 
                              `$${resource.costDetails.estimatedMonthlyCost.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {uploadResult.inventory.resources.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-4">
                    Showing first 50 resources of {uploadResult.inventory.resources.length} total resources.
                  </p>
                )}
              </div>

              <Button
                onClick={() => analyzeMutation.mutate(uploadResult)}
                disabled={analyzeMutation.isPending}
                size="lg"
                className="w-full mt-6"
                data-testid="button-analyze-costs"
              >
                {analyzeMutation.isPending ? "Analyzing Costs..." : "Analyze Costs"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}