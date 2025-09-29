#!/bin/bash

# Deploy frontend fix to server
# This script uploads the updated frontend files to fix the API connection issue

echo "🚀 Deploying frontend fix to server 34.14.198.14..."

# Create a temporary directory with the built files
TEMP_DIR="/tmp/cloudedze-frontend-fix"
mkdir -p "$TEMP_DIR"

# Copy the built frontend files
echo "📦 Copying built frontend files..."
cp -r dist/public/* "$TEMP_DIR/"

# Create a tar archive
echo "📦 Creating deployment archive..."
cd "$TEMP_DIR"
tar -czf cloudedze-frontend-fix.tar.gz *

# Upload to server
echo "📤 Uploading to server..."
scp cloudedze-frontend-fix.tar.gz santosh@34.14.198.14:/tmp/

# Deploy on server
echo "🔧 Deploying on server..."
ssh santosh@34.14.198.14 << 'EOF'
    cd /tmp
    tar -xzf cloudedze-frontend-fix.tar.gz
    
    # Backup current frontend
    if [ -d "/var/www/cloudedze/public" ]; then
        sudo cp -r /var/www/cloudedze/public /var/www/cloudedze/public.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    # Deploy new frontend
    sudo mkdir -p /var/www/cloudedze/public
    sudo cp -r * /var/www/cloudedze/public/
    sudo chown -R www-data:www-data /var/www/cloudedze/public
    sudo chmod -R 755 /var/www/cloudedze/public
    
    # Restart nginx
    sudo systemctl reload nginx
    
    echo "✅ Frontend deployment completed!"
    echo "🌐 Your app should now connect to the correct API server."
EOF

# Cleanup
echo "🧹 Cleaning up..."
rm -rf "$TEMP_DIR"

echo "✅ Deployment completed!"
echo "🌐 Please refresh your browser and try the inventory scan again."
