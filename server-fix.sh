#!/bin/bash

# Cloudedze Server Fix - SESSION_SECRET and production deployment
echo "🔧 CLOUDEDZE SERVER FIX"
echo "======================"

echo "1. 🛑 Stopping current application..."
pm2 stop all
pm2 delete all

echo "2. 🔍 Checking current location and pulling latest changes..."
cd ~/cloudeedze_la
git pull origin main

echo "3. 🧹 Cleaning and rebuilding..."
rm -rf dist/
npm run build

echo "4. 📝 Creating production environment file with proper secrets..."
cat > .env.production << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Update with your server's public IP or domain
VITE_API_BASE_URL=http://34.14.198.14:3000

# Database - Update with your production database
DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze

# Security - Generate new secrets for production
SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
JWT_SECRET=cloudedze-production-jwt-secret-def5432

# CORS
CORS_ORIGINS=http://34.14.198.14:3000,http://localhost:3000
CORS_CREDENTIALS=true

# Production settings
TRUST_PROXY=true
COMPRESSION_ENABLED=true
LOG_LEVEL=info

# File uploads
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Feature flags
FEATURE_OCI_INTEGRATION=true
FEATURE_AWS_INTEGRATION=true
FEATURE_AZURE_INTEGRATION=true
FEATURE_GCP_INTEGRATION=true
FEATURE_COST_ANALYSIS=true
EOF

echo "5. 🚀 Starting application with production environment..."
# Load environment variables properly
set -a
source .env.production
set +a
pm2 start dist/index.js --name cloudedze

echo "6. 💾 Saving PM2 configuration..."
pm2 save

echo "7. 📊 Checking status..."
pm2 status

echo "8. 🌐 Testing connectivity..."
sleep 5
echo "Testing localhost..."
curl -I http://localhost:3000 2>/dev/null || echo "Local test failed"

echo "Testing external IP..."
curl -I http://34.14.198.14:3000 2>/dev/null || echo "External test failed"

echo "9. 📝 Checking for any errors..."
curl http://34.14.198.14:3000 2>/dev/null || echo "Error getting response"

echo ""
echo "✅ SERVER FIX COMPLETED!"
echo "======================"
echo "🌐 Try: http://34.14.198.14:3000"
echo "📊 Status: pm2 status"
echo "📝 Logs: pm2 logs cloudedze"
echo ""
echo "If still getting errors, check:"
echo "- pm2 logs cloudedze --lines 20"
echo "- Database connection: psql -h localhost -U cloudedze_user -d cloudedze"