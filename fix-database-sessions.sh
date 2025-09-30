#!/bin/bash

echo "🗄️ FIXING DATABASE SESSIONS PERMISSIONS"
echo "======================================"

echo "1. 🔍 Checking current database connection..."
sudo -u postgres psql -d cloudedze -c "\conninfo" || echo "❌ Database connection failed"

echo ""
echo "2. 🛠️ Fixing database permissions for sessions..."
sudo -u postgres psql -d cloudedze -c "
-- Grant all privileges on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudedze_user;

-- Grant all privileges on existing sequences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudedze_user;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO cloudedze_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cloudedze_user;

-- Set default privileges for future sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cloudedze_user;

-- Specifically grant permissions on sessions table if it exists
GRANT ALL PRIVILEGES ON TABLE sessions TO cloudedze_user;

-- Show current permissions
\dp sessions;
"

echo ""
echo "3. 🧪 Testing database connection as cloudedze_user..."
PGPASSWORD=cloudedze_password psql -h localhost -p 5432 -U cloudedze_user -d cloudedze -c "SELECT COUNT(*) FROM sessions;" || echo "❌ Sessions table test failed"

echo ""
echo "4. 🔄 Restarting PM2 application..."
pm2 restart cloudedze

echo ""
echo "5. 💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "6. ⏱️ Waiting for application to restart..."
sleep 10

echo ""
echo "7. 🧪 Testing application endpoints..."
echo "Testing main page:"
curl -I http://localhost:3000 2>/dev/null | head -1 || echo "❌ Main page test failed"

echo ""
echo "Testing auth endpoint:"
curl -I http://localhost:3000/api/auth/user 2>/dev/null | head -1 || echo "❌ Auth endpoint test failed"

echo ""
echo "8. 📊 Checking PM2 logs for errors..."
pm2 logs cloudedze --lines 5

echo ""
echo "✅ DATABASE SESSIONS FIX COMPLETED!"
echo "================================="
echo ""
echo "🎯 WHAT WAS FIXED:"
echo "✅ Database permissions for sessions table"
echo "✅ Schema usage permissions"
echo "✅ Default privileges for future tables"
echo "✅ Application restarted with new permissions"
echo ""
echo "🌐 TEST YOUR APPLICATION:"
echo "1. Visit: http://app.cloudedze.ai"
echo "2. Should load without 500 errors"
echo "3. Try registering/logging in"
echo "4. Check browser console for any remaining errors"
echo ""
echo "🔍 If still having issues:"
echo "- Check PM2 logs: pm2 logs cloudedze"
echo "- Test database: PGPASSWORD=cloudedze_password psql -h localhost -U cloudedze_user -d cloudedze"
echo "- Hard refresh browser: Ctrl+F5 or Cmd+Shift+R"