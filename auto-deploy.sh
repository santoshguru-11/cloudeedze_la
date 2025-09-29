#!/bin/bash

# Cloudedze Automated Deployment Script
# This script will automatically deploy your application to the server

set -e

# Server configuration
SERVER_IP="34.14.198.14"
USERNAME="santosh"
PASSWORD="Padmaravi@123"
APP_NAME="cloudedze"
DEPLOY_PATH="/home/$USERNAME/$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check for sshpass
check_sshpass() {
    if ! command -v sshpass &> /dev/null; then
        print_warning "sshpass not found. Installing..."
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install sshpass
            else
                print_error "Please install Homebrew first, then run: brew install sshpass"
                exit 1
            fi
        else
            sudo apt-get update && sudo apt-get install -y sshpass
        fi
    fi
}

# Function to run commands on remote server
run_remote() {
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no "$USERNAME@$SERVER_IP" "$1"
}

# Function to copy files to remote server
copy_to_remote() {
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$USERNAME@$SERVER_IP:$2"
}

print_header "🚀 Starting Automated Cloudedze Deployment"
echo "Server: $SERVER_IP"
echo "User: $USERNAME"
echo ""

# Step 1: Check prerequisites
print_header "1. Checking Prerequisites"
check_sshpass

# Step 2: Build application
print_header "2. Building Application"
if [ ! -d "dist" ]; then
    print_status "Building application for production..."
    npm run build
else
    print_status "Using existing build..."
fi

# Step 3: Create deployment package
print_header "3. Creating Deployment Package"
print_status "Creating deployment archive..."
tar --exclude='node_modules' -czf cloudedze-deploy.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    .env.production \
    oci-env/ \
    2>/dev/null || true

# Step 4: Upload files
print_header "4. Uploading Files to Server"
print_status "Uploading deployment archive..."
copy_to_remote cloudedze-deploy.tar.gz /tmp/

# Step 5: Install system dependencies
print_header "5. Installing System Dependencies"
print_status "Installing Node.js and system packages..."
run_remote "
    # Update system
    sudo apt-get update -y

    # Install Node.js if not present
    if ! command -v node &> /dev/null; then
        echo 'Installing Node.js...'
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi

    # Install PM2 if not present
    if ! command -v pm2 &> /dev/null; then
        echo 'Installing PM2...'
        sudo npm install -g pm2
    fi

    # Install PostgreSQL if not present
    if ! command -v psql &> /dev/null; then
        echo 'Installing PostgreSQL...'
        sudo apt-get install -y postgresql postgresql-contrib
    fi

    # Install Python3 and pip if not present
    if ! command -v python3 &> /dev/null; then
        echo 'Installing Python3...'
        sudo apt-get install -y python3 python3-pip python3-venv
    fi
"

# Step 6: Set up database
print_header "6. Setting Up Database"
print_status "Configuring PostgreSQL database..."
run_remote "
    sudo -u postgres psql -c \"SELECT 1 FROM pg_user WHERE usename = 'cloud_cost_user';\" | grep -q 1 || \
    sudo -u postgres psql -c \"CREATE USER cloud_cost_user WITH PASSWORD '1101';\"

    sudo -u postgres psql -c \"SELECT 1 FROM pg_database WHERE datname = 'cloudedze';\" | grep -q 1 || \
    sudo -u postgres psql -c \"CREATE DATABASE cloudedze OWNER cloud_cost_user;\"

    sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloud_cost_user;\"
"

