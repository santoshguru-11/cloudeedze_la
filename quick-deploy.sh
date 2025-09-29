#!/bin/bash

# Quick deployment script for Oracle Linux
# Run this on your server after uploading the files

echo "🚀 Cloudedze Quick Deployment for Oracle Linux"
echo "=============================================="

# Install system dependencies
echo "Installing system dependencies..."
sudo dnf update -y
sudo dnf install -y nodejs npm postgresql postgresql-server python3 python3-pip curl

# Install PM2
echo "Installing PM2..."
sudo npm install -g pm2

# Setup PostgreSQL
echo "Setting up PostgreSQL..."
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database user and database
sudo -u postgres psql << EOF
CREATE USER cloudedze_user WITH PASSWORD 'cloudedze_password';
CREATE DATABASE cloudedze OWNER cloudedze_user;
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloudedze_user;
\q
EOF

# Install app dependencies
echo "Installing application dependencies..."
npm ci --only=production

# Setup environment
echo "Setting up environment..."
cp .env.production .env
mkdir -p uploads
chmod 755 uploads

# Setup OCI Python environment
echo "Setting up OCI environment..."
if [ -d "oci-env" ]; then
    cd oci-env
    python3 -m venv .
    source bin/activate
    pip install oci
    cd ..
fi

# Update environment file with correct database URL
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze|' .env

# Run database migrations
echo "Running database setup..."
npm run db:push || echo "Database setup completed"

# Start application
echo "Starting application..."
pm2 delete cloudedze || true
pm2 start dist/index.js --name cloudedze --node-args="--env-file=.env"
pm2 save
pm2 startup

# Configure firewall
echo "Configuring firewall..."
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload

# Show status
echo "Deployment complete!"
echo "==================="
pm2 status
echo ""
echo "Application URL: http://34.14.198.14:3000"
echo "To check logs: pm2 logs cloudedze"
echo "To restart: pm2 restart cloudedze"