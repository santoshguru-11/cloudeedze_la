# 🚀 Deployment Guide

This guide covers various deployment options for the Cloudedze application.

## 📋 Prerequisites

### Production Requirements

- **Node.js**: 18+ (LTS recommended)
- **Python**: 3.8+ (for OCI integration)
- **PostgreSQL**: 12+ (with proper backup strategy)
- **Memory**: 8GB+ RAM
- **Storage**: 20GB+ SSD
- **CPU**: 4+ cores
- **Network**: Stable internet connection

### Security Considerations

- **HTTPS**: SSL/TLS certificates
- **Firewall**: Proper port configuration
- **Updates**: Regular security patches
- **Monitoring**: Application and infrastructure monitoring
- **Backups**: Automated database backups

## ☁️ Cloud Deployment

### AWS Deployment

#### Option 1: ECS with Fargate

1. **Create ECS Cluster**:
   ```bash
   aws ecs create-cluster --cluster-name cloud-cost-optimizer
   ```

2. **Create Task Definition**:
   ```json
   {
     "family": "cloud-cost-optimizer",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "app",
         "image": "your-account.dkr.ecr.region.amazonaws.com/cloud-cost-optimizer:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           }
         ],
         "secrets": [
           {
             "name": "DATABASE_URL",
             "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
           }
         ]
       }
     ]
   }
   ```

3. **Create RDS Database**:
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier cloud-cost-optimizer-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username cloud_cost_user \
     --master-user-password your-secure-password \
     --allocated-storage 20
   ```

#### Option 2: EC2 with Auto Scaling

1. **Create Launch Template**:
   ```bash
   aws ec2 create-launch-template \
     --launch-template-name cloud-cost-optimizer-template \
     --launch-template-data file://launch-template.json
   ```

2. **Create Auto Scaling Group**:
   ```bash
   aws autoscaling create-auto-scaling-group \
     --auto-scaling-group-name cloud-cost-optimizer-asg \
     --launch-template LaunchTemplateName=cloud-cost-optimizer-template \
     --min-size 1 \
     --max-size 5 \
     --desired-capacity 2 \
     --vpc-zone-identifier subnet-12345,subnet-67890
   ```

### Azure Deployment

#### Option 1: Container Instances

1. **Create Resource Group**:
   ```bash
   az group create --name cloud-cost-optimizer --location eastus
   ```

2. **Create Container Instance**:
   ```bash
   az container create \
     --resource-group cloud-cost-optimizer \
     --name cloud-cost-optimizer-app \
     --image your-registry.azurecr.io/cloud-cost-optimizer:latest \
     --cpu 2 \
     --memory 4 \
     --ports 3000 \
     --environment-variables NODE_ENV=production
   ```

3. **Create Azure Database for PostgreSQL**:
   ```bash
   az postgres server create \
     --resource-group cloud-cost-optimizer \
     --name cloud-cost-optimizer-db \
     --admin-user cloud_cost_user \
     --admin-password your-secure-password \
     --sku-name GP_Gen5_2
   ```

#### Option 2: App Service

1. **Create App Service Plan**:
   ```bash
   az appservice plan create \
     --name cloud-cost-optimizer-plan \
     --resource-group cloud-cost-optimizer \
     --sku B1 \
     --is-linux
   ```

2. **Create Web App**:
   ```bash
   az webapp create \
     --resource-group cloud-cost-optimizer \
     --plan cloud-cost-optimizer-plan \
     --name cloud-cost-optimizer-app \
     --deployment-container-image-name your-registry.azurecr.io/cloud-cost-optimizer:latest
   ```

### GCP Deployment

#### Option 1: Cloud Run

1. **Deploy to Cloud Run**:
   ```bash
   gcloud run deploy cloud-cost-optimizer \
     --image gcr.io/your-project/cloud-cost-optimizer:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 2
   ```

2. **Create Cloud SQL Instance**:
   ```bash
   gcloud sql instances create cloud-cost-optimizer-db \
     --database-version POSTGRES_12 \
     --tier db-f1-micro \
     --region us-central1
   ```

#### Option 2: GKE

1. **Create GKE Cluster**:
   ```bash
   gcloud container clusters create cloud-cost-optimizer-cluster \
     --num-nodes 3 \
     --machine-type e2-medium \
     --zone us-central1-a
   ```

2. **Deploy Application**:
   ```bash
   kubectl apply -f k8s/
   ```

### OCI Deployment

#### Option 1: Container Instances

1. **Create Container Instance**:
   ```bash
   oci container-instances container-instance create \
     --compartment-id ocid1.compartment.oc1..aaaaaaa... \
     --display-name cloud-cost-optimizer \
     --containers '[{
       "imageUrl": "your-registry.region.ocir.io/namespace/cloud-cost-optimizer:latest",
       "displayName": "app",
       "resourceConfig": {
         "memoryLimitInGBs": 4,
         "vcpus": 2
       }
     }]'
   ```

2. **Create Autonomous Database**:
   ```bash
   oci db autonomous-database create \
     --compartment-id ocid1.compartment.oc1..aaaaaaa... \
     --db-name cloudcostoptimizer \
     --admin-password your-secure-password \
     --cpu-core-count 1 \
     --data-storage-size-in-tbs 1
   ```

## 🔧 Production Configuration

### Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@host:port/db
DB_POOL_MIN=2
DB_POOL_MAX=10

# Security
SESSION_SECRET=your-super-secret-session-key
ENCRYPTION_KEY=your-32-character-encryption-key

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your-sentry-dsn

# Cloud APIs (optional - can be added via UI)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-secret
GCP_PROJECT_ID=your-gcp-project
OCI_USER_OCID=your-oci-user-ocid
OCI_TENANCY_OCID=your-oci-tenancy-ocid
OCI_FINGERPRINT=your-oci-fingerprint
OCI_PRIVATE_KEY_PATH=/app/keys/oci-private-key.pem
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /api/ {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Increase timeout for long-running requests
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }
    }
}
```

