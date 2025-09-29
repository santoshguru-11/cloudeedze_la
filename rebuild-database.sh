#!/bin/bash

# Complete Database Rebuild Script for Cloudedze
# This script will drop and recreate the entire database with all tables and permissions

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_info "Starting complete database rebuild for Cloudedze..."

# Step 1: Drop and recreate database
print_info "Step 1: Dropping and recreating database..."
sudo -u postgres psql << 'EOF'
-- Drop database if exists
DROP DATABASE IF EXISTS cloudedze;

-- Create new database
CREATE DATABASE cloudedze;

-- Create user
DROP USER IF EXISTS cloud_cost_user;
CREATE USER cloud_cost_user WITH PASSWORD '1101';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloud_cost_user;
EOF

print_status "Database recreated successfully"

# Step 2: Install required extensions
print_info "Step 2: Installing PostgreSQL extensions..."
sudo -u postgres psql -d cloudedze << 'EOF'
-- Install required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

print_status "Extensions installed successfully"

# Step 3: Create all tables
print_info "Step 3: Creating database schema..."
sudo -u postgres psql -d cloudedze << 'EOF'
-- Drop existing tables if they exist
DROP TABLE IF EXISTS inventory_scans CASCADE;
DROP TABLE IF EXISTS cloud_credentials CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cost_analyses CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create cloud_credentials table
CREATE TABLE cloud_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create inventory_scans table
CREATE TABLE inventory_scans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scan_name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    scan_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create cost_analyses table
CREATE TABLE cost_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    analysis_name VARCHAR(255) NOT NULL,
    analysis_data JSONB NOT NULL,
    total_cost DECIMAL(15,2),
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
    sid VARCHAR NOT NULL COLLATE "default",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT "sessions_pkey" PRIMARY KEY (sid)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cloud_credentials_user_id ON cloud_credentials(user_id);
CREATE INDEX idx_cloud_credentials_provider ON cloud_credentials(provider);
CREATE INDEX idx_inventory_scans_user_id ON inventory_scans(user_id);
CREATE INDEX idx_inventory_scans_provider ON inventory_scans(provider);
CREATE INDEX idx_cost_analyses_user_id ON cost_analyses(user_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);

-- Add comments
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE cloud_credentials IS 'Cloud provider credentials for each user';
COMMENT ON TABLE inventory_scans IS 'Cloud resource inventory scans';
COMMENT ON TABLE cost_analyses IS 'Cost analysis results and reports';
COMMENT ON TABLE sessions IS 'User session data';

-- Grant all privileges to cloud_cost_user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloud_cost_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloud_cost_user;
GRANT USAGE ON SCHEMA public TO cloud_cost_user;

-- Change ownership of all tables to cloud_cost_user
ALTER TABLE users OWNER TO cloud_cost_user;
ALTER TABLE cloud_credentials OWNER TO cloud_cost_user;
ALTER TABLE inventory_scans OWNER TO cloud_cost_user;
ALTER TABLE cost_analyses OWNER TO cloud_cost_user;
ALTER TABLE sessions OWNER TO cloud_cost_user;

-- Insert sample data
INSERT INTO users (id, email, password, first_name, last_name) VALUES 
(1, 'darbhasantosh11@gmail.com', '$2b$10$rQZ8K9vL8K9vL8K9vL8K9e', 'Santosh', 'Gurudarbha');

-- Insert sample cloud credentials
INSERT INTO cloud_credentials (user_id, provider, credentials) VALUES 
(1, 'aws', '{"access_key": "sample", "secret_key": "sample", "region": "us-east-1"}'),
(1, 'azure', '{"client_id": "sample", "client_secret": "sample", "tenant_id": "sample"}'),
(1, 'gcp', '{"project_id": "sample", "service_account_key": "sample"}'),
(1, 'oci', '{"user_ocid": "sample", "tenancy_ocid": "sample", "fingerprint": "sample", "private_key": "sample", "region": "us-ashburn-1"}');

EOF

print_status "Database schema created successfully"

# Step 4: Verify database setup
print_info "Step 4: Verifying database setup..."
PGPASSWORD=1101 psql -h localhost -U cloud_cost_user -d cloudedze -c "\dt"

print_info "Step 5: Testing database connection..."
PGPASSWORD=1101 psql -h localhost -U cloud_cost_user -d cloudedze -c "SELECT COUNT(*) as user_count FROM users;"

print_info "Step 6: Testing table structure..."
PGPASSWORD=1101 psql -h localhost -U cloud_cost_user -d cloudedze -c "\d users"

print_status "Database rebuild completed successfully!"
print_info "Database: cloudedze"
print_info "User: cloud_cost_user"
print_info "Password: 1101"
print_info "Host: localhost"
print_info "Tables created: users, cloud_credentials, inventory_scans, cost_analyses, sessions"
print_info "Sample user: darbhasantosh11@gmail.com (password: 1101)"
