#!/bin/bash

echo "🛠️ DATABASE PERMISSIONS FIX"
echo "==========================="

echo "1. 🛑 Stopping application..."
pm2 stop cloudedze

echo "2. 🗄️ Checking database connection..."
echo "Testing connection to PostgreSQL..."

# Check if database and user exist, create if needed
echo "3. 📋 Setting up database and permissions..."

# Connect to PostgreSQL as postgres user and setup everything
sudo -u postgres psql << 'EOF'
-- Create user if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cloudedze_user') THEN
        CREATE USER cloudedze_user WITH PASSWORD 'cloudedze_password';
    END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE cloudedze'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cloudedze')\gexec

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloudedze_user;

-- Connect to cloudedze database
\c cloudedze

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_pkey') THEN
        ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);
    END IF;
END
$$;

-- Create index if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_sessions_expire') THEN
        CREATE INDEX idx_sessions_expire ON sessions(expire);
    END IF;
END
$$;

-- Grant all permissions on sessions table to cloudedze_user
GRANT ALL PRIVILEGES ON TABLE sessions TO cloudedze_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloudedze_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloudedze_user;

-- Make cloudedze_user owner of the database
ALTER DATABASE cloudedze OWNER TO cloudedze_user;

-- Exit
\q
EOF

echo "4. 🧪 Testing database connection as cloudedze_user..."
PGPASSWORD=cloudedze_password psql -h localhost -U cloudedze_user -d cloudedze -c "SELECT version();" || echo "❌ Database connection failed"

echo "5. 🧪 Testing sessions table access..."
PGPASSWORD=cloudedze_password psql -h localhost -U cloudedze_user -d cloudedze -c "SELECT COUNT(*) FROM sessions;" || echo "❌ Sessions table access failed"

echo "6. 🚀 Starting application..."
# Load environment variables and start
export NODE_ENV=production
export PORT=3000
export HOST=0.0.0.0
export VITE_API_BASE_URL=http://34.14.198.14:3000
export DATABASE_URL=postgresql://cloudedze_user:cloudedze_password@localhost:5432/cloudedze
export SESSION_SECRET=cloudedze-production-secret-2024-secure-key-abcd1234
export ENCRYPTION_KEY=cloudedze-production-encryption-key-xyz9876
export JWT_SECRET=cloudedze-production-jwt-secret-def5432
export CORS_ORIGINS=http://34.14.198.14:3000,http://localhost:3000
export CORS_CREDENTIALS=true

pm2 start dist/index.js --name cloudedze

echo "7. 💾 Saving PM2 config..."
pm2 save

echo "8. 📊 Checking status..."
pm2 status

echo "9. 🌐 Testing application..."
sleep 5
echo "Testing localhost:"
curl -I http://localhost:3000 2>/dev/null || echo "❌ Local test failed"

echo ""
echo "Testing external IP:"
curl -I http://34.14.198.14:3000 2>/dev/null || echo "❌ External test failed"

echo ""
echo "✅ DATABASE PERMISSIONS FIX COMPLETED!"
echo "If still having issues, check PM2 logs: pm2 logs cloudedze"