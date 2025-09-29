#!/bin/bash

# Cloudedze Server Startup Script
echo "Starting Cloudedze Server..."

# Set environment variables
export NODE_ENV=production
export PORT=443
export USE_SSL=true

# Create logs directory if it doesn't exist
mkdir -p logs

# Start the server with proper logging
nohup npm start > logs/server.log 2>&1 &

# Get the process ID
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"
echo $SERVER_PID > logs/server.pid

echo "Server is running on port 443"
echo "Logs are being written to logs/server.log"
echo "To stop the server, run: kill $SERVER_PID"
echo "Or use: ./stop-server.sh"
