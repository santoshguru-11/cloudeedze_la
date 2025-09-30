#!/bin/bash

# Manual Environment Fix - Simple and direct
echo "🔧 MANUAL ENVIRONMENT FIX"
echo "========================="

echo "1. 🛑 Stopping PM2..."
pm2 stop all
pm2 delete all

echo "2. 🔑 Setting environment variables manually..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_ORIGINS=http://34.14.198.14:3000,http://localhost:3000
export CORS_CREDENTIALS=true

echo "3. 🚀 Starting server with environment..."
pm2 start dist/index.js --name cloudedze

echo "4. 💾 Saving PM2 config..."
pm2 save

echo "5. 📊 Checking status..."
pm2 status

echo "6. 🌐 Testing..."
sleep 3
echo "Testing localhost..."
curl -I http://localhost:3000 2>/dev/null || echo "Local test failed"

echo "Testing external IP..."
curl -I http://34.14.198.14:3000 2>/dev/null || echo "External test failed"

echo ""
echo "✅ MANUAL FIX COMPLETED!"
echo "Check: curl http://34.14.198.14:3000"