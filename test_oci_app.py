#!/usr/bin/env python3
"""
Test OCI integration with the actual credentials from the database
"""

import json
import sys
import os
import tempfile
from datetime import datetime
import oci
from oci.config import from_file
from oci.signer import Signer

def test_oci_with_app_credentials():
    """Test OCI connection with the same credentials the app uses"""
    
    # These are the actual credentials from your database
    credentials = {
        "tenancyId": "ocid1.tenancy.oc1..aaaaaaaargwveli3zwyyeywzeex6x4zxqodjkbvnde4la7j5cckwioxqfncq",
        "userId": "ocid1.user.oc1..aaaaaaaap2ocafd76ywdb5njriht3w2vn7fg45vc2xqbfqw53zeue2dilt6q",
        "fingerprint": "78:c9:4d:b0:6d:9a:25:5e:6c:0e:e6:94:57:5b:ad:5a",
        "privateKey": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCPswRfuMevZaEs\nZaOOsbIPrMGVV4/NworsLbUDed/SxaG29xd60pKR4lkg3KZnMk4wzMOC6cCElCPQ\nz+SZKpeXknhW9i+iD2ponaiYeIy16NbENGoy0OpSl7PS8pZ95+Uu9rO8sB7XsPTT\nVRhrRY4QarWYsMPSC8BpEgjI1u2K5ZcymnECxg2/yW8C/t1EZIuf8BGv+22drwQr\nrTXAT57AznYxsn9qeF4knI2m5+JwCdrbc+qKX0JyqLrGZsWtbA7cN319Fatw4A0q\nmTuIqF64LtTLeMsmkJbvDFb/aBSvKC9bMUXHt48DF5dvxvYOoZzzpUAN53NegILK\nbbcg4qCrAgMBAAECggEABIVvZ8uajMw3y/vOr5irr46R8K72mVS7pj6x6VAWWL1b\nHzSbCoRBlFF42G3Y1npgt2xZ4m6UXheDIPjJioAqkNxM6P+J9CFkCbKcMV/pnXeb\n+kRj6wFjvgGD6Ok1DvUS4u1kLlWkQskQiu2sfQONOrsAx7MYFi3EegnVOOx6QNp4\nWtyUPaf3WkbT0gt/Djp3vCgHP6tBvz8O9hbQuHRngd70ZY7cWAmmXh02Zg9TbAZS\nywzA4u3GulhOqgqUL9IwVMD4k9ZSWCwU4WK91+b3E/c4L1oXKFv/L4IUdQEVnbkm\nuk+R+ZSGs66GfO64bitUXoYiXFSz7bB9fJOABh1EgQKBgQDEEhQF8u6D8OEWfC0J\n6og8eedIaknVMVqMk54F+BoPMe8Whe3rYlxF2ttHpNBexUAHW0DAmSnvMX9es7xL\nhn/TlR+D7y57n83iPSXjqODAvv1+YTU0rKBxNBeyxxggLkyXcZDcLplP1emudBQp\n6CtI9uaXr7aPOC3YPcFyRsvwiwKBgQC7nwsfjHbSx2+onr3TIwt9wIIIIWD4NJwz\naqXOSi4dzSOfq10MWM8SHB6SU9FPG4ykZq5UcQB6uDfiXIF6mVf522q+HBGfvWb0\n3RwJVKFBvNF5WtXGV8b8U0Gen2oyuh7T0gA4ybknELhxHs6vu7jOay1Kc6lJKQCU\nkQUWOAj0YQKBgF7qmYLfvZNl0rE939fDD7ynDs3Bloh8YedXttIQ7xyYAbQXlbuz\nXBP9BNZD9RNLzdlB1bDm9KP0hEJmJCszq0HUGPOXoBr8m4CANY1mPZdRXgoGKOmc\n//aNT0OemhFKGI3fzk6oyFMbrQpk6zX2TK3/yFV6HJhsi9T44GLf3u5NAoGAdihW\nP/sdBedVuZKnJ2Xlob9v5KDoyceQK41ZeE4dNuVvLuojwlfXqKcO1cZ1heVqsEp+\nNW2pCKAliagKXuRdlFwLoEhbDQeh5Emvk2y51YWNQmjjQnMbPONN6xCoN+Qg7/NL\n8neP5DtSfOMS9Xc6jrzOnBm1Hf71f5rI4lJNyWECgYATXHIejM5zMntn71S4kjLi\n+x2qMzA8XK5oTtUPLaQY2fc7n7YOyAMbSghgsjHDcEHCfW6Qu3vw2eI99Sci8lDx\nxDf/FJrWd2gZ8qlBohQTRNCDt9LbLMSxuW8Pg8Ul4emkQO2e9Zl26GFYxL2gXDEG\nLU6D73T2G43SMwPDpp5kSA==\n-----END PRIVATE KEY-----",
        "region": "us-phoenix-1"
    }
    
    print("🧪 Testing OCI with application credentials...")
    print(f"Tenancy: {credentials['tenancyId'][:20]}...")
    print(f"User: {credentials['userId'][:20]}...")
    print(f"Region: {credentials['region']}")
    
    try:
        # Create temporary file for private key
        with tempfile.NamedTemporaryFile(mode='w', suffix='.pem', delete=False) as key_file:
            key_file.write(credentials["privateKey"])
            key_file_path = key_file.name
        
        try:
            # Create OCI config
            config = {
                "user": credentials["userId"],
                "key_file": key_file_path,
                "fingerprint": credentials["fingerprint"],
                "tenancy": credentials["tenancyId"],
                "region": credentials["region"]
            }
            
            # Create signer
            signer = Signer(
                tenancy=config["tenancy"],
                user=config["user"],
                fingerprint=config["fingerprint"],
                private_key_file_location=config["key_file"]
            )
            
            # Test connection with Identity client
            identity_client = oci.identity.IdentityClient(config, signer=signer)
            
            # Try to get tenancy info
            tenancy = identity_client.get_tenancy(config["tenancy"]).data
            print(f"✅ Successfully connected to OCI!")
            print(f"Tenancy Name: {tenancy.name}")
            print(f"Tenancy Description: {tenancy.description}")
            
            # Try to list compartments
            compartments = identity_client.list_compartments(
                compartment_id=config["tenancy"],
                compartment_id_in_subtree=True,
                access_level="ACCESSIBLE"
            ).data
            
            print(f"✅ Found {len(compartments)} accessible compartments")
            
            # Try to discover some resources
            compute_client = oci.core.ComputeClient(config, signer=signer)
            
            total_instances = 0
            for compartment in compartments[:3]:  # Limit to first 3 compartments
                try:
                    instances = compute_client.list_instances(compartment_id=compartment.id)
                    compartment_instances = len(instances.data)
                    total_instances += compartment_instances
                    print(f"  Compartment '{compartment.name}': {compartment_instances} instances")
                except Exception as e:
                    print(f"  Compartment '{compartment.name}': Error - {e}")
            
            print(f"✅ Total compute instances found: {total_instances}")
            
            result = {
                "success": True,
                "tenancy_name": tenancy.name,
                "compartment_count": len(compartments),
                "total_instances": total_instances,
                "message": "OCI connection successful - Ready for UI!"
            }
            
        finally:
            # Clean up temporary key file
            os.unlink(key_file_path)
            
    except Exception as e:
        print(f"❌ OCI connection failed: {e}")
        result = {
            "success": False,
            "error": str(e),
            "message": "OCI connection failed"
        }
    
    print(f"\nResult: {json.dumps(result, indent=2)}")
    return result

if __name__ == "__main__":
    test_oci_with_app_credentials()
