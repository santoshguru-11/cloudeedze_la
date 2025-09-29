@123ad #!/bin/bash

# Cloudedze Linux Deployment Script (RHEL/CentOS/Rocky Linux)
# This script deploys the Cloudedze application to a Linux server

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables (modify these for your server)
SERVER_USER="santosh"  # Change to your server username
SERVER_HOST="your-server-ip"  # Change to your server IP or domain
SERVER_PATH="/opt/cloudedze"  # Change to your desired deployment path
APP_PORT="3000"  # Change if you want a different port
DOMAIN="your-domain.com"  # Change to your domain (optional)

echo -e "${BLUE}🚀 Cloudedze Linux Deployment Script (RHEL/CentOS)${NC}"
echo "================================================"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required parameters are provided
if [ "$1" = "" ] || [ "$2" = "" ]; then
    print_error "Usage: $0 <server-ip> <server-username> [deployment-path]"
    print_info "Example: $0 34.14.198.14 santosh /opt/cloudedze"
    exit 1
fi

SERVER_HOST=$1
SERVER_USER=$2
SERVER_PATH=${3:-"/opt/cloudedze"}

print_info "Deploying Cloudedze to: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"

# Step 1: Prepare local repository
print_info "Step 1: Preparing local repository..."
if [ ! -d ".git" ]; then
    print_error "Not in a git repository. Please run this from the Cloudedze directory."
    exit 1
fi

# Ensure we're on the main branch
git checkout main
print_status "Switched to main branch"

# Step 2: Create deployment package
print_info "Step 2: Creating deployment package..."
TEMP_DIR=$(mktemp -d)
PACKAGE_NAME="cloudedze-$(date +%Y%m%d-%H%M%S).tar.gz"

# Create package excluding unnecessary files
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.venv' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env' \
    --exclude='.DS_Store' \
    --exclude='*.tar.gz' \
    -czf "$TEMP_DIR/$PACKAGE_NAME" .

print_status "Created deployment package: $PACKAGE_NAME"

# Step 3: Upload to server
print_info "Step 3: Uploading to server..."
scp "$TEMP_DIR/$PACKAGE_NAME" "$SERVER_USER@$SERVER_HOST:/tmp/"

print_status "Package uploaded to server"

# Step 4: Deploy on server
print_info "Step 4: Deploying on server..."
ssh "$SERVER_USER@$SERVER_HOST" << EOF
set -e

# Colors for server output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "\${GREEN}✅ \$1\${NC}"
}

print_warning() {
    echo -e "\${YELLOW}⚠️  \$1\${NC}"
}

print_error() {
    echo -e "\${RED}❌ \$1\${NC}"
}

print_info() {
    echo -e "\${BLUE}ℹ️  \$1\${NC}"
}

print_info "Starting Cloudedze deployment on server..."

# Update system packages
print_info "Updating system packages..."
sudo yum update -y

# Install required system packages
print_info "Installing system dependencies..."
sudo yum install -y curl wget git nginx postgresql-server postgresql-contrib python3 python3-pip nodejs npm gcc gcc-c++ make

# Install Node.js 18+ if not available
if ! command -v node &> /dev/null || [ \$(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]; then
    print_info "Installing Node.js 18+..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Install PM2 for process management
print_info "Installing PM2 process manager..."
sudo npm install -g pm2

# Create application directory
print_info "Setting up application directory..."
sudo mkdir -p $SERVER_PATH
sudo chown $SERVER_USER:$SERVER_USER $SERVER_PATH

# Extract application
print_info "Extracting Cloudedze application..."
cd $SERVER_PATH
tar -xzf "/tmp/$PACKAGE_NAME"
rm "/tmp/$PACKAGE_NAME"

# Install Node.js dependencies
print_info "Installing Node.js dependencies..."
npm install

# Set up Python virtual environment
print_info "Setting up Python environment..."
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install oci oci-cli

# Initialize and start PostgreSQL
print_info "Setting up PostgreSQL database..."
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Set up PostgreSQL database
print_info "Creating database and user..."
sudo -u postgres psql << 'EOSQL'
CREATE DATABASE cloudedze;
CREATE USER cloud_cost_user WITH PASSWORD '1101';
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloud_cost_user;
\q
EOSQL

# Run database setup
print_info "Setting up database schema..."
PGPASSWORD=1101 psql -h localhost -U cloud_cost_user -d cloudedze -f database_setup.sql

# Add missing database columns
print_info "Adding missing database columns..."
PGPASSWORD=1101 psql -h localhost -U cloud_cost_user -d cloudedze << 'EOSQL'
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE cloud_credentials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
EOSQL

# Create environment file
print_info "Creating environment configuration..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://cloud_cost_user:1101@localhost/cloudedze
SESSION_SECRET=78a4cade3d08addfbe8e3d45962565e9c1f13e85375b3d1e6061e241d0bcf85b
ENCRYPTION_KEY=fc2bfe87fbe8dc678a870adc0fd22fef
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,https://app.cloudedze.ai
EOF

# Build the application
print_info "Building Cloudedze application..."
npm run build

# Create PM2 ecosystem file
print_info "Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cloudedze',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
print_info "Starting Cloudedze application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
print_info "Configuring Nginx..."
sudo tee /etc/nginx/conf.d/cloudedze.conf << EOF
server {
    listen 80;
    server_name $DOMAIN _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Start and enable Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall
print_info "Configuring firewall..."
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload

print_status "Cloudedze deployment completed successfully!"
print_info "Application is running on: http://$SERVER_HOST"
print_info "Check status with: pm2 status"
print_info "View logs with: pm2 logs cloudedze"
EOF

# Clean up
rm -rf "$TEMP_DIR"

print_status "Deployment completed!"
print_info "Your Cloudedze application is now running on: http://$SERVER_HOST"
print_info "To check the status, SSH into your server and run: pm2 status"
print_info "To view logs, run: pm2 logs cloudedze"
