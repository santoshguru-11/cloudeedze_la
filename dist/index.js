var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/services/oci-inventory.ts
var oci_inventory_exports = {};
__export(oci_inventory_exports, {
  OCIInventoryService: () => OCIInventoryService
});
import { exec } from "child_process";
import { promisify as promisify2 } from "util";
import * as fs from "fs";
import * as path from "path";
var execAsync, OCIInventoryService;
var init_oci_inventory = __esm({
  "server/services/oci-inventory.ts"() {
    "use strict";
    execAsync = promisify2(exec);
    OCIInventoryService = class {
      credentials;
      constructor(credentials) {
        this.credentials = credentials;
      }
      async validateCredentials() {
        if (!this.credentials) {
          throw new Error("OCI credentials not provided");
        }
        try {
          const result = await this.callPythonScript("validate");
          return result.success === true;
        } catch (error) {
          console.error("OCI credential validation failed:", error);
          return false;
        }
      }
      async discoverResources() {
        if (!this.credentials) {
          throw new Error("OCI credentials not provided");
        }
        console.log("OCI inventory service: discovering real OCI resources");
        try {
          const result = await this.callPythonScript("discover");
          console.log("OCI Python script result:", JSON.stringify(result, null, 2));
          if (!result.success) {
            throw new Error(result.error || "Failed to discover OCI resources");
          }
          const region = this.credentials?.region || "us-phoenix-1";
          const resources = [];
          if (result.resources.compute_instances) {
            result.resources.compute_instances.forEach((instance) => {
              resources.push({
                id: instance.id,
                name: instance.display_name,
                type: instance.shape,
                service: "OCI Compute",
                region,
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
          if (result.resources.block_volumes) {
            result.resources.block_volumes.forEach((volume) => {
              resources.push({
                id: volume.id,
                name: volume.display_name,
                type: "Block Volume",
                service: "OCI Storage",
                region,
                state: volume.lifecycle_state,
                compartmentName: volume.compartment_name,
                costDetails: {
                  size: volume.size_in_gbs,
                  storage: volume.size_in_gbs
                }
              });
            });
          }
          if (result.resources.object_storage_buckets) {
            result.resources.object_storage_buckets.forEach((bucket) => {
              resources.push({
                id: bucket.id,
                name: bucket.name,
                type: "Bucket",
                service: "OCI Storage",
                region,
                state: "ACTIVE",
                compartmentName: bucket.compartment_name,
                costDetails: {
                  type: "object-storage"
                }
              });
            });
          }
          if (result.resources.autonomous_databases) {
            result.resources.autonomous_databases.forEach((db2) => {
              resources.push({
                id: db2.id,
                name: db2.display_name,
                type: db2.db_workload,
                service: "OCI Database",
                region,
                state: db2.lifecycle_state,
                compartmentName: db2.compartment_name,
                costDetails: {
                  cpuCoreCount: db2.cpu_core_count,
                  dataStorageSizeInTBs: db2.data_storage_size_in_tbs,
                  dbWorkload: db2.db_workload
                }
              });
            });
          }
          if (result.resources.load_balancers) {
            result.resources.load_balancers.forEach((lb) => {
              resources.push({
                id: lb.id,
                name: lb.display_name,
                type: "Load Balancer",
                service: "OCI Load Balancer",
                region,
                state: lb.lifecycle_state,
                compartmentName: lb.compartment_name,
                costDetails: {
                  shapeName: lb.shape_name,
                  bandwidthMbps: lb.shape_details?.minimum_bandwidth_in_mbps
                }
              });
            });
          }
          if (result.resources.vcns) {
            result.resources.vcns.forEach((vcn) => {
              resources.push({
                id: vcn.id,
                name: vcn.display_name,
                type: "VCN",
                service: "OCI Network",
                region,
                state: vcn.lifecycle_state,
                compartmentName: vcn.compartment_name,
                costDetails: {
                  cidrBlock: vcn.cidr_block
                }
              });
            });
          }
          if (result.resources.subnets) {
            result.resources.subnets.forEach((subnet) => {
              resources.push({
                id: subnet.id,
                name: subnet.display_name,
                type: "Subnet",
                service: "OCI Network",
                region,
                state: subnet.lifecycle_state,
                compartmentName: subnet.compartment_name,
                costDetails: {
                  cidrBlock: subnet.cidr_block,
                  availabilityDomain: subnet.availability_domain
                }
              });
            });
          }
          if (result.resources.security_lists) {
            result.resources.security_lists.forEach((sl) => {
              resources.push({
                id: sl.id,
                name: sl.display_name,
                type: "Security List",
                service: "OCI Network",
                region,
                state: sl.lifecycle_state,
                compartmentName: sl.compartment_name,
                costDetails: {
                  vcnId: sl.vcn_id
                }
              });
            });
          }
          if (result.resources.route_tables) {
            result.resources.route_tables.forEach((rt) => {
              resources.push({
                id: rt.id,
                name: rt.display_name,
                type: "Route Table",
                service: "OCI Network",
                region,
                state: rt.lifecycle_state,
                compartmentName: rt.compartment_name,
                costDetails: {
                  vcnId: rt.vcn_id
                }
              });
            });
          }
          if (result.resources.internet_gateways) {
            result.resources.internet_gateways.forEach((ig) => {
              resources.push({
                id: ig.id,
                name: ig.display_name,
                type: "Internet Gateway",
                service: "OCI Network",
                region,
                state: ig.lifecycle_state,
                compartmentName: ig.compartment_name,
                costDetails: {
                  vcnId: ig.vcn_id
                }
              });
            });
          }
          if (result.resources.nat_gateways) {
            result.resources.nat_gateways.forEach((nat) => {
              resources.push({
                id: nat.id,
                name: nat.display_name,
                type: "NAT Gateway",
                service: "OCI Network",
                region,
                state: nat.lifecycle_state,
                compartmentName: nat.compartment_name,
                costDetails: {
                  vcnId: nat.vcn_id
                }
              });
            });
          }
          if (result.resources.service_gateways) {
            result.resources.service_gateways.forEach((sg) => {
              resources.push({
                id: sg.id,
                name: sg.display_name,
                type: "Service Gateway",
                service: "OCI Network",
                region,
                state: sg.lifecycle_state,
                compartmentName: sg.compartment_name,
                costDetails: {
                  vcnId: sg.vcn_id
                }
              });
            });
          }
          if (result.resources.network_security_groups) {
            result.resources.network_security_groups.forEach((nsg) => {
              resources.push({
                id: nsg.id,
                name: nsg.display_name,
                type: "Network Security Group",
                service: "OCI Network",
                region,
                state: nsg.lifecycle_state,
                compartmentName: nsg.compartment_name,
                costDetails: {
                  vcnId: nsg.vcn_id
                }
              });
            });
          }
          if (result.resources.images) {
            result.resources.images.forEach((image) => {
              resources.push({
                id: image.id,
                name: image.display_name,
                type: "Image",
                service: "OCI Compute",
                region,
                state: image.lifecycle_state,
                compartmentName: image.compartment_name,
                costDetails: {
                  operatingSystem: image.operating_system,
                  operatingSystemVersion: image.operating_system_version
                }
              });
            });
          }
          if (result.resources.volume_groups) {
            result.resources.volume_groups.forEach((vg) => {
              resources.push({
                id: vg.id,
                name: vg.display_name,
                type: "Volume Group",
                service: "OCI Storage",
                region,
                state: vg.lifecycle_state,
                compartmentName: vg.compartment_name,
                costDetails: {
                  availabilityDomain: vg.availability_domain
                }
              });
            });
          }
          if (result.resources.boot_volumes) {
            result.resources.boot_volumes.forEach((bv) => {
              resources.push({
                id: bv.id,
                name: bv.display_name,
                type: "Boot Volume",
                service: "OCI Storage",
                region,
                state: bv.lifecycle_state,
                compartmentName: bv.compartment_name,
                costDetails: {
                  sizeInGBs: bv.size_in_gbs,
                  availabilityDomain: bv.availability_domain
                }
              });
            });
          }
          if (result.resources.backups) {
            result.resources.backups.forEach((backup) => {
              resources.push({
                id: backup.id,
                name: backup.display_name,
                type: "Volume Backup",
                service: "OCI Storage",
                region,
                state: backup.lifecycle_state,
                compartmentName: backup.compartment_name,
                costDetails: {
                  sizeInGBs: backup.size_in_gbs,
                  volumeId: backup.volume_id
                }
              });
            });
          }
          if (result.resources.db_systems) {
            result.resources.db_systems.forEach((db2) => {
              resources.push({
                id: db2.id,
                name: db2.display_name,
                type: "DB System",
                service: "OCI Database",
                region,
                state: db2.lifecycle_state,
                compartmentName: db2.compartment_name,
                costDetails: {
                  shape: db2.shape,
                  availabilityDomain: db2.availability_domain
                }
              });
            });
          }
          if (result.resources.functions) {
            result.resources.functions.forEach((func) => {
              resources.push({
                id: func.id,
                name: func.display_name,
                type: "Function",
                service: "OCI Functions",
                region,
                state: func.lifecycle_state,
                compartmentName: func.compartment_name,
                costDetails: {
                  type: "serverless-function"
                }
              });
            });
          }
          if (result.resources.containers) {
            result.resources.containers.forEach((container) => {
              resources.push({
                id: container.id,
                name: container.display_name,
                type: "Container Instance",
                service: "OCI Container Instances",
                region,
                state: container.lifecycle_state,
                compartmentName: container.compartment_name,
                costDetails: {
                  type: "container-instance"
                }
              });
            });
          }
          if (result.resources.streams) {
            result.resources.streams.forEach((stream) => {
              resources.push({
                id: stream.id,
                name: stream.display_name,
                type: "Stream",
                service: "OCI Streaming",
                region,
                state: stream.lifecycle_state,
                compartmentName: stream.compartment_name,
                costDetails: {
                  type: "streaming"
                }
              });
            });
          }
          if (result.resources.topics) {
            result.resources.topics.forEach((topic) => {
              resources.push({
                id: topic.id,
                name: topic.display_name,
                type: "Notification Topic",
                service: "OCI Notifications",
                region,
                state: topic.lifecycle_state,
                compartmentName: topic.compartment_name,
                costDetails: {
                  type: "notification-topic"
                }
              });
            });
          }
          if (result.resources.alarms) {
            result.resources.alarms.forEach((alarm) => {
              resources.push({
                id: alarm.id,
                name: alarm.display_name,
                type: "Monitoring Alarm",
                service: "OCI Monitoring",
                region,
                state: alarm.lifecycle_state,
                compartmentName: alarm.compartment_name,
                costDetails: {
                  type: "monitoring-alarm"
                }
              });
            });
          }
          if (result.resources.budgets) {
            result.resources.budgets.forEach((budget) => {
              resources.push({
                id: budget.id,
                name: budget.display_name,
                type: "Budget",
                service: "OCI Budget",
                region,
                state: budget.lifecycle_state,
                compartmentName: budget.compartment_name,
                costDetails: {
                  type: "budget"
                }
              });
            });
          }
          if (result.resources.users) {
            result.resources.users.forEach((user) => {
              resources.push({
                id: user.id,
                name: user.display_name,
                type: "User",
                service: "OCI Identity",
                region,
                state: user.lifecycle_state,
                compartmentName: user.compartment_name,
                costDetails: {
                  type: "identity-user"
                }
              });
            });
          }
          if (result.resources.groups) {
            result.resources.groups.forEach((group) => {
              resources.push({
                id: group.id,
                name: group.display_name,
                type: "Group",
                service: "OCI Identity",
                region,
                state: group.lifecycle_state,
                compartmentName: group.compartment_name,
                costDetails: {
                  type: "identity-group"
                }
              });
            });
          }
          if (result.resources.dynamic_groups) {
            result.resources.dynamic_groups.forEach((dg) => {
              resources.push({
                id: dg.id,
                name: dg.display_name,
                type: "Dynamic Group",
                service: "OCI Identity",
                region,
                state: dg.lifecycle_state,
                compartmentName: dg.compartment_name,
                costDetails: {
                  type: "identity-dynamic-group"
                }
              });
            });
          }
          if (result.resources.vcns) {
            result.resources.vcns.forEach((vcn) => {
              resources.push({
                id: vcn.id,
                name: vcn.display_name,
                type: "VCN",
                service: "OCI Network",
                region,
                state: vcn.lifecycle_state,
                compartmentName: vcn.compartment_name,
                costDetails: {
                  cidrBlock: vcn.cidr_block
                }
              });
            });
          }
          if (result.resources.subnets) {
            result.resources.subnets.forEach((subnet) => {
              resources.push({
                id: subnet.id,
                name: subnet.display_name,
                type: "Subnet",
                service: "OCI Network",
                region,
                state: subnet.lifecycle_state,
                compartmentName: subnet.compartment_name,
                costDetails: {
                  cidrBlock: subnet.cidr_block,
                  availabilityDomain: subnet.availability_domain
                }
              });
            });
          }
          if (result.resources.security_lists) {
            result.resources.security_lists.forEach((sl) => {
              resources.push({
                id: sl.id,
                name: sl.display_name,
                type: "Security List",
                service: "OCI Network",
                region,
                state: sl.lifecycle_state,
                compartmentName: sl.compartment_name,
                costDetails: {
                  vcnId: sl.vcn_id
                }
              });
            });
          }
          if (result.resources.route_tables) {
            result.resources.route_tables.forEach((rt) => {
              resources.push({
                id: rt.id,
                name: rt.display_name,
                type: "Route Table",
                service: "OCI Network",
                region,
                state: rt.lifecycle_state,
                compartmentName: rt.compartment_name,
                costDetails: {
                  vcnId: rt.vcn_id
                }
              });
            });
          }
          if (result.resources.internet_gateways) {
            result.resources.internet_gateways.forEach((ig) => {
              resources.push({
                id: ig.id,
                name: ig.display_name,
                type: "Internet Gateway",
                service: "OCI Network",
                region,
                state: ig.lifecycle_state,
                compartmentName: ig.compartment_name,
                costDetails: {
                  vcnId: ig.vcn_id
                }
              });
            });
          }
          if (result.resources.nat_gateways) {
            result.resources.nat_gateways.forEach((nat) => {
              resources.push({
                id: nat.id,
                name: nat.display_name,
                type: "NAT Gateway",
                service: "OCI Network",
                region,
                state: nat.lifecycle_state,
                compartmentName: nat.compartment_name,
                costDetails: {
                  vcnId: nat.vcn_id
                }
              });
            });
          }
          if (result.resources.service_gateways) {
            result.resources.service_gateways.forEach((sg) => {
              resources.push({
                id: sg.id,
                name: sg.display_name,
                type: "Service Gateway",
                service: "OCI Network",
                region,
                state: sg.lifecycle_state,
                compartmentName: sg.compartment_name,
                costDetails: {
                  vcnId: sg.vcn_id
                }
              });
            });
          }
          if (result.resources.network_security_groups) {
            result.resources.network_security_groups.forEach((nsg) => {
              resources.push({
                id: nsg.id,
                name: nsg.display_name,
                type: "Network Security Group",
                service: "OCI Network",
                region,
                state: nsg.lifecycle_state,
                compartmentName: nsg.compartment_name,
                costDetails: {
                  vcnId: nsg.vcn_id
                }
              });
            });
          }
          if (result.resources.images) {
            result.resources.images.forEach((image) => {
              resources.push({
                id: image.id,
                name: image.display_name,
                type: "Image",
                service: "OCI Compute",
                region,
                state: image.lifecycle_state,
                compartmentName: image.compartment_name,
                costDetails: {
                  operatingSystem: image.operating_system,
                  operatingSystemVersion: image.operating_system_version
                }
              });
            });
          }
          if (result.resources.volume_groups) {
            result.resources.volume_groups.forEach((vg) => {
              resources.push({
                id: vg.id,
                name: vg.display_name,
                type: "Volume Group",
                service: "OCI Storage",
                region,
                state: vg.lifecycle_state,
                compartmentName: vg.compartment_name,
                costDetails: {
                  availabilityDomain: vg.availability_domain
                }
              });
            });
          }
          if (result.resources.boot_volumes) {
            result.resources.boot_volumes.forEach((bv) => {
              resources.push({
                id: bv.id,
                name: bv.display_name,
                type: "Boot Volume",
                service: "OCI Storage",
                region,
                state: bv.lifecycle_state,
                compartmentName: bv.compartment_name,
                costDetails: {
                  sizeInGBs: bv.size_in_gbs,
                  availabilityDomain: bv.availability_domain
                }
              });
            });
          }
          if (result.resources.backups) {
            result.resources.backups.forEach((backup) => {
              resources.push({
                id: backup.id,
                name: backup.display_name,
                type: "Volume Backup",
                service: "OCI Storage",
                region,
                state: backup.lifecycle_state,
                compartmentName: backup.compartment_name,
                costDetails: {
                  sizeInGBs: backup.size_in_gbs,
                  volumeId: backup.volume_id
                }
              });
            });
          }
          if (result.resources.db_systems) {
            result.resources.db_systems.forEach((db2) => {
              resources.push({
                id: db2.id,
                name: db2.display_name,
                type: "DB System",
                service: "OCI Database",
                region,
                state: db2.lifecycle_state,
                compartmentName: db2.compartment_name,
                costDetails: {
                  shape: db2.shape,
                  availabilityDomain: db2.availability_domain
                }
              });
            });
          }
          if (result.resources.functions) {
            result.resources.functions.forEach((func) => {
              resources.push({
                id: func.id,
                name: func.display_name,
                type: "Function",
                service: "OCI Functions",
                region,
                state: func.lifecycle_state,
                compartmentName: func.compartment_name,
                costDetails: {
                  type: "serverless-function"
                }
              });
            });
          }
          if (result.resources.containers) {
            result.resources.containers.forEach((container) => {
              resources.push({
                id: container.id,
                name: container.display_name,
                type: "Container Instance",
                service: "OCI Container Instances",
                region,
                state: container.lifecycle_state,
                compartmentName: container.compartment_name,
                costDetails: {
                  type: "container-instance"
                }
              });
            });
          }
          if (result.resources.streams) {
            result.resources.streams.forEach((stream) => {
              resources.push({
                id: stream.id,
                name: stream.display_name,
                type: "Stream",
                service: "OCI Streaming",
                region,
                state: stream.lifecycle_state,
                compartmentName: stream.compartment_name,
                costDetails: {
                  type: "streaming"
                }
              });
            });
          }
          if (result.resources.topics) {
            result.resources.topics.forEach((topic) => {
              resources.push({
                id: topic.id,
                name: topic.display_name,
                type: "Notification Topic",
                service: "OCI Notifications",
                region,
                state: topic.lifecycle_state,
                compartmentName: topic.compartment_name,
                costDetails: {
                  type: "notification-topic"
                }
              });
            });
          }
          if (result.resources.alarms) {
            result.resources.alarms.forEach((alarm) => {
              resources.push({
                id: alarm.id,
                name: alarm.display_name,
                type: "Monitoring Alarm",
                service: "OCI Monitoring",
                region,
                state: alarm.lifecycle_state,
                compartmentName: alarm.compartment_name,
                costDetails: {
                  type: "monitoring-alarm"
                }
              });
            });
          }
          if (result.resources.budgets) {
            result.resources.budgets.forEach((budget) => {
              resources.push({
                id: budget.id,
                name: budget.display_name,
                type: "Budget",
                service: "OCI Budget",
                region,
                state: budget.lifecycle_state,
                compartmentName: budget.compartment_name,
                costDetails: {
                  type: "budget"
                }
              });
            });
          }
          if (result.resources.users) {
            result.resources.users.forEach((user) => {
              resources.push({
                id: user.id,
                name: user.display_name,
                type: "User",
                service: "OCI Identity",
                region,
                state: user.lifecycle_state,
                compartmentName: user.compartment_name,
                costDetails: {
                  type: "identity-user"
                }
              });
            });
          }
          if (result.resources.groups) {
            result.resources.groups.forEach((group) => {
              resources.push({
                id: group.id,
                name: group.display_name,
                type: "Group",
                service: "OCI Identity",
                region,
                state: group.lifecycle_state,
                compartmentName: group.compartment_name,
                costDetails: {
                  type: "identity-group"
                }
              });
            });
          }
          if (result.resources.dynamic_groups) {
            result.resources.dynamic_groups.forEach((dg) => {
              resources.push({
                id: dg.id,
                name: dg.display_name,
                type: "Dynamic Group",
                service: "OCI Identity",
                region,
                state: dg.lifecycle_state,
                compartmentName: dg.compartment_name,
                costDetails: {
                  type: "identity-dynamic-group"
                }
              });
            });
          }
          if (result.resources.kubernetes_clusters) {
            result.resources.kubernetes_clusters.forEach((cluster) => {
              resources.push({
                id: cluster.id,
                name: cluster.name,
                type: "Kubernetes Cluster",
                service: "OCI Container Engine",
                region,
                state: cluster.lifecycle_state,
                compartmentName: cluster.compartment_name,
                costDetails: {
                  kubernetesVersion: cluster.kubernetes_version,
                  type: "kubernetes-cluster"
                }
              });
            });
          }
          if (result.resources.container_repositories) {
            result.resources.container_repositories.forEach((repo) => {
              resources.push({
                id: repo.id,
                name: repo.display_name,
                type: "Container Repository",
                service: "OCI Artifacts",
                region,
                state: repo.lifecycle_state,
                compartmentName: repo.compartment_name,
                costDetails: {
                  type: "container-repository"
                }
              });
            });
          }
          if (result.resources.api_gateways) {
            result.resources.api_gateways.forEach((gateway) => {
              resources.push({
                id: gateway.id,
                name: gateway.display_name,
                type: "API Gateway",
                service: "OCI API Gateway",
                region,
                state: gateway.lifecycle_state,
                compartmentName: gateway.compartment_name,
                costDetails: {
                  type: "api-gateway"
                }
              });
            });
          }
          if (result.resources.certificates) {
            result.resources.certificates.forEach((cert) => {
              resources.push({
                id: cert.id,
                name: cert.name,
                type: "Certificate",
                service: "OCI Certificates",
                region,
                state: cert.lifecycle_state,
                compartmentName: cert.compartment_name,
                costDetails: {
                  type: "certificate"
                }
              });
            });
          }
          if (result.resources.waas_policies) {
            result.resources.waas_policies.forEach((policy) => {
              resources.push({
                id: policy.id,
                name: policy.display_name,
                type: "WAAS Policy",
                service: "OCI WAAS",
                region,
                state: policy.lifecycle_state,
                compartmentName: policy.compartment_name,
                costDetails: {
                  type: "waas-policy"
                }
              });
            });
          }
          if (result.resources.bastion_sessions) {
            result.resources.bastion_sessions.forEach((bastion) => {
              resources.push({
                id: bastion.id,
                name: bastion.name,
                type: "Bastion",
                service: "OCI Bastion",
                region,
                state: bastion.lifecycle_state,
                compartmentName: bastion.compartment_name,
                costDetails: {
                  type: "bastion-service"
                }
              });
            });
          }
          if (result.resources.file_systems) {
            result.resources.file_systems.forEach((fs4) => {
              resources.push({
                id: fs4.id,
                name: fs4.display_name,
                type: "File System",
                service: "OCI File Storage",
                region,
                state: fs4.lifecycle_state,
                compartmentName: fs4.compartment_name,
                costDetails: {
                  availabilityDomain: fs4.availability_domain,
                  type: "file-system"
                }
              });
            });
          }
          if (result.resources.vault_secrets) {
            result.resources.vault_secrets.forEach((vault) => {
              resources.push({
                id: vault.id,
                name: vault.display_name,
                type: "Vault",
                service: "OCI Vault",
                region,
                state: vault.lifecycle_state,
                compartmentName: vault.compartment_name,
                costDetails: {
                  type: "vault-service"
                }
              });
            });
          }
          if (result.resources.policies) {
            result.resources.policies.forEach((policy) => {
              resources.push({
                id: policy.id,
                name: policy.display_name,
                type: "Policy",
                service: "OCI Identity",
                region,
                state: policy.lifecycle_state,
                compartmentName: policy.compartment_name,
                costDetails: {
                  type: "identity-policy"
                }
              });
            });
          }
          const summary = {
            totalResources: resources.length,
            byService: {},
            byRegion: {},
            byState: {}
          };
          resources.forEach((resource) => {
            summary.byService[resource.service] = (summary.byService[resource.service] || 0) + 1;
            summary.byRegion[resource.region] = (summary.byRegion[resource.region] || 0) + 1;
            summary.byState[resource.state] = (summary.byState[resource.state] || 0) + 1;
          });
          return {
            resources,
            summary,
            metadata: {
              scanTime: (/* @__PURE__ */ new Date()).toISOString(),
              region,
              provider: "oci"
            }
          };
        } catch (error) {
          console.error("Error discovering OCI resources:", error);
          throw new Error(`Failed to discover OCI resources: ${error.message}`);
        }
      }
      async callPythonScript(operation) {
        if (!this.credentials) {
          throw new Error("OCI credentials not provided");
        }
        const tempFile = path.join("/tmp", `oci_credentials_${Date.now()}.json`);
        try {
          let credentials = this.credentials;
          if (typeof this.credentials === "string") {
            credentials = JSON.parse(this.credentials);
          }
          const fixedCredentials = {
            ...credentials,
            privateKey: credentials.privateKey ? credentials.privateKey.replace(/\\n/g, "\n") : credentials.privateKey
          };
          fs.writeFileSync(tempFile, JSON.stringify(fixedCredentials, null, 2));
          const scriptPath = path.resolve(process.cwd(), "server", "services", "python-scripts", "oci-simple.py");
          const venvPython = path.resolve(process.cwd(), "oci-env", "bin", "python3");
          const { stdout, stderr } = await execAsync(
            `"${venvPython}" "${scriptPath}" --credentials "${tempFile}" --operation "${operation}"`
          );
          if (stderr) {
            console.error("OCI Python stderr:", stderr);
          }
          const result = JSON.parse(stdout);
          if (operation === "validate") {
            return { success: true };
          }
          return result;
        } catch (error) {
          console.error("OCI Python script error:", error);
          throw error;
        } finally {
          try {
            fs.unlinkSync(tempFile);
          } catch (cleanupError) {
            console.warn("Failed to clean up temporary credentials file:", cleanupError);
          }
        }
      }
    };
  }
});

// server/index.ts
import "dotenv/config";
import express2 from "express";
import cors from "cors";
import https from "https";
import fs3 from "fs";
import path4 from "path";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cloudCredentials: () => cloudCredentials,
  cloudCredentialsRelations: () => cloudCredentialsRelations,
  costAnalyses: () => costAnalyses,
  costAnalysesRelations: () => costAnalysesRelations,
  infrastructureRequirementsSchema: () => infrastructureRequirementsSchema,
  insertCloudCredentialSchema: () => insertCloudCredentialSchema,
  insertCostAnalysisSchema: () => insertCostAnalysisSchema,
  insertInventoryScanSchema: () => insertInventoryScanSchema,
  inventoryScans: () => inventoryScans,
  inventoryScansRelations: () => inventoryScansRelations,
  sessions: () => sessions,
  users: () => users,
  usersRelations: () => usersRelations
});
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var cloudCredentials = pgTable("cloud_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  provider: varchar("provider").notNull(),
  // aws, azure, gcp, oci
  name: varchar("name").notNull(),
  encryptedCredentials: text("encrypted_credentials").notNull(),
  isValidated: boolean("is_validated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var inventoryScans = pgTable("inventory_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  scanData: jsonb("scan_data").notNull(),
  summary: jsonb("summary").notNull(),
  scanDuration: integer("scan_duration").notNull(),
  // milliseconds
  createdAt: timestamp("created_at").defaultNow()
});
var costAnalyses = pgTable("cost_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  inventoryScanId: varchar("inventory_scan_id"),
  requirements: jsonb("requirements").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  cloudCredentials: many(cloudCredentials),
  inventoryScans: many(inventoryScans),
  costAnalyses: many(costAnalyses)
}));
var cloudCredentialsRelations = relations(cloudCredentials, ({ one }) => ({
  user: one(users, {
    fields: [cloudCredentials.userId],
    references: [users.id]
  })
}));
var inventoryScansRelations = relations(inventoryScans, ({ one, many }) => ({
  user: one(users, {
    fields: [inventoryScans.userId],
    references: [users.id]
  }),
  costAnalyses: many(costAnalyses)
}));
var costAnalysesRelations = relations(costAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [costAnalyses.userId],
    references: [users.id]
  }),
  inventoryScan: one(inventoryScans, {
    fields: [costAnalyses.inventoryScanId],
    references: [inventoryScans.id]
  })
}));
var insertCostAnalysisSchema = createInsertSchema(costAnalyses).pick({
  requirements: true,
  results: true,
  inventoryScanId: true
});
var insertCloudCredentialSchema = createInsertSchema(cloudCredentials).pick({
  provider: true,
  name: true,
  encryptedCredentials: true
});
var insertInventoryScanSchema = createInsertSchema(inventoryScans).pick({
  scanData: true,
  summary: true,
  scanDuration: true
});
var infrastructureRequirementsSchema = z.object({
  // Currency and Licensing
  currency: z.enum(["USD", "INR", "EUR", "KWD"]).default("USD"),
  // USD, Indian Rupee, Euro, Kuwaiti Dinar
  licensing: z.object({
    windows: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1e3).default(0)
    }),
    sqlServer: z.object({
      enabled: z.boolean().default(false),
      edition: z.enum(["express", "standard", "enterprise"]).default("standard"),
      licenses: z.number().min(0).max(1e3).default(0)
    }),
    oracle: z.object({
      enabled: z.boolean().default(false),
      edition: z.enum(["standard", "enterprise"]).default("standard"),
      licenses: z.number().min(0).max(1e3).default(0)
    }),
    vmware: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1e3).default(0)
    }),
    redhat: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1e3).default(0)
    }),
    sap: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1e3).default(0)
    }),
    microsoftOffice365: z.object({
      enabled: z.boolean().default(false),
      licenses: z.number().min(0).max(1e4).default(0)
    })
  }),
  // Compute Services
  compute: z.object({
    vcpus: z.number().min(1).max(128),
    ram: z.number().min(1).max(1024),
    instanceType: z.enum(["general-purpose", "compute-optimized", "memory-optimized", "storage-optimized"]),
    region: z.string().min(1),
    operatingSystem: z.enum(["linux", "windows"]).default("linux"),
    bootVolume: z.object({
      size: z.number().min(8).max(1024).default(30),
      // GB, minimum 8GB for OS
      type: z.enum(["ssd-gp3", "ssd-gp2", "ssd-io2", "hdd-standard"]).default("ssd-gp3"),
      iops: z.number().min(100).max(16e3).default(3e3)
      // only applicable for io2
    }),
    serverless: z.object({
      functions: z.number().min(0).max(1e6).default(0),
      executionTime: z.number().min(0).max(15).default(1)
      // minutes
    }).optional()
  }),
  // Storage Services
  storage: z.object({
    objectStorage: z.object({
      size: z.number().min(0).max(1e5).default(0),
      // GB
      tier: z.enum(["standard", "infrequent-access", "glacier", "deep-archive"]).default("standard"),
      requests: z.number().min(0).max(1e7).default(1e4)
      // per month
    }),
    blockStorage: z.object({
      size: z.number().min(0).max(1e5).default(0),
      // GB
      type: z.enum(["ssd-gp3", "ssd-io2", "hdd-st1"]).default("ssd-gp3"),
      iops: z.number().min(100).max(1e5).default(3e3)
    }),
    fileStorage: z.object({
      size: z.number().min(0).max(1e5).default(0),
      // GB
      performanceMode: z.enum(["general-purpose", "max-io"]).default("general-purpose")
    })
  }),
  // Database Services
  database: z.object({
    relational: z.object({
      engine: z.enum(["mysql", "postgresql", "oracle", "sql-server", "mariadb"]).default("mysql"),
      instanceClass: z.enum(["micro", "small", "medium", "large", "xlarge"]).default("small"),
      storage: z.number().min(0).max(1e4).default(0),
      // GB
      multiAZ: z.boolean().default(false)
    }),
    nosql: z.object({
      engine: z.enum(["dynamodb", "mongodb", "cassandra", "none"]).default("none"),
      readCapacity: z.number().min(0).max(4e4).default(0),
      writeCapacity: z.number().min(0).max(4e4).default(0),
      storage: z.number().min(0).max(1e4).default(0)
      // GB
    }),
    cache: z.object({
      engine: z.enum(["redis", "memcached", "none"]).default("none"),
      instanceClass: z.enum(["micro", "small", "medium", "large"]).default("small"),
      nodes: z.number().min(0).max(100).default(0)
    }),
    dataWarehouse: z.object({
      nodes: z.number().min(0).max(100).default(0),
      nodeType: z.enum(["small", "medium", "large", "xlarge"]).default("small"),
      storage: z.number().min(0).max(1e5).default(0)
      // GB
    })
  }),
  // Networking & CDN
  networking: z.object({
    bandwidth: z.number().min(1).max(1e5),
    loadBalancer: z.enum(["none", "application", "network"]),
    cdn: z.object({
      enabled: z.boolean().default(false),
      requests: z.number().min(0).max(1e7).default(0),
      // per month
      dataTransfer: z.number().min(0).max(1e5).default(0)
      // GB
    }),
    dns: z.object({
      hostedZones: z.number().min(0).max(100).default(0),
      queries: z.number().min(0).max(1e8).default(0)
      // per month
    }),
    vpn: z.object({
      connections: z.number().min(0).max(100).default(0),
      hours: z.number().min(0).max(8760).default(0)
      // per month
    })
  }),
  // Analytics & Big Data
  analytics: z.object({
    dataProcessing: z.object({
      hours: z.number().min(0).max(1e4).default(0),
      // cluster hours per month
      nodeType: z.enum(["small", "medium", "large", "xlarge"]).default("small")
    }),
    streaming: z.object({
      shards: z.number().min(0).max(1e3).default(0),
      records: z.number().min(0).max(1e9).default(0)
      // per month
    }),
    businessIntelligence: z.object({
      users: z.number().min(0).max(1e4).default(0),
      queries: z.number().min(0).max(1e6).default(0)
      // per month
    })
  }),
  // Machine Learning & AI
  ai: z.object({
    training: z.object({
      hours: z.number().min(0).max(1e4).default(0),
      // compute hours per month
      instanceType: z.enum(["cpu", "gpu-small", "gpu-large"]).default("cpu")
    }),
    inference: z.object({
      requests: z.number().min(0).max(1e7).default(0),
      // per month
      instanceType: z.enum(["cpu", "gpu-small", "gpu-large"]).default("cpu")
    }),
    prebuilt: z.object({
      imageAnalysis: z.number().min(0).max(1e6).default(0),
      // images per month
      textProcessing: z.number().min(0).max(1e7).default(0),
      // characters per month
      speechServices: z.number().min(0).max(1e6).default(0)
      // requests per month
    })
  }),
  // Security & Identity
  security: z.object({
    webFirewall: z.object({
      enabled: z.boolean().default(false),
      requests: z.number().min(0).max(1e9).default(0)
      // per month
    }),
    identityManagement: z.object({
      users: z.number().min(0).max(1e6).default(0),
      authentications: z.number().min(0).max(1e7).default(0)
      // per month
    }),
    keyManagement: z.object({
      keys: z.number().min(0).max(1e5).default(0),
      operations: z.number().min(0).max(1e7).default(0)
      // per month
    }),
    threatDetection: z.object({
      enabled: z.boolean().default(false),
      events: z.number().min(0).max(1e7).default(0)
      // per month
    })
  }),
  // Management & Monitoring
  monitoring: z.object({
    metrics: z.number().min(0).max(1e6).default(0),
    // custom metrics
    logs: z.number().min(0).max(1e3).default(0),
    // GB ingested per month
    traces: z.number().min(0).max(1e7).default(0),
    // traces per month
    alerts: z.number().min(0).max(1e4).default(0)
    // alert notifications per month
  }),
  // Developer Tools & DevOps
  devops: z.object({
    cicd: z.object({
      buildMinutes: z.number().min(0).max(1e5).default(0),
      // per month
      parallelJobs: z.number().min(0).max(100).default(0)
    }),
    containerRegistry: z.object({
      storage: z.number().min(0).max(1e4).default(0),
      // GB
      pulls: z.number().min(0).max(1e6).default(0)
      // per month
    }),
    apiManagement: z.object({
      requests: z.number().min(0).max(1e9).default(0),
      // per month
      endpoints: z.number().min(0).max(1e4).default(0)
    })
  }),
  // Migration & Backup
  backup: z.object({
    storage: z.number().min(0).max(1e5).default(0),
    // GB
    frequency: z.enum(["daily", "weekly", "monthly"]).default("daily"),
    retention: z.number().min(7).max(2555).default(30)
    // days
  }),
  // IoT & Edge Computing
  iot: z.object({
    devices: z.number().min(0).max(1e6).default(0),
    messages: z.number().min(0).max(1e9).default(0),
    // per month
    dataProcessing: z.number().min(0).max(1e5).default(0),
    // GB per month
    edgeLocations: z.number().min(0).max(1e3).default(0)
  }),
  // Content & Media
  media: z.object({
    videoStreaming: z.object({
      hours: z.number().min(0).max(1e5).default(0),
      // streaming hours per month
      quality: z.enum(["720p", "1080p", "4k"]).default("1080p")
    }),
    transcoding: z.object({
      minutes: z.number().min(0).max(1e5).default(0),
      // per month
      inputFormat: z.enum(["standard", "hd", "4k"]).default("standard")
    })
  }),
  // Quantum Computing Services
  quantum: z.object({
    processingUnits: z.number().min(0).max(1e3).default(0),
    // QPU hours per month
    quantumAlgorithms: z.enum(["optimization", "simulation", "cryptography", "ml"]).default("optimization"),
    circuitComplexity: z.enum(["basic", "intermediate", "advanced"]).default("basic")
  }),
  // Advanced AI/ML Platform Services
  advancedAI: z.object({
    vectorDatabase: z.object({
      dimensions: z.number().min(0).max(1e7).default(0),
      // vector dimensions stored
      queries: z.number().min(0).max(1e8).default(0)
      // queries per month
    }),
    customChips: z.object({
      tpuHours: z.number().min(0).max(1e5).default(0),
      // TPU hours per month
      inferenceChips: z.number().min(0).max(1e5).default(0)
      // specialized chip hours
    }),
    modelHosting: z.object({
      models: z.number().min(0).max(1e3).default(0),
      // number of models hosted
      requests: z.number().min(0).max(1e9).default(0)
      // inference requests per month
    }),
    ragPipelines: z.object({
      documents: z.number().min(0).max(1e7).default(0),
      // documents processed
      embeddings: z.number().min(0).max(1e8).default(0)
      // embeddings generated per month
    })
  }),
  // Edge Computing & 5G Services
  edge: z.object({
    edgeLocations: z.number().min(0).max(1e4).default(0),
    // number of edge locations
    edgeCompute: z.number().min(0).max(1e5).default(0),
    // edge compute hours per month
    fiveGNetworking: z.object({
      networkSlices: z.number().min(0).max(1e3).default(0),
      // 5G network slices
      privateNetworks: z.number().min(0).max(100).default(0)
      // private 5G networks
    }),
    realTimeProcessing: z.number().min(0).max(1e6).default(0)
    // real-time events per month
  }),
  // Confidential Computing
  confidential: z.object({
    secureEnclaves: z.number().min(0).max(1e4).default(0),
    // secure enclave hours per month
    trustedExecution: z.number().min(0).max(1e5).default(0),
    // trusted execution hours
    privacyPreservingAnalytics: z.number().min(0).max(1e6).default(0),
    // operations per month
    zeroTrustProcessing: z.number().min(0).max(1e5).default(0)
    // GB processed per month
  }),
  // Sustainability & Green Computing
  sustainability: z.object({
    carbonFootprintTracking: z.boolean().default(false),
    renewableEnergyPreference: z.boolean().default(false),
    greenCloudOptimization: z.boolean().default(false),
    carbonOffsetCredits: z.number().min(0).max(1e5).default(0)
    // tons CO2 offset
  }),
  // Advanced Scenarios
  scenarios: z.object({
    disasterRecovery: z.object({
      enabled: z.boolean().default(false),
      rtoHours: z.number().min(1).max(168).default(24),
      // Recovery Time Objective
      rpoMinutes: z.number().min(15).max(1440).default(240),
      // Recovery Point Objective
      backupRegions: z.number().min(1).max(10).default(1)
    }),
    compliance: z.object({
      frameworks: z.array(z.enum(["gdpr", "hipaa", "sox", "pci", "iso27001"])).default([]),
      auditLogging: z.boolean().default(false),
      dataResidency: z.enum(["us", "eu", "asia", "global"]).default("global")
    }),
    migration: z.object({
      sourceProvider: z.enum(["aws", "azure", "gcp", "oracle", "on-premise"]).optional(),
      dataToMigrate: z.number().min(0).max(1e6).default(0),
      // TB
      applicationComplexity: z.enum(["simple", "moderate", "complex"]).default("moderate")
    })
  }),
  // Cost Optimization Preferences
  optimization: z.object({
    reservedInstanceStrategy: z.enum(["none", "conservative", "moderate", "aggressive"]).default("moderate"),
    spotInstanceTolerance: z.number().min(0).max(100).default(10),
    // percentage of workload suitable for spot
    autoScalingAggression: z.enum(["minimal", "moderate", "aggressive"]).default("moderate"),
    costAlerts: z.object({
      enabled: z.boolean().default(true),
      thresholdPercent: z.number().min(5).max(100).default(20),
      // alert when cost exceeds budget by %
      notificationPreference: z.enum(["email", "slack", "webhook"]).default("email")
    })
  })
});

// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and } from "drizzle-orm";

// server/encryption.ts
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
var algorithm = "aes-256-ctr";
var ENCRYPTION_KEY = process.env.SESSION_SECRET || "default-encryption-key";
var scryptAsync = promisify(scrypt);
function encryptSync(text2) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0")).subarray(0, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text2, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
function decryptSync(encryptedText) {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0")).subarray(0, 32);
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// server/storage.ts
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  async createUser(userData) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  // Cost analysis operations
  async createCostAnalysis(analysis, userId) {
    const [newAnalysis] = await db.insert(costAnalyses).values({ ...analysis, userId }).returning();
    return newAnalysis;
  }
  async getCostAnalysis(id) {
    const [analysis] = await db.select().from(costAnalyses).where(eq(costAnalyses.id, id));
    return analysis;
  }
  async getAllCostAnalyses(userId) {
    if (userId) {
      return await db.select().from(costAnalyses).where(eq(costAnalyses.userId, userId));
    }
    return await db.select().from(costAnalyses);
  }
  // Cloud credentials operations (with encryption)
  async createCloudCredential(credential, userId) {
    const encryptedCredentials = encryptSync(credential.encryptedCredentials);
    const [newCredential] = await db.insert(cloudCredentials).values({
      ...credential,
      userId,
      encryptedCredentials
    }).returning();
    return {
      ...newCredential,
      encryptedCredentials: credential.encryptedCredentials
    };
  }
  async getUserCloudCredentials(userId) {
    const credentials = await db.select().from(cloudCredentials).where(eq(cloudCredentials.userId, userId));
    return credentials.map((cred) => ({
      ...cred,
      encryptedCredentials: decryptSync(cred.encryptedCredentials)
    }));
  }
  async getCloudCredential(id, userId) {
    const [credential] = await db.select().from(cloudCredentials).where(and(eq(cloudCredentials.id, id), eq(cloudCredentials.userId, userId)));
    if (!credential) {
      return void 0;
    }
    return {
      ...credential,
      encryptedCredentials: decryptSync(credential.encryptedCredentials)
    };
  }
  async updateCredentialValidation(id, userId, isValidated) {
    await db.update(cloudCredentials).set({ isValidated }).where(and(eq(cloudCredentials.id, id), eq(cloudCredentials.userId, userId)));
  }
  async updateCloudCredential(id, updates) {
    const updateData = { ...updates };
    if (updates.encryptedCredentials) {
      updateData.encryptedCredentials = encryptSync(updates.encryptedCredentials);
    }
    const [updatedCredential] = await db.update(cloudCredentials).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(cloudCredentials.id, id)).returning();
    if (updatedCredential && updatedCredential.encryptedCredentials) {
      return {
        ...updatedCredential,
        encryptedCredentials: decryptSync(updatedCredential.encryptedCredentials)
      };
    }
    return updatedCredential;
  }
  async deleteCloudCredential(id) {
    const result = await db.delete(cloudCredentials).where(eq(cloudCredentials.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }
  // Inventory scan operations
  async createInventoryScan(scan, userId) {
    const [newScan] = await db.insert(inventoryScans).values({ ...scan, userId }).returning();
    return newScan;
  }
  async getUserInventoryScans(userId) {
    return await db.select().from(inventoryScans).where(eq(inventoryScans.userId, userId)).orderBy(inventoryScans.createdAt);
  }
  async getInventoryScan(id) {
    const [scan] = await db.select().from(inventoryScans).where(eq(inventoryScans.id, id));
    return scan;
  }
};
var storage = new DatabaseStorage();

// server/utils/comprehensiveCostCalculator.ts
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var ComprehensiveCostCalculator = class {
  pricing;
  constructor() {
    try {
      this.pricing = JSON.parse(readFileSync(join(__dirname, "../data/comprehensive-pricing.json"), "utf8"));
    } catch (error) {
      console.error("Error loading pricing data:", error);
      this.pricing = {};
    }
  }
  calculateCosts(requirements) {
    const providers = ["aws", "azure", "gcp", "oracle"];
    const results = [];
    const regionMultiplier = this.pricing.regions[requirements.compute.region]?.multiplier || 1;
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
        licensing: licensingCosts
      };
      const optimizationMultiplier = this.calculateOptimizationMultiplier(provider, requirements);
      const sustainabilityMultiplier = this.getSustainabilityMultiplier(provider, requirements);
      const baseCost = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
      const total = baseCost * optimizationMultiplier * sustainabilityMultiplier;
      const carbonFootprint = this.calculateCarbonFootprint(provider, total);
      const renewablePercent = this.getRenewableEnergyPercent(provider);
      const currencyRate = this.pricing.currencies[requirements.currency || "USD"]?.rate || 1;
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
        carbonFootprint: Math.round(carbonFootprint * 1e3) / 1e3,
        renewableEnergyPercent: renewablePercent,
        currency: requirements.currency || "USD",
        currencySymbol: this.pricing.currencies[requirements.currency || "USD"]?.symbol || "$"
      });
    }
    results.sort((a, b) => a.total - b.total);
    const cheapest = results[0];
    const mostExpensive = results[results.length - 1];
    const potentialSavings = Math.round((mostExpensive.total - cheapest.total) * 100) / 100;
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
  calculateCompute(provider, req, regionMultiplier) {
    const pricing = this.pricing.compute[provider];
    const instancePricing = pricing[req.compute.instanceType];
    const vcpuCost = req.compute.vcpus * instancePricing.vcpu * 24 * 30;
    const ramCost = req.compute.ram * instancePricing.ram * 24 * 30;
    let baseCost = vcpuCost + ramCost;
    if (req.compute.operatingSystem === "windows") {
      baseCost *= pricing.windows_multiplier;
    }
    let bootVolumeCost = 0;
    if (req.compute.bootVolume) {
      const storagePricing = this.pricing.storage[provider];
      let volumePrice = 0;
      const storageTypeMap = {
        "ssd-gp3": "ssd-gp3",
        "ssd-gp2": "ssd-gp3",
        // Map gp2 to gp3 pricing
        "ssd-io2": "ssd-io2",
        "hdd-standard": "hdd-st1"
      };
      const storageType = storageTypeMap[req.compute.bootVolume.type] || "ssd-gp3";
      volumePrice = storagePricing.block[storageType] || 0.08;
      bootVolumeCost = req.compute.bootVolume.size * volumePrice;
      if (req.compute.bootVolume.type === "ssd-io2" && req.compute.bootVolume.iops > 3e3) {
        const extraIops = req.compute.bootVolume.iops - 3e3;
        const iopsCost = storagePricing.block.iops || 5e-3;
        bootVolumeCost += extraIops * iopsCost;
      }
    }
    let serverlessCost = 0;
    if (req.compute.serverless) {
      const pricingAny = pricing;
      const requestCost = req.compute.serverless.functions * (pricingAny.lambda_per_request || pricingAny.functions_per_request || pricingAny.cloud_functions_per_request || 2e-7);
      const executionCost = req.compute.serverless.functions * req.compute.serverless.executionTime * (pricingAny.lambda_per_gb_second || pricingAny.functions_per_gb_second || 166667e-10);
      serverlessCost = requestCost + executionCost;
    }
    return (baseCost + bootVolumeCost + serverlessCost) * regionMultiplier;
  }
  calculateStorage(provider, req) {
    const pricing = this.pricing.storage[provider];
    let totalCost = 0;
    if (req.storage.objectStorage.size > 0) {
      const storageCost = req.storage.objectStorage.size * pricing.object[req.storage.objectStorage.tier];
      const requestCost = req.storage.objectStorage.requests / 1e3 * pricing.object.requests_per_1k.get;
      totalCost += storageCost + requestCost;
    }
    if (req.storage.blockStorage.size > 0) {
      const storageCost = req.storage.blockStorage.size * pricing.block[req.storage.blockStorage.type];
      const iopsCost = req.storage.blockStorage.iops * pricing.block.iops;
      totalCost += storageCost + iopsCost;
    }
    if (req.storage.fileStorage.size > 0) {
      totalCost += req.storage.fileStorage.size * pricing.file[req.storage.fileStorage.performanceMode];
    }
    return totalCost;
  }
  calculateDatabase(provider, req, regionMultiplier) {
    const pricing = this.pricing.database[provider];
    let totalCost = 0;
    if (req.database.relational.storage > 0) {
      let instanceCost = pricing.relational[req.database.relational.engine][req.database.relational.instanceClass];
      if (req.database.relational.multiAZ) {
        instanceCost *= pricing.relational.multi_az_multiplier;
      }
      const storageCost = req.database.relational.storage * pricing.relational.storage_per_gb;
      totalCost += instanceCost + storageCost;
    }
    if (req.database.nosql.engine !== "none") {
      if (req.database.nosql.engine === "dynamodb") {
        const readCost = req.database.nosql.readCapacity * pricing.nosql.dynamodb.read_capacity_unit;
        const writeCost = req.database.nosql.writeCapacity * pricing.nosql.dynamodb.write_capacity_unit;
        const storageCost = req.database.nosql.storage * pricing.nosql.dynamodb.storage_per_gb;
        totalCost += readCost + writeCost + storageCost;
      } else {
        totalCost += pricing.nosql[req.database.nosql.engine]?.small || 0;
      }
    }
    if (req.database.cache.engine !== "none" && req.database.cache.nodes > 0) {
      const cacheCost = pricing.cache[req.database.cache.engine][req.database.cache.instanceClass] * req.database.cache.nodes;
      totalCost += cacheCost;
    }
    if (req.database.dataWarehouse.nodes > 0) {
      const warehouseCost = pricing.warehouse[req.database.dataWarehouse.nodeType] * req.database.dataWarehouse.nodes;
      const storageCost = req.database.dataWarehouse.storage * pricing.warehouse.storage_per_gb;
      totalCost += warehouseCost + storageCost;
    }
    return totalCost * regionMultiplier;
  }
  calculateNetworking(provider, req) {
    const pricing = this.pricing.networking[provider];
    let totalCost = 0;
    const bandwidthCost = req.networking.bandwidth * pricing.bandwidth;
    const loadBalancerCost = pricing.load_balancer[req.networking.loadBalancer];
    totalCost += bandwidthCost + loadBalancerCost;
    if (req.networking.cdn.enabled && req.networking.cdn.requests > 0) {
      const cdnRequestCost = req.networking.cdn.requests / 1e4 * pricing.cdn.requests_per_10k;
      const cdnDataCost = req.networking.cdn.dataTransfer * pricing.cdn.data_transfer_per_gb;
      totalCost += cdnRequestCost + cdnDataCost;
    }
    if (req.networking.dns.hostedZones > 0) {
      const zoneCost = req.networking.dns.hostedZones * pricing.dns.hosted_zone;
      const queryCost = req.networking.dns.queries / 1e6 * pricing.dns.queries_per_million;
      totalCost += zoneCost + queryCost;
    }
    if (req.networking.vpn.connections > 0) {
      const vpnCost = req.networking.vpn.connections * req.networking.vpn.hours * pricing.vpn.connection_hour;
      totalCost += vpnCost;
    }
    return totalCost;
  }
  calculateAnalytics(provider, req, regionMultiplier) {
    const pricing = this.pricing.analytics[provider];
    let totalCost = 0;
    if (req.analytics.dataProcessing.hours > 0) {
      totalCost += req.analytics.dataProcessing.hours * pricing.data_processing[req.analytics.dataProcessing.nodeType];
    }
    if (req.analytics.streaming.shards > 0) {
      const shardCost = req.analytics.streaming.shards * 24 * 30 * pricing.streaming.shard_hour;
      const recordCost = req.analytics.streaming.records / 1e6 * pricing.streaming.record_per_million;
      totalCost += shardCost + recordCost;
    }
    if (req.analytics.businessIntelligence.users > 0) {
      const userCost = req.analytics.businessIntelligence.users * pricing.business_intelligence.user_per_month;
      const queryCost = req.analytics.businessIntelligence.queries / 1e3 * pricing.business_intelligence.query_per_1k;
      totalCost += userCost + queryCost;
    }
    return totalCost * regionMultiplier;
  }
  calculateAI(provider, req, regionMultiplier) {
    const pricing = this.pricing.ai[provider];
    let totalCost = 0;
    if (req.ai.training.hours > 0) {
      totalCost += req.ai.training.hours * pricing.training[req.ai.training.instanceType];
    }
    if (req.ai.inference.requests > 0) {
      const requestsPerHour = req.ai.inference.requests / 30 / 24;
      totalCost += requestsPerHour * 30 * 24 * pricing.inference[req.ai.inference.instanceType];
    }
    if (req.ai.prebuilt.imageAnalysis > 0) {
      totalCost += req.ai.prebuilt.imageAnalysis / 1e3 * pricing.prebuilt.image_analysis_per_1k;
    }
    if (req.ai.prebuilt.textProcessing > 0) {
      totalCost += req.ai.prebuilt.textProcessing / 1e6 * pricing.prebuilt.text_processing_per_million_chars;
    }
    if (req.ai.prebuilt.speechServices > 0) {
      totalCost += req.ai.prebuilt.speechServices / 1e3 * pricing.prebuilt.speech_per_1k_requests;
    }
    return totalCost * regionMultiplier;
  }
  calculateSecurity(provider, req, regionMultiplier) {
    const pricing = this.pricing.security[provider];
    let totalCost = 0;
    if (req.security.webFirewall.enabled && req.security.webFirewall.requests > 0) {
      totalCost += req.security.webFirewall.requests / 1e6 * pricing.web_firewall_per_million;
    }
    if (req.security.identityManagement.users > 0) {
      const userCost = req.security.identityManagement.users * pricing.identity_per_user;
      const authCost = req.security.identityManagement.authentications * pricing.identity_per_auth;
      totalCost += userCost + authCost;
    }
    if (req.security.keyManagement.keys > 0) {
      const keyCost = req.security.keyManagement.keys * pricing.key_per_key;
      const operationCost = req.security.keyManagement.operations / 1e4 * pricing.key_per_10k_operations;
      totalCost += keyCost + operationCost;
    }
    if (req.security.threatDetection.enabled) {
      totalCost += pricing.threat_detection;
      if (req.security.threatDetection.events > 0) {
        totalCost += req.security.threatDetection.events / 1e6 * pricing.threat_per_million_events;
      }
    }
    return totalCost * regionMultiplier;
  }
  calculateMonitoring(provider, req, regionMultiplier) {
    const pricing = this.pricing.monitoring[provider];
    let totalCost = 0;
    if (req.monitoring.metrics > 0) {
      totalCost += req.monitoring.metrics * pricing.custom_metric;
    }
    if (req.monitoring.logs > 0) {
      totalCost += req.monitoring.logs * pricing.log_ingestion_per_gb;
    }
    if (req.monitoring.traces > 0) {
      totalCost += req.monitoring.traces / 1e6 * pricing.traces_per_million;
    }
    if (req.monitoring.alerts > 0) {
      totalCost += req.monitoring.alerts * pricing.alert_per_notification;
    }
    return totalCost * regionMultiplier;
  }
  calculateDevOps(provider, req, regionMultiplier) {
    const pricing = this.pricing.devops[provider];
    let totalCost = 0;
    if (req.devops.cicd.buildMinutes > 0) {
      totalCost += req.devops.cicd.buildMinutes * pricing.build_per_minute;
      totalCost += req.devops.cicd.parallelJobs * pricing.parallel_job;
    }
    if (req.devops.containerRegistry.storage > 0) {
      totalCost += req.devops.containerRegistry.storage * pricing.container_registry_per_gb;
      totalCost += req.devops.containerRegistry.pulls / 1e3 * pricing.container_pulls_per_1k;
    }
    if (req.devops.apiManagement.requests > 0) {
      totalCost += req.devops.apiManagement.requests / 1e6 * pricing.api_requests_per_million;
      totalCost += req.devops.apiManagement.endpoints * pricing.api_endpoint;
    }
    return totalCost * regionMultiplier;
  }
  calculateBackup(provider, req) {
    const pricing = this.pricing.backup[provider];
    let totalCost = 0;
    if (req.backup.storage > 0) {
      const baseCost = req.backup.storage * pricing.storage_per_gb;
      const frequencyMultiplier = pricing.frequency_multiplier[req.backup.frequency];
      totalCost += baseCost * frequencyMultiplier;
    }
    return totalCost;
  }
  calculateIoT(provider, req, regionMultiplier) {
    const pricing = this.pricing.iot[provider];
    let totalCost = 0;
    if (req.iot.devices > 0) {
      totalCost += req.iot.devices * pricing.device_per_month;
    }
    if (req.iot.messages > 0) {
      totalCost += req.iot.messages / 1e6 * pricing.message_per_million;
    }
    if (req.iot.dataProcessing > 0) {
      totalCost += req.iot.dataProcessing * pricing.data_processing_per_gb;
    }
    if (req.iot.edgeLocations > 0) {
      totalCost += req.iot.edgeLocations * pricing.edge_location;
    }
    return totalCost * regionMultiplier;
  }
  calculateMedia(provider, req, regionMultiplier) {
    const pricing = this.pricing.media[provider];
    let totalCost = 0;
    if (req.media.videoStreaming.hours > 0) {
      totalCost += req.media.videoStreaming.hours * pricing.streaming_per_hour[req.media.videoStreaming.quality];
    }
    if (req.media.transcoding.minutes > 0) {
      totalCost += req.media.transcoding.minutes * pricing.transcoding_per_minute[req.media.transcoding.inputFormat];
    }
    return totalCost * regionMultiplier;
  }
  calculateQuantum(provider, req, regionMultiplier) {
    const pricing = this.pricing.quantum[provider];
    let totalCost = 0;
    if (req.quantum.processingUnits > 0) {
      const complexityMultiplier = pricing.algorithm_complexity[req.quantum.circuitComplexity];
      totalCost += req.quantum.processingUnits * pricing.qpu_hour * complexityMultiplier;
      totalCost += req.quantum.processingUnits * pricing.circuit_optimization;
    }
    return totalCost * regionMultiplier;
  }
  calculateAdvancedAI(provider, req, regionMultiplier) {
    const pricing = this.pricing.advancedAI[provider];
    let totalCost = 0;
    if (req.advancedAI.vectorDatabase.dimensions > 0) {
      totalCost += req.advancedAI.vectorDatabase.dimensions / 1e6 * pricing.vector_db_per_million_dims;
    }
    if (req.advancedAI.vectorDatabase.queries > 0) {
      totalCost += req.advancedAI.vectorDatabase.queries / 1e6 * pricing.vector_queries_per_million;
    }
    totalCost += req.advancedAI.customChips.tpuHours * pricing.tpu_per_hour;
    totalCost += req.advancedAI.customChips.inferenceChips * pricing.inference_chips_per_hour;
    totalCost += req.advancedAI.modelHosting.models * pricing.model_hosting_per_model;
    if (req.advancedAI.modelHosting.requests > 0) {
      totalCost += req.advancedAI.modelHosting.requests / 1e6 * pricing.inference_per_million_requests;
    }
    if (req.advancedAI.ragPipelines.documents > 0) {
      totalCost += req.advancedAI.ragPipelines.documents / 1e3 * pricing.document_processing_per_1k;
    }
    if (req.advancedAI.ragPipelines.embeddings > 0) {
      totalCost += req.advancedAI.ragPipelines.embeddings / 1e6 * pricing.embeddings_per_million;
    }
    return totalCost * regionMultiplier;
  }
  calculateEdge(provider, req, regionMultiplier) {
    const pricing = this.pricing.edge[provider];
    let totalCost = 0;
    totalCost += req.edge.edgeLocations * pricing.edge_location;
    totalCost += req.edge.edgeCompute * pricing.edge_compute_per_hour;
    totalCost += req.edge.fiveGNetworking.networkSlices * pricing["5g_network_slice"];
    totalCost += req.edge.fiveGNetworking.privateNetworks * pricing.private_5g_network;
    if (req.edge.realTimeProcessing > 0) {
      totalCost += req.edge.realTimeProcessing / 1e6 * pricing.realtime_events_per_million;
    }
    return totalCost * regionMultiplier;
  }
  calculateConfidential(provider, req, regionMultiplier) {
    const pricing = this.pricing.confidential[provider];
    let totalCost = 0;
    totalCost += req.confidential.secureEnclaves * pricing.secure_enclave_per_hour;
    totalCost += req.confidential.trustedExecution * pricing.trusted_execution_per_hour;
    if (req.confidential.privacyPreservingAnalytics > 0) {
      totalCost += req.confidential.privacyPreservingAnalytics / 1e6 * pricing.privacy_operations_per_million;
    }
    totalCost += req.confidential.zeroTrustProcessing * pricing.zero_trust_per_gb;
    return totalCost * regionMultiplier;
  }
  calculateSustainability(provider, req) {
    const pricing = this.pricing.sustainability[provider];
    let totalCost = 0;
    if (req.sustainability.carbonFootprintTracking) {
      totalCost += pricing.carbon_tracking;
    }
    if (req.sustainability.greenCloudOptimization) {
    }
    totalCost += req.sustainability.carbonOffsetCredits * pricing.carbon_offset_per_ton;
    return totalCost;
  }
  calculateScenarios(provider, req, regionMultiplier) {
    const pricing = this.pricing.scenarios[provider];
    let totalCost = 0;
    if (req.scenarios.disasterRecovery.enabled) {
      totalCost += pricing.disaster_recovery_base;
      const rtoMultiplier = pricing.dr_rto_multiplier[req.scenarios.disasterRecovery.rtoHours.toString()] || 1;
      const rpoMultiplier = pricing.dr_rpo_multiplier[req.scenarios.disasterRecovery.rpoMinutes.toString()] || 1;
      totalCost *= rtoMultiplier * rpoMultiplier;
      totalCost += (req.scenarios.disasterRecovery.backupRegions - 1) * pricing.disaster_recovery_base * 0.5;
    }
    if (req.scenarios.compliance.frameworks.length > 0) {
      req.scenarios.compliance.frameworks.forEach((framework) => {
        const premium = pricing.compliance_premiums[framework];
        if (premium) {
          totalCost += 1e3 * premium;
        }
      });
    }
    if (req.scenarios.compliance.auditLogging) {
      totalCost += 100 * pricing.audit_logging_per_gb;
    }
    const residencyMultiplier = pricing.data_residency_premium[req.scenarios.compliance.dataResidency];
    totalCost *= residencyMultiplier;
    if (req.scenarios.migration.dataToMigrate > 0) {
      totalCost += pricing.migration_base_cost;
      totalCost += req.scenarios.migration.dataToMigrate * pricing.migration_per_tb;
      const complexityMultiplier = pricing.complexity_multiplier[req.scenarios.migration.applicationComplexity];
      totalCost *= complexityMultiplier;
    }
    return totalCost * regionMultiplier;
  }
  calculateOptimizationMultiplier(provider, req) {
    let multiplier = 1;
    const reservedSavings = {
      none: 1,
      conservative: 0.95,
      // 5% savings
      moderate: 0.88,
      // 12% savings
      aggressive: 0.78
      // 22% savings
    };
    multiplier *= reservedSavings[req.optimization.reservedInstanceStrategy];
    const spotSavings = req.optimization.spotInstanceTolerance / 100 * 0.7;
    multiplier *= 1 - spotSavings;
    const scalingSavings = {
      minimal: 0.98,
      // 2% savings
      moderate: 0.92,
      // 8% savings
      aggressive: 0.85
      // 15% savings
    };
    multiplier *= scalingSavings[req.optimization.autoScalingAggression];
    return multiplier;
  }
  getSustainabilityMultiplier(provider, req) {
    const pricing = this.pricing.sustainability[provider];
    let multiplier = 1;
    if (req.sustainability.renewableEnergyPreference) {
      multiplier *= pricing.renewable_energy_premium;
    }
    if (req.sustainability.greenCloudOptimization) {
      multiplier *= pricing.green_optimization;
    }
    return multiplier;
  }
  calculateCarbonFootprint(provider, totalCost) {
    const pricing = this.pricing.sustainability[provider];
    const estimatedKwh = totalCost * 100;
    return estimatedKwh * pricing.co2_per_kwh;
  }
  getRenewableEnergyPercent(provider) {
    const pricing = this.pricing.sustainability[provider];
    return pricing.renewable_percent;
  }
  calculateLicensing(requirements) {
    let totalLicensingCost = 0;
    const licensing = this.pricing.licensing;
    const vcpus = requirements.compute.vcpus;
    if (requirements.licensing?.windows?.enabled) {
      const licenses = requirements.licensing.windows.licenses;
      const pricePerCore = licensing.windows.server_standard;
      totalLicensingCost += licenses * pricePerCore * vcpus;
    }
    if (requirements.licensing?.sqlServer?.enabled) {
      const licenses = requirements.licensing.sqlServer.licenses;
      const edition = requirements.licensing.sqlServer.edition;
      const pricePerCore = licensing.sqlServer[edition];
      totalLicensingCost += licenses * pricePerCore * vcpus;
    }
    if (requirements.licensing?.oracle?.enabled) {
      const licenses = requirements.licensing.oracle.licenses;
      const edition = requirements.licensing.oracle.edition;
      const pricePerCore = licensing.oracle[edition];
      totalLicensingCost += licenses * pricePerCore * vcpus / 12;
    }
    if (requirements.licensing?.vmware?.enabled) {
      const licenses = requirements.licensing.vmware.licenses;
      const pricePerCpu = licensing.vmware.vsphere_standard;
      const cpuSockets = Math.ceil(vcpus / 8);
      totalLicensingCost += licenses * pricePerCpu * cpuSockets / 12;
    }
    if (requirements.licensing?.redhat?.enabled) {
      const licenses = requirements.licensing.redhat.licenses;
      const pricePerSocket = licensing.redhat.enterprise_linux;
      const cpuSockets = Math.ceil(vcpus / 8);
      totalLicensingCost += licenses * pricePerSocket * cpuSockets / 12;
    }
    if (requirements.licensing?.sap?.enabled) {
      const licenses = requirements.licensing.sap.licenses;
      const pricePerLicense = licensing.sap.hana_enterprise;
      totalLicensingCost += licenses * pricePerLicense / 12;
    }
    if (requirements.licensing?.microsoftOffice365?.enabled) {
      const licenses = requirements.licensing.microsoftOffice365.licenses;
      const pricePerUser = licensing.microsoftOffice365.business_premium;
      totalLicensingCost += licenses * pricePerUser;
    }
    return totalLicensingCost;
  }
  calculateMultiCloudOptimization(providers) {
    const categories = ["compute", "storage", "database", "networking", "analytics", "ai", "security", "monitoring", "devops", "backup", "iot", "media", "quantum", "advancedAI", "edge", "confidential", "licensing"];
    const breakdown = {};
    let totalCost = 0;
    categories.forEach((category) => {
      if (category === "licensing") {
        breakdown[category] = "All Providers";
        totalCost += providers[0][category] || 0;
      } else {
        const cheapest = providers.reduce(
          (min, p) => (p[category] || 0) < (min[category] || 0) ? p : min
        );
        breakdown[category] = cheapest.name;
        totalCost += cheapest[category] || 0;
      }
    });
    return {
      cost: Math.round(totalCost * 100) / 100,
      breakdown
    };
  }
};

