#!/bin/bash

# Quick Database Rebuild - One Command
echo "🔄 Rebuilding Cloudedze database..."

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS cloudedze; CREATE DATABASE cloudedze; DROP USER IF EXISTS cloud_cost_user; CREATE USER cloud_cost_user WITH PASSWORD '1101'; GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloud_cost_user;"

# Install extensions and create schema
sudo -u postgres psql -d cloudedze -c "
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";

DROP TABLE IF EXISTS inventory_scans CASCADE;
DROP TABLE IF EXISTS cloud_credentials CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cost_analyses CASCADE;

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

CREATE TABLE cloud_credentials (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    credentials JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE sessions (
    sid VARCHAR NOT NULL COLLATE \"default\",
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL,
    CONSTRAINT \"sessions_pkey\" PRIMARY KEY (sid)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cloud_credentials_user_id ON cloud_credentials(user_id);
CREATE INDEX idx_inventory_scans_user_id ON inventory_scans(user_id);
CREATE INDEX idx_cost_analyses_user_id ON cost_analyses(user_id);
CREATE INDEX idx_sessions_expire ON sessions(expire);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloud_cost_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloud_cost_user;
GRANT USAGE ON SCHEMA public TO cloud_cost_user;

ALTER TABLE users OWNER TO cloud_cost_user;
ALTER TABLE cloud_credentials OWNER TO cloud_cost_user;
ALTER TABLE inventory_scans OWNER TO cloud_cost_user;
ALTER TABLE cost_analyses OWNER TO cloud_cost_user;
ALTER TABLE sessions OWNER TO cloud_cost_user;

INSERT INTO users (id, email, password, first_name, last_name) VALUES 
(1, 'darbhasantosh11@gmail.com', '\$2b\$10\$rQZ8K9vL8K9vL8K9vL8K9e', 'Santosh', 'Gurudarbha');
"

echo "✅ Database rebuild completed!"
echo "📊 Testing connection..."
PGPASSWORD=1101 psql -h localhost -U cloud_cost_user -d cloudedze -c "SELECT 'Database connection successful!' as status;"
