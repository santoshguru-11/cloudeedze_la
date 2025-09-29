#!/bin/bash

# Cloudedze Deployment Script
# Usage: ./deploy.sh [server-ip] [username]

set -e

SERVER_IP=${1:-"34.14.198.14"}
USERNAME=${2:-"santosh"}
APP_NAME="cloudedze"
DEPLOY_PATH="/home/$USERNAME/$APP_NAME"

echo "🚀 Starting deployment to $USERNAME@$SERVER_IP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if build exists
if [ ! -d "dist" ]; then
    print_status "Building application..."
    npm run build
fi

# Create deployment archive
print_status "Creating deployment archive..."
tar -czf cloudedze-deploy.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    .env.production \
    oci-env/ \
    server/config/ \
    --exclude=node_modules \
    --exclude=.git

# Upload to server
print_status "Uploading files to server..."
scp cloudedze-deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/

# Deploy on server
print_status "Deploying on server..."
ssh $USERNAME@$SERVER_IP << 'EOF'
    set -e

    APP_NAME="cloudedze"
    DEPLOY_PATH="/home/$USER/$APP_NAME"

    # Create deployment directory
    mkdir -p $DEPLOY_PATH
    cd $DEPLOY_PATH

    # Backup current deployment (if exists)
    if [ -d "current" ]; then
        echo "Backing up current deployment..."
        mv current backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    fi

    # Extract new deployment
    mkdir -p current
    cd current
    tar -xzf /tmp/cloudedze-deploy.tar.gz

    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        echo "Installing PM2..."
        sudo npm install -g pm2
    fi

    # Install dependencies
    echo "Installing dependencies..."
    npm ci --only=production

    # Set up environment
    if [ ! -f .env ]; then
        if [ -f .env.production ]; then
            cp .env.production .env
            echo "Copied production environment file"
        else
            echo "Warning: No environment file found"
        fi
    fi

    # Set up Python virtual environment for OCI
    if [ -d "oci-env" ]; then
        echo "Setting up Python virtual environment..."
        cd oci-env
        python3 -m venv . 2>/dev/null || true
        source bin/activate
        pip install oci 2>/dev/null || true
        cd ..
    fi

    # Create uploads directory
    mkdir -p uploads
    chmod 755 uploads

    # Set permissions
    chmod +x dist/index.js

    echo "Deployment files ready!"
EOF

print_status "Starting application with PM2..."
ssh $USERNAME@$SERVER_IP << 'EOF'
    cd /home/$USER/cloudedze/current

    # Stop existing PM2 process if running
    pm2 delete cloudedze 2>/dev/null || true

    # Start application with PM2
    pm2 start dist/index.js --name cloudedze --node-args="--env-file=.env"

    # Save PM2 configuration
    pm2 save
    pm2 startup || true

    echo "Application started with PM2!"
    pm2 status
EOF

# Clean up local files
rm -f cloudedze-deploy.tar.gz

print_status "✅ Deployment completed successfully!"
print_status "🌐 Application should be running on http://$SERVER_IP:3000"
print_status "📊 Check status with: ssh $USERNAME@$SERVER_IP 'pm2 status'"
print_status "📝 Check logs with: ssh $USERNAME@$SERVER_IP 'pm2 logs cloudedze'"

echo ""
echo "Next steps:"
echo "1. Update your domain DNS to point to $SERVER_IP"
echo "2. Set up SSL certificate (Let's Encrypt recommended)"
echo "3. Configure nginx reverse proxy (optional)"
echo "4. Update environment variables in .env file on server"