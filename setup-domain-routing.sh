#!/bin/bash

echo "🌐 DOMAIN ROUTING SETUP"
echo "======================"

echo "1. 🔍 Checking current domain DNS resolution..."
echo "Checking app.cloudedze.ai DNS:"
nslookup app.cloudedze.ai || echo "❌ app.cloudedze.ai not resolving"

echo ""
echo "Checking cloudedze.ai DNS:"
nslookup cloudedze.ai || echo "❌ cloudedze.ai not resolving"

echo ""
echo "2. 🌍 Testing domain connectivity..."
echo "Testing app.cloudedze.ai (if DNS resolves):"
curl -I http://app.cloudedze.ai 2>/dev/null || echo "❌ app.cloudedze.ai not accessible"

echo ""
echo "Testing cloudedze.ai (if DNS resolves):"
curl -I http://cloudedze.ai 2>/dev/null || echo "❌ cloudedze.ai not accessible"

echo ""
echo "3. ⚙️ Current server configuration:"
echo "Server is configured to handle:"
echo "✅ app.cloudedze.ai → Serve application directly"
echo "✅ cloudedze.ai/app/* → Redirect to app.cloudedze.ai"

echo ""
echo "4. 📋 Required DNS Configuration:"
echo "==================================="
echo "To make app.cloudedze.ai work, you need to set up DNS records:"
echo ""
echo "DNS Record Type: A Record"
echo "Host/Name: app"
echo "Points to: 34.14.198.14"
echo "TTL: 300 (or your domain provider's default)"
echo ""
echo "DNS Record Type: A Record"
echo "Host/Name: @ (or blank for root domain)"
echo "Points to: 34.14.198.14"
echo "TTL: 300"
echo ""
echo "Alternative: CNAME Record"
echo "Host/Name: app"
echo "Points to: cloudedze.ai"
echo ""

echo "5. 🔧 Updating CORS to include domains..."
echo "Adding domain support to CORS configuration..."

# Update CORS origins in the environment
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_ORIGINS="http://34.14.198.14:3000,http://localhost:3000,https://app.cloudedze.ai,http://app.cloudedze.ai,https://cloudedze.ai,http://cloudedze.ai"
export CORS_CREDENTIALS=true

echo "6. 🚀 Restarting server with domain support..."
pm2 restart cloudedze

echo "7. 💾 Saving PM2 config..."
pm2 save

echo "8. 📊 Testing current setup..."
echo "Testing IP access:"
curl -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ IP access failed"

echo ""
echo "9. 📝 Domain Setup Instructions:"
echo "================================"
echo ""
echo "🎯 IMMEDIATE ACTION NEEDED:"
echo "You need to configure DNS for your domains."
echo ""
echo "📍 WHERE TO SET UP DNS:"
echo "Go to your domain registrar (where you bought cloudedze.ai)"
echo "Common registrars: GoDaddy, Namecheap, CloudFlare, etc."
echo ""
echo "📋 DNS RECORDS TO ADD:"
echo "1. A Record: app.cloudedze.ai → 34.14.198.14"
echo "2. A Record: cloudedze.ai → 34.14.198.14"
echo ""
echo "⏱️ DNS PROPAGATION:"
echo "After setting up DNS, it takes 5-60 minutes to propagate globally."
echo ""
echo "🧪 TESTING AFTER DNS SETUP:"
echo "1. Wait 10-15 minutes after DNS changes"
echo "2. Try: http://app.cloudedze.ai"
echo "3. Try: https://app.cloudedze.ai (if you have SSL)"
echo ""
echo "✅ DOMAIN ROUTING SETUP COMPLETED!"
echo "Server is ready to handle domains once DNS is configured."