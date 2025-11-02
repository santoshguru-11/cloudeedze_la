import type { Express } from "express";
import { storage } from "./storage.js";
import { isAuthenticated, isAdmin } from "./auth.js";
import { pdfReportService } from "./services/pdf-report-service.js";
import path from "path";
import fs from "fs/promises";

export function registerAdminRoutes(app: Express) {
  // ==========================================
  // ADMIN-ONLY ROUTES
  // ==========================================

  /**
   * Get all users (admin only)
   */
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      // In a real implementation, you'd have a getAllUsers method
      // For now, we'll return a placeholder
      res.json({
        message: "Admin users endpoint - implement getAllUsers in storage"
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to retrieve users" });
    }
  });

  /**
   * Get all scans across all users (admin only)
   */
  app.get("/api/admin/scans", isAdmin, async (req, res) => {
    try {
      const allScans = await storage.getAllInventoryScans();

      // Get user info for each scan
      const scansWithUsers = await Promise.all(
        allScans.map(async (scan) => {
          const user = await storage.getUser(scan.userId);
          return {
            ...scan,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            } : null
          };
        })
      );

      res.json({
        success: true,
        scans: scansWithUsers,
        total: scansWithUsers.length
      });
    } catch (error) {
      console.error("Get all scans error:", error);
      res.status(500).json({ message: "Failed to retrieve scans" });
    }
  });

  /**
   * Get all reports across all users (admin only)
   */
  app.get("/api/admin/reports", isAdmin, async (req, res) => {
    try {
      const allReports = await storage.getAllScanReports();

      // Get user info for each report
      const reportsWithUsers = await Promise.all(
        allReports.map(async (report) => {
          const user = await storage.getUser(report.userId);
          const scan = await storage.getInventoryScan(report.scanId);
          return {
            ...report,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName
            } : null,
            scan: scan ? {
              id: scan.id,
              createdAt: scan.createdAt,
              status: scan.status
            } : null
          };
        })
      );

      res.json({
        success: true,
        reports: reportsWithUsers,
        total: reportsWithUsers.length
      });
    } catch (error) {
      console.error("Get all reports error:", error);
      res.status(500).json({ message: "Failed to retrieve reports" });
    }
  });

  /**
   * Get admin dashboard statistics (admin only)
   */
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      const allScans = await storage.getAllInventoryScans();
      const allReports = await storage.getAllScanReports();
      const allAnalyses = await storage.getAllCostAnalyses();

      // Calculate statistics
      const totalScans = allScans.length;
      const completedScans = allScans.filter(s => s.status === 'completed').length;
      const failedScans = allScans.filter(s => s.status === 'failed').length;
      const inProgressScans = allScans.filter(s => s.status === 'in-progress').length;

      const totalReports = allReports.length;
      const totalResources = allScans.reduce((sum, scan) => {
        const summary = scan.summary as any;
        return sum + (summary.totalResources || 0);
      }, 0);

      // Get scan success rate
      const successRate = totalScans > 0
        ? ((completedScans / totalScans) * 100).toFixed(2)
        : '0';

      // Get recent scans
      const recentScans = allScans
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 10);

      res.json({
        success: true,
        stats: {
          totalScans,
          completedScans,
          failedScans,
          inProgressScans,
          totalReports,
          totalResources,
          totalAnalyses: allAnalyses.length,
          successRate: parseFloat(successRate)
        },
        recentScans
      });
    } catch (error) {
      console.error("Get admin stats error:", error);
      res.status(500).json({ message: "Failed to retrieve statistics" });
    }
  });

  // ==========================================
  // USER REPORTS ROUTES (Authenticated Users)
  // ==========================================

  /**
   * Generate PDF report for a scan
   */
  app.post("/api/reports/generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { scanId, reportName } = req.body;

      console.log('📝 Report generation request:', { scanId, reportName, hasCustomName: !!reportName });

      if (!scanId) {
        return res.status(400).json({ message: "Scan ID is required" });
      }

      // Get the scan
      const scan = await storage.getInventoryScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }

      // Verify ownership (unless admin)
      const isUserAdmin = req.user.role === 'admin';
      if (!isUserAdmin && scan.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get user info
      const user = await storage.getUser(scan.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if this is an Excel-to-IaC scan
      const scanData = scan.scanData as any;
      const isExcelToIaC = scanData?.excelToIaC !== undefined;

      // Generate PDF report
      let reportResult;
      if (isExcelToIaC) {
        // Use Excel-to-IaC specialized report
        reportResult = await pdfReportService.generateExcelToIaCReport({
          scanId: scan.id!,
          userId: scan.userId,
          scanData: scan,
          userEmail: user.email,
          customReportName: reportName
        }, scanData.excelToIaC.requirements, scanData.excelToIaC.multiCloudCosts);
      } else {
        // Use standard inventory report
        reportResult = await pdfReportService.generateReport({
          scanId: scan.id!,
          userId: scan.userId,
          scanData: scan,
          userEmail: user.email,
          customReportName: reportName
        });
      }

      // Save report metadata to database
      // Use custom report name for display, or generate a friendly default
      const displayName = reportName || `Infrastructure Report - ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      console.log('💾 Saving report with display name:', displayName);

      const report = await storage.createScanReport({
        scanId: scan.id!,
        reportPath: reportResult.reportPath,
        reportName: displayName, // Use friendly name for display
        fileSize: reportResult.fileSize,
        reportData: {
          scanDate: scan.createdAt,
          totalResources: (scan.summary as any).totalResources || 0,
          customName: reportName // Store original custom name
        },
        status: 'generated'
      }, scan.userId);

      console.log('Generated report object:', report);

      res.json({
        success: true,
        report: {
          id: report.id,
          reportName: report.reportName,
          fileSize: report.fileSize,
          createdAt: report.createdAt
        },
        message: "Report generated successfully"
      });
    } catch (error) {
      console.error("Generate report error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to generate report"
      });
    }
  });

  /**
   * Get user's reports
   */
  app.get("/api/reports", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const reports = await storage.getUserScanReports(userId);

      // Enrich reports with scan info
      const enrichedReports = await Promise.all(
        reports.map(async (report) => {
          const scan = await storage.getInventoryScan(report.scanId);
          return {
            ...report,
            scan: scan ? {
              id: scan.id,
              createdAt: scan.createdAt,
              status: scan.status,
              summary: scan.summary
            } : null
          };
        })
      );

      res.json({
        success: true,
        reports: enrichedReports
      });
    } catch (error) {
      console.error("Get reports error:", error);
      res.status(500).json({ message: "Failed to retrieve reports" });
    }
  });

  /**
   * Download a report
   */
  app.get("/api/reports/:reportId/download", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { reportId } = req.params;

      // Get report
      const report = await storage.getScanReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Verify ownership (unless admin)
      const isUserAdmin = req.user.role === 'admin';
      if (!isUserAdmin && report.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if file exists
      const reportPath = await pdfReportService.getReportStream(report.reportPath);

      // Send file
      res.download(reportPath, report.reportName, (err) => {
        if (err) {
          console.error("Download error:", err);
          if (!res.headersSent) {
            res.status(500).json({ message: "Failed to download report" });
          }
        }
      });
    } catch (error) {
      console.error("Download report error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to download report"
      });
    }
  });

  /**
   * Delete a report
   */
  app.delete("/api/reports/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { reportId } = req.params;

      // Get report
      const report = await storage.getScanReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Verify ownership (unless admin)
      const isUserAdmin = req.user.role === 'admin';
      if (!isUserAdmin && report.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete file
      await pdfReportService.deleteReport(report.reportPath);

      // Delete from database
      await storage.deleteScanReport(reportId);

      res.json({
        success: true,
        message: "Report deleted successfully"
      });
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to delete report"
      });
    }
  });

  /**
   * Get report metadata
   */
  app.get("/api/reports/:reportId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { reportId } = req.params;

      // Get report
      const report = await storage.getScanReport(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // Verify ownership (unless admin)
      const isUserAdmin = req.user.role === 'admin';
      if (!isUserAdmin && report.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get associated scan
      const scan = await storage.getInventoryScan(report.scanId);

      res.json({
        success: true,
        report: {
          ...report,
          scan: scan ? {
            id: scan.id,
            createdAt: scan.createdAt,
            status: scan.status,
            summary: scan.summary
          } : null
        }
      });
    } catch (error) {
      console.error("Get report error:", error);
      res.status(500).json({ message: "Failed to retrieve report" });
    }
  });

  /**
   * Auto-generate report after scan completion (internal use)
   */
  app.post("/api/reports/auto-generate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { scanId } = req.body;

      if (!scanId) {
        return res.status(400).json({ message: "Scan ID is required" });
      }

      // Get the scan
      const scan = await storage.getInventoryScan(scanId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }

      // Verify ownership
      if (scan.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if report already exists for this scan
      const existingReports = await storage.getUserScanReports(userId);
      const reportExists = existingReports.some(r => r.scanId === scanId);

      if (reportExists) {
        return res.json({
          success: true,
          message: "Report already exists for this scan",
          alreadyExists: true
        });
      }

      // Get user info
      const user = await storage.getUser(scan.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate PDF report in background
      const reportResult = await pdfReportService.generateReport({
        scanId: scan.id!,
        userId: scan.userId,
        scanData: scan,
        userEmail: user.email
      });

      // Generate a friendly display name for auto-generated reports
      const displayName = `Cloud Inventory Scan - ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;

      console.log('💾 Auto-generating report with display name:', displayName);

      // Save report metadata
      const report = await storage.createScanReport({
        scanId: scan.id!,
        reportPath: reportResult.reportPath,
        reportName: displayName, // Use friendly name for display
        fileSize: reportResult.fileSize,
        reportData: {
          scanDate: scan.createdAt,
          totalResources: (scan.summary as any).totalResources || 0,
          autoGenerated: true
        },
        status: 'generated'
      }, scan.userId);

      res.json({
        success: true,
        report: {
          id: report.id,
          reportName: report.reportName,
          fileSize: report.fileSize,
          createdAt: report.createdAt
        },
        message: "Report auto-generated successfully"
      });
    } catch (error) {
      console.error("Auto-generate report error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to auto-generate report"
      });
    }
  });
}
