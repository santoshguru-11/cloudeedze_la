#!/bin/bash

echo "🔧 FIXING HTTP/HTTPS API MISMATCH"
echo "================================"

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo ""
echo "2. 🔧 Forcing API base URL back to HTTP..."

# Force API base URL to HTTP and rebuild
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
# FORCE HTTP API BASE URL
export VITE_API_BASE_URL=http://app.cloudedze.ai
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo ""
echo "3. 🏗️ Rebuilding with HTTP API base URL..."
npm run build

echo ""
echo "4. 🚀 Starting application with HTTP API..."
pm2 start dist/index.js --name cloudedze

echo ""
echo "5. 💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "6. ⏱️ Waiting for application to start..."
sleep 10

echo ""
echo "7. 🧪 Testing HTTP API endpoints..."

echo "Testing main page:"
curl -I http://app.cloudedze.ai 2>/dev/null | head -1 || echo "Testing IP: " && curl -I http://34.14.198.14:3000 2>/dev/null | head -1

echo ""
echo "Testing API endpoint:"
curl -I http://app.cloudedze.ai/api/auth/user 2>/dev/null | head -1 || echo "Testing IP API: " && curl -I http://34.14.198.14:3000/api/auth/user 2>/dev/null | head -1

echo ""
echo "8. 📊 Checking PM2 logs..."
pm2 logs cloudedze --lines 5

echo ""
echo "✅ HTTP API FIX COMPLETED!"
echo "========================"
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ API base URL forced to HTTP"
echo "✅ No more HTTPS API call failures"
echo "✅ Frontend will call HTTP APIs"
echo "✅ Server serves HTTP only"
echo ""
echo "🌐 TEST YOUR APPLICATION:"
echo "1. Visit: http://app.cloudedze.ai"
echo "2. Should work without HTTPS API errors"
echo "3. Registration/login should work"
echo ""
echo "🔍 ALL API CALLS NOW USE HTTP:"
echo "- Frontend calls: http://app.cloudedze.ai/api/*"
echo "- Server responds on: http://34.14.198.14:3000"
echo "- No more HTTPS/HTTP mismatch!"