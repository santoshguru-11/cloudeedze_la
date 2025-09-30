#!/bin/bash

echo "🚀 FIXING REACT APP LOADING"
echo "=========================="

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo "2. 🧹 Clearing potential issues..."
# Remove Replit development script from production build
echo "Removing Replit development script from HTML..."
sed -i 's|<script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script>||g' dist/index.html

echo "3. 🔧 Fixing database ACL permissions..."
# Fix the ACL permission errors we saw in logs
sudo -u postgres psql -d cloudedze << 'EOF'
-- Fix ACL permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudedze_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudedze_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO cloudedze_user;
GRANT USAGE ON SCHEMA public TO cloudedze_user;
GRANT CREATE ON SCHEMA public TO cloudedze_user;

-- Ensure sessions table has correct permissions
GRANT ALL PRIVILEGES ON TABLE sessions TO cloudedze_user;

-- Fix any ACL issues
ALTER TABLE sessions OWNER TO cloudedze_user;
EOF

echo "4. 🌍 Setting production environment variables..."
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_ORIGINS=http://34.14.198.14:3000,http://localhost:3000
export CORS_CREDENTIALS=true

echo "5. 🚀 Starting application with clean environment..."
pm2 start dist/index.js --name cloudedze

echo "6. 💾 Saving PM2 config..."
pm2 save

echo "7. ⏱️ Waiting for application to fully start..."
sleep 10

echo "8. 📊 Checking status..."
pm2 status

echo "9. 🔍 Testing application response..."
echo "Testing HTML response:"
curl -s http://34.14.198.14:3000 | grep -E "(root|assets)" || echo "No root or assets found"

echo ""
echo "Testing main JS file:"
curl -I http://34.14.198.14:3000/assets/index-vKB4VqUj.js 2>/dev/null | head -1 || echo "JS file test failed"

echo ""
echo "Testing CSS file:"
curl -I http://34.14.198.14:3000/assets/index-B9hSSgq0.css 2>/dev/null | head -1 || echo "CSS file test failed"

echo ""
echo "10. 📝 Checking for any errors in logs..."
pm2 logs cloudedze --lines 5 --raw

echo ""
echo "✅ REACT LOADING FIX COMPLETED!"
echo "=========================="
echo "🌐 Try: http://34.14.198.14:3000"
echo ""
echo "In your browser:"
echo "1. Open DevTools (F12)"
echo "2. Go to Console tab"
echo "3. Hard refresh: Ctrl+F5 or Cmd+Shift+R"
echo "4. Check for any remaining JavaScript errors"
echo ""
echo "If still blank, the issue is likely:"
echo "- JavaScript runtime error (check browser console)"
echo "- External font/resource blocking"
echo "- React app initialization failure"