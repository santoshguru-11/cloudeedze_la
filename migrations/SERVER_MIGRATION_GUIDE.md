# Running Database Migrations on Server

This guide explains how to run database migrations on your production/remote server.

## Prerequisites

- SSH access to your server
- PostgreSQL installed and running
- Database already created
- Git installed on server

## Option 1: Quick SSH Method (Recommended)

### Step 1: Connect to Your Server

```bash
# SSH into your server
ssh username@your-server-ip

# Example:
# ssh santosh@34.14.198.14
```

### Step 2: Navigate to Project Directory

```bash
cd /path/to/cloudeedze_la

# Common paths:
# cd ~/cloudeedze_la
# cd /var/www/cloudeedze_la
# cd /home/santosh/cloudeedze_la
```

### Step 3: Pull Latest Code from GitHub

```bash
# Pull the latest migrations
git pull origin main

# Verify migrations folder exists
ls -la migrations/
```

### Step 4: Set Database Connection

```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'

# Or if your database is on a different host:
# export DATABASE_URL='postgresql://username:password@db-host:5432/database_name'
```

### Step 5: Run the Migration

```bash
# Navigate to migrations directory
cd migrations

# Make the script executable (if not already)
chmod +x run_migrations.sh

# Run the update migration
./run_migrations.sh all
```

This will:
- ✅ Update your database schema
- ✅ Add missing columns and tables
- ✅ Verify the migration succeeded
- ✅ Show you a summary report

### Step 6: Restart Your Application

```bash
# If using PM2
pm2 restart cloudeedze

# If using systemd
sudo systemctl restart cloudeedze

# If running directly with npm
npm run build
pm2 restart all
```

---

## Option 2: Manual psql Method

If the shell script doesn't work, you can run SQL files directly:

### Step 1: Connect to Server and Pull Code

```bash
ssh username@your-server-ip
cd /path/to/cloudeedze_la
git pull origin main
```

### Step 2: Run SQL Files with psql

```bash
# Set your database URL
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'

# Run update migration
psql "$DATABASE_URL" -f migrations/002_update_existing_schema.sql

# Verify it worked
psql "$DATABASE_URL" -f migrations/verify_schema.sql
```

---

## Option 3: Using .env File (Persistent)

### Step 1: Create/Update .env File on Server

```bash
ssh username@your-server-ip
cd /path/to/cloudeedze_la

# Edit .env file
nano .env
```

Add or update:
```bash
DATABASE_URL=postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 2: Load .env and Run Migration

```bash
# Load environment variables
source .env

# Or export from .env
export $(cat .env | xargs)

# Navigate to migrations
cd migrations

# Run migration
./run_migrations.sh all
```

---

## Option 4: Remote Execution (From Your Local Machine)

You can run migrations from your local machine without SSHing:

### Method A: SSH Command

```bash
# Run migration via SSH (single command)
ssh username@your-server-ip "cd /path/to/cloudeedze_la && git pull && export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer' && cd migrations && ./run_migrations.sh all"
```

### Method B: Using Expect Script

Create a file `remote-migrate.sh` on your local machine:

```bash
#!/bin/bash

SERVER_USER="username"
SERVER_IP="your-server-ip"
PROJECT_PATH="/path/to/cloudeedze_la"
DB_URL="postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer"

ssh ${SERVER_USER}@${SERVER_IP} << EOF
  cd ${PROJECT_PATH}
  git pull origin main
  export DATABASE_URL='${DB_URL}'
  cd migrations
  chmod +x run_migrations.sh
  ./run_migrations.sh all
EOF
```

Then run:
```bash
chmod +x remote-migrate.sh
./remote-migrate.sh
```

---

## Complete Step-by-Step Example

Here's a complete example for your server:

```bash
# 1. SSH into your server
ssh santosh@34.14.198.14

# 2. Navigate to project
cd ~/cloudeedze_la  # or wherever your project is

# 3. Backup database first (recommended!)
pg_dump -U cloud_cost_user cloud_cost_optimizer > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Pull latest code
git pull origin main

# 5. Set database connection
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'

# 6. Run migration
cd migrations
chmod +x run_migrations.sh
./run_migrations.sh all

# 7. Verify migration succeeded (check output)
# You should see:
#   ✓ users table exists
#   ✓ cloud_credentials table exists
#   ✓ inventory_scans table exists
#   ✓ scan_reports table exists
#   ✓ cost_analyses table exists
#   ✓ Database schema verification passed!

# 8. Restart application
cd ..
pm2 restart all  # or your restart command
```

---

## Troubleshooting

### Issue: Database Does Not Exist

**Error:** `psql: FATAL: database "cloud_cost_optimizer" does not exist`

**Solution:**
```bash
# Create the database, user, and pgcrypto extension (as superuser)
sudo -u postgres psql << EOF
CREATE USER cloud_cost_user WITH PASSWORD '1101';
CREATE DATABASE cloud_cost_optimizer OWNER cloud_cost_user;
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;

