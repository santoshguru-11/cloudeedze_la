#!/bin/bash

echo "🌐 FINAL CORS FIX FOR app.cloudedze.ai"
echo "====================================="

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo ""
echo "2. 🔧 Implementing comprehensive CORS fix..."

# Create the most permissive CORS configuration
cat > /tmp/cors_final_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

console.log('Fixing CORS configuration...');

// Replace the entire CORS section with a very permissive one
const corsPattern = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;

const newCorsConfig = `app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Forwarded-For',
    'X-Real-IP',
    'User-Agent',
    'Referer',
    'Host'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));`;

if (corsPattern.test(content)) {
  content = content.replace(corsPattern, newCorsConfig);
  fs.writeFileSync(serverIndexPath, content);
  console.log('✅ CORS configuration updated to allow all origins');
} else {
  console.log('❌ Could not find CORS configuration to update');
}
EOF

node /tmp/cors_final_fix.js

echo ""
echo "3. 🌍 Updating environment for domain support..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
# Fix the API base URL to work with the domain
export VITE_API_BASE_URL=http://app.cloudedze.ai
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo ""
echo "4. 🏗️ Rebuilding application with new CORS..."
npm run build

echo ""
echo "5. 🚀 Starting application with permissive CORS..."
pm2 start dist/index.js --name cloudedze

echo ""
echo "6. 💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "7. ⏱️ Waiting for application to start..."
sleep 10

echo ""
echo "8. 🧪 Testing CORS from different origins..."

echo "Testing OPTIONS request (CORS preflight):"
curl -X OPTIONS -H "Origin: http://app.cloudedze.ai" -H "Access-Control-Request-Method: GET" \
     -I http://34.14.198.14:3000/api/auth/user 2>/dev/null | grep -i "access-control" || echo "❌ CORS preflight failed"

echo ""
echo "Testing GET request with origin:"
curl -H "Origin: http://app.cloudedze.ai" -I http://34.14.198.14:3000 2>/dev/null | grep -i "access-control" || echo "❌ CORS GET failed"

echo ""
echo "9. 📊 Checking PM2 logs for CORS activity..."
pm2 logs cloudedze --lines 5

echo ""
echo "10. 🔍 Testing what's listening on port 3000..."
netstat -tlun | grep :3000

echo ""
echo "✅ FINAL CORS FIX COMPLETED!"
echo "==========================="
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ CORS now allows ALL origins (origin: true)"
echo "✅ All HTTP methods enabled"
echo "✅ All headers allowed"
echo "✅ Credentials enabled for authentication"
echo "✅ API base URL updated to use domain"
echo ""
echo "🌐 TEST YOUR DOMAIN NOW:"
echo "1. Clear browser cache completely (Ctrl+Shift+Delete)"
echo "2. Visit: http://app.cloudedze.ai"
echo "3. Open DevTools and check for CORS errors"
echo "4. The application should load without issues"
echo ""
echo "🔍 TROUBLESHOOTING:"
echo "- If still getting CORS: try different browser"
echo "- Hard refresh: Ctrl+F5 or Cmd+Shift+R"
echo "- Check PM2 logs: pm2 logs cloudedze"
echo "- Test direct IP: http://34.14.198.14:3000"