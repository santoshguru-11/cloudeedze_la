#!/bin/bash

# Database backup script for Cloudedze (Server version)
# This script creates a backup of the PostgreSQL database on the server

# Database configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="cloudedze"
DB_USER="cloud_cost_user"
DB_PASSWORD="1101"

# Backup configuration
BACKUP_DIR="/home/santosh/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="cloudedze_db_backup_${TIMESTAMP}.sql"
FULL_BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup on server..."
echo "Database: $DB_NAME"
echo "Backup file: $FULL_BACKUP_PATH"

# Set PGPASSWORD environment variable for non-interactive backup
export PGPASSWORD="$DB_PASSWORD"

# Create the backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --file="$FULL_BACKUP_PATH"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup completed successfully!"
    echo "Backup file: $FULL_BACKUP_PATH"
    echo "File size: $(du -h "$FULL_BACKUP_PATH" | cut -f1)"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo "Backup process completed."