// server/services/aws-inventory-simple.ts
import AWS from "aws-sdk";
var AWSSimpleInventoryService = class {
  credentials;
  constructor(credentials) {
    this.credentials = credentials;
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
      ...credentials.sessionToken && { sessionToken: credentials.sessionToken }
    });
  }
  async discoverResources() {
    console.log("AWS inventory service: discovering real AWS resources using focused scanning");
    try {
      const [
        ec2Resources,
        s3Resources,
        rdsResources,
        lambdaResources,
        elbResources,
        ebsResources,
        vpcResources,
        securityGroupResources,
        iamResources,
        cloudFormationResources,
        cloudFrontResources,
        route53Resources,
        snsResources,
        sqsResources,
        dynamoDbResources,
        elasticacheResources
      ] = await Promise.all([
        this.discoverEC2Instances(),
        this.discoverS3Buckets(),
        this.discoverRDSInstances(),
        this.discoverLambdaFunctions(),
        this.discoverLoadBalancers(),
        this.discoverEBSVolumes(),
        this.discoverVPCs(),
        this.discoverSecurityGroups(),
        this.discoverIAMUsers(),
        this.discoverCloudFormationStacks(),
        this.discoverCloudFrontDistributions(),
        this.discoverRoute53HostedZones(),
        this.discoverSNSTopics(),
        this.discoverSQSQueues(),
        this.discoverDynamoDBTables(),
        this.discoverElastiCacheClusters()
      ]);
      const allResources = [
        ...ec2Resources,
        ...s3Resources,
        ...rdsResources,
        ...lambdaResources,
        ...elbResources,
        ...ebsResources,
        ...vpcResources,
        ...securityGroupResources,
        ...iamResources,
        ...cloudFormationResources,
        ...cloudFrontResources,
        ...route53Resources,
        ...snsResources,
        ...sqsResources,
        ...dynamoDbResources,
        ...elasticacheResources
      ];
      const services = {};
      const regions = {};
      allResources.forEach((resource) => {
        services[resource.service] = (services[resource.service] || 0) + 1;
        regions[resource.region] = (regions[resource.region] || 0) + 1;
      });
      const summary = {
        totalResources: allResources.length,
        services,
        regions
      };
      console.log(`AWS inventory scan completed: ${allResources.length} resources found across ${Object.keys(services).length} services`);
      return {
        resources: allResources,
        summary,
        scanDate: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Error discovering AWS resources:", error);
      throw new Error(`Failed to discover AWS resources: ${error.message}`);
    }
  }
  async discoverEC2Instances() {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await ec2.describeInstances().promise();
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const tags = {};
          instance.Tags?.forEach((tag) => {
            if (tag.Key && tag.Value) {
              tags[tag.Key] = tag.Value;
            }
          });
          resources.push({
            id: instance.InstanceId || "unknown",
            name: tags.Name || instance.InstanceId || "unnamed",
            type: instance.InstanceType || "unknown",
            service: "EC2",
            region: this.credentials.region,
            tags,
            state: instance.State?.Name || "unknown",
            costDetails: {
              instanceType: instance.InstanceType,
              vcpus: this.getVCPUsFromInstanceType(instance.InstanceType),
              memory: this.getMemoryFromInstanceType(instance.InstanceType)
            }
          });
        }
      }
    } catch (error) {
      console.error("Error discovering EC2 instances:", error);
    }
    return resources;
  }
  async discoverS3Buckets() {
    const s3 = new AWS.S3({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await s3.listBuckets().promise();
      for (const bucket of response.Buckets || []) {
        resources.push({
          id: bucket.Name || "unknown",
          name: bucket.Name || "unnamed",
          type: "Bucket",
          service: "S3",
          region: this.credentials.region,
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering S3 buckets:", error);
    }
    return resources;
  }
  async discoverRDSInstances() {
    const rds = new AWS.RDS({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await rds.describeDBInstances().promise();
      for (const instance of response.DBInstances || []) {
        resources.push({
          id: instance.DBInstanceIdentifier || "unknown",
          name: instance.DBInstanceIdentifier || "unnamed",
          type: instance.DBInstanceClass || "unknown",
          service: "RDS",
          region: this.credentials.region,
          state: instance.DBInstanceStatus || "unknown",
          costDetails: {
            instanceType: instance.DBInstanceClass,
            storage: instance.AllocatedStorage
          }
        });
      }
    } catch (error) {
      console.error("Error discovering RDS instances:", error);
    }
    return resources;
  }
  async discoverLambdaFunctions() {
    const lambda = new AWS.Lambda({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await lambda.listFunctions().promise();
      for (const func of response.Functions || []) {
        resources.push({
          id: func.FunctionArn || "unknown",
          name: func.FunctionName || "unnamed",
          type: "Function",
          service: "Lambda",
          region: this.credentials.region,
          state: func.State || "unknown",
          costDetails: {
            memory: func.MemorySize
          }
        });
      }
    } catch (error) {
      console.error("Error discovering Lambda functions:", error);
    }
    return resources;
  }
  async discoverLoadBalancers() {
    const elbv2 = new AWS.ELBv2({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await elbv2.describeLoadBalancers().promise();
      for (const lb of response.LoadBalancers || []) {
        resources.push({
          id: lb.LoadBalancerArn || "unknown",
          name: lb.LoadBalancerName || "unnamed",
          type: lb.Type || "unknown",
          service: "ELB",
          region: this.credentials.region,
          state: lb.State?.Code || "unknown"
        });
      }
    } catch (error) {
      console.error("Error discovering Load Balancers:", error);
    }
    return resources;
  }
  async discoverEBSVolumes() {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await ec2.describeVolumes().promise();
      for (const volume of response.Volumes || []) {
        const tags = {};
        volume.Tags?.forEach((tag) => {
          if (tag.Key && tag.Value) {
            tags[tag.Key] = tag.Value;
          }
        });
        resources.push({
          id: volume.VolumeId || "unknown",
          name: tags.Name || volume.VolumeId || "unnamed",
          type: volume.VolumeType || "unknown",
          service: "EBS",
          region: this.credentials.region,
          tags,
          state: volume.State || "unknown",
          costDetails: {
            storage: volume.Size
          }
        });
      }
    } catch (error) {
      console.error("Error discovering EBS volumes:", error);
    }
    return resources;
  }
  async discoverVPCs() {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await ec2.describeVpcs().promise();
      for (const vpc of response.Vpcs || []) {
        const tags = {};
        vpc.Tags?.forEach((tag) => {
          if (tag.Key && tag.Value) {
            tags[tag.Key] = tag.Value;
          }
        });
        resources.push({
          id: vpc.VpcId || "unknown",
          name: tags.Name || vpc.VpcId || "unnamed",
          type: "VPC",
          service: "VPC",
          region: this.credentials.region,
          tags,
          state: vpc.State || "unknown"
        });
      }
    } catch (error) {
      console.error("Error discovering VPCs:", error);
    }
    return resources;
  }
  async discoverSecurityGroups() {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await ec2.describeSecurityGroups().promise();
      for (const sg of response.SecurityGroups || []) {
        resources.push({
          id: sg.GroupId || "unknown",
          name: sg.GroupName || "unnamed",
          type: "SecurityGroup",
          service: "EC2",
          region: this.credentials.region,
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering Security Groups:", error);
    }
    return resources;
  }
  async discoverIAMUsers() {
    const iam = new AWS.IAM();
    const resources = [];
    try {
      const response = await iam.listUsers().promise();
      for (const user of response.Users || []) {
        resources.push({
          id: user.UserName || "unknown",
          name: user.UserName || "unnamed",
          type: "User",
          service: "IAM",
          region: "global",
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering IAM Users:", error);
    }
    return resources;
  }
  async discoverCloudFormationStacks() {
    const cloudFormation = new AWS.CloudFormation({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await cloudFormation.listStacks().promise();
      for (const stack of response.StackSummaries || []) {
        resources.push({
          id: stack.StackId || "unknown",
          name: stack.StackName || "unnamed",
          type: "Stack",
          service: "CloudFormation",
          region: this.credentials.region,
          state: stack.StackStatus || "unknown"
        });
      }
    } catch (error) {
      console.error("Error discovering CloudFormation Stacks:", error);
    }
    return resources;
  }
  async discoverCloudFrontDistributions() {
    const cloudFront = new AWS.CloudFront();
    const resources = [];
    try {
      const response = await cloudFront.listDistributions().promise();
      for (const distribution of response.DistributionList?.Items || []) {
        resources.push({
          id: distribution.Id || "unknown",
          name: distribution.DomainName || "unnamed",
          type: "Distribution",
          service: "CloudFront",
          region: "global",
          state: distribution.Status || "unknown"
        });
      }
    } catch (error) {
      console.error("Error discovering CloudFront Distributions:", error);
    }
    return resources;
  }
  async discoverRoute53HostedZones() {
    const route53 = new AWS.Route53();
    const resources = [];
    try {
      const response = await route53.listHostedZones().promise();
      for (const zone of response.HostedZones || []) {
        resources.push({
          id: zone.Id || "unknown",
          name: zone.Name || "unnamed",
          type: "HostedZone",
          service: "Route53",
          region: "global",
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering Route53 Hosted Zones:", error);
    }
    return resources;
  }
  async discoverSNSTopics() {
    const sns = new AWS.SNS({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await sns.listTopics().promise();
      for (const topic of response.Topics || []) {
        resources.push({
          id: topic.TopicArn || "unknown",
          name: topic.TopicArn?.split(":").pop() || "unnamed",
          type: "Topic",
          service: "SNS",
          region: this.credentials.region,
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering SNS Topics:", error);
    }
    return resources;
  }
  async discoverSQSQueues() {
    const sqs = new AWS.SQS({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await sqs.listQueues().promise();
      for (const queueUrl of response.QueueUrls || []) {
        resources.push({
          id: queueUrl || "unknown",
          name: queueUrl.split("/").pop() || "unnamed",
          type: "Queue",
          service: "SQS",
          region: this.credentials.region,
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering SQS Queues:", error);
    }
    return resources;
  }
  async discoverDynamoDBTables() {
    const dynamodb = new AWS.DynamoDB({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await dynamodb.listTables().promise();
      for (const tableName of response.TableNames || []) {
        resources.push({
          id: tableName || "unknown",
          name: tableName || "unnamed",
          type: "Table",
          service: "DynamoDB",
          region: this.credentials.region,
          state: "active"
        });
      }
    } catch (error) {
      console.error("Error discovering DynamoDB Tables:", error);
    }
    return resources;
  }
  async discoverElastiCacheClusters() {
    const elasticache = new AWS.ElastiCache({ region: this.credentials.region });
    const resources = [];
    try {
      const response = await elasticache.describeCacheClusters().promise();
      for (const cluster of response.CacheClusters || []) {
        resources.push({
          id: cluster.CacheClusterId || "unknown",
          name: cluster.CacheClusterId || "unnamed",
          type: cluster.CacheNodeType || "unknown",
          service: "ElastiCache",
          region: this.credentials.region,
          state: cluster.CacheClusterStatus || "unknown"
        });
      }
    } catch (error) {
      console.error("Error discovering ElastiCache Clusters:", error);
    }
    return resources;
  }
  getVCPUsFromInstanceType(instanceType) {
    if (!instanceType) return void 0;
    const vcpuMap = {
      "t2.nano": 1,
      "t2.micro": 1,
      "t2.small": 1,
      "t2.medium": 2,
      "t2.large": 2,
      "t3.nano": 2,
      "t3.micro": 2,
      "t3.small": 2,
      "t3.medium": 2,
      "t3.large": 2,
      "m5.large": 2,
      "m5.xlarge": 4,
      "m5.2xlarge": 8,
      "m5.4xlarge": 16,
      "c5.large": 2,
      "c5.xlarge": 4,
      "c5.2xlarge": 8,
      "c5.4xlarge": 16,
      "r5.large": 2,
      "r5.xlarge": 4,
      "r5.2xlarge": 8,
      "r5.4xlarge": 16
    };
    return vcpuMap[instanceType] || void 0;
  }
  getMemoryFromInstanceType(instanceType) {
    if (!instanceType) return void 0;
    const memoryMap = {
      "t2.nano": 0.5,
      "t2.micro": 1,
      "t2.small": 2,
      "t2.medium": 4,
      "t2.large": 8,
      "t3.nano": 0.5,
      "t3.micro": 1,
      "t3.small": 2,
      "t3.medium": 4,
      "t3.large": 8,
      "m5.large": 8,
      "m5.xlarge": 16,
      "m5.2xlarge": 32,
      "m5.4xlarge": 64,
      "c5.large": 4,
      "c5.xlarge": 8,
      "c5.2xlarge": 16,
      "c5.4xlarge": 32,
      "r5.large": 16,
      "r5.xlarge": 32,
      "r5.2xlarge": 64,
      "r5.4xlarge": 128
    };
    return memoryMap[instanceType] || void 0;
  }
};

// server/services/azure-inventory.ts
import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
var AzureInventoryService = class {
  credentials;
  client;
  constructor(credentials) {
    this.credentials = credentials;
    const credential = new DefaultAzureCredential();
    this.client = new ResourceManagementClient(credential, credentials.subscriptionId);
  }
  async discoverResources() {
    const resources = [];
    const summary = {
      totalResources: 0,
      services: {},
      locations: {},
      resourceGroups: {}
    };
    try {
      const resourceGroups = await this.getResourceGroups();
      for (const rg of resourceGroups) {
        const rgResources = await this.discoverResourcesInGroup(rg.name);
        resources.push(...rgResources);
      }
      summary.totalResources = resources.length;
      resources.forEach((resource) => {
        const service = this.extractServiceFromType(resource.type);
        summary.services[service] = (summary.services[service] || 0) + 1;
        summary.locations[resource.location] = (summary.locations[resource.location] || 0) + 1;
        summary.resourceGroups[resource.resourceGroup] = (summary.resourceGroups[resource.resourceGroup] || 0) + 1;
      });
      return {
        resources,
        summary,
        scanDate: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Error discovering Azure resources:", error);
      throw error;
    }
  }
  async getResourceGroups() {
    const resourceGroups = [];
    for await (const rg of this.client.resourceGroups.list()) {
      resourceGroups.push(rg);
    }
    return resourceGroups;
  }
  async discoverResourcesInGroup(resourceGroupName) {
    const resources = [];
    try {
      for await (const resource of this.client.resources.listByResourceGroup(resourceGroupName)) {
        const azureResource = {
          id: resource.id || "unknown",
          name: resource.name || "unnamed",
          type: resource.type || "unknown",
          service: this.extractServiceFromType(resource.type || ""),
          location: resource.location || "unknown",
          resourceGroup: resourceGroupName,
          tags: resource.tags || {},
          state: "active",
          // Azure doesn't have a direct state concept like AWS
          costDetails: this.extractCostDetails(resource.type || "", resource.name || "")
        };
        resources.push(azureResource);
      }
    } catch (error) {
      console.error(`Error discovering resources in resource group ${resourceGroupName}:`, error);
    }
    return resources;
  }
  extractServiceFromType(resourceType) {
    const parts = resourceType.split("/");
    if (parts.length >= 2) {
      const provider = parts[0].replace("Microsoft.", "");
      return provider;
    }
    return "Unknown";
  }
  extractCostDetails(resourceType, resourceName) {
    const lowerType = resourceType.toLowerCase();
    if (lowerType.includes("virtualmachines")) {
      return {
        size: this.extractVMSize(resourceName),
        vcpus: this.getVCPUsFromVMSize(resourceName),
        memory: this.getMemoryFromVMSize(resourceName)
      };
    } else if (lowerType.includes("storage")) {
      return {
        tier: "Standard",
        // Default, would need additional API calls to get actual tier
        storage: 100
        // Default, would need additional API calls
      };
    } else if (lowerType.includes("database")) {
      return {
        tier: "Standard",
        size: "S1"
        // Default
      };
    }
    return {};
  }
  extractVMSize(resourceName) {
    return "Standard_B2s";
  }
  getVCPUsFromVMSize(vmSize) {
    const vcpuMap = {
      "Standard_B1s": 1,
      "Standard_B2s": 2,
      "Standard_B4ms": 4,
      "Standard_D2s_v3": 2,
      "Standard_D4s_v3": 4,
      "Standard_D8s_v3": 8,
      "Standard_F2s_v2": 2,
      "Standard_F4s_v2": 4,
      "Standard_F8s_v2": 8
    };
    return vcpuMap[vmSize] || 2;
  }
  getMemoryFromVMSize(vmSize) {
    const memoryMap = {
      "Standard_B1s": 1,
      "Standard_B2s": 4,
      "Standard_B4ms": 16,
      "Standard_D2s_v3": 8,
      "Standard_D4s_v3": 16,
      "Standard_D8s_v3": 32,
      "Standard_F2s_v2": 4,
      "Standard_F4s_v2": 8,
      "Standard_F8s_v2": 16
    };
    return memoryMap[vmSize] || 4;
  }
};

// server/services/gcp-inventory.ts
import { AssetServiceClient } from "@google-cloud/asset";
var GCPInventoryService = class {
  credentials;
  client;
  constructor(credentials) {
    this.credentials = credentials;
    const clientOptions = {
      projectId: credentials.projectId
    };
    if (credentials.keyFilename) {
      clientOptions.keyFilename = credentials.keyFilename;
    } else if (credentials.credentials) {
      clientOptions.credentials = credentials.credentials;
    }
    this.client = new AssetServiceClient(clientOptions);
  }
  async discoverResources() {
    const resources = [];
    const summary = {
      totalResources: 0,
      services: {},
      locations: {}
    };
    try {
      const computeResources = await this.discoverComputeInstances();
      resources.push(...computeResources);
      const sqlResources = await this.discoverCloudSQLInstances();
      resources.push(...sqlResources);
      const storageResources = await this.discoverStorageBuckets();
      resources.push(...storageResources);
      const functionResources = await this.discoverCloudFunctions();
      resources.push(...functionResources);
      const gkeResources = await this.discoverGKEClusters();
      resources.push(...gkeResources);
      summary.totalResources = resources.length;
      resources.forEach((resource) => {
        summary.services[resource.service] = (summary.services[resource.service] || 0) + 1;
        summary.locations[resource.location] = (summary.locations[resource.location] || 0) + 1;
      });
      return {
        resources,
        summary,
        scanDate: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch (error) {
      console.error("Error discovering GCP resources:", error);
      throw error;
    }
  }
  async discoverComputeInstances() {
    const resources = [];
    const parent = `projects/${this.credentials.projectId}`;
    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ["compute.googleapis.com/Instance"]
      });
      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const instanceData = asset.resource.data;
          const location = this.extractLocationFromAssetName(asset.name || "");
          resources.push({
            id: instanceData.id || asset.name || "unknown",
            name: instanceData.name || "unnamed",
            type: "Instance",
            service: "Compute Engine",
            location,
            tags: this.extractLabels(instanceData.labels),
            state: instanceData.status || "unknown",
            costDetails: {
              machineType: this.extractMachineType(instanceData.machineType),
              vcpus: this.getVCPUsFromMachineType(instanceData.machineType),
              memory: this.getMemoryFromMachineType(instanceData.machineType)
            }
          });
        }
      }
    } catch (error) {
      console.error("Error discovering Compute Engine instances:", error);
    }
    return resources;
  }
  async discoverCloudSQLInstances() {
    const resources = [];
    const parent = `projects/${this.credentials.projectId}`;
    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ["sqladmin.googleapis.com/Instance"]
      });
      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const instanceData = asset.resource.data;
          const location = instanceData.region || "unknown";
          resources.push({
            id: instanceData.name || asset.name || "unknown",
            name: instanceData.name || "unnamed",
            type: "SQL Instance",
            service: "Cloud SQL",
            location,
            state: instanceData.state || "unknown",
            costDetails: {
              machineType: instanceData.settings?.tier,
              storage: instanceData.settings?.dataDiskSizeGb
            }
          });
        }
      }
    } catch (error) {
      console.error("Error discovering Cloud SQL instances:", error);
    }
    return resources;
  }
  async discoverStorageBuckets() {
    const resources = [];
    const parent = `projects/${this.credentials.projectId}`;
    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ["storage.googleapis.com/Bucket"]
      });
      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const bucketData = asset.resource.data;
          resources.push({
            id: bucketData.id || asset.name || "unknown",
            name: bucketData.name || "unnamed",
            type: "Bucket",
            service: "Cloud Storage",
            location: bucketData.location || "unknown",
            state: "active"
          });
        }
      }
    } catch (error) {
      console.error("Error discovering Cloud Storage buckets:", error);
    }
    return resources;
  }
  async discoverCloudFunctions() {
    const resources = [];
    const parent = `projects/${this.credentials.projectId}`;
    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ["cloudfunctions.googleapis.com/CloudFunction"]
      });
      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const functionData = asset.resource.data;
          const location = this.extractLocationFromAssetName(asset.name || "");
          resources.push({
            id: functionData.name || asset.name || "unknown",
            name: this.extractFunctionName(functionData.name || ""),
            type: "Function",
            service: "Cloud Functions",
            location,
            state: functionData.status || "unknown",
            costDetails: {
              memory: this.extractMemoryFromFunction(functionData.availableMemoryMb)
            }
          });
        }
      }
    } catch (error) {
      console.error("Error discovering Cloud Functions:", error);
    }
    return resources;
  }
  async discoverGKEClusters() {
    const resources = [];
    const parent = `projects/${this.credentials.projectId}`;
    try {
      const [assets] = await this.client.listAssets({
        parent,
        assetTypes: ["container.googleapis.com/Cluster"]
      });
      for (const asset of assets) {
        if (asset.resource && asset.resource.data) {
          const clusterData = asset.resource.data;
          resources.push({
            id: clusterData.name || asset.name || "unknown",
            name: clusterData.name || "unnamed",
            type: "Cluster",
            service: "GKE",
            location: clusterData.location || "unknown",
            state: clusterData.status || "unknown"
          });
        }
      }
    } catch (error) {
      console.error("Error discovering GKE clusters:", error);
    }
    return resources;
  }
  extractLocationFromAssetName(assetName) {
    const parts = assetName.split("/");
    const zoneIndex = parts.findIndex((part) => part === "zones");
    if (zoneIndex !== -1 && zoneIndex + 1 < parts.length) {
      return parts[zoneIndex + 1];
    }
    const regionIndex = parts.findIndex((part) => part === "regions");
    if (regionIndex !== -1 && regionIndex + 1 < parts.length) {
      return parts[regionIndex + 1];
    }
    return "unknown";
  }
  extractLabels(labels) {
    if (!labels || typeof labels !== "object") return {};
    return labels;
  }
  extractMachineType(machineTypeUrl) {
    if (!machineTypeUrl) return "unknown";
    const parts = machineTypeUrl.split("/");
    return parts[parts.length - 1] || "unknown";
  }
  extractFunctionName(functionPath) {
    const parts = functionPath.split("/");
    return parts[parts.length - 1] || "unnamed";
  }
  extractMemoryFromFunction(memoryMb) {
    return memoryMb || 256;
  }
  getVCPUsFromMachineType(machineType) {
    if (!machineType) return 1;
    const vcpuMap = {
      "f1-micro": 1,
      "g1-small": 1,
      "n1-standard-1": 1,
      "n1-standard-2": 2,
      "n1-standard-4": 4,
      "n1-standard-8": 8,
      "n2-standard-2": 2,
      "n2-standard-4": 4,
      "n2-standard-8": 8,
      "e2-micro": 1,
      "e2-small": 1,
      "e2-medium": 1,
      "e2-standard-2": 2,
      "e2-standard-4": 4
    };
    return vcpuMap[machineType] || 1;
  }
  getMemoryFromMachineType(machineType) {
    if (!machineType) return 1;
    const memoryMap = {
      "f1-micro": 0.6,
      "g1-small": 1.7,
      "n1-standard-1": 3.75,
      "n1-standard-2": 7.5,
      "n1-standard-4": 15,
      "n1-standard-8": 30,
      "n2-standard-2": 8,
      "n2-standard-4": 16,
      "n2-standard-8": 32,
      "e2-micro": 1,
      "e2-small": 2,
      "e2-medium": 4,
      "e2-standard-2": 8,
      "e2-standard-4": 16
    };
    return memoryMap[machineType] || 1;
  }
};

// server/services/inventory-service.ts
init_oci_inventory();
var CloudInventoryService = class {
  async scanMultipleProviders(request) {
    const startTime = Date.now();
    const allResources = [];
    const summary = {
      totalResources: 0,
      providers: {},
      services: {},
      locations: {}
    };
    const scanPromises = request.credentials.map((cred) => this.scanSingleProvider(cred));
    try {
      const results = await Promise.allSettled(scanPromises);
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const provider = request.credentials[i].provider;
        if (result.status === "fulfilled") {
          const inventory = result.value;
          const unifiedResources = this.convertToUnifiedFormat(inventory, provider);
          allResources.push(...unifiedResources);
        } else {
          console.error(`Failed to scan ${provider}:`, result.reason);
        }
      }
      summary.totalResources = allResources.length;
      allResources.forEach((resource) => {
        summary.providers[resource.provider] = (summary.providers[resource.provider] || 0) + 1;
        summary.services[resource.service] = (summary.services[resource.service] || 0) + 1;
        summary.locations[resource.location] = (summary.locations[resource.location] || 0) + 1;
      });
      const endTime = Date.now();
      return {
        resources: allResources,
        summary,
        scanDate: (/* @__PURE__ */ new Date()).toISOString(),
        scanDuration: endTime - startTime
      };
    } catch (error) {
      console.error("Error scanning multiple providers:", error);
      throw error;
    }
  }
  async scanSingleProvider(cloudCredentials2) {
    console.log(`Scanning ${cloudCredentials2.provider} with credentials:`, JSON.stringify(cloudCredentials2.credentials, null, 2));
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Scan timeout for ${cloudCredentials2.provider} after 2 minutes`)), 2 * 60 * 1e3);
    });
    try {
      let scanPromise;
      switch (cloudCredentials2.provider) {
        case "aws":
          const awsService = new AWSSimpleInventoryService(cloudCredentials2.credentials);
          scanPromise = awsService.discoverResources();
          break;
        case "azure":
          const azureService = new AzureInventoryService(cloudCredentials2.credentials);
          scanPromise = azureService.discoverResources();
          break;
        case "gcp":
          const gcpService = new GCPInventoryService(cloudCredentials2.credentials);
          scanPromise = gcpService.discoverResources();
          break;
        case "oci":
          const ociService = new OCIInventoryService(cloudCredentials2.credentials);
          scanPromise = ociService.discoverResources();
          break;
        default:
          throw new Error(`Unsupported provider: ${cloudCredentials2.provider}`);
      }
      return await Promise.race([scanPromise, timeoutPromise]);
    } catch (error) {
      console.error(`Failed to scan ${cloudCredentials2.provider}:`, error);
      return {
        resources: [],
        summary: {
          totalResources: 0,
          byService: {},
          byRegion: {},
          byState: {}
        },
        metadata: {
          scanTime: (/* @__PURE__ */ new Date()).toISOString(),
          region: cloudCredentials2.credentials.region || "unknown",
          provider: cloudCredentials2.provider
        }
      };
    }
  }
  convertToUnifiedFormat(inventory, provider) {
    console.log(`Converting inventory for ${provider}:`, JSON.stringify(inventory, null, 2));
    if (!inventory || !inventory.resources || !Array.isArray(inventory.resources)) {
      console.warn(`Invalid inventory format for ${provider}:`, inventory);
      return [];
    }
    const unifiedResources = inventory.resources.map((resource) => ({
      ...resource,
      provider,
      location: "location" in resource ? resource.location : resource.region || "unknown"
    }));
    console.log(`Converted ${unifiedResources.length} resources for ${provider}`);
    return unifiedResources;
  }
  generateCostRequirementsFromInventory(inventory) {
    const requirements = {
      compute: {
        vcpus: 0,
        ram: 0,
        instanceType: "general-purpose",
        region: "us-east-1",
        operatingSystem: "linux",
        bootVolume: {
          size: 0,
          type: "ssd-gp3",
          iops: 3e3
        }
      },
      storage: {
        objectStorage: {
          size: 0,
          tier: "standard",
          requests: 1e4
        },
        blockStorage: {
          size: 0,
          type: "ssd-gp3",
          iops: 3e3
        }
      },
      database: {
        relational: {
          engine: "mysql",
          instanceClass: "small",
          storage: 0,
          multiAZ: false
        }
      },
      networking: {
        bandwidth: 0,
        loadBalancer: "none"
      }
    };
    const computeResources = inventory.resources.filter(
      (r) => r.service === "EC2" || r.service === "Compute Engine" || r.service && r.service.includes("Virtual") || r.service === "OCI Compute"
    );
    computeResources.forEach((resource) => {
      if (resource.costDetails) {
        requirements.compute.vcpus += resource.costDetails.vcpus || 0;
        requirements.compute.ram += resource.costDetails.memory || 0;
        requirements.compute.bootVolume.size += 30;
      }
    });
    const storageResources = inventory.resources.filter(
      (r) => r.service === "S3" || r.service === "Cloud Storage" || r.service === "EBS" || r.type === "Bucket" || r.service === "OCI Storage"
    );
    storageResources.forEach((resource) => {
      if (resource.costDetails) {
        if (resource.type === "Bucket" || resource.service === "S3" || resource.service === "Cloud Storage") {
          requirements.storage.objectStorage.size += resource.costDetails.storage || 100;
        } else {
          requirements.storage.blockStorage.size += resource.costDetails.storage || 0;
        }
      }
    });
    const dbResources = inventory.resources.filter(
      (r) => r.service === "RDS" || r.service === "Cloud SQL" || r.type && r.type.includes("SQL") || r.service === "OCI Database"
    );
    dbResources.forEach((resource) => {
      if (resource.costDetails) {
        requirements.database.relational.storage += resource.costDetails.storage || 0;
      }
    });
    const lbResources = inventory.resources.filter(
      (r) => r.service === "ELB" || r.type === "LoadBalancer"
    );
    if (lbResources.length > 0) {
      requirements.networking.loadBalancer = "application";
    }
    requirements.networking.bandwidth = Math.max(1, Math.floor(inventory.resources.length * 10));
    return requirements;
  }
  async generateAutomaticCostAnalysis(inventory) {
    const requirements = this.generateCostRequirementsFromInventory(inventory);
    return {
      inventory,
      costRequirements: requirements,
      recommendations: {
        optimization: this.generateOptimizationRecommendations(inventory),
        rightSizing: this.generateRightSizingRecommendations(inventory),
        costSavings: this.generateCostSavingsRecommendations(inventory)
      }
    };
  }
  generateOptimizationRecommendations(inventory) {
    const recommendations = [];
    const { resources } = inventory;
    const stoppedResources = resources.filter((r) => r.state === "stopped" || r.state === "TERMINATED");
    if (stoppedResources.length > 0) {
      recommendations.push(`Found ${stoppedResources.length} stopped/terminated resources that may be generating costs`);
    }
    const untaggedResources = resources.filter((r) => !r.tags || Object.keys(r.tags).length === 0);
    if (untaggedResources.length > 0) {
      recommendations.push(`${untaggedResources.length} resources are untagged - consider adding cost allocation tags`);
    }
    const oldResources = resources.filter((r) => {
      const name = (r.name || "").toLowerCase();
      return name.includes("test") || name.includes("temp") || name.includes("old");
    });
    if (oldResources.length > 0) {
      recommendations.push(`Found ${oldResources.length} resources with test/temp/old in their names - review for cleanup`);
    }
    return recommendations;
  }
  generateRightSizingRecommendations(inventory) {
    const recommendations = [];
    const computeResources = inventory.resources.filter(
      (r) => r.service === "EC2" || r.service === "Compute Engine" || r.service.includes("Virtual")
    );
    const oversizedInstances = computeResources.filter((r) => {
      if (r.costDetails && r.costDetails.vcpus) {
        return r.costDetails.vcpus > 8;
      }
      return false;
    });
    if (oversizedInstances.length > 0) {
      recommendations.push(`${oversizedInstances.length} compute instances may be oversized - consider right-sizing`);
    }
    return recommendations;
  }
  generateCostSavingsRecommendations(inventory) {
    const recommendations = [];
    const { summary } = inventory;
    if (summary.providers.aws && summary.providers.azure) {
      recommendations.push("Multi-cloud setup detected - consider workload consolidation for better pricing");
    }
    if (summary.totalResources > 50) {
      recommendations.push("Large infrastructure detected - consider reserved instances or committed use discounts");
    }
    return recommendations;
  }
};

// server/services/terraform-parser.ts
var TerraformStateParser = class {
  resourceTypeMap = {
    // AWS Resources
    "aws_instance": { type: "Instance", service: "Compute", provider: "aws" },
    "aws_ec2_instance": { type: "Instance", service: "Compute", provider: "aws" },
    "aws_autoscaling_group": { type: "AutoScalingGroup", service: "Compute", provider: "aws" },
    "aws_launch_template": { type: "LaunchTemplate", service: "Compute", provider: "aws" },
    "aws_launch_configuration": { type: "LaunchConfiguration", service: "Compute", provider: "aws" },
    "aws_spot_instance_request": { type: "SpotInstance", service: "Compute", provider: "aws" },
    "aws_spot_fleet_request": { type: "SpotFleet", service: "Compute", provider: "aws" },
    "aws_s3_bucket": { type: "Bucket", service: "Storage", provider: "aws" },
    "aws_s3_bucket_object": { type: "Object", service: "Storage", provider: "aws" },
    "aws_s3_bucket_policy": { type: "BucketPolicy", service: "Storage", provider: "aws" },
    "aws_ebs_volume": { type: "Volume", service: "Storage", provider: "aws" },
    "aws_ebs_snapshot": { type: "Snapshot", service: "Storage", provider: "aws" },
    "aws_efs_file_system": { type: "FileSystem", service: "Storage", provider: "aws" },
    "aws_fsx_lustre_file_system": { type: "LustreFileSystem", service: "Storage", provider: "aws" },
    "aws_rds_instance": { type: "Database", service: "Database", provider: "aws" },
    "aws_rds_cluster": { type: "DatabaseCluster", service: "Database", provider: "aws" },
    "aws_rds_cluster_instance": { type: "DatabaseInstance", service: "Database", provider: "aws" },
    "aws_dynamodb_table": { type: "NoSQLTable", service: "Database", provider: "aws" },
    "aws_elasticache_cluster": { type: "CacheCluster", service: "Database", provider: "aws" },
    "aws_elasticache_replication_group": { type: "CacheReplicationGroup", service: "Database", provider: "aws" },
    "aws_redshift_cluster": { type: "DataWarehouse", service: "Database", provider: "aws" },
    "aws_lb": { type: "LoadBalancer", service: "Networking", provider: "aws" },
    "aws_alb": { type: "ApplicationLoadBalancer", service: "Networking", provider: "aws" },
    "aws_nlb": { type: "NetworkLoadBalancer", service: "Networking", provider: "aws" },
    "aws_elb": { type: "ClassicLoadBalancer", service: "Networking", provider: "aws" },
    "aws_vpc": { type: "VPC", service: "Networking", provider: "aws" },
    "aws_subnet": { type: "Subnet", service: "Networking", provider: "aws" },
    "aws_internet_gateway": { type: "InternetGateway", service: "Networking", provider: "aws" },
    "aws_nat_gateway": { type: "NATGateway", service: "Networking", provider: "aws" },
    "aws_route_table": { type: "RouteTable", service: "Networking", provider: "aws" },
    "aws_security_group": { type: "SecurityGroup", service: "Networking", provider: "aws" },
    "aws_network_acl": { type: "NetworkACL", service: "Networking", provider: "aws" },
    "aws_vpc_endpoint": { type: "VPCEndpoint", service: "Networking", provider: "aws" },
    "aws_vpn_connection": { type: "VPNConnection", service: "Networking", provider: "aws" },
    "aws_vpn_gateway": { type: "VPNGateway", service: "Networking", provider: "aws" },
    "aws_direct_connect_connection": { type: "DirectConnect", service: "Networking", provider: "aws" },
    "aws_cloudfront_distribution": { type: "CDN", service: "Networking", provider: "aws" },
    "aws_route53_zone": { type: "DNSZone", service: "Networking", provider: "aws" },
    "aws_route53_record": { type: "DNSRecord", service: "Networking", provider: "aws" },
    "aws_lambda_function": { type: "Function", service: "Compute", provider: "aws" },
    "aws_ecs_cluster": { type: "ContainerCluster", service: "Compute", provider: "aws" },
    "aws_ecs_service": { type: "ContainerService", service: "Compute", provider: "aws" },
    "aws_ecs_task_definition": { type: "TaskDefinition", service: "Compute", provider: "aws" },
    "aws_eks_cluster": { type: "KubernetesCluster", service: "Compute", provider: "aws" },
    "aws_eks_node_group": { type: "KubernetesNodeGroup", service: "Compute", provider: "aws" },
    "aws_cloudwatch_log_group": { type: "LogGroup", service: "Monitoring", provider: "aws" },
    "aws_cloudwatch_metric_alarm": { type: "Alarm", service: "Monitoring", provider: "aws" },
    "aws_cloudwatch_dashboard": { type: "Dashboard", service: "Monitoring", provider: "aws" },
    // Azure Resources
    "azurerm_virtual_machine": { type: "Instance", service: "Compute", provider: "azure" },
    "azurerm_virtual_machine_scale_set": { type: "ScaleSet", service: "Compute", provider: "azure" },
    "azurerm_availability_set": { type: "AvailabilitySet", service: "Compute", provider: "azure" },
    "azurerm_proximity_placement_group": { type: "ProximityGroup", service: "Compute", provider: "azure" },
    "azurerm_storage_account": { type: "StorageAccount", service: "Storage", provider: "azure" },
    "azurerm_storage_container": { type: "StorageContainer", service: "Storage", provider: "azure" },
    "azurerm_storage_blob": { type: "StorageBlob", service: "Storage", provider: "azure" },
    "azurerm_managed_disk": { type: "ManagedDisk", service: "Storage", provider: "azure" },
    "azurerm_snapshot": { type: "Snapshot", service: "Storage", provider: "azure" },
    "azurerm_sql_database": { type: "Database", service: "Database", provider: "azure" },
    "azurerm_sql_server": { type: "DatabaseServer", service: "Database", provider: "azure" },
    "azurerm_sql_elasticpool": { type: "ElasticPool", service: "Database", provider: "azure" },
    "azurerm_cosmosdb_account": { type: "CosmosDB", service: "Database", provider: "azure" },
    "azurerm_redis_cache": { type: "RedisCache", service: "Database", provider: "azure" },
    "azurerm_postgresql_server": { type: "PostgreSQLServer", service: "Database", provider: "azure" },
    "azurerm_mysql_server": { type: "MySQLServer", service: "Database", provider: "azure" },
    "azurerm_lb": { type: "LoadBalancer", service: "Networking", provider: "azure" },
    "azurerm_application_gateway": { type: "ApplicationGateway", service: "Networking", provider: "azure" },
    "azurerm_virtual_network": { type: "VNet", service: "Networking", provider: "azure" },
    "azurerm_subnet": { type: "Subnet", service: "Networking", provider: "azure" },
    "azurerm_network_security_group": { type: "NetworkSecurityGroup", service: "Networking", provider: "azure" },
    "azurerm_public_ip": { type: "PublicIP", service: "Networking", provider: "azure" },
    "azurerm_network_interface": { type: "NetworkInterface", service: "Networking", provider: "azure" },
    "azurerm_virtual_network_gateway": { type: "VPNGateway", service: "Networking", provider: "azure" },
    "azurerm_express_route_circuit": { type: "ExpressRoute", service: "Networking", provider: "azure" },
    "azurerm_cdn_profile": { type: "CDNProfile", service: "Networking", provider: "azure" },
    "azurerm_cdn_endpoint": { type: "CDNEndpoint", service: "Networking", provider: "azure" },
    "azurerm_dns_zone": { type: "DNSZone", service: "Networking", provider: "azure" },
    "azurerm_dns_a_record": { type: "DNSRecord", service: "Networking", provider: "azure" },
    "azurerm_function_app": { type: "FunctionApp", service: "Compute", provider: "azure" },
    "azurerm_container_group": { type: "ContainerGroup", service: "Compute", provider: "azure" },
    "azurerm_kubernetes_cluster": { type: "KubernetesCluster", service: "Compute", provider: "azure" },
    "azurerm_kubernetes_cluster_node_pool": { type: "KubernetesNodePool", service: "Compute", provider: "azure" },
    "azurerm_log_analytics_workspace": { type: "LogAnalyticsWorkspace", service: "Monitoring", provider: "azure" },
    "azurerm_application_insights": { type: "ApplicationInsights", service: "Monitoring", provider: "azure" },
    "azurerm_monitor_metric_alert": { type: "MetricAlert", service: "Monitoring", provider: "azure" },
    // Google Cloud Resources
    "google_compute_instance": { type: "Instance", service: "Compute", provider: "gcp" },
    "google_compute_instance_group": { type: "InstanceGroup", service: "Compute", provider: "gcp" },
    "google_compute_instance_template": { type: "InstanceTemplate", service: "Compute", provider: "gcp" },
    "google_compute_autoscaler": { type: "Autoscaler", service: "Compute", provider: "gcp" },
    "google_storage_bucket": { type: "Bucket", service: "Storage", provider: "gcp" },
    "google_storage_bucket_object": { type: "Object", service: "Storage", provider: "gcp" },
    "google_compute_disk": { type: "Disk", service: "Storage", provider: "gcp" },
    "google_compute_snapshot": { type: "Snapshot", service: "Storage", provider: "gcp" },
    "google_filestore_instance": { type: "Filestore", service: "Storage", provider: "gcp" },
    "google_sql_database_instance": { type: "Database", service: "Database", provider: "gcp" },
    "google_sql_database": { type: "Database", service: "Database", provider: "gcp" },
    "google_firestore_database": { type: "Firestore", service: "Database", provider: "gcp" },
    "google_bigtable_instance": { type: "Bigtable", service: "Database", provider: "gcp" },
    "google_redis_instance": { type: "Redis", service: "Database", provider: "gcp" },
    "google_spanner_instance": { type: "Spanner", service: "Database", provider: "gcp" },
    "google_compute_forwarding_rule": { type: "LoadBalancer", service: "Networking", provider: "gcp" },
    "google_compute_backend_service": { type: "BackendService", service: "Networking", provider: "gcp" },
    "google_compute_network": { type: "VPC", service: "Networking", provider: "gcp" },
    "google_compute_subnetwork": { type: "Subnet", service: "Networking", provider: "gcp" },
    "google_compute_firewall": { type: "Firewall", service: "Networking", provider: "gcp" },
    "google_compute_router": { type: "Router", service: "Networking", provider: "gcp" },
    "google_compute_vpn_tunnel": { type: "VPNTunnel", service: "Networking", provider: "gcp" },
    "google_compute_vpn_gateway": { type: "VPNGateway", service: "Networking", provider: "gcp" },
    "google_compute_global_forwarding_rule": { type: "GlobalLoadBalancer", service: "Networking", provider: "gcp" },
    "google_dns_managed_zone": { type: "DNSZone", service: "Networking", provider: "gcp" },
    "google_dns_record_set": { type: "DNSRecord", service: "Networking", provider: "gcp" },
    "google_cloudfunctions_function": { type: "CloudFunction", service: "Compute", provider: "gcp" },
    "google_container_cluster": { type: "KubernetesCluster", service: "Compute", provider: "gcp" },
    "google_container_node_pool": { type: "KubernetesNodePool", service: "Compute", provider: "gcp" },
    "google_cloud_run_service": { type: "CloudRunService", service: "Compute", provider: "gcp" },
    "google_logging_project_sink": { type: "LogSink", service: "Monitoring", provider: "gcp" },
    "google_monitoring_alert_policy": { type: "AlertPolicy", service: "Monitoring", provider: "gcp" },
    "google_monitoring_dashboard": { type: "Dashboard", service: "Monitoring", provider: "gcp" },
    // Oracle Cloud Resources
    "oci_core_instance": { type: "Instance", service: "Compute", provider: "oracle" },
    "oci_core_instance_pool": { type: "InstancePool", service: "Compute", provider: "oracle" },
    "oci_autoscaling_auto_scaling_configuration": { type: "AutoScalingConfig", service: "Compute", provider: "oracle" },
    "oci_objectstorage_bucket": { type: "Bucket", service: "Storage", provider: "oracle" },
    "oci_objectstorage_object": { type: "Object", service: "Storage", provider: "oracle" },
    "oci_core_volume": { type: "Volume", service: "Storage", provider: "oracle" },
    "oci_core_volume_backup": { type: "VolumeBackup", service: "Storage", provider: "oracle" },
    "oci_file_storage_file_system": { type: "FileSystem", service: "Storage", provider: "oracle" },
    "oci_database_autonomous_database": { type: "AutonomousDatabase", service: "Database", provider: "oracle" },
    "oci_database_db_system": { type: "DatabaseSystem", service: "Database", provider: "oracle" },
    "oci_nosql_table": { type: "NoSQLTable", service: "Database", provider: "oracle" },
    "oci_redis_redis_cluster": { type: "RedisCluster", service: "Database", provider: "oracle" },
    "oci_load_balancer_load_balancer": { type: "LoadBalancer", service: "Networking", provider: "oracle" },
    "oci_network_load_balancer_network_load_balancer": { type: "NetworkLoadBalancer", service: "Networking", provider: "oracle" },
    "oci_core_vcn": { type: "VCN", service: "Networking", provider: "oracle" },
    "oci_core_subnet": { type: "Subnet", service: "Networking", provider: "oracle" },
    "oci_core_security_list": { type: "SecurityList", service: "Networking", provider: "oracle" },
    "oci_core_internet_gateway": { type: "InternetGateway", service: "Networking", provider: "oracle" },
    "oci_core_nat_gateway": { type: "NATGateway", service: "Networking", provider: "oracle" },
    "oci_core_service_gateway": { type: "ServiceGateway", service: "Networking", provider: "oracle" },
    "oci_core_drg": { type: "DynamicRoutingGateway", service: "Networking", provider: "oracle" },
    "oci_dns_zone": { type: "DNSZone", service: "Networking", provider: "oracle" },
    "oci_dns_rrset": { type: "DNSRecord", service: "Networking", provider: "oracle" },
    "oci_functions_function": { type: "Function", service: "Compute", provider: "oracle" },
    "oci_containerengine_cluster": { type: "KubernetesCluster", service: "Compute", provider: "oracle" },
    "oci_containerengine_node_pool": { type: "KubernetesNodePool", service: "Compute", provider: "oracle" },
    "oci_logging_log_group": { type: "LogGroup", service: "Monitoring", provider: "oracle" },
    "oci_monitoring_alarm": { type: "Alarm", service: "Monitoring", provider: "oracle" }
  };
  parseTerraformState(tfState) {
    const resources = [];
    if (!tfState.resources || !Array.isArray(tfState.resources)) {
      throw new Error("Invalid Terraform state: missing or invalid resources array");
    }
    for (const resource of tfState.resources) {
      if (!resource.instances || !Array.isArray(resource.instances)) {
        continue;
      }
      for (const instance of resource.instances) {
        const attributes = instance.attributes || {};
        const resourceInfo = this.resourceTypeMap[resource.type] || {
          type: "Unknown",
          service: "Other",
          provider: this.extractProviderFromType(resource.type)
        };
        const costDetails = this.extractCostDetails(resource.type, attributes);
        const unifiedResource = {
          id: attributes.id || `${resource.type}.${resource.name}`,
          name: this.extractResourceName(attributes, resource.name),
          type: resourceInfo.type,
          service: resourceInfo.service,
          provider: resourceInfo.provider,
          location: this.extractLocation(attributes, resourceInfo.provider),
          state: this.extractState(attributes),
          costDetails,
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
      scanTime: (/* @__PURE__ */ new Date()).toISOString(),
      source: "terraform"
    };
  }
  extractProviderFromType(tfType) {
    if (tfType.startsWith("aws_")) return "aws";
    if (tfType.startsWith("azurerm_")) return "azure";
    if (tfType.startsWith("google_")) return "gcp";
    if (tfType.startsWith("oci_")) return "oracle";
    return "unknown";
  }
  extractResourceName(attributes, fallbackName) {
    return attributes.name || attributes.display_name || attributes.tags?.Name || attributes.tags?.name || attributes.bucket || attributes.database_name || fallbackName;
  }
  extractLocation(attributes, provider) {
    switch (provider) {
      case "aws":
        return attributes.region || attributes.availability_zone || "us-east-1";
      case "azure":
        return attributes.location || attributes.resource_group_name || "eastus";
      case "gcp":
        return attributes.region || attributes.zone || "us-central1";
      case "oracle":
        return attributes.region || attributes.availability_domain || "us-phoenix-1";
      default:
        return attributes.region || attributes.location || "unknown";
    }
  }
  extractState(attributes) {
    if (attributes.state) return attributes.state;
    if (attributes.status) return attributes.status;
    if (attributes.lifecycle_state) return attributes.lifecycle_state;
    if (attributes.provisioning_state) return attributes.provisioning_state;
    return "active";
  }
  extractCostDetails(tfType, attributes) {
    const details = {};
    if (tfType.includes("instance") || tfType.includes("vm")) {
      details.instanceType = attributes.instance_type || attributes.vm_size || attributes.machine_type || attributes.shape;
      details.vcpus = this.getVCPUs(details.instanceType);
      details.memory = this.getMemory(details.instanceType);
      details.architecture = attributes.architecture || attributes.vm_architecture;
      details.platform = attributes.platform || attributes.vm_platform;
      details.tenancy = attributes.tenancy || attributes.dedicated_host_affinity;
      details.spotPrice = attributes.spot_price || attributes.max_spot_price;
      details.spotType = attributes.spot_type || attributes.spot_request_type;
    }
    if (tfType.includes("storage") || tfType.includes("bucket") || tfType.includes("volume") || tfType.includes("disk")) {
      details.storage = attributes.size || attributes.allocated_storage || attributes.disk_size_gb || attributes.storage_size_in_gbs;
      details.storageType = attributes.type || attributes.storage_type || attributes.storage_class || attributes.storage_tier;
      details.iops = attributes.iops || attributes.provisioned_iops;
      details.throughput = attributes.throughput || attributes.provisioned_throughput;
      details.encrypted = attributes.encrypted || attributes.kms_key_id;
      details.backupRetention = attributes.backup_retention_period || attributes.retention_period;
    }
    if (tfType.includes("database") || tfType.includes("rds") || tfType.includes("sql")) {
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
    if (tfType.includes("lb") || tfType.includes("load_balancer")) {
      details.scheme = attributes.scheme || attributes.load_balancer_type;
      details.type = attributes.type || attributes.load_balancer_type;
      details.algorithm = attributes.algorithm || attributes.load_balancing_algorithm;
      details.healthCheck = attributes.health_check || attributes.health_check_config;
      details.sslCertificate = attributes.ssl_certificate || attributes.certificate_arn;
      details.idleTimeout = attributes.idle_timeout;
      details.connectionDraining = attributes.connection_draining;
    }
    if (tfType.includes("vpc") || tfType.includes("subnet") || tfType.includes("gateway")) {
      details.cidrBlock = attributes.cidr_block || attributes.address_prefix;
      details.availabilityZone = attributes.availability_zone || attributes.availability_domain;
      details.publiclyAccessible = attributes.publicly_accessible || attributes.public_ip;
      details.natGatewayId = attributes.nat_gateway_id;
      details.routeTableId = attributes.route_table_id;
    }
    if (tfType.includes("container") || tfType.includes("kubernetes") || tfType.includes("eks") || tfType.includes("gke")) {
      details.nodeCount = attributes.node_count || attributes.desired_size;
      details.nodeType = attributes.node_type || attributes.instance_type;
      details.minSize = attributes.min_size;
      details.maxSize = attributes.max_size;
      details.diskSize = attributes.disk_size || attributes.disk_size_gb;
      details.kubernetesVersion = attributes.kubernetes_version || attributes.version;
      details.networkPolicy = attributes.network_policy_enabled;
      details.podSecurityPolicy = attributes.pod_security_policy_enabled;
    }
    if (tfType.includes("function") || tfType.includes("lambda")) {
      details.runtime = attributes.runtime || attributes.function_runtime;
      details.memory = attributes.memory || attributes.function_memory;
      details.timeout = attributes.timeout || attributes.function_timeout;
      details.handler = attributes.handler || attributes.function_handler;
      details.layers = attributes.layers;
      details.environment = attributes.environment || attributes.environment_variables;
    }
    if (tfType.includes("cdn") || tfType.includes("cloudfront") || tfType.includes("distribution")) {
      details.origins = attributes.origins || attributes.origin;
      details.cacheBehaviors = attributes.cache_behaviors;
      details.priceClass = attributes.price_class;
      details.aliases = attributes.aliases;
      details.sslCertificate = attributes.ssl_certificate;
      details.defaultRootObject = attributes.default_root_object;
    }
    details.estimatedMonthlyCost = this.estimateMonthlyCost(tfType, details);
    return details;
  }
  extractTags(attributes) {
    const tags = {};
    if (attributes.tags && typeof attributes.tags === "object") {
      Object.assign(tags, attributes.tags);
    }
    if (attributes.labels && typeof attributes.labels === "object") {
      Object.assign(tags, attributes.labels);
    }
    return tags;
  }
  extractAdditionalMetadata(tfType, attributes) {
    const metadata = {};
    if (tfType.startsWith("aws_")) {
      metadata.awsAccountId = attributes.account_id;
      metadata.awsArn = attributes.arn;
    } else if (tfType.startsWith("azurerm_")) {
      metadata.azureResourceGroup = attributes.resource_group_name;
      metadata.azureSubscriptionId = attributes.subscription_id;
    } else if (tfType.startsWith("google_")) {
      metadata.gcpProject = attributes.project;
    } else if (tfType.startsWith("oci_")) {
      metadata.ociCompartmentId = attributes.compartment_id;
      metadata.ociTenancyId = attributes.tenancy_id;
    }
    return metadata;
  }
  getVCPUs(instanceType) {
    if (!instanceType) return 2;
    const vcpuMap = {
      // AWS
      "t2.micro": 1,
      "t2.small": 1,
      "t2.medium": 2,
      "t2.large": 2,
      "t2.xlarge": 4,
      "t2.2xlarge": 8,
      "t3.micro": 2,
      "t3.small": 2,
      "t3.medium": 2,
      "t3.large": 2,
      "t3.xlarge": 4,
      "t3.2xlarge": 8,
      "t3a.micro": 2,
      "t3a.small": 2,
      "t3a.medium": 2,
      "t3a.large": 2,
      "t3a.xlarge": 4,
      "t3a.2xlarge": 8,
      "t4g.micro": 2,
      "t4g.small": 2,
      "t4g.medium": 2,
      "t4g.large": 2,
      "t4g.xlarge": 4,
      "t4g.2xlarge": 8,
      "m5.large": 2,
      "m5.xlarge": 4,
      "m5.2xlarge": 8,
      "m5.4xlarge": 16,
      "m5.8xlarge": 32,
      "m5.12xlarge": 48,
      "m5.16xlarge": 64,
      "m5.24xlarge": 96,
      "m5a.large": 2,
      "m5a.xlarge": 4,
      "m5a.2xlarge": 8,
      "m5a.4xlarge": 16,
      "m5a.8xlarge": 32,
      "m5a.12xlarge": 48,
      "m5a.16xlarge": 64,
      "m5a.24xlarge": 96,
      "m6i.large": 2,
      "m6i.xlarge": 4,
      "m6i.2xlarge": 8,
      "m6i.4xlarge": 16,
      "m6i.8xlarge": 32,
      "m6i.12xlarge": 48,
      "m6i.16xlarge": 64,
      "m6i.24xlarge": 96,
      "c5.large": 2,
      "c5.xlarge": 4,
      "c5.2xlarge": 8,
      "c5.4xlarge": 16,
      "c5.9xlarge": 36,
      "c5.12xlarge": 48,
      "c5.18xlarge": 72,
      "c5.24xlarge": 96,
      "c5a.large": 2,
      "c5a.xlarge": 4,
      "c5a.2xlarge": 8,
      "c5a.4xlarge": 16,
      "c5a.8xlarge": 32,
      "c5a.12xlarge": 48,
      "c5a.16xlarge": 64,
      "c5a.24xlarge": 96,
      "c6i.large": 2,
      "c6i.xlarge": 4,
      "c6i.2xlarge": 8,
      "c6i.4xlarge": 16,
      "c6i.8xlarge": 32,
      "c6i.12xlarge": 48,
      "c6i.16xlarge": 64,
      "c6i.24xlarge": 96,
      "r5.large": 2,
      "r5.xlarge": 4,
      "r5.2xlarge": 8,
      "r5.4xlarge": 16,
      "r5.8xlarge": 32,
      "r5.12xlarge": 48,
      "r5.16xlarge": 64,
      "r5.24xlarge": 96,
      "r5a.large": 2,
      "r5a.xlarge": 4,
      "r5a.2xlarge": 8,
      "r5a.4xlarge": 16,
      "r5a.8xlarge": 32,
      "r5a.12xlarge": 48,
      "r5a.16xlarge": 64,
      "r5a.24xlarge": 96,
      "r6i.large": 2,
      "r6i.xlarge": 4,
      "r6i.2xlarge": 8,
      "r6i.4xlarge": 16,
      "r6i.8xlarge": 32,
      "r6i.12xlarge": 48,
      "r6i.16xlarge": 64,
      "r6i.24xlarge": 96,
      "g4dn.xlarge": 4,
      "g4dn.2xlarge": 8,
      "g4dn.4xlarge": 16,
      "g4dn.8xlarge": 32,
      "g4dn.12xlarge": 48,
      "g4dn.16xlarge": 64,
      "p3.2xlarge": 8,
      "p3.8xlarge": 32,
      "p3.16xlarge": 64,
      "p4d.24xlarge": 96,
      // Azure
      "Standard_B1s": 1,
      "Standard_B2s": 2,
      "Standard_B4ms": 4,
      "Standard_B8ms": 8,
      "Standard_D2s_v3": 2,
      "Standard_D4s_v3": 4,
      "Standard_D8s_v3": 8,
      "Standard_D16s_v3": 16,
      "Standard_D32s_v3": 32,
      "Standard_D64s_v3": 64,
      "Standard_E2s_v3": 2,
      "Standard_E4s_v3": 4,
      "Standard_E8s_v3": 8,
      "Standard_E16s_v3": 16,
      "Standard_E32s_v3": 32,
      "Standard_E64s_v3": 64,
      "Standard_F2s_v2": 2,
      "Standard_F4s_v2": 4,
      "Standard_F8s_v2": 8,
      "Standard_F16s_v2": 16,
      "Standard_F32s_v2": 32,
      "Standard_F64s_v2": 64,
      "Standard_NC6s_v3": 6,
      "Standard_NC12s_v3": 12,
      "Standard_NC24s_v3": 24,
      "Standard_ND6s": 6,
      "Standard_ND12s": 12,
      "Standard_ND24s": 24,
      // GCP
      "e2-micro": 2,
      "e2-small": 2,
      "e2-medium": 2,
      "e2-standard-2": 2,
      "e2-standard-4": 4,
      "e2-standard-8": 8,
      "e2-standard-16": 16,
      "e2-standard-32": 32,
      "n1-standard-1": 1,
      "n1-standard-2": 2,
      "n1-standard-4": 4,
      "n1-standard-8": 8,
      "n1-standard-16": 16,
      "n1-standard-32": 32,
      "n1-standard-64": 64,
      "n1-standard-96": 96,
      "n2-standard-2": 2,
      "n2-standard-4": 4,
      "n2-standard-8": 8,
      "n2-standard-16": 16,
      "n2-standard-32": 32,
      "n2-standard-48": 48,
      "n2-standard-64": 64,
      "n2-standard-80": 80,
      "n2-standard-96": 96,
      "n2-standard-128": 128,
      "c2-standard-4": 4,
      "c2-standard-8": 8,
      "c2-standard-16": 16,
      "c2-standard-30": 30,
      "c2-standard-60": 60,
      "m1-megamem-96": 96,
      "m1-ultramem-40": 40,
      "m1-ultramem-80": 80,
      "m1-ultramem-160": 160,
      "a2-highgpu-1g": 12,
      "a2-highgpu-2g": 24,
      "a2-highgpu-4g": 48,
      "a2-highgpu-8g": 96,
      // Oracle Cloud
      "VM.Standard.E2.1.Micro": 1,
      "VM.Standard.E2.1": 1,
      "VM.Standard.E2.2": 2,
      "VM.Standard.E2.4": 4,
      "VM.Standard.E2.8": 8,
      "VM.Standard.E3.Flex": 1,
      "VM.Standard.E4.Flex": 1,
      "VM.Standard.E5.Flex": 1,
      "VM.Standard1.1": 1,
      "VM.Standard1.2": 2,
      "VM.Standard1.4": 4,
      "VM.Standard1.8": 8,
      "VM.Standard1.16": 16,
      "VM.Standard2.1": 1,
      "VM.Standard2.2": 2,
      "VM.Standard2.4": 4,
      "VM.Standard2.8": 8,
      "VM.Standard2.16": 16,
      "VM.Standard2.24": 24,
      "VM.Standard3.Flex": 1,
      "VM.Standard4.Flex": 1,
      "VM.Standard5.Flex": 1,
      "BM.Standard.E2.64": 64,
      "BM.Standard.E3.128": 128,
      "BM.Standard.E4.128": 128,
      "BM.Standard1.36": 36,
      "BM.Standard2.52": 52,
      "BM.Standard3.72": 72,
      "BM.GPU2.2": 28,
      "BM.GPU3.8": 52,
      "BM.GPU4.8": 52
    };
    return vcpuMap[instanceType] || 2;
  }
  getMemory(instanceType) {
    if (!instanceType) return 4;
    const memoryMap = {
      // AWS
      "t2.micro": 1,
      "t2.small": 2,
      "t2.medium": 4,
      "t2.large": 8,
      "t2.xlarge": 16,
      "t2.2xlarge": 32,
      "t3.micro": 1,
      "t3.small": 2,
      "t3.medium": 4,
      "t3.large": 8,
      "t3.xlarge": 16,
      "t3.2xlarge": 32,
      "m5.large": 8,
      "m5.xlarge": 16,
      "m5.2xlarge": 32,
      "m5.4xlarge": 64,
      "m5.8xlarge": 128,
      "m5.12xlarge": 192,
      "m5.16xlarge": 256,
      "m5.24xlarge": 384,
      "c5.large": 4,
      "c5.xlarge": 8,
      "c5.2xlarge": 16,
      "c5.4xlarge": 32,
      "c5.9xlarge": 72,
      "c5.12xlarge": 96,
      "c5.18xlarge": 144,
      "c5.24xlarge": 192,
      "r5.large": 16,
      "r5.xlarge": 32,
      "r5.2xlarge": 64,
      "r5.4xlarge": 128,
      "r5.8xlarge": 256,
      "r5.12xlarge": 384,
      "r5.16xlarge": 512,
      "r5.24xlarge": 768,
      // Azure
      "Standard_B1s": 1,
      "Standard_B2s": 4,
      "Standard_B4ms": 16,
      "Standard_B8ms": 32,
      "Standard_D2s_v3": 8,
      "Standard_D4s_v3": 16,
      "Standard_D8s_v3": 32,
      "Standard_D16s_v3": 64,
      "Standard_D32s_v3": 128,
      "Standard_D64s_v3": 256,
      "Standard_E2s_v3": 16,
      "Standard_E4s_v3": 32,
      "Standard_E8s_v3": 64,
      "Standard_E16s_v3": 128,
      "Standard_E32s_v3": 256,
      "Standard_E64s_v3": 512,
      // GCP
      "e2-micro": 1,
      "e2-small": 2,
      "e2-medium": 4,
      "e2-standard-2": 8,
      "e2-standard-4": 16,
      "e2-standard-8": 32,
      "e2-standard-16": 64,
      "e2-standard-32": 128,
      "n1-standard-1": 3.75,
      "n1-standard-2": 7.5,
      "n1-standard-4": 15,
      "n1-standard-8": 30,
      "n1-standard-16": 60,
      "n1-standard-32": 120,
      "n1-standard-64": 240,
      "n1-standard-96": 360,
      "c2-standard-4": 16,
      "c2-standard-8": 32,
      "c2-standard-16": 64,
      "c2-standard-30": 120,
      "c2-standard-60": 240,
      // Oracle Cloud
      "VM.Standard.E2.1.Micro": 1,
      "VM.Standard.E2.1": 8,
      "VM.Standard.E2.2": 16,
      "VM.Standard.E2.4": 32,
      "VM.Standard.E2.8": 64,
      "VM.Standard.E3.Flex": 16,
      "VM.Standard.E4.Flex": 32,
      "VM.Standard.E5.Flex": 64,
      "BM.Standard.E2.64": 512,
      "BM.Standard.E3.128": 1024,
      "BM.Standard.E4.128": 1024
    };
    return memoryMap[instanceType] || 4;
  }
  getProviderSummary(resources) {
    const summary = {};
    resources.forEach((resource) => {
      summary[resource.provider] = (summary[resource.provider] || 0) + 1;
    });
    return summary;
  }
  getServiceSummary(resources) {
    const summary = {};
    resources.forEach((resource) => {
      summary[resource.service] = (summary[resource.service] || 0) + 1;
    });
    return summary;
  }
  getRegionSummary(resources) {
    const summary = {};
    resources.forEach((resource) => {
      summary[resource.location] = (summary[resource.location] || 0) + 1;
    });
    return summary;
  }
  estimateMonthlyCost(tfType, details) {
    let baseCost = 0;
    const provider = this.extractProviderFromType(tfType);
    if (tfType.includes("instance") || tfType.includes("vm")) {
      const instanceType = details.instanceType;
      const vcpus = details.vcpus || 2;
      const memory = details.memory || 4;
      const pricing = {
        aws: { vcpu: 0.05, memory: 5e-3 },
        // $0.05/vCPU/hour, $0.005/GB/hour
        azure: { vcpu: 0.04, memory: 4e-3 },
        gcp: { vcpu: 0.03, memory: 4e-3 },
        oracle: { vcpu: 0.06, memory: 6e-3 }
      };
      const providerPricing = pricing[provider] || pricing.aws;
      baseCost = (vcpus * providerPricing.vcpu + memory * providerPricing.memory) * 24 * 30;
      if (instanceType?.includes("t2") || instanceType?.includes("t3")) {
        baseCost *= 0.7;
      } else if (instanceType?.includes("c5") || instanceType?.includes("c6")) {
        baseCost *= 1.2;
      } else if (instanceType?.includes("r5") || instanceType?.includes("r6")) {
        baseCost *= 1.3;
      } else if (instanceType?.includes("g4") || instanceType?.includes("p3") || instanceType?.includes("p4")) {
        baseCost *= 3;
      }
    }
    if (tfType.includes("storage") || tfType.includes("bucket") || tfType.includes("volume") || tfType.includes("disk")) {
      const storage3 = details.storage || 0;
      const storageType = details.storageType;
      const storagePricing = {
        aws: { standard: 0.023, gp2: 0.1, gp3: 0.08, io1: 0.125, io2: 0.125 },
        azure: { standard: 0.018, premium: 0.2, ultra: 0.15 },
        gcp: { standard: 0.02, ssd: 0.17, balanced: 0.1 },
        oracle: { standard: 0.025, balanced: 0.12, performance: 0.15 }
      };
      const providerStoragePricing = storagePricing[provider] || storagePricing.aws;
      const pricePerGB = providerStoragePricing[storageType] || providerStoragePricing.standard;
      baseCost += storage3 / 1024 * pricePerGB * 30;
    }
    if (tfType.includes("database") || tfType.includes("rds") || tfType.includes("sql")) {
      const instanceClass = details.instanceClass;
      const allocatedStorage = details.allocatedStorage || 0;
      const dbPricing = {
        aws: { "db.t3.micro": 15, "db.t3.small": 30, "db.t3.medium": 60, "db.r5.large": 200 },
        azure: { "Basic": 5, "S0": 15, "S1": 30, "S2": 60, "S3": 120 },
        gcp: { "db-f1-micro": 10, "db-g1-small": 25, "db-n1-standard-1": 50 },
        oracle: { "Standard": 20, "High": 100, "Extreme": 200 }
      };
      const providerDbPricing = dbPricing[provider] || dbPricing.aws;
      baseCost += providerDbPricing[instanceClass] || 50;
      if (allocatedStorage > 0) {
        baseCost += allocatedStorage / 1024 * 0.115 * 30;
      }
    }
    if (tfType.includes("lb") || tfType.includes("load_balancer")) {
      const lbPricing = {
        aws: { application: 22.5, network: 22.5, classic: 18 },
        azure: { standard: 18, basic: 0 },
        gcp: { standard: 18, premium: 18 },
        oracle: { standard: 20 }
      };
      const providerLbPricing = lbPricing[provider] || lbPricing.aws;
      const lbType = details.type || "application";
      baseCost += providerLbPricing[lbType] || 20;
    }
    if (tfType.includes("container") || tfType.includes("kubernetes") || tfType.includes("eks") || tfType.includes("gke")) {
      const nodeCount = details.nodeCount || 1;
      const nodeType = details.nodeType;
      baseCost += 73;
      if (nodeType) {
        const nodeCost = this.estimateMonthlyCost(`aws_instance`, { instanceType: nodeType, vcpus: this.getVCPUs(nodeType), memory: this.getMemory(nodeType) });
        baseCost += nodeCost * nodeCount;
      }
    }
    if (tfType.includes("function") || tfType.includes("lambda")) {
      const memory = details.memory || 128;
      const timeout = details.timeout || 3;
      const requests = 1e6;
      const duration = 0.1;
      const requestCost = requests * 2e-7;
      const computeCost = requests * duration * memory / 1024 * 166667e-10;
      baseCost += requestCost + computeCost;
    }
    if (tfType.includes("cdn") || tfType.includes("cloudfront") || tfType.includes("distribution")) {
      const dataTransfer = 1e3;
      baseCost += dataTransfer * 0.085;
    }
    return Math.round(baseCost * 100) / 100;
  }
};

// server/services/excel-parser.ts
import * as XLSX from "xlsx";
var ExcelParserService = class {
  validateExcelData(data) {
    const requiredFields = ["provider", "resourceType", "resourceName", "region"];
    const validData = [];
    for (const row of data) {
      const hasRequiredFields = requiredFields.every(
        (field) => row[field] && typeof row[field] === "string" && row[field].trim() !== ""
      );
      if (hasRequiredFields) {
        validData.push({
          provider: row.provider?.toString().toLowerCase().trim(),
          resourceType: row.resourceType?.toString().trim(),
          resourceName: row.resourceName?.toString().trim(),
          region: row.region?.toString().trim(),
          instanceType: row.instanceType?.toString().trim(),
          size: row.size ? parseFloat(row.size.toString()) : void 0,
          unit: row.unit?.toString().trim(),
          quantity: row.quantity ? parseFloat(row.quantity.toString()) : 1,
          cost: row.cost ? parseFloat(row.cost.toString()) : void 0,
          tags: this.parseTags(row.tags),
          ...row
        });
      }
    }
    return validData;
  }
  parseTags(tagsString) {
    if (!tagsString) return {};
    try {
      if (tagsString.startsWith("{") && tagsString.endsWith("}")) {
        return JSON.parse(tagsString);
      }
      const tags = {};
      const pairs = tagsString.split(",").map((pair) => pair.trim());
      for (const pair of pairs) {
        const [key, value] = pair.split("=").map((s) => s.trim());
        if (key && value) {
          tags[key] = value;
        }
      }
      return tags;
    } catch (error) {
      console.warn("Failed to parse tags:", tagsString);
      return {};
    }
  }
  async parseExcelFile(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No worksheets found in Excel file");
      }
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });
      if (jsonData.length < 2) {
        throw new Error("Excel file must have at least a header row and one data row");
      }
      const headers = jsonData[0];
      const dataRows = jsonData.slice(1);
      const data = dataRows.map((row) => {
        const obj = {};
        headers.forEach((header, index2) => {
          if (header && header.trim()) {
            obj[header.trim()] = row[index2] || "";
          }
        });
        return obj;
      });
      const validData = this.validateExcelData(data);
      if (validData.length === 0) {
        throw new Error("No valid data found. Please ensure your Excel file has the required columns: provider, resourceType, resourceName, region");
      }
      return validData;
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }
  convertToUnifiedResources(excelData) {
    return excelData.map((item, index2) => ({
      id: `excel-${index2}-${Date.now()}`,
      name: item.resourceName,
      type: item.resourceType,
      provider: item.provider,
      region: item.region,
      state: "ACTIVE",
      cost: item.cost || 0,
      metadata: {
        instanceType: item.instanceType,
        size: item.size,
        unit: item.unit,
        quantity: item.quantity || 1,
        tags: item.tags || {},
        source: "excel-upload"
      }
    }));
  }
  generateExcelTemplate() {
    const templateData = [
      {
        provider: "aws",
        resourceType: "ec2-instance",
        resourceName: "web-server-01",
        region: "us-east-1",
        instanceType: "t3.medium",
        size: 2,
        unit: "vCPU",
        quantity: 1,
        cost: 30.5,
        tags: '{"Environment":"production","Team":"web"}'
      },
      {
        provider: "aws",
        resourceType: "rds-instance",
        resourceName: "database-01",
        region: "us-east-1",
        instanceType: "db.t3.micro",
        size: 20,
        unit: "GB",
        quantity: 1,
        cost: 15.2,
        tags: '{"Environment":"production","Team":"database"}'
      },
      {
        provider: "oci",
        resourceType: "compute-instance",
        resourceName: "app-server-01",
        region: "us-phoenix-1",
        instanceType: "VM.Standard.E2.1.Micro",
        size: 1,
        unit: "vCPU",
        quantity: 1,
        cost: 25,
        tags: '{"Environment":"staging","Team":"app"}'
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cloud Resources");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
  validateExcelFormat(headers) {
    const requiredFields = ["provider", "resourceType", "resourceName", "region"];
    const errors = [];
    for (const field of requiredFields) {
      if (!headers.some((header) => header.toLowerCase().trim() === field)) {
        errors.push(`Missing required column: ${field}`);
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// server/services/excel-to-iac.ts
import * as XLSX2 from "xlsx";
var ExcelToIaCService = class {
  awsRegion = "ap-south-1";
  // Hyderabad region
  async parseExcelFile(fileBuffer) {
    try {
      const workbook = XLSX2.read(fileBuffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX2.utils.sheet_to_json(sheet, {
        range: 1,
        // Skip first row (header)
        header: [
          "slNo",
          "site",
          "category",
          "workloadType",
          "applicationName",
          "softwares",
          "osName",
          "cpuName",
          "physicalCores",
          "totalThreads",
          "ramGB",
          "bootSpaceGB",
          "dataSpaceGB",
          "fileStorageGB",
          "loadBalanced",
          "haRequired"
        ]
      });
      return jsonData.map((row) => ({
        slNo: Number(row.slNo) || 0,
        site: String(row.site || "").trim(),
        category: String(row.category || "").trim(),
        workloadType: String(row.workloadType || "").trim(),
        applicationName: String(row.applicationName || "").trim(),
        softwares: String(row.softwares || "").trim(),
        osName: String(row.osName || "").trim(),
        cpuName: String(row.cpuName || "").trim(),
        physicalCores: Number(row.physicalCores) || 0,
        totalThreads: Number(row.totalThreads) || 0,
        ramGB: Number(row.ramGB) || 0,
        bootSpaceGB: Number(row.bootSpaceGB) || 0,
        dataSpaceGB: Number(row.dataSpaceGB) || 0,
        fileStorageGB: Number(row.fileStorageGB) || 0,
        loadBalanced: String(row.loadBalanced || "").trim(),
        haRequired: String(row.haRequired || "").trim()
      })).filter((req) => req.slNo > 0);
    } catch (error) {
      console.error("Error parsing Excel file:", error);
      throw new Error("Failed to parse Excel file");
    }
  }
  // Generate Terraform for all cloud providers
  generateMultiCloudTerraform(requirements) {
    return {
      aws: this.generateTerraformCode(requirements),
      azure: this.generateAzureTerraformCode(requirements),
      gcp: this.generateGCPTerraformCode(requirements),
      oci: this.generateOCITerraformCode(requirements)
    };
  }
  generateTerraformCode(requirements) {
    let terraformCode = `# Generated Infrastructure as Code for AWS
# Source: Excel Infrastructure Requirements
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${this.awsRegion}"
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project_name}-igw"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-subnet-\${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.project_name}-private-subnet-\${count.index + 1}"
    Type = "Private"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "\${var.project_name}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-web-sg"
  }
}

resource "aws_security_group" "app" {
  name        = "\${var.project_name}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-app-sg"
  }
}

resource "aws_security_group" "db" {
  name        = "\${var.project_name}-db-sg"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 1521
    to_port         = 1521
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-db-sg"
  }
}

`;
    requirements.forEach((req, index2) => {
      terraformCode += this.generateResourceForRequirement(req, index2);
    });
    terraformCode += `
# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
`;
    return terraformCode;
  }
  generateResourceForRequirement(req, index2) {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index2}`;
    let code = "";
    if (req.workloadType.toLowerCase().includes("db")) {
      code += this.generateRDSInstance(req, resourceName);
    } else {
      code += this.generateEC2Instance(req, resourceName);
    }
    if (req.dataSpaceGB > 0) {
      code += this.generateEBSVolume(req, resourceName);
    }
    if (req.fileStorageGB > 0) {
      code += this.generateEFS(req, resourceName);
    }
    if (req.loadBalanced.toLowerCase().includes("yes")) {
      code += this.generateLoadBalancer(req, resourceName);
    }
    return code;
  }
  generateEC2Instance(req, resourceName) {
    const instanceType = this.mapInstanceType(req.cpuName);
    return `
# EC2 Instance for ${req.applicationName}
resource "aws_instance" "${resourceName}" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "${instanceType}"
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.${req.workloadType.toLowerCase().includes("web") ? "web" : "app"}.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = ${req.bootSpaceGB || 20}
    encrypted   = true
  }

  tags = {
    Name        = "${req.applicationName}-${req.workloadType}"
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              # Add your application installation scripts here
              EOF
  )
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}
`;
  }
  generateRDSInstance(req, resourceName) {
    const instanceClass = this.mapRDSInstanceClass(req.cpuName);
    const allocatedStorage = Math.max(req.dataSpaceGB || 100, 100);
    return `
# RDS Instance for ${req.applicationName}
resource "aws_db_instance" "${resourceName}_db" {
  identifier     = "${resourceName.replace(/_/g, "-")}-db"
  engine         = "oracle-ee"
  engine_version = "19.0.0.0.ru-2021-07.rur-2021-07.r1"
  instance_class = "${instanceClass}"

  allocated_storage     = ${allocatedStorage}
  max_allocated_storage = ${allocatedStorage * 2}
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "ORCL"
  username = "admin"
  password = "change-me-in-production" # Use AWS Secrets Manager in production

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"

  multi_az               = ${req.haRequired.toLowerCase().includes("yes")}
  publicly_accessible    = false

  skip_final_snapshot = true
  deletion_protection = true

  tags = {
    Name        = "${req.applicationName}-database"
    Environment = var.environment
    Workload    = "Database"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "\${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "\${var.project_name} DB subnet group"
  }
}
`;
  }
  generateEBSVolume(req, resourceName) {
    return `
# EBS Volume for ${req.applicationName} data
resource "aws_ebs_volume" "${resourceName}_data" {
  availability_zone = aws_instance.${resourceName}.availability_zone
  size             = ${req.dataSpaceGB}
  type             = "gp3"
  encrypted        = true

  tags = {
    Name = "${req.applicationName}-data-volume"
  }
}

resource "aws_volume_attachment" "${resourceName}_data_attachment" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.${resourceName}_data.id
  instance_id = aws_instance.${resourceName}.id
}
`;
  }
  generateEFS(req, resourceName) {
    return `
# EFS for ${req.applicationName} shared storage
resource "aws_efs_file_system" "${resourceName}_efs" {
  creation_token = "${resourceName}-efs"
  encrypted      = true

  tags = {
    Name = "${req.applicationName}-efs"
  }
}

resource "aws_efs_mount_target" "${resourceName}_efs_mt" {
  count           = length(aws_subnet.private)
  file_system_id  = aws_efs_file_system.${resourceName}_efs.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.app.id]
}
`;
  }
  generateLoadBalancer(req, resourceName) {
    return `
# Application Load Balancer for ${req.applicationName}
resource "aws_lb" "${resourceName}_alb" {
  name               = "${resourceName.replace(/_/g, "-")}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "${req.applicationName}-alb"
  }
}

resource "aws_lb_target_group" "${resourceName}_tg" {
  name     = "${resourceName.replace(/_/g, "-")}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
}

resource "aws_lb_listener" "${resourceName}_listener" {
  load_balancer_arn = aws_lb.${resourceName}_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.${resourceName}_tg.arn
  }
}

resource "aws_lb_target_group_attachment" "${resourceName}_tg_attachment" {
  target_group_arn = aws_lb_target_group.${resourceName}_tg.arn
  target_id        = aws_instance.${resourceName}.id
  port             = 80
}
`;
  }
  mapInstanceType(cpuName) {
    const mappings = {
      "r5.2xlarge": "r5.2xlarge",
      "r5.alarge": "r5.large",
      // Fix typo in Excel
      "r5.large": "r5.large",
      "t3.medium": "t3.medium",
      "t3.large": "t3.large",
      "t3large": "t3.large"
    };
    return mappings[cpuName.toLowerCase()] || "t3.medium";
  }
  mapRDSInstanceClass(cpuName) {
    const mappings = {
      "r5.2xlarge": "db.r5.2xlarge",
      "r5.large": "db.r5.large",
      "t3.medium": "db.t3.medium",
      "t3.large": "db.t3.large"
    };
    return mappings[cpuName.toLowerCase()] || "db.t3.medium";
  }
  generateCostEstimate(requirements) {
    const estimates = [];
    requirements.forEach((req, index2) => {
      const resourceName = `${req.applicationName}_${index2}`;
      if (req.workloadType.toLowerCase().includes("db")) {
        const instanceClass = this.mapRDSInstanceClass(req.cpuName);
        const monthlyCost = this.estimateRDSCost(instanceClass, req.dataSpaceGB || 100);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: "Amazon RDS for Oracle",
          region: "Asia Pacific (Hyderabad)",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Instance: ${instanceClass}, Storage: ${req.dataSpaceGB}GB, Multi-AZ: ${req.haRequired.toLowerCase().includes("yes")}`
        });
      } else {
        const instanceType = this.mapInstanceType(req.cpuName);
        const monthlyCost = this.estimateEC2Cost(instanceType);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: "Amazon EC2",
          region: "Asia Pacific (Hyderabad)",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Instance: ${instanceType}, OS: Linux, Storage: ${req.bootSpaceGB}GB`
        });
      }
      if (req.dataSpaceGB > 0) {
        const ebsCost = req.dataSpaceGB * 0.115;
        estimates.push({
          resourceName: `${req.applicationName}-DataVolume`,
          service: "Amazon EBS",
          region: "Asia Pacific (Hyderabad)",
          monthlyEstimate: ebsCost,
          yearlyEstimate: ebsCost * 12,
          configuration: `GP3 Storage: ${req.dataSpaceGB}GB`
        });
      }
      if (req.fileStorageGB > 0) {
        const efsCost = req.fileStorageGB * 0.345 * 1024;
        estimates.push({
          resourceName: `${req.applicationName}-EFS`,
          service: "Amazon EFS",
          region: "Asia Pacific (Hyderabad)",
          monthlyEstimate: efsCost,
          yearlyEstimate: efsCost * 12,
          configuration: `Standard Storage: ${req.fileStorageGB}GB`
        });
      }
      if (req.loadBalanced.toLowerCase().includes("yes")) {
        const albCost = 23.36;
        estimates.push({
          resourceName: `${req.applicationName}-ALB`,
          service: "Amazon Application Load Balancer",
          region: "Asia Pacific (Hyderabad)",
          monthlyEstimate: albCost,
          yearlyEstimate: albCost * 12,
          configuration: "Application Load Balancer with health checks"
        });
      }
    });
    return estimates;
  }
  estimateEC2Cost(instanceType) {
    const pricing = {
      "t3.medium": 32.14,
      // per month
      "t3.large": 64.28,
      // per month
      "r5.large": 97.82,
      // per month
      "r5.2xlarge": 394.2
      // per month
    };
    return pricing[instanceType] || pricing["t3.medium"];
  }
  estimateRDSCost(instanceClass, storageGB) {
    const instancePricing = {
      "db.t3.medium": 400,
      // per month
      "db.t3.large": 800,
      // per month
      "db.r5.large": 1200,
      // per month
      "db.r5.2xlarge": 1640.96
      // per month
    };
    const instanceCost = instancePricing[instanceClass] || instancePricing["db.t3.medium"];
    const storageCost = storageGB * 0.138;
    return instanceCost + storageCost;
  }
  generateCSV(estimates, provider = "AWS") {
    const totalUpfront = 0;
    const totalMonthly = estimates.reduce((sum, est) => sum + est.monthlyEstimate, 0);
    const total12Months = totalMonthly * 12;
    let csv = `${provider} Cost Estimate Summary
`;
    csv += `Upfront cost,Monthly cost,Total 12 months cost,Currency
`;
    csv += `${totalUpfront},${totalMonthly.toFixed(2)},${total12Months.toFixed(2)},USD
`;
    csv += `,,* Includes upfront cost


`;
    csv += `Detailed Estimate
`;
    csv += `Group hierarchy,Region,Description,Service,Upfront,Monthly,First 12 months total,Currency,Status,Configuration summary
`;
    estimates.forEach((est) => {
      csv += `${provider}-Cost-estimate,${est.region},${est.resourceName},${est.service},0,${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},USD,,${est.configuration}
`;
    });
    csv += `

Acknowledgement
`;
    csv += `"* This is an estimate of cloud provider fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of cloud services."
`;
    return csv;
  }
  generateMultiCloudCSV(requirements) {
    const multiCloudCosts = this.generateMultiCloudCostEstimate(requirements);
    return {
      aws: this.generateCSV(multiCloudCosts.aws.estimates, "AWS"),
      azure: this.generateCSV(multiCloudCosts.azure.estimates, "Azure"),
      gcp: this.generateCSV(multiCloudCosts.gcp.estimates, "GCP"),
      oci: this.generateCSV(multiCloudCosts.oci.estimates, "OCI"),
      combined: this.generateCombinedCSV(multiCloudCosts)
    };
  }
  generateCombinedCSV(multiCloudCosts) {
    let csv = `Multi-Cloud Cost Comparison Summary

`;
    csv += `Provider,Monthly Cost,Yearly Cost,Currency
`;
    csv += `AWS,${multiCloudCosts.aws.totalMonthly.toFixed(2)},${multiCloudCosts.aws.totalYearly.toFixed(2)},USD
`;
    csv += `Azure,${multiCloudCosts.azure.totalMonthly.toFixed(2)},${multiCloudCosts.azure.totalYearly.toFixed(2)},USD
`;
    csv += `GCP,${multiCloudCosts.gcp.totalMonthly.toFixed(2)},${multiCloudCosts.gcp.totalYearly.toFixed(2)},USD
`;
    csv += `OCI,${multiCloudCosts.oci.totalMonthly.toFixed(2)},${multiCloudCosts.oci.totalYearly.toFixed(2)},USD
`;
    const providers = [
      { name: "AWS", monthly: multiCloudCosts.aws.totalMonthly },
      { name: "Azure", monthly: multiCloudCosts.azure.totalMonthly },
      { name: "GCP", monthly: multiCloudCosts.gcp.totalMonthly },
      { name: "OCI", monthly: multiCloudCosts.oci.totalMonthly }
    ];
    const cheapest = providers.reduce((min, p) => p.monthly < min.monthly ? p : min);
    const mostExpensive = providers.reduce((max, p) => p.monthly > max.monthly ? p : max);
    const savings = mostExpensive.monthly - cheapest.monthly;
    const savingsPercent = (savings / mostExpensive.monthly * 100).toFixed(1);
    csv += `
Best Value,${cheapest.name}
`;
    csv += `Potential Savings,"$${savings.toFixed(2)}/month (${savingsPercent}% vs ${mostExpensive.name})"
`;
    csv += `

=== AWS Detailed Breakdown ===
`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration
`;
    multiCloudCosts.aws.estimates.forEach((est) => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"
`;
    });
    csv += `

=== Azure Detailed Breakdown ===
`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration
`;
    multiCloudCosts.azure.estimates.forEach((est) => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"
`;
    });
    csv += `

=== GCP Detailed Breakdown ===
`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration
`;
    multiCloudCosts.gcp.estimates.forEach((est) => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"
`;
    });
    csv += `

=== OCI Detailed Breakdown ===
`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration
`;
    multiCloudCosts.oci.estimates.forEach((est) => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"
`;
    });
    csv += `

Acknowledgement
`;
    csv += `"* This multi-cloud comparison provides estimates from each provider and doesn't include any taxes that might apply. Actual costs depend on various factors including usage patterns, commitment terms, and specific service configurations."
`;
    return csv;
  }
  // Azure Terraform Generation
  generateAzureTerraformCode(requirements) {
    let terraformCode = `# Generated Infrastructure as Code for Azure
# Source: Excel Infrastructure Requirements
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "\${var.project_name}-rg"
  location = var.location

  tags = {
    Environment = var.environment
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "\${var.project_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
  }
}

# Subnets
resource "azurerm_subnet" "public" {
  name                 = "\${var.project_name}-public-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "private" {
  name                 = "\${var.project_name}-private-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.10.0/24"]
}

# Network Security Groups
resource "azurerm_network_security_group" "web" {
  name                = "\${var.project_name}-web-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 101
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "app" {
  name                = "\${var.project_name}-app-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AppPort"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "10.0.0.0/16"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "db" {
  name                = "\${var.project_name}-db-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "OracleDB"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "1521"
    source_address_prefix      = "10.0.0.0/16"
    destination_address_prefix = "*"
  }
}

`;
    requirements.forEach((req, index2) => {
      terraformCode += this.generateAzureResourceForRequirement(req, index2);
    });
    terraformCode += `
# Outputs
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.main.id
}
`;
    return terraformCode;
  }
  generateAzureResourceForRequirement(req, index2) {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index2}`;
    let code = "";
    if (req.workloadType.toLowerCase().includes("db")) {
      code += this.generateAzureDBInstance(req, resourceName);
    } else {
      code += this.generateAzureVM(req, resourceName);
    }
    if (req.loadBalanced.toLowerCase().includes("yes")) {
      code += this.generateAzureLoadBalancer(req, resourceName);
    }
    return code;
  }
  generateAzureVM(req, resourceName) {
    const vmSize = this.mapAzureVMSize(req.cpuName);
    return `
