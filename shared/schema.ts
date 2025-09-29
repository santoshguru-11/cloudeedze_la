import { pgTable, text, varchar, integer, decimal, jsonb, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cloud credentials storage (encrypted)
export const cloudCredentials = pgTable("cloud_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: varchar("provider").notNull(), // aws, azure, gcp, oci
  name: varchar("name").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  isValidated: boolean("is_validated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Inventory scans storage
export const inventoryScans = pgTable("inventory_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  scanData: jsonb("scan_data").notNull(),
  summary: jsonb("summary").notNull(),
  scanDuration: integer("scan_duration").notNull(), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const costAnalyses = pgTable("cost_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  inventoryScanId: varchar("inventory_scan_id"),
  requirements: jsonb("requirements").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  cloudCredentials: many(cloudCredentials),
  inventoryScans: many(inventoryScans),
  costAnalyses: many(costAnalyses),
}));

export const cloudCredentialsRelations = relations(cloudCredentials, ({ one }) => ({
  user: one(users, {
    fields: [cloudCredentials.userId],
    references: [users.id],
  }),
}));

export const inventoryScansRelations = relations(inventoryScans, ({ one, many }) => ({
  user: one(users, {
    fields: [inventoryScans.userId],
    references: [users.id],
  }),
  costAnalyses: many(costAnalyses),
}));

export const costAnalysesRelations = relations(costAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [costAnalyses.userId],
    references: [users.id],
  }),
  inventoryScan: one(inventoryScans, {
    fields: [costAnalyses.inventoryScanId],
    references: [inventoryScans.id],
  }),
}));

export const insertCostAnalysisSchema = createInsertSchema(costAnalyses).pick({
  requirements: true,
  results: true,
  inventoryScanId: true,
});

export const insertCloudCredentialSchema = createInsertSchema(cloudCredentials).pick({
  provider: true,
  name: true,
  encryptedCredentials: true,
});

