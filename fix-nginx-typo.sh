#!/bin/bash

echo "🔧 Fixing Nginx Typo and Completing Setup"
echo "========================================="
echo ""

echo "📋 Correct commands to run on your server:"
echo ""

echo "1. Reload Nginx (correct spelling):"
echo "   sudo systemctl reload nginx"
echo ""

echo "2. Or restart Nginx:"
echo "   sudo systemctl restart nginx"
echo ""

echo "3. Check Nginx status:"
echo "   sudo systemctl status nginx"
echo ""

echo "4. Configure firewall for HTTPS:"
echo "   sudo firewall-cmd --permanent --add-service=http"
echo "   sudo firewall-cmd --permanent --add-service=https"
echo "   sudo firewall-cmd --reload"
echo ""

echo "5. Install Certbot for SSL:"
echo "   sudo yum install -y python3-pip"
echo "   sudo pip3 install certbot"
echo "   sudo pip3 install certbot-nginx"
echo ""

echo "6. Get SSL certificate:"
echo "   sudo certbot --nginx -d cloudedze.ai -d www.cloudedze.ai --non-interactive --agree-tos --email admin@cloudedze.ai"
echo ""

echo "7. Test the setup:"
echo "   curl -I http://cloudedze.ai"
echo "   curl -I https://cloudedze.ai"
echo ""

echo "🎯 The typo was:"
echo "   ❌ ngnix (incorrect)"
echo "   ✅ nginx (correct)"
echo ""

echo "✅ After running the correct commands, your HTTPS setup will be complete!"
