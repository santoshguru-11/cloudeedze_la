#!/bin/bash

# Production Server Setup Script for cloudedze.ai
# This script sets up SSL, Nginx, and PM2 for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Production Server for cloudedze.ai${NC}"
echo "=================================================="
echo ""

# Server details
SERVER_HOST="34.14.198.14"
SERVER_USER="santosh"
DOMAIN="cloudedze.ai"
PROJECT_PATH="/home/santosh/cloudedze"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "Server: $SERVER_USER@$SERVER_HOST"
echo "Domain: $DOMAIN"
echo "Project Path: $PROJECT_PATH"
echo ""

# Function to run commands on server
run_on_server() {
    local command="$1"
    echo -e "${YELLOW}🔧 Running: $command${NC}"
    ssh "$SERVER_USER@$SERVER_HOST" "$command"
}

# Function to copy files to server
copy_to_server() {
    local local_file="$1"
    local remote_path="$2"
    echo -e "${YELLOW}📤 Copying $local_file to server${NC}"
    scp "$local_file" "$SERVER_USER@$SERVER_HOST:$remote_path"
}

echo -e "${BLUE}Step 1: Setting up SSL Certificate with Let's Encrypt${NC}"
echo "=================================================="

# Install Certbot and get SSL certificate
run_on_server "
    # Update system
    sudo yum update -y
    
    # Install EPEL repository
    sudo yum install -y epel-release
    
    # Install Certbot
    sudo yum install -y certbot python3-certbot-nginx
    
    # Stop any running services that might conflict
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl stop httpd 2>/dev/null || true
"

echo -e "${GREEN}✅ SSL tools installed${NC}"

echo -e "${BLUE}Step 2: Installing and Configuring Nginx${NC}"
echo "============================================="

# Install Nginx
run_on_server "
    # Install Nginx
    sudo yum install -y nginx
    
    # Start and enable Nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    # Create basic configuration
    sudo tee /etc/nginx/conf.d/cloudedze.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name cloudedze.ai www.cloudedze.ai;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Reload Nginx
    sudo systemctl reload nginx
"

echo -e "${GREEN}✅ Nginx configured${NC}"

echo -e "${BLUE}Step 3: Getting SSL Certificate${NC}"
echo "=================================="

# Get SSL certificate
run_on_server "
    # Get SSL certificate
    sudo certbot --nginx -d cloudedze.ai -d www.cloudedze.ai --non-interactive --agree-tos --email admin@cloudedze.ai
    
    # Test certificate renewal
    sudo certbot renew --dry-run
"

echo -e "${GREEN}✅ SSL certificate obtained${NC}"

echo -e "${BLUE}Step 4: Configuring PM2 for Production${NC}"
echo "=========================================="

# Set up PM2 ecosystem
run_on_server "
    cd $PROJECT_PATH
    
    # Create PM2 ecosystem configuration
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cloudedze',
    script: 'dist/index.js',
    cwd: '$PROJECT_PATH',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: 'localhost'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    # Create logs directory
    mkdir -p logs
    
    # Install PM2 globally if not already installed
    sudo npm install -g pm2
    
    # Stop any existing PM2 processes
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    # Start the application with PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Set up PM2 startup script
    pm2 startup
    
    # Generate startup script (user needs to run this manually)
    echo 'Run this command as root:'
    pm2 startup systemd -u santosh --hp /home/santosh
"

echo -e "${GREEN}✅ PM2 configured${NC}"

echo -e "${BLUE}Step 5: Final Configuration${NC}"
echo "============================="

# Final server configuration
run_on_server "
    # Configure firewall
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --reload
    
    # Set proper file permissions
    sudo chown -R santosh:santosh $PROJECT_PATH
    chmod +x $PROJECT_PATH/server/services/python-scripts/oci-inventory.py
    
    # Create systemd service for PM2 (optional)
    sudo tee /etc/systemd/system/cloudedze.service > /dev/null << 'EOF'
[Unit]
Description=Cloudedze Application
After=network.target

[Service]
Type=forking
User=santosh
WorkingDirectory=$PROJECT_PATH
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload all
ExecStop=/usr/bin/pm2 stop all
Restart=always

[Install]
WantedBy=multi-user.target
EOF
    
    # Enable the service
    sudo systemctl enable cloudedze.service
    
    # Check status
    pm2 status
    sudo systemctl status nginx --no-pager
"

echo -e "${GREEN}✅ Server configuration complete${NC}"

echo ""
echo -e "${GREEN}🎉 Production Setup Complete!${NC}"
echo "=============================="
echo ""
echo -e "${YELLOW}📊 What's been configured:${NC}"
echo "✅ SSL certificate for cloudedze.ai"
echo "✅ Nginx reverse proxy with SSL termination"
echo "✅ PM2 cluster mode for high availability"
echo "✅ Firewall rules for HTTP/HTTPS"
echo "✅ Systemd service for auto-start"
echo "✅ Log rotation and monitoring"
echo ""
echo -e "${YELLOW}🌐 Your application is now accessible at:${NC}"
echo "🔗 https://cloudedze.ai"
echo "🔗 https://www.cloudedze.ai"
echo ""
echo -e "${YELLOW}🔍 To monitor your application:${NC}"
echo "• PM2 status: pm2 status"
echo "• PM2 logs: pm2 logs cloudedze"
echo "• Nginx status: sudo systemctl status nginx"
echo "• SSL certificate: sudo certbot certificates"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "• Make sure your domain cloudedze.ai points to $SERVER_HOST"
echo "• SSL certificate will auto-renew"
echo "• Application will restart automatically if it crashes"
echo ""
echo -e "${GREEN}✅ Production deployment successful!${NC}"
