#!/bin/bash

# GitHub-based deployment for Oracle Linux
echo "🚀 Cloudedze GitHub Deployment"
echo "=============================="

# Set variables
REPO_URL="https://github.com/santoshguru-11/cloudeedze_la.git"
APP_DIR="$HOME/cloudedze"

echo "Installing system dependencies..."

# Install Node.js
sudo dnf module install -y nodejs:20/common || {
    echo "Installing Node.js from NodeSource..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
}

# Install Git (if not already installed)
sudo dnf install -y git

# Install PM2
sudo npm install -g pm2

# Install PostgreSQL
sudo dnf install -y postgresql postgresql-server python3 python3-pip

# Initialize PostgreSQL
sudo postgresql-setup --initdb || echo "PostgreSQL already initialized"
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "Setting up database..."

# Create database user and database
sudo -u postgres psql << 'EOF' || echo "Database setup may already exist"
CREATE USER cloudedze_user WITH PASSWORD 'cloudedze_password';
CREATE DATABASE cloudedze OWNER cloudedze_user;
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloudedze_user;
\q
EOF

echo "Cloning/updating repository..."

# Clone or update repository
if [ -d "$APP_DIR" ]; then
    echo "Repository exists, pulling latest changes..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

echo "Building application..."

# Install dependencies and build
npm ci
npm run build

echo "Setting up environment..."

# Setup environment file
if [ ! -f .env ]; then
    cp .env.production .env
    # Update database URL
    sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze|' .env
fi

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Setup OCI Python environment (if exists)
if [ -d "oci-env" ]; then
    echo "Setting up OCI Python environment..."
    cd oci-env
    python3 -m venv .
    source bin/activate
    pip install oci
    cd ..
fi

echo "Starting application..."

# Stop existing PM2 process
pm2 delete cloudedze || true

# Start application
pm2 start dist/index.js --name cloudedze --node-args="--env-file=.env"

# Save PM2 configuration
pm2 save
pm2 startup

echo "Configuring firewall..."

# Configure firewall
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

echo "✅ Deployment completed!"
echo "======================="
pm2 status
echo ""
echo "🌐 Application URL: http://34.14.198.14:3000"
echo "📊 PM2 Status: pm2 status"
echo "📝 View Logs: pm2 logs cloudedze"
echo "🔄 Restart App: pm2 restart cloudedze"
echo ""
echo "🔧 To update in future:"
echo "   cd $APP_DIR"
echo "   git pull origin main"
echo "   npm run build"
echo "   pm2 restart cloudedze"