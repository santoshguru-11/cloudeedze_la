import { InfrastructureRequirements, CloudProvider, CostCalculationResult } from "@shared/schema";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ComprehensiveCostCalculator {
  private pricing: any;

  constructor() {
    try {
      this.pricing = JSON.parse(readFileSync(join(__dirname, "../data/comprehensive-pricing.json"), "utf8"));
    } catch (error) {
      console.error("Error loading pricing data:", error);
      this.pricing = {};
    }
  }

  calculateCosts(requirements: InfrastructureRequirements): CostCalculationResult {
    const providers = ['aws', 'azure', 'gcp', 'oracle'] as const;
    const results: CloudProvider[] = [];

    // Calculate region multiplier
    const regionMultiplier = this.pricing.regions[requirements.compute.region as keyof typeof this.pricing.regions]?.multiplier || 1.0;
    
    // Calculate licensing costs (provider-independent)
    const licensingCosts = this.calculateLicensing(requirements);

    for (const provider of providers) {
      const costs = {
        compute: this.calculateCompute(provider, requirements, regionMultiplier),
        storage: this.calculateStorage(provider, requirements),
        database: this.calculateDatabase(provider, requirements, regionMultiplier),
        networking: this.calculateNetworking(provider, requirements),
        analytics: this.calculateAnalytics(provider, requirements, regionMultiplier),
        ai: this.calculateAI(provider, requirements, regionMultiplier),
        security: this.calculateSecurity(provider, requirements, regionMultiplier),
        monitoring: this.calculateMonitoring(provider, requirements, regionMultiplier),
        devops: this.calculateDevOps(provider, requirements, regionMultiplier),
        backup: this.calculateBackup(provider, requirements),
        iot: this.calculateIoT(provider, requirements, regionMultiplier),
        media: this.calculateMedia(provider, requirements, regionMultiplier),
        quantum: this.calculateQuantum(provider, requirements, regionMultiplier),
        advancedAI: this.calculateAdvancedAI(provider, requirements, regionMultiplier),
        edge: this.calculateEdge(provider, requirements, regionMultiplier),
        confidential: this.calculateConfidential(provider, requirements, regionMultiplier),
        sustainability: this.calculateSustainability(provider, requirements),
        scenarios: this.calculateScenarios(provider, requirements, regionMultiplier),
        licensing: licensingCosts,
      };

      // Apply optimization adjustments
      const optimizationMultiplier = this.calculateOptimizationMultiplier(provider, requirements);
      const sustainabilityMultiplier = this.getSustainabilityMultiplier(provider, requirements);
      
      const baseCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
      const total = baseCost * optimizationMultiplier * sustainabilityMultiplier;
      
      // Calculate carbon footprint and renewable energy
      const carbonFootprint = this.calculateCarbonFootprint(provider, total);
      const renewablePercent = this.getRenewableEnergyPercent(provider);

      // Apply currency conversion
      const currencyRate = this.pricing.currencies[requirements.currency || 'USD']?.rate || 1.0;
      const convertedTotal = total * currencyRate;
      const convertedLicensing = costs.licensing * currencyRate;

      results.push({
        name: provider.toUpperCase(),
        compute: Math.round(costs.compute * currencyRate * 100) / 100,
        storage: Math.round(costs.storage * currencyRate * 100) / 100,
        database: Math.round(costs.database * currencyRate * 100) / 100,
        networking: Math.round(costs.networking * currencyRate * 100) / 100,
        licensing: Math.round(convertedLicensing * 100) / 100,
        total: Math.round((total + costs.licensing) * currencyRate * 100) / 100,
        // Add extended cost breakdown
        analytics: Math.round(costs.analytics * currencyRate * 100) / 100,
        ai: Math.round(costs.ai * currencyRate * 100) / 100,
        security: Math.round(costs.security * currencyRate * 100) / 100,
        monitoring: Math.round(costs.monitoring * currencyRate * 100) / 100,
        devops: Math.round(costs.devops * currencyRate * 100) / 100,
        backup: Math.round(costs.backup * currencyRate * 100) / 100,
        iot: Math.round(costs.iot * currencyRate * 100) / 100,
        media: Math.round(costs.media * currencyRate * 100) / 100,
        // Add new advanced services
        quantum: Math.round(costs.quantum * currencyRate * 100) / 100,
        advancedAI: Math.round(costs.advancedAI * currencyRate * 100) / 100,
        edge: Math.round(costs.edge * currencyRate * 100) / 100,
        confidential: Math.round(costs.confidential * currencyRate * 100) / 100,
        sustainability: Math.round(costs.sustainability * currencyRate * 100) / 100,
        scenarios: Math.round(costs.scenarios * currencyRate * 100) / 100,
        // Add sustainability metrics
        carbonFootprint: Math.round(carbonFootprint * 1000) / 1000,
        renewableEnergyPercent: renewablePercent,
        currency: requirements.currency || 'USD',
        currencySymbol: this.pricing.currencies[requirements.currency || 'USD']?.symbol || '$',
      } as CloudProvider & Record<string, number | string>);
    }

    // Sort by total cost
    results.sort((a, b) => a.total - b.total);
    
    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];
    const potentialSavings = Math.round((mostExpensive.total - cheapest.total) * 100) / 100;

    // Calculate multi-cloud optimization
    const multiCloudOption = this.calculateMultiCloudOptimization(results);

    return {
      providers: results,
      cheapest,
      mostExpensive,
      potentialSavings,
      multiCloudOption,
      recommendations: {
        singleCloud: `${cheapest.name} offers the best overall value at ${cheapest.currencySymbol}${cheapest.total}/month with comprehensive service coverage and competitive pricing across all categories`,
        multiCloud: `Hybrid approach could save an additional ${cheapest.currencySymbol}${Math.round((cheapest.total - multiCloudOption.cost) * 100) / 100}/month by optimizing service placement across providers`
      }
    };
  }

  private calculateCompute(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.compute[provider as keyof typeof this.pricing.compute];
    const instancePricing = pricing[req.compute.instanceType];
    
    // Base compute cost
    const vcpuCost = req.compute.vcpus * instancePricing.vcpu * 24 * 30;
    const ramCost = req.compute.ram * instancePricing.ram * 24 * 30;
    let baseCost = vcpuCost + ramCost;

    // Windows multiplier
    if (req.compute.operatingSystem === 'windows') {
      baseCost *= pricing.windows_multiplier;
    }

    // Boot volume cost
    let bootVolumeCost = 0;
    if (req.compute.bootVolume) {
      const storagePricing = this.pricing.storage[provider as keyof typeof this.pricing.storage];
      let volumePrice = 0;
      
      // Map boot volume types to storage pricing keys
      const storageTypeMap: Record<string, string> = {
        'ssd-gp3': 'ssd-gp3',
        'ssd-gp2': 'ssd-gp3', // Map gp2 to gp3 pricing
        'ssd-io2': 'ssd-io2',
        'hdd-standard': 'hdd-st1'
      };
      
      const storageType = storageTypeMap[req.compute.bootVolume.type] || 'ssd-gp3';
      volumePrice = storagePricing.block[storageType as keyof typeof storagePricing.block] || 0.08;
      
      bootVolumeCost = req.compute.bootVolume.size * volumePrice;
      
      // Add IOPS cost for io2 volumes
      if (req.compute.bootVolume.type === 'ssd-io2' && req.compute.bootVolume.iops > 3000) {
        const extraIops = req.compute.bootVolume.iops - 3000;
        const iopsCost = storagePricing.block.iops || 0.005;
        bootVolumeCost += extraIops * iopsCost;
      }
    }

    // Serverless functions
    let serverlessCost = 0;
    if (req.compute.serverless) {
      const pricingAny = pricing as any;
      const requestCost = req.compute.serverless.functions * (pricingAny.lambda_per_request || pricingAny.functions_per_request || pricingAny.cloud_functions_per_request || 0.0000002);
      const executionCost = req.compute.serverless.functions * req.compute.serverless.executionTime * (pricingAny.lambda_per_gb_second || pricingAny.functions_per_gb_second || 0.0000166667);
      serverlessCost = requestCost + executionCost;
    }

    return (baseCost + bootVolumeCost + serverlessCost) * regionMultiplier;
  }

  private calculateStorage(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.storage[provider as keyof typeof this.pricing.storage];
    let totalCost = 0;

    // Object Storage
    if (req.storage.objectStorage.size > 0) {
      const storageCost = req.storage.objectStorage.size * pricing.object[req.storage.objectStorage.tier];
      const requestCost = (req.storage.objectStorage.requests / 1000) * pricing.object.requests_per_1k.get;
      totalCost += storageCost + requestCost;
    }

    // Block Storage
    if (req.storage.blockStorage.size > 0) {
      const storageCost = req.storage.blockStorage.size * pricing.block[req.storage.blockStorage.type];
      const iopsCost = req.storage.blockStorage.iops * pricing.block.iops;
      totalCost += storageCost + iopsCost;
    }

    // File Storage
    if (req.storage.fileStorage.size > 0) {
      totalCost += req.storage.fileStorage.size * pricing.file[req.storage.fileStorage.performanceMode];
    }

    return totalCost;
  }

  private calculateDatabase(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.database[provider as keyof typeof this.pricing.database];
    let totalCost = 0;

    // Relational Database
    if (req.database.relational.storage > 0) {
      let instanceCost = pricing.relational[req.database.relational.engine][req.database.relational.instanceClass];
      if (req.database.relational.multiAZ) {
        instanceCost *= pricing.relational.multi_az_multiplier;
      }
      const storageCost = req.database.relational.storage * pricing.relational.storage_per_gb;
      totalCost += instanceCost + storageCost;
    }

    // NoSQL Database
    if (req.database.nosql.engine !== 'none') {
      if (req.database.nosql.engine === 'dynamodb') {
        const readCost = req.database.nosql.readCapacity * pricing.nosql.dynamodb.read_capacity_unit;
        const writeCost = req.database.nosql.writeCapacity * pricing.nosql.dynamodb.write_capacity_unit;
        const storageCost = req.database.nosql.storage * pricing.nosql.dynamodb.storage_per_gb;
        totalCost += readCost + writeCost + storageCost;
      } else {
        totalCost += pricing.nosql[req.database.nosql.engine]?.small || 0;
      }
    }

    // Cache
    if (req.database.cache.engine !== 'none' && req.database.cache.nodes > 0) {
      const cacheCost = pricing.cache[req.database.cache.engine][req.database.cache.instanceClass] * req.database.cache.nodes;
      totalCost += cacheCost;
    }

    // Data Warehouse
    if (req.database.dataWarehouse.nodes > 0) {
      const warehouseCost = pricing.warehouse[req.database.dataWarehouse.nodeType] * req.database.dataWarehouse.nodes;
      const storageCost = req.database.dataWarehouse.storage * pricing.warehouse.storage_per_gb;
      totalCost += warehouseCost + storageCost;
    }

    return totalCost * regionMultiplier;
  }

  private calculateNetworking(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.networking[provider as keyof typeof this.pricing.networking];
    let totalCost = 0;

    // Basic bandwidth
    const bandwidthCost = req.networking.bandwidth * pricing.bandwidth;
    const loadBalancerCost = pricing.load_balancer[req.networking.loadBalancer];
    totalCost += bandwidthCost + loadBalancerCost;

    // CDN
    if (req.networking.cdn.enabled && req.networking.cdn.requests > 0) {
      const cdnRequestCost = (req.networking.cdn.requests / 10000) * pricing.cdn.requests_per_10k;
      const cdnDataCost = req.networking.cdn.dataTransfer * pricing.cdn.data_transfer_per_gb;
      totalCost += cdnRequestCost + cdnDataCost;
    }

    // DNS
    if (req.networking.dns.hostedZones > 0) {
      const zoneCost = req.networking.dns.hostedZones * pricing.dns.hosted_zone;
      const queryCost = (req.networking.dns.queries / 1000000) * pricing.dns.queries_per_million;
      totalCost += zoneCost + queryCost;
    }

    // VPN
    if (req.networking.vpn.connections > 0) {
      const vpnCost = req.networking.vpn.connections * req.networking.vpn.hours * pricing.vpn.connection_hour;
      totalCost += vpnCost;
    }

    return totalCost;
  }

  private calculateAnalytics(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.analytics[provider as keyof typeof this.pricing.analytics];
    let totalCost = 0;

    // Data Processing
    if (req.analytics.dataProcessing.hours > 0) {
      totalCost += req.analytics.dataProcessing.hours * pricing.data_processing[req.analytics.dataProcessing.nodeType];
    }

    // Streaming
    if (req.analytics.streaming.shards > 0) {
      const shardCost = req.analytics.streaming.shards * 24 * 30 * pricing.streaming.shard_hour; // Monthly cost
      const recordCost = (req.analytics.streaming.records / 1000000) * pricing.streaming.record_per_million;
      totalCost += shardCost + recordCost;
    }

    // Business Intelligence
    if (req.analytics.businessIntelligence.users > 0) {
      const userCost = req.analytics.businessIntelligence.users * pricing.business_intelligence.user_per_month;
      const queryCost = (req.analytics.businessIntelligence.queries / 1000) * pricing.business_intelligence.query_per_1k;
      totalCost += userCost + queryCost;
    }

    return totalCost * regionMultiplier;
  }

  private calculateAI(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.ai[provider as keyof typeof this.pricing.ai];
    let totalCost = 0;

    // Training
    if (req.ai.training.hours > 0) {
      totalCost += req.ai.training.hours * pricing.training[req.ai.training.instanceType];
    }

    // Inference
    if (req.ai.inference.requests > 0) {
      const requestsPerHour = req.ai.inference.requests / 30 / 24; // Convert monthly to hourly
      totalCost += requestsPerHour * 30 * 24 * pricing.inference[req.ai.inference.instanceType];
    }

    // Prebuilt Services
    if (req.ai.prebuilt.imageAnalysis > 0) {
      totalCost += (req.ai.prebuilt.imageAnalysis / 1000) * pricing.prebuilt.image_analysis_per_1k;
    }
    if (req.ai.prebuilt.textProcessing > 0) {
      totalCost += (req.ai.prebuilt.textProcessing / 1000000) * pricing.prebuilt.text_processing_per_million_chars;
    }
    if (req.ai.prebuilt.speechServices > 0) {
      totalCost += (req.ai.prebuilt.speechServices / 1000) * pricing.prebuilt.speech_per_1k_requests;
    }

    return totalCost * regionMultiplier;
  }

  private calculateSecurity(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.security[provider as keyof typeof this.pricing.security];
    let totalCost = 0;

    // Web Firewall
    if (req.security.webFirewall.enabled && req.security.webFirewall.requests > 0) {
      totalCost += (req.security.webFirewall.requests / 1000000) * pricing.web_firewall_per_million;
    }

    // Identity Management
    if (req.security.identityManagement.users > 0) {
      const userCost = req.security.identityManagement.users * pricing.identity_per_user;
      const authCost = req.security.identityManagement.authentications * pricing.identity_per_auth;
      totalCost += userCost + authCost;
    }

    // Key Management
    if (req.security.keyManagement.keys > 0) {
      const keyCost = req.security.keyManagement.keys * pricing.key_per_key;
      const operationCost = (req.security.keyManagement.operations / 10000) * pricing.key_per_10k_operations;
      totalCost += keyCost + operationCost;
    }

    // Threat Detection
    if (req.security.threatDetection.enabled) {
      totalCost += pricing.threat_detection;
      if (req.security.threatDetection.events > 0) {
        totalCost += (req.security.threatDetection.events / 1000000) * pricing.threat_per_million_events;
      }
    }

    return totalCost * regionMultiplier;
  }

  private calculateMonitoring(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.monitoring[provider as keyof typeof this.pricing.monitoring];
    let totalCost = 0;

    if (req.monitoring.metrics > 0) {
      totalCost += req.monitoring.metrics * pricing.custom_metric;
    }
    if (req.monitoring.logs > 0) {
      totalCost += req.monitoring.logs * pricing.log_ingestion_per_gb;
    }
    if (req.monitoring.traces > 0) {
      totalCost += (req.monitoring.traces / 1000000) * pricing.traces_per_million;
    }
    if (req.monitoring.alerts > 0) {
      totalCost += req.monitoring.alerts * pricing.alert_per_notification;
    }

    return totalCost * regionMultiplier;
  }

  private calculateDevOps(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.devops[provider as keyof typeof this.pricing.devops];
    let totalCost = 0;

    // CI/CD
    if (req.devops.cicd.buildMinutes > 0) {
      totalCost += req.devops.cicd.buildMinutes * pricing.build_per_minute;
      totalCost += req.devops.cicd.parallelJobs * pricing.parallel_job;
    }

    // Container Registry
    if (req.devops.containerRegistry.storage > 0) {
      totalCost += req.devops.containerRegistry.storage * pricing.container_registry_per_gb;
      totalCost += (req.devops.containerRegistry.pulls / 1000) * pricing.container_pulls_per_1k;
    }

    // API Management
    if (req.devops.apiManagement.requests > 0) {
      totalCost += (req.devops.apiManagement.requests / 1000000) * pricing.api_requests_per_million;
      totalCost += req.devops.apiManagement.endpoints * pricing.api_endpoint;
    }

    return totalCost * regionMultiplier;
  }

  private calculateBackup(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.backup[provider as keyof typeof this.pricing.backup];
    let totalCost = 0;

    if (req.backup.storage > 0) {
      const baseCost = req.backup.storage * pricing.storage_per_gb;
      const frequencyMultiplier = pricing.frequency_multiplier[req.backup.frequency];
      totalCost += baseCost * frequencyMultiplier;
    }

    return totalCost;
  }

  private calculateIoT(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.iot[provider as keyof typeof this.pricing.iot];
    let totalCost = 0;

    if (req.iot.devices > 0) {
      totalCost += req.iot.devices * pricing.device_per_month;
    }
    if (req.iot.messages > 0) {
      totalCost += (req.iot.messages / 1000000) * pricing.message_per_million;
    }
    if (req.iot.dataProcessing > 0) {
      totalCost += req.iot.dataProcessing * pricing.data_processing_per_gb;
    }
    if (req.iot.edgeLocations > 0) {
      totalCost += req.iot.edgeLocations * pricing.edge_location;
    }

    return totalCost * regionMultiplier;
  }

  private calculateMedia(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.media[provider as keyof typeof this.pricing.media];
    let totalCost = 0;

    // Video Streaming
    if (req.media.videoStreaming.hours > 0) {
      totalCost += req.media.videoStreaming.hours * pricing.streaming_per_hour[req.media.videoStreaming.quality];
    }

    // Transcoding
    if (req.media.transcoding.minutes > 0) {
      totalCost += req.media.transcoding.minutes * pricing.transcoding_per_minute[req.media.transcoding.inputFormat];
    }

    return totalCost * regionMultiplier;
  }

  private calculateQuantum(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.quantum[provider as keyof typeof this.pricing.quantum];
    let totalCost = 0;

    if (req.quantum.processingUnits > 0) {
      const complexityMultiplier = pricing.algorithm_complexity[req.quantum.circuitComplexity];
      totalCost += req.quantum.processingUnits * pricing.qpu_hour * complexityMultiplier;
      totalCost += req.quantum.processingUnits * pricing.circuit_optimization;
    }

    return totalCost * regionMultiplier;
  }

  private calculateAdvancedAI(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.advancedAI[provider as keyof typeof this.pricing.advancedAI];
    let totalCost = 0;

    // Vector Database
    if (req.advancedAI.vectorDatabase.dimensions > 0) {
      totalCost += (req.advancedAI.vectorDatabase.dimensions / 1000000) * pricing.vector_db_per_million_dims;
    }
    if (req.advancedAI.vectorDatabase.queries > 0) {
      totalCost += (req.advancedAI.vectorDatabase.queries / 1000000) * pricing.vector_queries_per_million;
    }

    // Custom Chips
    totalCost += req.advancedAI.customChips.tpuHours * pricing.tpu_per_hour;
    totalCost += req.advancedAI.customChips.inferenceChips * pricing.inference_chips_per_hour;

    // Model Hosting
    totalCost += req.advancedAI.modelHosting.models * pricing.model_hosting_per_model;
    if (req.advancedAI.modelHosting.requests > 0) {
      totalCost += (req.advancedAI.modelHosting.requests / 1000000) * pricing.inference_per_million_requests;
    }

    // RAG Pipelines
    if (req.advancedAI.ragPipelines.documents > 0) {
      totalCost += (req.advancedAI.ragPipelines.documents / 1000) * pricing.document_processing_per_1k;
    }
    if (req.advancedAI.ragPipelines.embeddings > 0) {
      totalCost += (req.advancedAI.ragPipelines.embeddings / 1000000) * pricing.embeddings_per_million;
    }

    return totalCost * regionMultiplier;
  }

  private calculateEdge(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.edge[provider as keyof typeof this.pricing.edge];
    let totalCost = 0;

    totalCost += req.edge.edgeLocations * pricing.edge_location;
    totalCost += req.edge.edgeCompute * pricing.edge_compute_per_hour;
    totalCost += req.edge.fiveGNetworking.networkSlices * pricing["5g_network_slice"];
    totalCost += req.edge.fiveGNetworking.privateNetworks * pricing.private_5g_network;
    
    if (req.edge.realTimeProcessing > 0) {
      totalCost += (req.edge.realTimeProcessing / 1000000) * pricing.realtime_events_per_million;
    }

    return totalCost * regionMultiplier;
  }

  private calculateConfidential(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.confidential[provider as keyof typeof this.pricing.confidential];
    let totalCost = 0;

    totalCost += req.confidential.secureEnclaves * pricing.secure_enclave_per_hour;
    totalCost += req.confidential.trustedExecution * pricing.trusted_execution_per_hour;
    
    if (req.confidential.privacyPreservingAnalytics > 0) {
      totalCost += (req.confidential.privacyPreservingAnalytics / 1000000) * pricing.privacy_operations_per_million;
    }
    
    totalCost += req.confidential.zeroTrustProcessing * pricing.zero_trust_per_gb;

    return totalCost * regionMultiplier;
  }

  private calculateSustainability(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.sustainability[provider as keyof typeof this.pricing.sustainability];
    let totalCost = 0;

    if (req.sustainability.carbonFootprintTracking) {
      totalCost += pricing.carbon_tracking;
    }

    if (req.sustainability.greenCloudOptimization) {
      // This is a multiplier applied later, not a direct cost
    }

    totalCost += req.sustainability.carbonOffsetCredits * pricing.carbon_offset_per_ton;

    return totalCost;
  }

  private calculateScenarios(provider: string, req: InfrastructureRequirements, regionMultiplier: number): number {
    const pricing = this.pricing.scenarios[provider as keyof typeof this.pricing.scenarios];
    let totalCost = 0;

    // Disaster Recovery
    if (req.scenarios.disasterRecovery.enabled) {
      totalCost += pricing.disaster_recovery_base;
      
      const rtoMultiplier = pricing.dr_rto_multiplier[req.scenarios.disasterRecovery.rtoHours.toString() as keyof typeof pricing.dr_rto_multiplier] || 1.0;
      const rpoMultiplier = pricing.dr_rpo_multiplier[req.scenarios.disasterRecovery.rpoMinutes.toString() as keyof typeof pricing.dr_rpo_multiplier] || 1.0;
      
      totalCost *= rtoMultiplier * rpoMultiplier;
      totalCost += (req.scenarios.disasterRecovery.backupRegions - 1) * pricing.disaster_recovery_base * 0.5;
    }

    // Compliance
    if (req.scenarios.compliance.frameworks.length > 0) {
      req.scenarios.compliance.frameworks.forEach(framework => {
        const premium = pricing.compliance_premiums[framework];
        if (premium) {
          totalCost += 1000 * premium; // Base monthly compliance cost
        }
      });
    }

    if (req.scenarios.compliance.auditLogging) {
      totalCost += 100 * pricing.audit_logging_per_gb; // Assume 100GB logs per month
    }

    // Data residency premium
    const residencyMultiplier = pricing.data_residency_premium[req.scenarios.compliance.dataResidency];
    totalCost *= residencyMultiplier;

    // Migration
    if (req.scenarios.migration.dataToMigrate > 0) {
      totalCost += pricing.migration_base_cost;
      totalCost += req.scenarios.migration.dataToMigrate * pricing.migration_per_tb;
      
      const complexityMultiplier = pricing.complexity_multiplier[req.scenarios.migration.applicationComplexity];
      totalCost *= complexityMultiplier;
    }

    return totalCost * regionMultiplier;
  }

  private calculateOptimizationMultiplier(provider: string, req: InfrastructureRequirements): number {
    let multiplier = 1.0;

    // Reserved instance savings
    const reservedSavings = {
      none: 1.0,
      conservative: 0.95, // 5% savings
      moderate: 0.88, // 12% savings
      aggressive: 0.78 // 22% savings
    };
    multiplier *= reservedSavings[req.optimization.reservedInstanceStrategy];

    // Spot instance savings
    const spotSavings = req.optimization.spotInstanceTolerance / 100 * 0.7; // Up to 70% savings on spot portion
    multiplier *= (1 - spotSavings);

    // Auto-scaling optimization
    const scalingSavings = {
      minimal: 0.98, // 2% savings
      moderate: 0.92, // 8% savings
      aggressive: 0.85 // 15% savings
    };
    multiplier *= scalingSavings[req.optimization.autoScalingAggression];

    return multiplier;
  }

  private getSustainabilityMultiplier(provider: string, req: InfrastructureRequirements): number {
    const pricing = this.pricing.sustainability[provider as keyof typeof this.pricing.sustainability];
    let multiplier = 1.0;

    if (req.sustainability.renewableEnergyPreference) {
      multiplier *= pricing.renewable_energy_premium;
    }

    if (req.sustainability.greenCloudOptimization) {
      multiplier *= pricing.green_optimization;
    }

    return multiplier;
  }

  private calculateCarbonFootprint(provider: string, totalCost: number): number {
    const pricing = this.pricing.sustainability[provider as keyof typeof this.pricing.sustainability];
    
    // Estimate power usage based on cost (approximate formula)
    const estimatedKwh = totalCost * 100; // Rough estimate: $1 = 100 kWh
    
    return estimatedKwh * pricing.co2_per_kwh;
  }

  private getRenewableEnergyPercent(provider: string): number {
    const pricing = this.pricing.sustainability[provider as keyof typeof this.pricing.sustainability];
    return pricing.renewable_percent;
  }

  private calculateLicensing(requirements: InfrastructureRequirements): number {
    let totalLicensingCost = 0;
    const licensing = this.pricing.licensing;
    const vcpus = requirements.compute.vcpus;

    // Windows Server Licensing
    if (requirements.licensing?.windows?.enabled) {
      const licenses = requirements.licensing.windows.licenses;
      const pricePerCore = licensing.windows.server_standard;
      totalLicensingCost += licenses * pricePerCore * vcpus; // Per core licensing
    }

    // SQL Server Licensing
    if (requirements.licensing?.sqlServer?.enabled) {
      const licenses = requirements.licensing.sqlServer.licenses;
      const edition = requirements.licensing.sqlServer.edition;
      const pricePerCore = licensing.sqlServer[edition as keyof typeof licensing.sqlServer] as number;
      totalLicensingCost += licenses * pricePerCore * vcpus; // Per core licensing
    }

    // Oracle Database Licensing
    if (requirements.licensing?.oracle?.enabled) {
      const licenses = requirements.licensing.oracle.licenses;
      const edition = requirements.licensing.oracle.edition;
      const pricePerCore = licensing.oracle[edition as keyof typeof licensing.oracle] as number;
      totalLicensingCost += (licenses * pricePerCore * vcpus) / 12; // Annual to monthly
    }

    // VMware Licensing
    if (requirements.licensing?.vmware?.enabled) {
      const licenses = requirements.licensing.vmware.licenses;
      const pricePerCpu = licensing.vmware.vsphere_standard;
      const cpuSockets = Math.ceil(vcpus / 8); // Assume 8 cores per socket
      totalLicensingCost += (licenses * pricePerCpu * cpuSockets) / 12; // Annual to monthly
    }

    // Red Hat Enterprise Linux
    if (requirements.licensing?.redhat?.enabled) {
      const licenses = requirements.licensing.redhat.licenses;
      const pricePerSocket = licensing.redhat.enterprise_linux;
      const cpuSockets = Math.ceil(vcpus / 8);
      totalLicensingCost += (licenses * pricePerSocket * cpuSockets) / 12; // Annual to monthly
    }

    // SAP Licensing
    if (requirements.licensing?.sap?.enabled) {
      const licenses = requirements.licensing.sap.licenses;
      const pricePerLicense = licensing.sap.hana_enterprise;
      totalLicensingCost += (licenses * pricePerLicense) / 12; // Annual to monthly
    }

    // Microsoft Office 365
    if (requirements.licensing?.microsoftOffice365?.enabled) {
      const licenses = requirements.licensing.microsoftOffice365.licenses;
      const pricePerUser = licensing.microsoftOffice365.business_premium;
      totalLicensingCost += licenses * pricePerUser; // Monthly pricing
    }

    return totalLicensingCost;
  }

  private calculateMultiCloudOptimization(providers: CloudProvider[]): { cost: number; breakdown: Record<string, string> } {
    // Find cheapest option for each service category including new services
    const categories = ['compute', 'storage', 'database', 'networking', 'analytics', 'ai', 'security', 'monitoring', 'devops', 'backup', 'iot', 'media', 'quantum', 'advancedAI', 'edge', 'confidential', 'licensing'];
    const breakdown: Record<string, string> = {};
    let totalCost = 0;

    categories.forEach(category => {
      if (category === 'licensing') {
        // Licensing is provider-independent, so use the first provider's value
        breakdown[category] = 'All Providers';
        totalCost += (providers[0][category as keyof CloudProvider] as number) || 0;
      } else {
        const cheapest = providers.reduce((min, p) => 
          (p[category as keyof CloudProvider] || 0) < (min[category as keyof CloudProvider] || 0) ? p : min
        );
        breakdown[category] = cheapest.name;
        totalCost += (cheapest[category as keyof CloudProvider] as number) || 0;
      }
    });

    return {
      cost: Math.round(totalCost * 100) / 100,
      breakdown
    };
  }
}