export const insertInventoryScanSchema = createInsertSchema(inventoryScans).pick({
  scanData: true,
  summary: true,
  scanDuration: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCostAnalysis = z.infer<typeof insertCostAnalysisSchema>;
export type CostAnalysis = typeof costAnalyses.$inferSelect;
export type InsertCloudCredential = z.infer<typeof insertCloudCredentialSchema>;
export type CloudCredential = typeof cloudCredentials.$inferSelect;
export type InsertInventoryScan = z.infer<typeof insertInventoryScanSchema>;
export type InventoryScan = typeof inventoryScans.$inferSelect;

// Frontend-specific schemas for form validation
export const infrastructureRequirementsSchema = z.object({
  // Currency and Licensing
  currency: z.enum(['USD', 'INR', 'EUR', 'KWD']).default('USD'), // USD, Indian Rupee, Euro, Kuwaiti Dinar
  licensing: z.object({
    windows: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1000).default(0),
    }),
    sqlServer: z.object({
      enabled: z.boolean().default(false),
      edition: z.enum(['express', 'standard', 'enterprise']).default('standard'),
      licenses: z.number().min(0).max(1000).default(0),
    }),
    oracle: z.object({
      enabled: z.boolean().default(false),
      edition: z.enum(['standard', 'enterprise']).default('standard'),
      licenses: z.number().min(0).max(1000).default(0),
    }),
    vmware: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1000).default(0),
    }),
    redhat: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1000).default(0),
    }),
    sap: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1000).default(0),
    }),
    microsoftOffice365: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(10000).default(0),
    }),
  }),
  // Compute Services
  compute: z.object({
    vcpus: z.number().min(1).max(128),
    ram: z.number().min(1).max(1024),
    instanceType: z.enum(['general-purpose', 'compute-optimized', 'memory-optimized', 'storage-optimized']),
    region: z.string().min(1),
    operatingSystem: z.enum(['linux', 'windows']).default('linux'),
    bootVolume: z.object({
      size: z.number().min(8).max(1024).default(30), // GB, minimum 8GB for OS
      type: z.enum(['ssd-gp3', 'ssd-gp2', 'ssd-io2', 'hdd-standard']).default('ssd-gp3'),
      iops: z.number().min(100).max(16000).default(3000), // only applicable for io2
    }),
    serverless: z.object({
      functions: z.number().min(0).max(1000000).default(0),
      executionTime: z.number().min(0).max(15).default(1), // minutes
    }).optional(),
  }),
  
  // Storage Services
  storage: z.object({
    objectStorage: z.object({
      size: z.number().min(0).max(100000).default(0), // GB
      tier: z.enum(['standard', 'infrequent-access', 'glacier', 'deep-archive']).default('standard'),
      requests: z.number().min(0).max(10000000).default(10000), // per month
    }),
    blockStorage: z.object({
      size: z.number().min(0).max(100000).default(0), // GB
      type: z.enum(['ssd-gp3', 'ssd-io2', 'hdd-st1']).default('ssd-gp3'),
      iops: z.number().min(100).max(100000).default(3000),
    }),
    fileStorage: z.object({
      size: z.number().min(0).max(100000).default(0), // GB
      performanceMode: z.enum(['general-purpose', 'max-io']).default('general-purpose'),
    }),
  }),
  
  // Database Services
  database: z.object({
    relational: z.object({
      engine: z.enum(['mysql', 'postgresql', 'oracle', 'sql-server', 'mariadb']).default('mysql'),
      instanceClass: z.enum(['micro', 'small', 'medium', 'large', 'xlarge']).default('small'),
      storage: z.number().min(0).max(10000).default(0), // GB
      multiAZ: z.boolean().default(false),
    }),
    nosql: z.object({
      engine: z.enum(['dynamodb', 'mongodb', 'cassandra', 'none']).default('none'),
      readCapacity: z.number().min(0).max(40000).default(0),
      writeCapacity: z.number().min(0).max(40000).default(0),
      storage: z.number().min(0).max(10000).default(0), // GB
    }),
    cache: z.object({
      engine: z.enum(['redis', 'memcached', 'none']).default('none'),
      instanceClass: z.enum(['micro', 'small', 'medium', 'large']).default('small'),
      nodes: z.number().min(0).max(100).default(0),
    }),
    dataWarehouse: z.object({
      nodes: z.number().min(0).max(100).default(0),
      nodeType: z.enum(['small', 'medium', 'large', 'xlarge']).default('small'),
      storage: z.number().min(0).max(100000).default(0), // GB
    }),
  }),
  
  // Networking & CDN
  networking: z.object({
    bandwidth: z.number().min(1).max(100000),
    loadBalancer: z.enum(['none', 'application', 'network']),
    cdn: z.object({
      enabled: z.boolean().default(false),
      requests: z.number().min(0).max(10000000).default(0), // per month
      dataTransfer: z.number().min(0).max(100000).default(0), // GB
    }),
    dns: z.object({
      hostedZones: z.number().min(0).max(100).default(0),
      queries: z.number().min(0).max(100000000).default(0), // per month
    }),
    vpn: z.object({
      connections: z.number().min(0).max(100).default(0),
      hours: z.number().min(0).max(8760).default(0), // per month
    }),
  }),
  
  // Analytics & Big Data
  analytics: z.object({
    dataProcessing: z.object({
      hours: z.number().min(0).max(10000).default(0), // cluster hours per month
      nodeType: z.enum(['small', 'medium', 'large', 'xlarge']).default('small'),
    }),
    streaming: z.object({
      shards: z.number().min(0).max(1000).default(0),
      records: z.number().min(0).max(1000000000).default(0), // per month
    }),
    businessIntelligence: z.object({
      users: z.number().min(0).max(10000).default(0),
      queries: z.number().min(0).max(1000000).default(0), // per month
    }),
  }),
  
  // Machine Learning & AI
  ai: z.object({
    training: z.object({
      hours: z.number().min(0).max(10000).default(0), // compute hours per month
      instanceType: z.enum(['cpu', 'gpu-small', 'gpu-large']).default('cpu'),
    }),
    inference: z.object({
      requests: z.number().min(0).max(10000000).default(0), // per month
      instanceType: z.enum(['cpu', 'gpu-small', 'gpu-large']).default('cpu'),
    }),
    prebuilt: z.object({
      imageAnalysis: z.number().min(0).max(1000000).default(0), // images per month
      textProcessing: z.number().min(0).max(10000000).default(0), // characters per month
      speechServices: z.number().min(0).max(1000000).default(0), // requests per month
    }),
  }),
  
  // Security & Identity
  security: z.object({
    webFirewall: z.object({
      enabled: z.boolean().default(false),
      requests: z.number().min(0).max(1000000000).default(0), // per month
    }),
    identityManagement: z.object({
      users: z.number().min(0).max(1000000).default(0),
      authentications: z.number().min(0).max(10000000).default(0), // per month
    }),
    keyManagement: z.object({
      keys: z.number().min(0).max(100000).default(0),
      operations: z.number().min(0).max(10000000).default(0), // per month
    }),
    threatDetection: z.object({
      enabled: z.boolean().default(false),
      events: z.number().min(0).max(10000000).default(0), // per month
    }),
  }),
  
  // Management & Monitoring
  monitoring: z.object({
    metrics: z.number().min(0).max(1000000).default(0), // custom metrics
    logs: z.number().min(0).max(1000).default(0), // GB ingested per month
    traces: z.number().min(0).max(10000000).default(0), // traces per month
    alerts: z.number().min(0).max(10000).default(0), // alert notifications per month
  }),
  
  // Developer Tools & DevOps
  devops: z.object({
    cicd: z.object({
      buildMinutes: z.number().min(0).max(100000).default(0), // per month
      parallelJobs: z.number().min(0).max(100).default(0),
    }),
    containerRegistry: z.object({
      storage: z.number().min(0).max(10000).default(0), // GB
      pulls: z.number().min(0).max(1000000).default(0), // per month
    }),
    apiManagement: z.object({
      requests: z.number().min(0).max(1000000000).default(0), // per month
      endpoints: z.number().min(0).max(10000).default(0),
    }),
  }),
  
  // Migration & Backup
  backup: z.object({
    storage: z.number().min(0).max(100000).default(0), // GB
    frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    retention: z.number().min(7).max(2555).default(30), // days
  }),
  
  // IoT & Edge Computing
  iot: z.object({
    devices: z.number().min(0).max(1000000).default(0),
    messages: z.number().min(0).max(1000000000).default(0), // per month
    dataProcessing: z.number().min(0).max(100000).default(0), // GB per month
    edgeLocations: z.number().min(0).max(1000).default(0),
  }),
  
  // Content & Media
  media: z.object({
    videoStreaming: z.object({
      hours: z.number().min(0).max(100000).default(0), // streaming hours per month
      quality: z.enum(['720p', '1080p', '4k']).default('1080p'),
    }),
    transcoding: z.object({
      minutes: z.number().min(0).max(100000).default(0), // per month
      inputFormat: z.enum(['standard', 'hd', '4k']).default('standard'),
    }),
  }),
  
  // Quantum Computing Services
  quantum: z.object({
    processingUnits: z.number().min(0).max(1000).default(0), // QPU hours per month
    quantumAlgorithms: z.enum(['optimization', 'simulation', 'cryptography', 'ml']).default('optimization'),
    circuitComplexity: z.enum(['basic', 'intermediate', 'advanced']).default('basic'),
  }),
  
  // Advanced AI/ML Platform Services
  advancedAI: z.object({
    vectorDatabase: z.object({
      dimensions: z.number().min(0).max(10000000).default(0), // vector dimensions stored
      queries: z.number().min(0).max(100000000).default(0), // queries per month
    }),
    customChips: z.object({
      tpuHours: z.number().min(0).max(100000).default(0), // TPU hours per month
      inferenceChips: z.number().min(0).max(100000).default(0), // specialized chip hours
    }),
    modelHosting: z.object({
      models: z.number().min(0).max(1000).default(0), // number of models hosted
      requests: z.number().min(0).max(1000000000).default(0), // inference requests per month
    }),
    ragPipelines: z.object({
      documents: z.number().min(0).max(10000000).default(0), // documents processed
      embeddings: z.number().min(0).max(100000000).default(0), // embeddings generated per month
    }),
  }),
  
  // Edge Computing & 5G Services
  edge: z.object({
    edgeLocations: z.number().min(0).max(10000).default(0), // number of edge locations
    edgeCompute: z.number().min(0).max(100000).default(0), // edge compute hours per month
    fiveGNetworking: z.object({
      networkSlices: z.number().min(0).max(1000).default(0), // 5G network slices
      privateNetworks: z.number().min(0).max(100).default(0), // private 5G networks
    }),
    realTimeProcessing: z.number().min(0).max(1000000).default(0), // real-time events per month
  }),
  
  // Confidential Computing
  confidential: z.object({
    secureEnclaves: z.number().min(0).max(10000).default(0), // secure enclave hours per month
    trustedExecution: z.number().min(0).max(100000).default(0), // trusted execution hours
    privacyPreservingAnalytics: z.number().min(0).max(1000000).default(0), // operations per month
    zeroTrustProcessing: z.number().min(0).max(100000).default(0), // GB processed per month
  }),
  
  // Sustainability & Green Computing
  sustainability: z.object({
    carbonFootprintTracking: z.boolean().default(false),
    renewableEnergyPreference: z.boolean().default(false),
    greenCloudOptimization: z.boolean().default(false),
    carbonOffsetCredits: z.number().min(0).max(100000).default(0), // tons CO2 offset
  }),
  
  // Advanced Scenarios
  scenarios: z.object({
    disasterRecovery: z.object({
      enabled: z.boolean().default(false),
      rtoHours: z.number().min(1).max(168).default(24), // Recovery Time Objective
      rpoMinutes: z.number().min(15).max(1440).default(240), // Recovery Point Objective
      backupRegions: z.number().min(1).max(10).default(1),
    }),
    compliance: z.object({
      frameworks: z.array(z.enum(['gdpr', 'hipaa', 'sox', 'pci', 'iso27001'])).default([]),
      auditLogging: z.boolean().default(false),
      dataResidency: z.enum(['us', 'eu', 'asia', 'global']).default('global'),
    }),
    migration: z.object({
      sourceProvider: z.enum(['aws', 'azure', 'gcp', 'oracle', 'on-premise']).optional(),
      dataToMigrate: z.number().min(0).max(1000000).default(0), // TB
      applicationComplexity: z.enum(['simple', 'moderate', 'complex']).default('moderate'),
    }),
  }),
  
  // Cost Optimization Preferences
  optimization: z.object({
    reservedInstanceStrategy: z.enum(['none', 'conservative', 'moderate', 'aggressive']).default('moderate'),
    spotInstanceTolerance: z.number().min(0).max(100).default(10), // percentage of workload suitable for spot
    autoScalingAggression: z.enum(['minimal', 'moderate', 'aggressive']).default('moderate'),
    costAlerts: z.object({
      enabled: z.boolean().default(true),
      thresholdPercent: z.number().min(5).max(100).default(20), // alert when cost exceeds budget by %
      notificationPreference: z.enum(['email', 'slack', 'webhook']).default('email'),
    }),
  }),
});

export type InfrastructureRequirements = z.infer<typeof infrastructureRequirementsSchema>;

export interface CloudProvider {
  name: string;
  compute: number;
  storage: number;
  database: number;
  networking: number;
  licensing?: number;
  analytics?: number;
  ai?: number;
  security?: number;
  monitoring?: number;
  devops?: number;
  backup?: number;
  iot?: number;
  media?: number;
  quantum?: number;
  advancedAI?: number;
  edge?: number;
  confidential?: number;
  sustainability?: number;
  scenarios?: number;
  total: number;
  carbonFootprint?: number; // CO2 tons per month
  renewableEnergyPercent?: number; // percentage renewable energy
  currency?: string; // Selected currency (USD, INR, EUR, KWD)
  currencySymbol?: string; // Currency symbol ($, ₹, €, د.ك)
}

export interface CostCalculationResult {
  providers: CloudProvider[];
  cheapest: CloudProvider;
  mostExpensive: CloudProvider;
  potentialSavings: number;
  multiCloudOption: {
    cost: number;
    breakdown: Record<string, string>;
  };
  recommendations: {
    singleCloud: string;
    multiCloud: string;
  };
}
