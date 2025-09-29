#!/usr/bin/env python3
"""
Simple OCI Resource Discovery for Testing
Focuses on core resources to avoid API compatibility issues
"""

import json
import sys
import os
import tempfile
import argparse
from datetime import datetime
import oci
from oci.config import from_file

def main():
    parser = argparse.ArgumentParser(description='Simple OCI Resource Discovery')
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

            print(f"Starting simple OCI discovery for tenancy {config['tenancy'][:20]}... in region {config['region']}", file=sys.stderr)

            # Initialize basic clients
            identity_client = oci.identity.IdentityClient(config)
            compute_client = oci.core.ComputeClient(config)
            blockstorage_client = oci.core.BlockstorageClient(config)
            virtual_network_client = oci.core.VirtualNetworkClient(config)

            if args.operation == 'validate':
                # Just validate credentials
                try:
                    identity_client.get_tenancy(tenancy_id=config["tenancy"])
                    result = {"success": True, "message": "Credentials validated successfully"}
                except Exception as e:
                    result = {"success": False, "error": f"Credential validation failed: {str(e)}"}
                print(json.dumps(result, indent=2))
                return

            # Get compartments
            compartments_response = identity_client.list_compartments(
                compartment_id=config["tenancy"],
                compartment_id_in_subtree=True,
                access_level="ACCESSIBLE"
            )
            compartments = compartments_response.data

            # Add root compartment
            root_compartment = identity_client.get_compartment(compartment_id=config["tenancy"]).data
            compartments.append(root_compartment)

            print(f"Found {len(compartments)} compartments to scan", file=sys.stderr)

            resources = {
                "compute_instances": [],
                "block_volumes": [],
                "vcns": [],
                "subnets": []
            }

            # Scan each compartment for basic resources
            for compartment in compartments:
                compartment_id = compartment.id
                compartment_name = compartment.name

                print(f"Scanning compartment: {compartment_name}", file=sys.stderr)

                try:
                    # Compute Instances
                    instances = compute_client.list_instances(compartment_id=compartment_id).data
                    for instance in instances:
                        shape_config_dict = None
                        if hasattr(instance, 'shape_config') and instance.shape_config:
                            shape_config_dict = {
                                "ocpus": getattr(instance.shape_config, 'ocpus', None),
                                "memory_in_gbs": getattr(instance.shape_config, 'memory_in_gbs', None)
                            }

                        resources["compute_instances"].append({
                            "id": instance.id,
                            "display_name": instance.display_name,
                            "lifecycle_state": instance.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "shape": instance.shape,
                            "shape_config": shape_config_dict,
                            "availability_domain": instance.availability_domain,
                            "time_created": instance.time_created.isoformat() if instance.time_created else None
                        })

                    # Block Volumes
                    volumes = blockstorage_client.list_volumes(compartment_id=compartment_id).data
                    for volume in volumes:
                        resources["block_volumes"].append({
                            "id": volume.id,
                            "display_name": volume.display_name,
                            "lifecycle_state": volume.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "size_in_gbs": volume.size_in_gbs,
                            "availability_domain": volume.availability_domain,
                            "time_created": volume.time_created.isoformat() if volume.time_created else None
                        })

                    # VCNs
                    vcns = virtual_network_client.list_vcns(compartment_id=compartment_id).data
                    for vcn in vcns:
                        resources["vcns"].append({
                            "id": vcn.id,
                            "display_name": vcn.display_name,
                            "lifecycle_state": vcn.lifecycle_state,
                            "compartment_id": compartment_id,
                            "compartment_name": compartment_name,
                            "cidr_block": vcn.cidr_block,
                            "time_created": vcn.time_created.isoformat() if vcn.time_created else None
                        })

                    # Subnets
                    subnets = virtual_network_client.list_subnets(compartment_id=compartment_id).data
                    for subnet in subnets:
                        resources["subnets"].append({
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

                except Exception as e:
                    print(f"Error scanning compartment {compartment_name}: {e}", file=sys.stderr)
                    continue

            # Calculate summary
            total_resources = sum(len(resource_list) for resource_list in resources.values())
            summary_by_service = {}
            for service_type, resource_list in resources.items():
                if resource_list:
                    summary_by_service[service_type] = len(resource_list)

            result = {
                "success": True,
                "resources": resources,
                "summary": {
                    "total_resources": total_resources,
                    "by_service": summary_by_service,
                    "compartments_scanned": len(compartments)
                },
                "metadata": {
                    "scan_time": datetime.now().isoformat(),
                    "region": config["region"],
                    "tenancy_id": config["tenancy"],
                    "provider": "oci"
                }
            }

            print(json.dumps(result, indent=2))
            print(f"Simple discovery completed. Found {total_resources} total resources", file=sys.stderr)

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