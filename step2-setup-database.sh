#!/bin/bash
echo "Setting up PostgreSQL database..."

# Install PostgreSQL
sudo dnf install -y postgresql postgresql-server

# Initialize database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database user and database
sudo -u postgres psql << 'EOF'
CREATE USER cloudedze_user WITH PASSWORD 'cloudedze_password';
CREATE DATABASE cloudedze OWNER cloudedze_user;
GRANT ALL PRIVILEGES ON DATABASE cloudedze TO cloudedze_user;
\q
EOF

echo "✅ PostgreSQL setup completed!"
echo "Database: cloudedze"
echo "User: cloudedze_user"
echo "Password: cloudedze_password"