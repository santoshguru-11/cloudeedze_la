import { UnifiedInventory, UnifiedResource } from "@shared/schema";

export interface TerraformState {
  version: number;
  terraform_version: string;
  serial: number;
  lineage: string;
  outputs?: Record<string, any>;
  resources: TerraformResource[];
  check_results?: any[];
}

export interface TerraformResource {
  mode: string;
  type: string;
  name: string;
  provider: string;
  instances: TerraformInstance[];
}

export interface TerraformInstance {
  schema_version: number;
  attributes: Record<string, any>;
  sensitive_attributes?: string[];
  private?: string;
  dependencies?: string[];
}

export class TerraformStateParser {
  private resourceTypeMap: Record<string, ResourceTypeInfo> = {
    // AWS Resources
    'aws_instance': { type: 'Instance', service: 'Compute', provider: 'aws' },
    'aws_ec2_instance': { type: 'Instance', service: 'Compute', provider: 'aws' },
    'aws_autoscaling_group': { type: 'AutoScalingGroup', service: 'Compute', provider: 'aws' },
    'aws_launch_template': { type: 'LaunchTemplate', service: 'Compute', provider: 'aws' },
    'aws_launch_configuration': { type: 'LaunchConfiguration', service: 'Compute', provider: 'aws' },
    'aws_spot_instance_request': { type: 'SpotInstance', service: 'Compute', provider: 'aws' },
    'aws_spot_fleet_request': { type: 'SpotFleet', service: 'Compute', provider: 'aws' },
    
    'aws_s3_bucket': { type: 'Bucket', service: 'Storage', provider: 'aws' },
    'aws_s3_bucket_object': { type: 'Object', service: 'Storage', provider: 'aws' },
    'aws_s3_bucket_policy': { type: 'BucketPolicy', service: 'Storage', provider: 'aws' },
    'aws_ebs_volume': { type: 'Volume', service: 'Storage', provider: 'aws' },
    'aws_ebs_snapshot': { type: 'Snapshot', service: 'Storage', provider: 'aws' },
    'aws_efs_file_system': { type: 'FileSystem', service: 'Storage', provider: 'aws' },
    'aws_fsx_lustre_file_system': { type: 'LustreFileSystem', service: 'Storage', provider: 'aws' },
    
    'aws_rds_instance': { type: 'Database', service: 'Database', provider: 'aws' },
    'aws_rds_cluster': { type: 'DatabaseCluster', service: 'Database', provider: 'aws' },
    'aws_rds_cluster_instance': { type: 'DatabaseInstance', service: 'Database', provider: 'aws' },
    'aws_dynamodb_table': { type: 'NoSQLTable', service: 'Database', provider: 'aws' },
    'aws_elasticache_cluster': { type: 'CacheCluster', service: 'Database', provider: 'aws' },
    'aws_elasticache_replication_group': { type: 'CacheReplicationGroup', service: 'Database', provider: 'aws' },
    'aws_redshift_cluster': { type: 'DataWarehouse', service: 'Database', provider: 'aws' },
    
    'aws_lb': { type: 'LoadBalancer', service: 'Networking', provider: 'aws' },
    'aws_alb': { type: 'ApplicationLoadBalancer', service: 'Networking', provider: 'aws' },
    'aws_nlb': { type: 'NetworkLoadBalancer', service: 'Networking', provider: 'aws' },
    'aws_elb': { type: 'ClassicLoadBalancer', service: 'Networking', provider: 'aws' },
    'aws_vpc': { type: 'VPC', service: 'Networking', provider: 'aws' },
    'aws_subnet': { type: 'Subnet', service: 'Networking', provider: 'aws' },
    'aws_internet_gateway': { type: 'InternetGateway', service: 'Networking', provider: 'aws' },
    'aws_nat_gateway': { type: 'NATGateway', service: 'Networking', provider: 'aws' },
    'aws_route_table': { type: 'RouteTable', service: 'Networking', provider: 'aws' },
    'aws_security_group': { type: 'SecurityGroup', service: 'Networking', provider: 'aws' },
    'aws_network_acl': { type: 'NetworkACL', service: 'Networking', provider: 'aws' },
    'aws_vpc_endpoint': { type: 'VPCEndpoint', service: 'Networking', provider: 'aws' },
    'aws_vpn_connection': { type: 'VPNConnection', service: 'Networking', provider: 'aws' },
    'aws_vpn_gateway': { type: 'VPNGateway', service: 'Networking', provider: 'aws' },
    'aws_direct_connect_connection': { type: 'DirectConnect', service: 'Networking', provider: 'aws' },
    
    'aws_cloudfront_distribution': { type: 'CDN', service: 'Networking', provider: 'aws' },
    'aws_route53_zone': { type: 'DNSZone', service: 'Networking', provider: 'aws' },
    'aws_route53_record': { type: 'DNSRecord', service: 'Networking', provider: 'aws' },
    
    'aws_lambda_function': { type: 'Function', service: 'Compute', provider: 'aws' },
    'aws_ecs_cluster': { type: 'ContainerCluster', service: 'Compute', provider: 'aws' },
    'aws_ecs_service': { type: 'ContainerService', service: 'Compute', provider: 'aws' },
    'aws_ecs_task_definition': { type: 'TaskDefinition', service: 'Compute', provider: 'aws' },
    'aws_eks_cluster': { type: 'KubernetesCluster', service: 'Compute', provider: 'aws' },
    'aws_eks_node_group': { type: 'KubernetesNodeGroup', service: 'Compute', provider: 'aws' },
    
    'aws_cloudwatch_log_group': { type: 'LogGroup', service: 'Monitoring', provider: 'aws' },
    'aws_cloudwatch_metric_alarm': { type: 'Alarm', service: 'Monitoring', provider: 'aws' },
    'aws_cloudwatch_dashboard': { type: 'Dashboard', service: 'Monitoring', provider: 'aws' },
    
    // Azure Resources
    'azurerm_virtual_machine': { type: 'Instance', service: 'Compute', provider: 'azure' },
    'azurerm_virtual_machine_scale_set': { type: 'ScaleSet', service: 'Compute', provider: 'azure' },
    'azurerm_availability_set': { type: 'AvailabilitySet', service: 'Compute', provider: 'azure' },
    'azurerm_proximity_placement_group': { type: 'ProximityGroup', service: 'Compute', provider: 'azure' },
    
    'azurerm_storage_account': { type: 'StorageAccount', service: 'Storage', provider: 'azure' },
    'azurerm_storage_container': { type: 'StorageContainer', service: 'Storage', provider: 'azure' },
    'azurerm_storage_blob': { type: 'StorageBlob', service: 'Storage', provider: 'azure' },
    'azurerm_managed_disk': { type: 'ManagedDisk', service: 'Storage', provider: 'azure' },
    'azurerm_snapshot': { type: 'Snapshot', service: 'Storage', provider: 'azure' },
    
    'azurerm_sql_database': { type: 'Database', service: 'Database', provider: 'azure' },
    'azurerm_sql_server': { type: 'DatabaseServer', service: 'Database', provider: 'azure' },
    'azurerm_sql_elasticpool': { type: 'ElasticPool', service: 'Database', provider: 'azure' },
    'azurerm_cosmosdb_account': { type: 'CosmosDB', service: 'Database', provider: 'azure' },
    'azurerm_redis_cache': { type: 'RedisCache', service: 'Database', provider: 'azure' },
    'azurerm_postgresql_server': { type: 'PostgreSQLServer', service: 'Database', provider: 'azure' },
    'azurerm_mysql_server': { type: 'MySQLServer', service: 'Database', provider: 'azure' },
    
    'azurerm_lb': { type: 'LoadBalancer', service: 'Networking', provider: 'azure' },
    'azurerm_application_gateway': { type: 'ApplicationGateway', service: 'Networking', provider: 'azure' },
    'azurerm_virtual_network': { type: 'VNet', service: 'Networking', provider: 'azure' },
    'azurerm_subnet': { type: 'Subnet', service: 'Networking', provider: 'azure' },
    'azurerm_network_security_group': { type: 'NetworkSecurityGroup', service: 'Networking', provider: 'azure' },
    'azurerm_public_ip': { type: 'PublicIP', service: 'Networking', provider: 'azure' },
    'azurerm_network_interface': { type: 'NetworkInterface', service: 'Networking', provider: 'azure' },
    'azurerm_virtual_network_gateway': { type: 'VPNGateway', service: 'Networking', provider: 'azure' },
    'azurerm_express_route_circuit': { type: 'ExpressRoute', service: 'Networking', provider: 'azure' },
    
    'azurerm_cdn_profile': { type: 'CDNProfile', service: 'Networking', provider: 'azure' },
    'azurerm_cdn_endpoint': { type: 'CDNEndpoint', service: 'Networking', provider: 'azure' },
    'azurerm_dns_zone': { type: 'DNSZone', service: 'Networking', provider: 'azure' },
    'azurerm_dns_a_record': { type: 'DNSRecord', service: 'Networking', provider: 'azure' },
    
    'azurerm_function_app': { type: 'FunctionApp', service: 'Compute', provider: 'azure' },
    'azurerm_container_group': { type: 'ContainerGroup', service: 'Compute', provider: 'azure' },
    'azurerm_kubernetes_cluster': { type: 'KubernetesCluster', service: 'Compute', provider: 'azure' },
    'azurerm_kubernetes_cluster_node_pool': { type: 'KubernetesNodePool', service: 'Compute', provider: 'azure' },
    
    'azurerm_log_analytics_workspace': { type: 'LogAnalyticsWorkspace', service: 'Monitoring', provider: 'azure' },
    'azurerm_application_insights': { type: 'ApplicationInsights', service: 'Monitoring', provider: 'azure' },
    'azurerm_monitor_metric_alert': { type: 'MetricAlert', service: 'Monitoring', provider: 'azure' },
    
    // Google Cloud Resources
    'google_compute_instance': { type: 'Instance', service: 'Compute', provider: 'gcp' },
    'google_compute_instance_group': { type: 'InstanceGroup', service: 'Compute', provider: 'gcp' },
    'google_compute_instance_template': { type: 'InstanceTemplate', service: 'Compute', provider: 'gcp' },
    'google_compute_autoscaler': { type: 'Autoscaler', service: 'Compute', provider: 'gcp' },
    
    'google_storage_bucket': { type: 'Bucket', service: 'Storage', provider: 'gcp' },
    'google_storage_bucket_object': { type: 'Object', service: 'Storage', provider: 'gcp' },
    'google_compute_disk': { type: 'Disk', service: 'Storage', provider: 'gcp' },
    'google_compute_snapshot': { type: 'Snapshot', service: 'Storage', provider: 'gcp' },
    'google_filestore_instance': { type: 'Filestore', service: 'Storage', provider: 'gcp' },
    
    'google_sql_database_instance': { type: 'Database', service: 'Database', provider: 'gcp' },
    'google_sql_database': { type: 'Database', service: 'Database', provider: 'gcp' },
    'google_firestore_database': { type: 'Firestore', service: 'Database', provider: 'gcp' },
    'google_bigtable_instance': { type: 'Bigtable', service: 'Database', provider: 'gcp' },
    'google_redis_instance': { type: 'Redis', service: 'Database', provider: 'gcp' },
    'google_spanner_instance': { type: 'Spanner', service: 'Database', provider: 'gcp' },
    
    'google_compute_forwarding_rule': { type: 'LoadBalancer', service: 'Networking', provider: 'gcp' },
    'google_compute_backend_service': { type: 'BackendService', service: 'Networking', provider: 'gcp' },
    'google_compute_network': { type: 'VPC', service: 'Networking', provider: 'gcp' },
    'google_compute_subnetwork': { type: 'Subnet', service: 'Networking', provider: 'gcp' },
    'google_compute_firewall': { type: 'Firewall', service: 'Networking', provider: 'gcp' },
    'google_compute_router': { type: 'Router', service: 'Networking', provider: 'gcp' },
    'google_compute_vpn_tunnel': { type: 'VPNTunnel', service: 'Networking', provider: 'gcp' },
    'google_compute_vpn_gateway': { type: 'VPNGateway', service: 'Networking', provider: 'gcp' },
    
    'google_compute_global_forwarding_rule': { type: 'GlobalLoadBalancer', service: 'Networking', provider: 'gcp' },
    'google_dns_managed_zone': { type: 'DNSZone', service: 'Networking', provider: 'gcp' },
    'google_dns_record_set': { type: 'DNSRecord', service: 'Networking', provider: 'gcp' },
    
    'google_cloudfunctions_function': { type: 'CloudFunction', service: 'Compute', provider: 'gcp' },
    'google_container_cluster': { type: 'KubernetesCluster', service: 'Compute', provider: 'gcp' },
    'google_container_node_pool': { type: 'KubernetesNodePool', service: 'Compute', provider: 'gcp' },
    'google_cloud_run_service': { type: 'CloudRunService', service: 'Compute', provider: 'gcp' },
    
    'google_logging_project_sink': { type: 'LogSink', service: 'Monitoring', provider: 'gcp' },
    'google_monitoring_alert_policy': { type: 'AlertPolicy', service: 'Monitoring', provider: 'gcp' },
    'google_monitoring_dashboard': { type: 'Dashboard', service: 'Monitoring', provider: 'gcp' },
    
    // Oracle Cloud Resources
    'oci_core_instance': { type: 'Instance', service: 'Compute', provider: 'oracle' },
    'oci_core_instance_pool': { type: 'InstancePool', service: 'Compute', provider: 'oracle' },
    'oci_autoscaling_auto_scaling_configuration': { type: 'AutoScalingConfig', service: 'Compute', provider: 'oracle' },
    
    'oci_objectstorage_bucket': { type: 'Bucket', service: 'Storage', provider: 'oracle' },
    'oci_objectstorage_object': { type: 'Object', service: 'Storage', provider: 'oracle' },
    'oci_core_volume': { type: 'Volume', service: 'Storage', provider: 'oracle' },
    'oci_core_volume_backup': { type: 'VolumeBackup', service: 'Storage', provider: 'oracle' },
    'oci_file_storage_file_system': { type: 'FileSystem', service: 'Storage', provider: 'oracle' },
    
    'oci_database_autonomous_database': { type: 'AutonomousDatabase', service: 'Database', provider: 'oracle' },
    'oci_database_db_system': { type: 'DatabaseSystem', service: 'Database', provider: 'oracle' },
    'oci_nosql_table': { type: 'NoSQLTable', service: 'Database', provider: 'oracle' },
    'oci_redis_redis_cluster': { type: 'RedisCluster', service: 'Database', provider: 'oracle' },
    
    'oci_load_balancer_load_balancer': { type: 'LoadBalancer', service: 'Networking', provider: 'oracle' },
    'oci_network_load_balancer_network_load_balancer': { type: 'NetworkLoadBalancer', service: 'Networking', provider: 'oracle' },
    'oci_core_vcn': { type: 'VCN', service: 'Networking', provider: 'oracle' },
    'oci_core_subnet': { type: 'Subnet', service: 'Networking', provider: 'oracle' },
    'oci_core_security_list': { type: 'SecurityList', service: 'Networking', provider: 'oracle' },
    'oci_core_internet_gateway': { type: 'InternetGateway', service: 'Networking', provider: 'oracle' },
    'oci_core_nat_gateway': { type: 'NATGateway', service: 'Networking', provider: 'oracle' },
    'oci_core_service_gateway': { type: 'ServiceGateway', service: 'Networking', provider: 'oracle' },
    'oci_core_drg': { type: 'DynamicRoutingGateway', service: 'Networking', provider: 'oracle' },
    
    'oci_dns_zone': { type: 'DNSZone', service: 'Networking', provider: 'oracle' },
    'oci_dns_rrset': { type: 'DNSRecord', service: 'Networking', provider: 'oracle' },
    
    'oci_functions_function': { type: 'Function', service: 'Compute', provider: 'oracle' },
    'oci_containerengine_cluster': { type: 'KubernetesCluster', service: 'Compute', provider: 'oracle' },
    'oci_containerengine_node_pool': { type: 'KubernetesNodePool', service: 'Compute', provider: 'oracle' },
    
    'oci_logging_log_group': { type: 'LogGroup', service: 'Monitoring', provider: 'oracle' },
    'oci_monitoring_alarm': { type: 'Alarm', service: 'Monitoring', provider: 'oracle' },
  };

