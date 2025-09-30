#!/bin/bash

# Cloudedze Build Fix Script
echo "🔧 FIXING BUILD ISSUES"
echo "====================="

echo "1. 📦 Reinstalling dependencies..."
npm ci --only=production=false

echo "2. 🏗️ Installing build dependencies..."
npm install --save-dev vite @vitejs/plugin-react typescript

echo "3. 🎯 Building application..."
npm run build

echo "4. 🚀 Restarting PM2..."
pm2 restart cloudedze

echo "5. 📊 Checking status..."
pm2 status

echo ""
echo "✅ Build fix completed!"
echo "🌐 Try accessing: http://34.14.198.14:3000"