#!/bin/bash

echo "🔧 Fixing PM2 Configuration for ES Modules"
echo "=========================================="
echo ""

echo "📋 Commands to run on your server:"
echo ""

echo "1. Connect to your server:"
echo "   ssh santosh@34.14.198.14"
echo ""

echo "2. Navigate to your project:"
echo "   cd /home/santosh/cloudedze"
echo ""

echo "3. Remove the old ecosystem.config.js:"
echo "   rm ecosystem.config.js"
echo ""

echo "4. Create the correct ecosystem.config.cjs file:"
echo "   cat > ecosystem.config.cjs << 'EOF'"
echo "module.exports = {"
echo "  apps: [{"
echo "    name: 'cloudedze',"
echo "    script: 'dist/index.js',"
echo "    cwd: '/home/santosh/cloudedze',"
echo "    instances: 'max',"
echo "    exec_mode: 'cluster',"
echo "    env: {"
echo "      NODE_ENV: 'production',"
echo "      PORT: 3000,"
echo "      HOST: 'localhost'"
echo "    },"
echo "    error_file: './logs/err.log',"
echo "    out_file: './logs/out.log',"
echo "    log_file: './logs/combined.log',"
echo "    time: true,"
echo "    max_memory_restart: '1G',"
echo "    restart_delay: 4000,"
echo "    max_restarts: 10,"
echo "    min_uptime: '10s'"
echo "  }]"
echo "};"
echo "EOF"
echo ""

echo "5. Create logs directory:"
echo "   mkdir -p logs"
echo ""

echo "6. Stop any existing PM2 processes:"
echo "   pm2 stop all"
echo "   pm2 delete all"
echo ""

echo "7. Start with the correct configuration:"
echo "   pm2 start ecosystem.config.cjs"
echo ""

echo "8. Save PM2 configuration:"
echo "   pm2 save"
echo ""

echo "9. Set up PM2 startup (run the command it provides):"
echo "   pm2 startup"
echo ""

echo "10. Check status:"
echo "    pm2 status"
echo ""

echo "🎯 The key fix:"
echo "   - Rename ecosystem.config.js to ecosystem.config.cjs"
echo "   - This tells PM2 to treat it as CommonJS instead of ES module"
echo ""

echo "✅ After this, PM2 will start successfully!"
