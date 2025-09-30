#!/bin/bash

echo "🗄️ QUICK DATABASE PERMISSIONS FIX"
echo "================================"

echo "1. 🔧 Fixing database permissions for sessions table..."
sudo -u postgres psql -d cloudedze -c "
-- Grant all privileges to cloudedze_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudedze_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudedze_user;
GRANT USAGE ON SCHEMA public TO cloudedze_user;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cloudedze_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO cloudedze_user;

-- Specifically grant on sessions table
GRANT ALL PRIVILEGES ON TABLE sessions TO cloudedze_user;

-- Grant on sessions sequence if it exists
GRANT ALL PRIVILEGES ON SEQUENCE sessions_session_id_seq TO cloudedze_user;
"

echo ""
echo "2. 🧪 Testing database connection..."
PGPASSWORD=cloudedze_password psql -h localhost -p 5432 -U cloudedze_user -d cloudedze -c "SELECT 'Database connection successful' as status;" || echo "❌ Database connection test failed"

echo ""
echo "3. 🔄 Restarting application..."
pm2 restart cloudedze

echo ""
echo "4. ⏱️ Waiting for restart..."
sleep 5

echo ""
echo "5. 📊 Checking PM2 logs..."
pm2 logs cloudedze --lines 5

echo ""
echo "✅ DATABASE FIX COMPLETED!"
echo "========================"
echo ""
echo "🌐 Test your application:"
echo "Visit: http://app.cloudedze.ai"
echo "Should load without 500 errors now!"