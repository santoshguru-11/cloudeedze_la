#!/usr/bin/env python3
"""
OCI Inventory Service - Comprehensive Python implementation
Discovers ALL OCI resources using the Python SDK
"""

import json
import sys
import os
import tempfile
from typing import Dict, List, Any, Optional
import oci

class OCIInventoryService:
    def __init__(self, credentials: Dict[str, Any]):
        self.credentials = credentials
        self.temp_key_file = None
        
    def _build_config(self) -> Dict[str, Any]:
        """Build OCI config from credentials"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as f:
            f.write(self.credentials["privateKey"])
            self.temp_key_file = f.name
        
        return {
            "user": self.credentials["userId"],
            "fingerprint": self.credentials["fingerprint"],
            "tenancy": self.credentials["tenancyId"],
            "region": self.credentials["region"],
            "key_file": self.temp_key_file
        }
    
    def __del__(self):
        """Clean up temporary key file"""
        if self.temp_key_file and os.path.exists(self.temp_key_file):
            try:
                os.unlink(self.temp_key_file)
            except:
                pass
    
    def discover_resources(self) -> Dict[str, Any]:
        """Discover ALL OCI resources comprehensively"""
        try:
            config = self._build_config()
            signer = oci.signer.Signer(
                config['tenancy'],
                config['user'],
                config['fingerprint'],
                config['key_file']
            )
            
            print(f"OCI Config: user={config['user'][:20]}..., tenancy={config['tenancy'][:20]}..., region={config['region']}", file=sys.stderr)
            
            # Get all compartments
            identity_client = oci.identity.IdentityClient(config, signer=signer)
            compartments = self._get_compartments(identity_client, config['tenancy'])
            
            # Initialize clients
            clients = self._initialize_clients(config, signer)
            
            # Discover resources
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
                "container_instances": [],
                "node_pools": [],
                "clusters": [],
                "functions": [],
                "applications": [],
                "api_gateways": [],
                "deployments": [],
                "streams": [],
                "stream_pools": [],
                "alarms": [],
                "log_groups": [],
                "log_sources": [],
                "analytics_instances": [],
                "data_integration_workspaces": [],
                "data_catalogs": [],
                "data_science_projects": [],
                "notebook_sessions": [],
                "model_deployments": [],
                "jobs": [],
                "pipeline_runs": [],
                "dns_zones": [],
                "dns_records": [],
                "certificates": [],
                "vaults": [],
                "keys": [],
                "secrets": [],
                "artifacts": [],
                "repositories": [],
                "os_management_instances": [],
                "lifecycle_environments": [],
                "operations_insights_warehouses": [],
                "management_agents": [],
                "dashboards": [],
                "optimizer_profiles": [],
                "resource_manager_stacks": [],
                "work_requests": [],
                "usage_reports": [],
                "budgets": [],
                "cost_analysis": [],
                "subscriptions": [],
                "organizations": [],
                "links": [],
                "recipient_invitations": [],
                "sender_invitations": [],
                "domain_governances": [],
                "domains": [],
                "subscription_mappings": [],
                "assigned_subscriptions": [],
                "subscription_line_items": []
            }
            
            for compartment in compartments:
                compartment_id = compartment["id"]
                compartment_name = compartment["name"]
                
                print(f"Scanning compartment: {compartment_name}", file=sys.stderr)
                
                # Discover all resource types
                self._discover_compute_resources(clients, compartment_id, compartment_name, resources)
                self._discover_storage_resources(clients, compartment_id, compartment_name, resources)
                self._discover_network_resources(clients, compartment_id, compartment_name, resources)
                self._discover_database_resources(clients, compartment_id, compartment_name, resources)
                self._discover_container_resources(clients, compartment_id, compartment_name, resources)
                self._discover_serverless_resources(clients, compartment_id, compartment_name, resources)
                self._discover_analytics_resources(clients, compartment_id, compartment_name, resources)
                self._discover_ai_resources(clients, compartment_id, compartment_name, resources)
                self._discover_security_resources(clients, compartment_id, compartment_name, resources)
                self._discover_monitoring_resources(clients, compartment_id, compartment_name, resources)
                self._discover_management_resources(clients, compartment_id, compartment_name, resources)
                self._discover_cost_resources(clients, compartment_id, compartment_name, resources)
                self._discover_tenant_resources(clients, compartment_id, compartment_name, resources)
            
            print("OCI comprehensive discovery completed successfully", file=sys.stderr)
            return resources
            
        except Exception as e:
            print(f"OCI discovery error: {e}", file=sys.stderr)
            raise e
    
    def _initialize_clients(self, config: Dict[str, Any], signer) -> Dict[str, Any]:
        """Initialize all OCI service clients"""
        clients = {}
        
        # Core services
        clients['identity'] = oci.identity.IdentityClient(config, signer=signer)
        clients['compute'] = oci.core.ComputeClient(config, signer=signer)
        clients['blockstorage'] = oci.core.BlockstorageClient(config, signer=signer)
        clients['network'] = oci.core.VirtualNetworkClient(config, signer=signer)
        clients['object_storage'] = oci.object_storage.ObjectStorageClient(config, signer=signer)
        clients['database'] = oci.database.DatabaseClient(config, signer=signer)
        clients['load_balancer'] = oci.load_balancer.LoadBalancerClient(config, signer=signer)
        
        # Additional services
        try:
            clients['container_engine'] = oci.container_engine.ContainerEngineClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['functions'] = oci.functions.FunctionsManagementClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['api_gateway'] = oci.apigateway.ApiGatewayClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['streaming'] = oci.streaming.StreamAdminClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['monitoring'] = oci.monitoring.MonitoringClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['logging'] = oci.logging.LoggingManagementClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['analytics'] = oci.analytics.AnalyticsClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['data_integration'] = oci.data_integration.DataIntegrationClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['data_catalog'] = oci.data_catalog.DataCatalogClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['data_science'] = oci.data_science.DataScienceClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['dns'] = oci.dns.DnsClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['certificates'] = oci.certificates_management.CertificatesManagementClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['kms'] = oci.key_management.KmsManagementClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['vault'] = oci.vault.VaultsClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['usage_api'] = oci.usage_api.UsageapiClient(config, signer=signer)
        except:
            pass
        
        try:
            clients['budget'] = oci.budget.BudgetClient(config, signer=signer)
        except:
            pass
        
        return clients
    
    def _get_compartments(self, identity_client, tenancy_id: str) -> List[Dict[str, str]]:
        """Get all accessible compartments"""
        try:
            compartments = []
            
            # Add root compartment (tenancy itself)
            root_compartment = identity_client.get_compartment(tenancy_id).data
            compartments.append({
                "id": root_compartment.id,
                "name": root_compartment.name
            })
            
            # List all compartments in the tenancy (including subcompartments)
            list_compartments_response = identity_client.list_compartments(
                tenancy_id,
                compartment_id_in_subtree=True,
                access_level="ANY"
            )
            for compartment in list_compartments_response.data:
                compartments.append({
                    "id": compartment.id,
                    "name": compartment.name
                })
            
            return compartments
        except Exception as e:
            print(f"Error getting compartments: {e}", file=sys.stderr)
            return []
    
    def _discover_compute_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover compute-related resources"""
        try:
            # Compute instances
            instances_response = clients['compute'].list_instances(compartment_id=compartment_id)
            for instance in instances_response.data:
                resources["compute_instances"].append({
                    "id": instance.id,
                    "display_name": instance.display_name,
                    "shape": instance.shape,
                    "state": instance.lifecycle_state,
                    "compartment": compartment_name,
                    "availability_domain": instance.availability_domain,
                    "fault_domain": instance.fault_domain,
                    "image_id": instance.image_id,
                    "launch_mode": instance.launch_mode,
                    "metadata": instance.metadata,
                    "region": instance.region,
                    "time_created": instance.time_created.isoformat() if instance.time_created else None
                })
        except Exception as e:
            print(f"Error discovering compute instances: {e}", file=sys.stderr)
    
    def _discover_storage_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover storage-related resources"""
        try:
            # Block volumes
            volumes_response = clients['blockstorage'].list_volumes(compartment_id=compartment_id)
            for volume in volumes_response.data:
                resources["block_volumes"].append({
                    "id": volume.id,
                    "display_name": volume.display_name,
                    "size_gb": volume.size_in_gbs,
                    "state": volume.lifecycle_state,
                    "compartment": compartment_name,
                    "availability_domain": volume.availability_domain,
                    "is_auto_tune_enabled": volume.is_auto_tune_enabled,
                    "is_hydrated": volume.is_hydrated,
                    "kms_key_id": volume.kms_key_id,
                    "time_created": volume.time_created.isoformat() if volume.time_created else None
                })
            
            # Object storage buckets
            try:
                namespace_response = clients['object_storage'].get_namespace()
                namespace = namespace_response.data
                
                buckets_response = clients['object_storage'].list_buckets(
                    namespace_name=namespace,
                    compartment_id=compartment_id
                )
                
                for bucket in buckets_response.data:
                    resources["object_storage_buckets"].append({
                        "id": bucket.name,
                        "display_name": bucket.name,
                        "namespace": namespace,
                        "compartment": compartment_name,
                        "created_by": bucket.created_by,
                        "etag": bucket.etag,
                        "freeform_tags": bucket.freeform_tags,
                        "is_read_only": bucket.is_read_only,
                        "kms_key_id": bucket.kms_key_id,
                        "metadata": bucket.metadata,
                        "object_events_enabled": bucket.object_events_enabled,
                        "public_access_type": bucket.public_access_type,
                        "replication_enabled": bucket.replication_enabled,
                        "storage_tier": bucket.storage_tier,
                        "time_created": bucket.time_created.isoformat() if bucket.time_created else None,
                        "versioning": bucket.versioning
                    })
            except Exception as e:
                print(f"Error discovering object storage buckets: {e}", file=sys.stderr)
                
        except Exception as e:
            print(f"Error discovering storage resources: {e}", file=sys.stderr)
    
    def _discover_network_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover network-related resources"""
        try:
            # VCNs
            vcns_response = clients['network'].list_vcns(compartment_id=compartment_id)
            for vcn in vcns_response.data:
                resources["vcns"].append({
                    "id": vcn.id,
                    "display_name": vcn.display_name,
                    "cidr_block": vcn.cidr_block,
                    "state": vcn.lifecycle_state,
                    "compartment": compartment_name,
                    "default_dhcp_options_id": vcn.default_dhcp_options_id,
                    "default_route_table_id": vcn.default_route_table_id,
                    "default_security_list_id": vcn.default_security_list_id,
                    "dns_label": vcn.dns_label,
                    "freeform_tags": vcn.freeform_tags,
                    "ipv6_cidr_block": vcn.ipv6_cidr_block,
                    "is_ipv6_enabled": vcn.is_ipv6_enabled,
                    "time_created": vcn.time_created.isoformat() if vcn.time_created else None
                })
            
            # Subnets
            try:
                subnets_response = clients['network'].list_subnets(compartment_id=compartment_id)
                for subnet in subnets_response.data:
                    resources["subnets"].append({
                        "id": subnet.id,
                        "display_name": subnet.display_name,
                        "cidr_block": subnet.cidr_block,
                        "state": subnet.lifecycle_state,
                        "compartment": compartment_name,
                        "availability_domain": subnet.availability_domain,
                        "dns_label": subnet.dns_label,
                        "freeform_tags": subnet.freeform_tags,
                        "prohibit_internet_ingress": subnet.prohibit_internet_ingress,
                        "prohibit_public_ip_on_vnic": subnet.prohibit_public_ip_on_vnic,
                        "route_table_id": subnet.route_table_id,
                        "security_list_ids": subnet.security_list_ids,
                        "time_created": subnet.time_created.isoformat() if subnet.time_created else None,
                        "vcn_id": subnet.vcn_id
                    })
            except Exception as e:
                print(f"Error discovering subnets: {e}", file=sys.stderr)
            
            # Security Lists
            try:
                security_lists_response = clients['network'].list_security_lists(compartment_id=compartment_id)
                for security_list in security_lists_response.data:
                    resources["security_lists"].append({
                        "id": security_list.id,
                        "display_name": security_list.display_name,
                        "state": security_list.lifecycle_state,
                        "compartment": compartment_name,
                        "egress_security_rules": [rule.__dict__ for rule in security_list.egress_security_rules],
                        "freeform_tags": security_list.freeform_tags,
                        "ingress_security_rules": [rule.__dict__ for rule in security_list.ingress_security_rules],
                        "time_created": security_list.time_created.isoformat() if security_list.time_created else None,
                        "vcn_id": security_list.vcn_id
                    })
            except Exception as e:
                print(f"Error discovering security lists: {e}", file=sys.stderr)
            
            # Route Tables
            try:
                route_tables_response = clients['network'].list_route_tables(compartment_id=compartment_id)
                for route_table in route_tables_response.data:
                    resources["route_tables"].append({
                        "id": route_table.id,
                        "display_name": route_table.display_name,
                        "state": route_table.lifecycle_state,
                        "compartment": compartment_name,
                        "freeform_tags": route_table.freeform_tags,
                        "route_rules": [rule.__dict__ for rule in route_table.route_rules],
                        "time_created": route_table.time_created.isoformat() if route_table.time_created else None,
                        "vcn_id": route_table.vcn_id
                    })
            except Exception as e:
                print(f"Error discovering route tables: {e}", file=sys.stderr)
            
            # Internet Gateways
            try:
                ig_response = clients['network'].list_internet_gateways(compartment_id=compartment_id)
                for ig in ig_response.data:
                    resources["internet_gateways"].append({
                        "id": ig.id,
                        "display_name": ig.display_name,
                        "state": ig.lifecycle_state,
                        "compartment": compartment_name,
                        "freeform_tags": ig.freeform_tags,
                        "is_enabled": ig.is_enabled,
                        "time_created": ig.time_created.isoformat() if ig.time_created else None,
                        "vcn_id": ig.vcn_id
                    })
            except Exception as e:
                print(f"Error discovering internet gateways: {e}", file=sys.stderr)
            
            # NAT Gateways
            try:
                nat_response = clients['network'].list_nat_gateways(compartment_id=compartment_id)
                for nat in nat_response.data:
                    resources["nat_gateways"].append({
                        "id": nat.id,
                        "display_name": nat.display_name,
                        "state": nat.lifecycle_state,
                        "compartment": compartment_name,
                        "freeform_tags": nat.freeform_tags,
                        "nat_ip": nat.nat_ip,
                        "time_created": nat.time_created.isoformat() if nat.time_created else None,
                        "vcn_id": nat.vcn_id
                    })
            except Exception as e:
                print(f"Error discovering NAT gateways: {e}", file=sys.stderr)
            
            # Service Gateways
            try:
                sg_response = clients['network'].list_service_gateways(compartment_id=compartment_id)
                for sg in sg_response.data:
                    resources["service_gateways"].append({
                        "id": sg.id,
                        "display_name": sg.display_name,
                        "state": sg.lifecycle_state,
                        "compartment": compartment_name,
                        "freeform_tags": sg.freeform_tags,
                        "services": [service.__dict__ for service in sg.services],
                        "time_created": sg.time_created.isoformat() if sg.time_created else None,
                        "vcn_id": sg.vcn_id
                    })
            except Exception as e:
                print(f"Error discovering service gateways: {e}", file=sys.stderr)
            
            # Load Balancers
            try:
                lb_response = clients['load_balancer'].list_load_balancers(compartment_id=compartment_id)
                for lb in lb_response.data:
                    resources["load_balancers"].append({
                        "id": lb.id,
                        "display_name": lb.display_name,
                        "state": lb.lifecycle_state,
                        "compartment": compartment_name,
                        "freeform_tags": lb.freeform_tags,
                        "ip_addresses": [ip.__dict__ for ip in lb.ip_addresses],
                        "is_private": lb.is_private,
                        "network_security_group_ids": lb.network_security_group_ids,
                        "shape_name": lb.shape_name,
                        "subnet_ids": lb.subnet_ids,
                        "time_created": lb.time_created.isoformat() if lb.time_created else None
                    })
            except Exception as e:
                print(f"Error discovering load balancers: {e}", file=sys.stderr)
                
        except Exception as e:
            print(f"Error discovering network resources: {e}", file=sys.stderr)
    
    def _discover_database_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover database-related resources"""
        try:
            # Autonomous Databases
            try:
                adb_response = clients['database'].list_autonomous_databases(compartment_id=compartment_id)
                for adb in adb_response.data:
                    resources["autonomous_databases"].append({
                        "id": adb.id,
                        "display_name": adb.display_name,
                        "db_name": adb.db_name,
                        "state": adb.lifecycle_state,
                        "compartment": compartment_name,
                        "cpu_core_count": adb.cpu_core_count,
                        "data_storage_size_in_tbs": adb.data_storage_size_in_tbs,
                        "db_version": adb.db_version,
                        "db_workload": adb.db_workload,
                        "freeform_tags": adb.freeform_tags,
                        "is_auto_scaling_enabled": adb.is_auto_scaling_enabled,
                        "is_dedicated": adb.is_dedicated,
                        "is_free_tier": adb.is_free_tier,
                        "license_model": adb.license_model,
                        "time_created": adb.time_created.isoformat() if adb.time_created else None
                    })
            except Exception as e:
                print(f"Error discovering autonomous databases: {e}", file=sys.stderr)
                
        except Exception as e:
            print(f"Error discovering database resources: {e}", file=sys.stderr)
    
    def _discover_container_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover container-related resources"""
        try:
            if 'container_engine' in clients:
                # Clusters
                try:
                    clusters_response = clients['container_engine'].list_clusters(compartment_id=compartment_id)
                    for cluster in clusters_response.data:
                        resources["clusters"].append({
                            "id": cluster.id,
                            "name": cluster.name,
                            "state": cluster.lifecycle_state,
                            "compartment": compartment_name,
                            "kubernetes_version": cluster.kubernetes_version,
                            "vcn_id": cluster.vcn_id,
                            "freeform_tags": cluster.freeform_tags,
                            "time_created": cluster.time_created.isoformat() if cluster.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering clusters: {e}", file=sys.stderr)
                
                # Node Pools
                try:
                    node_pools_response = clients['container_engine'].list_node_pools(compartment_id=compartment_id)
                    for node_pool in node_pools_response.data:
                        resources["node_pools"].append({
                            "id": node_pool.id,
                            "name": node_pool.name,
                            "state": node_pool.lifecycle_state,
                            "compartment": compartment_name,
                            "cluster_id": node_pool.cluster_id,
                            "kubernetes_version": node_pool.kubernetes_version,
                            "node_image_id": node_pool.node_image_id,
                            "node_image_name": node_pool.node_image_name,
                            "node_shape": node_pool.node_shape,
                            "freeform_tags": node_pool.freeform_tags,
                            "time_created": node_pool.time_created.isoformat() if node_pool.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering node pools: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering container resources: {e}", file=sys.stderr)
    
    def _discover_serverless_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover serverless-related resources"""
        try:
            if 'functions' in clients:
                # Functions Applications
                try:
                    apps_response = clients['functions'].list_applications(compartment_id=compartment_id)
                    for app in apps_response.data:
                        resources["applications"].append({
                            "id": app.id,
                            "display_name": app.display_name,
                            "state": app.lifecycle_state,
                            "compartment": compartment_name,
                            "config": app.config,
                            "freeform_tags": app.freeform_tags,
                            "time_created": app.time_created.isoformat() if app.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering functions applications: {e}", file=sys.stderr)
                
                # Functions
                try:
                    functions_response = clients['functions'].list_functions(compartment_id=compartment_id)
                    for function in functions_response.data:
                        resources["functions"].append({
                            "id": function.id,
                            "display_name": function.display_name,
                            "state": function.lifecycle_state,
                            "compartment": compartment_name,
                            "application_id": function.application_id,
                            "config": function.config,
                            "freeform_tags": function.freeform_tags,
                            "image": function.image,
                            "memory_in_mbs": function.memory_in_mbs,
                            "time_created": function.time_created.isoformat() if function.time_created else None,
                            "timeout_in_seconds": function.timeout_in_seconds
                        })
                except Exception as e:
                    print(f"Error discovering functions: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering serverless resources: {e}", file=sys.stderr)
    
    def _discover_analytics_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover analytics-related resources"""
        try:
            if 'streaming' in clients:
                # Stream Pools
                try:
                    stream_pools_response = clients['streaming'].list_stream_pools(compartment_id=compartment_id)
                    for pool in stream_pools_response.data:
                        resources["stream_pools"].append({
                            "id": pool.id,
                            "name": pool.name,
                            "state": pool.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": pool.freeform_tags,
                            "is_private": pool.is_private,
                            "time_created": pool.time_created.isoformat() if pool.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering stream pools: {e}", file=sys.stderr)
                
                # Streams
                try:
                    streams_response = clients['streaming'].list_streams(compartment_id=compartment_id)
                    for stream in streams_response.data:
                        resources["streams"].append({
                            "id": stream.id,
                            "name": stream.name,
                            "state": stream.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": stream.freeform_tags,
                            "partitions": stream.partitions,
                            "retention_in_hours": stream.retention_in_hours,
                            "stream_pool_id": stream.stream_pool_id,
                            "time_created": stream.time_created.isoformat() if stream.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering streams: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering analytics resources: {e}", file=sys.stderr)
    
    def _discover_ai_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover AI-related resources"""
        try:
            if 'data_science' in clients:
                # Data Science Projects
                try:
                    projects_response = clients['data_science'].list_projects(compartment_id=compartment_id)
                    for project in projects_response.data:
                        resources["data_science_projects"].append({
                            "id": project.id,
                            "display_name": project.display_name,
                            "state": project.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": project.freeform_tags,
                            "time_created": project.time_created.isoformat() if project.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering data science projects: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering AI resources: {e}", file=sys.stderr)
    
    def _discover_security_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover security-related resources"""
        try:
            if 'dns' in clients:
                # DNS Zones
                try:
                    zones_response = clients['dns'].list_zones(compartment_id=compartment_id)
                    for zone in zones_response.data:
                        resources["dns_zones"].append({
                            "id": zone.id,
                            "name": zone.name,
                            "zone_type": zone.zone_type,
                            "compartment": compartment_name,
                            "freeform_tags": zone.freeform_tags,
                            "is_protected": zone.is_protected,
                            "time_created": zone.time_created.isoformat() if zone.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering DNS zones: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering security resources: {e}", file=sys.stderr)
    
    def _discover_monitoring_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover monitoring-related resources"""
        try:
            if 'monitoring' in clients:
                # Alarms
                try:
                    alarms_response = clients['monitoring'].list_alarms(compartment_id=compartment_id)
                    for alarm in alarms_response.data:
                        resources["alarms"].append({
                            "id": alarm.id,
                            "display_name": alarm.display_name,
                            "state": alarm.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": alarm.freeform_tags,
                            "is_enabled": alarm.is_enabled,
                            "metric_compartment_id": alarm.metric_compartment_id,
                            "namespace": alarm.namespace,
                            "query": alarm.query,
                            "resolution": alarm.resolution,
                            "severity": alarm.severity,
                            "time_created": alarm.time_created.isoformat() if alarm.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering alarms: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering monitoring resources: {e}", file=sys.stderr)
    
    def _discover_management_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover management-related resources"""
        try:
            if 'usage_api' in clients:
                # Usage Reports
                try:
                    usage_response = clients['usage_api'].list_usage_reports(compartment_id=compartment_id)
                    for report in usage_response.data:
                        resources["usage_reports"].append({
                            "id": report.id,
                            "name": report.name,
                            "state": report.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": report.freeform_tags,
                            "time_created": report.time_created.isoformat() if report.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering usage reports: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering management resources: {e}", file=sys.stderr)
    
    def _discover_cost_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover cost-related resources"""
        try:
            if 'budget' in clients:
                # Budgets
                try:
                    budgets_response = clients['budget'].list_budgets(compartment_id=compartment_id)
                    for budget in budgets_response.data:
                        resources["budgets"].append({
                            "id": budget.id,
                            "display_name": budget.display_name,
                            "state": budget.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": budget.freeform_tags,
                            "time_created": budget.time_created.isoformat() if budget.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering budgets: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering cost resources: {e}", file=sys.stderr)
    
    def _discover_tenant_resources(self, clients: Dict, compartment_id: str, compartment_name: str, resources: Dict):
        """Discover tenant-related resources"""
        try:
            if 'usage_api' in clients:
                # Subscriptions
                try:
                    subs_response = clients['usage_api'].list_subscriptions(compartment_id=compartment_id)
                    for sub in subs_response.data:
                        resources["subscriptions"].append({
                            "id": sub.id,
                            "display_name": sub.display_name,
                            "state": sub.lifecycle_state,
                            "compartment": compartment_name,
                            "freeform_tags": sub.freeform_tags,
                            "time_created": sub.time_created.isoformat() if sub.time_created else None
                        })
                except Exception as e:
                    print(f"Error discovering subscriptions: {e}", file=sys.stderr)
        except Exception as e:
            print(f"Error discovering tenant resources: {e}", file=sys.stderr)

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='OCI Comprehensive Resource Discovery')
    parser.add_argument('--credentials', required=True, help='OCI credentials JSON or file path')
    parser.add_argument('--operation', default='all', choices=['all', 'compute', 'storage', 'database', 'network'], help='Resource type to discover')
    
    args = parser.parse_args()
    
    try:
        # Parse credentials
        if args.credentials.startswith('/') or args.credentials.startswith('./'):
            with open(args.credentials, 'r') as f:
                credentials = json.loads(f.read())
        else:
            credentials = json.loads(args.credentials)
        
        # Create service and discover resources
        service = OCIInventoryService(credentials)
        
        if args.operation == 'all':
            result = service.discover_resources()
        else:
            # For specific operations, we could implement targeted discovery
            result = service.discover_resources()
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