# Azure VM for ${req.applicationName}
resource "azurerm_network_interface" "${resourceName}_nic" {
  name                = "${resourceName}-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.private.id
    private_ip_address_allocation = "Dynamic"
  }
}

resource "azurerm_linux_virtual_machine" "${resourceName}" {
  name                = "${req.applicationName}-${req.workloadType}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  size                = "${vmSize}"
  admin_username      = "adminuser"

  network_interface_ids = [
    azurerm_network_interface.${resourceName}_nic.id,
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = ${req.bootSpaceGB || 30}
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }

  tags = {
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }
}

${req.dataSpaceGB > 0 ? `
resource "azurerm_managed_disk" "${resourceName}_data" {
  name                 = "${resourceName}-data-disk"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = ${req.dataSpaceGB}
}

resource "azurerm_virtual_machine_data_disk_attachment" "${resourceName}_data_attach" {
  managed_disk_id    = azurerm_managed_disk.${resourceName}_data.id
  virtual_machine_id = azurerm_linux_virtual_machine.${resourceName}.id
  lun                = "0"
  caching            = "ReadWrite"
}
` : ""}
`;
  }
  generateAzureDBInstance(req, resourceName) {
    return `
# Azure Database for ${req.applicationName}
resource "azurerm_mssql_server" "${resourceName}_sql" {
  name                         = "${resourceName}-sqlserver"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = "Change-Me-In-Production-123!"
  minimum_tls_version          = "1.2"

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_mssql_database" "${resourceName}_db" {
  name      = "${req.applicationName}-db"
  server_id = azurerm_mssql_server.${resourceName}_sql.id
  sku_name  = "S1"

  max_size_gb = ${Math.max(req.dataSpaceGB || 100, 100)}

  tags = {
    Environment = var.environment
    Workload    = "Database"
  }
}
`;
  }
  generateAzureLoadBalancer(req, resourceName) {
    return `
