#!/bin/bash

# Docker deployment script for Oracle Linux
echo "🐳 Cloudedze Docker Deployment"
echo "============================="

# Install Docker on Oracle Linux
echo "Installing Docker..."
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink for docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

echo "Docker installation completed!"
echo "Please log out and log back in, then run:"
echo "docker-compose up -d"
echo ""
echo "Your application will be available at: http://34.14.198.14:3000"