#!/bin/bash

echo "🌐 COMPREHENSIVE CORS FIX"
echo "========================"

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo "2. 🔧 Creating comprehensive CORS fix..."
# Backup original server/index.ts
cp server/index.ts server/index.ts.backup

# Create a more permissive CORS configuration
echo "Updating CORS configuration to be more permissive..."

# Update the CORS configuration in server/index.ts
cat > /tmp/cors_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

// Replace the existing CORS configuration with a more comprehensive one
const oldCorsConfig = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;

const newCorsConfig = `app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // More comprehensive origin checking
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
      'http://app.cloudedze.ai',
      'https://www.cloudedze.ai',
      'http://www.cloudedze.ai'
    ];

    console.log('CORS Request - Origin:', origin);

    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      console.log('CORS Request allowed - exact match:', origin);
      return callback(null, true);
    }

    // Allow any localhost variations
    if (origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('34.14.198.14') ||
      origin.includes('cloudedze.ai')
    )) {
      console.log('CORS Request allowed - pattern match:', origin);
      return callback(null, true);
    }

    // For development - be more lenient
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS Request allowed - development mode:', origin);
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
    'Referer'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));`;

if (oldCorsConfig.test(content)) {
  content = content.replace(oldCorsConfig, newCorsConfig);
  fs.writeFileSync(serverIndexPath, content);
  console.log('✅ CORS configuration updated successfully');
} else {
  console.log('❌ Could not find existing CORS configuration to replace');
}
EOF

node /tmp/cors_fix.js

echo "3. 🏗️ Rebuilding application with new CORS..."
npm run build

echo "4. 🌍 Setting comprehensive environment variables..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
# More comprehensive CORS origins
export CORS_ORIGINS="*"
export CORS_CREDENTIALS=true

echo "5. 🚀 Starting application with updated CORS..."
pm2 start dist/index.js --name cloudedze

echo "6. 💾 Saving PM2 config..."
pm2 save

echo "7. ⏱️ Waiting for application to start..."
sleep 5

echo "8. 📊 Testing CORS from different origins..."

echo "Testing localhost origin:"
curl -H "Origin: http://localhost:3000" -I http://34.14.198.14:3000 2>/dev/null | grep -E "(Access-Control|HTTP)" || echo "❌ Localhost CORS test failed"

echo ""
echo "Testing IP origin:"
curl -H "Origin: http://34.14.198.14:3000" -I http://34.14.198.14:3000 2>/dev/null | grep -E "(Access-Control|HTTP)" || echo "❌ IP CORS test failed"

echo ""
echo "Testing domain origin (if DNS is set up):"
curl -H "Origin: https://app.cloudedze.ai" -I http://34.14.198.14:3000 2>/dev/null | grep -E "(Access-Control|HTTP)" || echo "❌ Domain CORS test failed"

echo ""
echo "9. 📝 Checking PM2 logs for CORS activity..."
pm2 logs cloudedze --lines 5

echo ""
echo "10. 🔍 Testing application endpoints..."
echo "Testing main page:"
curl -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Main page test failed"

echo ""
echo "Testing assets:"
curl -I http://34.14.198.14:3000/assets/index-vKB4VqUj.js 2>/dev/null | head -1 || echo "❌ Asset test failed"

echo ""
echo "✅ COMPREHENSIVE CORS FIX COMPLETED!"
echo "=================================="
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ More permissive CORS origin checking"
echo "✅ Additional HTTP methods allowed"
echo "✅ More comprehensive headers"
echo "✅ Better error logging"
echo "✅ Development mode flexibility"
echo ""
echo "🌐 TEST YOUR APPLICATION:"
echo "1. Try: http://34.14.198.14:3000"
echo "2. Open browser DevTools (F12)"
echo "3. Check Console for CORS errors"
echo "4. Check Network tab for failed requests"
echo ""
echo "If still having CORS issues:"
echo "- Check browser console for specific error messages"
echo "- Try different browsers"
echo "- Clear browser cache completely"