# Azure Load Balancer for ${req.applicationName}
resource "azurerm_public_ip" "${resourceName}_lb_ip" {
  name                = "${resourceName}-lb-ip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_lb" "${resourceName}_lb" {
  name                = "${resourceName}-lb"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.${resourceName}_lb_ip.id
  }
}

resource "azurerm_lb_backend_address_pool" "${resourceName}_pool" {
  loadbalancer_id = azurerm_lb.${resourceName}_lb.id
  name            = "${resourceName}-backend-pool"
}

resource "azurerm_lb_probe" "${resourceName}_probe" {
  loadbalancer_id = azurerm_lb.${resourceName}_lb.id
  name            = "http-probe"
  port            = 80
}

resource "azurerm_lb_rule" "${resourceName}_rule" {
  loadbalancer_id                = azurerm_lb.${resourceName}_lb.id
  name                           = "HTTP"
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  frontend_ip_configuration_name = "PublicIPAddress"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.${resourceName}_pool.id]
  probe_id                       = azurerm_lb_probe.${resourceName}_probe.id
}
`;
  }
  mapAzureVMSize(cpuName) {
    const mappings = {
      "r5.2xlarge": "Standard_E8s_v3",
      "r5.large": "Standard_E2s_v3",
      "t3.medium": "Standard_B2ms",
      "t3.large": "Standard_B4ms"
    };
    return mappings[cpuName.toLowerCase()] || "Standard_B2ms";
  }
  // GCP Terraform Generation
  generateGCPTerraformCode(requirements) {
    let terraformCode = `# Generated Infrastructure as Code for GCP
