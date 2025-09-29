#!/bin/bash

echo "🔧 Fixing Nginx Proxy Configuration"
echo "==================================="
echo ""

echo "📋 Commands to run on your server:"
echo ""

echo "1. Create the Nginx configuration file:"
echo "   sudo nano /etc/nginx/conf.d/cloudedze.conf"
echo ""

echo "2. Add this EXACT configuration:"
echo "   server {"
echo "       listen 80;"
echo "       server_name cloudedze.ai www.cloudedze.ai;"
echo "       "
echo "       location / {"
echo "           proxy_pass http://localhost:3000;"
echo "           proxy_http_version 1.1;"
echo "           proxy_set_header Upgrade \$http_upgrade;"
echo "           proxy_set_header Connection 'upgrade';"
echo "           proxy_set_header Host \$host;"
echo "           proxy_set_header X-Real-IP \$remote_addr;"
echo "           proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;"
echo "           proxy_set_header X-Forwarded-Proto \$scheme;"
echo "           proxy_cache_bypass \$http_upgrade;"
echo "           proxy_read_timeout 86400;"
echo "       }"
echo "   }"
echo ""

echo "3. Remove default Nginx configuration:"
echo "   sudo rm /etc/nginx/conf.d/default.conf"
echo ""

echo "4. Test Nginx configuration:"
echo "   sudo nginx -t"
echo ""

echo "5. Reload Nginx:"
echo "   sudo systemctl reload nginx"
echo ""

echo "6. Configure firewall to allow external access:"
echo "   sudo firewall-cmd --permanent --add-service=http"
echo "   sudo firewall-cmd --permanent --add-service=https"
echo "   sudo firewall-cmd --reload"
echo ""

echo "7. Test the setup:"
echo "   curl -I http://localhost"
echo "   curl -I http://34.14.198.14"
echo ""

echo "🎯 What this fixes:"
echo "   - Nginx will proxy requests to your PM2 app"
echo "   - External access will work"
echo "   - Default Nginx page will be removed"
echo ""

echo "✅ After this, your app will be accessible!"