  parseTerraformState(tfState: TerraformState): UnifiedInventory {
    const resources: UnifiedResource[] = [];
    
    if (!tfState.resources || !Array.isArray(tfState.resources)) {
      throw new Error('Invalid Terraform state: missing or invalid resources array');
    }

    for (const resource of tfState.resources) {
      if (!resource.instances || !Array.isArray(resource.instances)) {
        continue;
      }

      for (const instance of resource.instances) {
        const attributes = instance.attributes || {};
        
        const resourceInfo = this.resourceTypeMap[resource.type] || {
          type: 'Unknown',
          service: 'Other',
          provider: this.extractProviderFromType(resource.type)
        };

        const costDetails = this.extractCostDetails(resource.type, attributes);

        const unifiedResource: UnifiedResource = {
          id: attributes.id || `${resource.type}.${resource.name}`,
          name: this.extractResourceName(attributes, resource.name),
          type: resourceInfo.type,
          service: resourceInfo.service,
          provider: resourceInfo.provider,
          location: this.extractLocation(attributes, resourceInfo.provider),
          state: this.extractState(attributes),
          costDetails: costDetails,
          tags: this.extractTags(attributes),
          metadata: {
            terraformType: resource.type,
            terraformAddress: resource.name,
            terraformProvider: resource.provider,
            terraformMode: resource.mode,
            ...this.extractAdditionalMetadata(resource.type, attributes)
          }
        };

        resources.push(unifiedResource);
      }
    }

    return {
      resources,
      summary: {
        totalResources: resources.length,
        providers: this.getProviderSummary(resources),
        services: this.getServiceSummary(resources),
        regions: this.getRegionSummary(resources)
      },
      scanTime: new Date().toISOString(),
      source: 'terraform'
    };
  }