# Source: Excel Infrastructure Requirements
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "\${var.project_name}-vpc"
  auto_create_subnetworks = false
}

# Subnets
resource "google_compute_subnetwork" "public" {
  name          = "\${var.project_name}-public-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

resource "google_compute_subnetwork" "private" {
  name          = "\${var.project_name}-private-subnet"
  ip_cidr_range = "10.0.10.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

# Firewall Rules
resource "google_compute_firewall" "web" {
  name    = "\${var.project_name}-web-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web"]
}

resource "google_compute_firewall" "app" {
  name    = "\${var.project_name}-app-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = ["10.0.0.0/16"]
  target_tags   = ["app"]
}

resource "google_compute_firewall" "db" {
  name    = "\${var.project_name}-db-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["1521", "3306", "5432"]
  }

  source_ranges = ["10.0.0.0/16"]
  target_tags   = ["database"]
}

`;
    requirements.forEach((req, index2) => {
      terraformCode += this.generateGCPResourceForRequirement(req, index2);
    });
    terraformCode += `
# Outputs
output "network_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.main.name
}

output "network_id" {
  description = "ID of the VPC network"
  value       = google_compute_network.main.id
}
`;
    return terraformCode;
  }
  generateGCPResourceForRequirement(req, index2) {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index2}`;
    let code = "";
    if (req.workloadType.toLowerCase().includes("db")) {
      code += this.generateGCPDBInstance(req, resourceName);
    } else {
      code += this.generateGCPComputeInstance(req, resourceName);
    }
    if (req.loadBalanced.toLowerCase().includes("yes")) {
      code += this.generateGCPLoadBalancer(req, resourceName);
    }
    return code;
  }
  generateGCPComputeInstance(req, resourceName) {
    const machineType = this.mapGCPMachineType(req.cpuName);
    return `
# GCP Compute Instance for ${req.applicationName}
resource "google_compute_instance" "${resourceName}" {
  name         = "${req.applicationName.toLowerCase().replace(/[^a-z0-9-]/g, "-")}-${req.workloadType.toLowerCase()}"
  machine_type = "${machineType}"
  zone         = "\${var.region}-a"

  tags = ${req.workloadType.toLowerCase().includes("web") ? '["web"]' : '["app"]'}

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
      size  = ${req.bootSpaceGB || 20}
      type  = "pd-ssd"
    }
  }

  ${req.dataSpaceGB > 0 ? `
  attached_disk {
    source = google_compute_disk.${resourceName}_data.id
    mode   = "READ_WRITE"
  }
  ` : ""}

  network_interface {
    subnetwork = google_compute_subnetwork.private.id
  }

  metadata = {
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    # Add your application installation scripts here
  EOF
}

${req.dataSpaceGB > 0 ? `
resource "google_compute_disk" "${resourceName}_data" {
  name = "${resourceName}-data-disk"
  type = "pd-ssd"
  zone = "\${var.region}-a"
  size = ${req.dataSpaceGB}
}
` : ""}
`;
  }
  generateGCPDBInstance(req, resourceName) {
    return `
# GCP Cloud SQL Instance for ${req.applicationName}
resource "google_sql_database_instance" "${resourceName}_db" {
  name             = "${resourceName}-db"
  database_version = "MYSQL_8_0"
  region           = var.region

  settings {
    tier = "db-n1-standard-2"

    disk_size       = ${Math.max(req.dataSpaceGB || 100, 100)}
    disk_type       = "PD_SSD"
    disk_autoresize = true

    backup_configuration {
      enabled            = true
      start_time         = "03:00"
      binary_log_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    ${req.haRequired.toLowerCase().includes("yes") ? 'availability_type = "REGIONAL"' : ""}
  }

  deletion_protection = true
}

resource "google_sql_database" "${resourceName}_database" {
  name     = "${req.applicationName.toLowerCase().replace(/[^a-z0-9_]/g, "_")}"
  instance = google_sql_database_instance.${resourceName}_db.name
}
`;
  }
  generateGCPLoadBalancer(req, resourceName) {
    return `
# GCP Load Balancer for ${req.applicationName}
resource "google_compute_global_address" "${resourceName}_lb_ip" {
  name = "${resourceName}-lb-ip"
}

resource "google_compute_backend_service" "${resourceName}_backend" {
  name          = "${resourceName}-backend"
  health_checks = [google_compute_health_check.${resourceName}_health.id]

  backend {
    group = google_compute_instance_group.${resourceName}_group.id
  }
}

resource "google_compute_health_check" "${resourceName}_health" {
  name               = "${resourceName}-health-check"
  check_interval_sec = 30
  timeout_sec        = 5

  http_health_check {
    port = 80
    request_path = "/"
  }
}

resource "google_compute_instance_group" "${resourceName}_group" {
  name = "${resourceName}-instance-group"
  zone = "\${var.region}-a"

  instances = [
    google_compute_instance.${resourceName}.id
  ]
}

resource "google_compute_url_map" "${resourceName}_url_map" {
  name            = "${resourceName}-url-map"
  default_service = google_compute_backend_service.${resourceName}_backend.id
}

resource "google_compute_target_http_proxy" "${resourceName}_proxy" {
  name    = "${resourceName}-http-proxy"
  url_map = google_compute_url_map.${resourceName}_url_map.id
}

resource "google_compute_global_forwarding_rule" "${resourceName}_forwarding" {
  name       = "${resourceName}-forwarding-rule"
  target     = google_compute_target_http_proxy.${resourceName}_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.${resourceName}_lb_ip.address
}
`;
  }
  mapGCPMachineType(cpuName) {
    const mappings = {
      "r5.2xlarge": "n2-highmem-8",
      "r5.large": "n2-highmem-2",
      "t3.medium": "n2-standard-2",
      "t3.large": "n2-standard-4"
    };
    return mappings[cpuName.toLowerCase()] || "n2-standard-2";
  }
  // OCI Terraform Generation
  generateOCITerraformCode(requirements) {
    let terraformCode = `# Generated Infrastructure as Code for OCI
# Source: Excel Infrastructure Requirements
# Generated: ${(/* @__PURE__ */ new Date()).toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Variables
variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "OCI API Key Fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API private key"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "ap-hyderabad-1"
}

variable "compartment_id" {
  description = "OCI Compartment OCID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# VCN (Virtual Cloud Network)
resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_id
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "\${var.project_name}-vcn"
  dns_label      = "mainvcn"

  freeform_tags = {
    Environment = var.environment
  }
}

# Internet Gateway
resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-igw"
  enabled        = true
}

# Route Table
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-public-rt"

  route_rules {
    network_entity_id = oci_core_internet_gateway.main.id
    destination       = "0.0.0.0/0"
  }
}

# Subnets
resource "oci_core_subnet" "public" {
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.main.id
  cidr_block        = "10.0.1.0/24"
  display_name      = "\${var.project_name}-public-subnet"
  route_table_id    = oci_core_route_table.public.id
  security_list_ids = [oci_core_security_list.public.id]
  dns_label         = "public"
}

resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = "10.0.10.0/24"
  display_name               = "\${var.project_name}-private-subnet"
  prohibit_public_ip_on_vnic = true
  security_list_ids          = [oci_core_security_list.private.id]
  dns_label                  = "private"
}

# Security Lists
resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-public-sl"

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-private-sl"

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "10.0.0.0/16"
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

`;
    requirements.forEach((req, index2) => {
      terraformCode += this.generateOCIResourceForRequirement(req, index2);
    });
    terraformCode += `
# Outputs
output "vcn_id" {
  description = "ID of the VCN"
  value       = oci_core_vcn.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = oci_core_subnet.public.id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = oci_core_subnet.private.id
}
`;
    return terraformCode;
  }
  generateOCIResourceForRequirement(req, index2) {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${index2}`;
    let code = "";
    if (req.workloadType.toLowerCase().includes("db")) {
      code += this.generateOCIDBInstance(req, resourceName);
    } else {
      code += this.generateOCIComputeInstance(req, resourceName);
    }
    if (req.loadBalanced.toLowerCase().includes("yes")) {
      code += this.generateOCILoadBalancer(req, resourceName);
    }
    return code;
  }
  generateOCIComputeInstance(req, resourceName) {
    const shape = this.mapOCIShape(req.cpuName);
    return `
# OCI Compute Instance for ${req.applicationName}
data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "${shape}"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "${resourceName}" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${req.applicationName}-${req.workloadType}"
  shape               = "${shape}"

  ${shape.startsWith("VM.Standard.E") ? `
  shape_config {
    memory_in_gbs = ${req.ramGB || 8}
    ocpus         = ${req.physicalCores || 2}
  }
  ` : ""}

  create_vnic_details {
    subnet_id        = oci_core_subnet.private.id
    assign_public_ip = false
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux.images[0].id
    boot_volume_size_in_gbs = ${req.bootSpaceGB || 50}
  }

  metadata = {
    user_data = base64encode(<<-EOF
      #!/bin/bash
      yum update -y
      # Add your application installation scripts here
    EOF
    )
  }

  freeform_tags = {
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }
}

