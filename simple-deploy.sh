#!/bin/bash

# Simple deployment script - manual steps guide
SERVER_IP="34.14.198.14"
USERNAME="santosh"
PASSWORD="Padmaravi@123"

echo "🚀 Cloudedze Deployment - Simple Method"
echo "========================================"
echo ""

# Build and package
echo "Step 1: Building and packaging..."
npm run build
tar --exclude='node_modules' -czf cloudedze-deploy.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    .env.production \
    oci-env/ \
    2>/dev/null || true

echo "✅ Package created: cloudedze-deploy.tar.gz"
echo ""

# Upload file
echo "Step 2: Uploading to server..."
echo "Running: scp cloudedze-deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/"
echo "Password: $PASSWORD"
echo ""

scp cloudedze-deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/ && echo "✅ Upload successful!" || echo "❌ Upload failed"

echo ""
echo "Step 3: Now connect to your server and run the deployment:"
echo "========================================================"
echo ""
echo "1. SSH into your server:"
echo "   ssh $USERNAME@$SERVER_IP"
echo "   Password: $PASSWORD"
echo ""
echo "2. Copy and paste the following commands one by one:"
echo ""

cat << 'DEPLOYMENT_COMMANDS'
# Create directory and extract
mkdir -p ~/cloudedze && cd ~/cloudedze
if [ -d "current" ]; then mv current backup-$(date +%Y%m%d-%H%M%S); fi
mkdir -p current && cd current
tar -xzf /tmp/cloudedze-deploy.tar.gz

# Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib python3 python3-venv
sudo npm install -g pm2

# Install app dependencies
npm ci --only=production

# Setup environment
cp .env.production .env
mkdir -p uploads && chmod 755 uploads

# Setup OCI environment
if [ -d "oci-env" ]; then
    cd oci-env && python3 -m venv . && source bin/activate && pip install oci
    cd ..
fi

# Setup database
sudo -u postgres psql -c "CREATE USER cloud_cost_user WITH PASSWORD '1101';" || echo "User exists"
sudo -u postgres psql -c "CREATE DATABASE cloudedze OWNER cloud_cost_user;" || echo "DB exists"

# Start application
pm2 delete cloudedze || true
pm2 start dist/index.js --name cloudedze --node-args="--env-file=.env"
pm2 save && pm2 startup

# Configure firewall
sudo ufw --force enable
sudo ufw allow ssh && sudo ufw allow 3000 && sudo ufw allow 443

# Check status
pm2 status
DEPLOYMENT_COMMANDS

echo ""
echo "3. After running all commands, your app will be available at:"
echo "   http://$SERVER_IP:3000"
echo ""
echo "4. To check status later:"
echo "   ssh $USERNAME@$SERVER_IP 'pm2 status'"
echo ""
echo "5. To view logs:"
echo "   ssh $USERNAME@$SERVER_IP 'pm2 logs cloudedze'"

# Clean up
rm -f cloudedze-deploy.tar.gz