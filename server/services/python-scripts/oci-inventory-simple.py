#!/usr/bin/env python3
"""
OCI Inventory Service - Simple and Reliable Python implementation
Discovers core OCI resources using the Python SDK
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
        """Discover core OCI resources"""
        try:
            config = self._build_config()
            signer = oci.signer.Signer(
                config['tenancy'],
                config['user'],
                config['fingerprint'],
                config['key_file']
            )
            
            print(f"OCI Config: user={config['user'][:20]}..., tenancy={config['tenancy'][:20]}..., region={config['region']}", file=sys.stderr)
            
            # Initialize clients
            identity_client = oci.identity.IdentityClient(config, signer=signer)
            compute_client = oci.core.ComputeClient(config, signer=signer)
            blockstorage_client = oci.core.BlockstorageClient(config, signer=signer)
            object_storage_client = oci.object_storage.ObjectStorageClient(config, signer=signer)
            database_client = oci.database.DatabaseClient(config, signer=signer)
            load_balancer_client = oci.load_balancer.LoadBalancerClient(config, signer=signer)
            vcn_client = oci.core.VirtualNetworkClient(config, signer=signer)
            
            # Get all compartments
            compartments = self._get_compartments(identity_client, config['tenancy'])
            print(f"Found {len(compartments)} compartments", file=sys.stderr)
            
            # Discover resources
            resources = {
                "compute_instances": [],
                "block_volumes": [],
                "object_storage_buckets": [],
                "autonomous_databases": [],
                "load_balancers": [],
                "vcns": [],
                "subnets": [],
                "security_lists": []
            }
            
            for compartment in compartments:
                compartment_id = compartment["id"]
                compartment_name = compartment["name"]
                
                print(f"Scanning compartment: {compartment_name}", file=sys.stderr)
                
                # Discover compute instances
                try:
                    instances_response = compute_client.list_instances(compartment_id=compartment_id)
                    for instance in instances_response.data:
                        resources["compute_instances"].append({
                            "id": instance.id,
                            "display_name": instance.display_name,
                            "shape": instance.shape,
                            "state": instance.lifecycle_state,
                            "compartment": compartment_name,
                            "availability_domain": instance.availability_domain,
                            "time_created": instance.time_created.isoformat() if instance.time_created else None
                        })
                    print(f"Found {len(instances_response.data)} compute instances in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering compute instances in {compartment_name}: {e}", file=sys.stderr)
                
                # Discover block volumes
                try:
                    volumes_response = blockstorage_client.list_volumes(compartment_id=compartment_id)
                    for volume in volumes_response.data:
                        resources["block_volumes"].append({
                            "id": volume.id,
                            "display_name": volume.display_name,
                            "size_gb": volume.size_in_gbs,
                            "state": volume.lifecycle_state,
                            "compartment": compartment_name,
                            "availability_domain": volume.availability_domain,
                            "time_created": volume.time_created.isoformat() if volume.time_created else None
                        })
                    print(f"Found {len(volumes_response.data)} block volumes in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering block volumes in {compartment_name}: {e}", file=sys.stderr)
                
                # Discover object storage buckets
                try:
                    namespace_response = object_storage_client.get_namespace()
                    namespace = namespace_response.data
                    
                    buckets_response = object_storage_client.list_buckets(
                        namespace_name=namespace,
                        compartment_id=compartment_id
                    )
                    
                    for bucket in buckets_response.data:
                        resources["object_storage_buckets"].append({
                            "id": bucket.name,
                            "display_name": bucket.name,
                            "namespace": namespace,
                            "compartment": compartment_name,
                            "time_created": bucket.time_created.isoformat() if bucket.time_created else None
                        })
                    print(f"Found {len(buckets_response.data)} object storage buckets in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering object storage buckets in {compartment_name}: {e}", file=sys.stderr)
                
                # Discover autonomous databases
                try:
                    adb_response = database_client.list_autonomous_databases(compartment_id=compartment_id)
                    for adb in adb_response.data:
                        resources["autonomous_databases"].append({
                            "id": adb.id,
                            "display_name": adb.display_name,
                            "db_name": adb.db_name,
                            "state": adb.lifecycle_state,
                            "compartment": compartment_name,
                            "cpu_core_count": adb.cpu_core_count,
                            "data_storage_size_in_tbs": adb.data_storage_size_in_tbs,
                            "time_created": adb.time_created.isoformat() if adb.time_created else None
                        })
                    print(f"Found {len(adb_response.data)} autonomous databases in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering autonomous databases in {compartment_name}: {e}", file=sys.stderr)
                
                # Discover load balancers
                try:
                    lb_response = load_balancer_client.list_load_balancers(compartment_id=compartment_id)
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
                
                # Discover VCNs
                try:
                    vcns_response = vcn_client.list_vcns(compartment_id=compartment_id)
                    for vcn in vcns_response.data:
                        resources["vcns"].append({
                            "id": vcn.id,
                            "display_name": vcn.display_name,
                            "cidr_block": vcn.cidr_block,
                            "state": vcn.lifecycle_state,
                            "compartment": compartment_name,
                            "time_created": vcn.time_created.isoformat() if vcn.time_created else None
                        })
                    print(f"Found {len(vcns_response.data)} VCNs in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering VCNs in {compartment_name}: {e}", file=sys.stderr)
                
                # Discover subnets
                try:
                    subnets_response = vcn_client.list_subnets(compartment_id=compartment_id)
                    for subnet in subnets_response.data:
                        resources["subnets"].append({
                            "id": subnet.id,
                            "display_name": subnet.display_name,
                            "cidr_block": subnet.cidr_block,
                            "state": subnet.lifecycle_state,
                            "compartment": compartment_name,
                            "vcn_id": subnet.vcn_id,
                            "time_created": subnet.time_created.isoformat() if subnet.time_created else None
                        })
                    print(f"Found {len(subnets_response.data)} subnets in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering subnets in {compartment_name}: {e}", file=sys.stderr)
                
                # Discover security lists
                try:
                    security_lists_response = vcn_client.list_security_lists(compartment_id=compartment_id)
                    for security_list in security_lists_response.data:
                        resources["security_lists"].append({
                            "id": security_list.id,
                            "display_name": security_list.display_name,
                            "state": security_list.lifecycle_state,
                            "compartment": compartment_name,
                            "vcn_id": security_list.vcn_id,
                            "time_created": security_list.time_created.isoformat() if security_list.time_created else None
                        })
                    print(f"Found {len(security_lists_response.data)} security lists in {compartment_name}", file=sys.stderr)
                except Exception as e:
                    print(f"Error discovering security lists in {compartment_name}: {e}", file=sys.stderr)
            
            print("OCI discovery completed successfully", file=sys.stderr)
            return resources
            
        except Exception as e:
            print(f"OCI discovery error: {e}", file=sys.stderr)
            raise e
    
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

def main():
    """Main function for command line usage"""
    import argparse
    import os
    
    parser = argparse.ArgumentParser(description='OCI Simple Resource Discovery')
    parser.add_argument('--credentials', required=True, help='OCI credentials JSON or file path')
    parser.add_argument('--operation', default='all', choices=['all', 'compute', 'storage', 'database', 'network'], help='Resource type to discover')
    
    args = parser.parse_args()
    
    try:
        # Parse credentials
        if os.path.exists(args.credentials):
            with open(args.credentials, 'r') as f:
                credentials = json.loads(f.read())
        else:
            credentials = json.loads(args.credentials)
        
        # Create service and discover resources
        service = OCIInventoryService(credentials)
        result = service.discover_resources()
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
