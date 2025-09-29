#!/bin/bash
echo "Deploying Cloudedze application..."

# Create app directory
mkdir -p ~/cloudedze-app
cd ~/cloudedze-app

# Note: Upload your dist/ folder, package.json, package-lock.json, .env.production, and oci-env/ here first

# Install dependencies
echo "Installing application dependencies..."
npm install --production

# Setup environment
echo "Setting up environment..."
cp .env.production .env

# Update database URL in .env file
sed -i 's|DATABASE_URL=.*|DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze|' .env

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Setup OCI Python environment (if exists)
if [ -d "oci-env" ]; then
    echo "Setting up OCI environment..."
    cd oci-env
    python3 -m venv .
    source bin/activate
    pip install oci
    cd ..
fi

# Start application
echo "Starting application with PM2..."
pm2 delete cloudedze || true
pm2 start dist/index.js --name cloudedze --node-args="--env-file=.env"

# Save PM2 configuration
pm2 save
pm2 startup

# Configure firewall
echo "Configuring firewall..."
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Show status
echo "✅ Deployment completed!"
echo "========================"
pm2 status
echo ""
echo "Application URL: http://34.14.198.14:3000"
echo "To check logs: pm2 logs cloudedze"
echo "To restart: pm2 restart cloudedze"