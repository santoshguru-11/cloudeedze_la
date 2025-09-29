#!/bin/bash
echo "Installing Node.js on Oracle Linux..."

# Method 1: Using DNF module (recommended)
sudo dnf module install -y nodejs:20/common

# Method 2: If above fails, use NodeSource repository
if ! node --version 2>/dev/null; then
    echo "Trying alternative installation..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi

# Verify installation
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install PM2
sudo npm install -g pm2

echo "✅ Node.js and PM2 installation completed!"