# 📝 Changelog

All notable changes to the Cloudedze project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation suite
- Automated database setup script
- Database testing utilities
- Multi-cloud cost analysis features

### Changed
- Improved OCI integration stability
- Enhanced error handling across all cloud providers
- Updated database schema for better performance

### Fixed
- OCI resource discovery showing 0 resources
- Database connection timeout issues
- CORS configuration for cross-origin requests

## [1.3.0] - 2024-01-09

### Added
- **OCI Integration**: Complete Oracle Cloud Infrastructure support
  - Compute instances discovery
  - Block volumes and object storage
  - Load balancers and networking components
  - VCNs, subnets, and security groups
  - Autonomous databases support
  - Comprehensive resource scanning across all compartments

- **Enhanced Database Setup**:
  - Automated database setup script (`setup_database.sh`)
  - Comprehensive database testing script (`test_database.sql`)
  - Fixed PostgreSQL syntax errors
  - Added proper GIN indexes with `pg_trgm` extension
  - Updated user credentials to use password '1101'

- **Performance Optimizations**:
  - Limited OCI image discovery to 20 per compartment
  - Added proper timeout handling (5-minute client/server timeouts)
  - Optimized scan duration and resource usage
  - Added error handling for API rate limits

- **Documentation Suite**:
  - Complete API documentation (`docs/API.md`)
  - Detailed installation guide (`docs/INSTALLATION.md`)
  - Comprehensive deployment guide (`docs/DEPLOYMENT.md`)
  - Contributing guidelines (`docs/CONTRIBUTING.md`)
  - Updated main README with full feature overview

### Changed
- **OCI Service Architecture**:
  - Fixed OCI SDK signer initialization (`private_key_file_location`)
  - Resolved credentials parsing TypeError (replace method)
  - Fixed resource conversion from Python script to frontend
  - Updated data structure handling for Python script output

- **Database Schema**:
  - Fixed GIN index creation syntax
  - Added `pg_trgm` extension for text search
  - Updated user password to '1101'
  - Improved foreign key relationships

- **Error Handling**:
  - Added comprehensive error handling for OCI API calls
  - Improved timeout management across all services
  - Enhanced CORS configuration for better cross-origin support

### Fixed
- **Critical OCI Issues**:
  - `TypeError: Cannot read properties of undefined (reading 'replace')` in credentials parsing
  - `ReferenceError: Cannot access 'resourceData' before initialization` in TypeScript
  - OCI resource discovery showing 0 resources despite successful Python script execution
  - Data structure mismatch between Python script output and frontend display

- **Database Issues**:
  - PostgreSQL syntax errors in database setup script
  - GIN index creation failures
  - Database connection timeout issues
  - Missing extensions for text search functionality

- **Network Issues**:
  - `net::ERR_CONNECTION_REFUSED` errors due to missing CORS headers
  - `net::ERR_NETWORK_IO_SUSPENDED` errors due to timeout issues
  - Browser hanging during long-running OCI scans

### Security
- Enhanced credential encryption and storage
- Improved session management
- Added proper input validation for OCI credentials
- Fixed potential security issues in database setup

## [1.2.0] - 2024-01-08

### Added
- **Multi-Cloud Support**: AWS, Azure, GCP integration
- **Cost Analysis Engine**: Real-time cost calculations
- **Interactive Dashboard**: React-based user interface
- **Database Integration**: PostgreSQL with Drizzle ORM
- **Authentication System**: Session-based user management

### Changed
- Migrated from basic inventory scanner to full cost optimization platform
- Updated UI/UX with modern React components
- Improved database schema for better performance

### Fixed
- Initial cloud provider integration issues
- Database connection problems
- UI responsiveness issues

## [1.1.0] - 2024-01-07

### Added
- **Basic Inventory Scanner**: Initial cloud resource discovery
- **AWS Integration**: EC2, RDS, S3 resource scanning
- **Simple UI**: Basic web interface for resource viewing

### Changed
- Improved resource discovery algorithms
- Enhanced error handling

### Fixed
- Resource counting issues
- Display formatting problems

## [1.0.0] - 2024-01-06

### Added
- **Initial Release**: Basic cloud cost optimization tool
- **Core Architecture**: Node.js backend with React frontend
- **Database Setup**: PostgreSQL integration
- **Basic Features**: User authentication and credential management

---

## 🔗 Links

- [GitHub Repository](https://github.com/santoshguru-11/costcal)
- [Issue Tracker](https://github.com/santoshguru-11/costcal/issues)
- [Documentation](https://github.com/santoshguru-11/costcal/wiki)
- [Contributing Guide](docs/CONTRIBUTING.md)

## 📊 Statistics

### v1.3.0 Release Stats
- **18 files changed**
- **2,684 insertions**
- **305 deletions**
- **New Features**: 8 major features added
- **Bug Fixes**: 12 critical issues resolved
- **Documentation**: 5 comprehensive guides added

### Contributors
- **Primary Developer**: Santosh Darbha (santoshguru-11)
- **Email**: darbhasantosh11@gmail.com

---

**Legend:**
- 🎉 **Added** - New features
- 🔄 **Changed** - Changes to existing functionality
- 🐛 **Fixed** - Bug fixes
- 🔒 **Security** - Security improvements
- 📚 **Documentation** - Documentation updates
- ⚡ **Performance** - Performance improvements
- 🗑️ **Removed** - Removed features
