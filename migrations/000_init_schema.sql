-- ============================================
-- Initial Schema Setup for CloudEdze
-- Description: Creates all tables, indexes, and constraints
-- Created: 2025-10-26
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Sessions Table (for authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

COMMENT ON TABLE sessions IS 'Session storage for user authentication';
COMMENT ON COLUMN sessions.sid IS 'Session ID';
COMMENT ON COLUMN sessions.sess IS 'Session data in JSON format';
COMMENT ON COLUMN sessions.expire IS 'Session expiration timestamp';

-- ============================================
-- 2. Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

COMMENT ON TABLE users IS 'User accounts and authentication';
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.email IS 'User email address (unique)';
COMMENT ON COLUMN users.password IS 'Bcrypt hashed password';

-- ============================================
-- 3. Cloud Credentials Table
-- ============================================
CREATE TABLE IF NOT EXISTS cloud_credentials (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  encrypted_credentials TEXT NOT NULL,
  is_validated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cloud_credentials_user_id ON cloud_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_provider ON cloud_credentials(provider);

COMMENT ON TABLE cloud_credentials IS 'Encrypted cloud provider credentials';
COMMENT ON COLUMN cloud_credentials.provider IS 'Cloud provider: aws, azure, gcp, oci';
COMMENT ON COLUMN cloud_credentials.encrypted_credentials IS 'Encrypted credential data';
COMMENT ON COLUMN cloud_credentials.is_validated IS 'Whether credentials have been validated';

-- ============================================
-- 4. Inventory Scans Table
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_scans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scan_data JSONB NOT NULL,
  summary JSONB NOT NULL,
  scan_duration INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_scans_user_id ON inventory_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_status ON inventory_scans(status);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_created_at ON inventory_scans(created_at DESC);

COMMENT ON TABLE inventory_scans IS 'Cloud infrastructure inventory scan results';
COMMENT ON COLUMN inventory_scans.scan_data IS 'Detailed scan results in JSON format';
COMMENT ON COLUMN inventory_scans.summary IS 'Scan summary statistics';
COMMENT ON COLUMN inventory_scans.scan_duration IS 'Scan duration in milliseconds';
COMMENT ON COLUMN inventory_scans.status IS 'Scan status: in-progress, completed, failed';

-- ============================================
-- 5. Scan Reports Table
-- ============================================
CREATE TABLE IF NOT EXISTS scan_reports (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scan_id VARCHAR NOT NULL REFERENCES inventory_scans(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_path VARCHAR NOT NULL,
  report_name VARCHAR NOT NULL,
  file_size INTEGER,
  report_data JSONB,
  status VARCHAR NOT NULL DEFAULT 'generated',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_reports_scan_id ON scan_reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_user_id ON scan_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_status ON scan_reports(status);
CREATE INDEX IF NOT EXISTS idx_scan_reports_created_at ON scan_reports(created_at DESC);

COMMENT ON TABLE scan_reports IS 'Generated PDF scan reports';
COMMENT ON COLUMN scan_reports.report_path IS 'File path or URL to PDF report';
COMMENT ON COLUMN scan_reports.report_name IS 'Human-readable report name';
COMMENT ON COLUMN scan_reports.status IS 'Report status: generating, generated, failed';

-- ============================================
-- 6. Cost Analyses Table
-- ============================================
CREATE TABLE IF NOT EXISTS cost_analyses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  inventory_scan_id VARCHAR REFERENCES inventory_scans(id) ON DELETE SET NULL,
  requirements JSONB NOT NULL,
  results JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cost_analyses_user_id ON cost_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_inventory_scan_id ON cost_analyses(inventory_scan_id);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_created_at ON cost_analyses(created_at DESC);

COMMENT ON TABLE cost_analyses IS 'Cloud cost analysis results';
COMMENT ON COLUMN cost_analyses.requirements IS 'Infrastructure requirements in JSON format';
COMMENT ON COLUMN cost_analyses.results IS 'Cost calculation results in JSON format';
COMMENT ON COLUMN cost_analyses.inventory_scan_id IS 'Optional link to inventory scan';

-- ============================================
-- 7. Create updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to cloud_credentials table
DROP TRIGGER IF EXISTS update_cloud_credentials_updated_at ON cloud_credentials;
CREATE TRIGGER update_cloud_credentials_updated_at
    BEFORE UPDATE ON cloud_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Verification
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database Schema Initialization Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - sessions';
  RAISE NOTICE '  - users';
  RAISE NOTICE '  - cloud_credentials';
  RAISE NOTICE '  - inventory_scans';
  RAISE NOTICE '  - scan_reports';
  RAISE NOTICE '  - cost_analyses';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes created: 15 indexes';
  RAISE NOTICE 'Triggers created: 2 update triggers';
  RAISE NOTICE '========================================';
END $$;