${req.dataSpaceGB > 0 ? `
resource "oci_core_volume" "${resourceName}_data" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${resourceName}-data-volume"
  size_in_gbs         = ${req.dataSpaceGB}
}

resource "oci_core_volume_attachment" "${resourceName}_data_attach" {
  attachment_type = "iscsi"
  instance_id     = oci_core_instance.${resourceName}.id
  volume_id       = oci_core_volume.${resourceName}_data.id
}
` : ""}
`;
  }
  generateOCIDBInstance(req, resourceName) {
    return `
# OCI Database System for ${req.applicationName}
resource "oci_database_db_system" "${resourceName}_db" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  database_edition    = "ENTERPRISE_EDITION"

  db_home {
    database {
      admin_password = "Change_Me_In_Production_123"
      db_name        = "${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 8)}"
      pdb_name       = "PDB1"
    }
    db_version   = "19.0.0.0"
    display_name = "${req.applicationName}-dbhome"
  }

  shape                   = "VM.Standard2.2"
  subnet_id              = oci_core_subnet.private.id
  ssh_public_keys        = [file("~/.ssh/id_rsa.pub")]
  display_name           = "${req.applicationName}-database"
  hostname               = "${resourceName}db"
  data_storage_size_in_gb = ${Math.max(req.dataSpaceGB || 256, 256)}
  license_model          = "BRING_YOUR_OWN_LICENSE"
  node_count             = ${req.haRequired.toLowerCase().includes("yes") ? "2" : "1"}

  freeform_tags = {
    Environment = var.environment
    Workload    = "Database"
  }
}
`;
  }
  generateOCILoadBalancer(req, resourceName) {
    return `
# OCI Load Balancer for ${req.applicationName}
resource "oci_load_balancer_load_balancer" "${resourceName}_lb" {
  compartment_id = var.compartment_id
  display_name   = "${resourceName}-lb"
  shape          = "flexible"

  shape_details {
    minimum_bandwidth_in_mbps = 10
    maximum_bandwidth_in_mbps = 100
  }

  subnet_ids = [
    oci_core_subnet.public.id
  ]

  is_private = false

  freeform_tags = {
    Environment = var.environment
  }
}

resource "oci_load_balancer_backend_set" "${resourceName}_backend_set" {
  load_balancer_id = oci_load_balancer_load_balancer.${resourceName}_lb.id
  name             = "${resourceName}-backend-set"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol = "HTTP"
    port     = 80
    url_path = "/"
  }
}

resource "oci_load_balancer_backend" "${resourceName}_backend" {
  load_balancer_id = oci_load_balancer_load_balancer.${resourceName}_lb.id
  backendset_name  = oci_load_balancer_backend_set.${resourceName}_backend_set.name
  ip_address       = oci_core_instance.${resourceName}.private_ip
  port             = 80
  backup           = false
  drain            = false
  offline          = false
  weight           = 1
}

resource "oci_load_balancer_listener" "${resourceName}_listener" {
  load_balancer_id         = oci_load_balancer_load_balancer.${resourceName}_lb.id
  name                     = "${resourceName}-listener"
  default_backend_set_name = oci_load_balancer_backend_set.${resourceName}_backend_set.name
  port                     = 80
  protocol                 = "HTTP"
}
`;
  }
  mapOCIShape(cpuName) {
    const mappings = {
      "r5.2xlarge": "VM.Standard.E4.Flex",
      "r5.large": "VM.Standard.E4.Flex",
      "t3.medium": "VM.Standard.E2.2",
      "t3.large": "VM.Standard.E2.4"
    };
    return mappings[cpuName.toLowerCase()] || "VM.Standard.E2.2";
  }
  // Multi-Cloud Cost Estimation
  generateMultiCloudCostEstimate(requirements) {
    return {
      aws: {
        estimates: this.generateAWSCostEstimate(requirements),
        totalMonthly: this.generateAWSCostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateAWSCostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      },
      azure: {
        estimates: this.generateAzureCostEstimate(requirements),
        totalMonthly: this.generateAzureCostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateAzureCostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      },
      gcp: {
        estimates: this.generateGCPCostEstimate(requirements),
        totalMonthly: this.generateGCPCostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateGCPCostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      },
      oci: {
        estimates: this.generateOCICostEstimate(requirements),
        totalMonthly: this.generateOCICostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateOCICostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      }
    };
  }
  generateAWSCostEstimate(requirements) {
    return this.generateCostEstimate(requirements);
  }
  generateAzureCostEstimate(requirements) {
    const estimates = [];
    requirements.forEach((req, index2) => {
      if (req.workloadType.toLowerCase().includes("db")) {
        const monthlyCost = this.estimateAzureDBCost(req.dataSpaceGB || 100);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: "Azure SQL Database",
          region: "Central India",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `S1 tier, Storage: ${req.dataSpaceGB}GB`
        });
      } else {
        const vmSize = this.mapAzureVMSize(req.cpuName);
        const monthlyCost = this.estimateAzureVMCost(vmSize);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: "Azure Virtual Machine",
          region: "Central India",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `VM Size: ${vmSize}, OS: Linux, Storage: ${req.bootSpaceGB}GB`
        });
      }
      if (req.dataSpaceGB > 0) {
        const diskCost = req.dataSpaceGB * 0.125;
        estimates.push({
          resourceName: `${req.applicationName}-DataDisk`,
          service: "Azure Managed Disk",
          region: "Central India",
          monthlyEstimate: diskCost,
          yearlyEstimate: diskCost * 12,
          configuration: `Premium SSD: ${req.dataSpaceGB}GB`
        });
      }
      if (req.loadBalanced.toLowerCase().includes("yes")) {
        const lbCost = 25;
        estimates.push({
          resourceName: `${req.applicationName}-LB`,
          service: "Azure Load Balancer",
          region: "Central India",
          monthlyEstimate: lbCost,
          yearlyEstimate: lbCost * 12,
          configuration: "Standard Load Balancer"
        });
      }
    });
    return estimates;
  }
  generateGCPCostEstimate(requirements) {
    const estimates = [];
    requirements.forEach((req, index2) => {
      if (req.workloadType.toLowerCase().includes("db")) {
        const monthlyCost = this.estimateGCPDBCost(req.dataSpaceGB || 100);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: "Cloud SQL",
          region: "asia-south1 (Mumbai)",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `db-n1-standard-2, Storage: ${req.dataSpaceGB}GB`
        });
      } else {
        const machineType = this.mapGCPMachineType(req.cpuName);
        const monthlyCost = this.estimateGCPComputeCost(machineType);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: "Compute Engine",
          region: "asia-south1 (Mumbai)",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Machine: ${machineType}, OS: Linux, Storage: ${req.bootSpaceGB}GB`
        });
      }
      if (req.dataSpaceGB > 0) {
        const diskCost = req.dataSpaceGB * 0.187;
        estimates.push({
          resourceName: `${req.applicationName}-DataDisk`,
          service: "Persistent Disk",
          region: "asia-south1 (Mumbai)",
          monthlyEstimate: diskCost,
          yearlyEstimate: diskCost * 12,
          configuration: `SSD: ${req.dataSpaceGB}GB`
        });
      }
      if (req.loadBalanced.toLowerCase().includes("yes")) {
        const lbCost = 22;
        estimates.push({
          resourceName: `${req.applicationName}-LB`,
          service: "Cloud Load Balancer",
          region: "asia-south1 (Mumbai)",
          monthlyEstimate: lbCost,
          yearlyEstimate: lbCost * 12,
          configuration: "HTTP(S) Load Balancer"
        });
      }
    });
    return estimates;
  }
  generateOCICostEstimate(requirements) {
    const estimates = [];
    requirements.forEach((req, index2) => {
      if (req.workloadType.toLowerCase().includes("db")) {
        const monthlyCost = this.estimateOCIDBCost(req.dataSpaceGB || 256);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: "OCI Database",
          region: "Hyderabad",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `VM.Standard2.2, Storage: ${req.dataSpaceGB}GB`
        });
      } else {
        const shape = this.mapOCIShape(req.cpuName);
        const monthlyCost = this.estimateOCIComputeCost(shape, req.physicalCores || 2, req.ramGB || 8);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: "OCI Compute",
          region: "Hyderabad",
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Shape: ${shape}, RAM: ${req.ramGB}GB, Storage: ${req.bootSpaceGB}GB`
        });
      }
      if (req.dataSpaceGB > 0) {
        const diskCost = req.dataSpaceGB * 0.085;
        estimates.push({
          resourceName: `${req.applicationName}-DataVolume`,
          service: "OCI Block Volume",
          region: "Hyderabad",
          monthlyEstimate: diskCost,
          yearlyEstimate: diskCost * 12,
          configuration: `Block Storage: ${req.dataSpaceGB}GB`
        });
      }
      if (req.loadBalanced.toLowerCase().includes("yes")) {
        const lbCost = 20;
        estimates.push({
          resourceName: `${req.applicationName}-LB`,
          service: "OCI Load Balancer",
          region: "Hyderabad",
          monthlyEstimate: lbCost,
          yearlyEstimate: lbCost * 12,
          configuration: "Flexible Load Balancer"
        });
      }
    });
    return estimates;
  }
  estimateAzureVMCost(vmSize) {
    const pricing = {
      "Standard_B2ms": 60.74,
      // per month
      "Standard_B4ms": 121.47,
      // per month
      "Standard_E2s_v3": 122.63,
      // per month
      "Standard_E8s_v3": 490.51
      // per month
    };
    return pricing[vmSize] || pricing["Standard_B2ms"];
  }
  estimateAzureDBCost(storageGB) {
    const baseCost = 30;
    const storageCost = storageGB * 0.125;
    return baseCost + storageCost;
  }
  estimateGCPComputeCost(machineType) {
    const pricing = {
      "n2-standard-2": 70.08,
      // per month
      "n2-standard-4": 140.16,
      // per month
      "n2-highmem-2": 94.9,
      // per month
      "n2-highmem-8": 379.58
      // per month
    };
    return pricing[machineType] || pricing["n2-standard-2"];
  }
  estimateGCPDBCost(storageGB) {
    const baseCost = 150;
    const storageCost = storageGB * 0.187;
    return baseCost + storageCost;
  }
  estimateOCIComputeCost(shape, ocpus, ramGB) {
    if (shape.includes("Flex")) {
      const ocpuCost = ocpus * 36.5;
      const ramCost = ramGB * 4.56;
      return ocpuCost + ramCost;
    }
    const pricing = {
      "VM.Standard.E2.2": 85.41,
      // per month
      "VM.Standard.E2.4": 170.82
      // per month
    };
    return pricing[shape] || pricing["VM.Standard.E2.2"];
  }
  estimateOCIDBCost(storageGB) {
    const baseCost = 350;
    const storageCost = storageGB * 0.085;
    return baseCost + storageCost;
  }
};

// server/services/google-sheets-service.ts
import { google } from "googleapis";
var GoogleSheetsService = class {
  sheets;
  drive;
  auth;
  constructor(config) {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey.replace(/\\n/g, "\n")
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file"
      ]
    });
    this.sheets = google.sheets({ version: "v4", auth: this.auth });
    this.drive = google.drive({ version: "v3", auth: this.auth });
  }
  /**
   * Upload Excel file data to Google Sheets
   */
  async uploadExcelData(fileName, data, headers) {
    try {
      const spreadsheet = await this.createSpreadsheet(fileName);
      if (!spreadsheet.spreadsheetId) {
        throw new Error("Failed to create spreadsheet");
      }
      const sheetData = [
        headers,
        // Header row
        ...data
        // Data rows
      ];
      await this.writeToSheet(spreadsheet.spreadsheetId, "Sheet1", sheetData);
      await this.makePublic(spreadsheet.spreadsheetId);
      return {
        success: true,
        spreadsheetId: spreadsheet.spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.spreadsheetId}/edit`
      };
    } catch (error) {
      console.error("Google Sheets upload error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Create a new Google Spreadsheet
   */
  async createSpreadsheet(title) {
    const request = {
      properties: {
        title: `${title} - Cloudedze Analysis`
      }
    };
    const response = await this.sheets.spreadsheets.create({
      requestBody: request
    });
    return {
      spreadsheetId: response.data.spreadsheetId || ""
    };
  }
  /**
   * Write data to a specific sheet
   */
  async writeToSheet(spreadsheetId, range, values) {
    await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values
      }
    });
  }
  /**
   * Make spreadsheet publicly viewable
   */
  async makePublic(spreadsheetId) {
    try {
      await this.drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: {
          role: "reader",
          type: "anyone"
        }
      });
    } catch (error) {
      console.warn("Failed to make spreadsheet public:", error);
    }
  }
  /**
   * Get spreadsheet URL by ID
   */
  getSpreadsheetUrl(spreadsheetId) {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
  }
  /**
   * Share spreadsheet with specific email
   */
  async shareWithEmail(spreadsheetId, email, role = "reader") {
    await this.drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role,
        type: "user",
        emailAddress: email
      }
    });
  }
};

