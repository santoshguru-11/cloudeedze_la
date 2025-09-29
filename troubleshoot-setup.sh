#!/bin/bash

echo "🔍 Troubleshooting cloudedze.ai Setup"
echo "===================================="
echo ""

echo "📋 Diagnostic commands to run on your server:"
echo ""

echo "1. Check if PM2 is running:"
echo "   pm2 status"
echo ""

echo "2. Check if your app is listening on port 3000:"
echo "   netstat -tlnp | grep 3000"
echo "   # OR"
echo "   ss -tlnp | grep 3000"
echo ""

echo "3. Test if your app responds locally:"
echo "   curl -I http://localhost:3000"
echo ""

echo "4. Check Nginx status:"
echo "   sudo systemctl status nginx"
echo ""

echo "5. Check Nginx configuration:"
echo "   sudo nginx -t"
echo ""

echo "6. Check if Nginx is listening on port 80:"
echo "   netstat -tlnp | grep 80"
echo "   # OR"
echo "   ss -tlnp | grep 80"
echo ""

echo "7. Check Nginx error logs:"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""

echo "8. Check if domain resolves to your server:"
echo "   nslookup cloudedze.ai"
echo ""

echo "9. Test external access:"
echo "   curl -I http://34.14.198.14"
echo ""

echo "10. Check firewall status:"
echo "    sudo firewall-cmd --list-all"
echo ""

echo "🔧 Common fixes:"
echo ""

echo "If PM2 is not running:"
echo "   cd /home/santosh/cloudedze"
echo "   pm2 start ecosystem.config.cjs"
echo "   pm2 save"
echo ""

echo "If port 3000 is not listening:"
echo "   # Check PM2 logs"
echo "   pm2 logs cloudedze"
echo "   # Restart PM2"
echo "   pm2 restart cloudedze"
echo ""

echo "If Nginx is not working:"
echo "   # Check config syntax"
echo "   sudo nginx -t"
echo "   # Reload Nginx"
echo "   sudo systemctl reload nginx"
echo ""

echo "If domain doesn't resolve:"
echo "   # Check DNS settings in your domain registrar"
echo "   # Make sure cloudedze.ai points to 34.14.198.14"
echo ""

echo "🚨 Quick fix - Restart everything:"
echo "   pm2 restart cloudedze"
echo "   sudo systemctl restart nginx"
echo "   sudo systemctl restart firewalld"
echo ""

echo "Run these commands and let me know the output!"
