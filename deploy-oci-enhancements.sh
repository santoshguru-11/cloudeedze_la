#!/bin/bash

# OCI Inventory Enhancement Deployment Script
# This script updates the server with enhanced OCI resource discovery

set -e

echo "🚀 Deploying OCI Inventory Enhancements..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Server details (update these for your server)
SERVER_HOST=34.14.198.14
SERVER_USER="santosh"
SERVER_PATH="/home/santosh/cloudedze"

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "Path: $SERVER_PATH"
echo ""

# Function to deploy file
deploy_file() {
    local local_file="$1"
    local remote_file="$2"
    local description="$3"
    
    echo -e "${YELLOW}📤 Deploying $description...${NC}"
    
    if [ ! -f "$local_file" ]; then
        echo -e "${RED}❌ Error: Local file $local_file not found${NC}"
        return 1
    fi
    
    # Copy file to server
    scp "$local_file" "$SERVER_USER@$SERVER_HOST:$remote_file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $description deployed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to deploy $description${NC}"
        return 1
    fi
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}🔄 Restarting services...${NC}"
    
    ssh "$SERVER_USER@$SERVER_HOST" << EOF
        cd $SERVER_PATH
        
        # Stop the application
        echo "Stopping application..."
        pm2 stop cloudedze || echo "PM2 not running"
        
        # Install dependencies if needed
        echo "Installing dependencies..."
        npm install
        
        # Build the application
        echo "Building application..."
        npm run build
        
        # Start the application
        echo "Starting application..."
        pm2 start ecosystem.config.js --name cloudedze
        
        # Save PM2 configuration
        pm2 save
        
        echo "Services restarted successfully"
EOF
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Services restarted successfully${NC}"
    else
        echo -e "${RED}❌ Failed to restart services${NC}"
        return 1
    fi
}

# Main deployment
echo -e "${YELLOW}🔧 Starting deployment...${NC}"

# Deploy Python script
deploy_file "server/services/python-scripts/oci-inventory.py" "$SERVER_PATH/server/services/python-scripts/oci-inventory.py" "Enhanced OCI Python Script"

# Deploy TypeScript service
deploy_file "server/services/oci-inventory.ts" "$SERVER_PATH/server/services/oci-inventory.ts" "Enhanced OCI TypeScript Service"

# Set proper permissions
echo -e "${YELLOW}🔐 Setting permissions...${NC}"
ssh "$SERVER_USER@$SERVER_HOST" << EOF
    cd $SERVER_PATH
    
    # Make Python script executable
    chmod +x server/services/python-scripts/oci-inventory.py
    
    # Set proper ownership
    chown -R $SERVER_USER:$SERVER_USER server/services/
    
    echo "Permissions set successfully"
EOF

# Restart services
restart_services

echo ""
echo -e "${GREEN}🎉 OCI Inventory Enhancement Deployment Complete!${NC}"
echo ""
echo -e "${YELLOW}📊 What's New:${NC}"
echo "• Enhanced resource discovery for 15+ OCI service types"
echo "• Network resources (VCNs, Subnets, Gateways, Security Groups)"
echo "• Compute resources (Images, Volume Groups, Boot Volumes)"
echo "• Database resources (DB Systems, Autonomous Databases)"
echo "• Serverless services (Functions, Container Instances)"
echo "• Data services (Streaming, Notifications)"
echo "• Monitoring & Management (Alarms, Budgets)"
echo "• Identity services (Users, Groups, Dynamic Groups)"
echo ""
echo -e "${YELLOW}🧪 Test the deployment:${NC}"
echo "1. Run an inventory scan through your application"
echo "2. Check the logs for detailed resource discovery"
echo "3. Verify you're getting more than 2 resources now"
echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
