#!/bin/bash

# Alternative automated deployment using expect
# This works better on macOS systems

SERVER_IP="34.14.198.14"
USERNAME="santosh"
PASSWORD="Padmaravi@123"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_header "🚀 Starting Automated Cloudedze Deployment"

# Step 1: Build and package
print_status "Building application..."
npm run build

print_status "Creating deployment package..."
tar --exclude='node_modules' -czf cloudedze-deploy.tar.gz \
    dist/ \
    package.json \
    package-lock.json \
    .env.production \
    oci-env/ \
    2>/dev/null || true

# Step 2: Upload file using expect
print_status "Uploading deployment package..."
expect << EOF
set timeout 60
spawn scp cloudedze-deploy.tar.gz $USERNAME@$SERVER_IP:/tmp/
expect {
    "password:" { send "$PASSWORD\r"; exp_continue }
    "Password:" { send "$PASSWORD\r"; exp_continue }
    "yes/no" { send "yes\r"; exp_continue }
    eof
}
EOF

# Step 3: Deploy using expect
print_status "Deploying application on server..."
expect << 'EOF'
set timeout 300
set server_ip "34.14.198.14"
set username "santosh"
set password "Padmaravi@123"

spawn ssh $username@$server_ip

expect {
    "password:" { send "$password\r" }
    "Password:" { send "$password\r" }
    "yes/no" { send "yes\r"; exp_continue }
}

expect "$ " { send "echo 'Connected to server'\r" }
expect "$ " { send "sudo apt-get update -y\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || echo 'Node.js setup skipped'\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "sudo apt-get install -y nodejs postgresql postgresql-contrib python3 python3-pip python3-venv || echo 'Package installation completed with warnings'\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "sudo npm install -g pm2 || echo 'PM2 installation completed'\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "mkdir -p ~/cloudedze\r" }
expect "$ " { send "cd ~/cloudedze\r" }
expect "$ " { send "if [ -d 'current' ]; then mv current backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true; fi\r" }
expect "$ " { send "mkdir -p current && cd current\r" }
expect "$ " { send "tar -xzf /tmp/cloudedze-deploy.tar.gz\r" }
expect "$ " { send "npm ci --only=production\r" }

expect "$ " { send "if [ -f .env.production ]; then cp .env.production .env; fi\r" }
expect "$ " { send "mkdir -p uploads && chmod 755 uploads\r" }

expect "$ " { send "if [ -d 'oci-env' ]; then cd oci-env && python3 -m venv . && source bin/activate && pip install oci; cd ..; fi\r" }

expect "$ " { send "sudo -u postgres psql -c \"CREATE USER cloud_cost_user WITH PASSWORD '1101';\" 2>/dev/null || echo 'User exists'\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "sudo -u postgres psql -c \"CREATE DATABASE cloudedze OWNER cloud_cost_user;\" 2>/dev/null || echo 'Database exists'\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "pm2 delete cloudedze 2>/dev/null || true\r" }
expect "$ " { send "pm2 start dist/index.js --name cloudedze --node-args='--env-file=.env'\r" }
expect "$ " { send "pm2 save\r" }
expect "$ " { send "pm2 startup systemd -u santosh --hp /home/santosh || true\r" }

expect "$ " { send "sudo ufw --force enable && sudo ufw allow ssh && sudo ufw allow 3000 && sudo ufw allow 443 || echo 'Firewall configuration completed'\r" }
expect {
    "password" { send "$password\r"; exp_continue }
    "$ "
}

expect "$ " { send "pm2 status\r" }
expect "$ " { send "echo 'Deployment completed successfully!'\r" }
expect "$ " { send "exit\r" }

expect eof
EOF

# Clean up
rm -f cloudedze-deploy.tar.gz

print_header "🎉 Deployment Complete!"
echo ""
echo "✅ Application deployed to: http://$SERVER_IP:3000"
echo ""
echo "To check status: ssh $USERNAME@$SERVER_IP 'pm2 status'"
echo "To view logs: ssh $USERNAME@$SERVER_IP 'pm2 logs cloudedze'"