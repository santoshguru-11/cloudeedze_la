# 🌐 Cloudedze

Cloudedze is a comprehensive multi-cloud cost optimization and inventory management platform that helps organizations discover, analyze, and optimize their cloud resources across AWS, Azure, GCP, and Oracle Cloud Infrastructure (OCI).

![Cloudedze](https://img.shields.io/badge/Cloudedze-Cloud%20Cost%20Optimizer-blue?style=for-the-badge&logo=cloud)
![Multi-Cloud](https://img.shields.io/badge/Multi--Cloud-AWS%20%7C%20Azure%20%7C%20GCP%20%7C%20OCI-green?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

## 🚀 Features

### 🔍 **Multi-Cloud Inventory Discovery**
- **AWS**: EC2 instances, RDS databases, S3 buckets, Lambda functions, VPCs, and more
- **Azure**: Virtual machines, SQL databases, storage accounts, app services, and more
- **GCP**: Compute Engine, Cloud SQL, Cloud Storage, Cloud Functions, and more
- **OCI**: Compute instances, autonomous databases, block volumes, load balancers, VCNs, and more

### 💰 **Cost Analysis & Optimization**
- Real-time cost calculations across all cloud providers
- Side-by-side cost comparisons
- Optimization recommendations
- Budget tracking and alerts
- Cost forecasting

### 📊 **Comprehensive Reporting**
- Interactive dashboards
- Resource utilization analytics
- Cost trend analysis
- Export capabilities (PDF, CSV, JSON)

### 🔐 **Security & Compliance**
- Encrypted credential storage
- Role-based access control
- Audit logging
- GDPR compliant

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js API    │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│  - Dashboard    │◄──►│  - REST API     │◄──►│  - User Data    │
│  - Inventory    │    │  - Auth         │    │  - Credentials  │
│  - Cost Analysis│    │  - Cloud APIs   │    │  - Scan Results │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Cloud Providers│
                       │                 │
                       │  AWS  Azure GCP │
                       │  OCI  (Others)  │
                       └─────────────────┘
```

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for data fetching and caching
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Recharts** for data visualization

### **Backend**
- **Node.js** with TypeScript
- **Express.js** for REST API
- **PostgreSQL** for data persistence
- **Drizzle ORM** for database operations
- **bcrypt** for password hashing
- **express-session** for session management

### **Cloud Integrations**
- **AWS SDK** for JavaScript
- **Azure SDK** for Node.js
- **Google Cloud SDK** for Node.js
- **Oracle Cloud SDK** for Python

## 📋 Prerequisites

- **Node.js** 18+ 
- **Python** 3.8+ (for OCI integration)
- **PostgreSQL** 12+
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/santoshguru-11/costcal.git
cd costcal
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for OCI
pip install -r requirements.txt
```

### 3. Database Setup

```bash
# Option 1: Automated setup
chmod +x setup_database.sh
./setup_database.sh

# Option 2: Manual setup
createdb cloud_cost_optimizer
psql -d cloud_cost_optimizer -f database_setup.sql
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://cloud_cost_user:1101@localhost/cloud_cost_optimizer

# Session Secret
SESSION_SECRET=your-super-secret-session-key

# Server Configuration
PORT=3000
NODE_ENV=development

# Cloud Provider API Keys (Optional - can be added via UI)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
GCP_PROJECT_ID=your-gcp-project-id
```

### 5. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

### 6. Access the Application

Open your browser and navigate to `http://localhost:3000`

**Default Login Credentials:**
- Email: `darbhasantosh11@gmail.com`
- Password: `1101`

## 🔧 Configuration

### Cloud Provider Setup

#### AWS Configuration
1. Create an IAM user with appropriate permissions
2. Generate access keys
3. Add credentials via the UI or environment variables

**Required IAM Permissions:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:Describe*",
                "rds:Describe*",
                "s3:ListAllMyBuckets",
                "s3:GetBucketLocation",
                "lambda:ListFunctions",
                "pricing:GetProducts"
            ],
            "Resource": "*"
        }
    ]
}
```

#### Azure Configuration
1. Create an Azure AD application
2. Generate client ID and secret
3. Assign appropriate roles to the application

**Required Azure Roles:**
- Reader
- Cost Management Reader
- Billing Reader

#### GCP Configuration
1. Create a service account
2. Download the JSON key file
3. Enable required APIs

**Required GCP APIs:**
- Compute Engine API
- Cloud SQL API
- Cloud Storage API
- Cloud Billing API

#### OCI Configuration
1. Create an API key for your user
2. Download the private key
3. Note the fingerprint and OCIDs

**Required OCI Policies:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "core:instance:read",
                "core:volume:read",
                "core:vcn:read",
                "core:subnet:read",
                "object:read",
                "database:read"
            ],
            "Resource": "*"
        }
    ]
}
```

## 📖 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe"
}
```

#### POST `/api/auth/login`
Authenticate user and create session.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "securepassword"
}
```

