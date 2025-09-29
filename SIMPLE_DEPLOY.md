# 🔧 Simple Manual Deployment for Oracle Linux

## What We'll Do
Deploy Cloudedze step-by-step without automation to avoid any issues.

## Step 1: Upload Files Manually

### Option A: Create files directly on server
SSH to your server and create each file manually:

```bash
ssh santosh@34.14.198.14
mkdir -p ~/cloudedze-app
cd ~/cloudedze-app
```

### Option B: Use file transfer
Upload these files to your server:
- All files from `dist/` folder
- `package.json`
- `package-lock.json`
- `.env.production`
- Files from `oci-env/` folder

## Step 2: Install Dependencies on Server

```bash
# Install Node.js for Oracle Linux
sudo dnf module install -y nodejs:20/common

# Verify installation
node --version
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL
sudo dnf install -y postgresql postgresql-server

# Initialize PostgreSQL
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## Step 3: Setup Database

```bash
# Create database user
sudo -u postgres createuser -P cloudedze_user
# Enter password: cloudedze_password

# Create database
sudo -u postgres createdb -O cloudedze_user cloudedze

# Test connection
psql -h localhost -U cloudedze_user -d cloudedze -c "SELECT version();"
```

## Step 4: Prepare Application

```bash
cd ~/cloudedze-app

# Install app dependencies
npm install --production

# Setup environment file
cp .env.production .env

# Edit the .env file to update database URL:
nano .env
# Change DATABASE_URL to:
# DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze

# Create uploads directory
mkdir -p uploads
chmod 755 uploads
```

## Step 5: Start Application

```bash
# Start with PM2
pm2 start dist/index.js --name cloudedze

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions it shows

# Check status
pm2 status
```

## Step 6: Configure Firewall

```bash
# Open port 3000
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Verify
sudo firewall-cmd --list-all
```

## Test Your Application

```bash
# Test locally
curl http://localhost:3000

# Check from outside (replace with your IP)
curl http://34.14.198.14:3000
```

## Troubleshooting Commands

```bash
# Check PM2 logs
pm2 logs cloudedze

# Check if port is in use
sudo netstat -tlnp | grep :3000

# Check PostgreSQL status
sudo systemctl status postgresql

# Check firewall
sudo firewall-cmd --list-all

# Restart application
pm2 restart cloudedze
```

## If Something Goes Wrong

1. **Node.js not found:**
   ```bash
   sudo dnf install -y nodejs npm
   ```

2. **Database connection fails:**
   ```bash
   sudo systemctl restart postgresql
   sudo -u postgres psql -c "\l"
   ```

3. **Application won't start:**
   ```bash
   pm2 logs cloudedze
   # Check the error messages
   ```

4. **Port 3000 blocked:**
   ```bash
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```