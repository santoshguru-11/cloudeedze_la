#!/bin/bash

# Cloudedze Complete Fix Script - Fixes all deployment issues
echo "🔧 CLOUDEDZE COMPLETE DEPLOYMENT FIX"
echo "===================================="

echo "1. 📊 Current Status Check:"
echo "pm2 status:"
pm2 status
echo ""

echo "2. 🛑 Stopping application..."
pm2 stop all
pm2 delete all

echo "3. 📦 Clean install of dependencies..."
cd ~/cloudedze
rm -rf node_modules package-lock.json
npm install

echo "4. 🏗️ Building application with verbose output..."
npm run build

echo "5. 📁 Checking build output..."
ls -la dist/
ls -la dist/assets/ 2>/dev/null || echo "No assets directory"

echo "6. 🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze" >> .env
fi

echo "7. 🗄️ Checking database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "8. 🚀 Starting application with correct configuration..."
NODE_ENV=production pm2 start dist/index.js --name cloudedze

echo "9. 💾 Saving PM2 configuration..."
pm2 save

echo "10. 📊 Final status check..."
pm2 status
pm2 logs cloudedze --lines 10

echo "11. 🌐 Testing local connectivity..."
sleep 3
curl -I http://localhost:3000
echo ""

echo "12. 🔍 Testing asset files..."
curl -I http://localhost:3000/assets/ 2>/dev/null || echo "Assets endpoint test"

echo ""
echo "✅ COMPLETE FIX FINISHED!"
echo "========================"
echo "🌐 Try accessing: http://34.14.198.14:3000"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs cloudedze"