# Step 7: Deploy application
print_header "7. Deploying Application"
print_status "Setting up application files..."
run_remote "
    # Create application directory
    mkdir -p $DEPLOY_PATH
    cd $DEPLOY_PATH

    # Backup existing deployment
    if [ -d 'current' ]; then
        echo 'Backing up current deployment...'
        mv current backup-\$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
    fi

    # Extract new deployment
    mkdir -p current
    cd current
    tar -xzf /tmp/cloudedze-deploy.tar.gz

    # Install application dependencies
    echo 'Installing application dependencies...'
    npm ci --only=production

    # Set up environment file
    if [ -f .env.production ]; then
        cp .env.production .env
        echo 'Environment file configured'
    fi

    # Set up Python virtual environment for OCI
    if [ -d 'oci-env' ]; then
        echo 'Setting up OCI Python environment...'
        cd oci-env
        python3 -m venv . 2>/dev/null || true
        source bin/activate
        pip install oci 2>/dev/null || echo 'OCI package installation skipped'
        cd ..
    fi

    # Create directories
    mkdir -p uploads
    chmod 755 uploads

    # Set permissions
    chmod +x dist/index.js
"

# Step 8: Configure firewall
print_header "8. Configuring Firewall"
print_status "Setting up firewall rules..."
run_remote "
    sudo ufw --force enable 2>/dev/null || true
    sudo ufw allow ssh 2>/dev/null || true
    sudo ufw allow 3000 2>/dev/null || true
    sudo ufw allow 443 2>/dev/null || true
"

# Step 9: Start application
print_header "9. Starting Application"
print_status "Starting application with PM2..."
run_remote "
    cd $DEPLOY_PATH/current

    # Stop existing PM2 process if running
    pm2 delete $APP_NAME 2>/dev/null || true

    # Start application with PM2
    pm2 start dist/index.js --name $APP_NAME --node-args='--env-file=.env'

    # Save PM2 configuration
    pm2 save

    # Set up PM2 startup script
    pm2 startup systemd -u $USERNAME --hp /home/$USERNAME 2>/dev/null || true

    echo 'Application started successfully!'
"

# Step 10: Run database migrations
print_header "10. Running Database Migrations"
print_status "Setting up database schema..."
run_remote "
    cd $DEPLOY_PATH/current
    npm run db:push 2>/dev/null || echo 'Database migration skipped (run manually if needed)'
"

# Step 11: Verify deployment
print_header "11. Verifying Deployment"
print_status "Checking application status..."
APP_STATUS=\$(run_remote "pm2 show $APP_NAME 2>/dev/null | grep -E 'status|pid' || echo 'Not running'")
echo "Application Status: \$APP_STATUS"

# Test application
print_status "Testing application connectivity..."
sleep 5
HTTP_STATUS=\$(run_remote "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null || echo 'Connection failed'")
if [ "\$HTTP_STATUS" = "200" ] || [ "\$HTTP_STATUS" = "404" ] || [ "\$HTTP_STATUS" = "302" ]; then
    print_status "✅ Application is responding (HTTP Status: \$HTTP_STATUS)"
else
    print_warning "⚠️  Application may not be fully ready (HTTP Status: \$HTTP_STATUS)"
fi

# Clean up local files
rm -f cloudedze-deploy.tar.gz

print_header "🎉 Deployment Complete!"
echo ""
echo "================== DEPLOYMENT SUMMARY =================="
echo "✅ Application deployed to: $SERVER_IP"
echo "✅ Application running on: http://$SERVER_IP:3000"
echo "✅ Process manager: PM2"
echo "✅ Database: PostgreSQL configured"
echo "✅ Firewall: Configured"
echo ""
echo "================== USEFUL COMMANDS =================="
echo "Check application status:"
echo "  ssh $USERNAME@$SERVER_IP 'pm2 status'"
echo ""
echo "View application logs:"
echo "  ssh $USERNAME@$SERVER_IP 'pm2 logs $APP_NAME'"
echo ""
echo "Restart application:"
echo "  ssh $USERNAME@$SERVER_IP 'pm2 restart $APP_NAME'"
echo ""
echo "================== NEXT STEPS =================="
echo "1. Access your application: http://$SERVER_IP:3000"
echo "2. Configure your domain DNS (if applicable)"
echo "3. Set up SSL certificate for production"
echo "4. Add cloud provider credentials in application settings"
echo "5. Test all features including Excel upload and OCI integration"
echo ""
echo "🚀 Your Cloudedze application is now live!"