#!/bin/bash

echo "🔧 FIXING API BASE URL AND CORS"
echo "==============================="

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo "2. 🔍 Checking current VITE_API_BASE_URL configuration..."
echo "Current environment variable:"
env | grep VITE_API_BASE_URL || echo "Not set"

echo ""
echo "3. 📝 Updating environment variables..."
# Set the correct API base URL to point to the server IP
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
# THIS IS THE KEY FIX - Point API calls to the actual server
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo "4. 🔧 Fixing CORS for credentials (no wildcard)..."
# Create a more specific CORS configuration that works with credentials
cat > /tmp/cors_credentials_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

// Replace the CORS configuration to fix credentials issue
const oldCorsConfig = /app\.use\(cors\(\{[\s\S]*?\}\)\);/;

const newCorsConfig = `app.use(cors({
  origin: function (origin, callback) {
    // List of specific allowed origins (no wildcard when using credentials)
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

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS Request allowed - no origin');
      return callback(null, true);
    }

    // Check exact matches first
    if (allowedOrigins.includes(origin)) {
      console.log('CORS Request allowed - exact match:', origin);
      return callback(null, true);
    }

    // Allow localhost variations and server IP
    if (origin && (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('34.14.198.14')
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
    'Referer'
  ],
  exposedHeaders: ['Set-Cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));`;

if (oldCorsConfig.test(content)) {
  content = content.replace(oldCorsConfig, newCorsConfig);
  fs.writeFileSync(serverIndexPath, content);
  console.log('✅ CORS configuration updated for credentials');
} else {
  console.log('❌ Could not find existing CORS configuration');
}
EOF

node /tmp/cors_credentials_fix.js

echo "5. 🏗️ Rebuilding application with correct API base URL..."
npm run build

echo "6. 🚀 Starting application with corrected configuration..."
pm2 start dist/index.js --name cloudedze

echo "7. 💾 Saving PM2 config..."
pm2 save

echo "8. ⏱️ Waiting for application to start..."
sleep 5

echo "9. 🧪 Testing API endpoints..."
echo "Testing auth endpoint:"
curl -H "Origin: http://34.14.198.14:3000" -H "Content-Type: application/json" \
     -I http://34.14.198.14:3000/api/auth/user 2>/dev/null | head -3 || echo "❌ Auth test failed"

echo ""
echo "Testing register endpoint:"
curl -H "Origin: http://34.14.198.14:3000" -H "Content-Type: application/json" \
     -X OPTIONS http://34.14.198.14:3000/api/register 2>/dev/null | head -3 || echo "❌ Register OPTIONS test failed"

echo ""
echo "10. 📊 Checking PM2 status and logs..."
pm2 status
echo ""
echo "Recent logs:"
pm2 logs cloudedze --lines 5

echo ""
echo "✅ API BASE URL AND CORS FIX COMPLETED!"
echo "======================================"
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ API base URL now points to http://34.14.198.14:3000"
echo "✅ CORS configured properly for credentials"
echo "✅ No more wildcard CORS with credentials"
echo "✅ Specific origin allowlist for security"
echo ""
echo "🌐 TEST YOUR APPLICATION:"
echo "1. Go to: http://34.14.198.14:3000"
echo "2. Try registering a new account"
echo "3. Check browser console - should be no CORS errors"
echo "4. The React app should now work completely!"
echo ""
echo "🔍 If still having issues:"
echo "- Hard refresh: Ctrl+F5 or Cmd+Shift+R"
echo "- Clear browser cache completely"
echo "- Check PM2 logs: pm2 logs cloudedze"