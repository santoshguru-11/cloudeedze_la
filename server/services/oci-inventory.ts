import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export interface OCICredentials {
  tenancyId: string;
  userId: string;
  fingerprint: string;
  privateKey: string;
  region: string;
}

export interface OCIResource {
  id: string;
  name: string;
  type: string;
  service: string;
  region: string;
  state: string;
  compartmentName: string;
  costDetails?: any;
}

export interface OCIInventory {
  resources: OCIResource[];
  summary: {
    totalResources: number;
    byService: Record<string, number>;
    byRegion: Record<string, number>;
    byState: Record<string, number>;
  };
  metadata: {
    scanTime: string;
    region: string;
    provider: string;
  };
}

export class OCIInventoryService {
  private credentials?: OCICredentials;

  constructor(credentials?: OCICredentials) {
    this.credentials = credentials;
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials) {
      throw new Error('OCI credentials not provided');
    }

    try {
      const result = await this.callPythonScript('validate');
      return result.success === true;
    } catch (error) {
      console.error('OCI credential validation failed:', error);
      return false;
    }
  }

  async discoverResources(): Promise<OCIInventory> {
    if (!this.credentials) {
      throw new Error('OCI credentials not provided');
    }

    console.log('OCI inventory service: discovering real OCI resources');
    
    try {
      // Call the Python script to discover real OCI resources
      const result = await this.callPythonScript('discover');
      
      console.log('OCI Python script result:', JSON.stringify(result, null, 2));
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to discover OCI resources');
      }

      // Convert enhanced Python script format to OCI inventory format
      const region = this.credentials?.region || 'us-phoenix-1';
      const resources: OCIResource[] = [];

      // Process compute instances
      if (result.resources.compute_instances) {
        result.resources.compute_instances.forEach((instance: any) => {
          resources.push({
            id: instance.id,
            name: instance.display_name,
            type: instance.shape,
            service: 'OCI Compute',
            region: region,
            state: instance.lifecycle_state,
            compartmentName: instance.compartment_name,
            costDetails: {
              shape: instance.shape,
              ocpus: instance.shape_config?.ocpus,
              memoryInGBs: instance.shape_config?.memory_in_gbs,
              operatingSystem: instance.source_details?.image_id,
              availabilityDomain: instance.availability_domain,
              tags: {
                defined: instance.defined_tags || {},
                freeform: instance.freeform_tags || {}
              }
            }
          });
        });
      }

      // Process block volumes
      if (result.resources.block_volumes) {
        result.resources.block_volumes.forEach((volume: any) => {
          resources.push({
            id: volume.id,
            name: volume.display_name,
            type: 'Block Volume',
            service: 'OCI Storage',
            region: region,
            state: volume.lifecycle_state,
            compartmentName: volume.compartment_name,
            costDetails: {
              size: volume.size_in_gbs,
              storage: volume.size_in_gbs
            }
          });
        });
      }

      // Process object storage buckets
      if (result.resources.object_storage_buckets) {
        result.resources.object_storage_buckets.forEach((bucket: any) => {
          resources.push({
            id: bucket.id,
            name: bucket.name,
            type: 'Bucket',
            service: 'OCI Storage',
            region: region,
            state: 'ACTIVE',
            compartmentName: bucket.compartment_name,
            costDetails: {
              type: 'object-storage'
            }
          });
        });
      }

      // Process autonomous databases
      if (result.resources.autonomous_databases) {
        result.resources.autonomous_databases.forEach((db: any) => {
          resources.push({
            id: db.id,
            name: db.display_name,
            type: db.db_workload,
            service: 'OCI Database',
            region: region,
            state: db.lifecycle_state,
            compartmentName: db.compartment_name,
            costDetails: {
              cpuCoreCount: db.cpu_core_count,
              dataStorageSizeInTBs: db.data_storage_size_in_tbs,
              dbWorkload: db.db_workload
            }
          });
        });
      }

      // Process load balancers
      if (result.resources.load_balancers) {
        result.resources.load_balancers.forEach((lb: any) => {
          resources.push({
            id: lb.id,
            name: lb.display_name,
            type: 'Load Balancer',
            service: 'OCI Load Balancer',
            region: region,
            state: lb.lifecycle_state,
            compartmentName: lb.compartment_name,
            costDetails: {
              shapeName: lb.shape_name,
              bandwidthMbps: lb.shape_details?.minimum_bandwidth_in_mbps
            }
          });
        });
      }

      // Process VCNs
      if (result.resources.vcns) {
        result.resources.vcns.forEach((vcn: any) => {
          resources.push({
            id: vcn.id,
            name: vcn.display_name,
            type: 'VCN',
            service: 'OCI Network',
            region: region,
            state: vcn.lifecycle_state,
            compartmentName: vcn.compartment_name,
            costDetails: {
              cidrBlock: vcn.cidr_block
            }
          });
        });
      }

      // Process Subnets
      if (result.resources.subnets) {
        result.resources.subnets.forEach((subnet: any) => {
          resources.push({
            id: subnet.id,
            name: subnet.display_name,
            type: 'Subnet',
            service: 'OCI Network',
            region: region,
            state: subnet.lifecycle_state,
            compartmentName: subnet.compartment_name,
            costDetails: {
              cidrBlock: subnet.cidr_block,
              availabilityDomain: subnet.availability_domain
            }
          });
        });
      }

      // Process Security Lists
      if (result.resources.security_lists) {
        result.resources.security_lists.forEach((sl: any) => {
          resources.push({
            id: sl.id,
            name: sl.display_name,
            type: 'Security List',
            service: 'OCI Network',
            region: region,
            state: sl.lifecycle_state,
            compartmentName: sl.compartment_name,
            costDetails: {
              vcnId: sl.vcn_id
            }
          });
        });
      }

      // Process Route Tables
      if (result.resources.route_tables) {
        result.resources.route_tables.forEach((rt: any) => {
          resources.push({
            id: rt.id,
            name: rt.display_name,
            type: 'Route Table',
            service: 'OCI Network',
            region: region,
            state: rt.lifecycle_state,
            compartmentName: rt.compartment_name,
            costDetails: {
              vcnId: rt.vcn_id
            }
          });
        });
      }

      // Process Internet Gateways
      if (result.resources.internet_gateways) {
        result.resources.internet_gateways.forEach((ig: any) => {
          resources.push({
            id: ig.id,
            name: ig.display_name,
            type: 'Internet Gateway',
            service: 'OCI Network',
            region: region,
            state: ig.lifecycle_state,
            compartmentName: ig.compartment_name,
            costDetails: {
              vcnId: ig.vcn_id
            }
          });
        });
      }

      // Process NAT Gateways
      if (result.resources.nat_gateways) {
        result.resources.nat_gateways.forEach((nat: any) => {
          resources.push({
            id: nat.id,
            name: nat.display_name,
            type: 'NAT Gateway',
            service: 'OCI Network',
            region: region,
            state: nat.lifecycle_state,
            compartmentName: nat.compartment_name,
            costDetails: {
              vcnId: nat.vcn_id
            }
          });
        });
      }

      // Process Service Gateways
      if (result.resources.service_gateways) {
        result.resources.service_gateways.forEach((sg: any) => {
          resources.push({
            id: sg.id,
            name: sg.display_name,
            type: 'Service Gateway',
            service: 'OCI Network',
            region: region,
            state: sg.lifecycle_state,
            compartmentName: sg.compartment_name,
            costDetails: {
              vcnId: sg.vcn_id
            }
          });
        });
      }

      // Process Network Security Groups
      if (result.resources.network_security_groups) {
        result.resources.network_security_groups.forEach((nsg: any) => {
          resources.push({
            id: nsg.id,
            name: nsg.display_name,
            type: 'Network Security Group',
            service: 'OCI Network',
            region: region,
            state: nsg.lifecycle_state,
            compartmentName: nsg.compartment_name,
            costDetails: {
              vcnId: nsg.vcn_id
            }
          });
        });
      }

      // Process Images
      if (result.resources.images) {
        result.resources.images.forEach((image: any) => {
          resources.push({
            id: image.id,
            name: image.display_name,
            type: 'Image',
            service: 'OCI Compute',
            region: region,
            state: image.lifecycle_state,
            compartmentName: image.compartment_name,
            costDetails: {
              operatingSystem: image.operating_system,
              operatingSystemVersion: image.operating_system_version
            }
          });
        });
      }

      // Process Volume Groups
      if (result.resources.volume_groups) {
        result.resources.volume_groups.forEach((vg: any) => {
          resources.push({
            id: vg.id,
            name: vg.display_name,
            type: 'Volume Group',
            service: 'OCI Storage',
            region: region,
            state: vg.lifecycle_state,
            compartmentName: vg.compartment_name,
            costDetails: {
              availabilityDomain: vg.availability_domain
            }
          });
        });
      }

      // Process Boot Volumes
      if (result.resources.boot_volumes) {
        result.resources.boot_volumes.forEach((bv: any) => {
          resources.push({
            id: bv.id,
            name: bv.display_name,
            type: 'Boot Volume',
            service: 'OCI Storage',
            region: region,
            state: bv.lifecycle_state,
            compartmentName: bv.compartment_name,
            costDetails: {
              sizeInGBs: bv.size_in_gbs,
              availabilityDomain: bv.availability_domain
            }
          });
        });
      }

      // Process Backups
      if (result.resources.backups) {
        result.resources.backups.forEach((backup: any) => {
          resources.push({
            id: backup.id,
            name: backup.display_name,
            type: 'Volume Backup',
            service: 'OCI Storage',
            region: region,
            state: backup.lifecycle_state,
            compartmentName: backup.compartment_name,
            costDetails: {
              sizeInGBs: backup.size_in_gbs,
              volumeId: backup.volume_id
            }
          });
        });
      }

      // Process DB Systems
      if (result.resources.db_systems) {
        result.resources.db_systems.forEach((db: any) => {
          resources.push({
            id: db.id,
            name: db.display_name,
            type: 'DB System',
            service: 'OCI Database',
            region: region,
            state: db.lifecycle_state,
            compartmentName: db.compartment_name,
            costDetails: {
              shape: db.shape,
              availabilityDomain: db.availability_domain
            }
          });
        });
      }

      // Process Functions
      if (result.resources.functions) {
        result.resources.functions.forEach((func: any) => {
          resources.push({
            id: func.id,
            name: func.display_name,
            type: 'Function',
            service: 'OCI Functions',
            region: region,
            state: func.lifecycle_state,
            compartmentName: func.compartment_name,
            costDetails: {
              type: 'serverless-function'
            }
          });
        });
      }

      // Process Container Instances
      if (result.resources.containers) {
        result.resources.containers.forEach((container: any) => {
          resources.push({
            id: container.id,
            name: container.display_name,
            type: 'Container Instance',
            service: 'OCI Container Instances',
            region: region,
            state: container.lifecycle_state,
            compartmentName: container.compartment_name,
            costDetails: {
              type: 'container-instance'
            }
          });
        });
      }

      // Process Streams
      if (result.resources.streams) {
        result.resources.streams.forEach((stream: any) => {
          resources.push({
            id: stream.id,
            name: stream.display_name,
            type: 'Stream',
            service: 'OCI Streaming',
            region: region,
            state: stream.lifecycle_state,
            compartmentName: stream.compartment_name,
            costDetails: {
              type: 'streaming'
            }
          });
        });
      }

      // Process Notification Topics
      if (result.resources.topics) {
        result.resources.topics.forEach((topic: any) => {
          resources.push({
            id: topic.id,
            name: topic.display_name,
            type: 'Notification Topic',
            service: 'OCI Notifications',
            region: region,
            state: topic.lifecycle_state,
            compartmentName: topic.compartment_name,
            costDetails: {
              type: 'notification-topic'
            }
          });
        });
      }

      // Process Monitoring Alarms
      if (result.resources.alarms) {
        result.resources.alarms.forEach((alarm: any) => {
          resources.push({
            id: alarm.id,
            name: alarm.display_name,
            type: 'Monitoring Alarm',
            service: 'OCI Monitoring',
            region: region,
            state: alarm.lifecycle_state,
            compartmentName: alarm.compartment_name,
            costDetails: {
              type: 'monitoring-alarm'
            }
          });
        });
      }

      // Process Budgets
      if (result.resources.budgets) {
        result.resources.budgets.forEach((budget: any) => {
          resources.push({
            id: budget.id,
            name: budget.display_name,
            type: 'Budget',
            service: 'OCI Budget',
            region: region,
            state: budget.lifecycle_state,
            compartmentName: budget.compartment_name,
            costDetails: {
              type: 'budget'
            }
          });
        });
      }

      // Process Users
      if (result.resources.users) {
        result.resources.users.forEach((user: any) => {
          resources.push({
            id: user.id,
            name: user.display_name,
            type: 'User',
            service: 'OCI Identity',
            region: region,
            state: user.lifecycle_state,
            compartmentName: user.compartment_name,
            costDetails: {
              type: 'identity-user'
            }
          });
        });
      }

      // Process Groups
      if (result.resources.groups) {
        result.resources.groups.forEach((group: any) => {
          resources.push({
            id: group.id,
            name: group.display_name,
            type: 'Group',
            service: 'OCI Identity',
            region: region,
            state: group.lifecycle_state,
            compartmentName: group.compartment_name,
            costDetails: {
              type: 'identity-group'
            }
          });
        });
      }

      // Process Dynamic Groups
      if (result.resources.dynamic_groups) {
        result.resources.dynamic_groups.forEach((dg: any) => {
          resources.push({
            id: dg.id,
            name: dg.display_name,
            type: 'Dynamic Group',
            service: 'OCI Identity',
            region: region,
            state: dg.lifecycle_state,
            compartmentName: dg.compartment_name,
            costDetails: {
              type: 'identity-dynamic-group'
            }
          });
        });
      }

      // Process VCNs
      if (result.resources.vcns) {
        result.resources.vcns.forEach((vcn: any) => {
          resources.push({
            id: vcn.id,
            name: vcn.display_name,
            type: 'VCN',
            service: 'OCI Network',
            region: region,
            state: vcn.lifecycle_state,
            compartmentName: vcn.compartment_name,
            costDetails: {
              cidrBlock: vcn.cidr_block
            }
          });
        });
      }

      // Process Subnets
      if (result.resources.subnets) {
        result.resources.subnets.forEach((subnet: any) => {
          resources.push({
            id: subnet.id,
            name: subnet.display_name,
            type: 'Subnet',
            service: 'OCI Network',
            region: region,
            state: subnet.lifecycle_state,
            compartmentName: subnet.compartment_name,
            costDetails: {
              cidrBlock: subnet.cidr_block,
              availabilityDomain: subnet.availability_domain
            }
          });
        });
      }

      // Process Security Lists
      if (result.resources.security_lists) {
        result.resources.security_lists.forEach((sl: any) => {
          resources.push({
            id: sl.id,
            name: sl.display_name,
            type: 'Security List',
            service: 'OCI Network',
            region: region,
            state: sl.lifecycle_state,
            compartmentName: sl.compartment_name,
            costDetails: {
              vcnId: sl.vcn_id
            }
          });
        });
      }

      // Process Route Tables
      if (result.resources.route_tables) {
        result.resources.route_tables.forEach((rt: any) => {
          resources.push({
            id: rt.id,
            name: rt.display_name,
            type: 'Route Table',
            service: 'OCI Network',
            region: region,
            state: rt.lifecycle_state,
            compartmentName: rt.compartment_name,
            costDetails: {
              vcnId: rt.vcn_id
            }
          });
        });
      }

      // Process Internet Gateways
      if (result.resources.internet_gateways) {
        result.resources.internet_gateways.forEach((ig: any) => {
          resources.push({
            id: ig.id,
            name: ig.display_name,
            type: 'Internet Gateway',
            service: 'OCI Network',
            region: region,
            state: ig.lifecycle_state,
            compartmentName: ig.compartment_name,
            costDetails: {
              vcnId: ig.vcn_id
            }
          });
        });
      }

      // Process NAT Gateways
      if (result.resources.nat_gateways) {
        result.resources.nat_gateways.forEach((nat: any) => {
          resources.push({
            id: nat.id,
            name: nat.display_name,
            type: 'NAT Gateway',
            service: 'OCI Network',
            region: region,
            state: nat.lifecycle_state,
            compartmentName: nat.compartment_name,
            costDetails: {
              vcnId: nat.vcn_id
            }
          });
        });
      }

      // Process Service Gateways
      if (result.resources.service_gateways) {
        result.resources.service_gateways.forEach((sg: any) => {
          resources.push({
            id: sg.id,
            name: sg.display_name,
            type: 'Service Gateway',
            service: 'OCI Network',
            region: region,
            state: sg.lifecycle_state,
            compartmentName: sg.compartment_name,
            costDetails: {
              vcnId: sg.vcn_id
            }
          });
        });
      }

      // Process Network Security Groups
      if (result.resources.network_security_groups) {
        result.resources.network_security_groups.forEach((nsg: any) => {
          resources.push({
            id: nsg.id,
            name: nsg.display_name,
            type: 'Network Security Group',
            service: 'OCI Network',
            region: region,
            state: nsg.lifecycle_state,
            compartmentName: nsg.compartment_name,
            costDetails: {
              vcnId: nsg.vcn_id
            }
          });
        });
      }

      // Process Images
      if (result.resources.images) {
        result.resources.images.forEach((image: any) => {
          resources.push({
            id: image.id,
            name: image.display_name,
            type: 'Image',
            service: 'OCI Compute',
            region: region,
            state: image.lifecycle_state,
            compartmentName: image.compartment_name,
            costDetails: {
              operatingSystem: image.operating_system,
              operatingSystemVersion: image.operating_system_version
            }
          });
        });
      }

      // Process Volume Groups
      if (result.resources.volume_groups) {
        result.resources.volume_groups.forEach((vg: any) => {
          resources.push({
            id: vg.id,
            name: vg.display_name,
            type: 'Volume Group',
            service: 'OCI Storage',
            region: region,
            state: vg.lifecycle_state,
            compartmentName: vg.compartment_name,
            costDetails: {
              availabilityDomain: vg.availability_domain
            }
          });
        });
      }

      // Process Boot Volumes
      if (result.resources.boot_volumes) {
        result.resources.boot_volumes.forEach((bv: any) => {
          resources.push({
            id: bv.id,
            name: bv.display_name,
            type: 'Boot Volume',
            service: 'OCI Storage',
            region: region,
            state: bv.lifecycle_state,
            compartmentName: bv.compartment_name,
            costDetails: {
              sizeInGBs: bv.size_in_gbs,
              availabilityDomain: bv.availability_domain
            }
          });
        });
      }

      // Process Backups
      if (result.resources.backups) {
        result.resources.backups.forEach((backup: any) => {
          resources.push({
            id: backup.id,
            name: backup.display_name,
            type: 'Volume Backup',
            service: 'OCI Storage',
            region: region,
            state: backup.lifecycle_state,
            compartmentName: backup.compartment_name,
            costDetails: {
              sizeInGBs: backup.size_in_gbs,
              volumeId: backup.volume_id
            }
          });
        });
      }

      // Process DB Systems
      if (result.resources.db_systems) {
        result.resources.db_systems.forEach((db: any) => {
          resources.push({
            id: db.id,
            name: db.display_name,
            type: 'DB System',
            service: 'OCI Database',
            region: region,
            state: db.lifecycle_state,
            compartmentName: db.compartment_name,
            costDetails: {
              shape: db.shape,
              availabilityDomain: db.availability_domain
            }
          });
        });
      }

      // Process Functions
      if (result.resources.functions) {
        result.resources.functions.forEach((func: any) => {
          resources.push({
            id: func.id,
            name: func.display_name,
            type: 'Function',
            service: 'OCI Functions',
            region: region,
            state: func.lifecycle_state,
            compartmentName: func.compartment_name,
            costDetails: {
              type: 'serverless-function'
            }
          });
        });
      }

      // Process Container Instances
      if (result.resources.containers) {
        result.resources.containers.forEach((container: any) => {
          resources.push({
            id: container.id,
            name: container.display_name,
            type: 'Container Instance',
            service: 'OCI Container Instances',
            region: region,
            state: container.lifecycle_state,
            compartmentName: container.compartment_name,
            costDetails: {
              type: 'container-instance'
            }
          });
        });
      }

      // Process Streams
      if (result.resources.streams) {
        result.resources.streams.forEach((stream: any) => {
          resources.push({
            id: stream.id,
            name: stream.display_name,
            type: 'Stream',
            service: 'OCI Streaming',
            region: region,
            state: stream.lifecycle_state,
            compartmentName: stream.compartment_name,
            costDetails: {
              type: 'streaming'
            }
          });
        });
      }

      // Process Notification Topics
      if (result.resources.topics) {
        result.resources.topics.forEach((topic: any) => {
          resources.push({
            id: topic.id,
            name: topic.display_name,
            type: 'Notification Topic',
            service: 'OCI Notifications',
            region: region,
            state: topic.lifecycle_state,
            compartmentName: topic.compartment_name,
            costDetails: {
              type: 'notification-topic'
            }
          });
        });
      }

      // Process Monitoring Alarms
      if (result.resources.alarms) {
        result.resources.alarms.forEach((alarm: any) => {
          resources.push({
            id: alarm.id,
            name: alarm.display_name,
            type: 'Monitoring Alarm',
            service: 'OCI Monitoring',
            region: region,
            state: alarm.lifecycle_state,
            compartmentName: alarm.compartment_name,
            costDetails: {
              type: 'monitoring-alarm'
            }
          });
        });
      }

      // Process Budgets
      if (result.resources.budgets) {
        result.resources.budgets.forEach((budget: any) => {
          resources.push({
            id: budget.id,
            name: budget.display_name,
            type: 'Budget',
            service: 'OCI Budget',
            region: region,
            state: budget.lifecycle_state,
            compartmentName: budget.compartment_name,
            costDetails: {
              type: 'budget'
            }
          });
        });
      }

      // Process Users
      if (result.resources.users) {
        result.resources.users.forEach((user: any) => {
          resources.push({
            id: user.id,
            name: user.display_name,
            type: 'User',
            service: 'OCI Identity',
            region: region,
            state: user.lifecycle_state,
            compartmentName: user.compartment_name,
            costDetails: {
              type: 'identity-user'
            }
          });
        });
      }

      // Process Groups
      if (result.resources.groups) {
        result.resources.groups.forEach((group: any) => {
          resources.push({
            id: group.id,
            name: group.display_name,
            type: 'Group',
            service: 'OCI Identity',
            region: region,
            state: group.lifecycle_state,
            compartmentName: group.compartment_name,
            costDetails: {
              type: 'identity-group'
            }
          });
        });
      }

      // Process Dynamic Groups
      if (result.resources.dynamic_groups) {
        result.resources.dynamic_groups.forEach((dg: any) => {
          resources.push({
            id: dg.id,
            name: dg.display_name,
            type: 'Dynamic Group',
            service: 'OCI Identity',
            region: region,
            state: dg.lifecycle_state,
            compartmentName: dg.compartment_name,
            costDetails: {
              type: 'identity-dynamic-group'
            }
          });
        });
      }

      // Process Kubernetes Clusters
      if (result.resources.kubernetes_clusters) {
        result.resources.kubernetes_clusters.forEach((cluster: any) => {
          resources.push({
            id: cluster.id,
            name: cluster.name,
            type: 'Kubernetes Cluster',
            service: 'OCI Container Engine',
            region: region,
            state: cluster.lifecycle_state,
            compartmentName: cluster.compartment_name,
            costDetails: {
              kubernetesVersion: cluster.kubernetes_version,
              type: 'kubernetes-cluster'
            }
          });
        });
      }

      // Process Container Repositories
      if (result.resources.container_repositories) {
        result.resources.container_repositories.forEach((repo: any) => {
          resources.push({
            id: repo.id,
            name: repo.display_name,
            type: 'Container Repository',
            service: 'OCI Artifacts',
            region: region,
            state: repo.lifecycle_state,
            compartmentName: repo.compartment_name,
            costDetails: {
              type: 'container-repository'
            }
          });
        });
      }

      // Process API Gateways
      if (result.resources.api_gateways) {
        result.resources.api_gateways.forEach((gateway: any) => {
          resources.push({
            id: gateway.id,
            name: gateway.display_name,
            type: 'API Gateway',
            service: 'OCI API Gateway',
            region: region,
            state: gateway.lifecycle_state,
            compartmentName: gateway.compartment_name,
            costDetails: {
              type: 'api-gateway'
            }
          });
        });
      }

      // Process Certificates
      if (result.resources.certificates) {
        result.resources.certificates.forEach((cert: any) => {
          resources.push({
            id: cert.id,
            name: cert.name,
            type: 'Certificate',
            service: 'OCI Certificates',
            region: region,
            state: cert.lifecycle_state,
            compartmentName: cert.compartment_name,
            costDetails: {
              type: 'certificate'
            }
          });
        });
      }

      // Process WAAS Policies
      if (result.resources.waas_policies) {
        result.resources.waas_policies.forEach((policy: any) => {
          resources.push({
            id: policy.id,
            name: policy.display_name,
            type: 'WAAS Policy',
            service: 'OCI WAAS',
            region: region,
            state: policy.lifecycle_state,
            compartmentName: policy.compartment_name,
            costDetails: {
              type: 'waas-policy'
            }
          });
        });
      }

      // Process Bastion Sessions
      if (result.resources.bastion_sessions) {
        result.resources.bastion_sessions.forEach((bastion: any) => {
          resources.push({
            id: bastion.id,
            name: bastion.name,
            type: 'Bastion',
            service: 'OCI Bastion',
            region: region,
            state: bastion.lifecycle_state,
            compartmentName: bastion.compartment_name,
            costDetails: {
              type: 'bastion-service'
            }
          });
        });
      }

      // Process File Systems
      if (result.resources.file_systems) {
        result.resources.file_systems.forEach((fs: any) => {
          resources.push({
            id: fs.id,
            name: fs.display_name,
            type: 'File System',
            service: 'OCI File Storage',
            region: region,
            state: fs.lifecycle_state,
            compartmentName: fs.compartment_name,
            costDetails: {
              availabilityDomain: fs.availability_domain,
              type: 'file-system'
            }
          });
        });
      }

      // Process Vault Secrets
      if (result.resources.vault_secrets) {
        result.resources.vault_secrets.forEach((vault: any) => {
          resources.push({
            id: vault.id,
            name: vault.display_name,
            type: 'Vault',
            service: 'OCI Vault',
            region: region,
            state: vault.lifecycle_state,
            compartmentName: vault.compartment_name,
            costDetails: {
              type: 'vault-service'
            }
          });
        });
      }

      // Process Policies
      if (result.resources.policies) {
        result.resources.policies.forEach((policy: any) => {
          resources.push({
            id: policy.id,
            name: policy.display_name,
            type: 'Policy',
            service: 'OCI Identity',
            region: region,
            state: policy.lifecycle_state,
            compartmentName: policy.compartment_name,
            costDetails: {
              type: 'identity-policy'
            }
          });
        });
      }

      // Calculate summary
      const summary = {
        totalResources: resources.length,
        byService: {} as Record<string, number>,
        byRegion: {} as Record<string, number>,
        byState: {} as Record<string, number>
      };

      resources.forEach(resource => {
        summary.byService[resource.service] = (summary.byService[resource.service] || 0) + 1;
        summary.byRegion[resource.region] = (summary.byRegion[resource.region] || 0) + 1;
        summary.byState[resource.state] = (summary.byState[resource.state] || 0) + 1;
      });

      return {
        resources,
        summary,
        metadata: {
          scanTime: new Date().toISOString(),
          region,
          provider: 'oci'
        }
      };
    } catch (error: any) {
      console.error('Error discovering OCI resources:', error);
      throw new Error(`Failed to discover OCI resources: ${error.message}`);
    }
  }


  private async callPythonScript(operation: string): Promise<any> {
    if (!this.credentials) {
      throw new Error('OCI credentials not provided');
    }

    // Create temporary file for credentials
    const tempFile = path.join('/tmp', `oci_credentials_${Date.now()}.json`);

    try {
      // Parse credentials if they're a string, otherwise use as-is
      let credentials = this.credentials;
      if (typeof this.credentials === 'string') {
        credentials = JSON.parse(this.credentials);
      }

      // Fix escaped newlines in private key for OCI SDK
      const fixedCredentials = {
        ...credentials,
        privateKey: credentials.privateKey ? credentials.privateKey.replace(/\\n/g, '\n') : credentials.privateKey
      };

      // Write credentials to temporary file
      fs.writeFileSync(tempFile, JSON.stringify(fixedCredentials, null, 2));

      // Get the path to the simple OCI Python script (for testing)
      const scriptPath = path.resolve(process.cwd(), 'server', 'services', 'python-scripts', 'oci-simple.py');

      // Execute Python script using virtual environment Python
      const venvPython = path.resolve(process.cwd(), 'oci-env', 'bin', 'python3');
      const { stdout, stderr } = await execAsync(
        `"${venvPython}" "${scriptPath}" --credentials "${tempFile}" --operation "${operation}"`
      );

      if (stderr) {
        console.error('OCI Python stderr:', stderr);
      }

      // Parse the result
      const result = JSON.parse(stdout);

      if (operation === 'validate') {
        return { success: true };
      }

      return result;

    } catch (error) {
      console.error('OCI Python script error:', error);
      throw error;
    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFile);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary credentials file:', cleanupError);
      }
    }
  }


}
