import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "wouter";
import {
  BarChart3,
  FileText,
  Users,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'development' ? 'http://localhost:3000' : '');

export default function AdminDashboard() {
  const { user } = useAuth();

  // Check if user is admin
  if (!user || (user as any).role !== 'admin') {
    return <Redirect to="/calculator" />;
  }

  // Fetch admin statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  // Fetch all scans
  const { data: scansData, isLoading: scansLoading } = useQuery({
    queryKey: ['/api/admin/scans'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/scans`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch scans');
      return res.json();
    }
  });

  // Fetch all reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/admin/reports'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/admin/reports`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Monitor all scans, reports, and system statistics</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Scans</CardTitle>
            <Database className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats?.stats?.totalScans || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.stats?.completedScans || 0} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Reports</CardTitle>
            <FileText className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats?.stats?.totalReports || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PDF reports generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resources Discovered</CardTitle>
            <BarChart3 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : stats?.stats?.totalResources || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across all cloud providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {statsLoading ? '...' : `${stats?.stats?.successRate || 0}%`}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.stats?.failedScans || 0} failed scans
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Scans and Reports */}
      <Tabs defaultValue="scans" className="space-y-4">
        <TabsList>
          <TabsTrigger value="scans">All Scans ({scans.length})</TabsTrigger>
          <TabsTrigger value="reports">All Reports ({reports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="scans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Inventory Scans</CardTitle>
              <CardDescription>
                Complete list of all scans performed across all users
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
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No scans found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scan ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Resources</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scans.map((scan: any) => (
                        <TableRow key={scan.id}>
                          <TableCell className="font-mono text-xs">
                            {scan.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {scan.user?.firstName} {scan.user?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{scan.user?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(scan.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {scan.summary?.totalResources || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(scan.scanDuration / 1000).toFixed(1)}s
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(scan.createdAt)}
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
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                Complete list of all generated PDF reports
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
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Report Name</TableHead>
                        <TableHead>File Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report: any) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-mono text-xs">
                            {report.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {report.user?.firstName} {report.user?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{report.user?.email}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {report.reportName}
                          </TableCell>
                          <TableCell>
                            {formatFileSize(report.fileSize)}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">{report.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatDate(report.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                window.location.href = `${API_BASE_URL}/api/reports/${report.id}/download`;
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
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
