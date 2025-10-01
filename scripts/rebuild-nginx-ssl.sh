#!/bin/bash

# Nginx and SSL Rebuild Script for CloudEdze
# Usage: sudo ./scripts/rebuild-nginx-ssl.sh your-email@example.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# Check if email is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Email address is required${NC}"
    echo "Usage: sudo $0 your-email@example.com"
    exit 1
fi

EMAIL="$1"
DOMAIN="app.cloudedze.ai"

echo -e "${GREEN}=== CloudEdze Nginx and SSL Rebuild ===${NC}\n"

# Step 1: Stop Nginx
echo -e "${YELLOW}[1/9] Stopping Nginx...${NC}"
systemctl stop nginx || true

# Step 2: Remove old configurations
echo -e "${YELLOW}[2/9] Removing old Nginx configurations...${NC}"
rm -f /etc/nginx/conf.d/app.cloudedze.ai.conf
rm -f /etc/nginx/sites-enabled/default
rm -f /etc/nginx/sites-available/default

# Step 3: Remove old SSL certificates
echo -e "${YELLOW}[3/9] Removing old SSL certificates...${NC}"
certbot delete --cert-name $DOMAIN --non-interactive || echo "No certificate found to delete"

# Step 4: Install/Update required packages
echo -e "${YELLOW}[4/9] Installing required packages...${NC}"
yum install -y nginx certbot python3-certbot-nginx

# Step 5: Create webroot directory
echo -e "${YELLOW}[5/9] Creating webroot directory...${NC}"
mkdir -p /var/www/html
chown -R nginx:nginx /var/www/html

# Step 6: Create initial HTTP-only Nginx config
echo -e "${YELLOW}[6/9] Creating initial Nginx configuration...${NC}"
cat > /etc/nginx/conf.d/$DOMAIN.conf <<'EOF'
server {
    listen 80;
    server_name app.cloudedze.ai;

    # Let's Encrypt challenge location
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Proxy all other requests to Node.js
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
    }
}
EOF

# Test and start Nginx
echo -e "${YELLOW}[7/9] Testing and starting Nginx...${NC}"
nginx -t
systemctl start nginx
systemctl enable nginx

# Configure firewall
echo -e "${YELLOW}[8/9] Configuring firewall...${NC}"
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Obtain SSL certificate
echo -e "${YELLOW}[9/9] Obtaining SSL certificate from Let's Encrypt...${NC}"
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL --redirect

# Create final optimized configuration
echo -e "${YELLOW}Creating optimized HTTPS configuration...${NC}"
cat > /etc/nginx/conf.d/$DOMAIN.conf <<'EOF'
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name app.cloudedze.ai;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name app.cloudedze.ai;

    ssl_certificate /etc/letsencrypt/live/app.cloudedze.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.cloudedze.ai/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API endpoints with extended timeouts
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        add_header Cache-Control "no-store, no-cache, must-revalidate" always;

        proxy_connect_timeout 600s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }

    # Static files and frontend
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
    }
}
EOF

# Test and reload
nginx -t
systemctl reload nginx

# Display certificate info
echo -e "\n${GREEN}=== SSL Certificate Information ===${NC}"
certbot certificates

# Test HTTPS
echo -e "\n${GREEN}=== Testing HTTPS Connection ===${NC}"
curl -I https://$DOMAIN 2>&1 | head -n 5

echo -e "\n${GREEN}✅ Nginx and SSL setup complete!${NC}"
echo -e "${GREEN}Your site is now available at: https://$DOMAIN${NC}"
echo -e "\n${YELLOW}Note: SSL certificate will auto-renew. Check with: certbot renew --dry-run${NC}\n"
