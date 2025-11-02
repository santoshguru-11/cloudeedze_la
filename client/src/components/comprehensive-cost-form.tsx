import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { infrastructureRequirementsSchema, type InfrastructureRequirements } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ComprehensiveCostForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<InfrastructureRequirements>({
    resolver: zodResolver(infrastructureRequirementsSchema),
    defaultValues: {
      currency: "USD",
      licensing: {
        windows: { enabled: false, licenses: 0 },
        sqlServer: { enabled: false, edition: "standard", licenses: 0 },
        oracle: { enabled: false, edition: "standard", licenses: 0 },
        vmware: { enabled: false, licenses: 0 },
        redhat: { enabled: false, licenses: 0 },
        sap: { enabled: false, licenses: 0 },
        microsoftOffice365: { enabled: false, licenses: 0 },
      },
      compute: [{
        instances: 1,
        vcpus: 8,
        ram: 16,
        instanceType: "general-purpose",
        region: "us-east-1",
        operatingSystem: "linux",
        bootVolume: {
          size: 30,
          type: "ssd-gp3",
          iops: 3000,
        },
        serverless: {
          functions: 0,
          executionTime: 1,
        },
      }],
      storage: {
        objectStorage: {
          size: 0,
          tier: "standard",
          requests: 0,
        },
        blockStorage: {
          size: 0,
          type: "ssd-gp3",
          iops: 3000,
        },
        fileStorage: {
          size: 0,
          performanceMode: "general-purpose",
        },
      },
      database: {
        relational: {
          engine: "mysql",
          instanceClass: "small",
          storage: 0,
          multiAZ: false,
        },
        nosql: {
          engine: "none",
          readCapacity: 0,
          writeCapacity: 0,
          storage: 0,
        },
        cache: {
          engine: "none",
          instanceClass: "small",
          nodes: 0,
        },
        dataWarehouse: {
          nodes: 0,
          nodeType: "small",
          storage: 0,
        },
      },
      networking: {
        bandwidth: 1000,
        loadBalancer: "none",
        cdn: {
          enabled: false,
          requests: 0,
          dataTransfer: 0,
        },
        dns: {
          hostedZones: 0,
          queries: 0,
        },
        vpn: {
          connections: 0,
          hours: 0,
        },
      },
      analytics: {
        dataProcessing: {
          hours: 0,
          nodeType: "small",
        },
        streaming: {
          shards: 0,
          records: 0,
        },
        businessIntelligence: {
          users: 0,
          queries: 0,
        },
      },
      ai: {
        training: {
          hours: 0,
          instanceType: "cpu",
        },
        inference: {
          requests: 0,
          instanceType: "cpu",
        },
        prebuilt: {
          imageAnalysis: 0,
          textProcessing: 0,
          speechServices: 0,
        },
      },
      security: {
        webFirewall: {
          enabled: false,
          requests: 0,
        },
        identityManagement: {
          users: 0,
          authentications: 0,
        },
        keyManagement: {
          keys: 0,
          operations: 0,
        },
        threatDetection: {
          enabled: false,
          events: 0,
        },
      },
      monitoring: {
        metrics: 0,
        logs: 0,
        traces: 0,
        alerts: 0,
      },
      devops: {
        cicd: {
          buildMinutes: 0,
          parallelJobs: 0,
        },
        containerRegistry: {
          storage: 0,
          pulls: 0,
        },
        apiManagement: {
          requests: 0,
          endpoints: 0,
        },
      },
      backup: {
        storage: 0,
        frequency: "daily",
        retention: 30,
      },
      iot: {
        devices: 0,
        messages: 0,
        dataProcessing: 0,
        edgeLocations: 0,
      },
      media: {
        videoStreaming: {
          hours: 0,
          quality: "1080p",
        },
        transcoding: {
          minutes: 0,
          inputFormat: "standard",
        },
      },
      // New advanced services
      quantum: {
        processingUnits: 0,
        quantumAlgorithms: "optimization",
        circuitComplexity: "basic",
      },
      advancedAI: {
        vectorDatabase: {
          dimensions: 0,
          queries: 0,
        },
        customChips: {
          tpuHours: 0,
          inferenceChips: 0,
        },
        modelHosting: {
          models: 0,
          requests: 0,
        },
        ragPipelines: {
          documents: 0,
          embeddings: 0,
        },
      },
      edge: {
        edgeLocations: 0,
        edgeCompute: 0,
        fiveGNetworking: {
          networkSlices: 0,
          privateNetworks: 0,
        },
        realTimeProcessing: 0,
      },
      confidential: {
        secureEnclaves: 0,
        trustedExecution: 0,
        privacyPreservingAnalytics: 0,
        zeroTrustProcessing: 0,
      },
      sustainability: {
        carbonFootprintTracking: false,
        renewableEnergyPreference: false,
        greenCloudOptimization: false,
        carbonOffsetCredits: 0,
      },
      scenarios: {
        disasterRecovery: {
          enabled: false,
          rtoHours: 24,
          rpoMinutes: 240,
          backupRegions: 1,
        },
        compliance: {
          frameworks: [],
          auditLogging: false,
          dataResidency: "global",
        },
        migration: {
          dataToMigrate: 0,
          applicationComplexity: "moderate",
        },
      },
      optimization: {
        reservedInstanceStrategy: "moderate",
        spotInstanceTolerance: 10,
        autoScalingAggression: "moderate",
        costAlerts: {
          enabled: true,
          thresholdPercent: 20,
          notificationPreference: "email",
        },
      },
    },
  });

  const { fields: computeFields, append: appendCompute, remove: removeCompute } = useFieldArray({
    control: form.control,
    name: "compute",
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: InfrastructureRequirements) => {
      const response = await apiRequest("POST", "/api/calculate", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cost analysis completed",
        description: "Redirecting to results...",
      });
      setLocation(`/results/${data.analysisId}`);
    },
    onError: (error) => {
      toast({
        title: "Calculation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InfrastructureRequirements) => {
    calculateMutation.mutate(data);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Comprehensive Cloud Infrastructure Analysis
          </CardTitle>
          <CardDescription>
            Configure your complete cloud infrastructure requirements across all service categories to get accurate cost estimates from all major providers.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="compute" className="w-full">
                <TabsList className="grid w-full grid-cols-6 md:grid-cols-11">
                  <TabsTrigger value="currency">Currency</TabsTrigger>
                  <TabsTrigger value="licensing">Licensing</TabsTrigger>
                  <TabsTrigger value="compute">Compute</TabsTrigger>
                  <TabsTrigger value="serverless">Serverless</TabsTrigger>
                  <TabsTrigger value="storage">Storage</TabsTrigger>
                  <TabsTrigger value="database">Database</TabsTrigger>
                  <TabsTrigger value="networking">Network</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="quantum">Quantum/AI</TabsTrigger>
                  <TabsTrigger value="optimization">Settings</TabsTrigger>
                </TabsList>

                {/* Currency Tab */}
                <TabsContent value="currency" className="space-y-6">
                  <div className="mb-4">
                    <h4 className="text-md font-semibold">Currency Selection</h4>
                    <p className="text-sm text-slate-600">Choose your preferred currency for cost calculations and reporting</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                            <SelectItem value="INR">INR (₹) - Indian Rupee</SelectItem>
                            <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                            <SelectItem value="KWD">KWD (د.ك) - Kuwaiti Dinar</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Currency Exchange Information</h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Exchange rates are updated regularly based on market values</li>
                      <li>• All cloud provider costs are converted from USD base pricing</li>
                      <li>• Licensing costs are also converted to your selected currency</li>
                      <li>• Results show currency symbol with converted amounts</li>
                    </ul>
                  </div>
                </TabsContent>

                {/* Licensing Tab */}
                <TabsContent value="licensing" className="space-y-6">
                  <div className="mb-4">
                    <h4 className="text-md font-semibold">Software Licensing Costs</h4>
                    <p className="text-sm text-slate-600">Configure software licenses that will run on your cloud infrastructure</p>
                  </div>

                  <div className="space-y-6">
                    {/* Windows Server */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <FormField
                          control={form.control}
                          name="licensing.windows.enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Windows Server Standard
                                </FormLabel>
                                <FormDescription>
                                  Core-based licensing for Windows Server
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      {form.watch("licensing.windows.enabled") && (
                        <FormField
                          control={form.control}
                          name="licensing.windows.licenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Licenses</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {/* SQL Server */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <FormField
                          control={form.control}
                          name="licensing.sqlServer.enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Microsoft SQL Server
                                </FormLabel>
                                <FormDescription>
                                  Core-based database licensing
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      {form.watch("licensing.sqlServer.enabled") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="licensing.sqlServer.edition"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Edition</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select edition" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="express">Express (Free)</SelectItem>
                                    <SelectItem value="standard">Standard</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="licensing.sqlServer.licenses"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Number of Licenses</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>

                    {/* Microsoft Office 365 */}
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <FormField
                          control={form.control}
                          name="licensing.microsoftOffice365.enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-medium">
                                  Microsoft Office 365
                                </FormLabel>
                                <FormDescription>
                                  Per-user monthly subscription
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      {form.watch("licensing.microsoftOffice365.enabled") && (
                        <FormField
                          control={form.control}
                          name="licensing.microsoftOffice365.licenses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Users</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                    <h5 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Licensing Cost Information</h5>
                    <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                      <li>• Costs are calculated based on your CPU/core configuration</li>
                      <li>• Annual licenses are converted to monthly costs for comparison</li>
                      <li>• Licensing costs apply across all cloud providers</li>
                      <li>• Contact vendors for volume discounts and enterprise agreements</li>
                    </ul>
                  </div>
                </TabsContent>

                {/* Compute Tab */}
                <TabsContent value="compute" className="space-y-6">
                  <div className="mb-4">
                    <h4 className="text-md font-semibold">Traditional Compute Resources</h4>
                    <p className="text-sm text-slate-600">Configure virtual machines, containers, and dedicated instances with boot volume storage. You can add multiple resource configurations with different specifications.</p>
                  </div>

                  {computeFields.map((field, index) => (
                    <Card key={field.id} className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-semibold">Compute Resource #{index + 1}</h5>
                        {computeFields.length > 1 && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeCompute(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <FormField
                          control={form.control}
                          name={`compute.${index}.instances` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Instances</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="1000"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormDescription>
                                How many instances with this configuration do you need?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`compute.${index}.vcpus` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>vCPUs</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select vCPUs" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="2">2 vCPUs</SelectItem>
                                  <SelectItem value="4">4 vCPUs</SelectItem>
                                  <SelectItem value="8">8 vCPUs</SelectItem>
                                  <SelectItem value="16">16 vCPUs</SelectItem>
                                  <SelectItem value="32">32 vCPUs</SelectItem>
                                  <SelectItem value="64">64 vCPUs</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`compute.${index}.ram` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>RAM (GB)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select RAM" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="4">4 GB</SelectItem>
                                  <SelectItem value="8">8 GB</SelectItem>
                                  <SelectItem value="16">16 GB</SelectItem>
                                  <SelectItem value="32">32 GB</SelectItem>
                                  <SelectItem value="64">64 GB</SelectItem>
                                  <SelectItem value="128">128 GB</SelectItem>
                                  <SelectItem value="256">256 GB</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`compute.${index}.instanceType` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instance Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select instance type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="general-purpose">General Purpose</SelectItem>
                                  <SelectItem value="compute-optimized">Compute Optimized</SelectItem>
                                  <SelectItem value="memory-optimized">Memory Optimized</SelectItem>
                                  <SelectItem value="storage-optimized">Storage Optimized</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`compute.${index}.operatingSystem` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Operating System</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select OS" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="linux">Linux</SelectItem>
                                  <SelectItem value="windows">Windows</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`compute.${index}.region` as const}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Region</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select region" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                                  <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                                  <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                                  <SelectItem value="eu-central-1">Europe (Frankfurt)</SelectItem>
                                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                                  <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Boot Volume Configuration */}
                      <div className="space-y-4">
                        <h5 className="font-semibold">Boot Volume Storage</h5>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name={`compute.${index}.bootVolume.size` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Boot Volume Size (GB)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="30"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`compute.${index}.bootVolume.type` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Volume Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select volume type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ssd-gp3">SSD GP3 (General Purpose)</SelectItem>
                                    <SelectItem value="ssd-gp2">SSD GP2 (Previous Gen)</SelectItem>
                                    <SelectItem value="ssd-io2">SSD IO2 (High IOPS)</SelectItem>
                                    <SelectItem value="hdd-standard">HDD Standard</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`compute.${index}.bootVolume.iops` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>IOPS (for IO2)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="3000"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 3000)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendCompute({
                      instances: 1,
                      vcpus: 8,
                      ram: 16,
                      instanceType: "general-purpose",
                      region: "us-east-1",
                      operatingSystem: "linux",
                      bootVolume: {
                        size: 30,
                        type: "ssd-gp3",
                        iops: 3000,
                      },
                      serverless: {
                        functions: 0,
                        executionTime: 1,
                      },
                    })}
                  >
                    + Add Another Compute Resource
                  </Button>


                </TabsContent>

                {/* Serverless Tab */}
                <TabsContent value="serverless" className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Serverless Functions Configuration</h4>
                    <p className="text-sm text-slate-600">Configure serverless functions for the first compute resource across all cloud providers (AWS Lambda, Azure Functions, Google Cloud Functions, Oracle Functions)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="compute.0.serverless.functions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Function Invocations (per month)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="compute.0.serverless.executionTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Avg. Execution Time (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Serverless Cost Factors</h5>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Charges based on function invocations and execution time</li>
                      <li>• Memory allocation affects pricing (1GB default)</li>
                      <li>• Free tier includes 1M requests and 400,000 GB-seconds</li>
                      <li>• Cold start times vary by provider and runtime</li>
                    </ul>
                  </div>
                </TabsContent>

                {/* Storage Tab */}
                <TabsContent value="storage" className="space-y-6">
                  {/* Object Storage */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Object Storage (S3/Blob)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="storage.objectStorage.size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Size (GB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storage.objectStorage.tier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Tier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="standard">Standard</SelectItem>
                                <SelectItem value="infrequent-access">Infrequent Access</SelectItem>
                                <SelectItem value="glacier">Glacier</SelectItem>
                                <SelectItem value="deep-archive">Deep Archive</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storage.objectStorage.requests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Requests (per month)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10000"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Block Storage */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Block Storage (EBS/Disk)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="storage.blockStorage.size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Size (GB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storage.blockStorage.type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ssd-gp3">SSD (GP3)</SelectItem>
                                <SelectItem value="ssd-io2">SSD (IO2)</SelectItem>
                                <SelectItem value="hdd-st1">HDD (ST1)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storage.blockStorage.iops"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IOPS</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="3000"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 3000)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* File Storage */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">File Storage (EFS/File Share)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="storage.fileStorage.size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Size (GB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storage.fileStorage.performanceMode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Performance Mode</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select mode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="general-purpose">General Purpose</SelectItem>
                                <SelectItem value="max-io">Max I/O</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Database Tab */}
                <TabsContent value="database" className="space-y-6">
                  {/* Relational Database */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Relational Database (RDS/SQL Database)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="database.relational.engine"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Database Engine</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select engine" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="mysql">MySQL</SelectItem>
                                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                <SelectItem value="oracle">Oracle</SelectItem>
                                <SelectItem value="sql-server">SQL Server</SelectItem>
                                <SelectItem value="mariadb">MariaDB</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="database.relational.instanceClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Instance Class</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="micro">Micro</SelectItem>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="xlarge">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="database.relational.storage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage Size (GB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="database.relational.multiAZ"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Multi-AZ Deployment</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Enable for high availability
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Networking Tab */}
                <TabsContent value="networking" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="networking.bandwidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Transfer (GB/month)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1000"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="networking.loadBalancer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Load Balancer</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select load balancer" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="application">Application Load Balancer</SelectItem>
                              <SelectItem value="network">Network Load Balancer</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* CDN Section */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="networking.cdn.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Content Delivery Network (CDN)</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Enable global content distribution
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("networking.cdn.enabled") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="networking.cdn.requests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CDN Requests (per month)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="networking.cdn.dataTransfer"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CDN Data Transfer (GB/month)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics" className="space-y-6">
                  {/* Data Processing */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Data Processing (EMR/HDInsight/Dataproc)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="analytics.dataProcessing.hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cluster Hours (per month)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="analytics.dataProcessing.nodeType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Node Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select node type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                                <SelectItem value="xlarge">Extra Large</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Stream Processing */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Stream Processing (Kinesis/Event Hubs)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="analytics.streaming.shards"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number of Shards</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="analytics.streaming.records"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Records (per month)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Advanced Services Tab */}
                <TabsContent value="advanced" className="space-y-6">
                  {/* AI/ML Services */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">AI/ML Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="ai.training.hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Model Training Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="ai.inference.requests"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inference Requests (per month)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Security Services */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Security Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="security.identityManagement.users"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Identity Management Users</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="security.keyManagement.keys"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Managed Keys</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Monitoring & DevOps */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Monitoring & DevOps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="monitoring.metrics"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom Metrics</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="devops.cicd.buildMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CI/CD Build Minutes (per month)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Backup & IoT */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Backup & IoT</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="backup.storage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Backup Storage (GB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="iot.devices"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IoT Devices</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* New Quantum/AI Tab */}
                <TabsContent value="quantum" className="space-y-6">
                  {/* Quantum Computing */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Quantum Computing Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="quantum.processingUnits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>QPU Hours per Month</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantum.quantumAlgorithms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Algorithm Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="optimization">Optimization</SelectItem>
                                <SelectItem value="simulation">Simulation</SelectItem>
                                <SelectItem value="cryptography">Cryptography</SelectItem>
                                <SelectItem value="ml">Machine Learning</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantum.circuitComplexity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Circuit Complexity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Advanced AI/ML Platform */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Advanced AI/ML Platform Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="advancedAI.vectorDatabase.dimensions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vector Database Dimensions</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advancedAI.vectorDatabase.queries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vector Queries per Month</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advancedAI.customChips.tpuHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>TPU Hours per Month</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="advancedAI.modelHosting.models"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Models Hosted</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Edge Computing & 5G */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Edge Computing & 5G Services</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="edge.edgeLocations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Edge Locations</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="edge.edgeCompute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Edge Compute Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="edge.fiveGNetworking.networkSlices"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>5G Network Slices</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confidential.secureEnclaves"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secure Enclave Hours</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Optimization & Settings Tab */}
                <TabsContent value="optimization" className="space-y-6">
                  {/* Cost Optimization Settings */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Cost Optimization Preferences</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="optimization.reservedInstanceStrategy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reserved Instance Strategy</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="conservative">Conservative (5% savings)</SelectItem>
                                <SelectItem value="moderate">Moderate (12% savings)</SelectItem>
                                <SelectItem value="aggressive">Aggressive (22% savings)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="optimization.spotInstanceTolerance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Spot Instance Tolerance (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="10"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="optimization.autoScalingAggression"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auto-scaling Strategy</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="minimal">Minimal (2% savings)</SelectItem>
                                <SelectItem value="moderate">Moderate (8% savings)</SelectItem>
                                <SelectItem value="aggressive">Aggressive (15% savings)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sustainability Settings */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Sustainability & Green Computing</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="sustainability.carbonFootprintTracking"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Carbon Footprint Tracking</FormLabel>
                              <div className="text-sm text-gray-500">Monitor CO2 emissions from your cloud usage</div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sustainability.renewableEnergyPreference"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Prefer Renewable Energy</FormLabel>
                              <div className="text-sm text-gray-500">Choose providers with higher renewable energy %</div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sustainability.greenCloudOptimization"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Green Cloud Optimization</FormLabel>
                              <div className="text-sm text-gray-500">Optimize for environmental impact</div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sustainability.carbonOffsetCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Carbon Offset Credits (tons CO2)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Advanced Scenarios */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold">Advanced Scenarios</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="scenarios.disasterRecovery.enabled"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Disaster Recovery</FormLabel>
                              <div className="text-sm text-gray-500">Enable multi-region backup and recovery</div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scenarios.compliance.dataResidency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Residency Requirements</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="global">Global</SelectItem>
                                <SelectItem value="us">United States</SelectItem>
                                <SelectItem value="eu">European Union</SelectItem>
                                <SelectItem value="asia">Asia Pacific</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scenarios.migration.dataToMigrate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data to Migrate (TB)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="scenarios.migration.applicationComplexity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Migration Complexity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="simple">Simple</SelectItem>
                                <SelectItem value="moderate">Moderate</SelectItem>
                                <SelectItem value="complex">Complex</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between pt-6 border-t">
                <Button type="button" variant="outline">
                  Save Configuration
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-blue-700"
                  disabled={calculateMutation.isPending}
                >
                  {calculateMutation.isPending ? "Analyzing..." : "Calculate Comprehensive Costs"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}