  private extractProviderFromType(tfType: string): string {
    if (tfType.startsWith('aws_')) return 'aws';
    if (tfType.startsWith('azurerm_')) return 'azure';
    if (tfType.startsWith('google_')) return 'gcp';
    if (tfType.startsWith('oci_')) return 'oracle';
    return 'unknown';
  }

  private extractResourceName(attributes: Record<string, any>, fallbackName: string): string {
    // Try various common name fields
    return attributes.name || 
           attributes.display_name || 
           attributes.tags?.Name || 
           attributes.tags?.name ||
           attributes.bucket || 
           attributes.database_name ||
           fallbackName;
  }

  private extractLocation(attributes: Record<string, any>, provider: string): string {
    switch (provider) {
      case 'aws':
        return attributes.region || attributes.availability_zone || 'us-east-1';
      case 'azure':
        return attributes.location || attributes.resource_group_name || 'eastus';
      case 'gcp':
        return attributes.region || attributes.zone || 'us-central1';
      case 'oracle':
        return attributes.region || attributes.availability_domain || 'us-phoenix-1';
      default:
        return attributes.region || attributes.location || 'unknown';
    }
  }

  private extractState(attributes: Record<string, any>): string {
    // Check for common state fields
    if (attributes.state) return attributes.state;
    if (attributes.status) return attributes.status;
    if (attributes.lifecycle_state) return attributes.lifecycle_state;
    if (attributes.provisioning_state) return attributes.provisioning_state;
    
    // Default to active if no state found
    return 'active';
  }

