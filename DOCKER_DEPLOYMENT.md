# 🐳 Cloudedze Docker Deployment Guide

## Quick Overview
This guide will help you deploy Cloudedze using Docker on your Oracle Linux server (34.14.198.14).

## 📦 Files Included
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Multi-service orchestration
- `docker-deploy.sh` - Installation script for Oracle Linux
- `cloudedze-docker-deploy.tar.gz` - Complete deployment package

## 🚀 Deployment Steps

### Step 1: Upload Deployment Package

Upload `cloudedze-docker-deploy.tar.gz` to your server:

**Option A: Using SCP**
```bash
scp cloudedze-docker-deploy.tar.gz santosh@34.14.198.14:~/
```

**Option B: Using SFTP/FileZilla**
- Connect to: `34.14.198.14`
- Username: `santosh`
- Password: `Padmaravi@123`
- Upload the tar.gz file

### Step 2: Connect to Your Server

```bash
ssh santosh@34.14.198.14
# Password: Padmaravi@123
```

### Step 3: Extract and Setup

```bash
# Extract deployment files
tar -xzf cloudedze-docker-deploy.tar.gz

# Make installation script executable
chmod +x docker-deploy.sh

# Install Docker (this will take a few minutes)
./docker-deploy.sh
```

### Step 4: Log Out and Back In

```bash
# Log out to apply Docker group permissions
exit

# Log back in
ssh santosh@34.14.198.14
```

### Step 5: Deploy Application

```bash
# Navigate to project directory
cd ~/

# Start the application
docker-compose up -d
```

## ✅ Verification

### Check if containers are running:
```bash
docker-compose ps
```

You should see:
- `cloudedze_app_1` - Running on port 3000
- `cloudedze_db_1` - PostgreSQL database

### Check application logs:
```bash
docker-compose logs app
```

### Test the application:
```bash
curl http://localhost:3000
```

## 🌐 Access Your Application

After successful deployment:
- **Application URL**: http://34.14.198.14:3000
- **Database**: PostgreSQL running in container
- **Persistent Data**: Stored in Docker volumes

## 🛠️ Management Commands

### View status:
```bash
docker-compose ps
```

### View logs:
```bash
# All services
docker-compose logs

# Just the app
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app
```

### Restart application:
```bash
docker-compose restart app
```

### Stop application:
```bash
docker-compose down
```

### Start application:
```bash
docker-compose up -d
```

### Update application:
```bash
# Stop current containers
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

## 🔧 Configuration

### Environment Variables
The application uses `.env.production` for configuration. Key settings:
- `DATABASE_URL`: Automatically configured for Docker
- `PORT`: Application port (3000)
- `NODE_ENV`: Set to production

### Database
- **Host**: `db` (Docker container name)
- **Database**: `cloudedze`
- **User**: `cloudedze_user`
- **Password**: `cloudedze_password`
- **Port**: `5432`

## 🔥 Firewall Configuration

Configure Oracle Linux firewall:
```bash
# Enable required ports
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

## 🚨 Troubleshooting

### Container won't start:
```bash
# Check logs
docker-compose logs

# Check Docker daemon
sudo systemctl status docker
```

### Permission issues:
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in
```

### Database connection issues:
```bash
# Check if database container is running
docker-compose ps

# Check database logs
docker-compose logs db
```

### Port already in use:
```bash
# Check what's using port 3000
sudo netstat -tlnp | grep :3000

# Kill the process or change port in docker-compose.yml
```

## 📊 Features Included

✅ **Excel to Infrastructure as Code**
- Upload Excel files at `/excel` endpoint
- Generate Terraform code
- Cost estimation and analysis

✅ **Cloud Integrations**
- OCI (Oracle Cloud Infrastructure)
- AWS, Azure, GCP support
- Resource discovery and analysis

✅ **Database**
- PostgreSQL with persistent storage
- Automatic schema setup
- Data persistence across restarts

✅ **Process Management**
- Docker container orchestration
- Automatic restart on failure
- Health monitoring

## 🎯 Production Considerations

### SSL/HTTPS Setup:
```bash
# Install Certbot for Let's Encrypt
sudo dnf install -y certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update docker-compose.yml to use SSL
# Add volume mounts for certificates
```

### Backup:
```bash
# Backup database
docker-compose exec db pg_dump -U cloudedze_user cloudedze > backup.sql

# Backup uploaded files
tar -czf uploads-backup.tar.gz uploads/
```

### Monitoring:
```bash
# System resource usage
docker stats

# Application health
curl http://localhost:3000/api/health
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify firewall settings
3. Ensure Docker is running: `sudo systemctl status docker`
4. Check available disk space: `df -h`

## 🎉 Success!

Once deployed successfully, your Cloudedze application will be running at:
**http://34.14.198.14:3000**

All features including Excel upload, OCI integration, and cloud cost analysis will be fully functional!