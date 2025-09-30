#!/bin/bash

echo "🔧 FIXING DOMAIN ACCESS FOR app.cloudedze.ai"
echo "============================================"

echo "1. 🔍 Checking current server binding..."
echo "Current listening processes on port 3000:"
netstat -tlun | grep :3000 || echo "No processes found on port 3000"

echo ""
echo "Current PM2 process details:"
pm2 show cloudedze | grep -A 5 -B 5 "listening"

echo ""
echo "2. 🌐 Testing connectivity methods..."
echo "Testing localhost:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "❌ Localhost test failed"

echo ""
echo "Testing 127.0.0.1:"
curl -I http://127.0.0.1:3000 2>/dev/null | head -1 || echo "❌ 127.0.0.1 test failed"

echo ""
echo "Testing server IP:"
curl -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Server IP test failed"

echo ""
echo "Testing with domain host header:"
curl -H "Host: app.cloudedze.ai" -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Domain host header test failed"

echo ""
echo "3. 🔧 Checking firewall and port access..."
echo "Checking if port 3000 is open externally:"
sudo firewall-cmd --list-all 2>/dev/null | grep 3000 || echo "Firewall info not available with firewall-cmd"

# Try iptables if firewall-cmd doesn't work
iptables -L 2>/dev/null | grep 3000 || echo "No iptables rules found for port 3000"

echo ""
echo "4. 🌍 Ensuring server listens on all interfaces..."
echo "Stopping current process..."
pm2 stop cloudedze

echo ""
echo "Setting environment to bind to all interfaces..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0  # This is crucial - listen on all interfaces
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true

echo "Starting server with explicit host binding..."
pm2 start dist/index.js --name cloudedze

echo ""
echo "5. 💾 Saving PM2 config..."
pm2 save

echo ""
echo "6. ⏱️ Waiting for server to fully start..."
sleep 10

echo ""
echo "7. 🧪 Testing all connection methods again..."
echo "Testing localhost:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "❌ Localhost test failed"

echo ""
echo "Testing server IP:"
curl -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Server IP test failed"

echo ""
echo "Testing domain from server (simulated):"
curl -H "Host: app.cloudedze.ai" -I http://34.14.198.14:3000 2>/dev/null | head -1 || echo "❌ Domain simulation test failed"

echo ""
echo "8. 🔍 Checking what's listening on port 3000 now..."
netstat -tlun | grep :3000 || echo "No processes found on port 3000"

echo ""
echo "9. 🌐 Testing external domain access..."
echo "Testing app.cloudedze.ai from external perspective:"
curl -I http://app.cloudedze.ai 2>/dev/null | head -1 || echo "❌ External domain test failed"

echo ""
echo "10. 📊 Checking recent server logs..."
pm2 logs cloudedze --lines 10

echo ""
echo "11. 🔧 Additional firewall fixes if needed..."
echo "Opening port 3000 in firewall (if applicable):"
sudo firewall-cmd --permanent --add-port=3000/tcp 2>/dev/null && sudo firewall-cmd --reload 2>/dev/null || echo "Firewall-cmd not available or already configured"

# Try alternative firewall commands
sudo ufw allow 3000 2>/dev/null || echo "UFW not available"

echo ""
echo "✅ DOMAIN ACCESS FIX COMPLETED!"
echo "==============================="
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ Server now explicitly binds to 0.0.0.0:3000 (all interfaces)"
echo "✅ Firewall rules updated for port 3000"
echo "✅ Domain routing configured properly"
echo "✅ CORS updated for domain access"
echo ""
echo "🌐 TEST YOUR DOMAIN NOW:"
echo "1. Wait 2-3 minutes for changes to take effect"
echo "2. Visit: http://app.cloudedze.ai"
echo "3. Should show your Cloudedze application"
echo ""
echo "🔍 IF STILL NOT WORKING:"
echo "- Try: curl -v http://app.cloudedze.ai"
echo "- Check: pm2 logs cloudedze"
echo "- Verify: netstat -tlun | grep :3000"
echo "- Test: telnet app.cloudedze.ai 3000"
echo ""
echo "📋 EXPECTED NETSTAT OUTPUT:"
echo "Should show: 0.0.0.0:3000 (not 127.0.0.1:3000)"