  private extractCostDetails(tfType: string, attributes: Record<string, any>): any {
    const details: any = {};

    // Instance/VM details
    if (tfType.includes('instance') || tfType.includes('vm')) {
      details.instanceType = attributes.instance_type || 
                            attributes.vm_size || 
                            attributes.machine_type ||
                            attributes.shape;
      details.vcpus = this.getVCPUs(details.instanceType);
      details.memory = this.getMemory(details.instanceType);
      details.architecture = attributes.architecture || attributes.vm_architecture;
      details.platform = attributes.platform || attributes.vm_platform;
      details.tenancy = attributes.tenancy || attributes.dedicated_host_affinity;
      details.spotPrice = attributes.spot_price || attributes.max_spot_price;
      details.spotType = attributes.spot_type || attributes.spot_request_type;
    }

    // Storage details
    if (tfType.includes('storage') || tfType.includes('bucket') || tfType.includes('volume') || tfType.includes('disk')) {
      details.storage = attributes.size || 
                       attributes.allocated_storage || 
                       attributes.disk_size_gb ||
                       attributes.storage_size_in_gbs;
      details.storageType = attributes.type || 
                           attributes.storage_type || 
                           attributes.storage_class ||
                           attributes.storage_tier;
      details.iops = attributes.iops || attributes.provisioned_iops;
      details.throughput = attributes.throughput || attributes.provisioned_throughput;
      details.encrypted = attributes.encrypted || attributes.kms_key_id;
      details.backupRetention = attributes.backup_retention_period || attributes.retention_period;
    }

    // Database details
    if (tfType.includes('database') || tfType.includes('rds') || tfType.includes('sql')) {
      details.engine = attributes.engine || attributes.database_edition;
      details.engineVersion = attributes.engine_version || attributes.database_version;
      details.instanceClass = attributes.instance_class || attributes.db_instance_class;
      details.allocatedStorage = attributes.allocated_storage || attributes.storage_size_in_gbs;
      details.multiAz = attributes.multi_az || attributes.availability_type;
      details.backupWindow = attributes.backup_window;
      details.maintenanceWindow = attributes.maintenance_window;
      details.performanceInsights = attributes.performance_insights_enabled;
      details.monitoringInterval = attributes.monitoring_interval;
      details.monitoringRoleArn = attributes.monitoring_role_arn;
    }

    // Load balancer details
    if (tfType.includes('lb') || tfType.includes('load_balancer')) {
      details.scheme = attributes.scheme || attributes.load_balancer_type;
      details.type = attributes.type || attributes.load_balancer_type;
      details.algorithm = attributes.algorithm || attributes.load_balancing_algorithm;
      details.healthCheck = attributes.health_check || attributes.health_check_config;
      details.sslCertificate = attributes.ssl_certificate || attributes.certificate_arn;
      details.idleTimeout = attributes.idle_timeout;
      details.connectionDraining = attributes.connection_draining;
    }

    // Network details
    if (tfType.includes('vpc') || tfType.includes('subnet') || tfType.includes('gateway')) {
      details.cidrBlock = attributes.cidr_block || attributes.address_prefix;
      details.availabilityZone = attributes.availability_zone || attributes.availability_domain;
      details.publiclyAccessible = attributes.publicly_accessible || attributes.public_ip;
      details.natGatewayId = attributes.nat_gateway_id;
      details.routeTableId = attributes.route_table_id;
    }

    // Container/Kubernetes details
    if (tfType.includes('container') || tfType.includes('kubernetes') || tfType.includes('eks') || tfType.includes('gke')) {
      details.nodeCount = attributes.node_count || attributes.desired_size;
      details.nodeType = attributes.node_type || attributes.instance_type;
      details.minSize = attributes.min_size;
      details.maxSize = attributes.max_size;
      details.diskSize = attributes.disk_size || attributes.disk_size_gb;
      details.kubernetesVersion = attributes.kubernetes_version || attributes.version;
      details.networkPolicy = attributes.network_policy_enabled;
      details.podSecurityPolicy = attributes.pod_security_policy_enabled;
    }

    // Function details
    if (tfType.includes('function') || tfType.includes('lambda')) {
      details.runtime = attributes.runtime || attributes.function_runtime;
      details.memory = attributes.memory || attributes.function_memory;
      details.timeout = attributes.timeout || attributes.function_timeout;
      details.handler = attributes.handler || attributes.function_handler;
      details.layers = attributes.layers;
      details.environment = attributes.environment || attributes.environment_variables;
    }

    // CDN details
    if (tfType.includes('cdn') || tfType.includes('cloudfront') || tfType.includes('distribution')) {
      details.origins = attributes.origins || attributes.origin;
      details.cacheBehaviors = attributes.cache_behaviors;
      details.priceClass = attributes.price_class;
      details.aliases = attributes.aliases;
      details.sslCertificate = attributes.ssl_certificate;
      details.defaultRootObject = attributes.default_root_object;
    }

    // Add estimated monthly cost based on resource details
    details.estimatedMonthlyCost = this.estimateMonthlyCost(tfType, details);

    return details;
  }

