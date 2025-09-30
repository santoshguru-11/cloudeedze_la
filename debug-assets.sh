#!/bin/bash

echo "🔍 ASSET LOADING DIAGNOSTICS"
echo "============================"

echo "1. 📄 Checking HTML content..."
curl -s http://34.14.198.14:3000 | head -30

echo ""
echo "2. 📁 Checking dist directory structure..."
ls -la dist/

echo ""
echo "3. 🎯 Checking dist/assets..."
ls -la dist/assets/ 2>/dev/null || echo "No assets directory found"

echo ""
echo "4. 🌐 Testing asset URLs..."
echo "Testing CSS file:"
curl -I http://34.14.198.14:3000/assets/index-B9hSSgq0.css 2>/dev/null || echo "CSS test failed"

echo ""
echo "Testing JS file:"
curl -I http://34.14.198.14:3000/assets/index-vKB4VqUj.js 2>/dev/null || echo "JS test failed"

echo ""
echo "5. 📊 PM2 logs (last 10 lines)..."
pm2 logs cloudedze --lines 10

echo ""
echo "6. 🔧 Current NODE_ENV..."
pm2 show cloudedze | grep -A 5 "env:" || echo "No env info"

echo ""
echo "7. 🌐 Network test from browser perspective..."
echo "Try opening browser dev tools and check Network tab"
echo "Look for any red 404 or 500 errors"
echo ""
echo "✅ DIAGNOSTICS COMPLETE"