import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { ComprehensiveCostCalculator } from "./utils/comprehensiveCostCalculator.js";
import { infrastructureRequirementsSchema, insertCloudCredentialSchema, insertInventoryScanSchema } from "@shared/schema";
import { CloudInventoryService, type InventoryScanRequest } from "./services/inventory-service.js";
import { TerraformStateParser } from "./services/terraform-parser.js";
import { ExcelParserService } from "./services/excel-parser.js";
import { ExcelToIaCService } from "./services/excel-to-iac.js";
import { GoogleSheetsService } from "./services/google-sheets-service.js";
import { setupAuth, isAuthenticated } from "./auth.js";
import { decryptSync } from "./encryption.js";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "1.0.0"
    });
  });

  // Debug endpoint to test inventory scan logic
  app.post("/api/debug/inventory", isAuthenticated, async (req: any, res) => {
    try {
      console.log('🔍 DEBUG: Testing inventory scan logic');
      const userId = req.user.id;
      console.log('User ID:', userId);
      
      // Test credential loading
      const credentials = await storage.getUserCloudCredentials(userId);
      console.log('User credentials:', credentials.length);
      
      if (credentials.length === 0) {
        return res.json({ message: 'No credentials found', credentials: [] });
      }
      
      const credential = credentials[0];
      console.log('First credential:', credential.id, credential.provider);
      
      // Test credential decryption
      let decryptedCredentials;
      try {
        decryptedCredentials = JSON.parse(credential.encryptedCredentials);
        console.log('Decrypted credentials keys:', Object.keys(decryptedCredentials));
      } catch (parseError) {
        console.log('Parse error:', parseError.message);
        return res.json({ error: 'Failed to parse credentials', parseError: parseError.message });
      }
      
      res.json({
        message: 'Debug successful',
        userId,
        credentialsCount: credentials.length,
        firstCredential: {
          id: credential.id,
          provider: credential.provider,
          name: credential.name,
          decryptedKeys: Object.keys(decryptedCredentials)
        }
      });
      
    } catch (error: any) {
      console.log('❌ DEBUG ERROR:', error.message);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  const costCalculator = new ComprehensiveCostCalculator();
  const inventoryService = new CloudInventoryService();
  const terraformParser = new TerraformStateParser();
  const excelParser = new ExcelParserService();
  
  // Initialize Google Sheets service if configured
  let googleSheetsService: GoogleSheetsService | null = null;
  if (process.env.GOOGLE_SHEETS_ENABLED === 'true' && 
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL && 
      process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    try {
      googleSheetsService = new GoogleSheetsService({
        clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY,
      });
      console.log('✅ Google Sheets service initialized');
    } catch (error) {
      console.warn('⚠️ Failed to initialize Google Sheets service:', error);
    }
  }

  // Configure multer for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept any file type
      cb(null, true);
    }
  });

  // Auth routes are now handled in auth.ts

  // Calculate costs endpoint (protected)
  app.post("/api/calculate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const requirements = infrastructureRequirementsSchema.parse(req.body);
      const results = costCalculator.calculateCosts(requirements);
      
      // Save to storage with user association
      const analysis = await storage.createCostAnalysis({
        requirements,
        results,
        inventoryScanId: req.body.inventoryScanId
      }, userId);

      res.json({
        analysisId: analysis.id,
        results
      });
    } catch (error) {
      console.error("Cost calculation error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Invalid requirements data" 
      });
    }
  });

  // Get analysis by ID (protected)
  app.get("/api/analysis/:id", isAuthenticated, async (req, res) => {
    try {
      const analysis = await storage.getCostAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to retrieve analysis" });
    }
  });

  // Get all analyses for user (protected)
  app.get("/api/analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const analyses = await storage.getAllCostAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve analyses" });
    }
  });

  // Export results as CSV (protected)
  app.get("/api/export/:id/csv", isAuthenticated, async (req, res) => {
    try {
      const analysis = await storage.getCostAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const results = analysis.results as any;
      let csv = "Provider,Compute,Storage,Database,Networking,Total\n";
      
      results.providers.forEach((provider: any) => {
        csv += `${provider.name},${provider.compute},${provider.storage},${provider.database},${provider.networking},${provider.total}\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=cost-analysis-${req.params.id}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });

  // Cloud credentials management endpoints (protected)
  app.post("/api/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { provider, name, encryptedCredentials } = req.body;
      
      // Validate required fields
      if (!provider || !name || !encryptedCredentials) {
        return res.status(400).json({ message: "Missing required fields: provider, name, encryptedCredentials" });
      }
      
      const credential = await storage.createCloudCredential({
        provider,
        name,
        encryptedCredentials
      }, userId);
      
      res.json({ id: credential.id, name: credential.name, provider: credential.provider });
    } catch (error) {
      console.error("Create credential error:", error);
      res.status(400).json({ message: "Failed to create credential" });
    }
  });

  app.get("/api/credentials", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCloudCredentials(userId);
      // Don't expose full credentials, only metadata
      const safeCredentials = credentials.map(cred => ({
        id: cred.id,
        name: cred.name,
        provider: cred.provider,
        isValidated: cred.isValidated,
        createdAt: cred.createdAt
      }));
      res.json(safeCredentials);
    } catch (error) {
      console.error("Get credentials error:", error);
      res.status(500).json({ message: "Failed to retrieve credentials" });
    }
  });

  app.get("/api/credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credential = await storage.getCloudCredential(req.params.id, userId);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      // Return decrypted credentials for scanning
      res.json({
        id: credential.id,
        name: credential.name,
        provider: credential.provider,
        credentials: credential.encryptedCredentials, // This is already decrypted by storage
        isValidated: credential.isValidated
      });
    } catch (error) {
      console.error("Get credential error:", error);
      res.status(500).json({ message: "Failed to retrieve credential" });
    }
  });

  app.put("/api/credentials/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, provider, encryptedCredentials } = req.body;
      
      const updated = await storage.updateCloudCredential(req.params.id, {
        name,
        provider,
        encryptedCredentials
      });
      
      if (!updated) {
        return res.status(404).json({ message: "Credential not found" });
      }
      
      res.json({ message: "Credential updated successfully" });
    } catch (error) {
      console.error("Update credential error:", error);
      res.status(500).json({ message: "Failed to update credential" });
    }
  });

  app.delete("/api/credentials/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteCloudCredential(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.json({ message: "Credential deleted successfully" });
    } catch (error) {
      console.error("Delete credential error:", error);
      res.status(500).json({ message: "Failed to delete credential" });
    }
  });

  // Validate specific OCI credentials (protected)
  app.post("/api/credentials/validate/oci", isAuthenticated, async (req: any, res) => {
    try {
      const { credentials } = req.body;

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: "OCI credentials are required"
        });
      }

      // Import OCI service
      const { OCIInventoryService } = await import('./services/oci-inventory.js');
      const ociService = new OCIInventoryService(credentials);

      const isValid = await ociService.validateCredentials();

      res.json({
        success: true,
        isValid,
        message: isValid ? "OCI credentials are valid" : "OCI credentials are invalid"
      });
    } catch (error) {
      console.error("OCI credential validation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to validate OCI credentials"
      });
    }
  });

  // Test OCI connection specifically (protected)
  app.post("/api/test/oci", isAuthenticated, async (req: any, res) => {
    try {
      const { credentials } = req.body;

      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: "OCI credentials are required"
        });
      }

      const { OCIInventoryService } = await import('./services/oci-inventory.js');
      const ociService = new OCIInventoryService(credentials);

      // Test basic validation
      const isValid = await ociService.validateCredentials();

      if (!isValid) {
        return res.json({
          success: false,
          message: "OCI credentials validation failed"
        });
      }

      // Try a simple resource discovery test
      try {
        const inventory = await ociService.discoverResources();
        res.json({
          success: true,
          message: "OCI connection successful",
          resourceCount: inventory.resources.length,
          services: Object.keys(inventory.summary.byService),
          regions: Object.keys(inventory.summary.byRegion)
        });
      } catch (discoveryError) {
        res.json({
          success: false,
          message: `OCI connection test failed: ${discoveryError instanceof Error ? discoveryError.message : 'Unknown error'}`,
          validCredentials: true
        });
      }
    } catch (error) {
      console.error("OCI connection test error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to test OCI connection"
      });
    }
  });

  // Get available cloud providers for filtering
  app.get("/api/inventory/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCloudCredentials(userId);
      const providers = [...new Set(credentials.map(cred => cred.provider))];
      res.json({ providers });
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ message: "Failed to get providers" });
    }
  });

  // OCI-specific resource discovery endpoint (protected)
  app.post("/api/inventory/scan/oci", isAuthenticated, async (req: any, res) => {
    console.log('🔍 OCI-specific inventory scan started');

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log('⏰ OCI scan timeout after 3 minutes');
        res.status(408).json({
          message: "OCI scan timeout - operation took too long. Please check your OCI credentials and network connectivity.",
          timeout: true
        });
      }
    }, 3 * 60 * 1000); // 3 minutes for OCI-specific scan

    try {
      const userId = req.user.id;
      const { credentialId, credentials } = req.body;
      const startTime = Date.now();

      console.log('User ID:', userId);

      let ociCredentials;

      // Get credentials either from credentialId or direct credentials
      if (credentialId) {
        console.log('Loading OCI credential from ID:', credentialId);
        const credential = await storage.getCloudCredential(credentialId, userId);

        if (!credential || credential.provider !== 'oci') {
          return res.status(400).json({
            success: false,
            message: 'OCI credential not found or invalid provider'
          });
        }

        try {
          ociCredentials = JSON.parse(credential.encryptedCredentials);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid credential data format'
          });
        }
      } else if (credentials) {
        ociCredentials = credentials;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either credentialId or credentials must be provided'
        });
      }

      console.log('✅ OCI credentials loaded');

      // Import and create OCI service
      const { OCIInventoryService } = await import('./services/oci-inventory.js');
      const ociService = new OCIInventoryService(ociCredentials);

      // Perform OCI resource discovery
      console.log('🔍 Starting OCI resource discovery...');
      const ociInventory = await ociService.discoverResources();

      console.log(`✅ OCI discovery completed: Found ${ociInventory.resources.length} resources`);

      // Convert to unified format
      const resources = ociInventory.resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        service: resource.service,
        provider: 'oci',
        location: resource.region,
        state: resource.state,
        tags: {},
        costDetails: resource.costDetails
      }));

      const inventory = {
        resources,
        summary: {
          totalResources: resources.length,
          providers: { 'oci': resources.length },
          services: ociInventory.summary.byService,
          locations: ociInventory.summary.byRegion
        },
        scanDate: new Date().toISOString(),
        scanDuration: Date.now() - startTime
      };

      console.log('💾 Saving OCI inventory scan...');

      // Save to database
      const inventoryScan = await storage.createInventoryScan({
        scanData: { success: true, inventory },
        summary: {
          totalResources: inventory.resources.length,
          scannedProviders: 1,
          scanTime: new Date().toISOString()
        },
        scanDuration: inventory.scanDuration
      }, userId);

      console.log(`✅ OCI inventory scan saved with ID: ${inventoryScan.id}`);

      // Generate cost analysis
      console.log('💰 Generating OCI cost analysis...');
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);

        costAnalysis = await storage.createCostAnalysis({
          requirements: {
            currency: 'USD',
            licensing: {
              windows: { enabled: false, licenses: 0 },
              sqlServer: { enabled: false, edition: 'standard', licenses: 0 },
              oracle: { enabled: false, edition: 'standard', licenses: 0 },
              vmware: { enabled: false, licenses: 0 },
              redhat: { enabled: false, licenses: 0 },
              sap: { enabled: false, licenses: 0 },
              microsoftOffice365: { enabled: false, licenses: 0 }
            },
            compute: analysis.costRequirements.compute,
            storage: analysis.costRequirements.storage,
            database: analysis.costRequirements.database,
            networking: analysis.costRequirements.networking,
            scenarios: {
              disasterRecovery: { enabled: false, rto: 0, rpo: 0 },
              highAvailability: { enabled: false, availability: 99.9 },
              autoScaling: { enabled: false, minInstances: 1, maxInstances: 10 }
            }
          } as any,
          results: (analysis as any).results || {},
          inventoryScanId: inventoryScan.id
        }, userId);

        console.log('✅ OCI cost analysis created successfully');
      } catch (analysisError: any) {
        console.log('⚠️ OCI cost analysis failed (continuing anyway):', analysisError.message);
      }

      console.log('🎉 OCI INVENTORY SCAN COMPLETED SUCCESSFULLY');

      clearTimeout(timeout);

      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id,
        costAnalysis: costAnalysis,
        oci: {
          tenancyId: ociCredentials.tenancyId,
          region: ociCredentials.region,
          resourcesByService: ociInventory.summary.byService,
          resourcesByRegion: ociInventory.summary.byRegion,
          resourcesByState: ociInventory.summary.byState
        }
      });

    } catch (error: any) {
      console.log('❌ OCI INVENTORY SCAN FAILED:', error.message);
      console.log('❌ Error stack:', error.stack);

      clearTimeout(timeout);

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to scan OCI resources",
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Inventory scanning endpoints (protected) - SIMPLIFIED VERSION
  app.post("/api/inventory/scan", isAuthenticated, async (req: any, res) => {
    console.log('🚀 NEW INVENTORY SCAN STARTED');
    
    // Set a timeout for the response (5 minutes max)
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log('⏰ Inventory scan timeout after 5 minutes');
        res.status(408).json({ 
          message: "Scan timeout - operation took too long. Please try with fewer credentials or check your cloud provider access.",
          timeout: true 
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    try {
      const userId = req.user.id;
      const scanRequest: InventoryScanRequest = req.body;
      const startTime = Date.now();
      
      console.log('User ID:', userId);
      console.log('Credentials to scan:', scanRequest.credentials?.length || 0);
      
      // Step 1: Load credentials
      console.log('Step 1: Loading credentials...');
      const credentialsWithData = [];
      
      for (const cred of scanRequest.credentials) {
        try {
          console.log(`Loading credential: ${cred.id}`);
          const credential = await storage.getCloudCredential(cred.id, userId);
          
          if (!credential) {
            console.log(`Credential ${cred.id} not found`);
            continue;
          }
          
          // Parse credentials
          let decryptedCredentials;
          try {
            decryptedCredentials = JSON.parse(credential.encryptedCredentials);
          } catch (parseError) {
            console.log(`Invalid credential data for ${cred.id}`);
            continue;
          }
          
          credentialsWithData.push({
            id: cred.id,
            provider: cred.provider,
            name: cred.name,
            credentials: decryptedCredentials
          });
          
          console.log(`✅ Loaded credential: ${cred.id}`);
        } catch (error) {
          console.log(`❌ Failed to load credential ${cred.id}:`, error.message);
        }
      }
      
      if (credentialsWithData.length === 0) {
        console.log('❌ No valid credentials found');
        return res.status(400).json({
          success: false,
          message: 'No valid credentials found'
        });
      }
      
      console.log(`✅ Loaded ${credentialsWithData.length} valid credentials`);
      
      // Step 2: Perform scan
      console.log('Step 2: Starting cloud scan...');
      const updatedScanRequest: InventoryScanRequest = {
        ...scanRequest,
        credentials: credentialsWithData
      };
      
      const scanResult = await inventoryService.scanMultipleProviders(updatedScanRequest);
      
      if (!scanResult) {
        console.log('❌ Scan failed: No result returned');
        return res.status(500).json({
          success: false,
          message: 'Failed to scan cloud resources - no result returned'
        });
      }
      
      console.log('✅ Scan completed successfully');
      
      // Step 3: Process results
      console.log('Step 3: Processing results...');
      const { resources, summary } = scanResult;
      const inventory = {
        resources,
        summary,
        scanDate: new Date().toISOString(),
        scanDuration: Date.now() - startTime
      };
      
      console.log(`Found ${inventory.resources?.length || 0} resources`);
      
      // Step 4: Save to database
      console.log('Step 4: Saving to database...');
      const inventoryScan = await storage.createInventoryScan({
        scanData: { success: true, inventory },
        summary: {
          totalResources: inventory.resources?.length || 0,
          scannedProviders: 1,
          scanTime: new Date().toISOString()
        },
        scanDuration: inventory.scanDuration
      }, userId);
      
      console.log(`✅ Saved inventory scan with ID: ${inventoryScan.id}`);
      
      // Step 5: Generate cost analysis (optional)
      console.log('Step 5: Generating cost analysis...');
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        
        costAnalysis = await storage.createCostAnalysis({
          requirements: {
            currency: 'USD',
            licensing: {
              windows: { enabled: false, licenses: 0 },
              sqlServer: { enabled: false, edition: 'standard', licenses: 0 },
              oracle: { enabled: false, edition: 'standard', licenses: 0 },
              vmware: { enabled: false, licenses: 0 },
              redhat: { enabled: false, licenses: 0 },
              sap: { enabled: false, licenses: 0 },
              microsoftOffice365: { enabled: false, licenses: 0 }
            },
            compute: analysis.costRequirements.compute,
            storage: analysis.costRequirements.storage,
            database: analysis.costRequirements.database,
            networking: analysis.costRequirements.networking,
            security: analysis.costRequirements.security,
            monitoring: analysis.costRequirements.monitoring,
            analytics: analysis.costRequirements.analytics,
            ai: analysis.costRequirements.ai,
            devops: analysis.costRequirements.devops,
            backup: analysis.costRequirements.backup,
            iot: analysis.costRequirements.iot,
            quantum: analysis.costRequirements.quantum,
            media: analysis.costRequirements.media,
            scenarios: {
              disasterRecovery: { enabled: false, rto: 0, rpo: 0 },
              highAvailability: { enabled: false, availability: 99.9 },
              autoScaling: { enabled: false, minInstances: 1, maxInstances: 10 }
            }
          },
          results: analysis.results || {},
          inventoryScanId: inventoryScan.id
        }, userId);
        
        console.log('✅ Cost analysis created successfully');
      } catch (analysisError) {
        console.log('⚠️ Cost analysis failed (continuing anyway):', analysisError.message);
      }
      
      console.log('🎉 INVENTORY SCAN COMPLETED SUCCESSFULLY');
      
      // Clear the timeout since we're responding successfully
      clearTimeout(timeout);
      
      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id,
        costAnalysis: costAnalysis
      });
      
    } catch (error: any) {
      console.log('❌ INVENTORY SCAN FAILED:', error.message);
      console.log('❌ Error stack:', error.stack);
      
      // Clear the timeout since we're responding with an error
      clearTimeout(timeout);
      
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to scan cloud resources",
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Check inventory scan status (for long-running scans)
  app.get("/api/inventory/scan/status/:scanId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const scanId = req.params.scanId;
      
      const scan = await storage.getInventoryScan(parseInt(scanId), userId);
      
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      
      res.json({
        id: scan.id,
        status: 'completed', // For now, all scans are completed when saved
        createdAt: scan.createdAt,
        summary: scan.summary,
        scanDuration: scan.scanDuration
      });
      
    } catch (error) {
      console.error("Get scan status error:", error);
      res.status(500).json({ message: "Failed to get scan status" });
    }
  });

  // Get user inventory scans
  app.get("/api/inventory/scans", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const scans = await storage.getUserInventoryScans(userId);
      res.json(scans);
    } catch (error) {
      console.error("Get inventory scans error:", error);
      res.status(500).json({ message: "Failed to retrieve inventory scans" });
    }
  });

  // Generate cost analysis from inventory (protected)
  app.post("/api/inventory/analyze-costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { inventory, scanId } = req.body;
      const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
      
      // Convert inventory mapping to full requirements format
      const fullRequirements = {
        currency: 'USD' as const,
        licensing: {
          windows: { enabled: false, licenses: 0 },
          sqlServer: { enabled: false, edition: 'standard' as const, licenses: 0 },
          oracle: { enabled: false, edition: 'standard' as const, licenses: 0 },
          vmware: { enabled: false, licenses: 0 },
          redhat: { enabled: false, licenses: 0 },
          sap: { enabled: false, licenses: 0 },
          microsoftOffice365: { enabled: false, licenses: 0 }
        },
        compute: analysis.costRequirements.compute,
        storage: {
          ...analysis.costRequirements.storage,
          fileStorage: { size: 0, performanceMode: 'general-purpose' as const }
        },
        database: {
          ...analysis.costRequirements.database,
          nosql: { engine: 'none' as const, readCapacity: 0, writeCapacity: 0, storage: 0 },
          cache: { engine: 'none' as const, instanceClass: 'small' as const, nodes: 0 },
          dataWarehouse: { nodes: 0, nodeType: 'small' as const, storage: 0 }
        },
        networking: {
          ...analysis.costRequirements.networking,
          cdn: { enabled: false, requests: 0, dataTransfer: 0 },
          dns: { hostedZones: 0, queries: 0 },
          vpn: { connections: 0, hours: 0 }
        },
        analytics: {
          dataProcessing: { hours: 0, nodeType: 'small' as const },
          streaming: { shards: 0, records: 0 },
          businessIntelligence: { users: 0, queries: 0 }
        },
        ai: {
          training: { hours: 0, instanceType: 'cpu' as const },
          inference: { requests: 0, instanceType: 'cpu' as const },
          prebuilt: { imageAnalysis: 0, textProcessing: 0, speechServices: 0 }
        },
        security: {
          webFirewall: { enabled: false, requests: 0 },
          identityManagement: { users: 0, authentications: 0 },
          keyManagement: { keys: 0, operations: 0 },
          threatDetection: { enabled: false, events: 0 }
        },
        monitoring: {
          metrics: 0,
          logs: 0,
          traces: 0,
          alerts: 0
        },
        devops: {
          cicd: { buildMinutes: 0, parallelJobs: 0 },
          containerRegistry: { storage: 0, pulls: 0 },
          apiManagement: { requests: 0, endpoints: 0 }
        },
        backup: {
          storage: 0,
          frequency: 'daily' as const,
          retention: 30
        },
        iot: {
          devices: 0,
          messages: 0,
          dataProcessing: 0,
          edgeLocations: 0
        },
        media: {
          videoStreaming: { hours: 0, quality: '1080p' as const },
          transcoding: { minutes: 0, inputFormat: 'standard' as const }
        },
        quantum: {
          processingUnits: 0,
          quantumAlgorithms: 'optimization' as const,
          circuitComplexity: 'basic' as const
        },
        advancedAI: {
          vectorDatabase: { dimensions: 0, queries: 0 },
          customChips: { tpuHours: 0, inferenceChips: 0 },
          modelHosting: { models: 0, requests: 0 },
          ragPipelines: { documents: 0, embeddings: 0 }
        },
        edge: {
          edgeLocations: 0,
          edgeCompute: 0,
          fiveGNetworking: { networkSlices: 0, privateNetworks: 0 },
          realTimeProcessing: 0
        },
        confidential: {
          secureEnclaves: 0,
          trustedExecution: 0,
          privacyPreservingAnalytics: 0,
          zeroTrustProcessing: 0
        },
        sustainability: {
          carbonFootprintTracking: false,
          renewableEnergyPreference: false,
          greenCloudOptimization: false,
          carbonOffsetCredits: 0
        },
        scenarios: {
          disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
          compliance: { frameworks: [], auditLogging: false, dataResidency: 'global' as const },
          migration: { dataToMigrate: 0, applicationComplexity: 'moderate' as const }
        },
        optimization: {
          reservedInstanceStrategy: 'moderate' as const,
          spotInstanceTolerance: 10,
          autoScalingAggression: 'moderate' as const,
          costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: 'email' as const }
        }
      };
      
      // Calculate costs using the full requirements
      const costResults = costCalculator.calculateCosts(fullRequirements);
      
      // Create cost analysis with inventory link
      const costAnalysis = await storage.createCostAnalysis({
        requirements: analysis.costRequirements,
        results: costResults,
        inventoryScanId: scanId
      }, userId);
      
      res.json({
        success: true,
        analysis: {
          inventory: analysis.inventory,
          costRequirements: analysis.costRequirements,
          results: costResults,
          recommendations: analysis.recommendations,
          analysisId: costAnalysis.id
        }
      });
    } catch (error) {
      console.error("Inventory cost analysis error:", error);
      res.status(500).json({ 
        success: false,
        message: error instanceof Error ? error.message : "Failed to analyze inventory costs" 
      });
    }
  });

  // Parse Terraform state file endpoint (protected)
  app.post("/api/terraform/parse", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { terraformState } = req.body;

      if (!terraformState) {
        return res.status(400).json({ 
          message: "Terraform state data is required" 
        });
      }

      // Parse the Terraform state
      const inventory = terraformParser.parseTerraformState(terraformState);
      
      // Save the inventory scan
      const inventoryScan = await storage.createInventoryScan({
        summary: inventory.summary,
        scanDuration: 0,
        scanData: inventory
      }, userId);

      // Automatically generate cost analysis
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        
        // Convert inventory mapping to full requirements format
        const fullRequirements = {
          currency: 'USD' as const,
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: 'standard' as const, licenses: 0 },
            oracle: { enabled: false, edition: 'standard' as const, licenses: 0 },
            vmware: { enabled: false, licenses: 0 },
            redhat: { enabled: false, licenses: 0 },
            sap: { enabled: false, licenses: 0 },
            microsoftOffice365: { enabled: false, licenses: 0 }
          },
          compute: analysis.costRequirements.compute,
          storage: {
            ...analysis.costRequirements.storage,
            fileStorage: { size: 0, performanceMode: 'general-purpose' as const }
          },
          database: {
            ...analysis.costRequirements.database,
            nosql: { engine: 'none' as const, readCapacity: 0, writeCapacity: 0, storage: 0 },
            cache: { engine: 'none' as const, instanceClass: 'small' as const, nodes: 0 },
            dataWarehouse: { nodes: 0, nodeType: 'small' as const, storage: 0 }
          },
          networking: {
            ...analysis.costRequirements.networking,
            cdn: { enabled: false, requests: 0, dataTransfer: 0 },
            dns: { hostedZones: 0, queries: 0 },
            vpn: { connections: 0, hours: 0 }
          },
          analytics: {
            dataProcessing: { hours: 0, nodeType: 'small' as const },
            streaming: { shards: 0, records: 0 },
            businessIntelligence: { users: 0, queries: 0 }
          },
          ai: {
            training: { hours: 0, instanceType: 'cpu' as const },
            inference: { requests: 0, instanceType: 'cpu' as const },
            prebuilt: { imageAnalysis: 0, textProcessing: 0, speechServices: 0 }
          },
          security: {
            webFirewall: { enabled: false, requests: 0 },
            identityManagement: { users: 0, authentications: 0 },
            keyManagement: { keys: 0, operations: 0 },
            threatDetection: { enabled: false, events: 0 }
          },
          monitoring: {
            metrics: 0,
            logs: 0,
            traces: 0,
            alerts: 0
          },
          devops: {
            cicd: { buildMinutes: 0, parallelJobs: 0 },
            containerRegistry: { storage: 0, pulls: 0 },
            apiManagement: { requests: 0, users: 0 }
          },
          backup: {
            storage: 0,
            frequency: 'daily' as const,
            retention: 30
          },
          iot: {
            devices: 0,
            messages: 0,
            dataProcessing: 0,
            edgeLocations: 0
          },
          media: {
            videoStreaming: { hours: 0, quality: '1080p' as const },
            transcoding: { minutes: 0, inputFormat: 'standard' as const }
          },
          quantum: {
            processingUnits: 0,
            quantumAlgorithms: 'optimization' as const,
            circuitComplexity: 'basic' as const
          },
          advancedAI: {
            vectorDatabase: { dimensions: 0, queries: 0 },
            customChips: { tpuHours: 0, inferenceChips: 0 },
            modelHosting: { models: 0, requests: 0 },
            ragPipelines: { documents: 0, embeddings: 0 }
          },
          edge: {
            edgeLocations: 0,
            edgeCompute: 0,
            fiveGNetworking: { networkSlices: 0, privateNetworks: 0 }
          },
          confidential: {
            secureEnclaves: 0,
            trustedExecution: 0,
            privacyPreservingAnalytics: 0,
            zeroTrustProcessing: 0
          },
          optimization: {
            reservedInstanceStrategy: 'moderate' as const,
            spotInstanceTolerance: 10,
            autoScalingAggression: 'moderate' as const,
            costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: 'email' as const }
          },
          sustainability: {
            carbonFootprintTracking: false,
            renewableEnergyPreference: false,
            greenCloudOptimization: false,
            carbonOffsetCredits: 0
          },
          scenarios: {
            disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
            compliance: { frameworks: [], auditLogging: false, dataResidency: 'global' as const },
            migration: { dataToMigrate: 0, applicationComplexity: 'moderate' as const }
          }
        };

        const costResults = costCalculator.calculateCosts(fullRequirements);
        
        console.log('Creating cost analysis in database...');
        costAnalysis = await storage.createCostAnalysis({
          requirements: fullRequirements,
          results: costResults,
          inventoryScanId: inventoryScan.id
        }, userId);
        console.log('Cost analysis created successfully');
      } catch (analysisError) {
        console.error("Automatic cost analysis failed:", analysisError);
      }

      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id,
        costAnalysis: costAnalysis ? {
          analysisId: costAnalysis.id,
          results: costAnalysis.results
        } : null
      });
    } catch (error) {
      console.error("Terraform parsing error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to parse Terraform state" 
      });
    }
  });

  // Excel upload and analysis routes (protected)
  
  // Download Excel template
  app.get("/api/excel/template", isAuthenticated, (req, res) => {
    try {
      const templateBuffer = excelParser.generateExcelTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="cloud-resources-template.xlsx"');
      res.send(templateBuffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: "Failed to generate Excel template" });
    }
  });

  // Upload and parse file
  app.post("/api/excel/upload", isAuthenticated, upload.single('excelFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.id;
      const { analysisName } = req.body;

      // Parse the file based on its type
      let excelData;
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        excelData = await excelParser.parseExcelFile(req.file.buffer);
      } else {
        // For non-Excel files, create a simple data structure
        excelData = [{
          'Resource Name': req.file.originalname,
          'Type': 'File',
          'Service': 'Upload',
          'Region': 'Unknown',
          'State': 'Uploaded'
        }];
      }

      if (excelData.length === 0) {
        return res.status(400).json({ 
          message: "No valid data found in file. Please check the format and try again." 
        });
      }

      // Convert to unified resources
      const resources = excelParser.convertToUnifiedResources(excelData);

      // Generate cost analysis - convert resources to proper inventory format
      const inventory = {
        resources: resources,
        summary: {
          totalResources: resources.length,
          providers: resources.reduce((acc, resource) => {
            acc[resource.provider] = (acc[resource.provider] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          services: resources.reduce((acc, resource) => {
            acc[resource.type] = (acc[resource.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          locations: resources.reduce((acc, resource) => {
            acc[resource.region] = (acc[resource.region] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        },
        scanDate: new Date().toISOString(),
        scanDuration: 0
      };
      
      const costAnalysis = await inventoryService.generateAutomaticCostAnalysis(inventory);

      // Save the analysis
      const analysis = await storage.createCostAnalysis({
        requirements: {
          currency: 'USD',
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: 'standard', licenses: 0 },
            oracle: { enabled: false, edition: 'standard', licenses: 0 },
            vmware: { enabled: false, licenses: 0 },
            redhat: { enabled: false, licenses: 0 },
            sap: { enabled: false, licenses: 0 },
            microsoftOffice365: { enabled: false, licenses: 0 }
          },
          compute: costAnalysis.costRequirements.compute,
          storage: costAnalysis.costRequirements.storage,
          database: costAnalysis.costRequirements.database,
          networking: costAnalysis.costRequirements.networking,
          security: costAnalysis.costRequirements.security,
          monitoring: costAnalysis.costRequirements.monitoring,
          analytics: costAnalysis.costRequirements.analytics,
          ai: costAnalysis.costRequirements.ai,
          devops: costAnalysis.costRequirements.devops,
          backup: costAnalysis.costRequirements.backup,
          iot: costAnalysis.costRequirements.iot,
          quantum: costAnalysis.costRequirements.quantum,
          media: costAnalysis.costRequirements.media,
          scenarios: {
            disasterRecovery: { enabled: false, rto: 0, rpo: 0 },
            highAvailability: { enabled: false, availability: 99.9 },
            autoScaling: { enabled: false, minInstances: 1, maxInstances: 10 }
          }
        },
        results: costAnalysis.results
      }, userId);

      // Prepare webhook data
      const webhookData = {
        analysisId: analysis.id,
        analysisName: analysisName || `Excel Analysis - ${new Date().toLocaleDateString()}`,
        userId: userId,
        timestamp: new Date().toISOString(),
        resources: resources,
        summary: {
          totalResources: resources.length,
          byProvider: resources.reduce((acc, resource) => {
            acc[resource.provider] = (acc[resource.provider] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          byType: resources.reduce((acc, resource) => {
            acc[resource.type] = (acc[resource.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          totalCost: resources.reduce((sum, resource) => sum + (resource.cost || 0), 0)
        },
        costAnalysis: {
          analysisId: analysis.id,
          results: costAnalysis.results,
          requirements: costAnalysis.requirements,
          inventoryScanId: costAnalysis.inventoryScanId
        }
      };

      // Call n8n webhook
      let webhookTriggered = false;
      try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (webhookUrl) {
          // Convert webhook data to URL parameters for GET request
          const params = new URLSearchParams({
            analysisId: webhookData.analysisId,
            analysisName: webhookData.analysisName,
            userId: webhookData.userId,
            timestamp: webhookData.timestamp,
            totalResources: webhookData.summary.totalResources.toString(),
            totalCost: webhookData.summary.totalCost.toString(),
            providers: Object.keys(webhookData.summary.byProvider).join(','),
            types: Object.keys(webhookData.summary.byType).join(',')
          });

          const webhookResponse = await fetch(`${webhookUrl}?${params.toString()}`, {
            method: 'GET'
          });

          if (webhookResponse.ok) {
            const response = await webhookResponse.json();
            console.log('✅ n8n webhook called successfully:', response);
            webhookTriggered = true;
          } else {
            console.warn('⚠️ n8n webhook returned status:', webhookResponse.status);
          }
        } else {
          console.log('ℹ️ N8N_WEBHOOK_URL not configured, skipping webhook call');
        }
      } catch (webhookError) {
        console.error('❌ n8n webhook error:', webhookError);
        // Don't fail the upload if webhook fails
      }

      // Upload to Google Sheets if configured
      let googleSheetsResult: any = null;
      if (googleSheetsService && excelData && excelData.length > 0) {
        try {
          console.log('📊 Uploading to Google Sheets...');
          
          // Extract headers from the first row of data
          const headers = Object.keys(excelData[0]);
          
          // Convert data to array format for Google Sheets
          const sheetData = excelData.map(row => 
            headers.map(header => (row as any)[header] || '')
          );

          const sheetsResult = await googleSheetsService.uploadExcelData(
            req.file.originalname.replace(/\.[^/.]+$/, ""), // Remove file extension
            sheetData,
            headers
          );

          if (sheetsResult.success) {
            console.log('✅ Google Sheets upload successful:', sheetsResult.spreadsheetUrl);
            googleSheetsResult = {
              success: true,
              spreadsheetUrl: sheetsResult.spreadsheetUrl,
              spreadsheetId: sheetsResult.spreadsheetId
            };
          } else {
            console.warn('⚠️ Google Sheets upload failed:', sheetsResult.error);
            googleSheetsResult = {
              success: false,
              error: sheetsResult.error
            };
          }
        } catch (sheetsError) {
          console.error('❌ Google Sheets upload error:', sheetsError);
          googleSheetsResult = {
            success: false,
            error: sheetsError instanceof Error ? sheetsError.message : 'Unknown error'
          };
        }
      }

      res.json({
        success: true,
        analysisId: analysis.id,
        resources: resources,
        summary: webhookData.summary,
        costAnalysis: webhookData.costAnalysis,
        webhookTriggered: webhookTriggered,
        googleSheets: googleSheetsResult
      });
    } catch (error) {
      console.error("Excel upload error:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to process file" 
      });
    }
  });

  // Test webhook endpoint
  app.post("/api/test/webhook", isAuthenticated, async (req: any, res) => {
    try {
      const testData = {
        test: true,
        message: "Test webhook call from Cloudedze",
        timestamp: new Date().toISOString(),
        userId: req.user.id
      };

      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        return res.status(400).json({ 
          success: false, 
          message: "N8N_WEBHOOK_URL not configured" 
        });
      }

      // Convert test data to URL parameters for GET request
      const params = new URLSearchParams({
        test: 'true',
        message: testData.message,
        timestamp: testData.timestamp,
        userId: testData.userId,
        source: 'cloudedze-test'
      });

      const webhookResponse = await fetch(`${webhookUrl}?${params.toString()}`, {
        method: 'GET'
      });

      res.json({
        success: true,
        webhookStatus: webhookResponse.status,
        webhookUrl: webhookUrl,
        testData: testData,
        response: await webhookResponse.text()
      });
    } catch (error) {
      console.error("Test webhook error:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Webhook test failed" 
      });
    }
  });

  // Validate file format
  app.post("/api/excel/validate", isAuthenticated, upload.single('excelFile'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Parse the file based on its type
      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
      let headers: string[];
      let validation: any;
      let sampleData: any[] = [];

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file to get headers
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 1) {
          return res.status(400).json({ 
            isValid: false, 
            errors: ["Excel file is empty"] 
          });
        }

        headers = jsonData[0] as string[];
        sampleData = jsonData.slice(1, 3); // First 2 rows of data as sample
        
        // For Excel files, validate format but be more flexible
        try {
          validation = excelParser.validateExcelFormat(headers);
        } catch (error) {
          // If validation fails, still allow the file but with a warning
          validation = {
            isValid: true,
            errors: [],
            warnings: ["File format may not be optimal for cost analysis"]
          };
        }
      } else {
        // For non-Excel files, create basic validation
        headers = ['File Name', 'Type', 'Service', 'Region', 'State'];
        sampleData = [[req.file.originalname, 'File', 'Upload', 'Unknown', 'Uploaded']];
        validation = {
          isValid: true,
          errors: [],
          headers: headers,
          sampleData: sampleData
        };
      }

      res.json({
        isValid: validation.isValid,
        errors: validation.errors,
        headers: headers,
        sampleData: sampleData
      });
    } catch (error) {
      console.error("Excel validation error:", error);
      res.status(400).json({ 
        isValid: false,
        errors: [error instanceof Error ? error.message : "Failed to validate file"] 
      });
    }
  });

  // Excel to Infrastructure as Code endpoints
  const excelToIaCService = new ExcelToIaCService();

  // Upload Excel file for IaC generation
  app.post("/api/excel-to-iac/upload", isAuthenticated, upload.single('excel'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file provided" });
      }

      console.log('📊 Excel to IaC: Processing file:', req.file.originalname);

      // Parse Excel file
      const requirements = await excelToIaCService.parseExcelFile(req.file.buffer);
      console.log(`📊 Parsed ${requirements.length} infrastructure requirements`);

      // Generate cost estimates
      const costEstimates = excelToIaCService.generateCostEstimate(requirements);

      // Store in session for later use
      const sessionData = {
        requirements,
        costEstimates,
        uploadedAt: new Date().toISOString(),
        fileName: req.file.originalname
      };

      // In production, you might want to store this in a database with a unique ID
      // For now, we'll store in session
      req.session.iacData = sessionData;

      res.json({
        success: true,
        message: "Excel file processed successfully",
        summary: {
          totalResources: requirements.length,
          totalMonthlyCost: costEstimates.reduce((sum, est) => sum + est.monthlyEstimate, 0),
          totalYearlyCost: costEstimates.reduce((sum, est) => sum + est.yearlyEstimate, 0)
        },
        requirements: requirements.slice(0, 5), // Preview first 5
        costEstimates: costEstimates.slice(0, 5) // Preview first 5
      });

    } catch (error) {
      console.error("Excel to IaC upload error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to process Excel file"
      });
    }
  });

  // Generate Terraform code
  app.post("/api/excel-to-iac/generate-terraform", isAuthenticated, async (req: any, res) => {
    try {
      const iacData = req.session.iacData;
      if (!iacData || !iacData.requirements) {
        return res.status(400).json({ message: "No Excel data found. Please upload an Excel file first." });
      }

      console.log('🏗️ Generating Terraform code for', iacData.requirements.length, 'resources');

      const terraformCode = excelToIaCService.generateTerraformCode(iacData.requirements);

      // Set headers for file download
      const fileName = `infrastructure-${Date.now()}.tf`;
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      res.send(terraformCode);

    } catch (error) {
      console.error("Terraform generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate Terraform code"
      });
    }
  });

  // Generate cost estimate CSV
  app.post("/api/excel-to-iac/generate-csv", isAuthenticated, async (req: any, res) => {
    try {
      const iacData = req.session.iacData;
      if (!iacData || !iacData.costEstimates) {
        return res.status(400).json({ message: "No cost estimate data found. Please upload an Excel file first." });
      }

      console.log('💰 Generating cost estimate CSV for', iacData.costEstimates.length, 'resources');

      const csvContent = excelToIaCService.generateCSV(iacData.costEstimates);

      // Set headers for file download
      const fileName = `cost-estimate-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      res.send(csvContent);

    } catch (error) {
      console.error("CSV generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate CSV"
      });
    }
  });

  // Get current IaC session data
  app.get("/api/excel-to-iac/session", isAuthenticated, async (req: any, res) => {
    try {
      const iacData = req.session.iacData;
      if (!iacData) {
        return res.json({ hasData: false });
      }

      res.json({
        hasData: true,
        fileName: iacData.fileName,
        uploadedAt: iacData.uploadedAt,
        summary: {
          totalResources: iacData.requirements?.length || 0,
          totalMonthlyCost: iacData.costEstimates?.reduce((sum: any, est: any) => sum + est.monthlyEstimate, 0) || 0,
          totalYearlyCost: iacData.costEstimates?.reduce((sum: any, est: any) => sum + est.yearlyEstimate, 0) || 0
        },
        requirements: iacData.requirements || [],
        costEstimates: iacData.costEstimates || []
      });

    } catch (error) {
      console.error("Session data error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve session data"
      });
    }
  });

  // Clear IaC session data
  app.delete("/api/excel-to-iac/session", isAuthenticated, async (req: any, res) => {
    try {
      delete req.session.iacData;
      res.json({ success: true, message: "Session data cleared" });
    } catch (error) {
      console.error("Clear session error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to clear session data"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