  private extractTags(attributes: Record<string, any>): Record<string, string> {
    const tags: Record<string, string> = {};
    
    if (attributes.tags && typeof attributes.tags === 'object') {
      Object.assign(tags, attributes.tags);
    }
    
    // Some providers use different tag field names
    if (attributes.labels && typeof attributes.labels === 'object') {
      Object.assign(tags, attributes.labels);
    }
    
    return tags;
  }

  private extractAdditionalMetadata(tfType: string, attributes: Record<string, any>): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Add provider-specific metadata
    if (tfType.startsWith('aws_')) {
      metadata.awsAccountId = attributes.account_id;
      metadata.awsArn = attributes.arn;
    } else if (tfType.startsWith('azurerm_')) {
      metadata.azureResourceGroup = attributes.resource_group_name;
      metadata.azureSubscriptionId = attributes.subscription_id;
    } else if (tfType.startsWith('google_')) {
      metadata.gcpProject = attributes.project;
    } else if (tfType.startsWith('oci_')) {
      metadata.ociCompartmentId = attributes.compartment_id;
      metadata.ociTenancyId = attributes.tenancy_id;
    }

    return metadata;
  }

  private getVCPUs(instanceType: string): number {
    if (!instanceType) return 2;
    
    const vcpuMap: Record<string, number> = {
      // AWS
      't2.micro': 1, 't2.small': 1, 't2.medium': 2, 't2.large': 2, 't2.xlarge': 4, 't2.2xlarge': 8,
      't3.micro': 2, 't3.small': 2, 't3.medium': 2, 't3.large': 2, 't3.xlarge': 4, 't3.2xlarge': 8,
      't3a.micro': 2, 't3a.small': 2, 't3a.medium': 2, 't3a.large': 2, 't3a.xlarge': 4, 't3a.2xlarge': 8,
      't4g.micro': 2, 't4g.small': 2, 't4g.medium': 2, 't4g.large': 2, 't4g.xlarge': 4, 't4g.2xlarge': 8,
      'm5.large': 2, 'm5.xlarge': 4, 'm5.2xlarge': 8, 'm5.4xlarge': 16, 'm5.8xlarge': 32, 'm5.12xlarge': 48, 'm5.16xlarge': 64, 'm5.24xlarge': 96,
      'm5a.large': 2, 'm5a.xlarge': 4, 'm5a.2xlarge': 8, 'm5a.4xlarge': 16, 'm5a.8xlarge': 32, 'm5a.12xlarge': 48, 'm5a.16xlarge': 64, 'm5a.24xlarge': 96,
      'm6i.large': 2, 'm6i.xlarge': 4, 'm6i.2xlarge': 8, 'm6i.4xlarge': 16, 'm6i.8xlarge': 32, 'm6i.12xlarge': 48, 'm6i.16xlarge': 64, 'm6i.24xlarge': 96,
      'c5.large': 2, 'c5.xlarge': 4, 'c5.2xlarge': 8, 'c5.4xlarge': 16, 'c5.9xlarge': 36, 'c5.12xlarge': 48, 'c5.18xlarge': 72, 'c5.24xlarge': 96,
      'c5a.large': 2, 'c5a.xlarge': 4, 'c5a.2xlarge': 8, 'c5a.4xlarge': 16, 'c5a.8xlarge': 32, 'c5a.12xlarge': 48, 'c5a.16xlarge': 64, 'c5a.24xlarge': 96,
      'c6i.large': 2, 'c6i.xlarge': 4, 'c6i.2xlarge': 8, 'c6i.4xlarge': 16, 'c6i.8xlarge': 32, 'c6i.12xlarge': 48, 'c6i.16xlarge': 64, 'c6i.24xlarge': 96,
      'r5.large': 2, 'r5.xlarge': 4, 'r5.2xlarge': 8, 'r5.4xlarge': 16, 'r5.8xlarge': 32, 'r5.12xlarge': 48, 'r5.16xlarge': 64, 'r5.24xlarge': 96,
      'r5a.large': 2, 'r5a.xlarge': 4, 'r5a.2xlarge': 8, 'r5a.4xlarge': 16, 'r5a.8xlarge': 32, 'r5a.12xlarge': 48, 'r5a.16xlarge': 64, 'r5a.24xlarge': 96,
      'r6i.large': 2, 'r6i.xlarge': 4, 'r6i.2xlarge': 8, 'r6i.4xlarge': 16, 'r6i.8xlarge': 32, 'r6i.12xlarge': 48, 'r6i.16xlarge': 64, 'r6i.24xlarge': 96,
      'g4dn.xlarge': 4, 'g4dn.2xlarge': 8, 'g4dn.4xlarge': 16, 'g4dn.8xlarge': 32, 'g4dn.12xlarge': 48, 'g4dn.16xlarge': 64,
      'p3.2xlarge': 8, 'p3.8xlarge': 32, 'p3.16xlarge': 64,
      'p4d.24xlarge': 96,
      
      // Azure
      'Standard_B1s': 1, 'Standard_B2s': 2, 'Standard_B4ms': 4, 'Standard_B8ms': 8,
      'Standard_D2s_v3': 2, 'Standard_D4s_v3': 4, 'Standard_D8s_v3': 8, 'Standard_D16s_v3': 16, 'Standard_D32s_v3': 32, 'Standard_D64s_v3': 64,
      'Standard_E2s_v3': 2, 'Standard_E4s_v3': 4, 'Standard_E8s_v3': 8, 'Standard_E16s_v3': 16, 'Standard_E32s_v3': 32, 'Standard_E64s_v3': 64,
      'Standard_F2s_v2': 2, 'Standard_F4s_v2': 4, 'Standard_F8s_v2': 8, 'Standard_F16s_v2': 16, 'Standard_F32s_v2': 32, 'Standard_F64s_v2': 64,
      'Standard_NC6s_v3': 6, 'Standard_NC12s_v3': 12, 'Standard_NC24s_v3': 24,
      'Standard_ND6s': 6, 'Standard_ND12s': 12, 'Standard_ND24s': 24,
      
      // GCP
      'e2-micro': 2, 'e2-small': 2, 'e2-medium': 2, 'e2-standard-2': 2, 'e2-standard-4': 4, 'e2-standard-8': 8, 'e2-standard-16': 16, 'e2-standard-32': 32,
      'n1-standard-1': 1, 'n1-standard-2': 2, 'n1-standard-4': 4, 'n1-standard-8': 8, 'n1-standard-16': 16, 'n1-standard-32': 32, 'n1-standard-64': 64, 'n1-standard-96': 96,
      'n2-standard-2': 2, 'n2-standard-4': 4, 'n2-standard-8': 8, 'n2-standard-16': 16, 'n2-standard-32': 32, 'n2-standard-48': 48, 'n2-standard-64': 64, 'n2-standard-80': 80, 'n2-standard-96': 96, 'n2-standard-128': 128,
      'c2-standard-4': 4, 'c2-standard-8': 8, 'c2-standard-16': 16, 'c2-standard-30': 30, 'c2-standard-60': 60,
      'm1-megamem-96': 96, 'm1-ultramem-40': 40, 'm1-ultramem-80': 80, 'm1-ultramem-160': 160,
      'a2-highgpu-1g': 12, 'a2-highgpu-2g': 24, 'a2-highgpu-4g': 48, 'a2-highgpu-8g': 96,
      
      // Oracle Cloud
      'VM.Standard.E2.1.Micro': 1, 'VM.Standard.E2.1': 1, 'VM.Standard.E2.2': 2, 'VM.Standard.E2.4': 4, 'VM.Standard.E2.8': 8,
      'VM.Standard.E3.Flex': 1, 'VM.Standard.E4.Flex': 1, 'VM.Standard.E5.Flex': 1,
      'VM.Standard1.1': 1, 'VM.Standard1.2': 2, 'VM.Standard1.4': 4, 'VM.Standard1.8': 8, 'VM.Standard1.16': 16,
      'VM.Standard2.1': 1, 'VM.Standard2.2': 2, 'VM.Standard2.4': 4, 'VM.Standard2.8': 8, 'VM.Standard2.16': 16, 'VM.Standard2.24': 24,
      'VM.Standard3.Flex': 1, 'VM.Standard4.Flex': 1, 'VM.Standard5.Flex': 1,
      'BM.Standard.E2.64': 64, 'BM.Standard.E3.128': 128, 'BM.Standard.E4.128': 128,
      'BM.Standard1.36': 36, 'BM.Standard2.52': 52, 'BM.Standard3.72': 72,
      'BM.GPU2.2': 28, 'BM.GPU3.8': 52, 'BM.GPU4.8': 52
    };
    
    return vcpuMap[instanceType] || 2;
  }

  private getMemory(instanceType: string): number {
    if (!instanceType) return 4;
    
    const memoryMap: Record<string, number> = {
      // AWS
      't2.micro': 1, 't2.small': 2, 't2.medium': 4, 't2.large': 8, 't2.xlarge': 16, 't2.2xlarge': 32,
      't3.micro': 1, 't3.small': 2, 't3.medium': 4, 't3.large': 8, 't3.xlarge': 16, 't3.2xlarge': 32,
      'm5.large': 8, 'm5.xlarge': 16, 'm5.2xlarge': 32, 'm5.4xlarge': 64, 'm5.8xlarge': 128, 'm5.12xlarge': 192, 'm5.16xlarge': 256, 'm5.24xlarge': 384,
      'c5.large': 4, 'c5.xlarge': 8, 'c5.2xlarge': 16, 'c5.4xlarge': 32, 'c5.9xlarge': 72, 'c5.12xlarge': 96, 'c5.18xlarge': 144, 'c5.24xlarge': 192,
      'r5.large': 16, 'r5.xlarge': 32, 'r5.2xlarge': 64, 'r5.4xlarge': 128, 'r5.8xlarge': 256, 'r5.12xlarge': 384, 'r5.16xlarge': 512, 'r5.24xlarge': 768,
      
      // Azure
      'Standard_B1s': 1, 'Standard_B2s': 4, 'Standard_B4ms': 16, 'Standard_B8ms': 32,
      'Standard_D2s_v3': 8, 'Standard_D4s_v3': 16, 'Standard_D8s_v3': 32, 'Standard_D16s_v3': 64, 'Standard_D32s_v3': 128, 'Standard_D64s_v3': 256,
      'Standard_E2s_v3': 16, 'Standard_E4s_v3': 32, 'Standard_E8s_v3': 64, 'Standard_E16s_v3': 128, 'Standard_E32s_v3': 256, 'Standard_E64s_v3': 512,
      
      // GCP
      'e2-micro': 1, 'e2-small': 2, 'e2-medium': 4, 'e2-standard-2': 8, 'e2-standard-4': 16, 'e2-standard-8': 32, 'e2-standard-16': 64, 'e2-standard-32': 128,
      'n1-standard-1': 3.75, 'n1-standard-2': 7.5, 'n1-standard-4': 15, 'n1-standard-8': 30, 'n1-standard-16': 60, 'n1-standard-32': 120, 'n1-standard-64': 240, 'n1-standard-96': 360,
      'c2-standard-4': 16, 'c2-standard-8': 32, 'c2-standard-16': 64, 'c2-standard-30': 120, 'c2-standard-60': 240,
      
      // Oracle Cloud
      'VM.Standard.E2.1.Micro': 1, 'VM.Standard.E2.1': 8, 'VM.Standard.E2.2': 16, 'VM.Standard.E2.4': 32, 'VM.Standard.E2.8': 64,
      'VM.Standard.E3.Flex': 16, 'VM.Standard.E4.Flex': 32, 'VM.Standard.E5.Flex': 64,
      'BM.Standard.E2.64': 512, 'BM.Standard.E3.128': 1024, 'BM.Standard.E4.128': 1024
    };
    
    return memoryMap[instanceType] || 4;
  }

  private getProviderSummary(resources: UnifiedResource[]): Record<string, number> {
    const summary: Record<string, number> = {};
    resources.forEach(resource => {
      summary[resource.provider] = (summary[resource.provider] || 0) + 1;
    });
    return summary;
  }

  private getServiceSummary(resources: UnifiedResource[]): Record<string, number> {
    const summary: Record<string, number> = {};
    resources.forEach(resource => {
      summary[resource.service] = (summary[resource.service] || 0) + 1;
    });
    return summary;
  }

  private getRegionSummary(resources: UnifiedResource[]): Record<string, number> {
    const summary: Record<string, number> = {};
    resources.forEach(resource => {
      summary[resource.location] = (summary[resource.location] || 0) + 1;
    });
    return summary;
  }

  private estimateMonthlyCost(tfType: string, details: any): number {
    let baseCost = 0;
    const provider = this.extractProviderFromType(tfType);

    // Instance/VM costs
    if (tfType.includes('instance') || tfType.includes('vm')) {
      const instanceType = details.instanceType;
      const vcpus = details.vcpus || 2;
      const memory = details.memory || 4;
      
      // Base pricing per vCPU and GB memory (monthly)
      const pricing = {
        aws: { vcpu: 0.05, memory: 0.005 }, // $0.05/vCPU/hour, $0.005/GB/hour
        azure: { vcpu: 0.04, memory: 0.004 },
        gcp: { vcpu: 0.03, memory: 0.004 },
        oracle: { vcpu: 0.06, memory: 0.006 }
      };
      
      const providerPricing = pricing[provider] || pricing.aws;
      baseCost = (vcpus * providerPricing.vcpu + memory * providerPricing.memory) * 24 * 30;
      
      // Adjust for instance type families
      if (instanceType?.includes('t2') || instanceType?.includes('t3')) {
        baseCost *= 0.7; // Burstable instances are cheaper
      } else if (instanceType?.includes('c5') || instanceType?.includes('c6')) {
        baseCost *= 1.2; // Compute optimized are more expensive
      } else if (instanceType?.includes('r5') || instanceType?.includes('r6')) {
        baseCost *= 1.3; // Memory optimized are more expensive
      } else if (instanceType?.includes('g4') || instanceType?.includes('p3') || instanceType?.includes('p4')) {
        baseCost *= 3.0; // GPU instances are much more expensive
      }
    }

    // Storage costs
    if (tfType.includes('storage') || tfType.includes('bucket') || tfType.includes('volume') || tfType.includes('disk')) {
      const storage = details.storage || 0;
      const storageType = details.storageType;
      
      const storagePricing = {
        aws: { standard: 0.023, gp2: 0.10, gp3: 0.08, io1: 0.125, io2: 0.125 },
        azure: { standard: 0.018, premium: 0.20, ultra: 0.15 },
        gcp: { standard: 0.020, ssd: 0.17, balanced: 0.10 },
        oracle: { standard: 0.025, balanced: 0.12, performance: 0.15 }
      };
      
      const providerStoragePricing = storagePricing[provider] || storagePricing.aws;
      const pricePerGB = providerStoragePricing[storageType] || providerStoragePricing.standard;
      baseCost += (storage / 1024) * pricePerGB * 30; // Convert to GB and monthly
    }

    // Database costs
    if (tfType.includes('database') || tfType.includes('rds') || tfType.includes('sql')) {
      const instanceClass = details.instanceClass;
      const allocatedStorage = details.allocatedStorage || 0;
      
      const dbPricing = {
        aws: { 'db.t3.micro': 15, 'db.t3.small': 30, 'db.t3.medium': 60, 'db.r5.large': 200 },
        azure: { 'Basic': 5, 'S0': 15, 'S1': 30, 'S2': 60, 'S3': 120 },
        gcp: { 'db-f1-micro': 10, 'db-g1-small': 25, 'db-n1-standard-1': 50 },
        oracle: { 'Standard': 20, 'High': 100, 'Extreme': 200 }
      };
      
      const providerDbPricing = dbPricing[provider] || dbPricing.aws;
      baseCost += providerDbPricing[instanceClass] || 50;
      
      // Add storage cost
      if (allocatedStorage > 0) {
        baseCost += (allocatedStorage / 1024) * 0.115 * 30; // $0.115/GB/month
      }
    }

    // Load balancer costs
    if (tfType.includes('lb') || tfType.includes('load_balancer')) {
      const lbPricing = {
        aws: { application: 22.5, network: 22.5, classic: 18 },
        azure: { standard: 18, basic: 0 },
        gcp: { standard: 18, premium: 18 },
        oracle: { standard: 20 }
      };
      
      const providerLbPricing = lbPricing[provider] || lbPricing.aws;
      const lbType = details.type || 'application';
      baseCost += providerLbPricing[lbType] || 20;
    }

    // Container/Kubernetes costs
    if (tfType.includes('container') || tfType.includes('kubernetes') || tfType.includes('eks') || tfType.includes('gke')) {
      const nodeCount = details.nodeCount || 1;
      const nodeType = details.nodeType;
      
      // Kubernetes control plane cost
      baseCost += 73; // ~$73/month for managed Kubernetes
      
      // Node costs (estimated based on instance type)
      if (nodeType) {
        const nodeCost = this.estimateMonthlyCost(`aws_instance`, { instanceType: nodeType, vcpus: this.getVCPUs(nodeType), memory: this.getMemory(nodeType) });
        baseCost += nodeCost * nodeCount;
      }
    }

    // Function costs
    if (tfType.includes('function') || tfType.includes('lambda')) {
      const memory = details.memory || 128;
      const timeout = details.timeout || 3;
      
      // Estimate based on 1M requests/month, 100ms average duration
      const requests = 1000000;
      const duration = 0.1; // 100ms in seconds
      
      const requestCost = requests * 0.0000002; // $0.20 per 1M requests
      const computeCost = (requests * duration * memory / 1024) * 0.0000166667; // $0.0000166667 per GB-second
      
      baseCost += requestCost + computeCost;
    }

    // CDN costs
    if (tfType.includes('cdn') || tfType.includes('cloudfront') || tfType.includes('distribution')) {
      // Estimate based on 1TB data transfer/month
      const dataTransfer = 1000; // GB
      baseCost += dataTransfer * 0.085; // $0.085/GB for first 10TB
    }

    return Math.round(baseCost * 100) / 100; // Round to 2 decimal places
  }
}

interface ResourceTypeInfo {
  type: string;
  service: string;
  provider: string;
}
