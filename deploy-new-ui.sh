#!/bin/bash

# Cloudedze Deployment Script
# This script pulls latest changes, builds, and deploys the new UI

set -e  # Exit on any error

echo "=========================================="
echo "  Cloudedze Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}Step 1: Checking current directory${NC}"
echo "Working in: $(pwd)"
echo ""

echo -e "${YELLOW}Step 2: Stashing local changes (if any)${NC}"
git stash
echo ""

echo -e "${YELLOW}Step 3: Pulling latest changes from GitHub${NC}"
git pull origin main
echo ""

echo -e "${YELLOW}Step 4: Installing/updating dependencies${NC}"
npm install
echo ""

echo -e "${YELLOW}Step 5: Building the application${NC}"
echo "This may take a few minutes..."
npm run build
echo ""

echo -e "${YELLOW}Step 6: Checking if dist folder was created${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Build successful! dist folder created${NC}"
    ls -lh dist/
else
    echo -e "${RED}✗ Build failed! dist folder not found${NC}"
    exit 1
fi
echo ""

echo -e "${YELLOW}Step 7: Checking PM2 status${NC}"
pm2 list
echo ""

echo -e "${YELLOW}Step 8: Restarting the application${NC}"
if pm2 restart cloudedze 2>/dev/null; then
    echo -e "${GREEN}✓ Application restarted via PM2${NC}"
elif pm2 restart all 2>/dev/null; then
    echo -e "${GREEN}✓ All PM2 processes restarted${NC}"
else
    echo -e "${YELLOW}! PM2 not found or no processes running${NC}"
    echo "You may need to start the server manually with:"
    echo "  npm start"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "  Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Visit https://app.cloudedze.ai/"
echo "2. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)"
echo "3. If old UI still shows, clear browser cache"
echo ""
echo "To check server logs:"
echo "  pm2 logs cloudedze"
echo ""
