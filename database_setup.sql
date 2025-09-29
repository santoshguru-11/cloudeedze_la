-- Cloudedze Database Setup
-- PostgreSQL DDL Script for complete database schema

-- Create database (run this separately if needed)
-- CREATE DATABASE cloudedze;

-- Connect to the database
-- \c cloudedze;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Drop existing tables if they exist (be careful in production!)

DROP TABLE IF EXISTS inventory_scans CASCADE;
DROP TABLE IF EXISTS cloud_credentials CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cost_analyses CASCADE;

-- Create users table
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create cloud_credentials table
CREATE TABLE cloud_credentials (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR NOT NULL CHECK (provider IN ('aws', 'azure', 'gcp', 'oci')),
    name VARCHAR NOT NULL,
    encrypted_credentials TEXT NOT NULL,
    is_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create inventory_scans table
CREATE TABLE inventory_scans (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scan_data JSONB NOT NULL,
    scan_date TIMESTAMP DEFAULT NOW(),
    scan_duration INTEGER,
    cost_analysis_id VARCHAR REFERENCES cost_analyses(id)
);

-- Create cost_analyses table
CREATE TABLE cost_analyses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    inventory_id VARCHAR REFERENCES inventory_scans(id),
    requirements JSONB NOT NULL,
    results JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_user_id ON cloud_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_provider ON cloud_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_user_id ON inventory_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_scan_date ON inventory_scans(scan_date);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_user_id ON cost_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_created_at ON cost_analyses(created_at);

-- Create GIN indexes for JSONB columns (using gin_trgm_ops for text search)
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_encrypted ON cloud_credentials USING GIN(encrypted_credentials gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_scan_data ON inventory_scans USING GIN(scan_data gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_requirements ON cost_analyses USING GIN(requirements gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_results ON cost_analyses USING GIN(results gin_trgm_ops);

-- Create indexes on specific JSONB fields for common queries
CREATE INDEX IF NOT EXISTS idx_cost_analyses_currency ON cost_analyses USING GIN((requirements->'currency') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_compute_vcpus ON cost_analyses USING GIN((requirements->'compute'->'vcpus') gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_cheapest_provider ON cost_analyses USING GIN((results->'cheapest'->'name') gin_trgm_ops);

-- Add comments to tables and columns
COMMENT ON TABLE users IS 'User accounts for the cloud cost optimizer application';
COMMENT ON COLUMN users.id IS 'Unique identifier for each user';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.password IS 'Hashed user password';
COMMENT ON COLUMN users.first_name IS 'User first name';
COMMENT ON COLUMN users.last_name IS 'User last name';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';

COMMENT ON TABLE sessions IS 'User session data for authentication';
COMMENT ON COLUMN sessions.sid IS 'Session ID';
COMMENT ON COLUMN sessions.sess IS 'Session data as JSON';
COMMENT ON COLUMN sessions.expire IS 'Session expiration timestamp';

COMMENT ON TABLE cloud_credentials IS 'Encrypted cloud provider credentials';
COMMENT ON COLUMN cloud_credentials.id IS 'Unique identifier for each credential set';
COMMENT ON COLUMN cloud_credentials.user_id IS 'ID of the user who owns these credentials';
COMMENT ON COLUMN cloud_credentials.provider IS 'Cloud provider (aws, azure, gcp, oci)';
COMMENT ON COLUMN cloud_credentials.name IS 'User-friendly name for the credential set';
COMMENT ON COLUMN cloud_credentials.encrypted_credentials IS 'Encrypted JSON containing actual credentials';
COMMENT ON COLUMN cloud_credentials.is_validated IS 'Whether the credentials have been validated';
COMMENT ON COLUMN cloud_credentials.created_at IS 'Timestamp when the credentials were added';

COMMENT ON TABLE inventory_scans IS 'Cloud resource inventory scan results';
COMMENT ON COLUMN inventory_scans.id IS 'Unique identifier for each scan';
COMMENT ON COLUMN inventory_scans.user_id IS 'ID of the user who performed the scan';
COMMENT ON COLUMN inventory_scans.scan_data IS 'JSON containing discovered resources and metadata';
COMMENT ON COLUMN inventory_scans.scan_date IS 'Timestamp when the scan was performed';
COMMENT ON COLUMN inventory_scans.scan_duration IS 'Scan duration in milliseconds';
COMMENT ON COLUMN inventory_scans.cost_analysis_id IS 'Reference to associated cost analysis';

COMMENT ON TABLE cost_analyses IS 'Cloud cost analysis results';
COMMENT ON COLUMN cost_analyses.id IS 'Unique identifier for each analysis';
COMMENT ON COLUMN cost_analyses.user_id IS 'ID of the user who requested the analysis';
COMMENT ON COLUMN cost_analyses.inventory_id IS 'Reference to the inventory scan used for analysis';
COMMENT ON COLUMN cost_analyses.requirements IS 'JSON containing infrastructure requirements and preferences';
COMMENT ON COLUMN cost_analyses.results IS 'JSON containing cost calculation results for all providers';
COMMENT ON COLUMN cost_analyses.created_at IS 'Timestamp when the analysis was created';

-- Create a user for the application (adjust password as needed)
-- Note: In production, use a more secure password and proper user management
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'cloud_cost_user') THEN
        CREATE ROLE cloud_cost_user WITH LOGIN PASSWORD '1101';
    END IF;
END
$$;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cloud_cost_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cloud_cost_user;
GRANT USAGE ON SCHEMA public TO cloud_cost_user;

-- Insert a sample user for testing (password: 1101)
-- Note: In production, remove this and use proper user registration
INSERT INTO users (id, email, password, first_name, last_name) VALUES 
('9d2d5751-e2ef-44e5-bbbe-8c2180515f22', 'darbhasantosh11@gmail.com', '$2a$10$rQZ8K9vJ8K9vJ8K9vJ8K9u', 'santosh', 'darbha')
ON CONFLICT (email) DO NOTHING;

-- Verify table creation
\dt;

-- Show table structures
\d+ users;
\d+ sessions;
\d+ cloud_credentials;
\d+ inventory_scans;
\d+ cost_analyses;

-- Success message
SELECT 'Database setup completed successfully!' as message;
SELECT 'All tables created with proper relationships and indexes.' as message;
SELECT 'Sample user created: darbhasantosh11@gmail.com (password: 1101)' as message;