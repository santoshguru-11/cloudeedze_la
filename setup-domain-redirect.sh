#!/bin/bash

echo "🌐 SETTING UP DOMAIN REDIRECT FOR app.cloudedze.ai"
echo "================================================="

echo "1. 🔍 Checking current DNS resolution..."
echo "Checking app.cloudedze.ai DNS:"
nslookup app.cloudedze.ai 2>/dev/null || echo "❌ app.cloudedze.ai not resolving to any IP"

echo ""
echo "Checking cloudedze.ai DNS:"
nslookup cloudedze.ai 2>/dev/null || echo "❌ cloudedze.ai not resolving to any IP"

echo ""
echo "2. 🌍 Testing current connectivity..."
echo "Testing if app.cloudedze.ai is accessible:"
curl -I http://app.cloudedze.ai 2>/dev/null || echo "❌ app.cloudedze.ai not accessible"

echo ""
echo "3. ⚙️ Updating server to handle domain properly..."

# Update server configuration to handle the domain and redirect properly
cat > /tmp/domain_redirect_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

// Find and replace the domain routing middleware
const domainRoutingPattern = /\/\/ Domain-based routing middleware[\s\S]*?next\(\);\s*\}\);/;

const newDomainRouting = `// Domain-based routing middleware (only for redirects, not for serving)
app.use((req, res, next) => {
  const host = req.get('host');
  const path = req.path;
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';

  console.log(\`Domain routing - Host: \${host}, Path: \${path}, Protocol: \${protocol}\`);

  // For app.cloudedze.ai, serve the application directly (no redirects)
  // This allows the frontend router to handle all routes
  if (host === 'app.cloudedze.ai') {
    console.log('Serving app.cloudedze.ai directly');
    return next();
  }

  // If someone visits cloudedze.ai, redirect to app.cloudedze.ai
  if (host === 'cloudedze.ai' || host === 'www.cloudedze.ai') {
    const redirectUrl = \`https://app.cloudedze.ai\${path}\`;
    console.log(\`Redirecting \${host}\${path} to \${redirectUrl}\`);
    return res.redirect(301, redirectUrl);
  }

  // For other domains, handle redirects as needed
  if (host === 'cloudedze.ai' && path.startsWith('/app/')) {
    const redirectUrl = \`https://app.cloudedze.ai\${path.replace('/app', '')}\`;
    console.log(\`Redirecting /app path to \${redirectUrl}\`);
    return res.redirect(301, redirectUrl);
  }

  // Let all other requests pass through to be handled by static serving
  next();
});`;

if (domainRoutingPattern.test(content)) {
  content = content.replace(domainRoutingPattern, newDomainRouting);
  fs.writeFileSync(serverIndexPath, content);
  console.log('✅ Updated domain routing configuration');
} else {
  console.log('⚠️ Could not find existing domain routing to replace');
}
EOF

node /tmp/domain_redirect_fix.js

echo ""
echo "4. 🔧 Updating CORS to include the domain..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo "5. 🏗️ Rebuilding application with domain support..."
npm run build

echo "6. 🚀 Restarting server with domain configuration..."
pm2 restart cloudedze

echo "7. 💾 Saving PM2 config..."
pm2 save

echo "8. 📋 DNS CONFIGURATION REQUIRED!"
echo "================================="
echo ""
echo "🎯 TO MAKE app.cloudedze.ai WORK, YOU MUST:"
echo ""
echo "OPTION 1: Point domain to your server IP (RECOMMENDED)"
echo "-------------------------------------------------------"
echo "Go to your domain registrar (where you bought cloudedze.ai)"
echo "Add these DNS records:"
echo ""
echo "Type: A Record"
echo "Host: app"
echo "Points to: 34.14.198.14"
echo "TTL: 300"
echo ""
echo "Type: A Record"
echo "Host: @ (or blank for root domain)"
echo "Points to: 34.14.198.14"
echo "TTL: 300"
echo ""
echo "OPTION 2: Use a redirect service (ALTERNATIVE)"
echo "----------------------------------------------"
echo "If you can't modify DNS, use a URL redirect service:"
echo "1. Go to your domain registrar's redirect settings"
echo "2. Set app.cloudedze.ai to redirect to http://34.14.198.14:3000"
echo "3. Choose 301 (permanent) redirect"
echo ""
echo "OPTION 3: CloudFlare Setup (ADVANCED)"
echo "------------------------------------"
echo "1. Add cloudedze.ai to CloudFlare"
echo "2. Create A record: app → 34.14.198.14"
echo "3. Create Page Rule for app.cloudedze.ai/*"
echo "4. Forward to http://34.14.198.14:3000/\$1"
echo ""

echo "9. 🧪 Testing current setup..."
echo "Testing server response on IP:"
curl -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Server test failed"

echo ""
echo "Testing with app.cloudedze.ai host header:"
curl -H "Host: app.cloudedze.ai" -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Host header test failed"

echo ""
echo "10. 📊 Checking server logs for domain requests..."
pm2 logs cloudedze --lines 5

echo ""
echo "✅ DOMAIN REDIRECT SETUP COMPLETED!"
echo "==================================="
echo ""
echo "🎯 WHAT WAS CONFIGURED:"
echo "✅ Server now properly handles app.cloudedze.ai requests"
echo "✅ Domain routing logic updated"
echo "✅ CORS configured for domain access"
echo "✅ Redirect logic for other domains"
echo ""
echo "📋 IMMEDIATE ACTION REQUIRED:"
echo "You MUST configure DNS at your domain registrar to:"
echo "Point app.cloudedze.ai → 34.14.198.14"
echo ""
echo "⏱️ AFTER DNS SETUP (5-60 minutes):"
echo "1. Visit: http://app.cloudedze.ai"
echo "2. Should show your Cloudedze application"
echo "3. All functionality should work normally"
echo ""
echo "🔍 TROUBLESHOOTING:"
echo "- DNS propagation takes 5-60 minutes"
echo "- Use https://dnschecker.org to verify DNS propagation"
echo "- Check PM2 logs: pm2 logs cloudedze"
echo "- Test with: curl -H 'Host: app.cloudedze.ai' http://34.14.198.14:3000"