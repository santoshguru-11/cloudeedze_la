# 🚀 Production Setup Guide for cloudedze.ai

## Overview
Set up your server (34.14.198.14) with SSL certificate, Nginx, and PM2 for production deployment.

## Prerequisites
- Domain `cloudedze.ai` should point to `34.14.198.14`
- Server access with sudo privileges
- Ports 80 and 443 open in firewall

## Step 1: Install SSL Certificate (Let's Encrypt)

```bash
# Connect to your server
ssh santosh@34.14.198.14

# Update system
sudo yum update -y

# Install EPEL repository
sudo yum install -y epel-release

# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Install Nginx
sudo yum install -y nginx

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 2: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/conf.d/cloudedze.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name cloudedze.ai www.cloudedze.ai;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

## Step 3: Get SSL Certificate

```bash
# Get SSL certificate
sudo certbot --nginx -d cloudedze.ai -d www.cloudedze.ai --non-interactive --agree-tos --email admin@cloudedze.ai

# Test certificate renewal
sudo certbot renew --dry-run
```

## Step 4: Configure PM2 for Production

```bash
# Navigate to project directory
cd /home/santosh/cloudedze

# Create PM2 ecosystem configuration
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cloudedze',
    script: 'dist/index.js',
    cwd: '/home/santosh/cloudedze',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOST: 'localhost'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Install PM2 globally
sudo npm install -g pm2

# Stop existing processes
pm2 stop all
pm2 delete all

# Start with new configuration
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 startup script
pm2 startup
# Follow the instructions provided by the above command
```

## Step 5: Configure Firewall

```bash
# Configure firewall
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## Step 6: Verify Setup

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate
sudo certbot certificates

# Test your application
curl -I https://cloudedze.ai
```

## Step 7: Domain Configuration

Make sure your domain `cloudedze.ai` has these DNS records:
```
A Record: cloudedze.ai → 34.14.198.14
A Record: www.cloudedze.ai → 34.14.198.14
```

## Monitoring Commands

```bash
# View PM2 logs
pm2 logs cloudedze

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Monitor system resources
pm2 monit

# Restart application
pm2 restart cloudedze

# Reload Nginx
sudo systemctl reload nginx
```

## Security Considerations

1. **Firewall**: Only ports 80, 443, and 22 should be open
2. **SSL**: Certificate auto-renews every 90 days
3. **Updates**: Regularly update system packages
4. **Backups**: Set up regular backups of your application

## Troubleshooting

### If SSL certificate fails:
```bash
# Check domain resolution
nslookup cloudedze.ai

# Check if port 80 is accessible
telnet 34.14.198.14 80
```

### If PM2 fails to start:
```bash
# Check logs
pm2 logs cloudedze

# Check Node.js version
node --version

# Rebuild application
npm run build
pm2 restart cloudedze
```

### If Nginx fails:
```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

## Final Result

After completing these steps:
- ✅ https://cloudedze.ai will serve your application
- ✅ SSL certificate automatically renews
- ✅ PM2 runs your app in cluster mode
- ✅ Nginx handles SSL termination and load balancing
- ✅ Application restarts automatically if it crashes

Your Cloudedze application will be production-ready! 🎉
