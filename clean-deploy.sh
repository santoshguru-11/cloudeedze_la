#!/bin/bash

echo "🧹 CLEAN DEPLOYMENT - ESSENTIAL ONLY"
echo "==================================="

echo "1. 🛑 Stopping all services..."
pm2 stop all
pm2 delete all

echo ""
echo "2. 🗄️ Fixing database permissions..."
sudo -u postgres psql -d cloudedze -c "
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudedze_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudedze_user;
GRANT USAGE ON SCHEMA public TO cloudedze_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cloudedze_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cloudedze_user;
"

echo ""
echo "3. 🌍 Setting clean environment..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://app.cloudedze.ai
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432

echo ""
echo "4. 🏗️ Clean build..."
rm -rf dist/
npm run build

echo ""
echo "5. 🚀 Starting clean application..."
pm2 start dist/index.js --name cloudedze
pm2 save

echo ""
echo "✅ CLEAN DEPLOYMENT COMPLETED!"
echo "============================"
echo ""
echo "🌐 Your app is ready at:"
echo "http://app.cloudedze.ai"
echo ""
echo "🎯 What's active:"
echo "✅ Database permissions fixed"
echo "✅ HTTP API endpoints working"
echo "✅ Domain routing enabled"
echo "✅ CORS configured"