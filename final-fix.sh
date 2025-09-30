#!/bin/bash

# Cloudedze Final Fix - Resolve build path and permission issues
echo "🔧 CLOUDEDZE FINAL FIX"
echo "====================="

echo "1. 🛑 Stopping current application..."
pm2 stop all
pm2 delete all

echo "2. 🧹 Cleaning dist directory..."
rm -rf dist/
mkdir -p dist

echo "3. 🔐 Fixing permissions..."
sudo chown -R santosh:santosh ~/cloudedze
chmod -R 755 ~/cloudedze

echo "4. 🏗️ Building with fixed configuration..."
npm run build

echo "5. 📁 Checking build output..."
ls -la dist/
ls -la dist/assets/ 2>/dev/null || echo "Checking for assets..."

echo "6. 🚀 Starting application with NODE_ENV=production..."
NODE_ENV=production pm2 start dist/index.js --name cloudedze

echo "7. 💾 Saving PM2 configuration..."
pm2 save

echo "8. 📊 Final status..."
pm2 status
pm2 logs cloudedze --lines 5

echo "9. 🌐 Testing connectivity..."
sleep 3
curl -I http://localhost:3000

echo ""
echo "✅ FINAL FIX COMPLETED!"
echo "======================"
echo "🌐 Try: http://34.14.198.14:3000"
echo "📊 Status: pm2 status"
echo "📝 Logs: pm2 logs cloudedze"