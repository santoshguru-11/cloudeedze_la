#!/usr/bin/env python3
"""
OCI Resource Discovery Script
Discovers Oracle Cloud Infrastructure resources using the OCI Python SDK
"""

import json
import sys
import os
import tempfile
import argparse
from datetime import datetime
import oci
from oci.config import from_file
from oci.signer import Signer

class OCIInventoryService:
    def __init__(self, config):
        self.config = config
        self.identity_client = oci.identity.IdentityClient(config)
        self.compute_client = oci.core.ComputeClient(config)
        self.blockstorage_client = oci.core.BlockstorageClient(config)
        self.objectstorage_client = oci.object_storage.ObjectStorageClient(config)
        self.database_client = oci.database.DatabaseClient(config)
        self.load_balancer_client = oci.load_balancer.LoadBalancerClient(config)
        self.virtual_network_client = oci.core.VirtualNetworkClient(config)

    def discover_resources(self):
        """Discover all OCI resources across all compartments"""
        resources = {
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
            "public_ips": [],
            "private_ips": [],
            "dhcp_options": [],
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
            "policies": [],
            "users": [],
            "groups": [],
            "dynamic_groups": []
        }

        try:
            # Get all compartments
            compartments = self.identity_client.list_compartments(
                compartment_id=self.config["tenancy"],
                compartment_id_in_subtree=True,
                access_level="ACCESSIBLE"
            ).data

            # Add root compartment
            root_compartment = self.identity_client.get_compartment(
                compartment_id=self.config["tenancy"]
            ).data
            compartments.append(root_compartment)

            print(f"Found {len(compartments)} compartments", file=sys.stderr)
            
            # Print compartment details for debugging
            for comp in compartments:
                print(f"Compartment: {comp.name} (ID: {comp.id[:20]}...)", file=sys.stderr)

            for compartment in compartments:
                compartment_id = compartment.id
                compartment_name = compartment.name
                
                print(f"Scanning compartment: {compartment_name}", file=sys.stderr)
                
                # Discover core resources
                self._discover_core_resources(compartment_id, compartment_name, resources)
                
                # Discover additional network resources
                self._discover_additional_network_resources(compartment_id, compartment_name, resources)
                
                # Discover additional compute resources
                self._discover_additional_compute_resources(compartment_id, compartment_name, resources)
                
                # Discover additional storage resources
                self._discover_additional_storage_resources(compartment_id, compartment_name, resources)
                
                # Discover additional database resources
                self._discover_additional_database_resources(compartment_id, compartment_name, resources)
                
                # Discover additional services
                self._discover_additional_services(compartment_id, compartment_name, resources)

        except Exception as e:
            print(f"Error during resource discovery: {e}", file=sys.stderr)
            raise

        return resources

    def _discover_core_resources(self, compartment_id, compartment_name, resources):
        """Discover core OCI resources"""
        try:
            # Compute Instances
            try:
                instances_response = self.compute_client.list_instances(compartment_id=compartment_id)
                for instance in instances_response.data:
                    resources["compute_instances"].append({
                        "id": instance.id,
                        "display_name": instance.display_name,
                        "state": instance.lifecycle_state,
                        "compartment": compartment_name,
                        "shape": instance.shape,
                        "availability_domain": instance.availability_domain,
                        "time_created": instance.time_created.isoformat() if instance.time_created else None
                    })
                print(f"Found {len(instances_response.data)} compute instances in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering compute instances in {compartment_name}: {e}", file=sys.stderr)

            # Block Volumes
            try:
                volumes_response = self.blockstorage_client.list_volumes(compartment_id=compartment_id)
                for volume in volumes_response.data:
                    resources["block_volumes"].append({
                        "id": volume.id,
                        "display_name": volume.display_name,
                        "state": volume.lifecycle_state,
                        "compartment": compartment_name,
                        "size_in_gbs": volume.size_in_gbs,
                        "availability_domain": volume.availability_domain,
                        "time_created": volume.time_created.isoformat() if volume.time_created else None
                    })
                print(f"Found {len(volumes_response.data)} block volumes in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering block volumes in {compartment_name}: {e}", file=sys.stderr)

            # Object Storage Buckets
            try:
                namespace = self.objectstorage_client.get_namespace().data
                buckets_response = self.objectstorage_client.list_buckets(
                    namespace_name=namespace,
                    compartment_id=compartment_id
                )
                for bucket in buckets_response.data:
                    resources["object_storage_buckets"].append({
                        "name": bucket.name,
                        "namespace": namespace,
                        "compartment": compartment_name,
                        "time_created": bucket.time_created.isoformat() if bucket.time_created else None,
                        "etag": bucket.etag
                    })
                print(f"Found {len(buckets_response.data)} object storage buckets in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering object storage buckets in {compartment_name}: {e}", file=sys.stderr)

            # Autonomous Databases
            try:
                adb_response = self.database_client.list_autonomous_databases(compartment_id=compartment_id)
                for adb in adb_response.data:
                    resources["autonomous_databases"].append({
                        "id": adb.id,
                        "display_name": adb.display_name,
                        "state": adb.lifecycle_state,
                        "compartment": compartment_name,
                        "db_name": adb.db_name,
                        "cpu_core_count": adb.cpu_core_count,
                        "data_storage_size_in_tbs": adb.data_storage_size_in_tbs,
                        "time_created": adb.time_created.isoformat() if adb.time_created else None
                    })
                print(f"Found {len(adb_response.data)} autonomous databases in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering autonomous databases in {compartment_name}: {e}", file=sys.stderr)

            # Load Balancers
            try:
                lb_response = self.load_balancer_client.list_load_balancers(compartment_id=compartment_id)
                for lb in lb_response.data:
                    resources["load_balancers"].append({
                        "id": lb.id,
                        "display_name": lb.display_name,
                        "state": lb.lifecycle_state,
                        "compartment": compartment_name,
                        "shape_name": lb.shape_name,
                        "time_created": lb.time_created.isoformat() if lb.time_created else None
                    })
                print(f"Found {len(lb_response.data)} load balancers in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering load balancers in {compartment_name}: {e}", file=sys.stderr)

            # VCNs
            try:
                vcns_response = self.virtual_network_client.list_vcns(compartment_id=compartment_id)
                for vcn in vcns_response.data:
                    resources["vcns"].append({
                        "id": vcn.id,
                        "display_name": vcn.display_name,
                        "state": vcn.lifecycle_state,
                        "compartment": compartment_name,
                        "cidr_block": vcn.cidr_block,
                        "time_created": vcn.time_created.isoformat() if vcn.time_created else None
                    })
                print(f"Found {len(vcns_response.data)} VCNs in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering VCNs in {compartment_name}: {e}", file=sys.stderr)

            # Subnets
            try:
                subnets_response = self.virtual_network_client.list_subnets(compartment_id=compartment_id)
                for subnet in subnets_response.data:
                    resources["subnets"].append({
                        "id": subnet.id,
                        "display_name": subnet.display_name,
                        "state": subnet.lifecycle_state,
                        "compartment": compartment_name,
                        "cidr_block": subnet.cidr_block,
                        "availability_domain": subnet.availability_domain,
                        "vcn_id": subnet.vcn_id,
                        "time_created": subnet.time_created.isoformat() if subnet.time_created else None
                    })
                print(f"Found {len(subnets_response.data)} subnets in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering subnets in {compartment_name}: {e}", file=sys.stderr)

            # Security Lists
            try:
                security_lists_response = self.virtual_network_client.list_security_lists(compartment_id=compartment_id)
                for sl in security_lists_response.data:
                    resources["security_lists"].append({
                        "id": sl.id,
                        "display_name": sl.display_name,
                        "state": sl.lifecycle_state,
                        "compartment": compartment_name,
                        "vcn_id": sl.vcn_id,
                        "time_created": sl.time_created.isoformat() if sl.time_created else None
                    })
                print(f"Found {len(security_lists_response.data)} security lists in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering security lists in {compartment_name}: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering core resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_additional_network_resources(self, compartment_id, compartment_name, resources):
        """Discover additional network resources"""
        try:
            # Route Tables
            try:
                route_tables_response = self.virtual_network_client.list_route_tables(compartment_id=compartment_id)
                for rt in route_tables_response.data:
                    resources["route_tables"].append({
                        "id": rt.id,
                        "display_name": rt.display_name,
                        "state": rt.lifecycle_state,
                        "compartment": compartment_name,
                        "vcn_id": rt.vcn_id,
                        "time_created": rt.time_created.isoformat() if rt.time_created else None
                    })
                print(f"Found {len(route_tables_response.data)} route tables in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering route tables in {compartment_name}: {e}", file=sys.stderr)

            # Internet Gateways
            try:
                ig_response = self.virtual_network_client.list_internet_gateways(compartment_id=compartment_id)
                for ig in ig_response.data:
                    resources["internet_gateways"].append({
                        "id": ig.id,
                        "display_name": ig.display_name,
                        "state": ig.lifecycle_state,
                        "compartment": compartment_name,
                        "vcn_id": ig.vcn_id,
                        "time_created": ig.time_created.isoformat() if ig.time_created else None
                    })
                print(f"Found {len(ig_response.data)} internet gateways in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering internet gateways in {compartment_name}: {e}", file=sys.stderr)

            # NAT Gateways
            try:
                nat_response = self.virtual_network_client.list_nat_gateways(compartment_id=compartment_id)
                for nat in nat_response.data:
                    resources["nat_gateways"].append({
                        "id": nat.id,
                        "display_name": nat.display_name,
                        "state": nat.lifecycle_state,
                        "compartment": compartment_name,
                        "vcn_id": nat.vcn_id,
                        "time_created": nat.time_created.isoformat() if nat.time_created else None
                    })
                print(f"Found {len(nat_response.data)} NAT gateways in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering NAT gateways in {compartment_name}: {e}", file=sys.stderr)

            # Service Gateways
            try:
                sg_response = self.virtual_network_client.list_service_gateways(compartment_id=compartment_id)
                for sg in sg_response.data:
                    resources["service_gateways"].append({
                        "id": sg.id,
                        "display_name": sg.display_name,
                        "state": sg.lifecycle_state,
                        "compartment": compartment_name,
                        "vcn_id": sg.vcn_id,
                        "time_created": sg.time_created.isoformat() if sg.time_created else None
                    })
                print(f"Found {len(sg_response.data)} service gateways in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering service gateways in {compartment_name}: {e}", file=sys.stderr)

            # Network Security Groups
            try:
                nsg_response = self.virtual_network_client.list_network_security_groups(compartment_id=compartment_id)
                for nsg in nsg_response.data:
                    resources["network_security_groups"].append({
                        "id": nsg.id,
                        "display_name": nsg.display_name,
                        "state": nsg.lifecycle_state,
                        "compartment": compartment_name,
                        "vcn_id": nsg.vcn_id,
                        "time_created": nsg.time_created.isoformat() if nsg.time_created else None
                    })
                print(f"Found {len(nsg_response.data)} network security groups in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering network security groups in {compartment_name}: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering additional network resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_additional_compute_resources(self, compartment_id, compartment_name, resources):
        """Discover additional compute resources like images"""
        try:
            # Images (limit to first 20 to avoid timeout)
            try:
                images_response = self.compute_client.list_images(compartment_id=compartment_id, limit=20)
                for image in images_response.data:
                    resources["images"].append({
                        "id": image.id,
                        "display_name": image.display_name,
                        "state": image.lifecycle_state,
                        "compartment": compartment_name,
                        "operating_system": image.operating_system,
                        "operating_system_version": image.operating_system_version,
                        "time_created": image.time_created.isoformat() if image.time_created else None
                    })
                print(f"Found {len(images_response.data)} images in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering images in {compartment_name}: {e}", file=sys.stderr)
                
        except Exception as e:
            print(f"Error discovering additional compute resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_additional_storage_resources(self, compartment_id, compartment_name, resources):
        """Discover additional storage resources"""
        try:
            # Volume Groups
            try:
                vg_response = self.blockstorage_client.list_volume_groups(compartment_id=compartment_id)
                for vg in vg_response.data:
                    resources["volume_groups"].append({
                        "id": vg.id,
                        "display_name": vg.display_name,
                        "state": vg.lifecycle_state,
                        "compartment": compartment_name,
                        "availability_domain": vg.availability_domain,
                        "time_created": vg.time_created.isoformat() if vg.time_created else None
                    })
                print(f"Found {len(vg_response.data)} volume groups in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering volume groups in {compartment_name}: {e}", file=sys.stderr)

            # Boot Volumes
            try:
                bv_response = self.blockstorage_client.list_boot_volumes(compartment_id=compartment_id)
                for bv in bv_response.data:
                    resources["boot_volumes"].append({
                        "id": bv.id,
                        "display_name": bv.display_name,
                        "state": bv.lifecycle_state,
                        "compartment": compartment_name,
                        "availability_domain": bv.availability_domain,
                        "size_in_gbs": bv.size_in_gbs,
                        "time_created": bv.time_created.isoformat() if bv.time_created else None
                    })
                print(f"Found {len(bv_response.data)} boot volumes in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering boot volumes in {compartment_name}: {e}", file=sys.stderr)

            # Backups
            try:
                backups_response = self.blockstorage_client.list_volume_backups(compartment_id=compartment_id)
                for backup in backups_response.data:
                    resources["backups"].append({
                        "id": backup.id,
                        "display_name": backup.display_name,
                        "state": backup.lifecycle_state,
                        "compartment": compartment_name,
                        "volume_id": backup.volume_id,
                        "size_in_gbs": backup.size_in_gbs,
                        "time_created": backup.time_created.isoformat() if backup.time_created else None
                    })
                print(f"Found {len(backups_response.data)} backups in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering backups in {compartment_name}: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering additional storage resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_additional_database_resources(self, compartment_id, compartment_name, resources):
        """Discover additional database resources"""
        try:
            # DB Systems
            try:
                db_systems_response = self.database_client.list_db_systems(compartment_id=compartment_id)
                for db_system in db_systems_response.data:
                    resources["db_systems"].append({
                        "id": db_system.id,
                        "display_name": db_system.display_name,
                        "state": db_system.lifecycle_state,
                        "compartment": compartment_name,
                        "availability_domain": db_system.availability_domain,
                        "shape": db_system.shape,
                        "time_created": db_system.time_created.isoformat() if db_system.time_created else None
                    })
                print(f"Found {len(db_systems_response.data)} DB systems in {compartment_name}", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering DB systems in {compartment_name}: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering additional database resources in {compartment_name}: {e}", file=sys.stderr)

    def _discover_additional_services(self, compartment_id, compartment_name, resources):
        """Discover additional OCI services"""
        try:
            # Functions
            try:
                from oci.functions import FunctionsManagementClient
                functions_client = FunctionsManagementClient(self.config)
                functions_response = functions_client.list_applications(compartment_id=compartment_id)
                for func in functions_response.data:
                    resources["functions"].append({
                        "id": func.id,
                        "display_name": func.display_name,
                        "state": func.lifecycle_state,
                        "compartment": compartment_name,
                        "time_created": func.time_created.isoformat() if func.time_created else None
                    })
                print(f"Found {len(functions_response.data)} functions in {compartment_name}", file=sys.stderr)
            except ImportError:
                print(f"Functions client not available", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering functions in {compartment_name}: {e}", file=sys.stderr)

            # Container Instances
            try:
                from oci.container_instances import ContainerInstanceClient
                container_client = ContainerInstanceClient(self.config)
                containers_response = container_client.list_container_instances(compartment_id=compartment_id)
                for container in containers_response.data:
                    resources["containers"].append({
                        "id": container.id,
                        "display_name": container.display_name,
                        "state": container.lifecycle_state,
                        "compartment": compartment_name,
                        "time_created": container.time_created.isoformat() if container.time_created else None
                    })
                print(f"Found {len(containers_response.data)} container instances in {compartment_name}", file=sys.stderr)
            except ImportError:
                print(f"Container instances client not available", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering container instances in {compartment_name}: {e}", file=sys.stderr)

            # Streaming
            try:
                from oci.streaming import StreamAdminClient
                streaming_client = StreamAdminClient(self.config)
                streams_response = streaming_client.list_streams(compartment_id=compartment_id)
                for stream in streams_response.data:
                    resources["streams"].append({
                        "id": stream.id,
                        "display_name": stream.name,
                        "state": stream.lifecycle_state,
                        "compartment": compartment_name,
                        "time_created": stream.time_created.isoformat() if stream.time_created else None
                    })
                print(f"Found {len(streams_response.data)} streams in {compartment_name}", file=sys.stderr)
            except ImportError:
                print(f"Streaming client not available", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering streams in {compartment_name}: {e}", file=sys.stderr)

            # Notifications
            try:
                from oci.ons import NotificationControlPlaneClient
                notification_client = NotificationControlPlaneClient(self.config)
                topics_response = notification_client.list_topics(compartment_id=compartment_id)
                for topic in topics_response.data:
                    resources["topics"].append({
                        "id": topic.topic_id,
                        "display_name": topic.name,
                        "state": topic.lifecycle_state,
                        "compartment": compartment_name,
                        "time_created": topic.time_created.isoformat() if topic.time_created else None
                    })
                print(f"Found {len(topics_response.data)} notification topics in {compartment_name}", file=sys.stderr)
            except ImportError:
                print(f"Notification client not available", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering notification topics in {compartment_name}: {e}", file=sys.stderr)

            # Monitoring alarms
            try:
                from oci.monitoring import MonitoringClient
                monitoring_client = MonitoringClient(self.config)
                alarms_response = monitoring_client.list_alarms(compartment_id=compartment_id)
                for alarm in alarms_response.data:
                    resources["alarms"].append({
                        "id": alarm.id,
                        "display_name": alarm.display_name,
                        "state": alarm.lifecycle_state,
                        "compartment": compartment_name,
                        "time_created": alarm.time_created.isoformat() if alarm.time_created else None
                    })
                print(f"Found {len(alarms_response.data)} monitoring alarms in {compartment_name}", file=sys.stderr)
            except ImportError:
                print(f"Monitoring client not available", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering monitoring alarms in {compartment_name}: {e}", file=sys.stderr)

            # Budgets
            try:
                from oci.budget import BudgetClient
                budget_client = BudgetClient(self.config)
                budgets_response = budget_client.list_budgets(compartment_id=compartment_id)
                for budget in budgets_response.data:
                    resources["budgets"].append({
                        "id": budget.id,
                        "display_name": budget.display_name,
                        "state": budget.lifecycle_state,
                        "compartment": compartment_name,
                        "time_created": budget.time_created.isoformat() if budget.time_created else None
                    })
                print(f"Found {len(budgets_response.data)} budgets in {compartment_name}", file=sys.stderr)
            except ImportError:
                print(f"Budget client not available", file=sys.stderr)
            except Exception as e:
                print(f"Error discovering budgets in {compartment_name}: {e}", file=sys.stderr)

            # Identity resources (only for root compartment)
            if compartment_id == self.config["tenancy"]:
                try:
                    # Users
                    users_response = self.identity_client.list_users(compartment_id=compartment_id)
                    for user in users_response.data:
                        resources["users"].append({
                            "id": user.id,
                            "display_name": user.name,
                            "state": user.lifecycle_state,
                            "compartment": compartment_name,
                            "time_created": user.time_created.isoformat() if user.time_created else None
                        })
                    print(f"Found {len(users_response.data)} users", file=sys.stderr)

                    # Groups
                    groups_response = self.identity_client.list_groups(compartment_id=compartment_id)
                    for group in groups_response.data:
                        resources["groups"].append({
                            "id": group.id,
                            "display_name": group.name,
                            "state": group.lifecycle_state,
                            "compartment": compartment_name,
                            "time_created": group.time_created.isoformat() if group.time_created else None
                        })
                    print(f"Found {len(groups_response.data)} groups", file=sys.stderr)

                    # Dynamic Groups
                    dynamic_groups_response = self.identity_client.list_dynamic_groups(compartment_id=compartment_id)
                    for dg in dynamic_groups_response.data:
                        resources["dynamic_groups"].append({
                            "id": dg.id,
                            "display_name": dg.name,
                            "state": dg.lifecycle_state,
                            "compartment": compartment_name,
                            "time_created": dg.time_created.isoformat() if dg.time_created else None
                        })
                    print(f"Found {len(dynamic_groups_response.data)} dynamic groups", file=sys.stderr)

                except Exception as e:
                    print(f"Error discovering identity resources: {e}", file=sys.stderr)

        except Exception as e:
            print(f"Error discovering additional services in {compartment_name}: {e}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description='Discover OCI resources')
    parser.add_argument('--credentials', required=True, help='OCI credentials JSON file or JSON string')
    parser.add_argument('--operation', default='all', help='Operation to perform (all, instances, storage, network)')
    
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
            "key_file": None,  # We'll use the private key directly
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
            
            # Create signer
            signer = Signer(
                tenancy=config["tenancy"],
                user=config["user"],
                fingerprint=config["fingerprint"],
                private_key_file_location=config["key_file"]
            )
            
            # Create OCI clients
            identity_client = oci.identity.IdentityClient(config, signer=signer)
            compute_client = oci.core.ComputeClient(config, signer=signer)
            blockstorage_client = oci.core.BlockstorageClient(config, signer=signer)
            objectstorage_client = oci.object_storage.ObjectStorageClient(config, signer=signer)
            database_client = oci.database.DatabaseClient(config, signer=signer)
            load_balancer_client = oci.load_balancer.LoadBalancerClient(config, signer=signer)
            virtual_network_client = oci.core.VirtualNetworkClient(config, signer=signer)
            
            print(f"OCI Config: user={config['user'][:20]}..., tenancy={config['tenancy'][:20]}..., region={config['region']}", file=sys.stderr)
            
            # Discover resources
            service = OCIInventoryService(config)
            resources = service.discover_resources()
            
            # Output results
            result = {
                "success": True,
                "resources": resources,
                "timestamp": datetime.now().isoformat(),
                "total_resources": sum(len(resource_list) for resource_list in resources.values())
            }
            
            print(json.dumps(result, indent=2))
            print("OCI discovery completed successfully", file=sys.stderr)
            
        finally:
            # Clean up temporary key file
            os.unlink(key_file_path)
            
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        print(f"OCI discovery failed: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()