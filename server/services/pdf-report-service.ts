import puppeteer from "puppeteer";
import type { InventoryScan } from "@shared/schema";
import path from "path";
import fs from "fs/promises";

export interface ReportOptions {
  scanId: string;
  userId: string;
  scanData: InventoryScan;
  userEmail: string;
  customReportName?: string;
}

export class PDFReportService {
  private reportsDir: string;

  constructor() {
    // Store reports in a dedicated directory
    this.reportsDir = path.join(process.cwd(), "reports");
  }

  /**
   * Ensure reports directory exists
   */
  private async ensureReportsDirectory(): Promise<void> {
    try {
      await fs.access(this.reportsDir);
    } catch {
      await fs.mkdir(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate HTML template for Excel-to-IaC report
   */
  private generateExcelToIaCReportHTML(options: ReportOptions, requirements: any[], multiCloudCosts: any): string {
    const { userEmail, scanId, customReportName } = options;
    const scanDate = new Date().toLocaleString();
    const reportTitle = customReportName || 'Infrastructure Requirements & Cost Analysis Report';

    // Calculate totals
    const totalResources = requirements.length;
    const totalMonthlyCost = multiCloudCosts?.aws?.totalMonthly || 0;
    const totalYearlyCost = multiCloudCosts?.aws?.totalYearly || 0;

    // Group by site
    const bySite = requirements.reduce((acc: any, req: any) => {
      acc[req.site] = (acc[req.site] || 0) + 1;
      return acc;
    }, {});

    // Group by category
    const byCategory = requirements.reduce((acc: any, req: any) => {
      acc[req.category] = (acc[req.category] || 0) + 1;
      return acc;
    }, {});

    // Generate requirements table with cost information
    const requirementsRows = requirements.map((req: any, index: number) => {
      // Extract cost from requirements or calculate from multiCloudCosts
      const awsCost = multiCloudCosts?.aws?.resources?.[index] || 0;
      const azureCost = multiCloudCosts?.azure?.resources?.[index] || 0;
      const gcpCost = multiCloudCosts?.gcp?.resources?.[index] || 0;
      const ociCost = multiCloudCosts?.oci?.resources?.[index] || 0;

      return `
      <tr>
        <td>${req.applicationName}</td>
        <td>${req.workloadType}</td>
        <td>${req.cpuName}</td>
        <td>${req.ramGB}GB</td>
        <td>${req.dataSpaceGB}GB</td>
        <td>${req.category}</td>
        <td>${req.site}</td>
        <td>$${awsCost.toFixed(2)}</td>
        <td>$${azureCost.toFixed(2)}</td>
        <td>$${gcpCost.toFixed(2)}</td>
        <td>$${ociCost.toFixed(2)}</td>
      </tr>
      `;
    }).join('');

    // Generate cost comparison
    const costComparison = multiCloudCosts ? `
      <div class="provider-card">
        <h3>Multi-Cloud Cost Comparison</h3>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">$${multiCloudCosts.aws?.totalMonthly.toFixed(2)}</div>
            <div class="stat-label">AWS / Month</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${multiCloudCosts.azure?.totalMonthly.toFixed(2)}</div>
            <div class="stat-label">Azure / Month</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${multiCloudCosts.gcp?.totalMonthly.toFixed(2)}</div>
            <div class="stat-label">GCP / Month</div>
          </div>
          <div class="stat">
            <div class="stat-value">$${multiCloudCosts.oci?.totalMonthly.toFixed(2)}</div>
            <div class="stat-label">OCI / Month</div>
          </div>
        </div>
      </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reportTitle} - CloudedZe</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); }
        .header h1 { font-size: 32px; margin-bottom: 10px; font-weight: 700; }
        .header p { font-size: 16px; opacity: 0.9; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .info-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
        .info-card h4 { color: #667eea; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-card p { font-size: 18px; font-weight: 600; color: #333; }
        .provider-card { background: white; padding: 30px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
        .provider-card h3 { color: #667eea; font-size: 24px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #667eea; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-bottom: 25px; }
        .stat { text-align: center; padding: 15px; background: #f8f9fc; border-radius: 8px; }
        .stat-value { font-size: 28px; font-weight: 700; color: #667eea; margin-bottom: 5px; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
        table thead { background: #667eea; color: white; }
        table th { padding: 8px; text-align: left; font-weight: 600; font-size: 10px; }
        table td { padding: 8px; border-bottom: 1px solid #e1e4e8; font-size: 10px; }
        table tbody tr:hover { background: #f8f9fc; }
        table td:nth-child(n+8) { text-align: right; font-weight: 600; color: #2d7a3e; } /* Cost columns */
        .footer { text-align: center; margin-top: 40px; padding: 20px; color: #666; font-size: 14px; }
        .footer-logo { font-size: 20px; font-weight: 700; color: #667eea; margin-bottom: 10px; }
        @media print { body { background: white; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌐 CloudedZe</h1>
          <p>${reportTitle}</p>
        </div>

        <div class="info-grid">
          ${customReportName ? `
          <div class="info-card" style="grid-column: 1 / -1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            <h4 style="color: white;">Report Name</h4>
            <p style="color: white; font-size: 20px;">${reportTitle}</p>
          </div>
          ` : ''}
          <div class="info-card">
            <h4>Report Date</h4>
            <p>${scanDate}</p>
          </div>
          <div class="info-card">
            <h4>User</h4>
            <p>${userEmail}</p>
          </div>
          <div class="info-card">
            <h4>Total Resources</h4>
            <p>${totalResources}</p>
          </div>
          <div class="info-card">
            <h4>Monthly Cost (AWS)</h4>
            <p>$${totalMonthlyCost.toFixed(2)}</p>
          </div>
          <div class="info-card">
            <h4>Yearly Cost (AWS)</h4>
            <p>$${totalYearlyCost.toFixed(2)}</p>
          </div>
          <div class="info-card">
            <h4>Sites</h4>
            <p>${Object.keys(bySite).length}</p>
          </div>
        </div>

        ${costComparison}

        <div class="provider-card">
          <h3>Infrastructure Requirements & Cost Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Application</th>
                <th>Workload Type</th>
                <th>CPU/Instance</th>
                <th>RAM</th>
                <th>Storage</th>
                <th>Category</th>
                <th>Site</th>
                <th>AWS Monthly</th>
                <th>Azure Monthly</th>
                <th>GCP Monthly</th>
                <th>OCI Monthly</th>
              </tr>
            </thead>
            <tbody>
              ${requirementsRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <div class="footer-logo">CloudedZe</div>
          <p>Multi-Cloud Cost Optimization & Infrastructure Planning Platform</p>
          <p style="margin-top: 10px; font-size: 12px;">Generated on ${new Date().toLocaleString()} | Scan ID: ${scanId}</p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate HTML template for the report
   */
  private generateReportHTML(options: ReportOptions): string {
    const { scanData, userEmail } = options;
    const summary = scanData.summary as any;
    const scan = scanData.scanData as any;

    // Calculate statistics
    const totalResources = Object.keys(summary).reduce((total, provider) => {
      const providerData = summary[provider];
      return total + (providerData?.totalResources || 0);
    }, 0);

    const providers = Object.keys(summary);
    const scanDurationSeconds = (scanData.scanDuration / 1000).toFixed(2);
    const scanDate = new Date(scanData.createdAt!).toLocaleString();

    // Generate provider summaries
    const providerSummaries = providers.map(provider => {
      const data = summary[provider];
      return `
        <div class="provider-card">
          <h3>${provider.toUpperCase()}</h3>
          <div class="stats">
            <div class="stat">
              <div class="stat-value">${data.totalResources || 0}</div>
              <div class="stat-label">Resources</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.compartments?.length || 0}</div>
              <div class="stat-label">Compartments</div>
            </div>
            <div class="stat">
              <div class="stat-value">${data.regions?.length || 0}</div>
              <div class="stat-label">Regions</div>
            </div>
          </div>
          ${this.generateResourceTable(provider, data)}
        </div>
      `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CloudedZe Cloud Inventory Report</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #f5f7fa;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        }

        .header h1 {
          font-size: 32px;
          margin-bottom: 10px;
          font-weight: 700;
        }

        .header p {
          font-size: 16px;
          opacity: 0.9;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .info-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .info-card h4 {
          color: #667eea;
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-card p {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .provider-card {
          background: white;
          padding: 30px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .provider-card h3 {
          color: #667eea;
          font-size: 24px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #667eea;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }

        .stat {
          text-align: center;
          padding: 15px;
          background: #f8f9fc;
          border-radius: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 5px;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        table thead {
          background: #667eea;
          color: white;
        }

        table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
        }

        table td {
          padding: 12px;
          border-bottom: 1px solid #e1e4e8;
        }

        table tbody tr:hover {
          background: #f8f9fc;
        }

        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge-success {
          background: #d4edda;
          color: #155724;
        }

        .badge-warning {
          background: #fff3cd;
          color: #856404;
        }

        .badge-info {
          background: #d1ecf1;
          color: #0c5460;
        }

        .footer {
          text-align: center;
          margin-top: 40px;
          padding: 20px;
          color: #666;
          font-size: 14px;
        }

        .footer-logo {
          font-size: 20px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 10px;
        }

        .page-break {
          page-break-after: always;
        }

        @media print {
          body {
            background: white;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>🌐 CloudedZe</h1>
          <p>Multi-Cloud Inventory Scan Report</p>
        </div>

        <!-- Summary Info -->
        <div class="info-grid">
          <div class="info-card">
            <h4>Scan Date</h4>
            <p>${scanDate}</p>
          </div>
          <div class="info-card">
            <h4>User</h4>
            <p>${userEmail}</p>
          </div>
          <div class="info-card">
            <h4>Total Resources</h4>
            <p>${totalResources}</p>
          </div>
          <div class="info-card">
            <h4>Scan Duration</h4>
            <p>${scanDurationSeconds}s</p>
          </div>
          <div class="info-card">
            <h4>Providers Scanned</h4>
            <p>${providers.length}</p>
          </div>
          <div class="info-card">
            <h4>Status</h4>
            <p><span class="badge badge-success">${scanData.status || 'Completed'}</span></p>
          </div>
        </div>

        <!-- Provider Details -->
        ${providerSummaries}

        <!-- Footer -->
        <div class="footer">
          <div class="footer-logo">CloudedZe</div>
          <p>Multi-Cloud Cost Optimization & Inventory Management Platform</p>
          <p style="margin-top: 10px; font-size: 12px;">
            Generated on ${new Date().toLocaleString()} | Scan ID: ${options.scanId}
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate resource table HTML for a provider
   */
  private generateResourceTable(provider: string, data: any): string {
    const resources = data.resources || [];

    if (resources.length === 0) {
      return '<p style="color: #666; font-style: italic;">No resources found</p>';
    }

    // Take first 20 resources for the report
    const displayResources = resources.slice(0, 20);

    const rows = displayResources.map((resource: any) => {
      return `
        <tr>
          <td>${resource.name || 'N/A'}</td>
          <td>${resource.type || resource.resourceType || 'N/A'}</td>
          <td>${resource.region || resource.location || 'N/A'}</td>
          <td><span class="badge badge-${resource.state === 'RUNNING' || resource.state === 'AVAILABLE' ? 'success' : 'warning'}">${resource.state || resource.status || 'N/A'}</span></td>
        </tr>
      `;
    }).join('');

    return `
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Region</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      ${resources.length > 20 ? `<p style="margin-top: 10px; color: #666; font-style: italic;">Showing 20 of ${resources.length} resources</p>` : ''}
    `;
  }

  /**
   * Generate PDF report for Excel-to-IaC scan
   */
  async generateExcelToIaCReport(options: ReportOptions, requirements: any[], multiCloudCosts: any): Promise<{
    reportPath: string;
    reportName: string;
    fileSize: number;
  }> {
    await this.ensureReportsDirectory();

    // Use custom report name if provided, otherwise generate default
    const reportName = options.customReportName
      ? `${options.customReportName.replace(/[^a-zA-Z0-9-_]/g, '-')}.pdf`
      : `excel-to-iac-report-${options.scanId}-${Date.now()}.pdf`;
    const reportPath = path.join(this.reportsDir, reportName);

    let browser;
    try {
      // Generate HTML content
      const htmlContent = this.generateExcelToIaCReportHTML(options, requirements, multiCloudCosts);

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      await page.pdf({
        path: reportPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      // Get file size
      const stats = await fs.stat(reportPath);
      const fileSize = stats.size;

      return {
        reportPath,
        reportName,
        fileSize,
      };
    } catch (error) {
      console.error('Error generating Excel-to-IaC PDF report:', error);
      throw new Error(`Failed to generate Excel-to-IaC PDF report: ${error}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate PDF report for a scan
   */
  async generateReport(options: ReportOptions): Promise<{
    reportPath: string;
    reportName: string;
    fileSize: number;
  }> {
    await this.ensureReportsDirectory();

    // Use custom report name if provided, otherwise generate default
    const reportName = options.customReportName
      ? `${options.customReportName.replace(/[^a-zA-Z0-9-_]/g, '-')}.pdf`
      : `scan-report-${options.scanId}-${Date.now()}.pdf`;
    const reportPath = path.join(this.reportsDir, reportName);

    let browser;
    try {
      // Generate HTML content
      const htmlContent = this.generateReportHTML(options);

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Generate PDF
      await page.pdf({
        path: reportPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      // Get file size
      const stats = await fs.stat(reportPath);
      const fileSize = stats.size;

      return {
        reportPath,
        reportName,
        fileSize,
      };
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error(`Failed to generate PDF report: ${error}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Delete a report file
   */
  async deleteReport(reportPath: string): Promise<void> {
    try {
      await fs.unlink(reportPath);
    } catch (error) {
      console.error('Error deleting report:', error);
      throw new Error(`Failed to delete report: ${error}`);
    }
  }

  /**
   * Get report file stream for downloading
   */
  async getReportStream(reportPath: string) {
    try {
      await fs.access(reportPath);
      return reportPath;
    } catch (error) {
      throw new Error(`Report file not found: ${reportPath}`);
    }
  }
}

export const pdfReportService = new PDFReportService();
