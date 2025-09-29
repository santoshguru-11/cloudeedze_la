#!/bin/bash

echo "🔧 Setting up Nginx and SSL for cloudedze.ai"
echo "============================================="
echo ""

echo "📋 Commands to run on your server:"
echo ""

echo "1. Install Nginx and Certbot:"
echo "   sudo yum update -y"
echo "   sudo yum install -y epel-release"
echo "   sudo yum install -y nginx certbot python3-certbot-nginx"
echo ""

echo "2. Start and enable Nginx:"
echo "   sudo systemctl start nginx"
echo "   sudo systemctl enable nginx"
echo ""

echo "3. Create Nginx configuration for cloudedze.ai:"
echo "   sudo nano /etc/nginx/conf.d/cloudedze.conf"
echo ""

echo "4. Add this configuration to the file:"
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

echo "5. Test Nginx configuration:"
echo "   sudo nginx -t"
echo ""

echo "6. Reload Nginx:"
echo "   sudo systemctl reload nginx"
echo ""

echo "7. Configure firewall:"
echo "   sudo firewall-cmd --permanent --add-service=http"
echo "   sudo firewall-cmd --permanent --add-service=https"
echo "   sudo firewall-cmd --reload"
echo ""

echo "8. Get SSL certificate:"
echo "   sudo certbot --nginx -d cloudedze.ai -d www.cloudedze.ai --non-interactive --agree-tos --email admin@cloudedze.ai"
echo ""

echo "9. Test SSL certificate renewal:"
echo "   sudo certbot renew --dry-run"
echo ""

echo "10. Check if everything is working:"
echo "    curl -I http://cloudedze.ai"
echo "    curl -I https://cloudedze.ai"
echo ""

echo "🎯 What this does:"
echo "   - Nginx listens on ports 80 and 443"
echo "   - Proxies requests to PM2 app on port 3000"
echo "   - SSL certificate for HTTPS"
echo "   - Automatic HTTP to HTTPS redirect"
echo ""

echo "✅ After this, cloudedze.ai will serve your PM2 application!"
