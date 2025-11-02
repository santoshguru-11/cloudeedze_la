import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import {
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  FilePlus,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '');

export default function UserReports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());

  // Check if user is authenticated
  if (!user) {
    return <Redirect to="/login" />;
  }

  // Fetch user's scans
  const { data: scansData, isLoading: scansLoading } = useQuery({
    queryKey: ['/api/inventory-scans'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/inventory-scans`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch scans');
      return res.json();
    }
  });

  // Fetch user's reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    }
  });

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (scanId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scanId })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to generate report');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/reports'], (oldData: any) => {
        if (oldData) {
          // The API returns a `report` object on success.
          // We can use this to optimistically update the UI.
          const newReport = data.report;

          // It's possible the new report is missing some fields the UI needs.
          // We'll provide some default values to avoid crashing the UI.
          const optimisticReport = {
            ...newReport,
            reportName: newReport.reportName || 'Generating...',
            fileSize: newReport.fileSize || 0,
            createdAt: newReport.createdAt || new Date().toISOString(),
            scan: {
              createdAt: new Date().toISOString(),
              summary: { totalResources: '...' },
            },
          };

          return {
            ...oldData,
            reports: [...oldData.reports, optimisticReport],
          };
        }
        return oldData;
      });

      // We still invalidate to refetch the full data in the background
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });

      toast({
        title: "Success",
        description: "Report generation initiated. It will appear in the list shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete report');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
      toast({
        title: "Success",
        description: "Report deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const scans = scansData?.scans || [];
  const reports = reportsData?.reports || [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'in-progress':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const hasReport = (scanId: string) => {
    return reports.some((report: any) => report.scanId === scanId);
  };

  const handleGenerateReport = async (scanId: string) => {
    setGeneratingReports(prev => new Set(prev).add(scanId));
    try {
      await generateReportMutation.mutateAsync(scanId);
    } finally {
      setGeneratingReports(prev => {
        const next = new Set(prev);
        next.delete(scanId);
        return next;
      });
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      await deleteReportMutation.mutateAsync(reportId);
    }
  };

  const handleDownloadReport = (reportId: string) => {
    window.location.href = `${API_BASE_URL}/api/reports/${reportId}/download`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Reports</h1>
        <p className="text-gray-600">View your scan history and manage PDF reports</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Scans</CardTitle>
            <FileText className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {scansLoading ? '...' : scans.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {scans.filter((s: any) => s.status === 'completed').length} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Generated Reports</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {reportsLoading ? '...' : reports.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PDF reports available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Resources</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {scansLoading ? '...' : scans.reduce((sum: number, scan: any) => {
                const summary = scan.summary as any;
                return sum + (summary?.totalResources || 0);
              }, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Discovered across all scans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Scans and Reports */}
      <Tabs defaultValue="scans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scans">My Scans ({scans.length})</TabsTrigger>
          <TabsTrigger value="reports">My Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                View your inventory scans and generate reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scansLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading scans...</p>
                </div>
              ) : scans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No scans found</p>
                  <p className="text-sm mt-2">Start by running an inventory scan</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scan ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scans.map((scan: any) => (
                        <TableRow key={scan.id}>
                          <TableCell className="font-mono text-xs">
                            {scan.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>{getStatusBadge(scan.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {scan.summary?.totalResources || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {scan.scanDuration ? `${(scan.scanDuration / 1000).toFixed(1)}s` : 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(scan.createdAt)}
                          </TableCell>
                          <TableCell>
                            {scan.status === 'completed' && !hasReport(scan.id) && (
                              <Button
                                size="sm"
                                onClick={() => handleGenerateReport(scan.id)}
                                disabled={generatingReports.has(scan.id)}
                              >
                                {generatingReports.has(scan.id) ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    Generating...
                                  </>
                                ) : (
                                  <>
                                    <FilePlus className="w-4 h-4 mr-1" />
                                    Generate Report
                                  </>
                                )}
                              </Button>
                            )}
                            {hasReport(scan.id) && (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Report Available
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports</CardTitle>
              <CardDescription>
                Download or delete your PDF reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reportsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reports found</p>
                  <p className="text-sm mt-2">Generate a report from your completed scans</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Name</TableHead>
                        <TableHead>File Size</TableHead>
                        <TableHead>Scan Date</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Generated</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {report.reportName}
                          </TableCell>
                          <TableCell>
                            {formatFileSize(report.fileSize)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {report.scan?.createdAt ? formatDate(report.scan.createdAt) : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {report.scan?.summary?.totalResources || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(report.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadReport(report.id)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
