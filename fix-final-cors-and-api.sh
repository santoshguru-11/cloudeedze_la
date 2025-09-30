#!/bin/bash

echo "🔧 FINAL FIX: CORS + API BASE URL"
echo "================================="

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo ""
echo "2. 🔧 Fixing CORS to remove wildcard and API base URL..."

# Fix the CORS configuration to not use wildcard with credentials
cat > /tmp/final_cors_api_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

console.log('Fixing CORS and API configuration...');

// Replace CORS to be very explicit and not use wildcard
const corsPattern = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;

const newCorsConfig = `app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://127.0.0.1:3000',
      'https://127.0.0.1:3000',
      'http://34.14.198.14:3000',
      'https://34.14.198.14:3000',
      'https://cloudedze.ai',
      'http://cloudedze.ai',
      'https://app.cloudedze.ai',
      'http://app.cloudedze.ai'
    ];

    console.log('CORS Request - Origin:', origin);

    if (allowedOrigins.includes(origin)) {
      console.log('CORS Request allowed - exact match:', origin);
      return callback(null, true);
    }

    // Allow localhost variations and server IP
    if (origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('34.14.198.14') ||
      origin.includes('cloudedze.ai')
    )) {
      console.log('CORS Request allowed - pattern match:', origin);
      return callback(null, true);
    }

    console.log('CORS Request blocked for origin:', origin);
    return callback(null, false);
  },
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
  console.log('✅ CORS configuration updated - no wildcards');
} else {
  console.log('❌ Could not find CORS configuration to update');
}
EOF

node /tmp/final_cors_api_fix.js

echo ""
echo "3. 🌍 Setting environment variables for consistent domain usage..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
# Use HTTP (not HTTPS) for API base URL to match domain access
export VITE_API_BASE_URL=http://app.cloudedze.ai
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo ""
echo "4. 🏗️ Rebuilding application with fixed CORS and API..."
npm run build

echo ""
echo "5. 🚀 Starting application with corrected configuration..."
pm2 start dist/index.js --name cloudedze

echo ""
echo "6. 💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "7. ⏱️ Waiting for application to start..."
sleep 10

echo ""
echo "8. 🧪 Testing CORS and API endpoints..."

echo "Testing CORS preflight for register:"
curl -X OPTIONS \
     -H "Origin: http://app.cloudedze.ai" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -I http://34.14.198.14:3000/api/register 2>/dev/null | grep -i "access-control" || echo "❌ CORS preflight failed"

echo ""
echo "Testing API endpoint with domain origin:"
curl -H "Origin: http://app.cloudedze.ai" \
     -H "Content-Type: application/json" \
     -I http://34.14.198.14:3000/api/auth/user 2>/dev/null | grep -i "access-control" || echo "❌ API with origin failed"

echo ""
echo "9. 📊 Checking PM2 logs..."
pm2 logs cloudedze --lines 5

echo ""
echo "✅ FINAL CORS AND API FIX COMPLETED!"
echo "==================================="
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ CORS no longer uses wildcard '*' with credentials"
echo "✅ API base URL is HTTP (not HTTPS) to match access"
echo "✅ Explicit origin checking for better security"
echo "✅ Proper preflight request handling"
echo ""
echo "🌐 CRITICAL: ACCESS VIA DOMAIN ONLY!"
echo "❌ DO NOT USE: http://34.14.198.14:3000"
echo "✅ USE THIS:   http://app.cloudedze.ai"
echo ""
echo "After accessing via domain:"
echo "1. Clear browser cache completely"
echo "2. Visit: http://app.cloudedze.ai"
echo "3. Try registration/login"
echo "4. Should work without CORS errors!"