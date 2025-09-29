# 🚀 Installation Guide

This guide provides detailed installation instructions for the Cloudedze application.

## 📋 Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows
- **Node.js**: Version 18.0.0 or higher
- **Python**: Version 3.8 or higher (for OCI integration)
- **PostgreSQL**: Version 12 or higher
- **Git**: For cloning the repository
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: At least 2GB free space

### Required Software

#### Node.js Installation

**macOS (using Homebrew):**
```bash
brew install node@18
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/) and run the installer.

**Verify Installation:**
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

#### Python Installation

**macOS (using Homebrew):**
```bash
brew install python@3.8
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.8 python3.8-pip python3.8-venv
```

**Windows:**
Download from [python.org](https://python.org/) and run the installer.

**Verify Installation:**
```bash
python3 --version  # Should show 3.8.x or higher
pip3 --version     # Should show 20.x.x or higher
```

#### PostgreSQL Installation

**macOS (using Homebrew):**
```bash
brew install postgresql@12
brew services start postgresql@12
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from [postgresql.org](https://postgresql.org/) and run the installer.

**Verify Installation:**
```bash
psql --version  # Should show 12.x or higher
```

## 🔧 Installation Steps

### Step 1: Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/santoshguru-11/costcal.git
cd costcal

# Or clone the inventory repository
git clone https://github.com/santoshguru-11/inventory_cost.git
cd inventory_cost
```

### Step 2: Install Node.js Dependencies

```bash
# Install all Node.js dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Install Python Dependencies

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate

# On Windows:
.venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Verify installation
pip list
```

### Step 4: Database Setup

#### Option A: Automated Setup (Recommended)

```bash
# Make the setup script executable
chmod +x setup_database.sh

# Run the automated setup
./setup_database.sh
```

#### Option B: Manual Setup

```bash
# Create database
createdb cloud_cost_optimizer

# Run database setup script
psql -d cloud_cost_optimizer -f database_setup.sql

# Test database setup
psql -d cloud_cost_optimizer -f test_database.sql
```

### Step 5: Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

**Required Environment Variables:**

```env
# Database Configuration
DATABASE_URL=postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: Cloud Provider API Keys (can also be added via UI)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
GCP_PROJECT_ID=your-gcp-project-id
GCP_SERVICE_ACCOUNT_KEY=path/to/service-account-key.json
OCI_USER_OCID=your-oci-user-ocid
OCI_TENANCY_OCID=your-oci-tenancy-ocid
OCI_FINGERPRINT=your-oci-fingerprint
OCI_PRIVATE_KEY_PATH=path/to/private-key.pem
```

### Step 6: Build the Application

```bash
# Build the application for production
npm run build

# Verify build
ls -la dist/
```

### Step 7: Start the Application

#### Development Mode

```bash
# Start in development mode with hot reload
npm run dev
```

#### Production Mode

```bash
# Start in production mode
npm start
```

### Step 8: Verify Installation

1. **Open your browser** and navigate to `http://localhost:3000`
2. **Login** with the default credentials:
   - Email: `darbhasantosh11@gmail.com`
   - Password: `1101`
3. **Test cloud integration** by adding credentials and running a scan

## 🔍 Troubleshooting

### Common Issues

#### Node.js Issues

**Issue**: `npm install` fails
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Issue**: Permission errors on macOS/Linux
**Solution**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
```

#### Python Issues

**Issue**: `pip install` fails
**Solution**:
```bash
# Upgrade pip
pip install --upgrade pip

# Install with user flag
pip install --user -r requirements.txt
```

**Issue**: Virtual environment not activating
**Solution**:
```bash
# Recreate virtual environment
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

#### Database Issues

**Issue**: PostgreSQL connection failed
**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL service
# On macOS:
brew services start postgresql@12

# On Ubuntu:
sudo systemctl start postgresql

# On Windows:
# Use Services.msc or pg_ctl start
```

**Issue**: Database user doesn't exist
**Solution**:
```bash
# Create database user
sudo -u postgres createuser -s cloud_cost_user
sudo -u postgres psql -c "ALTER USER cloud_cost_user PASSWORD '1101';"
```

#### OCI Integration Issues

**Issue**: OCI Python SDK not found
**Solution**:
```bash
# Install OCI SDK
pip install oci

# Verify installation
python3 -c "import oci; print(oci.__version__)"
```

**Issue**: OCI credentials not working
**Solution**:
1. Verify OCI credentials format
2. Check OCI user permissions
3. Ensure correct region is specified

### Log Files

**Application Logs**:
```bash
# View application logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log
```

**Database Logs**:
```bash
# PostgreSQL logs location
# macOS: /usr/local/var/log/postgresql@12.log
# Ubuntu: /var/log/postgresql/postgresql-12-main.log
# Windows: C:\Program Files\PostgreSQL\12\data\log\
```

## 🧪 Testing Installation

### Run Test Suite

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Run database tests
psql -d cloud_cost_optimizer -f test_database.sql
```

### Manual Testing

1. **Database Connection Test**:
   ```bash
   psql -d cloud_cost_optimizer -c "SELECT version();"
   ```

2. **API Health Check**:
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Frontend Test**:
   - Open `http://localhost:3000`
   - Verify login works
   - Test cloud credential addition
   - Run inventory scan

## 🚀 Production Deployment

### Environment Setup

```bash
# Set production environment
export NODE_ENV=production
export DATABASE_URL=postgresql://user:pass@host:port/db
export SESSION_SECRET=your-production-secret-key
```

### Security Considerations

1. **Change default passwords**
2. **Use strong session secrets**
3. **Enable HTTPS in production**
4. **Configure firewall rules**
5. **Regular security updates**

### Performance Optimization

1. **Database indexing**
2. **Connection pooling**
3. **Caching strategies**
4. **Load balancing**

## 📞 Support

If you encounter issues during installation:

1. **Check the logs** for error messages
2. **Verify prerequisites** are installed correctly
3. **Review environment variables**
4. **Create a GitHub issue** with detailed error information

**Contact Information**:
- Email: darbhasantosh11@gmail.com
- GitHub Issues: [Create an issue](https://github.com/santoshguru-11/costcal/issues)
- Documentation: [Wiki](https://github.com/santoshguru-11/costcal/wiki)
