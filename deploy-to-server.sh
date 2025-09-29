#!/bin/bash

# Deploy Cloudedze to Production Server
# Usage: ./deploy-to-server.sh

SERVER_IP="34.14.198.14"
USER="santosh"
SERVER_PATH="/home/santosh/cloudedze"

echo "🚀 Deploying Cloudedze to production server..."
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
scp cloudedze-deployment.tar.gz $USER@$SERVER_IP:~/

echo "🔧 Setting up on server..."
ssh $USER@$SERVER_IP << 'EOF'
  # Create directory if it doesn't exist
  mkdir -p ~/cloudedze
  
  # Extract deployment
  cd ~/cloudedze
  tar -xzf ~/cloudedze-deployment.tar.gz
  
  # Install dependencies
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
  
  # Stop any existing server
  ./stop-server.sh
  
  # Start the server
  echo "🌐 Starting HTTPS server on port 443..."
  ./start-server.sh
  
  echo "✅ Deployment complete!"
  echo "🔗 Access your app at: https://34.14.198.14:443"
EOF

# Clean up local archive
rm cloudedze-deployment.tar.gz

echo "🎉 Deployment completed successfully!"
echo "🌐 Your app is now running at: https://34.14.198.14:443"
echo ""
echo "📋 Useful commands:"
echo "   Check server status: ssh $USER@$SERVER_IP 'ps aux | grep node'"
echo "   View logs: ssh $USER@$SERVER_IP 'tail -f ~/cloudedze/logs/server.log'"
echo "   Stop server: ssh $USER@$SERVER_IP 'cd ~/cloudedze && ./stop-server.sh'"
echo "   Restart server: ssh $USER@$SERVER_IP 'cd ~/cloudedze && ./stop-server.sh && ./start-server.sh'"
