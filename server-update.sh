#!/bin/bash

echo "🔄 SERVER UPDATE SCRIPT"
echo "======================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Pulling latest changes from git...${NC}"
git pull origin main

echo ""
echo -e "${YELLOW}2. Installing dependencies...${NC}"
npm install

echo ""
echo -e "${YELLOW}3. Building application...${NC}"
npm run build

echo ""
echo -e "${YELLOW}4. Stopping PM2 process...${NC}"
pm2 stop cloudedze 2>/dev/null || echo "No existing process to stop"

echo ""
echo -e "${YELLOW}5. Starting application with PM2...${NC}"
pm2 start dist/index.js --name cloudedze

echo ""
echo -e "${YELLOW}6. Saving PM2 configuration...${NC}"
pm2 save

echo ""
echo -e "${GREEN}✅ SERVER UPDATE COMPLETED!${NC}"
echo ""
echo "📊 Application Status:"
pm2 list

echo ""
echo "📝 View logs with:"
echo "  pm2 logs cloudedze"
echo ""
echo "🌐 Access at:"
echo "  http://app.cloudedze.ai"
echo "  http://152.70.106.171:3000"
echo ""
