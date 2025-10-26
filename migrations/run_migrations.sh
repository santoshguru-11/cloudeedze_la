#!/bin/bash

# ============================================
# CloudEdze Database Migration Runner
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it in one of these ways:"
    echo ""
    echo "1. Export it in your shell:"
    echo "   export DATABASE_URL='postgresql://username:password@localhost:5432/database'"
    echo ""
    echo "2. Create a .env file with:"
    echo "   DATABASE_URL=postgresql://username:password@localhost:5432/database"
    echo ""
    echo "3. Pass it directly to this script:"
    echo "   DATABASE_URL='postgresql://...' ./run_migrations.sh"
    exit 1
fi

# Parse command line arguments
MODE="${1:-update}"  # Default to 'update' mode

echo ""
echo "========================================="
echo "  CloudEdze Database Migration"
echo "========================================="
echo ""

# Function to run a SQL file
run_sql_file() {
    local file=$1
    local description=$2

    print_info "Running: $description"

    if psql "$DATABASE_URL" -f "$file" -v ON_ERROR_STOP=1; then
        print_success "$description completed"
        return 0
    else
        print_error "$description failed"
        return 1
    fi
}

# Change to migrations directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

case "$MODE" in
    "init")
        print_info "Mode: Initialize new database"
        echo ""
        run_sql_file "000_init_schema.sql" "Initial schema setup"
        ;;

    "update")
        print_info "Mode: Update existing database"
        echo ""
        run_sql_file "002_update_existing_schema.sql" "Update existing schema"
        ;;

    "verify")
        print_info "Mode: Verify database schema"
        echo ""
        run_sql_file "verify_schema.sql" "Schema verification"
        ;;

    "full")
        print_info "Mode: Full migration (init + verify)"
        echo ""
        if run_sql_file "000_init_schema.sql" "Initial schema setup"; then
            echo ""
            run_sql_file "verify_schema.sql" "Schema verification"
        fi
        ;;

    "all")
        print_info "Mode: All migrations (update + verify)"
        echo ""
        if run_sql_file "002_update_existing_schema.sql" "Update existing schema"; then
            echo ""
            run_sql_file "verify_schema.sql" "Schema verification"
        fi
        ;;

    *)
        print_error "Unknown mode: $MODE"
        echo ""
        echo "Usage: $0 [mode]"
        echo ""
        echo "Available modes:"
        echo "  init     - Initialize new database (fresh install)"
        echo "  update   - Update existing database (default)"
        echo "  verify   - Verify database schema only"
        echo "  full     - Run init + verify"
        echo "  all      - Run update + verify"
        echo ""
        echo "Examples:"
        echo "  $0 init      # For new databases"
        echo "  $0 update    # For existing databases"
        echo "  $0 verify    # Check database schema"
        exit 1
        ;;
esac

echo ""
print_success "Migration process completed!"
echo ""
