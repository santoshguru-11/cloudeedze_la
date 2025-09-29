# Cloudedze Server Deployment Guide

## Prerequisites
- Server: 34.14.198.14
- Username: santosh
- Password: Padmaravi@123

## Step 1: Upload Files to Server

### Option A: Using SCP (from your local machine)
```bash
# Upload the deployment archive
scp cloudedze-deploy.tar.gz santosh@34.14.198.14:/tmp/
```

### Option B: Using SFTP (alternative)
```bash
sftp santosh@34.14.198.14
put cloudedze-deploy.tar.gz /tmp/
quit
```

## Step 2: Connect to Server
```bash
ssh santosh@34.14.198.14
```

## Step 3: Set Up Application on Server

```bash
# Create application directory
mkdir -p ~/cloudedze
cd ~/cloudedze

# Backup existing deployment (if any)
if [ -d "current" ]; then
    mv current backup-$(date +%Y%m%d-%H%M%S)
fi

# Extract new deployment
mkdir -p current
cd current
tar -xzf /tmp/cloudedze-deploy.tar.gz

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 process manager
sudo npm install -g pm2

# Install application dependencies
npm ci --only=production
```

## Step 4: Configure Environment

```bash
# Copy production environment file
cp .env.production .env

# Edit environment file with your specific settings
nano .env

# Important: Update these values in .env:
# - DATABASE_URL (your production database)
# - SESSION_SECRET (generate a secure random string)
# - ENCRYPTION_KEY (generate a secure random string)
# - JWT_SECRET (generate a secure random string)
# - Add your cloud provider credentials
```

## Step 5: Set Up Database (if needed)

If you haven't set up PostgreSQL yet:

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Create database user and database
sudo -u postgres psql
CREATE USER cloud_cost_user WITH PASSWORD '1101';
CREATE DATABASE cloudedze OWNER cloud_cost_user;
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloud_cost_user;
\q

# Run database migrations
cd ~/cloudedze/current
npm run db:push
```

## Step 6: Start Application

```bash
cd ~/cloudedze/current

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Start with PM2
pm2 start dist/index.js --name cloudedze --node-args="--env-file=.env"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions shown by the command above
```

## Step 7: Configure Firewall

```bash
# Allow port 3000 (or your configured port)
sudo ufw allow 3000

# If using SSL (port 443):
sudo ufw allow 443

# Allow SSH
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Step 8: Verify Deployment

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs cloudedze

# Test the application
curl http://localhost:3000

# Check if it's accessible from outside
curl http://34.14.198.14:3000
```

## Step 9: Optional - Set Up SSL and Domain

### Install Certbot for Let's Encrypt SSL:
```bash
sudo apt install certbot

# Get SSL certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com

# Update .env file:
# USE_SSL=true
# SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
# SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
# PORT=443

# Restart application
pm2 restart cloudedze
```

### Set Up Nginx Reverse Proxy (Optional):
```bash
sudo apt install nginx

# Create nginx configuration
sudo nano /etc/nginx/sites-available/cloudedze

# Add this configuration:
server {
    listen 80;
    server_name yourdomain.com;

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

# Enable the site
sudo ln -s /etc/nginx/sites-available/cloudedze /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Useful Commands

### Managing the Application:
```bash
# Check status
pm2 status

# View logs
pm2 logs cloudedze

# Restart application
pm2 restart cloudedze

# Stop application
pm2 stop cloudedze

# Start application
pm2 start cloudedze
```

### Monitoring:
```bash
# Real-time monitoring
pm2 monit

# View application metrics
pm2 show cloudedze
```

## Troubleshooting

1. **Application won't start**: Check logs with `pm2 logs cloudedze`
2. **Port already in use**: Check what's using the port with `sudo netstat -tlnp | grep :3000`
3. **Database connection issues**: Verify DATABASE_URL in .env file
4. **Permission errors**: Check file permissions with `ls -la`

## Access Your Application

After successful deployment:
- **Local access**: http://localhost:3000
- **External access**: http://34.14.198.14:3000
- **With domain**: http://yourdomain.com (after DNS configuration)

## Next Steps

1. Configure your domain's DNS to point to 34.14.198.14
2. Set up SSL certificate for HTTPS
3. Configure monitoring and backups
4. Set up environment-specific configurations
5. Add your cloud provider credentials in the .env file