-- Connect to the database and create pgcrypto extension
\c cloud_cost_optimizer
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT USAGE ON SCHEMA public TO cloud_cost_user;
EOF

# Then run init mode (not update)
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'
cd migrations
./run_migrations.sh init
```

### Issue: Permission Denied to Create Extension

**Error:** `ERROR: permission denied to create extension "pgcrypto"`

**Solution:**
```bash
# Create the pgcrypto extension as postgres superuser
sudo -u postgres psql -d cloud_cost_optimizer << EOF
CREATE EXTENSION IF NOT EXISTS pgcrypto;
GRANT USAGE ON SCHEMA public TO cloud_cost_user;
EOF

# Then run the migration again
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'
cd migrations
./run_migrations.sh init
```

### Issue: Permission Denied on run_migrations.sh

**Solution:**
```bash
chmod +x migrations/run_migrations.sh
```

### Issue: DATABASE_URL not set

**Solution:**
```bash
# Check if it's set
echo $DATABASE_URL

# Set it
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'

# Or add to .bashrc for persistence
echo 'export DATABASE_URL="postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer"' >> ~/.bashrc
source ~/.bashrc
```

### Issue: psql command not found

**Solution:**
```bash
# On Ubuntu/Debian
sudo apt-get install postgresql-client

# On RedHat/CentOS
sudo yum install postgresql

# On Oracle Linux
sudo dnf install postgresql
```

### Issue: Permission denied connecting to database

**Solution:**
```bash
# Check if you can connect
psql -U cloud_cost_user -d cloud_cost_optimizer -c "SELECT version();"

# If password fails, check pg_hba.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Add or modify:
# local   all   cloud_cost_user   md5
# host    all   cloud_cost_user   127.0.0.1/32   md5
```

### Issue: Migration fails partway through

**Solution:**
```bash
# Migrations are idempotent, safe to run again
./run_migrations.sh all

# Or verify what's missing
./run_migrations.sh verify
```

---

## Verification

After running migrations, verify everything worked:

### 1. Check Database Tables

```bash
psql "$DATABASE_URL" -c "\dt"
```

You should see:
- sessions
- users
- cloud_credentials
- inventory_scans
- scan_reports
- cost_analyses

### 2. Check Specific Columns

```bash
# Check users table has role column
psql "$DATABASE_URL" -c "\d users"

# Check inventory_scans has status column
psql "$DATABASE_URL" -c "\d inventory_scans"
```

### 3. Check Application Logs

```bash
# Check PM2 logs
pm2 logs cloudeedze

# Check for database errors
pm2 logs cloudeedze --err
```

### 4. Test Application

```bash
# Check if app is running
curl http://localhost:3000/api/auth/user

# Check health endpoint (if you have one)
curl http://localhost:3000/health
```

---

## Best Practices for Production

### 1. Always Backup First

```bash
# Create a backup before migration
pg_dump "$DATABASE_URL" > backup_before_migration_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh backup_*.sql
```

### 2. Test in Development First

```bash
# On your local machine, test the migration
export DATABASE_URL='postgresql://localhost/test_db'
./run_migrations.sh all
```

### 3. Use a Maintenance Window

```bash
# Put app in maintenance mode (if you have this feature)
pm2 stop cloudeedze

# Run migration
cd migrations
./run_migrations.sh all

# Restart app
pm2 start cloudeedze
```

### 4. Monitor After Migration

```bash
# Watch logs for errors
pm2 logs cloudeedze --lines 100

# Check database connections
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = 'cloud_cost_optimizer';"
```

---

## Quick Reference Commands

```bash
# Full migration process (one command)
ssh user@server "cd /path/to/project && git pull && export DATABASE_URL='postgresql://...' && cd migrations && ./run_migrations.sh all && pm2 restart all"

# Just verify database
ssh user@server "cd /path/to/project && export DATABASE_URL='postgresql://...' && cd migrations && ./run_migrations.sh verify"

# Rollback (restore from backup)
ssh user@server "psql 'postgresql://...' < backup_YYYYMMDD_HHMMSS.sql"
```

---

## Common Database URLs

```bash
# Local PostgreSQL
DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'

# Remote PostgreSQL
DATABASE_URL='postgresql://cloud_cost_user:1101@db.example.com:5432/cloud_cost_optimizer'

# With SSL
DATABASE_URL='postgresql://cloud_cost_user:1101@db.example.com:5432/cloud_cost_optimizer?sslmode=require'

# Docker PostgreSQL
DATABASE_URL='postgresql://cloud_cost_user:1101@postgres:5432/cloud_cost_optimizer'
```

---

## Need Help?

If you encounter issues:

1. Check the migration output for specific errors
2. Run `./run_migrations.sh verify` to see what's missing
3. Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*-main.log`
4. Verify database connection: `psql "$DATABASE_URL" -c "SELECT version();"`
5. Check application logs: `pm2 logs cloudeedze`
