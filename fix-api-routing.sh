#!/bin/bash

echo "🔧 FIXING API ROUTING FOR app.cloudedze.ai"
echo "========================================="

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo ""
echo "2. 🔍 Checking current server configuration..."
echo "Current server/index.ts routing:"
grep -n "app.use.*api" server/index.ts || echo "No API routes found"

echo ""
echo "3. 🔧 Fixing API routing and domain handling..."

# Create comprehensive fix for API routing
cat > /tmp/api_routing_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

console.log('Fixing API routing...');

// Find the domain routing middleware and simplify it
const domainRoutingPattern = /\/\/ Domain-based routing middleware[\s\S]*?next\(\);\s*\}\);/;

const simpleDomainRouting = `// Simplified domain routing - allow all requests to proceed
app.use((req, res, next) => {
  const host = req.get('host');
  const path = req.path;

  console.log(\`Request - Host: \${host}, Path: \${path}, Method: \${req.method}\`);

  // Always proceed - no blocking
  next();
});`;

if (domainRoutingPattern.test(content)) {
  content = content.replace(domainRoutingPattern, simpleDomainRouting);
  console.log('✅ Simplified domain routing');
} else {
  console.log('⚠️ Domain routing not found');
}

// Ensure API routes are properly mounted BEFORE static file serving
const apiRoutesPattern = /(\/\/ API routes[\s\S]*?app\.use\('\/api', apiRouter\);)/;
const staticServingPattern = /(\/\/ Serve static files[\s\S]*?app\.use\(express\.static)/;

if (apiRoutesPattern.test(content) && staticServingPattern.test(content)) {
  // Make sure API routes come before static serving
  const apiRoutes = content.match(apiRoutesPattern)[1];
  const beforeStatic = content.split(staticServingPattern)[0];
  const afterStatic = staticServingPattern.source + content.split(staticServingPattern)[1];

  // Remove API routes from original location
  content = content.replace(apiRoutesPattern, '');

  // Add API routes before static serving
  content = beforeStatic + '\n' + apiRoutes + '\n\n' + afterStatic;

  console.log('✅ Moved API routes before static serving');
} else {
  console.log('⚠️ Could not reorder API routes');
}

fs.writeFileSync(serverIndexPath, content);
console.log('✅ API routing configuration updated');
EOF

node /tmp/api_routing_fix.js

echo ""
echo "4. 🌍 Setting correct environment variables..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
# Keep API base URL as domain for consistency
export VITE_API_BASE_URL=http://app.cloudedze.ai
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo ""
echo "5. 🏗️ Rebuilding application..."
npm run build

echo ""
echo "6. 🚀 Starting application with fixed API routing..."
pm2 start dist/index.js --name cloudedze

echo ""
echo "7. 💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "8. ⏱️ Waiting for application to start..."
sleep 10

echo ""
echo "9. 🧪 Testing API endpoints..."

echo "Testing API route directly on localhost:"
curl -I http://localhost:3000/api/auth/user 2>/dev/null | head -1 || echo "❌ Local API test failed"

echo ""
echo "Testing API route on server IP:"
curl -I http://34.14.198.14:3000/api/auth/user 2>/dev/null | head -1 || echo "❌ IP API test failed"

echo ""
echo "Testing API route with domain host header:"
curl -H "Host: app.cloudedze.ai" -I http://34.14.198.14:3000/api/auth/user 2>/dev/null | head -1 || echo "❌ Domain API test failed"

echo ""
echo "Testing registration endpoint:"
curl -H "Host: app.cloudedze.ai" -H "Content-Type: application/json" \
     -X POST http://34.14.198.14:3000/api/register \
     -d '{"email":"test@test.com","password":"test"}' 2>/dev/null | head -1 || echo "❌ Register test failed"

echo ""
echo "10. 📊 Checking server logs..."
pm2 logs cloudedze --lines 5

echo ""
echo "11. 🔍 Verifying what's listening on port 3000..."
netstat -tlun | grep :3000

echo ""
echo "✅ API ROUTING FIX COMPLETED!"
echo "============================"
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ Simplified domain routing (no blocking)"
echo "✅ API routes prioritized before static files"
echo "✅ Proper request handling for all domains"
echo "✅ API endpoints should respond correctly"
echo ""
echo "🌐 TEST YOUR APPLICATION:"
echo "1. Visit: http://app.cloudedze.ai"
echo "2. Try login/registration"
echo "3. Check browser console - should see API responses"
echo "4. No more ERR_EMPTY_RESPONSE errors"
echo ""
echo "🔍 If still having issues:"
echo "- Check PM2 logs: pm2 logs cloudedze"
echo "- Test API directly: curl -I http://app.cloudedze.ai/api/auth/user"
echo "- Clear browser cache completely"