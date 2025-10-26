-- ============================================
-- Create Admin User
-- Description: Creates a default admin user
-- ============================================

-- Insert admin user
-- Default credentials:
--   Email: admin@cloudeedze.com
--   Password: Admin@123
--   Bcrypt hash below is for: Admin@123

INSERT INTO users (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'admin@cloudeedze.com',
  '$2b$10$Pa.Nwjx/2RkLQeDIEUCe9OBcV9dLuBfff4kzwxj3BUxoGVDzxE4Pe',  -- Admin@123
  'Admin',
  'User',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  role = 'admin',
  first_name = 'Admin',
  last_name = 'User';

-- Verification
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Admin User Created Successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: admin@cloudeedze.com';
    RAISE NOTICE 'Password: Admin@123';
    RAISE NOTICE '';
    RAISE NOTICE 'Total admin users: %', admin_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠ IMPORTANT: Change this password after first login!';
    RAISE NOTICE '========================================';
END $$;
