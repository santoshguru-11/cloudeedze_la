#!/bin/bash

# SSH Key Setup Script
# Run this script on your server to enable SSH key authentication

set -e  # Exit on any error

echo "=========================================="
echo "  SSH Key Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Creating .ssh directory${NC}"
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo -e "${GREEN}✓ .ssh directory created${NC}"
echo ""

echo -e "${YELLOW}Step 2: Adding SSH public key to authorized_keys${NC}"
cat >> ~/.ssh/authorized_keys << 'EOF'
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDIJy2SW7JJTJBqIOkRcN/hnCXC0giTakWJ5ci5MvGFT7EAYOgWknCvfuzAsbUGjct56c8DjsocaRQkHbj7vRYt0N+/Mup+0/3rKV+SQLrH1elKwBzM4MphNQA9BlqFY9ymlFjdiLT8RGN6vu1CFOXI/hBAkl2EgcEHDvtySc7/cGK9r6wmg+/vxoEKYnJUx6b/6164QrfRHzvY+djeeo+67iQpcWL5EbBe8pKPMCyzlp4XdK2JDniWCUXFucfhbTBYLkNrf7hmBWfjufW0y4tOLhszV5I5yCa5n4DG+42yyvqXWlmj0FuGYfZtJHk6U5NDl9Z/3k80GJ8ecH6wqDhJdMlBzNY7fAQ2L/zZuUzM4gbT3lWLziY1U7U+RV/iQY1duEJeEaQsN3t0X5H0o8EvmTvOo5s/n/7nsOlOLhUWN7WBPOudDPX+5wYHDDMcRsAsC6IZUJ4O8YqX8ETHjbdXJIRLKUcgzEwuRSQcl4k3Nu22PcbxpEiw2xPBKzxq3W+AoFNvN8CnAi5pSLcxkaVNjslPsWsKtKbEyYr62bfcTzq1h+SZX5cRfirx4ZSScOa+CHl1EjFS0YxOaA86aGUlGpKeZRfBLQyt8rr+krcCh2aLt1rPIVzA+GGI/eFuyscL/pYgD9/fjmx8LtvGiaCVNtPkFTQ8Hcm1RLbeukZJoQ== santosh@cloudedze
EOF

echo -e "${GREEN}✓ SSH key added${NC}"
echo ""

echo -e "${YELLOW}Step 3: Setting correct permissions${NC}"
chmod 600 ~/.ssh/authorized_keys
echo -e "${GREEN}✓ Permissions set${NC}"
echo ""

echo -e "${GREEN}=========================================="
echo "  SSH Key Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "You can now SSH into this server without a password!"
echo ""
