#!/bin/bash

# Cloudedze Server Stop Script
echo "Stopping Cloudedze Server..."

if [ -f logs/server.pid ]; then
    SERVER_PID=$(cat logs/server.pid)
    if ps -p $SERVER_PID > /dev/null; then
        kill $SERVER_PID
        echo "Server stopped (PID: $SERVER_PID)"
        rm logs/server.pid
    else
        echo "Server process not found"
        rm logs/server.pid
    fi
else
    echo "No server PID file found"
fi

# Also kill any remaining node processes running on port 443
lsof -ti:443 | xargs kill -9 2>/dev/null || echo "No processes found on port 443"
