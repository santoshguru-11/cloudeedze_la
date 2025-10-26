-- Migration: Add Admin Role and Reports System
-- Created: 2025-10-24
-- Description: Adds admin role support, scan status tracking, and PDF report storage

-- ============================================
-- 1. Add role column to users table
-- ============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role VARCHAR NOT NULL DEFAULT 'user';

-- Add comment to role column
COMMENT ON COLUMN users.role IS 'User role: user or admin';

-- Create index on role for faster admin queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 2. Update inventory_scans table
-- ============================================
ALTER TABLE inventory_scans
ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add comments
COMMENT ON COLUMN inventory_scans.status IS 'Scan status: in-progress, completed, or failed';
COMMENT ON COLUMN inventory_scans.error_message IS 'Error message if scan failed';

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_inventory_scans_status ON inventory_scans(status);
CREATE INDEX IF NOT EXISTS idx_inventory_scans_user_id ON inventory_scans(user_id);

-- ============================================
-- 3. Create scan_reports table
-- ============================================
CREATE TABLE IF NOT EXISTS scan_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES inventory_scans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_path VARCHAR NOT NULL,
  report_name VARCHAR NOT NULL,
  file_size INTEGER,
  report_data JSONB,
  status VARCHAR NOT NULL DEFAULT 'generated',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add comments to scan_reports table
COMMENT ON TABLE scan_reports IS 'Storage for generated PDF scan reports';
COMMENT ON COLUMN scan_reports.scan_id IS 'Reference to the inventory scan';
COMMENT ON COLUMN scan_reports.user_id IS 'User who owns this report';
COMMENT ON COLUMN scan_reports.report_path IS 'File system path or URL to the PDF report';
COMMENT ON COLUMN scan_reports.report_name IS 'Human-readable report name';
COMMENT ON COLUMN scan_reports.file_size IS 'File size in bytes';
COMMENT ON COLUMN scan_reports.report_data IS 'JSON metadata about the report (summary stats, etc.)';
COMMENT ON COLUMN scan_reports.status IS 'Report status: generating, generated, or failed';

-- Create indexes for scan_reports
CREATE INDEX IF NOT EXISTS idx_scan_reports_scan_id ON scan_reports(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_user_id ON scan_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_reports_status ON scan_reports(status);
CREATE INDEX IF NOT EXISTS idx_scan_reports_created_at ON scan_reports(created_at DESC);

-- ============================================
-- 4. Update existing data (if any)
-- ============================================

-- Set existing users to 'user' role if not already set
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Set existing scans to 'completed' status if not already set
UPDATE inventory_scans SET status = 'completed' WHERE status IS NULL OR status = '';

-- ============================================
-- 5. Create admin user (OPTIONAL - comment out if not needed)
-- ============================================

-- Uncomment and modify the following to create a default admin user
-- Note: Replace the password hash with actual bcrypt hash
-- You can generate it using: bcrypt.hash('your-password', 10)

-- INSERT INTO users (email, password, first_name, last_name, role)
-- VALUES (
--   'admin@cloudedze.com',
--   '$2a$10$YourBcryptHashHere', -- Replace with actual bcrypt hash
--   'Admin',
--   'User',
--   'admin'
-- )
-- ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- ============================================
-- Migration Complete
-- ============================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables updated: users, inventory_scans';
  RAISE NOTICE 'Tables created: scan_reports';
  RAISE NOTICE 'Indexes created: 6 new indexes';
END $$;
