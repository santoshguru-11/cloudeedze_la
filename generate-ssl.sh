#!/bin/bash

# Generate SSL certificates for development
echo "🔐 Generating SSL certificates for Cloudedze..."

# Create ssl directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/server.key 2048

# Generate certificate signing request
openssl req -new -key ssl/server.key -out ssl/server.csr -subj "/C=US/ST=State/L=City/O=Cloudedze/OU=IT/CN=34.14.198.14"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/server.csr -signkey ssl/server.key -out ssl/server.crt

# Set proper permissions
chmod 600 ssl/server.key
chmod 644 ssl/server.crt

# Clean up CSR file
rm ssl/server.csr

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate location: ssl/server.crt"
echo "🔑 Private key location: ssl/server.key"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "   Your browser will show a security warning - this is normal for development."
