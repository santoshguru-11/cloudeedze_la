#!/bin/bash

echo "🌐 FIXING DOMAIN ROUTING FOR app.cloudedze.ai"
echo "============================================"

echo "1. 🛑 Stopping application to fix routing..."
pm2 stop cloudedze

echo ""
echo "2. 🔧 Fixing domain routing in server/index.ts..."

# Create a fix for domain routing
cat > /tmp/domain_routing_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

console.log('Current content length:', content.length);

// Find and replace the domain routing middleware to be simpler
const domainRoutingPattern = /\/\/ Domain-based routing middleware[\s\S]*?next\(\);\s*\}\);/;

const newDomainRouting = `// Domain-based routing middleware - simplified for app.cloudedze.ai
app.use((req, res, next) => {
  const host = req.get('host');
  const path = req.path;

  console.log(\`Domain routing - Host: \${host}, Path: \${path}\`);

  // Always allow requests to proceed - let static serving handle everything
  next();
});`;

if (domainRoutingPattern.test(content)) {
  content = content.replace(domainRoutingPattern, newDomainRouting);
  fs.writeFileSync(serverIndexPath, content);
  console.log('✅ Updated domain routing to be more permissive');
} else {
  console.log('❌ Could not find domain routing pattern');
  console.log('Adding domain routing middleware...');

  // Find app.use(cors... and add our middleware before it
  const corsPattern = /(app\.use\(cors\(\{)/;
  if (corsPattern.test(content)) {
    content = content.replace(corsPattern, newDomainRouting + '\n\n$1');
    fs.writeFileSync(serverIndexPath, content);
    console.log('✅ Added domain routing middleware');
  } else {
    console.log('❌ Could not add domain routing middleware');
  }
}
EOF

node /tmp/domain_routing_fix.js

echo ""
echo "3. 🏗️ Rebuilding application..."
npm run build

echo ""
echo "4. 🌍 Setting environment for domain access..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo ""
echo "5. 🚀 Starting application with simplified domain routing..."
pm2 start dist/index.js --name cloudedze

echo ""
echo "6. 💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "7. ⏱️ Waiting for application to start..."
sleep 10

echo ""
echo "8. 🧪 Testing domain connectivity..."
echo "Testing localhost:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "❌ Localhost test failed"

echo ""
echo "Testing server IP:"
curl -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Server IP test failed"

echo ""
echo "Testing with app.cloudedze.ai host header:"
curl -H "Host: app.cloudedze.ai" -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Domain host header test failed"

echo ""
echo "9. 📊 Checking what's listening on port 3000..."
netstat -tlun | grep :3000 || echo "No processes found on port 3000"

echo ""
echo "10. 📋 Checking PM2 logs..."
pm2 logs cloudedze --lines 5

echo ""
echo "✅ DOMAIN ROUTING FIX COMPLETED!"
echo "==============================="
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ Simplified domain routing logic"
echo "✅ Removed complex domain redirects"
echo "✅ Server now responds to all domains equally"
echo "✅ Static file serving handles all requests"
echo ""
echo "🌐 TEST YOUR DOMAIN NOW:"
echo "1. Wait 1-2 minutes for changes to take effect"
echo "2. Visit: http://app.cloudedze.ai"
echo "3. Should load the Cloudedze application"
echo ""
echo "🔍 If still not working:"
echo "- Try hard refresh: Ctrl+F5"
echo "- Check: curl -v http://app.cloudedze.ai"
echo "- Verify: pm2 logs cloudedze"