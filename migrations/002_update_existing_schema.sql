-- ============================================
-- Update Existing Database to Latest Schema
-- Description: Migrates existing database to match current schema
-- Created: 2025-10-26
-- ============================================

-- ============================================
-- 1. Update Users Table
-- ============================================

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'user' role if null
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Add comments
COMMENT ON COLUMN users.role IS 'User role: user or admin';
COMMENT ON COLUMN users.profile_image_url IS 'URL to user profile image';

-- ============================================
-- 2. Update Cloud Credentials Table
-- ============================================

ALTER TABLE cloud_credentials ADD COLUMN IF NOT EXISTS is_validated BOOLEAN DEFAULT false;
ALTER TABLE cloud_credentials ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE cloud_credentials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_user_id ON cloud_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_credentials_provider ON cloud_credentials(provider);

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cloud_credentials_user_id_fkey'
    ) THEN
        ALTER TABLE cloud_credentials
        ADD CONSTRAINT cloud_credentials_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================
-- 3. Update Inventory Scans Table
-- ============================================

ALTER TABLE inventory_scans ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'completed';
ALTER TABLE inventory_scans ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE inventory_scans ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_inventory_scans_user_id ON inventory_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_status ON inventory_scans(status);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_created_at ON inventory_scans(created_at DESC);

-- Update existing scans to 'completed' status
UPDATE inventory_scans SET status = 'completed' WHERE status IS NULL OR status = '';

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'inventory_scans_user_id_fkey'
    ) THEN
        ALTER TABLE inventory_scans
        ADD CONSTRAINT inventory_scans_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN inventory_scans.status IS 'Scan status: in-progress, completed, failed';
COMMENT ON COLUMN inventory_scans.error_message IS 'Error message if scan failed';

-- ============================================
-- 4. Create Scan Reports Table (if not exists)
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

-- Create indexes for scan_reports
CREATE INDEX IF NOT EXISTS idx_scan_reports_scan_id ON scan_reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_user_id ON scan_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_status ON scan_reports(status);
CREATE INDEX IF NOT EXISTS idx_scan_reports_created_at ON scan_reports(created_at DESC);

-- Add comments
COMMENT ON TABLE scan_reports IS 'Generated PDF scan reports';
COMMENT ON COLUMN scan_reports.report_path IS 'File path or URL to PDF report';
COMMENT ON COLUMN scan_reports.report_name IS 'Human-readable report name';
COMMENT ON COLUMN scan_reports.status IS 'Report status: generating, generated, failed';

-- ============================================
-- 5. Update Cost Analyses Table
-- ============================================

ALTER TABLE cost_analyses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_cost_analyses_user_id ON cost_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_inventory_scan_id ON cost_analyses(inventory_scan_id);
CREATE INDEX IF NOT EXISTS idx_cost_analyses_created_at ON cost_analyses(created_at DESC);

-- Add foreign keys if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cost_analyses_user_id_fkey'
    ) THEN
        ALTER TABLE cost_analyses
        ADD CONSTRAINT cost_analyses_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'cost_analyses_inventory_scan_id_fkey'
    ) THEN
        ALTER TABLE cost_analyses
        ADD CONSTRAINT cost_analyses_inventory_scan_id_fkey
        FOREIGN KEY (inventory_scan_id) REFERENCES inventory_scans(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 6. Create/Update Triggers
-- ============================================

-- Create updated_at trigger function if it doesn't exist
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
    EXECUTE PROCEDURE update_updated_at_column();

-- Apply trigger to cloud_credentials table
DROP TRIGGER IF EXISTS update_cloud_credentials_updated_at ON cloud_credentials;
CREATE TRIGGER update_cloud_credentials_updated_at
    BEFORE UPDATE ON cloud_credentials
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- 7. Update Sessions Table (if exists)
-- ============================================

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- ============================================
-- Verification & Summary
-- ============================================

DO $$
DECLARE
    users_count INTEGER;
    credentials_count INTEGER;
    scans_count INTEGER;
    reports_count INTEGER;
    analyses_count INTEGER;
BEGIN
    -- Count records in each table
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO credentials_count FROM cloud_credentials;
    SELECT COUNT(*) INTO scans_count FROM inventory_scans;
    SELECT COUNT(*) INTO reports_count FROM scan_reports;
    SELECT COUNT(*) INTO analyses_count FROM cost_analyses;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database Migration Complete';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Current Record Counts:';
    RAISE NOTICE '  - Users: %', users_count;
    RAISE NOTICE '  - Cloud Credentials: %', credentials_count;
    RAISE NOTICE '  - Inventory Scans: %', scans_count;
    RAISE NOTICE '  - Scan Reports: %', reports_count;
    RAISE NOTICE '  - Cost Analyses: %', analyses_count;
    RAISE NOTICE '';
    RAISE NOTICE 'All tables and indexes are up to date!';
    RAISE NOTICE '========================================';
END $$;
