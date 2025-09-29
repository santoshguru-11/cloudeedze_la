#!/bin/bash

# Create logs directory
mkdir -p /home/santosh/cloudedze-app/logs

# Kill any existing processes
pkill -f "node.*index" || true
sleep 2

# Start with PM2
cd /home/santosh/cloudedze-app
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup

echo "Application started with PM2"
pm2 status