### SSL Certificate Setup

#### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
```

#### Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
```

## 📊 Monitoring & Logging

### Application Monitoring

#### Health Checks

```bash
# Basic health check
curl https://your-domain.com/api/health

# Detailed health check
curl https://your-domain.com/api/health/detailed
```

#### Log Management

```bash
# View application logs
pm2 logs

# View system logs
journalctl -u cloudedze -f

# View PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Database Monitoring

```sql
-- Check database connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('cloud_cost_optimizer'));

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Performance Monitoring

#### Key Metrics to Monitor

- **Response Time**: API endpoint response times
- **Throughput**: Requests per second
- **Error Rate**: 4xx and 5xx error rates
- **Database Performance**: Query execution times
- **Memory Usage**: Application memory consumption
- **CPU Usage**: Application CPU utilization

#### Monitoring Tools

- **Prometheus + Grafana**: Metrics collection and visualization
- **ELK Stack**: Log aggregation and analysis
- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring

## 🔄 Backup & Recovery

### Database Backup

#### Automated Backup Script

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups"
DB_NAME="cloud_cost_optimizer"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### Cron Job Setup

```bash
# Add to crontab
0 2 * * * /path/to/backup-database.sh
```

### Application Backup

```bash
# Backup application files
tar -czf app-backup-$(date +%Y%m%d).tar.gz /app

# Backup configuration files
tar -czf config-backup-$(date +%Y%m%d).tar.gz /etc/nginx/ /app/.env
```

### Recovery Procedures

#### Database Recovery

```bash
# Stop application
pm2 stop all

# Restore database
gunzip -c backup_20240101_020000.sql.gz | psql cloud_cost_optimizer

# Start application
pm2 start all
```

#### Application Recovery

```bash
# Restore application files
tar -xzf app-backup-20240101.tar.gz -C /

# Restore configuration
tar -xzf config-backup-20240101.tar.gz -C /

# Restart services
pm2 restart all
```

## 🔒 Security Hardening

### Server Security

1. **Update System**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure Firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   ```

3. **Disable Root Login**:
   ```bash
   sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
   sudo systemctl restart ssh
   ```

### Application Security

1. **Environment Variables**:
   - Use strong, unique passwords
   - Rotate secrets regularly
   - Store secrets in secure vaults

2. **Database Security**:
   - Use SSL connections
   - Restrict database access
   - Regular security updates

3. **Network Security**:
   - Use HTTPS only
   - Implement rate limiting
   - Configure CORS properly

## 🚨 Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
pm2 logs

# Check environment variables
printenv | grep NODE_ENV

# Check application status
pm2 status
```

#### Database Connection Issues

```bash
# Check database status
pg_isready

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Test connection
psql $DATABASE_URL
```

#### Performance Issues

```bash
# Check resource usage
top
htop

# Check database performance
psql -c "SELECT * FROM pg_stat_activity;"

# Check application logs for errors
pm2 logs | grep ERROR
```

### Emergency Procedures

#### Application Down

1. Check service status
2. Review logs for errors
3. Restart services
4. Check resource usage
5. Verify database connectivity

#### Database Down

1. Check database service
2. Review database logs
3. Check disk space
4. Restore from backup if needed
5. Restart application

## 📞 Support

For deployment issues:

1. **Check logs** for error messages
2. **Verify configuration** matches documentation
3. **Test connectivity** between services
4. **Create GitHub issue** with:
   - Deployment method used
   - Error messages and logs
   - Configuration details
   - Steps to reproduce

**Contact Information**:
- Email: darbhasantosh11@gmail.com
- GitHub Issues: [Create an issue](https://github.com/santoshguru-11/costcal/issues)
- Documentation: [Wiki](https://github.com/santoshguru-11/costcal/wiki)