### Cloud Credentials Endpoints

#### POST `/api/credentials`
Add cloud provider credentials.

**Request Body:**
```json
{
    "provider": "aws",
    "name": "Production AWS",
    "credentials": {
        "accessKeyId": "AKIA...",
        "secretAccessKey": "...",
        "region": "us-east-1"
    }
}
```

#### GET `/api/credentials`
Retrieve all cloud credentials for the authenticated user.

### Inventory Endpoints

#### POST `/api/inventory/scan`
Start a cloud inventory scan.

**Request Body:**
```json
{
    "providers": ["aws", "azure", "gcp", "oci"],
    "credentials": [
        {
            "provider": "aws",
            "credentials": { /* AWS credentials */ }
        }
    ]
}
```

#### GET `/api/inventory/scans`
Retrieve scan history for the authenticated user.

### Cost Analysis Endpoints

#### POST `/api/cost/analyze`
Perform cost analysis based on requirements.

**Request Body:**
```json
{
    "requirements": {
        "compute": {
            "vcpus": 4,
            "memory": 8,
            "storage": 100
        },
        "database": {
            "type": "managed",
            "size": "medium"
        },
        "region": "us-east-1"
    }
}
```

## 🗄️ Database Schema

### Tables Overview

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts | id, email, password, first_name, last_name |
| `sessions` | User sessions | sid, sess, expire |
| `cloud_credentials` | Encrypted cloud credentials | id, user_id, provider, encrypted_credentials |
| `inventory_scans` | Scan results | id, user_id, scan_data, scan_date |
| `cost_analyses` | Cost analysis results | id, user_id, requirements, results |

### Relationships

```mermaid
erDiagram
    users ||--o{ cloud_credentials : owns
    users ||--o{ inventory_scans : performs
    users ||--o{ cost_analyses : requests
    inventory_scans ||--o{ cost_analyses : used_in
    users ||--o{ sessions : has
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run database tests
psql -d cloud_cost_optimizer -f test_database.sql
```

### Test Coverage

```bash
# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   export NODE_ENV=production
   export DATABASE_URL=postgresql://user:pass@host:port/db
   export SESSION_SECRET=your-production-secret
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Cloud Deployment Options

- **AWS**: ECS, Lambda, EC2
- **Azure**: App Service, Container Instances
- **GCP**: Cloud Run, GKE, Compute Engine
- **OCI**: Container Instances, OKE

## 📊 Monitoring & Logging

### Application Monitoring

- **Health Checks**: `/api/health`
- **Metrics**: Prometheus-compatible endpoints
- **Logging**: Structured JSON logging

### Database Monitoring

- **Connection Pool**: Monitored via Drizzle ORM
- **Query Performance**: PostgreSQL query analysis
- **Backup**: Automated daily backups

## 🔒 Security

### Data Protection

- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: HTTPS/TLS
- **Credential Encryption**: AES-256 encryption for cloud credentials
- **Password Hashing**: bcrypt with salt rounds

### Access Control

- **Session Management**: Secure session handling
- **CSRF Protection**: Cross-site request forgery protection
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: API rate limiting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

- **Documentation**: Check this README and inline code comments
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

### Common Issues

#### OCI Integration Issues
- Ensure Python 3.8+ is installed
- Verify OCI SDK is properly installed
- Check credential format and permissions

#### Database Connection Issues
- Verify PostgreSQL is running
- Check connection string format
- Ensure database user has proper permissions

#### Cloud API Issues
- Verify API credentials are correct
- Check cloud provider service status
- Review API rate limits and quotas

## 🗺️ Roadmap

### Upcoming Features

- [ ] **Multi-tenant Support**: Organization and team management
- [ ] **Advanced Analytics**: Machine learning-powered insights
- [ ] **Cost Optimization**: Automated resource right-sizing
- [ ] **Compliance Reporting**: SOC2, GDPR compliance tools
- [ ] **API Rate Limiting**: Smart API usage optimization
- [ ] **Mobile App**: React Native mobile application
- [ ] **Webhooks**: Real-time notifications and integrations
- [ ] **Cost Alerts**: Budget threshold notifications

### Version History

- **v1.0.0** - Initial release with basic multi-cloud support
- **v1.1.0** - Added OCI integration and improved UI
- **v1.2.0** - Enhanced cost analysis and reporting
- **v1.3.0** - Added automated database setup and testing

## 🙏 Acknowledgments

- **Oracle Cloud Infrastructure** for comprehensive Python SDK
- **AWS, Azure, GCP** for their excellent cloud APIs
- **Open Source Community** for amazing tools and libraries
- **Contributors** who help improve this project

---

**Made with ❤️ for the cloud community**

For more information, visit our [documentation site](https://github.com/santoshguru-11/costcal/wiki) or contact us at [darbhasantosh11@gmail.com](mailto:darbhasantosh11@gmail.com).