// server/auth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
var storage2 = new DatabaseStorage();
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const PgSession = connectPg(session);
  return session({
    name: "cloudedze.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    // ADDED: Trust nginx proxy
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: "sessions"
    }),
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl,
      sameSite: "lax"
    }
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password"
    },
    async (email, password, done) => {
      try {
        const user = await storage2.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }
        const isValidPassword = await bcrypt.compare(password, user.password || "");
        if (!isValidPassword) {
          return done(null, false, { message: "Invalid email or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage2.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  app2.post("/api/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const existingUser = await storage2.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage2.createUser({
        email,
        password: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || ""
      });
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        res.json({
          message: "Registration successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });
  app2.post("/api/login", passport.authenticate("local"), (req, res) => {
    console.log("Login successful, user:", req.user);
    console.log("Session ID:", req.sessionID);
    console.log("Is authenticated:", req.isAuthenticated());
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ message: "Session save failed" });
      }
      res.json({
        message: "Login successful",
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      });
    });
  });
  app2.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    console.log("Auth check - Session ID:", req.sessionID);
    console.log("Auth check - Is authenticated:", req.isAuthenticated());
    console.log("Auth check - User:", req.user);
    console.log("Auth check - Cookie:", req.headers.cookie);
    if (req.isAuthenticated()) {
      res.json({
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  app2.get("/api/debug/db", async (req, res) => {
    try {
      const userCount = await storage2.getUserByEmail("test@example.com");
      res.json({
        message: "Database connection working",
        userExists: !!userCount,
        userEmail: userCount?.email
      });
    } catch (error) {
      res.status(500).json({
        message: "Database error",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}
var isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// server/routes.ts
import multer from "multer";
async function registerRoutes(app2) {
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      version: "1.0.0"
    });
  });
  app2.post("/api/debug/inventory", isAuthenticated, async (req, res) => {
    try {
      console.log("\u{1F50D} DEBUG: Testing inventory scan logic");
      const userId = req.user.id;
      console.log("User ID:", userId);
      const credentials = await storage.getUserCloudCredentials(userId);
      console.log("User credentials:", credentials.length);
      if (credentials.length === 0) {
        return res.json({ message: "No credentials found", credentials: [] });
      }
      const credential = credentials[0];
      console.log("First credential:", credential.id, credential.provider);
      let decryptedCredentials;
      try {
        decryptedCredentials = JSON.parse(credential.encryptedCredentials);
        console.log("Decrypted credentials keys:", Object.keys(decryptedCredentials));
      } catch (parseError) {
        console.log("Parse error:", parseError.message);
        return res.json({ error: "Failed to parse credentials", parseError: parseError.message });
      }
      res.json({
        message: "Debug successful",
        userId,
        credentialsCount: credentials.length,
        firstCredential: {
          id: credential.id,
          provider: credential.provider,
          name: credential.name,
          decryptedKeys: Object.keys(decryptedCredentials)
        }
      });
    } catch (error) {
      console.log("\u274C DEBUG ERROR:", error.message);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });
  const costCalculator = new ComprehensiveCostCalculator();
  const inventoryService = new CloudInventoryService();
  const terraformParser = new TerraformStateParser();
  const excelParser = new ExcelParserService();
  let googleSheetsService = null;
  if (process.env.GOOGLE_SHEETS_ENABLED === "true" && process.env.GOOGLE_SHEETS_CLIENT_EMAIL && process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
    try {
      googleSheetsService = new GoogleSheetsService({
        clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY
      });
      console.log("\u2705 Google Sheets service initialized");
    } catch (error) {
      console.warn("\u26A0\uFE0F Failed to initialize Google Sheets service:", error);
    }
  }
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024
      // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      cb(null, true);
    }
  });
  app2.post("/api/calculate", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const requirements = infrastructureRequirementsSchema.parse(req.body);
      const results = costCalculator.calculateCosts(requirements);
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
  app2.get("/api/analysis/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/analyses", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const analyses = await storage.getAllCostAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ message: "Failed to retrieve analyses" });
    }
  });
  app2.get("/api/export/:id/csv", isAuthenticated, async (req, res) => {
    try {
      const analysis = await storage.getCostAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      const results = analysis.results;
      let csv = "Provider,Compute,Storage,Database,Networking,Total\n";
      results.providers.forEach((provider) => {
        csv += `${provider.name},${provider.compute},${provider.storage},${provider.database},${provider.networking},${provider.total}
`;
      });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=cost-analysis-${req.params.id}.csv`);
      res.send(csv);
    } catch (error) {
      console.error("Export CSV error:", error);
      res.status(500).json({ message: "Failed to export CSV" });
    }
  });
  app2.post("/api/credentials", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { provider, name, encryptedCredentials } = req.body;
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
  app2.get("/api/credentials", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCloudCredentials(userId);
      const safeCredentials = credentials.map((cred) => ({
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
  app2.get("/api/credentials/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const credential = await storage.getCloudCredential(req.params.id, userId);
      if (!credential) {
        return res.status(404).json({ message: "Credential not found" });
      }
      res.json({
        id: credential.id,
        name: credential.name,
        provider: credential.provider,
        credentials: credential.encryptedCredentials,
        // This is already decrypted by storage
        isValidated: credential.isValidated
      });
    } catch (error) {
      console.error("Get credential error:", error);
      res.status(500).json({ message: "Failed to retrieve credential" });
    }
  });
  app2.put("/api/credentials/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/credentials/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/credentials/validate/oci", isAuthenticated, async (req, res) => {
    try {
      const { credentials } = req.body;
      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: "OCI credentials are required"
        });
      }
      const { OCIInventoryService: OCIInventoryService2 } = await Promise.resolve().then(() => (init_oci_inventory(), oci_inventory_exports));
      const ociService = new OCIInventoryService2(credentials);
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
  app2.post("/api/test/oci", isAuthenticated, async (req, res) => {
    try {
      const { credentials } = req.body;
      if (!credentials) {
        return res.status(400).json({
          success: false,
          message: "OCI credentials are required"
        });
      }
      const { OCIInventoryService: OCIInventoryService2 } = await Promise.resolve().then(() => (init_oci_inventory(), oci_inventory_exports));
      const ociService = new OCIInventoryService2(credentials);
      const isValid = await ociService.validateCredentials();
      if (!isValid) {
        return res.json({
          success: false,
          message: "OCI credentials validation failed"
        });
      }
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
          message: `OCI connection test failed: ${discoveryError instanceof Error ? discoveryError.message : "Unknown error"}`,
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
  app2.get("/api/inventory/providers", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const credentials = await storage.getUserCloudCredentials(userId);
      const providers = [...new Set(credentials.map((cred) => cred.provider))];
      res.json({ providers });
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ message: "Failed to get providers" });
    }
  });
  app2.post("/api/inventory/scan/oci", isAuthenticated, async (req, res) => {
    console.log("\u{1F50D} OCI-specific inventory scan started");
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log("\u23F0 OCI scan timeout after 3 minutes");
        res.status(408).json({
          message: "OCI scan timeout - operation took too long. Please check your OCI credentials and network connectivity.",
          timeout: true
        });
      }
    }, 3 * 60 * 1e3);
    try {
      const userId = req.user.id;
      const { credentialId, credentials } = req.body;
      const startTime = Date.now();
      console.log("User ID:", userId);
      let ociCredentials;
      if (credentialId) {
        console.log("Loading OCI credential from ID:", credentialId);
        const credential = await storage.getCloudCredential(credentialId, userId);
        if (!credential || credential.provider !== "oci") {
          return res.status(400).json({
            success: false,
            message: "OCI credential not found or invalid provider"
          });
        }
        try {
          ociCredentials = JSON.parse(credential.encryptedCredentials);
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: "Invalid credential data format"
          });
        }
      } else if (credentials) {
        ociCredentials = credentials;
      } else {
        return res.status(400).json({
          success: false,
          message: "Either credentialId or credentials must be provided"
        });
      }
      console.log("\u2705 OCI credentials loaded");
      const { OCIInventoryService: OCIInventoryService2 } = await Promise.resolve().then(() => (init_oci_inventory(), oci_inventory_exports));
      const ociService = new OCIInventoryService2(ociCredentials);
      console.log("\u{1F50D} Starting OCI resource discovery...");
      const ociInventory = await ociService.discoverResources();
      console.log(`\u2705 OCI discovery completed: Found ${ociInventory.resources.length} resources`);
      const resources = ociInventory.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        type: resource.type,
        service: resource.service,
        provider: "oci",
        location: resource.region,
        state: resource.state,
        tags: {},
        costDetails: resource.costDetails
      }));
      const inventory = {
        resources,
        summary: {
          totalResources: resources.length,
          providers: { "oci": resources.length },
          services: ociInventory.summary.byService,
          locations: ociInventory.summary.byRegion
        },
        scanDate: (/* @__PURE__ */ new Date()).toISOString(),
        scanDuration: Date.now() - startTime
      };
      console.log("\u{1F4BE} Saving OCI inventory scan...");
      const inventoryScan = await storage.createInventoryScan({
        scanData: { success: true, inventory },
        summary: {
          totalResources: inventory.resources.length,
          scannedProviders: 1,
          scanTime: (/* @__PURE__ */ new Date()).toISOString()
        },
        scanDuration: inventory.scanDuration
      }, userId);
      console.log(`\u2705 OCI inventory scan saved with ID: ${inventoryScan.id}`);
      console.log("\u{1F4B0} Generating OCI cost analysis...");
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        costAnalysis = await storage.createCostAnalysis({
          requirements: {
            currency: "USD",
            licensing: {
              windows: { enabled: false, licenses: 0 },
              sqlServer: { enabled: false, edition: "standard", licenses: 0 },
              oracle: { enabled: false, edition: "standard", licenses: 0 },
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
          },
          results: analysis.results || {},
          inventoryScanId: inventoryScan.id
        }, userId);
        console.log("\u2705 OCI cost analysis created successfully");
      } catch (analysisError) {
        console.log("\u26A0\uFE0F OCI cost analysis failed (continuing anyway):", analysisError.message);
      }
      console.log("\u{1F389} OCI INVENTORY SCAN COMPLETED SUCCESSFULLY");
      clearTimeout(timeout);
      res.json({
        success: true,
        inventory,
        scanId: inventoryScan.id,
        costAnalysis,
        oci: {
          tenancyId: ociCredentials.tenancyId,
          region: ociCredentials.region,
          resourcesByService: ociInventory.summary.byService,
          resourcesByRegion: ociInventory.summary.byRegion,
          resourcesByState: ociInventory.summary.byState
        }
      });
    } catch (error) {
      console.log("\u274C OCI INVENTORY SCAN FAILED:", error.message);
      console.log("\u274C Error stack:", error.stack);
      clearTimeout(timeout);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to scan OCI resources",
        error: error.message,
        stack: error.stack
      });
    }
  });
  app2.post("/api/inventory/scan", isAuthenticated, async (req, res) => {
    console.log("\u{1F680} NEW INVENTORY SCAN STARTED");
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        console.log("\u23F0 Inventory scan timeout after 5 minutes");
        res.status(408).json({
          message: "Scan timeout - operation took too long. Please try with fewer credentials or check your cloud provider access.",
          timeout: true
        });
      }
    }, 5 * 60 * 1e3);
    try {
      const userId = req.user.id;
      const scanRequest = req.body;
      const startTime = Date.now();
      console.log("User ID:", userId);
      console.log("Credentials to scan:", scanRequest.credentials?.length || 0);
      console.log("Step 1: Loading credentials...");
      const credentialsWithData = [];
      for (const cred of scanRequest.credentials) {
        try {
          console.log(`Loading credential: ${cred.id}`);
          const credential = await storage.getCloudCredential(cred.id, userId);
          if (!credential) {
            console.log(`Credential ${cred.id} not found`);
            continue;
          }
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
          console.log(`\u2705 Loaded credential: ${cred.id}`);
        } catch (error) {
          console.log(`\u274C Failed to load credential ${cred.id}:`, error.message);
        }
      }
      if (credentialsWithData.length === 0) {
        console.log("\u274C No valid credentials found");
        return res.status(400).json({
          success: false,
          message: "No valid credentials found"
        });
      }
      console.log(`\u2705 Loaded ${credentialsWithData.length} valid credentials`);
      console.log("Step 2: Starting cloud scan...");
      const updatedScanRequest = {
        ...scanRequest,
        credentials: credentialsWithData
      };
      const scanResult = await inventoryService.scanMultipleProviders(updatedScanRequest);
      if (!scanResult) {
        console.log("\u274C Scan failed: No result returned");
        return res.status(500).json({
          success: false,
          message: "Failed to scan cloud resources - no result returned"
        });
      }
      console.log("\u2705 Scan completed successfully");
      console.log("Step 3: Processing results...");
      const { resources, summary } = scanResult;
      const inventory = {
        resources,
        summary,
        scanDate: (/* @__PURE__ */ new Date()).toISOString(),
        scanDuration: Date.now() - startTime
      };
      console.log(`Found ${inventory.resources?.length || 0} resources`);
      console.log("Step 4: Saving to database...");
      const inventoryScan = await storage.createInventoryScan({
        scanData: { success: true, inventory },
        summary: {
          totalResources: inventory.resources?.length || 0,
          scannedProviders: 1,
          scanTime: (/* @__PURE__ */ new Date()).toISOString()
        },
        scanDuration: inventory.scanDuration
      }, userId);
      console.log(`\u2705 Saved inventory scan with ID: ${inventoryScan.id}`);
      console.log("Step 5: Generating cost analysis...");
      console.log("Inventory data:", JSON.stringify({
        resourceCount: inventory.resources?.length,
        hasResources: !!inventory.resources,
        sampleResource: inventory.resources?.[0]
      }));
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        console.log("Analysis result:", JSON.stringify({
          hasAnalysis: !!analysis,
          hasCostRequirements: !!analysis?.costRequirements,
          computeVms: analysis?.costRequirements?.compute?.vms
        }));
        const fullRequirements = {
          currency: "USD",
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: "standard", licenses: 0 },
            oracle: { enabled: false, edition: "standard", licenses: 0 },
            vmware: { enabled: false, licenses: 0 },
            redhat: { enabled: false, licenses: 0 },
            sap: { enabled: false, licenses: 0 },
            microsoftOffice365: { enabled: false, licenses: 0 }
          },
          compute: analysis.costRequirements.compute,
          storage: {
            ...analysis.costRequirements.storage,
            fileStorage: { size: 0, performanceMode: "general-purpose" }
          },
          database: {
            ...analysis.costRequirements.database,
            nosql: { engine: "none", readCapacity: 0, writeCapacity: 0, storage: 0 },
            cache: { engine: "none", instanceClass: "small", nodes: 0 },
            dataWarehouse: { nodes: 0, nodeType: "small", storage: 0 }
          },
          networking: {
            ...analysis.costRequirements.networking,
            cdn: { enabled: false, requests: 0, dataTransfer: 0 },
            dns: { hostedZones: 0, queries: 0 },
            vpn: { connections: 0, hours: 0 }
          },
          security: analysis.costRequirements.security || {
            webFirewall: { enabled: false, requests: 0 },
            identityManagement: { users: 0, authentications: 0 },
            keyManagement: { keys: 0, operations: 0 },
            threatDetection: { enabled: false, events: 0 }
          },
          monitoring: analysis.costRequirements.monitoring || {
            metrics: 0,
            logs: 0,
            traces: 0,
            alerts: 0
          },
          analytics: analysis.costRequirements.analytics || {
            dataProcessing: { hours: 0, nodeType: "small" },
            streaming: { shards: 0, records: 0 },
            businessIntelligence: { users: 0, queries: 0 }
          },
          ai: analysis.costRequirements.ai || {
            training: { hours: 0, instanceType: "cpu" },
            inference: { requests: 0, instanceType: "cpu" },
            prebuilt: { imageAnalysis: 0, textProcessing: 0, speechServices: 0 }
          },
          devops: analysis.costRequirements.devops || {
            cicd: { buildMinutes: 0, parallelJobs: 0 },
            containerRegistry: { storage: 0, pulls: 0 },
            apiManagement: { requests: 0, endpoints: 0 }
          },
          backup: analysis.costRequirements.backup || {
            storage: 0,
            frequency: "daily",
            retention: 30
          },
          iot: analysis.costRequirements.iot || {
            devices: 0,
            messages: 0,
            dataProcessing: 0,
            edgeLocations: 0
          },
          quantum: analysis.costRequirements.quantum || {
            processingUnits: 0,
            quantumAlgorithms: "optimization",
            circuitComplexity: "basic"
          },
          media: analysis.costRequirements.media || {
            videoStreaming: { hours: 0, quality: "1080p" },
            transcoding: { minutes: 0, inputFormat: "standard" }
          },
          scenarios: {
            disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
            compliance: { frameworks: [], auditLogging: false, dataResidency: "global" },
            migration: { dataToMigrate: 0, applicationComplexity: "moderate" }
          }
        };
        console.log("Calculating costs with cost calculator...");
        const costResults = costCalculator.calculateCosts(fullRequirements);
        console.log("Cost calculation complete");
        costAnalysis = await storage.createCostAnalysis({
          requirements: fullRequirements,
          results: costResults,
          inventoryScanId: inventoryScan.id
        }, userId);
        console.log("\u2705 Cost analysis created successfully with actual pricing");
      } catch (analysisError) {
        console.log("\u26A0\uFE0F Cost analysis failed (continuing anyway):", analysisError.message);
        console.log("\u26A0\uFE0F Cost analysis error stack:", analysisError.stack);
        console.log("\u26A0\uFE0F Cost calculation input:", JSON.stringify({
          inventoryResourceCount: inventory.resources?.length
        }));
      }
      console.log("\u{1F389} INVENTORY SCAN COMPLETED SUCCESSFULLY");
      clearTimeout(timeout);
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
      console.log("\u274C INVENTORY SCAN FAILED:", error.message);
      console.log("\u274C Error stack:", error.stack);
      clearTimeout(timeout);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to scan cloud resources",
        error: error.message,
        stack: error.stack
      });
    }
  });
  app2.get("/api/inventory/scan/status/:scanId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const scanId = req.params.scanId;
      const scan = await storage.getInventoryScan(parseInt(scanId), userId);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      res.json({
        id: scan.id,
        status: "completed",
        // For now, all scans are completed when saved
        createdAt: scan.createdAt,
        summary: scan.summary,
        scanDuration: scan.scanDuration
      });
    } catch (error) {
      console.error("Get scan status error:", error);
      res.status(500).json({ message: "Failed to get scan status" });
    }
  });
  app2.get("/api/inventory/scans", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const scans = await storage.getUserInventoryScans(userId);
      res.json(scans);
    } catch (error) {
      console.error("Get inventory scans error:", error);
      res.status(500).json({ message: "Failed to retrieve inventory scans" });
    }
  });
  app2.post("/api/inventory/analyze-costs", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { inventory, scanId } = req.body;
      const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
      const fullRequirements = {
        currency: "USD",
        licensing: {
          windows: { enabled: false, licenses: 0 },
          sqlServer: { enabled: false, edition: "standard", licenses: 0 },
          oracle: { enabled: false, edition: "standard", licenses: 0 },
          vmware: { enabled: false, licenses: 0 },
          redhat: { enabled: false, licenses: 0 },
          sap: { enabled: false, licenses: 0 },
          microsoftOffice365: { enabled: false, licenses: 0 }
        },
        compute: analysis.costRequirements.compute,
        storage: {
          ...analysis.costRequirements.storage,
          fileStorage: { size: 0, performanceMode: "general-purpose" }
        },
        database: {
          ...analysis.costRequirements.database,
          nosql: { engine: "none", readCapacity: 0, writeCapacity: 0, storage: 0 },
          cache: { engine: "none", instanceClass: "small", nodes: 0 },
          dataWarehouse: { nodes: 0, nodeType: "small", storage: 0 }
        },
        networking: {
          ...analysis.costRequirements.networking,
          cdn: { enabled: false, requests: 0, dataTransfer: 0 },
          dns: { hostedZones: 0, queries: 0 },
          vpn: { connections: 0, hours: 0 }
        },
        analytics: {
          dataProcessing: { hours: 0, nodeType: "small" },
          streaming: { shards: 0, records: 0 },
          businessIntelligence: { users: 0, queries: 0 }
        },
        ai: {
          training: { hours: 0, instanceType: "cpu" },
          inference: { requests: 0, instanceType: "cpu" },
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
          frequency: "daily",
          retention: 30
        },
        iot: {
          devices: 0,
          messages: 0,
          dataProcessing: 0,
          edgeLocations: 0
        },
        media: {
          videoStreaming: { hours: 0, quality: "1080p" },
          transcoding: { minutes: 0, inputFormat: "standard" }
        },
        quantum: {
          processingUnits: 0,
          quantumAlgorithms: "optimization",
          circuitComplexity: "basic"
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
          compliance: { frameworks: [], auditLogging: false, dataResidency: "global" },
          migration: { dataToMigrate: 0, applicationComplexity: "moderate" }
        },
        optimization: {
          reservedInstanceStrategy: "moderate",
          spotInstanceTolerance: 10,
          autoScalingAggression: "moderate",
          costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: "email" }
        }
      };
      const costResults = costCalculator.calculateCosts(fullRequirements);
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
  app2.post("/api/terraform/parse", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const { terraformState } = req.body;
      if (!terraformState) {
        return res.status(400).json({
          message: "Terraform state data is required"
        });
      }
      const inventory = terraformParser.parseTerraformState(terraformState);
      const inventoryScan = await storage.createInventoryScan({
        summary: inventory.summary,
        scanDuration: 0,
        scanData: inventory
      }, userId);
      let costAnalysis = null;
      try {
        const analysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
        const fullRequirements = {
          currency: "USD",
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: "standard", licenses: 0 },
            oracle: { enabled: false, edition: "standard", licenses: 0 },
            vmware: { enabled: false, licenses: 0 },
            redhat: { enabled: false, licenses: 0 },
            sap: { enabled: false, licenses: 0 },
            microsoftOffice365: { enabled: false, licenses: 0 }
          },
          compute: analysis.costRequirements.compute,
          storage: {
            ...analysis.costRequirements.storage,
            fileStorage: { size: 0, performanceMode: "general-purpose" }
          },
          database: {
            ...analysis.costRequirements.database,
            nosql: { engine: "none", readCapacity: 0, writeCapacity: 0, storage: 0 },
            cache: { engine: "none", instanceClass: "small", nodes: 0 },
            dataWarehouse: { nodes: 0, nodeType: "small", storage: 0 }
          },
          networking: {
            ...analysis.costRequirements.networking,
            cdn: { enabled: false, requests: 0, dataTransfer: 0 },
            dns: { hostedZones: 0, queries: 0 },
            vpn: { connections: 0, hours: 0 }
          },
          analytics: {
            dataProcessing: { hours: 0, nodeType: "small" },
            streaming: { shards: 0, records: 0 },
            businessIntelligence: { users: 0, queries: 0 }
          },
          ai: {
            training: { hours: 0, instanceType: "cpu" },
            inference: { requests: 0, instanceType: "cpu" },
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
            frequency: "daily",
            retention: 30
          },
          iot: {
            devices: 0,
            messages: 0,
            dataProcessing: 0,
            edgeLocations: 0
          },
          media: {
            videoStreaming: { hours: 0, quality: "1080p" },
            transcoding: { minutes: 0, inputFormat: "standard" }
          },
          quantum: {
            processingUnits: 0,
            quantumAlgorithms: "optimization",
            circuitComplexity: "basic"
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
            reservedInstanceStrategy: "moderate",
            spotInstanceTolerance: 10,
            autoScalingAggression: "moderate",
            costAlerts: { enabled: true, thresholdPercent: 20, notificationPreference: "email" }
          },
          sustainability: {
            carbonFootprintTracking: false,
            renewableEnergyPreference: false,
            greenCloudOptimization: false,
            carbonOffsetCredits: 0
          },
          scenarios: {
            disasterRecovery: { enabled: false, rtoHours: 24, rpoMinutes: 240, backupRegions: 1 },
            compliance: { frameworks: [], auditLogging: false, dataResidency: "global" },
            migration: { dataToMigrate: 0, applicationComplexity: "moderate" }
          }
        };
        const costResults = costCalculator.calculateCosts(fullRequirements);
        console.log("Creating cost analysis in database...");
        costAnalysis = await storage.createCostAnalysis({
          requirements: fullRequirements,
          results: costResults,
          inventoryScanId: inventoryScan.id
        }, userId);
        console.log("Cost analysis created successfully");
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
  app2.get("/api/excel/template", isAuthenticated, (req, res) => {
    try {
      const templateBuffer = excelParser.generateExcelTemplate();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="cloud-resources-template.xlsx"');
      res.send(templateBuffer);
    } catch (error) {
      console.error("Template generation error:", error);
      res.status(500).json({ message: "Failed to generate Excel template" });
    }
  });
  app2.post("/api/excel/upload", isAuthenticated, upload.single("excelFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const userId = req.user.id;
      const { analysisName } = req.body;
      let excelData;
      const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();
      if (fileExtension === "xlsx" || fileExtension === "xls") {
        excelData = await excelParser.parseExcelFile(req.file.buffer);
      } else {
        excelData = [{
          "Resource Name": req.file.originalname,
          "Type": "File",
          "Service": "Upload",
          "Region": "Unknown",
          "State": "Uploaded"
        }];
      }
      if (excelData.length === 0) {
        return res.status(400).json({
          message: "No valid data found in file. Please check the format and try again."
        });
      }
      const resources = excelParser.convertToUnifiedResources(excelData);
      const inventory = {
        resources,
        summary: {
          totalResources: resources.length,
          providers: resources.reduce((acc, resource) => {
            acc[resource.provider] = (acc[resource.provider] || 0) + 1;
            return acc;
          }, {}),
          services: resources.reduce((acc, resource) => {
            acc[resource.type] = (acc[resource.type] || 0) + 1;
            return acc;
          }, {}),
          locations: resources.reduce((acc, resource) => {
            acc[resource.region] = (acc[resource.region] || 0) + 1;
            return acc;
          }, {})
        },
        scanDate: (/* @__PURE__ */ new Date()).toISOString(),
        scanDuration: 0
      };
      const costAnalysis = await inventoryService.generateAutomaticCostAnalysis(inventory);
      const analysis = await storage.createCostAnalysis({
        requirements: {
          currency: "USD",
          licensing: {
            windows: { enabled: false, licenses: 0 },
            sqlServer: { enabled: false, edition: "standard", licenses: 0 },
            oracle: { enabled: false, edition: "standard", licenses: 0 },
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
      const webhookData = {
        analysisId: analysis.id,
        analysisName: analysisName || `Excel Analysis - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
        userId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        resources,
        summary: {
          totalResources: resources.length,
          byProvider: resources.reduce((acc, resource) => {
            acc[resource.provider] = (acc[resource.provider] || 0) + 1;
            return acc;
          }, {}),
          byType: resources.reduce((acc, resource) => {
            acc[resource.type] = (acc[resource.type] || 0) + 1;
            return acc;
          }, {}),
          totalCost: resources.reduce((sum, resource) => sum + (resource.cost || 0), 0)
        },
        costAnalysis: {
          analysisId: analysis.id,
          results: costAnalysis.results,
          requirements: costAnalysis.requirements,
          inventoryScanId: costAnalysis.inventoryScanId
        }
      };
      let webhookTriggered = false;
      try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (webhookUrl) {
          const params = new URLSearchParams({
            analysisId: webhookData.analysisId,
            analysisName: webhookData.analysisName,
            userId: webhookData.userId,
            timestamp: webhookData.timestamp,
            totalResources: webhookData.summary.totalResources.toString(),
            totalCost: webhookData.summary.totalCost.toString(),
            providers: Object.keys(webhookData.summary.byProvider).join(","),
            types: Object.keys(webhookData.summary.byType).join(",")
          });
          const webhookResponse = await fetch(`${webhookUrl}?${params.toString()}`, {
            method: "GET"
          });
          if (webhookResponse.ok) {
            const response = await webhookResponse.json();
            console.log("\u2705 n8n webhook called successfully:", response);
            webhookTriggered = true;
          } else {
            console.warn("\u26A0\uFE0F n8n webhook returned status:", webhookResponse.status);
          }
        } else {
          console.log("\u2139\uFE0F N8N_WEBHOOK_URL not configured, skipping webhook call");
        }
      } catch (webhookError) {
        console.error("\u274C n8n webhook error:", webhookError);
      }
      let googleSheetsResult = null;
      if (googleSheetsService && excelData && excelData.length > 0) {
        try {
          console.log("\u{1F4CA} Uploading to Google Sheets...");
          const headers = Object.keys(excelData[0]);
          const sheetData = excelData.map(
            (row) => headers.map((header) => row[header] || "")
          );
          const sheetsResult = await googleSheetsService.uploadExcelData(
            req.file.originalname.replace(/\.[^/.]+$/, ""),
            // Remove file extension
            sheetData,
            headers
          );
          if (sheetsResult.success) {
            console.log("\u2705 Google Sheets upload successful:", sheetsResult.spreadsheetUrl);
            googleSheetsResult = {
              success: true,
              spreadsheetUrl: sheetsResult.spreadsheetUrl,
              spreadsheetId: sheetsResult.spreadsheetId
            };
          } else {
            console.warn("\u26A0\uFE0F Google Sheets upload failed:", sheetsResult.error);
            googleSheetsResult = {
              success: false,
              error: sheetsResult.error
            };
          }
        } catch (sheetsError) {
          console.error("\u274C Google Sheets upload error:", sheetsError);
          googleSheetsResult = {
            success: false,
            error: sheetsError instanceof Error ? sheetsError.message : "Unknown error"
          };
        }
      }
      res.json({
        success: true,
        analysisId: analysis.id,
        resources,
        summary: webhookData.summary,
        costAnalysis: webhookData.costAnalysis,
        webhookTriggered,
        googleSheets: googleSheetsResult
      });
    } catch (error) {
      console.error("Excel upload error:", error);
      res.status(400).json({
        message: error instanceof Error ? error.message : "Failed to process file"
      });
    }
  });
  app2.post("/api/test/webhook", isAuthenticated, async (req, res) => {
    try {
      const testData = {
        test: true,
        message: "Test webhook call from Cloudedze",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userId: req.user.id
      };
      const webhookUrl = process.env.N8N_WEBHOOK_URL;
      if (!webhookUrl) {
        return res.status(400).json({
          success: false,
          message: "N8N_WEBHOOK_URL not configured"
        });
      }
      const params = new URLSearchParams({
        test: "true",
        message: testData.message,
        timestamp: testData.timestamp,
        userId: testData.userId,
        source: "cloudedze-test"
      });
      const webhookResponse = await fetch(`${webhookUrl}?${params.toString()}`, {
        method: "GET"
      });
      res.json({
        success: true,
        webhookStatus: webhookResponse.status,
        webhookUrl,
        testData,
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
  app2.post("/api/excel/validate", isAuthenticated, upload.single("excelFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileExtension = req.file.originalname.split(".").pop()?.toLowerCase();
      let headers;
      let validation;
      let sampleData = [];
      if (fileExtension === "xlsx" || fileExtension === "xls") {
        const XLSX3 = await import("xlsx");
        const workbook = XLSX3.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX3.utils.sheet_to_json(worksheet, { header: 1 });
        if (jsonData.length < 1) {
          return res.status(400).json({
            isValid: false,
            errors: ["Excel file is empty"]
          });
        }
        headers = jsonData[0];
        sampleData = jsonData.slice(1, 3);
        try {
          validation = excelParser.validateExcelFormat(headers);
        } catch (error) {
          validation = {
            isValid: true,
            errors: [],
            warnings: ["File format may not be optimal for cost analysis"]
          };
        }
      } else {
        headers = ["File Name", "Type", "Service", "Region", "State"];
        sampleData = [[req.file.originalname, "File", "Upload", "Unknown", "Uploaded"]];
        validation = {
          isValid: true,
          errors: [],
          headers,
          sampleData
        };
      }
      res.json({
        isValid: validation.isValid,
        errors: validation.errors,
        headers,
        sampleData
      });
    } catch (error) {
      console.error("Excel validation error:", error);
      res.status(400).json({
        isValid: false,
        errors: [error instanceof Error ? error.message : "Failed to validate file"]
      });
    }
  });
  const excelToIaCService = new ExcelToIaCService();
  app2.post("/api/excel-to-iac/upload", isAuthenticated, upload.single("excel"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No Excel file provided" });
      }
      console.log("\u{1F4CA} Excel to IaC: Processing file:", req.file.originalname);
      const requirements = await excelToIaCService.parseExcelFile(req.file.buffer);
      console.log(`\u{1F4CA} Parsed ${requirements.length} infrastructure requirements`);
      const multiCloudCosts = excelToIaCService.generateMultiCloudCostEstimate(requirements);
      const costEstimates = excelToIaCService.generateCostEstimate(requirements);
      const sessionData = {
        requirements,
        costEstimates,
        multiCloudCosts,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        fileName: req.file.originalname
      };
      req.session.iacData = sessionData;
      res.json({
        success: true,
        message: "Excel file processed successfully",
        summary: {
          totalResources: requirements.length,
          totalMonthlyCost: costEstimates.reduce((sum, est) => sum + est.monthlyEstimate, 0),
          totalYearlyCost: costEstimates.reduce((sum, est) => sum + est.yearlyEstimate, 0)
        },
        requirements: requirements.slice(0, 5),
        // Preview first 5
        costEstimates: costEstimates.slice(0, 5),
        // Preview first 5
        multiCloudCosts
        // Include full multi-cloud costs
      });
    } catch (error) {
      console.error("Excel to IaC upload error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to process Excel file"
      });
    }
  });
  app2.post("/api/excel-to-iac/generate-terraform", isAuthenticated, async (req, res) => {
    try {
      const iacData = req.session.iacData;
      if (!iacData || !iacData.requirements) {
        return res.status(400).json({ message: "No Excel data found. Please upload an Excel file first." });
      }
      const { provider } = req.body;
      console.log("\u{1F3D7}\uFE0F Generating Terraform code for", iacData.requirements.length, "resources");
      if (provider && ["aws", "azure", "gcp", "oci"].includes(provider)) {
        let terraformCode;
        switch (provider) {
          case "aws":
            terraformCode = excelToIaCService.generateTerraformCode(iacData.requirements);
            break;
          case "azure":
            terraformCode = excelToIaCService.generateAzureTerraformCode(iacData.requirements);
            break;
          case "gcp":
            terraformCode = excelToIaCService.generateGCPTerraformCode(iacData.requirements);
            break;
          case "oci":
            terraformCode = excelToIaCService.generateOCITerraformCode(iacData.requirements);
            break;
          default:
            terraformCode = excelToIaCService.generateTerraformCode(iacData.requirements);
        }
        const fileName = `infrastructure-${provider}-${Date.now()}.tf`;
        res.setHeader("Content-Type", "application/octet-stream");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        return res.send(terraformCode);
      }
      const multiCloudTerraform = excelToIaCService.generateMultiCloudTerraform(iacData.requirements);
      res.json({
        success: true,
        terraform: multiCloudTerraform
      });
    } catch (error) {
      console.error("Terraform generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate Terraform code"
      });
    }
  });
  app2.post("/api/excel-to-iac/generate-csv", isAuthenticated, async (req, res) => {
    try {
      const iacData = req.session.iacData;
      if (!iacData || !iacData.requirements) {
        return res.status(400).json({ message: "No cost estimate data found. Please upload an Excel file first." });
      }
      const { provider } = req.body;
      console.log("\u{1F4B0} Generating cost estimate CSV for", iacData.requirements.length, "resources");
      if (provider && ["aws", "azure", "gcp", "oci", "combined"].includes(provider)) {
        const multiCloudCSVs = excelToIaCService.generateMultiCloudCSV(iacData.requirements);
        const csvContent2 = multiCloudCSVs[provider];
        const fileName2 = `cost-estimate-${provider}-${Date.now()}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName2}"`);
        return res.send(csvContent2);
      }
      const csvContent = excelToIaCService.generateCSV(iacData.costEstimates || [], "AWS");
      const fileName = `cost-estimate-${Date.now()}.csv`;
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.send(csvContent);
    } catch (error) {
      console.error("CSV generation error:", error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Failed to generate CSV"
      });
    }
  });
  app2.get("/api/excel-to-iac/session", isAuthenticated, async (req, res) => {
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
          totalMonthlyCost: iacData.costEstimates?.reduce((sum, est) => sum + est.monthlyEstimate, 0) || 0,
          totalYearlyCost: iacData.costEstimates?.reduce((sum, est) => sum + est.yearlyEstimate, 0) || 0
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
  app2.delete("/api/excel-to-iac/session", isAuthenticated, async (req, res) => {
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
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { fileURLToPath as fileURLToPath3 } from "node:url";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "node:url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "client", "src"),
      "@shared": path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "shared"),
      "@assets": path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "attached_assets")
    }
  },
  root: path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "client"),
  build: {
    outDir: path2.resolve(path2.dirname(fileURLToPath2(import.meta.url)), "dist"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    const host = req.get("host");
    const requestPath = req.path;
    if (requestPath.startsWith("/api/")) {
      return next();
    }
    try {
      const clientTemplate = path3.resolve(
        path3.dirname(fileURLToPath3(import.meta.url)),
        "..",
        "client",
        "index.html"
      );
      if (host === "cloudedze.ai" || host === "www.cloudedze.ai") {
        if (requestPath === "/") {
          return res.redirect(301, "/calculator");
        }
      }
      if (host === "app.cloudeedze.ai") {
        if (requestPath === "/login" || requestPath.startsWith("/login")) {
          let template2 = await fs2.promises.readFile(clientTemplate, "utf-8");
          template2 = template2.replace(
            `src="/src/main.tsx"`,
            `src="/src/main.tsx?v=${nanoid()}"`
          );
          const page2 = await vite.transformIndexHtml(url, template2);
          res.status(200).set({ "Content-Type": "text/html" }).end(page2);
          return;
        }
        return res.redirect(301, `https://cloudedze.ai${requestPath}`);
      }
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(path3.dirname(fileURLToPath3(import.meta.url)), "..", "dist");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath, {
    maxAge: "1d",
    setHeaders: (res, path5) => {
      if (path5.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    }
  }));
  app2.use("/assets", express.static(path3.join(distPath, "assets")));
  app2.use("*", (req, res, next) => {
    const host = req.get("host");
    const requestPath = req.path;
    if (requestPath.startsWith("/api")) {
      return next();
    }
    if (host === "cloudedze.ai" || host === "www.cloudedze.ai") {
      if (requestPath === "/") {
        return res.redirect(301, "/calculator");
      }
    }
    if (host === "app.cloudeedze.ai") {
      if (requestPath === "/login" || requestPath.startsWith("/login")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
        return res.sendFile(path3.resolve(distPath, "index.html"));
      }
      return res.redirect(301, `https://cloudedze.ai${requestPath}`);
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
var allowedOrigins = [
  "http://34.14.198.14:3000",
  "https://app.cloudedze.ai",
  "http://localhost:3000",
  "http://34.14.198.14:3002"
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  maxAge: 86400
}));
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: false, limit: "50mb" }));
app.use((req, res, next) => {
  const host = req.get("host");
  const path5 = req.path;
  if (host === "app.cloudedze.ai") {
    return next();
  }
  if (host === "cloudedze.ai" && path5.startsWith("/app/")) {
    return res.redirect(301, `https://app.cloudedze.ai${path5.replace("/app", "")}`);
  }
  next();
});
app.use((req, res, next) => {
  req.setTimeout(6e5);
  res.setTimeout(6e5);
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  await setupAuth(app);
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    console.error("Server error:", err);
  });
  console.log("NODE_ENV:", process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    console.log("Setting up Vite development server");
    await setupVite(app, server);
  } else {
    console.log("Setting up static file serving");
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  const useSSL = process.env.USE_SSL === "true";
  if (useSSL) {
    const sslKeyPath = process.env.SSL_KEY_PATH || path4.join(process.cwd(), "ssl", "server.key");
    const sslCertPath = process.env.SSL_CERT_PATH || path4.join(process.cwd(), "ssl", "server.crt");
    try {
      if (fs3.existsSync(sslKeyPath) && fs3.existsSync(sslCertPath)) {
        const sslOptions = {
          key: fs3.readFileSync(sslKeyPath),
          cert: fs3.readFileSync(sslCertPath)
        };
        const httpsServer = https.createServer(sslOptions, app);
        httpsServer.listen(port, "0.0.0.0", () => {
          log(`\u{1F512} HTTPS server serving on port ${port}`);
          log(`\u{1F510} SSL certificates loaded from ${sslKeyPath} and ${sslCertPath}`);
        });
      } else {
        log(`\u26A0\uFE0F  SSL certificates not found at ${sslKeyPath} and ${sslCertPath}`);
        log(`\u{1F4DD} Falling back to HTTP server on port ${port}`);
        server.listen(port, "0.0.0.0", () => {
          log(`\u{1F310} HTTP server serving on port ${port}`);
        });
      }
    } catch (error) {
      log(`\u274C SSL setup failed: ${error}`);
      log(`\u{1F4DD} Falling back to HTTP server on port ${port}`);
      server.listen(port, "0.0.0.0", () => {
        log(`\u{1F310} HTTP server serving on port ${port}`);
      });
    }
  } else {
    server.listen(port, "0.0.0.0", () => {
      log(`\u{1F310} HTTP server serving on port ${port}`);
    });
  }
})();
