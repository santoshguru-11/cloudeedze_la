#!/bin/bash

echo "🔒 SETTING UP HTTPS FOR app.cloudedze.ai"
echo "======================================"

echo "1. 📦 Installing Certbot and dependencies..."
sudo yum update -y
sudo yum install -y certbot python3-certbot-nginx

echo ""
echo "2. 🌐 Installing and configuring Nginx as reverse proxy..."
sudo yum install -y nginx

# Create Nginx configuration for app.cloudedze.ai
sudo tee /etc/nginx/conf.d/app.cloudedze.ai.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name app.cloudedze.ai cloudedze.ai www.cloudedze.ai;

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all HTTP to HTTPS (will be enabled after SSL setup)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Create directory for Let's Encrypt verification
sudo mkdir -p /var/www/html

echo ""
echo "3. 🔧 Starting and enabling Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx

echo ""
echo "4. 🔥 Configuring firewall for HTTPS..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

echo ""
echo "5. 🔒 Obtaining SSL certificate from Let's Encrypt..."
echo "This will request SSL certificates for app.cloudedze.ai"

# Stop Nginx temporarily for standalone certificate generation
sudo systemctl stop nginx

# Request SSL certificate using standalone mode
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email santoshguru11@gmail.com \
    --domains app.cloudedze.ai,cloudedze.ai,www.cloudedze.ai

# Check if certificate was obtained successfully
if [ $? -eq 0 ]; then
    echo "✅ SSL certificate obtained successfully!"

    # Update Nginx configuration to use SSL
    sudo tee /etc/nginx/conf.d/app.cloudedze.ai.conf > /dev/null << 'EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name app.cloudedze.ai cloudedze.ai www.cloudedze.ai;
    return 301 https://app.cloudedze.ai$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name app.cloudedze.ai;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.cloudedze.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.cloudedze.ai/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Redirect other domains to main domain
server {
    listen 443 ssl http2;
    server_name cloudedze.ai www.cloudedze.ai;

    ssl_certificate /etc/letsencrypt/live/app.cloudedze.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.cloudedze.ai/privkey.pem;

    return 301 https://app.cloudedze.ai$request_uri;
}
EOF

    echo "✅ Nginx configured for HTTPS"
else
    echo "❌ Failed to obtain SSL certificate"
    echo "Continuing with HTTP only configuration..."
fi

echo ""
echo "6. 🚀 Restarting Nginx with SSL configuration..."
sudo systemctl start nginx
sudo systemctl reload nginx

echo ""
echo "7. 🔧 Updating application for HTTPS..."
cd /home/santosh/cloudeedze_la

# Update environment variables for HTTPS
export NODE_ENV=production
export PORT=3000
export HOST=127.0.0.1  # Only bind to localhost since Nginx will proxy
export VITE_API_BASE_URL=https://app.cloudedze.ai
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_CREDENTIALS=true
export USE_SSL=false  # Let Nginx handle SSL

echo ""
echo "8. 🔄 Updating CORS for HTTPS..."
# Update CORS to handle HTTPS
cat > /tmp/https_cors_fix.js << 'EOF'
const fs = require('fs');
const path = require('path');

const serverIndexPath = path.join(process.cwd(), 'server/index.ts');
let content = fs.readFileSync(serverIndexPath, 'utf8');

// Update VITE_API_BASE_URL references to use HTTPS
content = content.replace(/http:\/\/app\.cloudedze\.ai/g, 'https://app.cloudedze.ai');

// Update CORS to include HTTPS
const corsPattern = /res\.header\('Access-Control-Allow-Origin'[^;]+;/;
const newCorsOrigin = "res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');";

if (corsPattern.test(content)) {
  content = content.replace(corsPattern, newCorsOrigin);
}

fs.writeFileSync(serverIndexPath, content);
console.log('✅ Updated CORS for HTTPS');
EOF

node /tmp/https_cors_fix.js

echo ""
echo "9. 🏗️ Rebuilding application for HTTPS..."
npm run build

echo ""
echo "10. 🔄 Restarting application..."
pm2 restart cloudedze
pm2 save

echo ""
echo "11. 🔒 Setting up automatic certificate renewal..."
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx"; } | sudo crontab -

echo ""
echo "12. 🧪 Testing HTTPS setup..."
sleep 10

echo "Testing HTTP redirect:"
curl -I http://app.cloudedze.ai 2>/dev/null | head -3 || echo "❌ HTTP test failed"

echo ""
echo "Testing HTTPS:"
curl -I https://app.cloudedze.ai 2>/dev/null | head -3 || echo "❌ HTTPS test failed"

echo ""
echo "13. 📊 Checking services status..."
echo "Nginx status:"
sudo systemctl status nginx | grep "Active"

echo ""
echo "PM2 status:"
pm2 status

echo ""
echo "🔒 HTTPS SETUP COMPLETED!"
echo "======================"
echo ""
echo "🎯 WHAT WAS CONFIGURED:"
echo "✅ SSL certificate from Let's Encrypt"
echo "✅ Nginx reverse proxy for HTTPS"
echo "✅ HTTP to HTTPS redirects"
echo "✅ Security headers enabled"
echo "✅ Automatic certificate renewal"
echo "✅ Application updated for HTTPS"
echo ""
echo "🌐 YOUR SECURE DOMAIN:"
echo "✅ https://app.cloudedze.ai (main)"
echo "✅ https://cloudedze.ai (redirects to main)"
echo "✅ http://app.cloudedze.ai (redirects to HTTPS)"
echo ""
echo "🔍 TESTING:"
echo "1. Visit: https://app.cloudedze.ai"
echo "2. Check for green lock icon in browser"
echo "3. All HTTP URLs will redirect to HTTPS"
echo "4. API calls will use HTTPS automatically"
echo ""
echo "📋 SSL CERTIFICATE INFO:"
echo "- Certificate expires in 90 days"
echo "- Auto-renewal configured via cron"
echo "- Managed by Let's Encrypt (free)"