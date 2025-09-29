#!/usr/bin/env python3
import json
import sys
import oci
from oci.config import from_file
from oci.core import ComputeClient, BlockstorageClient, VirtualNetworkClient
from oci.database import DatabaseClient
from oci.object_storage import ObjectStorageClient
from oci.load_balancer import LoadBalancerClient
from oci.identity import IdentityClient
from oci.resource_search import ResourceSearchClient

def discover_oci_resources(credentials):
    """Discover OCI resources using Python SDK"""
    try:
        # Create OCI config from credentials
        config = {
            "user": credentials["userId"],
            "key_file": None,
            "fingerprint": credentials["fingerprint"],
            "tenancy": credentials["tenancyId"],
            "region": credentials["region"],
            "key_content": credentials["privateKey"]
        }
        
        # Initialize clients
        identity_client = IdentityClient(config)
        compute_client = ComputeClient(config)
        blockstorage_client = BlockstorageClient(config)
        objectstorage_client = ObjectStorageClient(config)
        database_client = DatabaseClient(config)
        loadbalancer_client = LoadBalancerClient(config)
        vcn_client = VirtualNetworkClient(config)
        resource_search_client = ResourceSearchClient(config)
        
        resources = {
            "compute_instances": [],
            "block_volumes": [],
            "object_storage_buckets": [],
            "autonomous_databases": [],
            "load_balancers": [],
            "vcns": []
        }
        
        # Get compartments
        try:
            compartments = identity_client.list_compartments(
                compartment_id=credentials["tenancyId"]
            ).data
        except Exception as e:
            print(f"Error getting compartments: {e}", file=sys.stderr)
            return resources
        
        # Discover resources in each compartment
        for compartment in compartments:
            comp_id = compartment.id
            comp_name = compartment.name
            
            # Compute instances
            try:
                instances = compute_client.list_instances(
                    compartment_id=comp_id
                ).data
                for instance in instances:
                    resources["compute_instances"].append({
                        "id": instance.id,
                        "display_name": instance.display_name,
                        "shape": instance.shape,
                        "state": instance.lifecycle_state,
                        "compartment": comp_name
                    })
            except Exception as e:
                print(f"Error discovering compute instances in {comp_name}: {e}", file=sys.stderr)
            
            # Block volumes
            try:
                volumes = blockstorage_client.list_volumes(
                    compartment_id=comp_id
                ).data
                for volume in volumes:
                    resources["block_volumes"].append({
                        "id": volume.id,
                        "display_name": volume.display_name,
                        "size_gb": volume.size_in_gbs,
                        "state": volume.lifecycle_state,
                        "compartment": comp_name
                    })
            except Exception as e:
                print(f"Error discovering block volumes in {comp_name}: {e}", file=sys.stderr)
            
            # Object storage buckets
            try:
                namespace = objectstorage_client.get_namespace().data
                buckets = objectstorage_client.list_buckets(
                    namespace_name=namespace,
                    compartment_id=comp_id
                ).data
                for bucket in buckets:
                    resources["object_storage_buckets"].append({
                        "id": bucket.name,
                        "display_name": bucket.name,
                        "namespace": namespace,
                        "compartment": comp_name
                    })
            except Exception as e:
                print(f"Error discovering object storage buckets in {comp_name}: {e}", file=sys.stderr)
            
            # Autonomous databases
            try:
                adbs = database_client.list_autonomous_databases(
                    compartment_id=comp_id
                ).data
                for adb in adbs:
                    resources["autonomous_databases"].append({
                        "id": adb.id,
                        "display_name": adb.display_name,
                        "cpu_core_count": adb.cpu_core_count,
                        "data_storage_size_in_tbs": adb.data_storage_size_in_tbs,
                        "compartment": comp_name
                    })
            except Exception as e:
                print(f"Error discovering autonomous databases in {comp_name}: {e}", file=sys.stderr)
            
            # Load balancers
            try:
                lbs = loadbalancer_client.list_load_balancers(
                    compartment_id=comp_id
                ).data
                for lb in lbs:
                    resources["load_balancers"].append({
                        "id": lb.id,
                        "display_name": lb.display_name,
                        "shape_name": lb.shape_name,
                        "lifecycle_state": lb.lifecycle_state,
                        "compartment": comp_name
                    })
            except Exception as e:
                print(f"Error discovering load balancers in {comp_name}: {e}", file=sys.stderr)
            
            # VCNs
            try:
                vcns = vcn_client.list_vcns(
                    compartment_id=comp_id
                ).data
                for vcn in vcns:
                    resources["vcns"].append({
                        "id": vcn.id,
                        "display_name": vcn.display_name,
                        "cidr_block": vcn.cidr_block,
                        "lifecycle_state": vcn.lifecycle_state,
                        "compartment": comp_name
                    })
            except Exception as e:
                print(f"Error discovering VCNs in {comp_name}: {e}", file=sys.stderr)
        
        return resources
        
    except Exception as e:
        print(f"Error in OCI discovery: {e}", file=sys.stderr)
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 oci_discovery.py <credentials_json>", file=sys.stderr)
        sys.exit(1)
    
    try:
        credentials = json.loads(sys.argv[1])
        resources = discover_oci_resources(credentials)
        print(json.dumps(resources, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
