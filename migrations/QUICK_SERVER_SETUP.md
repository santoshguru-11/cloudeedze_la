# Quick Server Migration Setup

**⚡ For when you need to update your server database fast!**

## 🚀 5-Minute Server Migration

### Copy-Paste This (Replace with your details):

```bash
# 1. SSH into your server
ssh your-username@your-server-ip

# 2. Navigate to project and pull latest code
cd ~/cloudeedze_la  # or your project path
git pull origin main

# 3. Backup database (optional but recommended)
pg_dump -U cloud_cost_user cloud_cost_optimizer > backup_$(date +%Y%m%d_%H%M%S).sql

# 4. Run migration
cd migrations
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'
chmod +x run_migrations.sh
./run_migrations.sh all

# 5. Restart app
cd ..
pm2 restart all
```

**Done!** ✅

---

## 📋 Your Server Details Template

Fill this out for your specific server:

```bash
# ============================================
# YOUR SERVER CONFIGURATION
# ============================================

# Server SSH Details
SERVER_USER="your-username"           # e.g., santosh
SERVER_IP="your-server-ip"            # e.g., 34.14.198.14
PROJECT_PATH="~/cloudeedze_la"        # or /var/www/cloudeedze_la

# Database Configuration
DB_USER="cloud_cost_user"
DB_PASSWORD="1101"
DB_NAME="cloud_cost_optimizer"
DB_HOST="localhost"
DB_PORT="5432"

# Full Database URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# PM2 App Name
PM2_APP_NAME="cloudeedze"             # or your app name in PM2
```

---

## 🎯 One-Command Remote Migration

**Run this from your local computer** (replace SERVER details):

```bash
ssh username@server-ip "cd ~/cloudeedze_la && git pull && export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer' && cd migrations && chmod +x run_migrations.sh && ./run_migrations.sh all && pm2 restart all"
```

Example:
```bash
ssh santosh@34.14.198.14 "cd ~/cloudeedze_la && git pull && export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer' && cd migrations && chmod +x run_migrations.sh && ./run_migrations.sh all && pm2 restart all"
```

---

## ✅ Verify Migration Success

After running, you should see:

```
========================================
Database Migration Complete
========================================
Current Record Counts:
  - Users: X
  - Cloud Credentials: X
  - Inventory Scans: X
  - Scan Reports: X
  - Cost Analyses: X

All tables and indexes are up to date!
========================================

========================================
Schema Verification Summary
========================================
  ✓ users table exists
  ✓ cloud_credentials table exists
  ✓ inventory_scans table exists
  ✓ scan_reports table exists
  ✓ cost_analyses table exists

✓ Database schema verification passed!
========================================
```

---

## 🆘 Quick Troubleshooting

### Problem: "database does not exist"
```bash
# Create the database first
sudo -u postgres psql << EOF
CREATE USER cloud_cost_user WITH PASSWORD '1101';
CREATE DATABASE cloud_cost_optimizer OWNER cloud_cost_user;
GRANT ALL PRIVILEGES ON DATABASE cloud_cost_optimizer TO cloud_cost_user;
EOF

# Then run init mode (not update)
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'
./run_migrations.sh init
```

### Problem: "Permission denied: run_migrations.sh"
```bash
chmod +x migrations/run_migrations.sh
```

### Problem: "DATABASE_URL not set"
```bash
export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'
```

### Problem: "Connection refused"
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start if needed
sudo systemctl start postgresql
```

### Problem: "Password authentication failed"
```bash
# Test connection
psql -U cloud_cost_user -d cloud_cost_optimizer

# If password is wrong, update it in DATABASE_URL
```

---

## 📞 Common Server Paths

Your project might be in one of these locations:

```bash
# Option 1: Home directory
cd ~/cloudeedze_la

# Option 2: Web server directory
cd /var/www/cloudeedze_la

# Option 3: Application directory
cd /opt/cloudeedze_la

# Option 4: User directory
cd /home/your-username/cloudeedze_la
```

---

## 🔄 Update Process (Step by Step)

1. **Connect to server**
   ```bash
   ssh username@server-ip
   ```

2. **Go to project**
   ```bash
   cd ~/cloudeedze_la
   ```

3. **Pull latest code**
   ```bash
   git pull origin main
   ```

4. **Set database URL**
   ```bash
   export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'
   ```

5. **Run migration**
   ```bash
   cd migrations
   ./run_migrations.sh all
   ```

6. **Restart app**
   ```bash
   pm2 restart all
   ```

---

## 💾 Backup Before Migration

**Always backup first!**

```bash
# Create backup
pg_dump -U cloud_cost_user cloud_cost_optimizer > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh backup_*.sql

# Restore if needed
psql -U cloud_cost_user cloud_cost_optimizer < backup_YYYYMMDD_HHMMSS.sql
```

---

## 🎬 Video Tutorial Steps

1. SSH into server
2. `cd ~/cloudeedze_la`
3. `git pull origin main`
4. `cd migrations`
5. `export DATABASE_URL='postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer'`
6. `./run_migrations.sh all`
7. `pm2 restart all`
8. **Done!**

---

## 📱 Save This Command

Add to your notes for quick access:

```bash
# Quick server database update
ssh [USER]@[IP] "cd [PATH] && git pull && export DATABASE_URL='postgresql://[USER]:[PASS]@localhost/[DB]' && cd migrations && ./run_migrations.sh all && pm2 restart all"
```

Replace:
- `[USER]` with your SSH username
- `[IP]` with server IP address
- `[PATH]` with project path
- `[PASS]` with database password
- `[DB]` with database name
