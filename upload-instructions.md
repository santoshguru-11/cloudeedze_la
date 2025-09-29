# Cloudedze Server Deployment Instructions

## Manual Upload and Deployment

Since SSH key authentication is not set up, here are the manual steps to deploy Cloudedze to your server:

### Step 1: Upload Files to Server

You have several options to upload the files:

#### Option A: Using SCP with password authentication
```bash
# Upload the deployment package
scp cloudedze-deployment-20250923-230749.tar.gz santosh@34.14.198.14:/tmp/

# Upload the server deployment script
scp server-deploy.sh santosh@34.14.198.14:/tmp/
```

#### Option B: Using SFTP
```bash
sftp santosh@34.14.198.14
put cloudedze-deployment-20250923-230749.tar.gz /tmp/
put server-deploy.sh /tmp/
quit
```

#### Option C: Using rsync
```bash
rsync -avz cloudedze-deployment-20250923-230749.tar.gz santosh@34.14.198.14:/tmp/
rsync -avz server-deploy.sh santosh@34.14.198.14:/tmp/
```

### Step 2: Deploy on Server

SSH into your server and run the deployment script:

```bash
# SSH into your server
ssh santosh@34.14.198.14

# Make the script executable
chmod +x /tmp/server-deploy.sh

# Run the deployment script
/tmp/server-deploy.sh
```

### Step 3: Verify Deployment

After deployment, check if everything is working:

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs cloudedze

# Check if the application is accessible
curl http://localhost:3000

# Check Nginx status
sudo systemctl status nginx
```

### Step 4: Access Your Application

Once deployed, your Cloudedze application will be available at:
- **URL**: http://34.14.198.14
- **Admin Panel**: http://34.14.198.14/admin (if configured)

### Troubleshooting

If you encounter any issues:

1. **Check PM2 logs**: `pm2 logs cloudedze`
2. **Check Nginx logs**: `sudo tail -f /var/log/nginx/error.log`
3. **Check database connection**: `sudo -u postgres psql -c "\l"`
4. **Restart services**: 
   - `pm2 restart cloudedze`
   - `sudo systemctl restart nginx`

### Files Included in Deployment

- Complete Cloudedze application code
- Database backup (`cloudedze_db_backup_20250920_033510.sql`)
- All configuration files
- Deployment scripts
- Package.json with all dependencies

The deployment script will automatically:
- Install all required system dependencies
- Set up PostgreSQL database
- Install Node.js dependencies
- Build the application
- Configure Nginx as reverse proxy
- Set up PM2 for process management
- Configure firewall rules
