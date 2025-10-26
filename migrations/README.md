# CloudEdze Database Migrations

This directory contains database migration scripts to keep your PostgreSQL database in sync with the application schema.

## Migration Files

### 1. `000_init_schema.sql`
**Purpose**: Initialize a fresh database from scratch
- Creates all tables (users, sessions, cloud_credentials, inventory_scans, scan_reports, cost_analyses)
- Creates indexes for optimal query performance
- Sets up foreign key relationships
- Creates triggers for automatic `updated_at` timestamps

**When to use**: New installations, fresh database setup

### 2. `001_add_admin_and_reports.sql`
**Purpose**: Legacy migration for admin roles and reports (already applied if you have the scan_reports table)

### 3. `002_update_existing_schema.sql`
**Purpose**: Update existing database to match current schema
- Adds missing columns to existing tables
- Creates missing indexes
- Updates foreign key constraints
- Preserves existing data
- Safe to run multiple times (idempotent)

**When to use**: Updating an existing database

### 4. `verify_schema.sql`
**Purpose**: Verify database schema is correct
- Checks all required tables exist
- Validates all required columns exist
- Verifies indexes are created
- Reports current record counts
- Provides detailed verification report

**When to use**: After running migrations to confirm success

### 5. `run_migrations.sh`
**Purpose**: Automated migration runner script
- Easy-to-use command-line tool
- Multiple modes for different scenarios
- Color-coded output
- Error handling

## Quick Start

### Prerequisites

1. **Set DATABASE_URL environment variable**:

```bash
export DATABASE_URL='postgresql://username:password@localhost:5432/database_name'
```

Or create a `.env` file in the project root:

```
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

### For New Databases

Initialize a fresh database:

```bash
cd migrations
./run_migrations.sh init
```

### For Existing Databases

Update your existing database to the latest schema:

```bash
cd migrations
./run_migrations.sh update
```

### Verify Database

Check if your database matches the expected schema:

```bash
cd migrations
./run_migrations.sh verify
```

### All Migrations + Verification

Run all migrations and verify:

```bash
cd migrations
./run_migrations.sh all
```

## Manual Migration

If you prefer to run migrations manually using `psql`:

### Initialize New Database

```bash
psql "$DATABASE_URL" -f 000_init_schema.sql
```

### Update Existing Database

```bash
psql "$DATABASE_URL" -f 002_update_existing_schema.sql
```

### Verify Schema

```bash
psql "$DATABASE_URL" -f verify_schema.sql
```

## Migration Modes

The `run_migrations.sh` script supports these modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `init` | Initialize new database | Fresh installations |
| `update` | Update existing database | Applying schema changes |
| `verify` | Verify schema only | Checking database state |
| `full` | Run init + verify | New database with verification |
| `all` | Run update + verify | Update existing + verification |

### Examples

```bash
# New database
./run_migrations.sh init

# Update existing database (default if no argument provided)
./run_migrations.sh update
# OR
./run_migrations.sh

# Just verify
./run_migrations.sh verify

# Update and verify
./run_migrations.sh all
```

## Schema Overview

### Tables

1. **sessions** - User authentication sessions
2. **users** - User accounts and profiles
3. **cloud_credentials** - Encrypted cloud provider credentials
4. **inventory_scans** - Cloud infrastructure scan results
5. **scan_reports** - Generated PDF reports
6. **cost_analyses** - Cost analysis results

### Key Features

- **UUID Primary Keys**: All tables use UUIDs for better distributed systems support
- **Soft Deletes**: Foreign keys with CASCADE for automatic cleanup
- **Timestamps**: Automatic `created_at` and `updated_at` tracking
- **Indexes**: Optimized for common queries (user_id, created_at, status, etc.)
- **JSONB Columns**: Flexible storage for complex data structures

## Troubleshooting

### Permission Denied on run_migrations.sh

```bash
chmod +x run_migrations.sh
```

### Database Connection Issues

Verify your DATABASE_URL:

```bash
psql "$DATABASE_URL" -c "SELECT version();"
```

### Migration Fails

1. Check error messages in the output
2. Run verify to see what's missing:
   ```bash
   ./run_migrations.sh verify
   ```
3. Try running update again:
   ```bash
   ./run_migrations.sh update
   ```

### Already Exists Errors

Don't worry! The migrations use `IF NOT EXISTS` clauses, so they're safe to run multiple times.

## Best Practices

1. **Always backup before migrating**:
   ```bash
   pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on development first**: Never run migrations directly on production without testing

3. **Verify after migration**:
   ```bash
   ./run_migrations.sh verify
   ```

4. **Keep migrations in version control**: These files are already tracked in git

## Database Schema Changes

When adding new features that require schema changes:

1. Create a new migration file: `003_your_feature_name.sql`
2. Update `002_update_existing_schema.sql` to include the changes
3. Update `verify_schema.sql` to check for new columns/tables
4. Update this README with the new migration

## Support

If you encounter issues:

1. Check the migration output for specific errors
2. Run `./run_migrations.sh verify` to see what's missing
3. Review the SQL files for manual troubleshooting
4. Check PostgreSQL logs for detailed error information

## Migration History

| Date | Migration | Description |
|------|-----------|-------------|
| 2025-10-24 | 001_add_admin_and_reports.sql | Added admin role and PDF reports |
| 2025-10-26 | 000_init_schema.sql | Complete schema initialization |
| 2025-10-26 | 002_update_existing_schema.sql | Update existing databases |
| 2025-10-26 | verify_schema.sql | Schema verification tool |
