#!/usr/bin/env python3
"""
Enhanced OCI Resource Discovery Script for Cloudedze
Integrates Oracle's ShowOCI patterns with Cloudedze's architecture
"""

import json
import sys
import os
import tempfile
import argparse
from datetime import datetime
import concurrent.futures
from threading import Thread
import oci
from oci.config import from_file
from oci.signer import Signer

class CloudedzeShowOCI:
    def __init__(self, config, credentials):
        self.config = config
        self.credentials = credentials
        self.tenancy_id = config["tenancy"]
        self.region = config["region"]

        # Initialize core clients
        self._init_clients()

        # Resource tracking
        self.resources = {
            "compute_instances": [],
            "block_volumes": [],
            "object_storage_buckets": [],
            "autonomous_databases": [],
            "load_balancers": [],
            "vcns": [],
            "subnets": [],
            "security_lists": [],
            "route_tables": [],
            "internet_gateways": [],
            "nat_gateways": [],
            "service_gateways": [],
            "network_security_groups": [],
            "images": [],
            "volume_groups": [],
            "boot_volumes": [],
            "backups": [],
            "db_systems": [],
            "functions": [],
            "containers": [],
            "streams": [],
            "topics": [],
            "alarms": [],
            "budgets": [],
            "users": [],
            "groups": [],
            "dynamic_groups": [],
            "policies": [],
            "kubernetes_clusters": [],
            "container_repositories": [],
            "api_gateways": [],
            "certificates": [],
            "waas_policies": [],
            "bastion_sessions": [],
            "file_systems": [],
            "vault_secrets": [],
            "application_dependencies": []
        }

        # Compartment cache
        self.compartments = []
        self.compartment_map = {}

    def _init_clients(self):
        """Initialize all OCI service clients"""
        try:
            # Core clients
            self.identity_client = oci.identity.IdentityClient(self.config)
            self.compute_client = oci.core.ComputeClient(self.config)
            self.blockstorage_client = oci.core.BlockstorageClient(self.config)
            self.objectstorage_client = oci.object_storage.ObjectStorageClient(self.config)
            self.database_client = oci.database.DatabaseClient(self.config)
            self.load_balancer_client = oci.load_balancer.LoadBalancerClient(self.config)
            self.virtual_network_client = oci.core.VirtualNetworkClient(self.config)

            # Optional service clients (with error handling)
            self._init_optional_clients()

        except Exception as e:
            print(f"Error initializing core clients: {e}", file=sys.stderr)
            raise

    def _init_optional_clients(self):
        """Initialize optional service clients with error handling"""
        try:
            self.functions_client = oci.functions.FunctionsManagementClient(self.config)
        except Exception:
            self.functions_client = None

        try:
            self.container_client = oci.container_instances.ContainerInstanceClient(self.config)
        except Exception:
            self.container_client = None

        try:
            self.streaming_client = oci.streaming.StreamAdminClient(self.config)
        except Exception:
            self.streaming_client = None

        try:
            self.notification_client = oci.ons.NotificationControlPlaneClient(self.config)
        except Exception:
            self.notification_client = None

        try:
            self.monitoring_client = oci.monitoring.MonitoringClient(self.config)
        except Exception:
            self.monitoring_client = None

        try:
            self.budget_client = oci.budget.BudgetClient(self.config)
        except Exception:
            self.budget_client = None

        try:
            self.container_engine_client = oci.container_engine.ContainerEngineClient(self.config)
        except Exception:
            self.container_engine_client = None

        try:
            self.artifacts_client = oci.artifacts.ArtifactsClient(self.config)
        except Exception:
            self.artifacts_client = None

        try:
            self.apigateway_client = oci.apigateway.GatewayClient(self.config)
        except Exception:
            self.apigateway_client = None

        try:
            self.certificates_client = oci.certificates_management.CertificatesManagementClient(self.config)
        except Exception:
            self.certificates_client = None

        try:
            self.waas_client = oci.waas.WaasClient(self.config)
        except Exception:
            self.waas_client = None

        try:
            self.bastion_client = oci.bastion.BastionClient(self.config)
        except Exception:
            self.bastion_client = None

        try:
            self.file_storage_client = oci.file_storage.FileStorageClient(self.config)
        except Exception:
            self.file_storage_client = None

        try:
            self.vault_client = oci.vault.VaultsClient(self.config)
        except Exception:
            self.vault_client = None

    def discover_all_resources(self):
        """Main discovery method using parallel processing"""
        try:
            # First, get all compartments
            self._load_compartments()

            print(f"Found {len(self.compartments)} compartments to scan", file=sys.stderr)

            # Use thread pool for parallel discovery
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = []

                for compartment in self.compartments:
                    future = executor.submit(self._discover_compartment_resources, compartment)
                    futures.append(future)

                # Wait for all discoveries to complete
                for future in concurrent.futures.as_completed(futures):
                    try:
                        future.result()
                    except Exception as e:
                        print(f"Error in compartment discovery: {e}", file=sys.stderr)

            # Post-process and enrich data
            self._enrich_resource_data()

            return self._format_output()

        except Exception as e:
            print(f"Error in resource discovery: {e}", file=sys.stderr)
            raise

    def _load_compartments(self):
        """Load all compartments with caching"""
        try:
            # Get all compartments
            compartments_response = self.identity_client.list_compartments(
                compartment_id=self.tenancy_id,
                compartment_id_in_subtree=True,
                access_level="ACCESSIBLE"
            )

            self.compartments = compartments_response.data

            # Add root compartment
            root_compartment = self.identity_client.get_compartment(
                compartment_id=self.tenancy_id
            ).data
            self.compartments.append(root_compartment)

            # Create compartment mapping
            for comp in self.compartments:
                self.compartment_map[comp.id] = comp.name

        except Exception as e:
            print(f"Error loading compartments: {e}", file=sys.stderr)
            raise

    def _discover_compartment_resources(self, compartment):
        """Discover all resources in a specific compartment"""
        compartment_id = compartment.id
        compartment_name = compartment.name

        print(f"Scanning compartment: {compartment_name}", file=sys.stderr)

        # Core resource discovery methods
        discovery_methods = [
            self._discover_compute_resources,
            self._discover_storage_resources,
            self._discover_network_resources,
            self._discover_database_resources,
            self._discover_additional_services,
            self._discover_security_resources,
            self._discover_developer_services
        ]

        # Run discovery methods sequentially for this compartment
        for method in discovery_methods:
            try:
                method(compartment_id, compartment_name)
            except Exception as e:
                print(f"Error in {method.__name__} for {compartment_name}: {e}", file=sys.stderr)

    def _discover_compute_resources(self, compartment_id, compartment_name):
        """Discover compute-related resources"""
        try:
            # Compute Instances
            instances = self.compute_client.list_instances(compartment_id=compartment_id).data
            for instance in instances:
                # Handle shape_config serialization
                shape_config = getattr(instance, 'shape_config', None)
                shape_config_dict = None
                if shape_config:
                    try:
                        shape_config_dict = {
                            "ocpus": getattr(shape_config, 'ocpus', None),
                            "memory_in_gbs": getattr(shape_config, 'memory_in_gbs', None),
                            "local_disks_total_size_in_gbs": getattr(shape_config, 'local_disks_total_size_in_gbs', None),
                            "local_disk_description": getattr(shape_config, 'local_disk_description', None)
                        }
                    except Exception as e:
                        print(f"Error serializing shape config: {e}", file=sys.stderr)
                        shape_config_dict = {}

                # Handle source_details serialization
                source_details = getattr(instance, 'source_details', None)
                source_details_dict = None
                if source_details:
                    try:
                        source_details_dict = {
                            "image_id": getattr(source_details, 'image_id', None),
                            "boot_volume_size_in_gbs": getattr(source_details, 'boot_volume_size_in_gbs', None),
                            "source_type": getattr(source_details, 'source_type', None)
                        }
                    except Exception as e:
                        print(f"Error serializing source details: {e}", file=sys.stderr)
                        source_details_dict = {}

                self.resources["compute_instances"].append({
                    "id": instance.id,
                    "display_name": instance.display_name,
                    "lifecycle_state": instance.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "shape": instance.shape,
                    "shape_config": shape_config_dict,
                    "source_details": source_details_dict,
                    "availability_domain": instance.availability_domain,
                    "time_created": instance.time_created.isoformat() if instance.time_created else None,
                    "defined_tags": getattr(instance, 'defined_tags', {}),
                    "freeform_tags": getattr(instance, 'freeform_tags', {})
                })

            # Images (limited for performance)
            images = self.compute_client.list_images(
                compartment_id=compartment_id,
                limit=50,
                sort_by="TIMECREATED",
                sort_order="DESC"
            ).data
            for image in images:
                self.resources["images"].append({
                    "id": image.id,
                    "display_name": image.display_name,
                    "lifecycle_state": image.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "operating_system": image.operating_system,
                    "operating_system_version": image.operating_system_version,
                    "time_created": image.time_created.isoformat() if image.time_created else None
                })

        except Exception as e:
            print(f"Error discovering compute resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_storage_resources(self, compartment_id, compartment_name):
        """Discover storage-related resources"""
        try:
            # Block Volumes
            volumes = self.blockstorage_client.list_volumes(compartment_id=compartment_id).data
            for volume in volumes:
                self.resources["block_volumes"].append({
                    "id": volume.id,
                    "display_name": volume.display_name,
                    "lifecycle_state": volume.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "size_in_gbs": volume.size_in_gbs,
                    "availability_domain": volume.availability_domain,
                    "time_created": volume.time_created.isoformat() if volume.time_created else None,
                    "defined_tags": getattr(volume, 'defined_tags', {}),
                    "freeform_tags": getattr(volume, 'freeform_tags', {})
                })

            # Boot Volumes
            boot_volumes = self.blockstorage_client.list_boot_volumes(compartment_id=compartment_id).data
            for bv in boot_volumes:
                self.resources["boot_volumes"].append({
                    "id": bv.id,
                    "display_name": bv.display_name,
                    "lifecycle_state": bv.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "size_in_gbs": bv.size_in_gbs,
                    "availability_domain": bv.availability_domain,
                    "time_created": bv.time_created.isoformat() if bv.time_created else None
                })

            # Volume Groups
            volume_groups = self.blockstorage_client.list_volume_groups(compartment_id=compartment_id).data
            for vg in volume_groups:
                self.resources["volume_groups"].append({
                    "id": vg.id,
                    "display_name": vg.display_name,
                    "lifecycle_state": vg.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "availability_domain": vg.availability_domain,
                    "time_created": vg.time_created.isoformat() if vg.time_created else None
                })

            # Volume Backups
            backups = self.blockstorage_client.list_volume_backups(compartment_id=compartment_id).data
            for backup in backups:
                self.resources["backups"].append({
                    "id": backup.id,
                    "display_name": backup.display_name,
                    "lifecycle_state": backup.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "volume_id": backup.volume_id,
                    "size_in_gbs": backup.size_in_gbs,
                    "time_created": backup.time_created.isoformat() if backup.time_created else None
                })

            # Object Storage Buckets
            namespace = self.objectstorage_client.get_namespace().data
            buckets = self.objectstorage_client.list_buckets(
                namespace_name=namespace,
                compartment_id=compartment_id
            ).data
            for bucket in buckets:
                self.resources["object_storage_buckets"].append({
                    "id": f"{namespace}:{bucket.name}",
                    "name": bucket.name,
                    "namespace": namespace,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "time_created": bucket.time_created.isoformat() if bucket.time_created else None,
                    "etag": bucket.etag
                })

            # File Systems (skip for now due to API requirements)
            # Note: File systems API requires availability_domain parameter
            # We would need to list all availability domains first, then iterate through each
            # Skipping this for now to avoid API errors
            pass

        except Exception as e:
            print(f"Error discovering storage resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_network_resources(self, compartment_id, compartment_name):
        """Discover network-related resources"""
        try:
            # VCNs
            vcns = self.virtual_network_client.list_vcns(compartment_id=compartment_id).data
            for vcn in vcns:
                self.resources["vcns"].append({
                    "id": vcn.id,
                    "display_name": vcn.display_name,
                    "lifecycle_state": vcn.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "cidr_block": vcn.cidr_block,
                    "time_created": vcn.time_created.isoformat() if vcn.time_created else None,
                    "defined_tags": getattr(vcn, 'defined_tags', {}),
                    "freeform_tags": getattr(vcn, 'freeform_tags', {})
                })

            # Subnets
            subnets = self.virtual_network_client.list_subnets(compartment_id=compartment_id).data
            for subnet in subnets:
                self.resources["subnets"].append({
                    "id": subnet.id,
                    "display_name": subnet.display_name,
                    "lifecycle_state": subnet.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "cidr_block": subnet.cidr_block,
                    "availability_domain": subnet.availability_domain,
                    "vcn_id": subnet.vcn_id,
                    "time_created": subnet.time_created.isoformat() if subnet.time_created else None
                })

            # Security Lists
            security_lists = self.virtual_network_client.list_security_lists(compartment_id=compartment_id).data
            for sl in security_lists:
                self.resources["security_lists"].append({
                    "id": sl.id,
                    "display_name": sl.display_name,
                    "lifecycle_state": sl.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "vcn_id": sl.vcn_id,
                    "time_created": sl.time_created.isoformat() if sl.time_created else None
                })

            # Route Tables
            route_tables = self.virtual_network_client.list_route_tables(compartment_id=compartment_id).data
            for rt in route_tables:
                self.resources["route_tables"].append({
                    "id": rt.id,
                    "display_name": rt.display_name,
                    "lifecycle_state": rt.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "vcn_id": rt.vcn_id,
                    "time_created": rt.time_created.isoformat() if rt.time_created else None
                })

            # Internet Gateways
            internet_gateways = self.virtual_network_client.list_internet_gateways(compartment_id=compartment_id).data
            for ig in internet_gateways:
                self.resources["internet_gateways"].append({
                    "id": ig.id,
                    "display_name": ig.display_name,
                    "lifecycle_state": ig.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "vcn_id": ig.vcn_id,
                    "time_created": ig.time_created.isoformat() if ig.time_created else None
                })

            # NAT Gateways
            nat_gateways = self.virtual_network_client.list_nat_gateways(compartment_id=compartment_id).data
            for nat in nat_gateways:
                self.resources["nat_gateways"].append({
                    "id": nat.id,
                    "display_name": nat.display_name,
                    "lifecycle_state": nat.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "vcn_id": nat.vcn_id,
                    "time_created": nat.time_created.isoformat() if nat.time_created else None
                })

            # Service Gateways
            service_gateways = self.virtual_network_client.list_service_gateways(compartment_id=compartment_id).data
            for sg in service_gateways:
                self.resources["service_gateways"].append({
                    "id": sg.id,
                    "display_name": sg.display_name,
                    "lifecycle_state": sg.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "vcn_id": sg.vcn_id,
                    "time_created": sg.time_created.isoformat() if sg.time_created else None
                })

            # Network Security Groups
            nsgs = self.virtual_network_client.list_network_security_groups(compartment_id=compartment_id).data
            for nsg in nsgs:
                self.resources["network_security_groups"].append({
                    "id": nsg.id,
                    "display_name": nsg.display_name,
                    "lifecycle_state": nsg.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "vcn_id": nsg.vcn_id,
                    "time_created": nsg.time_created.isoformat() if nsg.time_created else None
                })

            # Load Balancers
            load_balancers = self.load_balancer_client.list_load_balancers(compartment_id=compartment_id).data
            for lb in load_balancers:
                self.resources["load_balancers"].append({
                    "id": lb.id,
                    "display_name": lb.display_name,
                    "lifecycle_state": lb.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "shape_name": lb.shape_name,
                    "shape_details": getattr(lb, 'shape_details', None),
                    "time_created": lb.time_created.isoformat() if lb.time_created else None
                })

        except Exception as e:
            print(f"Error discovering network resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_database_resources(self, compartment_id, compartment_name):
        """Discover database-related resources"""
        try:
            # Autonomous Databases
            autonomous_dbs = self.database_client.list_autonomous_databases(compartment_id=compartment_id).data
            for adb in autonomous_dbs:
                self.resources["autonomous_databases"].append({
                    "id": adb.id,
                    "display_name": adb.display_name,
                    "lifecycle_state": adb.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "db_name": adb.db_name,
                    "db_workload": getattr(adb, 'db_workload', None),
                    "cpu_core_count": adb.cpu_core_count,
                    "data_storage_size_in_tbs": adb.data_storage_size_in_tbs,
                    "time_created": adb.time_created.isoformat() if adb.time_created else None
                })

            # DB Systems
            db_systems = self.database_client.list_db_systems(compartment_id=compartment_id).data
            for db_system in db_systems:
                self.resources["db_systems"].append({
                    "id": db_system.id,
                    "display_name": db_system.display_name,
                    "lifecycle_state": db_system.lifecycle_state,
                    "compartment_id": compartment_id,
                    "compartment_name": compartment_name,
                    "shape": db_system.shape,
                    "availability_domain": db_system.availability_domain,
                    "time_created": db_system.time_created.isoformat() if db_system.time_created else None
                })

        except Exception as e:
            print(f"Error discovering database resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_additional_services(self, compartment_id, compartment_name):
        """Discover additional OCI services"""
        try:
            # Functions
            if self.functions_client:
                try:
                    functions = self.functions_client.list_applications(compartment_id=compartment_id).data
                    for func in functions:
                        self.resources["functions"].append({
                            "id": func.id,
                            "display_name": func.display_name,
                            "lifecycle_state": func.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": func.time_created.isoformat() if func.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering functions: {e}", file=sys.stderr)

            # Container Instances
            if self.container_client:
                try:
                    container_response = self.container_client.list_container_instances(compartment_id=compartment_id)
                    containers = getattr(container_response, 'data', [])
                    if hasattr(containers, 'items'):
                        containers = containers.items
                    for container in containers:
                        self.resources["containers"].append({
                            "id": container.id,
                            "display_name": container.display_name,
                            "lifecycle_state": container.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": container.time_created.isoformat() if container.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering container instances: {e}", file=sys.stderr)

            # Kubernetes Clusters
            if self.container_engine_client:
                try:
                    clusters = self.container_engine_client.list_clusters(compartment_id=compartment_id).data
                    for cluster in clusters:
                        self.resources["kubernetes_clusters"].append({
                            "id": cluster.id,
                            "name": cluster.name,
                            "lifecycle_state": cluster.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "kubernetes_version": getattr(cluster, 'kubernetes_version', None),
                            "time_created": cluster.time_created.isoformat() if cluster.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering Kubernetes clusters: {e}", file=sys.stderr)

            # Streaming
            if self.streaming_client:
                try:
                    streams = self.streaming_client.list_streams(compartment_id=compartment_id).data
                    for stream in streams:
                        self.resources["streams"].append({
                            "id": stream.id,
                            "display_name": stream.name,
                            "lifecycle_state": stream.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": stream.time_created.isoformat() if stream.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering streams: {e}", file=sys.stderr)

            # Notifications
            if self.notification_client:
                try:
                    topics = self.notification_client.list_topics(compartment_id=compartment_id).data
                    for topic in topics:
                        self.resources["topics"].append({
                            "id": topic.topic_id,
                            "display_name": topic.name,
                            "lifecycle_state": topic.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": topic.time_created.isoformat() if topic.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering notification topics: {e}", file=sys.stderr)

            # Monitoring Alarms
            if self.monitoring_client:
                try:
                    alarms = self.monitoring_client.list_alarms(compartment_id=compartment_id).data
                    for alarm in alarms:
                        # Handle missing time_created attribute
                        time_created = getattr(alarm, 'time_created', None)
                        time_created_str = time_created.isoformat() if time_created else None

                        self.resources["alarms"].append({
                            "id": alarm.id,
                            "display_name": alarm.display_name,
                            "lifecycle_state": alarm.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": time_created_str
                        })
                except Exception as e:
                    print(f"Error discovering monitoring alarms: {e}", file=sys.stderr)

            # Budgets
            if self.budget_client:
                try:
                    budgets = self.budget_client.list_budgets(compartment_id=compartment_id).data
                    for budget in budgets:
                        self.resources["budgets"].append({
                            "id": budget.id,
                            "display_name": budget.display_name,
                            "lifecycle_state": budget.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": budget.time_created.isoformat() if budget.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering budgets: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering additional services in {compartment_name}: {e}", file=sys.stderr)

    def _discover_security_resources(self, compartment_id, compartment_name):
        """Discover security-related resources"""
        try:
            # Bastion Sessions
            if self.bastion_client:
                try:
                    bastions = self.bastion_client.list_bastions(compartment_id=compartment_id).data
                    for bastion in bastions:
                        self.resources["bastion_sessions"].append({
                            "id": bastion.id,
                            "name": bastion.name,
                            "lifecycle_state": bastion.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": bastion.time_created.isoformat() if bastion.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering bastion sessions: {e}", file=sys.stderr)

            # Certificates
            if self.certificates_client:
                try:
                    cert_response = self.certificates_client.list_certificates(compartment_id=compartment_id)
                    certificates = getattr(cert_response, 'data', [])
                    if hasattr(certificates, 'items'):
                        certificates = certificates.items
                    for cert in certificates:
                        self.resources["certificates"].append({
                            "id": cert.id,
                            "name": cert.name,
                            "lifecycle_state": cert.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": cert.time_created.isoformat() if cert.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering certificates: {e}", file=sys.stderr)

            # WAAS Policies
            if self.waas_client:
                try:
                    waas_policies = self.waas_client.list_waas_policies(compartment_id=compartment_id).data
                    for policy in waas_policies:
                        self.resources["waas_policies"].append({
                            "id": policy.id,
                            "display_name": policy.display_name,
                            "lifecycle_state": policy.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": policy.time_created.isoformat() if policy.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering WAAS policies: {e}", file=sys.stderr)

            # Vault Secrets (skip for now due to API compatibility)
            # Note: Vault client API structure has changed
            # Would need different approach to discover vaults
            pass

        except Exception as e:
            print(f"Error discovering security resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_developer_services(self, compartment_id, compartment_name):
        """Discover developer-related services"""
        try:
            # Container Repositories
            if self.artifacts_client:
                try:
                    repo_response = self.artifacts_client.list_container_repositories(compartment_id=compartment_id)
                    repos = getattr(repo_response, 'data', [])
                    if hasattr(repos, 'items'):
                        repos = repos.items
                    for repo in repos:
                        self.resources["container_repositories"].append({
                            "id": repo.id,
                            "display_name": repo.display_name,
                            "lifecycle_state": repo.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": repo.time_created.isoformat() if repo.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering container repositories: {e}", file=sys.stderr)

            # API Gateways
            if self.apigateway_client:
                try:
                    gateway_response = self.apigateway_client.list_gateways(compartment_id=compartment_id)
                    gateways = getattr(gateway_response, 'data', [])
                    if hasattr(gateways, 'items'):
                        gateways = gateways.items
                    for gateway in gateways:
                        self.resources["api_gateways"].append({
                            "id": gateway.id,
                            "display_name": gateway.display_name,
                            "lifecycle_state": gateway.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "time_created": gateway.time_created.isoformat() if gateway.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering API gateways: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering developer services in {compartment_name}: {e}", file=sys.stderr)

    def _discover_identity_resources(self):
        """Discover identity resources (only for root compartment)"""
        try:
            # Users
            users = self.identity_client.list_users(compartment_id=self.tenancy_id).data
            for user in users:
                self.resources["users"].append({
                    "id": user.id,
                    "display_name": user.name,
                    "lifecycle_state": user.lifecycle_state,
                    "compartment_id": self.tenancy_id,
                    "compartment_name": self.compartment_map.get(self.tenancy_id, "root"),
                    "time_created": user.time_created.isoformat() if user.time_created else None
                })

            # Groups
            groups = self.identity_client.list_groups(compartment_id=self.tenancy_id).data
            for group in groups:
                self.resources["groups"].append({
                    "id": group.id,
                    "display_name": group.name,
                    "lifecycle_state": group.lifecycle_state,
                    "compartment_id": self.tenancy_id,
                    "compartment_name": self.compartment_map.get(self.tenancy_id, "root"),
                    "time_created": group.time_created.isoformat() if group.time_created else None
                })

            # Dynamic Groups
            dynamic_groups = self.identity_client.list_dynamic_groups(compartment_id=self.tenancy_id).data
            for dg in dynamic_groups:
                self.resources["dynamic_groups"].append({
                    "id": dg.id,
                    "display_name": dg.name,
                    "lifecycle_state": dg.lifecycle_state,
                    "compartment_id": self.tenancy_id,
                    "compartment_name": self.compartment_map.get(self.tenancy_id, "root"),
                    "time_created": dg.time_created.isoformat() if dg.time_created else None
                })

            # Policies
            policies = self.identity_client.list_policies(compartment_id=self.tenancy_id).data
            for policy in policies:
                self.resources["policies"].append({
                    "id": policy.id,
                    "display_name": policy.name,
                    "lifecycle_state": policy.lifecycle_state,
                    "compartment_id": self.tenancy_id,
                    "compartment_name": self.compartment_map.get(self.tenancy_id, "root"),
                    "time_created": policy.time_created.isoformat() if policy.time_created else None
                })

        except Exception as e:
            print(f"Error discovering identity resources: {e}", file=sys.stderr)

    def _enrich_resource_data(self):
        """Enrich resource data with additional context"""
        # Add identity resources
        self._discover_identity_resources()

        # Add cross-references and relationships
        self._add_resource_relationships()

    def _add_resource_relationships(self):
        """Add relationships between resources"""
        # This could include things like:
        # - Which instances are in which subnets
        # - Which volumes are attached to which instances
        # - etc.
        pass

    def _format_output(self):
        """Format the final output"""
        # Calculate total resources
        total_resources = sum(len(resource_list) for resource_list in self.resources.values())

        # Create summary by service
        summary_by_service = {}
        for service_type, resource_list in self.resources.items():
            if resource_list:
                summary_by_service[service_type] = len(resource_list)

        return {
            "success": True,
            "resources": self.resources,
            "summary": {
                "total_resources": total_resources,
                "by_service": summary_by_service,
                "compartments_scanned": len(self.compartments)
            },
            "metadata": {
                "scan_time": datetime.now().isoformat(),
                "region": self.region,
                "tenancy_id": self.tenancy_id,
                "provider": "oci"
            }
        }


def main():
    parser = argparse.ArgumentParser(description='Enhanced OCI Resource Discovery for Cloudedze')
    parser.add_argument('--credentials', required=True, help='OCI credentials JSON file or JSON string')
    parser.add_argument('--operation', default='discover', help='Operation to perform (discover, validate)')

    args = parser.parse_args()

    try:
        # Parse credentials
        if os.path.exists(args.credentials):
            with open(args.credentials, 'r') as f:
                credentials = json.loads(f.read())
        else:
            credentials = json.loads(args.credentials)

        # Create OCI config
        config = {
            "user": credentials["userId"],
            "key_file": None,
            "fingerprint": credentials["fingerprint"],
            "tenancy": credentials["tenancyId"],
            "region": credentials["region"]
        }

        # Create temporary file for private key
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as key_file:
            key_file.write(credentials["privateKey"])
            key_file_path = key_file.name

        try:
            config["key_file"] = key_file_path

            print(f"Starting enhanced OCI discovery for tenancy {config['tenancy'][:20]}... in region {config['region']}", file=sys.stderr)

            # Create and run discovery service
            discovery_service = CloudedzeShowOCI(config, credentials)

            if args.operation == 'validate':
                # Just validate credentials
                try:
                    discovery_service.identity_client.get_tenancy(tenancy_id=config["tenancy"])
                    result = {"success": True, "message": "Credentials validated successfully"}
                except Exception as e:
                    result = {"success": False, "error": f"Credential validation failed: {str(e)}"}
            else:
                # Perform full discovery
                result = discovery_service.discover_all_resources()

            print(json.dumps(result, indent=2))
            print(f"Discovery completed. Found {result.get('summary', {}).get('total_resources', 0)} total resources", file=sys.stderr)

        finally:
            # Clean up temporary key file
            try:
                os.unlink(key_file_path)
            except Exception:
                pass

    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        print(f"Discovery failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()