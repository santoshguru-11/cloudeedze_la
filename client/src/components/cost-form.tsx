import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { infrastructureRequirementsSchema, type InfrastructureRequirements } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { FormStep } from "@/lib/types";

const steps: FormStep[] = [
  { id: "compute", title: "Compute", completed: false },
  { id: "storage", title: "Storage", completed: false },
  { id: "database", title: "Database", completed: false },
  { id: "networking", title: "Network", completed: false },
];

export default function CostForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<InfrastructureRequirements>({
    resolver: zodResolver(infrastructureRequirementsSchema),
    defaultValues: {
      compute: {
        vcpus: 8,
        ram: 16,
        instanceType: "general-purpose",
        region: "us-east-1",
      },
      storage: {
        size: 500,
        type: "ssd-gp3",
      },
      database: {
        engine: "mysql",
        size: 100,
      },
      networking: {
        bandwidth: 1000,
        loadBalancer: "none",
      },
    },
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Cloud Infrastructure Requirements
          </CardTitle>
          <CardDescription>
            Enter your infrastructure requirements to get cost estimates across all major cloud providers.
          </CardDescription>
        </CardHeader>

        {/* Progress Steps */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center text-primary">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-medium">
                    {index + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-16 h-0.5 bg-slate-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <CardContent className="space-y-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Compute Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Compute Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="compute.vcpus"
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compute.ram"
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="compute.instanceType"
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
                    name="compute.region"
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
                            <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Storage Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Storage Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="storage.size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Size (GB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="storage.type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Storage Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select storage type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ssd-gp3">SSD (gp3)</SelectItem>
                            <SelectItem value="ssd-io2">SSD (io2)</SelectItem>
                            <SelectItem value="hdd-st1">HDD (st1)</SelectItem>
                            <SelectItem value="cold-storage">Cold Storage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Database Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Database Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="database.engine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Engine</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select database engine" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mysql">MySQL</SelectItem>
                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                            <SelectItem value="mongodb">MongoDB</SelectItem>
                            <SelectItem value="redis">Redis</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="database.size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Database Size (GB)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Networking Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Networking Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="networking.bandwidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bandwidth (GB/month)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="1000"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
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
              </div>

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline">
                  Save Draft
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-blue-700"
                  disabled={calculateMutation.isPending}
                >
                  {calculateMutation.isPending ? "Calculating..." : "Calculate Costs"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
