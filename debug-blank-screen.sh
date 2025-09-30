#!/bin/bash

echo "🔍 BLANK SCREEN DIAGNOSTICS"
echo "=========================="

echo "1. 📄 Checking actual HTML content from server..."
echo "--- HTML Response ---"
curl -s http://34.14.198.14:3000 | head -50
echo ""
echo "--- End HTML Response ---"

echo ""
echo "2. 🗂️ Checking dist directory structure..."
ls -la dist/

echo ""
echo "3. 📁 Checking assets directory..."
ls -la dist/assets/ 2>/dev/null || echo "❌ No assets directory"

echo ""
echo "4. 🎯 Testing specific asset files..."
# Extract asset names from the HTML
echo "Getting asset names from HTML..."
ASSETS=$(curl -s http://34.14.198.14:3000 | grep -o '/assets/[^"]*' | head -5)

for asset in $ASSETS; do
    echo "Testing asset: $asset"
    curl -I "http://34.14.198.14:3000$asset" 2>/dev/null | head -1 || echo "❌ Failed to load $asset"
done

echo ""
echo "5. 📋 Checking if files exist in filesystem..."
if [ -f dist/index.html ]; then
    echo "✅ dist/index.html exists"
    echo "--- dist/index.html content (first 30 lines) ---"
    head -30 dist/index.html
    echo "--- End dist/index.html ---"
else
    echo "❌ dist/index.html NOT FOUND"
fi

echo ""
echo "6. 🌐 Checking JavaScript files in assets..."
ls -la dist/assets/*.js 2>/dev/null || echo "❌ No JS files found"

echo ""
echo "7. 🎨 Checking CSS files in assets..."
ls -la dist/assets/*.css 2>/dev/null || echo "❌ No CSS files found"

echo ""
echo "8. 🔧 PM2 logs (last 10 lines)..."
pm2 logs cloudedze --lines 10

echo ""
echo "9. 🌍 Browser debugging instructions..."
echo "In your browser (F12 Developer Tools):"
echo "1. Open Console tab - look for JavaScript errors"
echo "2. Open Network tab - check which files are failing"
echo "3. Try hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)"
echo "4. Check if 'root' div exists in Elements tab"

echo ""
echo "✅ DIAGNOSTICS COMPLETE!"
echo "If you see JavaScript errors in browser console, that's the issue."