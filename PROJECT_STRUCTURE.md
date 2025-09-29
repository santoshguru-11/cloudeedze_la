# Cloudedze Project Structure

## 📁 Main Project Structure

```
cloudedze-backup-19-sept-0528/
├── 📁 client/                    # React Frontend Application
│   ├── index.html               # Main HTML entry point
│   ├── 📁 public/               # Static assets
│   └── 📁 src/                  # Source code
│       ├── App.tsx              # Main React app component
│       ├── main.tsx             # React entry point
│       ├── index.css            # Global styles
│       ├── 📁 components/       # Reusable UI components
│       ├── 📁 pages/            # Page components
│       ├── 📁 hooks/            # Custom React hooks
│       ├── 📁 lib/              # Utility libraries
│       └── 📁 assets/           # Images, logos, etc.
│
├── 📁 server/                    # Node.js/Express Backend
│   ├── index.ts                 # Main server entry point
│   ├── auth.ts                  # Authentication logic
│   ├── db.ts                    # Database connection
│   ├── encryption.ts            # Encryption utilities
│   ├── routes.ts                # API routes
│   ├── storage.ts               # Database operations
│   ├── vite.ts                  # Vite development server
│   ├── 📁 data/                 # Static data files
│   │   ├── comprehensive-pricing.json
│   │   └── pricing.json
│   ├── 📁 services/             # Business logic services
│   │   ├── aws-inventory.ts
│   │   ├── azure-inventory.ts
│   │   ├── gcp-inventory.ts
│   │   ├── oci-inventory.ts
│   │   ├── excel-parser.ts
│   │   ├── inventory-service.ts
│   │   ├── terraform-parser.ts
│   │   ├── google-sheets-service.ts
│   │   └── 📁 python-scripts/   # Python integration scripts
│   │       ├── oci_discovery.py
│   │       ├── oci-inventory.py
│   │       └── oci-inventory-comprehensive.py
│   └── 📁 utils/                # Utility functions
│       ├── comprehensiveCostCalculator.ts
│       └── costCalculator.ts
│
├── 📁 shared/                    # Shared TypeScript definitions
│   └── schema.ts                # Common interfaces and types
│
├── 📁 docs/                      # Documentation
│   ├── API.md
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md
│   └── INSTALLATION.md
│
├── 📁 dist/                      # Built/compiled files (generated)
│   ├── index.js
│   ├── 📁 public/
│   └── 📁 server/
│
├── 📁 cleanup/                   # 🗂️ Organized cleanup files
│   ├── 📁 testing/              # Testing files and tools
│   ├── 📁 backups/              # Backup files
│   ├── 📁 old-servers/          # Old server implementations
│   ├── 📁 logs/                 # Log files
│   └── 📁 temp-files/           # Temporary and misc files
│
├── 📁 node_modules/              # Dependencies (generated)
│
├── 📄 Configuration Files
├── package.json                  # Node.js project configuration
├── package-lock.json            # Dependency lock file
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite build configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── components.json              # UI components configuration
├── drizzle.config.ts            # Database ORM configuration
├── ecosystem.config.cjs         # PM2 process configuration
├── requirements.txt             # Python dependencies
├── env.example                  # Environment variables template
├── n8n-workflow.json            # n8n automation workflow
├── README.md                    # Project documentation
└── CHANGELOG.md                 # Version history
```

## 🎯 Key Features

### ✅ **Core Functionality**
- **Multi-Cloud Inventory Scanning**: AWS, Azure, GCP, Oracle Cloud
- **Cost Analysis & Optimization**: Comprehensive cost calculations
- **File Upload Support**: Excel files, Terraform state, any file type
- **Google Sheets Integration**: Automatic spreadsheet creation
- **n8n Automation**: AI-powered workflow triggers
- **Real-time Dashboard**: Interactive cost visualization

### 🔧 **Technical Stack**
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Session-based auth with encryption
- **File Processing**: Excel parsing, Terraform state analysis
- **APIs**: Google Sheets API, Cloud provider APIs
- **Automation**: n8n webhook integration

### 🚀 **Deployment Ready**
- **Development**: `npm run dev` - Full-stack development server
- **Production**: `npm run build` - Optimized production build
- **PM2**: Process management with ecosystem configuration
- **Docker**: Containerization support
- **Linux Deployment**: Automated deployment scripts

## 📋 **Cleanup Organization**

### 🧪 **Testing Files** (`cleanup/testing/`)
- Test runners and validators
- Test data and sample files
- Testing documentation
- Comparison tools and reports

### 💾 **Backups** (`cleanup/backups/`)
- Backup versions of source files
- Old implementations
- Historical versions

### 🖥️ **Old Servers** (`cleanup/old-servers/`)
- Legacy server implementations
- Working prototypes
- Alternative solutions

### 📝 **Logs** (`cleanup/logs/`)
- Application logs
- Error logs
- Process logs

### 🗂️ **Temp Files** (`cleanup/temp-files/`)
- Temporary files
- Deployment archives
- Configuration backups
- Session files

## 🎉 **Project Status**

✅ **Fully Functional** - All core features working
✅ **Google Sheets Integration** - Complete with API setup
✅ **n8n Automation** - Webhook triggers working
✅ **File Upload** - Any file type supported
✅ **Cost Analysis** - Multi-cloud cost calculations
✅ **Clean Structure** - Organized and maintainable

## 🚀 **Quick Start**

1. **Install Dependencies**: `npm install`
2. **Setup Environment**: Copy `env.example` to `.env` and configure
3. **Start Development**: `npm run dev`
4. **Access Application**: http://localhost:3000

## 📞 **Support**

- **Documentation**: Check `docs/` folder
- **API Reference**: `docs/API.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Contributing**: `docs/CONTRIBUTING.md`
