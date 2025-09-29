#!/bin/bash

# Deploy Cloudedze to Production Server with SSL on Port 443
# Server: santosh@34.14.198.14
# Password: Padmaravi@123

SERVER_IP="34.14.198.14"
USER="santosh"
PASSWORD="Padmaravi@123"
SERVER_PATH="/home/santosh/cloudedze"

echo "🚀 Deploying Cloudedze to production server with SSL on port 443..."
echo "📡 Server: $USER@$SERVER_IP"
echo "📁 Path: $SERVER_PATH"

# Build the application locally
echo "🔨 Building application..."
npm run build

# Create deployment archive
echo "📦 Creating deployment archive..."
tar -czf cloudedze-deployment.tar.gz \
  dist/ \
  package.json \
  package-lock.json \
  ecosystem.config.cjs \
  start-server.sh \
  stop-server.sh \
  generate-ssl.sh \
  ssl/ \
  logs/ \
  --exclude=node_modules \
  --exclude=.git

echo "📤 Uploading to server..."
# Use sshpass for password authentication
sshpass -p "$PASSWORD" scp cloudedze-deployment.tar.gz $USER@$SERVER_IP:~/

echo "🔧 Setting up on server..."
sshpass -p "$PASSWORD" ssh $USER@$SERVER_IP << 'EOF'
  echo "🛑 Stopping PM2 processes..."
  pm2 stop all 2>/dev/null || echo "No PM2 processes running"
  pm2 delete all 2>/dev/null || echo "No PM2 processes to delete"
  
  echo "🛑 Stopping Nginx..."
  sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running or not installed"
  sudo pkill -f nginx 2>/dev/null || echo "No Nginx processes found"
  
  echo "🛑 Stopping any existing Node.js processes on port 443..."
  sudo lsof -ti:443 | xargs sudo kill -9 2>/dev/null || echo "No processes on port 443"
  
  # Create directory if it doesn't exist
  mkdir -p ~/cloudedze
  
  # Extract deployment
  cd ~/cloudedze
  tar -xzf ~/cloudedze-deployment.tar.gz
  
  # Install dependencies
  echo "📦 Installing dependencies..."
  npm install --production
  
  # Generate SSL certificates if they don't exist
  if [ ! -f ssl/server.key ] || [ ! -f ssl/server.crt ]; then
    echo "🔐 Generating SSL certificates..."
    ./generate-ssl.sh
  fi
  
  # Set proper permissions
  chmod +x start-server.sh stop-server.sh generate-ssl.sh
  chmod 600 ssl/server.key 2>/dev/null || true
  chmod 644 ssl/server.crt 2>/dev/null || true
  
  echo "🔐 Setting up SSL certificates with proper permissions..."
  sudo chown root:root ssl/server.key ssl/server.crt 2>/dev/null || true
  sudo chmod 644 ssl/server.key ssl/server.crt 2>/dev/null || true
  
  # Stop any existing server
  ./stop-server.sh
  
  echo "🌐 Starting HTTPS server on port 443 with SSL..."
  # Use sudo to bind to port 443
  sudo -E ./start-server.sh &
  
  # Wait a moment for server to start
  sleep 3
  
  # Check if server is running
  if sudo lsof -i :443 >/dev/null 2>&1; then
    echo "✅ Server is running on port 443"
  else
    echo "❌ Server failed to start on port 443"
    echo "📋 Trying to start manually with sudo..."
    sudo -E NODE_ENV=production PORT=443 USE_SSL=true node dist/index.js &
  fi
  
  echo "✅ Deployment complete!"
  echo "🔗 Access your app at: https://34.14.198.14:443"
  echo "🔒 SSL is enabled with self-signed certificates"
EOF

# Clean up local archive
rm cloudedze-deployment.tar.gz

echo "🎉 Deployment completed successfully!"
echo "🌐 Your app is now running at: https://34.14.198.14:443"
echo "🔒 SSL is enabled (self-signed certificate)"
echo ""
echo "📋 Useful commands:"
echo "   Check server status: sshpass -p '$PASSWORD' ssh $USER@$SERVER_IP 'sudo lsof -i :443'"
echo "   View logs: sshpass -p '$PASSWORD' ssh $USER@$SERVER_IP 'tail -f ~/cloudedze/logs/server.log'"
echo "   Stop server: sshpass -p '$PASSWORD' ssh $USER@$SERVER_IP 'sudo pkill -f \"node dist/index.js\"'"
echo "   Restart server: sshpass -p '$PASSWORD' ssh $USER@$SERVER_IP 'cd ~/cloudedze && sudo -E ./start-server.sh'"
echo ""
echo "⚠️  Note: You'll see a browser warning about self-signed certificates - this is normal for development."
echo "   Click 'Advanced' and 'Proceed to site' to access your application."
