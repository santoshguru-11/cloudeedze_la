-- ============================================
-- Verify Database Schema
-- Description: Checks if database matches the expected schema
-- Created: 2025-10-26
-- ============================================

-- ============================================
-- 1. Check Tables Exist
-- ============================================

DO $$
DECLARE
    missing_tables TEXT := '';
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Verifying Database Schema';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Checking Tables...';

    -- Check each required table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') THEN
        missing_tables := missing_tables || '  - sessions' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ sessions table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        missing_tables := missing_tables || '  - users' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ users table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cloud_credentials') THEN
        missing_tables := missing_tables || '  - cloud_credentials' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ cloud_credentials table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'inventory_scans') THEN
        missing_tables := missing_tables || '  - inventory_scans' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ inventory_scans table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scan_reports') THEN
        missing_tables := missing_tables || '  - scan_reports' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ scan_reports table exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_analyses') THEN
        missing_tables := missing_tables || '  - cost_analyses' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ cost_analyses table exists';
    END IF;

    IF missing_tables != '' THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠ Missing Tables:';
        RAISE NOTICE '%', missing_tables;
        RAISE EXCEPTION 'Database schema is incomplete. Please run migrations.';
    END IF;
END $$;

-- ============================================
-- 2. Check Required Columns
-- ============================================

DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Checking Required Columns...';

    -- Check users table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        missing_columns := missing_columns || '  - users.role' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ users.role exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
        missing_columns := missing_columns || '  - users.profile_image_url' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ users.profile_image_url exists';
    END IF;

    -- Check cloud_credentials table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cloud_credentials' AND column_name = 'is_validated') THEN
        missing_columns := missing_columns || '  - cloud_credentials.is_validated' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ cloud_credentials.is_validated exists';
    END IF;

    -- Check inventory_scans table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_scans' AND column_name = 'status') THEN
        missing_columns := missing_columns || '  - inventory_scans.status' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ inventory_scans.status exists';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_scans' AND column_name = 'error_message') THEN
        missing_columns := missing_columns || '  - inventory_scans.error_message' || E'\n';
    ELSE
        RAISE NOTICE '  ✓ inventory_scans.error_message exists';
    END IF;

    IF missing_columns != '' THEN
        RAISE NOTICE '';
        RAISE NOTICE '⚠ Missing Columns:';
        RAISE NOTICE '%', missing_columns;
        RAISE EXCEPTION 'Database schema has missing columns. Please run migrations.';
    END IF;
END $$;

-- ============================================
-- 3. Check Indexes
-- ============================================

DO $$
DECLARE
    index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Checking Indexes...';

    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('users', 'cloud_credentials', 'inventory_scans', 'scan_reports', 'cost_analyses', 'sessions');

    RAISE NOTICE '  Total indexes found: %', index_count;

    -- List important indexes
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
        RAISE NOTICE '  ✓ idx_users_email';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_role') THEN
        RAISE NOTICE '  ✓ idx_users_role';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_inventory_scans_user_id') THEN
        RAISE NOTICE '  ✓ idx_inventory_scans_user_id';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cost_analyses_user_id') THEN
        RAISE NOTICE '  ✓ idx_cost_analyses_user_id';
    END IF;
END $$;

-- ============================================
-- 4. Check Foreign Keys
-- ============================================

DO $$
DECLARE
    fk_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Checking Foreign Keys...';

    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_schema = 'public';

    RAISE NOTICE '  Total foreign keys found: %', fk_count;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%cloud_credentials_user_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '  ✓ cloud_credentials -> users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%inventory_scans_user_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '  ✓ inventory_scans -> users';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%cost_analyses_user_id%'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        RAISE NOTICE '  ✓ cost_analyses -> users';
    END IF;
END $$;

-- ============================================
-- 5. Summary Report
-- ============================================

DO $$
DECLARE
    users_count INTEGER;
    credentials_count INTEGER;
    scans_count INTEGER;
    reports_count INTEGER;
    analyses_count INTEGER;
    admin_count INTEGER;
BEGIN
    -- Count records
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO credentials_count FROM cloud_credentials;
    SELECT COUNT(*) INTO scans_count FROM inventory_scans;
    SELECT COUNT(*) INTO reports_count FROM scan_reports;
    SELECT COUNT(*) INTO analyses_count FROM cost_analyses;
    SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schema Verification Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database Record Counts:';
    RAISE NOTICE '  - Users: % (% admins)', users_count, admin_count;
    RAISE NOTICE '  - Cloud Credentials: %', credentials_count;
    RAISE NOTICE '  - Inventory Scans: %', scans_count;
    RAISE NOTICE '  - Scan Reports: %', reports_count;
    RAISE NOTICE '  - Cost Analyses: %', analyses_count;
    RAISE NOTICE '';
    RAISE NOTICE '✓ Database schema verification passed!';
    RAISE NOTICE '========================================';
END $$;
