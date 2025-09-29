#!/bin/bash

# Cloudedze Deployment Diagnostic Script
echo "🔍 CLOUDEDZE DEPLOYMENT DIAGNOSTICS"
echo "=================================="
echo ""

echo "1. 📊 System Status:"
echo "-------------------"
echo "OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"')"
echo "Date: $(date)"
echo "Uptime: $(uptime -p)"
echo ""

echo "2. 🔧 Node.js & PM2 Status:"
echo "---------------------------"
echo "Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"
echo "NPM version: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "PM2 version: $(pm2 --version 2>/dev/null || echo 'Not installed')"
echo ""

echo "3. 🗄️ Database Status:"
echo "---------------------"
sudo systemctl status postgresql --no-pager -l | head -10
echo ""
echo "Database processes:"
ps aux | grep postgres | grep -v grep
echo ""

echo "4. 📁 Application Directory:"
echo "----------------------------"
if [ -d "$HOME/cloudedze" ]; then
    echo "✅ Application directory exists: $HOME/cloudedze"
    ls -la "$HOME/cloudedze" | head -10
    echo ""

    if [ -f "$HOME/cloudedze/package.json" ]; then
        echo "✅ package.json exists"
    else
        echo "❌ package.json missing"
    fi

    if [ -d "$HOME/cloudedze/dist" ]; then
        echo "✅ dist directory exists"
        ls -la "$HOME/cloudedze/dist" | head -5
    else
        echo "❌ dist directory missing - build may have failed"
    fi

    if [ -f "$HOME/cloudedze/.env" ]; then
        echo "✅ .env file exists"
        echo "Environment variables (sanitized):"
        cat "$HOME/cloudedze/.env" | sed 's/=.*/=***/' | head -10
    else
        echo "❌ .env file missing"
    fi
else
    echo "❌ Application directory NOT found: $HOME/cloudedze"
fi
echo ""

echo "5. 🚀 PM2 Process Status:"
echo "------------------------"
pm2 list 2>/dev/null || echo "PM2 not running or not installed"
pm2 logs cloudedze --lines 10 --nostream 2>/dev/null || echo "No PM2 logs for cloudedze"
echo ""

echo "6. 🌐 Network & Port Status:"
echo "----------------------------"
echo "Port 3000 usage:"
netstat -tlnp | grep :3000 || echo "Port 3000 not in use"
echo ""
echo "Firewall status:"
sudo firewall-cmd --list-ports 2>/dev/null || echo "Firewall not configured"
echo ""

echo "7. 🔍 Application Logs (if available):"
echo "--------------------------------------"
if [ -f "$HOME/cloudedze/nohup.out" ]; then
    echo "Last 10 lines of nohup.out:"
    tail -10 "$HOME/cloudedze/nohup.out"
else
    echo "No nohup.out found"
fi
echo ""

echo "8. 📡 Connectivity Test:"
echo "-----------------------"
echo "Testing localhost:3000..."
curl -I http://localhost:3000 2>/dev/null || echo "❌ Cannot connect to localhost:3000"
echo ""

echo "9. 💾 Disk Space:"
echo "----------------"
df -h / | tail -1
echo ""

echo "10. 🔗 Git Repository Status:"
echo "-----------------------------"
if [ -d "$HOME/cloudedze/.git" ]; then
    cd "$HOME/cloudedze"
    echo "Current branch: $(git branch --show-current 2>/dev/null || echo 'Unknown')"
    echo "Last commit: $(git log -1 --oneline 2>/dev/null || echo 'No commits')"
else
    echo "Not a git repository"
fi
echo ""

echo "🎯 QUICK FIXES TO TRY:"
echo "====================="
echo "If PM2 not running:"
echo "  cd ~/cloudedze && pm2 start dist/index.js --name cloudedze"
echo ""
echo "If database issues:"
echo "  sudo systemctl start postgresql"
echo "  sudo systemctl enable postgresql"
echo ""
echo "If build missing:"
echo "  cd ~/cloudedze && npm install && npm run build"
echo ""
echo "If environment missing:"
echo "  cd ~/cloudedze && cp .env.production .env"
echo ""

echo "📋 Diagnostic complete! Share this output for further assistance."