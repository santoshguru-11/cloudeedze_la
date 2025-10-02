import * as XLSX from 'xlsx';

export interface InfrastructureRequirement {
  slNo: number;
  site: string; // DC/DR
  category: string; // Prod/Non Prod
  workloadType: string; // Web/App/DB
  applicationName: string;
  softwares: string;
  osName: string;
  cpuName: string; // instance type like r5.2xlarge
  physicalCores: number;
  totalThreads: number;
  ramGB: number;
  bootSpaceGB: number;
  dataSpaceGB: number;
  fileStorageGB: number;
  loadBalanced: string; // Yes/No
  haRequired: string; // Yes/No
}

export interface TerraformResource {
  resourceType: string;
  resourceName: string;
  configuration: Record<string, any>;
  estimatedMonthlyCost: number;
}

export interface CostEstimate {
  resourceName: string;
  service: string;
  region: string;
  monthlyEstimate: number;
  yearlyEstimate: number;
  configuration: string;
}

export class ExcelToIaCService {
  private awsRegion = 'ap-south-1'; // Hyderabad region

  async parseExcelFile(fileBuffer: Buffer): Promise<InfrastructureRequirement[]> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0]; // Use first sheet
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON, skipping header row
      const jsonData = XLSX.utils.sheet_to_json(sheet, {
        range: 1, // Skip first row (header)
        header: [
          'slNo', 'site', 'category', 'workloadType', 'applicationName',
          'softwares', 'osName', 'cpuName', 'physicalCores', 'totalThreads',
          'ramGB', 'bootSpaceGB', 'dataSpaceGB', 'fileStorageGB', 'loadBalanced', 'haRequired'
        ]
      });

      return jsonData.map((row: any) => ({
        slNo: Number(row.slNo) || 0,
        site: String(row.site || '').trim(),
        category: String(row.category || '').trim(),
        workloadType: String(row.workloadType || '').trim(),
        applicationName: String(row.applicationName || '').trim(),
        softwares: String(row.softwares || '').trim(),
        osName: String(row.osName || '').trim(),
        cpuName: String(row.cpuName || '').trim(),
        physicalCores: Number(row.physicalCores) || 0,
        totalThreads: Number(row.totalThreads) || 0,
        ramGB: Number(row.ramGB) || 0,
        bootSpaceGB: Number(row.bootSpaceGB) || 0,
        dataSpaceGB: Number(row.dataSpaceGB) || 0,
        fileStorageGB: Number(row.fileStorageGB) || 0,
        loadBalanced: String(row.loadBalanced || '').trim(),
        haRequired: String(row.haRequired || '').trim()
      })).filter(req => req.slNo > 0); // Filter out empty rows
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error('Failed to parse Excel file');
    }
  }

  // Generate Terraform for all cloud providers
  generateMultiCloudTerraform(requirements: InfrastructureRequirement[]): Record<string, string> {
    return {
      aws: this.generateTerraformCode(requirements),
      azure: this.generateAzureTerraformCode(requirements),
      gcp: this.generateGCPTerraformCode(requirements),
      oci: this.generateOCITerraformCode(requirements)
    };
  }

  generateTerraformCode(requirements: InfrastructureRequirement[]): string {
    let terraformCode = `# Generated Infrastructure as Code for AWS
# Source: Excel Infrastructure Requirements
# Generated: ${new Date().toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "${this.awsRegion}"
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "\${var.project_name}-vpc"
    Environment = var.environment
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "\${var.project_name}-igw"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "\${var.project_name}-public-subnet-\${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.\${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "\${var.project_name}-private-subnet-\${count.index + 1}"
    Type = "Private"
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "\${var.project_name}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "web" {
  name        = "\${var.project_name}-web-sg"
  description = "Security group for web servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-web-sg"
  }
}

resource "aws_security_group" "app" {
  name        = "\${var.project_name}-app-sg"
  description = "Security group for application servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-app-sg"
  }
}

resource "aws_security_group" "db" {
  name        = "\${var.project_name}-db-sg"
  description = "Security group for database servers"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 1521
    to_port         = 1521
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "\${var.project_name}-db-sg"
  }
}

`;

    // Generate resources for each requirement
    requirements.forEach((req, index) => {
      terraformCode += this.generateResourceForRequirement(req, index);
    });

    // Add outputs
    terraformCode += `
# Outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
`;

    return terraformCode;
  }

  private generateResourceForRequirement(req: InfrastructureRequirement, index: number): string {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`;
    let code = '';

    if (req.workloadType.toLowerCase().includes('db')) {
      // Generate RDS for database workloads
      code += this.generateRDSInstance(req, resourceName);
    } else {
      // Generate EC2 for web/app workloads
      code += this.generateEC2Instance(req, resourceName);
    }

    // Add EBS volumes if data space is specified
    if (req.dataSpaceGB > 0) {
      code += this.generateEBSVolume(req, resourceName);
    }

    // Add EFS if file storage is specified
    if (req.fileStorageGB > 0) {
      code += this.generateEFS(req, resourceName);
    }

    // Add load balancer if specified
    if (req.loadBalanced.toLowerCase().includes('yes')) {
      code += this.generateLoadBalancer(req, resourceName);
    }

    return code;
  }

  private generateEC2Instance(req: InfrastructureRequirement, resourceName: string): string {
    const instanceType = this.mapInstanceType(req.cpuName);

    return `
# EC2 Instance for ${req.applicationName}
resource "aws_instance" "${resourceName}" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "${instanceType}"
  subnet_id              = aws_subnet.private[0].id
  vpc_security_group_ids = [aws_security_group.${req.workloadType.toLowerCase().includes('web') ? 'web' : 'app'}.id]

  root_block_device {
    volume_type = "gp3"
    volume_size = ${req.bootSpaceGB || 20}
    encrypted   = true
  }

  tags = {
    Name        = "${req.applicationName}-${req.workloadType}"
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              # Add your application installation scripts here
              EOF
  )
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}
`;
  }

  private generateRDSInstance(req: InfrastructureRequirement, resourceName: string): string {
    const instanceClass = this.mapRDSInstanceClass(req.cpuName);
    const allocatedStorage = Math.max(req.dataSpaceGB || 100, 100);

    return `
# RDS Instance for ${req.applicationName}
resource "aws_db_instance" "${resourceName}_db" {
  identifier     = "${resourceName.replace(/_/g, '-')}-db"
  engine         = "oracle-ee"
  engine_version = "19.0.0.0.ru-2021-07.rur-2021-07.r1"
  instance_class = "${instanceClass}"

  allocated_storage     = ${allocatedStorage}
  max_allocated_storage = ${allocatedStorage * 2}
  storage_type         = "gp3"
  storage_encrypted    = true

  db_name  = "ORCL"
  username = "admin"
  password = "change-me-in-production" # Use AWS Secrets Manager in production

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Sun:04:00-Sun:05:00"

  multi_az               = ${req.haRequired.toLowerCase().includes('yes')}
  publicly_accessible    = false

  skip_final_snapshot = true
  deletion_protection = true

  tags = {
    Name        = "${req.applicationName}-database"
    Environment = var.environment
    Workload    = "Database"
  }
}

resource "aws_db_subnet_group" "main" {
  name       = "\${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "\${var.project_name} DB subnet group"
  }
}
`;
  }

  private generateEBSVolume(req: InfrastructureRequirement, resourceName: string): string {
    return `
# EBS Volume for ${req.applicationName} data
resource "aws_ebs_volume" "${resourceName}_data" {
  availability_zone = aws_instance.${resourceName}.availability_zone
  size             = ${req.dataSpaceGB}
  type             = "gp3"
  encrypted        = true

  tags = {
    Name = "${req.applicationName}-data-volume"
  }
}

resource "aws_volume_attachment" "${resourceName}_data_attachment" {
  device_name = "/dev/sdf"
  volume_id   = aws_ebs_volume.${resourceName}_data.id
  instance_id = aws_instance.${resourceName}.id
}
`;
  }

  private generateEFS(req: InfrastructureRequirement, resourceName: string): string {
    return `
# EFS for ${req.applicationName} shared storage
resource "aws_efs_file_system" "${resourceName}_efs" {
  creation_token = "${resourceName}-efs"
  encrypted      = true

  tags = {
    Name = "${req.applicationName}-efs"
  }
}

resource "aws_efs_mount_target" "${resourceName}_efs_mt" {
  count           = length(aws_subnet.private)
  file_system_id  = aws_efs_file_system.${resourceName}_efs.id
  subnet_id       = aws_subnet.private[count.index].id
  security_groups = [aws_security_group.app.id]
}
`;
  }

  private generateLoadBalancer(req: InfrastructureRequirement, resourceName: string): string {
    return `
# Application Load Balancer for ${req.applicationName}
resource "aws_lb" "${resourceName}_alb" {
  name               = "${resourceName.replace(/_/g, '-')}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web.id]
  subnets            = aws_subnet.public[*].id

  tags = {
    Name = "${req.applicationName}-alb"
  }
}

resource "aws_lb_target_group" "${resourceName}_tg" {
  name     = "${resourceName.replace(/_/g, '-')}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }
}

resource "aws_lb_listener" "${resourceName}_listener" {
  load_balancer_arn = aws_lb.${resourceName}_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.${resourceName}_tg.arn
  }
}

resource "aws_lb_target_group_attachment" "${resourceName}_tg_attachment" {
  target_group_arn = aws_lb_target_group.${resourceName}_tg.arn
  target_id        = aws_instance.${resourceName}.id
  port             = 80
}
`;
  }

  private mapInstanceType(cpuName: string): string {
    // Map CPU names from Excel to AWS instance types
    const mappings: Record<string, string> = {
      'r5.2xlarge': 'r5.2xlarge',
      'r5.alarge': 'r5.large', // Fix typo in Excel
      'r5.large': 'r5.large',
      't3.medium': 't3.medium',
      't3.large': 't3.large',
      't3large': 't3.large'
    };

    return mappings[cpuName.toLowerCase()] || 't3.medium';
  }

  private mapRDSInstanceClass(cpuName: string): string {
    // Map to RDS instance classes
    const mappings: Record<string, string> = {
      'r5.2xlarge': 'db.r5.2xlarge',
      'r5.large': 'db.r5.large',
      't3.medium': 'db.t3.medium',
      't3.large': 'db.t3.large'
    };

    return mappings[cpuName.toLowerCase()] || 'db.t3.medium';
  }

  generateCostEstimate(requirements: InfrastructureRequirement[]): CostEstimate[] {
    const estimates: CostEstimate[] = [];

    requirements.forEach((req, index) => {
      const resourceName = `${req.applicationName}_${index}`;

      if (req.workloadType.toLowerCase().includes('db')) {
        // RDS cost estimation
        const instanceClass = this.mapRDSInstanceClass(req.cpuName);
        const monthlyCost = this.estimateRDSCost(instanceClass, req.dataSpaceGB || 100);

        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: 'Amazon RDS for Oracle',
          region: 'Asia Pacific (Hyderabad)',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Instance: ${instanceClass}, Storage: ${req.dataSpaceGB}GB, Multi-AZ: ${req.haRequired.toLowerCase().includes('yes')}`
        });
      } else {
        // EC2 cost estimation
        const instanceType = this.mapInstanceType(req.cpuName);
        const monthlyCost = this.estimateEC2Cost(instanceType);

        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: 'Amazon EC2',
          region: 'Asia Pacific (Hyderabad)',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Instance: ${instanceType}, OS: Linux, Storage: ${req.bootSpaceGB}GB`
        });
      }

      // Add EBS volume cost if applicable
      if (req.dataSpaceGB > 0) {
        const ebsCost = req.dataSpaceGB * 0.115; // $0.115 per GB per month for gp3
        estimates.push({
          resourceName: `${req.applicationName}-DataVolume`,
          service: 'Amazon EBS',
          region: 'Asia Pacific (Hyderabad)',
          monthlyEstimate: ebsCost,
          yearlyEstimate: ebsCost * 12,
          configuration: `GP3 Storage: ${req.dataSpaceGB}GB`
        });
      }

      // Add EFS cost if applicable
      if (req.fileStorageGB > 0) {
        const efsCost = req.fileStorageGB * 0.345 * 1024; // Convert GB to TB, $0.345 per TB per month
        estimates.push({
          resourceName: `${req.applicationName}-EFS`,
          service: 'Amazon EFS',
          region: 'Asia Pacific (Hyderabad)',
          monthlyEstimate: efsCost,
          yearlyEstimate: efsCost * 12,
          configuration: `Standard Storage: ${req.fileStorageGB}GB`
        });
      }

      // Add ALB cost if applicable
      if (req.loadBalanced.toLowerCase().includes('yes')) {
        const albCost = 23.36; // ~$23.36 per month for ALB
        estimates.push({
          resourceName: `${req.applicationName}-ALB`,
          service: 'Amazon Application Load Balancer',
          region: 'Asia Pacific (Hyderabad)',
          monthlyEstimate: albCost,
          yearlyEstimate: albCost * 12,
          configuration: 'Application Load Balancer with health checks'
        });
      }
    });

    return estimates;
  }

  private estimateEC2Cost(instanceType: string): number {
    // Rough AWS pricing for ap-south-1 (Mumbai - closest to Hyderabad)
    const pricing: Record<string, number> = {
      't3.medium': 32.14,   // per month
      't3.large': 64.28,    // per month
      'r5.large': 97.82,    // per month
      'r5.2xlarge': 394.2   // per month
    };

    return pricing[instanceType] || pricing['t3.medium'];
  }

  private estimateRDSCost(instanceClass: string, storageGB: number): number {
    // Rough RDS pricing for Oracle EE with BYOL
    const instancePricing: Record<string, number> = {
      'db.t3.medium': 400,     // per month
      'db.t3.large': 800,      // per month
      'db.r5.large': 1200,     // per month
      'db.r5.2xlarge': 1640.96 // per month
    };

    const instanceCost = instancePricing[instanceClass] || instancePricing['db.t3.medium'];
    const storageCost = storageGB * 0.138; // $0.138 per GB per month for gp3

    return instanceCost + storageCost;
  }

  generateCSV(estimates: CostEstimate[], provider: string = 'AWS'): string {
    const totalUpfront = 0;
    const totalMonthly = estimates.reduce((sum, est) => sum + est.monthlyEstimate, 0);
    const total12Months = totalMonthly * 12;

    let csv = `${provider} Cost Estimate Summary\n`;
    csv += `Upfront cost,Monthly cost,Total 12 months cost,Currency\n`;
    csv += `${totalUpfront},${totalMonthly.toFixed(2)},${total12Months.toFixed(2)},USD\n`;
    csv += `,,* Includes upfront cost\n\n\n`;
    csv += `Detailed Estimate\n`;
    csv += `Group hierarchy,Region,Description,Service,Upfront,Monthly,First 12 months total,Currency,Status,Configuration summary\n`;

    estimates.forEach(est => {
      csv += `${provider}-Cost-estimate,${est.region},${est.resourceName},${est.service},0,${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},USD,,${est.configuration}\n`;
    });

    csv += `\n\nAcknowledgement\n`;
    csv += `"* This is an estimate of cloud provider fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of cloud services."\n`;

    return csv;
  }

  generateMultiCloudCSV(requirements: InfrastructureRequirement[]): Record<string, string> {
    const multiCloudCosts = this.generateMultiCloudCostEstimate(requirements);

    return {
      aws: this.generateCSV(multiCloudCosts.aws.estimates, 'AWS'),
      azure: this.generateCSV(multiCloudCosts.azure.estimates, 'Azure'),
      gcp: this.generateCSV(multiCloudCosts.gcp.estimates, 'GCP'),
      oci: this.generateCSV(multiCloudCosts.oci.estimates, 'OCI'),
      combined: this.generateCombinedCSV(multiCloudCosts)
    };
  }

  private generateCombinedCSV(multiCloudCosts: Record<string, { estimates: CostEstimate[], totalMonthly: number, totalYearly: number }>): string {
    let csv = `Multi-Cloud Cost Comparison Summary\n\n`;

    // Summary table
    csv += `Provider,Monthly Cost,Yearly Cost,Currency\n`;
    csv += `AWS,${multiCloudCosts.aws.totalMonthly.toFixed(2)},${multiCloudCosts.aws.totalYearly.toFixed(2)},USD\n`;
    csv += `Azure,${multiCloudCosts.azure.totalMonthly.toFixed(2)},${multiCloudCosts.azure.totalYearly.toFixed(2)},USD\n`;
    csv += `GCP,${multiCloudCosts.gcp.totalMonthly.toFixed(2)},${multiCloudCosts.gcp.totalYearly.toFixed(2)},USD\n`;
    csv += `OCI,${multiCloudCosts.oci.totalMonthly.toFixed(2)},${multiCloudCosts.oci.totalYearly.toFixed(2)},USD\n`;

    // Find best value
    const providers = [
      { name: 'AWS', monthly: multiCloudCosts.aws.totalMonthly },
      { name: 'Azure', monthly: multiCloudCosts.azure.totalMonthly },
      { name: 'GCP', monthly: multiCloudCosts.gcp.totalMonthly },
      { name: 'OCI', monthly: multiCloudCosts.oci.totalMonthly }
    ];
    const cheapest = providers.reduce((min, p) => p.monthly < min.monthly ? p : min);
    const mostExpensive = providers.reduce((max, p) => p.monthly > max.monthly ? p : max);
    const savings = mostExpensive.monthly - cheapest.monthly;
    const savingsPercent = ((savings / mostExpensive.monthly) * 100).toFixed(1);

    csv += `\nBest Value,${cheapest.name}\n`;
    csv += `Potential Savings,"$${savings.toFixed(2)}/month (${savingsPercent}% vs ${mostExpensive.name})"\n`;

    csv += `\n\n=== AWS Detailed Breakdown ===\n`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration\n`;
    multiCloudCosts.aws.estimates.forEach(est => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"\n`;
    });

    csv += `\n\n=== Azure Detailed Breakdown ===\n`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration\n`;
    multiCloudCosts.azure.estimates.forEach(est => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"\n`;
    });

    csv += `\n\n=== GCP Detailed Breakdown ===\n`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration\n`;
    multiCloudCosts.gcp.estimates.forEach(est => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"\n`;
    });

    csv += `\n\n=== OCI Detailed Breakdown ===\n`;
    csv += `Region,Description,Service,Monthly,Yearly,Configuration\n`;
    multiCloudCosts.oci.estimates.forEach(est => {
      csv += `${est.region},${est.resourceName},${est.service},${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},"${est.configuration}"\n`;
    });

    csv += `\n\nAcknowledgement\n`;
    csv += `"* This multi-cloud comparison provides estimates from each provider and doesn't include any taxes that might apply. Actual costs depend on various factors including usage patterns, commitment terms, and specific service configurations."\n`;

    return csv;
  }

  // Azure Terraform Generation
  generateAzureTerraformCode(requirements: InfrastructureRequirement[]): string {
    let terraformCode = `# Generated Infrastructure as Code for Azure
# Source: Excel Infrastructure Requirements
# Generated: ${new Date().toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "centralindia"
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "\${var.project_name}-rg"
  location = var.location

  tags = {
    Environment = var.environment
  }
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "\${var.project_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
  }
}

# Subnets
resource "azurerm_subnet" "public" {
  name                 = "\${var.project_name}-public-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_subnet" "private" {
  name                 = "\${var.project_name}-private-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.10.0/24"]
}

# Network Security Groups
resource "azurerm_network_security_group" "web" {
  name                = "\${var.project_name}-web-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "HTTP"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  security_rule {
    name                       = "HTTPS"
    priority                   = 101
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "app" {
  name                = "\${var.project_name}-app-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "AppPort"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "10.0.0.0/16"
    destination_address_prefix = "*"
  }
}

resource "azurerm_network_security_group" "db" {
  name                = "\${var.project_name}-db-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  security_rule {
    name                       = "OracleDB"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "1521"
    source_address_prefix      = "10.0.0.0/16"
    destination_address_prefix = "*"
  }
}

`;

    // Generate resources for each requirement
    requirements.forEach((req, index) => {
      terraformCode += this.generateAzureResourceForRequirement(req, index);
    });

    // Add outputs
    terraformCode += `
# Outputs
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "vnet_id" {
  description = "ID of the virtual network"
  value       = azurerm_virtual_network.main.id
}
`;

    return terraformCode;
  }

  private generateAzureResourceForRequirement(req: InfrastructureRequirement, index: number): string {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`;
    let code = '';

    if (req.workloadType.toLowerCase().includes('db')) {
      code += this.generateAzureDBInstance(req, resourceName);
    } else {
      code += this.generateAzureVM(req, resourceName);
    }

    if (req.loadBalanced.toLowerCase().includes('yes')) {
      code += this.generateAzureLoadBalancer(req, resourceName);
    }

    return code;
  }

  private generateAzureVM(req: InfrastructureRequirement, resourceName: string): string {
    const vmSize = this.mapAzureVMSize(req.cpuName);

    return `
# Azure VM for ${req.applicationName}
resource "azurerm_network_interface" "${resourceName}_nic" {
  name                = "${resourceName}-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.private.id
    private_ip_address_allocation = "Dynamic"
  }
}

resource "azurerm_linux_virtual_machine" "${resourceName}" {
  name                = "${req.applicationName}-${req.workloadType}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  size                = "${vmSize}"
  admin_username      = "adminuser"

  network_interface_ids = [
    azurerm_network_interface.${resourceName}_nic.id,
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = ${req.bootSpaceGB || 30}
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }

  tags = {
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }
}

${req.dataSpaceGB > 0 ? `
resource "azurerm_managed_disk" "${resourceName}_data" {
  name                 = "${resourceName}-data-disk"
  location             = azurerm_resource_group.main.location
  resource_group_name  = azurerm_resource_group.main.name
  storage_account_type = "Premium_LRS"
  create_option        = "Empty"
  disk_size_gb         = ${req.dataSpaceGB}
}

resource "azurerm_virtual_machine_data_disk_attachment" "${resourceName}_data_attach" {
  managed_disk_id    = azurerm_managed_disk.${resourceName}_data.id
  virtual_machine_id = azurerm_linux_virtual_machine.${resourceName}.id
  lun                = "0"
  caching            = "ReadWrite"
}
` : ''}
`;
  }

  private generateAzureDBInstance(req: InfrastructureRequirement, resourceName: string): string {
    return `
# Azure Database for ${req.applicationName}
resource "azurerm_mssql_server" "${resourceName}_sql" {
  name                         = "${resourceName}-sqlserver"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  version                      = "12.0"
  administrator_login          = "sqladmin"
  administrator_login_password = "Change-Me-In-Production-123!"
  minimum_tls_version          = "1.2"

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_mssql_database" "${resourceName}_db" {
  name      = "${req.applicationName}-db"
  server_id = azurerm_mssql_server.${resourceName}_sql.id
  sku_name  = "S1"

  max_size_gb = ${Math.max(req.dataSpaceGB || 100, 100)}

  tags = {
    Environment = var.environment
    Workload    = "Database"
  }
}
`;
  }

  private generateAzureLoadBalancer(req: InfrastructureRequirement, resourceName: string): string {
    return `
# Azure Load Balancer for ${req.applicationName}
resource "azurerm_public_ip" "${resourceName}_lb_ip" {
  name                = "${resourceName}-lb-ip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_lb" "${resourceName}_lb" {
  name                = "${resourceName}-lb"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.${resourceName}_lb_ip.id
  }
}

resource "azurerm_lb_backend_address_pool" "${resourceName}_pool" {
  loadbalancer_id = azurerm_lb.${resourceName}_lb.id
  name            = "${resourceName}-backend-pool"
}

resource "azurerm_lb_probe" "${resourceName}_probe" {
  loadbalancer_id = azurerm_lb.${resourceName}_lb.id
  name            = "http-probe"
  port            = 80
}

resource "azurerm_lb_rule" "${resourceName}_rule" {
  loadbalancer_id                = azurerm_lb.${resourceName}_lb.id
  name                           = "HTTP"
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  frontend_ip_configuration_name = "PublicIPAddress"
  backend_address_pool_ids       = [azurerm_lb_backend_address_pool.${resourceName}_pool.id]
  probe_id                       = azurerm_lb_probe.${resourceName}_probe.id
}
`;
  }

  private mapAzureVMSize(cpuName: string): string {
    const mappings: Record<string, string> = {
      'r5.2xlarge': 'Standard_E8s_v3',
      'r5.large': 'Standard_E2s_v3',
      't3.medium': 'Standard_B2ms',
      't3.large': 'Standard_B4ms'
    };
    return mappings[cpuName.toLowerCase()] || 'Standard_B2ms';
  }

  // GCP Terraform Generation
  generateGCPTerraformCode(requirements: InfrastructureRequirement[]): string {
    let terraformCode = `# Generated Infrastructure as Code for GCP
# Source: Excel Infrastructure Requirements
# Generated: ${new Date().toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-south1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "\${var.project_name}-vpc"
  auto_create_subnetworks = false
}

# Subnets
resource "google_compute_subnetwork" "public" {
  name          = "\${var.project_name}-public-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

resource "google_compute_subnetwork" "private" {
  name          = "\${var.project_name}-private-subnet"
  ip_cidr_range = "10.0.10.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

# Firewall Rules
resource "google_compute_firewall" "web" {
  name    = "\${var.project_name}-web-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["web"]
}

resource "google_compute_firewall" "app" {
  name    = "\${var.project_name}-app-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = ["10.0.0.0/16"]
  target_tags   = ["app"]
}

resource "google_compute_firewall" "db" {
  name    = "\${var.project_name}-db-firewall"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["1521", "3306", "5432"]
  }

  source_ranges = ["10.0.0.0/16"]
  target_tags   = ["database"]
}

`;

    // Generate resources for each requirement
    requirements.forEach((req, index) => {
      terraformCode += this.generateGCPResourceForRequirement(req, index);
    });

    // Add outputs
    terraformCode += `
# Outputs
output "network_name" {
  description = "Name of the VPC network"
  value       = google_compute_network.main.name
}

output "network_id" {
  description = "ID of the VPC network"
  value       = google_compute_network.main.id
}
`;

    return terraformCode;
  }

  private generateGCPResourceForRequirement(req: InfrastructureRequirement, index: number): string {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`;
    let code = '';

    if (req.workloadType.toLowerCase().includes('db')) {
      code += this.generateGCPDBInstance(req, resourceName);
    } else {
      code += this.generateGCPComputeInstance(req, resourceName);
    }

    if (req.loadBalanced.toLowerCase().includes('yes')) {
      code += this.generateGCPLoadBalancer(req, resourceName);
    }

    return code;
  }

  private generateGCPComputeInstance(req: InfrastructureRequirement, resourceName: string): string {
    const machineType = this.mapGCPMachineType(req.cpuName);

    return `
# GCP Compute Instance for ${req.applicationName}
resource "google_compute_instance" "${resourceName}" {
  name         = "${req.applicationName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${req.workloadType.toLowerCase()}"
  machine_type = "${machineType}"
  zone         = "\${var.region}-a"

  tags = ${req.workloadType.toLowerCase().includes('web') ? '["web"]' : '["app"]'}

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
      size  = ${req.bootSpaceGB || 20}
      type  = "pd-ssd"
    }
  }

  ${req.dataSpaceGB > 0 ? `
  attached_disk {
    source = google_compute_disk.${resourceName}_data.id
    mode   = "READ_WRITE"
  }
  ` : ''}

  network_interface {
    subnetwork = google_compute_subnetwork.private.id
  }

  metadata = {
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }

  metadata_startup_script = <<-EOF
    #!/bin/bash
    apt-get update
    # Add your application installation scripts here
  EOF
}

${req.dataSpaceGB > 0 ? `
resource "google_compute_disk" "${resourceName}_data" {
  name = "${resourceName}-data-disk"
  type = "pd-ssd"
  zone = "\${var.region}-a"
  size = ${req.dataSpaceGB}
}
` : ''}
`;
  }

  private generateGCPDBInstance(req: InfrastructureRequirement, resourceName: string): string {
    return `
# GCP Cloud SQL Instance for ${req.applicationName}
resource "google_sql_database_instance" "${resourceName}_db" {
  name             = "${resourceName}-db"
  database_version = "MYSQL_8_0"
  region           = var.region

  settings {
    tier = "db-n1-standard-2"

    disk_size       = ${Math.max(req.dataSpaceGB || 100, 100)}
    disk_type       = "PD_SSD"
    disk_autoresize = true

    backup_configuration {
      enabled            = true
      start_time         = "03:00"
      binary_log_enabled = true
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    ${req.haRequired.toLowerCase().includes('yes') ? 'availability_type = "REGIONAL"' : ''}
  }

  deletion_protection = true
}

resource "google_sql_database" "${resourceName}_database" {
  name     = "${req.applicationName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}"
  instance = google_sql_database_instance.${resourceName}_db.name
}
`;
  }

  private generateGCPLoadBalancer(req: InfrastructureRequirement, resourceName: string): string {
    return `
# GCP Load Balancer for ${req.applicationName}
resource "google_compute_global_address" "${resourceName}_lb_ip" {
  name = "${resourceName}-lb-ip"
}

resource "google_compute_backend_service" "${resourceName}_backend" {
  name          = "${resourceName}-backend"
  health_checks = [google_compute_health_check.${resourceName}_health.id]

  backend {
    group = google_compute_instance_group.${resourceName}_group.id
  }
}

resource "google_compute_health_check" "${resourceName}_health" {
  name               = "${resourceName}-health-check"
  check_interval_sec = 30
  timeout_sec        = 5

  http_health_check {
    port = 80
    request_path = "/"
  }
}

resource "google_compute_instance_group" "${resourceName}_group" {
  name = "${resourceName}-instance-group"
  zone = "\${var.region}-a"

  instances = [
    google_compute_instance.${resourceName}.id
  ]
}

resource "google_compute_url_map" "${resourceName}_url_map" {
  name            = "${resourceName}-url-map"
  default_service = google_compute_backend_service.${resourceName}_backend.id
}

resource "google_compute_target_http_proxy" "${resourceName}_proxy" {
  name    = "${resourceName}-http-proxy"
  url_map = google_compute_url_map.${resourceName}_url_map.id
}

resource "google_compute_global_forwarding_rule" "${resourceName}_forwarding" {
  name       = "${resourceName}-forwarding-rule"
  target     = google_compute_target_http_proxy.${resourceName}_proxy.id
  port_range = "80"
  ip_address = google_compute_global_address.${resourceName}_lb_ip.address
}
`;
  }

  private mapGCPMachineType(cpuName: string): string {
    const mappings: Record<string, string> = {
      'r5.2xlarge': 'n2-highmem-8',
      'r5.large': 'n2-highmem-2',
      't3.medium': 'n2-standard-2',
      't3.large': 'n2-standard-4'
    };
    return mappings[cpuName.toLowerCase()] || 'n2-standard-2';
  }

  // OCI Terraform Generation
  generateOCITerraformCode(requirements: InfrastructureRequirement[]): string {
    let terraformCode = `# Generated Infrastructure as Code for OCI
# Source: Excel Infrastructure Requirements
# Generated: ${new Date().toISOString()}

terraform {
  required_version = ">= 1.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 5.0"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Variables
variable "tenancy_ocid" {
  description = "OCI Tenancy OCID"
  type        = string
}

variable "user_ocid" {
  description = "OCI User OCID"
  type        = string
}

variable "fingerprint" {
  description = "OCI API Key Fingerprint"
  type        = string
}

variable "private_key_path" {
  description = "Path to OCI API private key"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "ap-hyderabad-1"
}

variable "compartment_id" {
  description = "OCI Compartment OCID"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "infrastructure"
}

# Get availability domains
data "oci_identity_availability_domains" "ads" {
  compartment_id = var.tenancy_ocid
}

# VCN (Virtual Cloud Network)
resource "oci_core_vcn" "main" {
  compartment_id = var.compartment_id
  cidr_blocks    = ["10.0.0.0/16"]
  display_name   = "\${var.project_name}-vcn"
  dns_label      = "mainvcn"

  freeform_tags = {
    Environment = var.environment
  }
}

# Internet Gateway
resource "oci_core_internet_gateway" "main" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-igw"
  enabled        = true
}

# Route Table
resource "oci_core_route_table" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-public-rt"

  route_rules {
    network_entity_id = oci_core_internet_gateway.main.id
    destination       = "0.0.0.0/0"
  }
}

# Subnets
resource "oci_core_subnet" "public" {
  compartment_id    = var.compartment_id
  vcn_id            = oci_core_vcn.main.id
  cidr_block        = "10.0.1.0/24"
  display_name      = "\${var.project_name}-public-subnet"
  route_table_id    = oci_core_route_table.public.id
  security_list_ids = [oci_core_security_list.public.id]
  dns_label         = "public"
}

resource "oci_core_subnet" "private" {
  compartment_id             = var.compartment_id
  vcn_id                     = oci_core_vcn.main.id
  cidr_block                 = "10.0.10.0/24"
  display_name               = "\${var.project_name}-private-subnet"
  prohibit_public_ip_on_vnic = true
  security_list_ids          = [oci_core_security_list.private.id]
  dns_label                  = "private"
}

# Security Lists
resource "oci_core_security_list" "public" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-public-sl"

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "0.0.0.0/0"
    tcp_options {
      min = 443
      max = 443
    }
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

resource "oci_core_security_list" "private" {
  compartment_id = var.compartment_id
  vcn_id         = oci_core_vcn.main.id
  display_name   = "\${var.project_name}-private-sl"

  ingress_security_rules {
    protocol = "6" # TCP
    source   = "10.0.0.0/16"
  }

  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
  }
}

`;

    // Generate resources for each requirement
    requirements.forEach((req, index) => {
      terraformCode += this.generateOCIResourceForRequirement(req, index);
    });

    // Add outputs
    terraformCode += `
# Outputs
output "vcn_id" {
  description = "ID of the VCN"
  value       = oci_core_vcn.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = oci_core_subnet.public.id
}

output "private_subnet_id" {
  description = "ID of the private subnet"
  value       = oci_core_subnet.private.id
}
`;

    return terraformCode;
  }

  private generateOCIResourceForRequirement(req: InfrastructureRequirement, index: number): string {
    const resourceName = `${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${index}`;
    let code = '';

    if (req.workloadType.toLowerCase().includes('db')) {
      code += this.generateOCIDBInstance(req, resourceName);
    } else {
      code += this.generateOCIComputeInstance(req, resourceName);
    }

    if (req.loadBalanced.toLowerCase().includes('yes')) {
      code += this.generateOCILoadBalancer(req, resourceName);
    }

    return code;
  }

  private generateOCIComputeInstance(req: InfrastructureRequirement, resourceName: string): string {
    const shape = this.mapOCIShape(req.cpuName);

    return `
# OCI Compute Instance for ${req.applicationName}
data "oci_core_images" "oracle_linux" {
  compartment_id           = var.compartment_id
  operating_system         = "Oracle Linux"
  operating_system_version = "8"
  shape                    = "${shape}"
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

resource "oci_core_instance" "${resourceName}" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${req.applicationName}-${req.workloadType}"
  shape               = "${shape}"

  ${shape.startsWith('VM.Standard.E') ? `
  shape_config {
    memory_in_gbs = ${req.ramGB || 8}
    ocpus         = ${req.physicalCores || 2}
  }
  ` : ''}

  create_vnic_details {
    subnet_id        = oci_core_subnet.private.id
    assign_public_ip = false
  }

  source_details {
    source_type = "image"
    source_id   = data.oci_core_images.oracle_linux.images[0].id
    boot_volume_size_in_gbs = ${req.bootSpaceGB || 50}
  }

  metadata = {
    user_data = base64encode(<<-EOF
      #!/bin/bash
      yum update -y
      # Add your application installation scripts here
    EOF
    )
  }

  freeform_tags = {
    Environment = var.environment
    Workload    = "${req.workloadType}"
    Software    = "${req.softwares}"
  }
}

${req.dataSpaceGB > 0 ? `
resource "oci_core_volume" "${resourceName}_data" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  display_name        = "${resourceName}-data-volume"
  size_in_gbs         = ${req.dataSpaceGB}
}

resource "oci_core_volume_attachment" "${resourceName}_data_attach" {
  attachment_type = "iscsi"
  instance_id     = oci_core_instance.${resourceName}.id
  volume_id       = oci_core_volume.${resourceName}_data.id
}
` : ''}
`;
  }

  private generateOCIDBInstance(req: InfrastructureRequirement, resourceName: string): string {
    return `
# OCI Database System for ${req.applicationName}
resource "oci_database_db_system" "${resourceName}_db" {
  compartment_id      = var.compartment_id
  availability_domain = data.oci_identity_availability_domains.ads.availability_domains[0].name
  database_edition    = "ENTERPRISE_EDITION"

  db_home {
    database {
      admin_password = "Change_Me_In_Production_123"
      db_name        = "${req.applicationName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8)}"
      pdb_name       = "PDB1"
    }
    db_version   = "19.0.0.0"
    display_name = "${req.applicationName}-dbhome"
  }

  shape                   = "VM.Standard2.2"
  subnet_id              = oci_core_subnet.private.id
  ssh_public_keys        = [file("~/.ssh/id_rsa.pub")]
  display_name           = "${req.applicationName}-database"
  hostname               = "${resourceName}db"
  data_storage_size_in_gb = ${Math.max(req.dataSpaceGB || 256, 256)}
  license_model          = "BRING_YOUR_OWN_LICENSE"
  node_count             = ${req.haRequired.toLowerCase().includes('yes') ? '2' : '1'}

  freeform_tags = {
    Environment = var.environment
    Workload    = "Database"
  }
}
`;
  }

  private generateOCILoadBalancer(req: InfrastructureRequirement, resourceName: string): string {
    return `
# OCI Load Balancer for ${req.applicationName}
resource "oci_load_balancer_load_balancer" "${resourceName}_lb" {
  compartment_id = var.compartment_id
  display_name   = "${resourceName}-lb"
  shape          = "flexible"

  shape_details {
    minimum_bandwidth_in_mbps = 10
    maximum_bandwidth_in_mbps = 100
  }

  subnet_ids = [
    oci_core_subnet.public.id
  ]

  is_private = false

  freeform_tags = {
    Environment = var.environment
  }
}

resource "oci_load_balancer_backend_set" "${resourceName}_backend_set" {
  load_balancer_id = oci_load_balancer_load_balancer.${resourceName}_lb.id
  name             = "${resourceName}-backend-set"
  policy           = "ROUND_ROBIN"

  health_checker {
    protocol = "HTTP"
    port     = 80
    url_path = "/"
  }
}

resource "oci_load_balancer_backend" "${resourceName}_backend" {
  load_balancer_id = oci_load_balancer_load_balancer.${resourceName}_lb.id
  backendset_name  = oci_load_balancer_backend_set.${resourceName}_backend_set.name
  ip_address       = oci_core_instance.${resourceName}.private_ip
  port             = 80
  backup           = false
  drain            = false
  offline          = false
  weight           = 1
}

resource "oci_load_balancer_listener" "${resourceName}_listener" {
  load_balancer_id         = oci_load_balancer_load_balancer.${resourceName}_lb.id
  name                     = "${resourceName}-listener"
  default_backend_set_name = oci_load_balancer_backend_set.${resourceName}_backend_set.name
  port                     = 80
  protocol                 = "HTTP"
}
`;
  }

  private mapOCIShape(cpuName: string): string {
    const mappings: Record<string, string> = {
      'r5.2xlarge': 'VM.Standard.E4.Flex',
      'r5.large': 'VM.Standard.E4.Flex',
      't3.medium': 'VM.Standard.E2.2',
      't3.large': 'VM.Standard.E2.4'
    };
    return mappings[cpuName.toLowerCase()] || 'VM.Standard.E2.2';
  }

  // Multi-Cloud Cost Estimation
  generateMultiCloudCostEstimate(requirements: InfrastructureRequirement[]): Record<string, { estimates: CostEstimate[], totalMonthly: number, totalYearly: number }> {
    return {
      aws: {
        estimates: this.generateAWSCostEstimate(requirements),
        totalMonthly: this.generateAWSCostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateAWSCostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      },
      azure: {
        estimates: this.generateAzureCostEstimate(requirements),
        totalMonthly: this.generateAzureCostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateAzureCostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      },
      gcp: {
        estimates: this.generateGCPCostEstimate(requirements),
        totalMonthly: this.generateGCPCostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateGCPCostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      },
      oci: {
        estimates: this.generateOCICostEstimate(requirements),
        totalMonthly: this.generateOCICostEstimate(requirements).reduce((sum, e) => sum + e.monthlyEstimate, 0),
        totalYearly: this.generateOCICostEstimate(requirements).reduce((sum, e) => sum + e.yearlyEstimate, 0)
      }
    };
  }

  private generateAWSCostEstimate(requirements: InfrastructureRequirement[]): CostEstimate[] {
    return this.generateCostEstimate(requirements); // Use existing AWS method
  }

  private generateAzureCostEstimate(requirements: InfrastructureRequirement[]): CostEstimate[] {
    const estimates: CostEstimate[] = [];

    requirements.forEach((req, index) => {
      if (req.workloadType.toLowerCase().includes('db')) {
        const monthlyCost = this.estimateAzureDBCost(req.dataSpaceGB || 100);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: 'Azure SQL Database',
          region: 'Central India',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `S1 tier, Storage: ${req.dataSpaceGB}GB`
        });
      } else {
        const vmSize = this.mapAzureVMSize(req.cpuName);
        const monthlyCost = this.estimateAzureVMCost(vmSize);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: 'Azure Virtual Machine',
          region: 'Central India',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `VM Size: ${vmSize}, OS: Linux, Storage: ${req.bootSpaceGB}GB`
        });
      }

      if (req.dataSpaceGB > 0) {
        const diskCost = req.dataSpaceGB * 0.125; // Premium SSD pricing
        estimates.push({
          resourceName: `${req.applicationName}-DataDisk`,
          service: 'Azure Managed Disk',
          region: 'Central India',
          monthlyEstimate: diskCost,
          yearlyEstimate: diskCost * 12,
          configuration: `Premium SSD: ${req.dataSpaceGB}GB`
        });
      }

      if (req.loadBalanced.toLowerCase().includes('yes')) {
        const lbCost = 25.0;
        estimates.push({
          resourceName: `${req.applicationName}-LB`,
          service: 'Azure Load Balancer',
          region: 'Central India',
          monthlyEstimate: lbCost,
          yearlyEstimate: lbCost * 12,
          configuration: 'Standard Load Balancer'
        });
      }
    });

    return estimates;
  }

  private generateGCPCostEstimate(requirements: InfrastructureRequirement[]): CostEstimate[] {
    const estimates: CostEstimate[] = [];

    requirements.forEach((req, index) => {
      if (req.workloadType.toLowerCase().includes('db')) {
        const monthlyCost = this.estimateGCPDBCost(req.dataSpaceGB || 100);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: 'Cloud SQL',
          region: 'asia-south1 (Mumbai)',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `db-n1-standard-2, Storage: ${req.dataSpaceGB}GB`
        });
      } else {
        const machineType = this.mapGCPMachineType(req.cpuName);
        const monthlyCost = this.estimateGCPComputeCost(machineType);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: 'Compute Engine',
          region: 'asia-south1 (Mumbai)',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Machine: ${machineType}, OS: Linux, Storage: ${req.bootSpaceGB}GB`
        });
      }

      if (req.dataSpaceGB > 0) {
        const diskCost = req.dataSpaceGB * 0.187; // SSD pricing
        estimates.push({
          resourceName: `${req.applicationName}-DataDisk`,
          service: 'Persistent Disk',
          region: 'asia-south1 (Mumbai)',
          monthlyEstimate: diskCost,
          yearlyEstimate: diskCost * 12,
          configuration: `SSD: ${req.dataSpaceGB}GB`
        });
      }

      if (req.loadBalanced.toLowerCase().includes('yes')) {
        const lbCost = 22.0;
        estimates.push({
          resourceName: `${req.applicationName}-LB`,
          service: 'Cloud Load Balancer',
          region: 'asia-south1 (Mumbai)',
          monthlyEstimate: lbCost,
          yearlyEstimate: lbCost * 12,
          configuration: 'HTTP(S) Load Balancer'
        });
      }
    });

    return estimates;
  }

  private generateOCICostEstimate(requirements: InfrastructureRequirement[]): CostEstimate[] {
    const estimates: CostEstimate[] = [];

    requirements.forEach((req, index) => {
      if (req.workloadType.toLowerCase().includes('db')) {
        const monthlyCost = this.estimateOCIDBCost(req.dataSpaceGB || 256);
        estimates.push({
          resourceName: `${req.applicationName}-DB`,
          service: 'OCI Database',
          region: 'Hyderabad',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `VM.Standard2.2, Storage: ${req.dataSpaceGB}GB`
        });
      } else {
        const shape = this.mapOCIShape(req.cpuName);
        const monthlyCost = this.estimateOCIComputeCost(shape, req.physicalCores || 2, req.ramGB || 8);
        estimates.push({
          resourceName: `${req.applicationName}-${req.workloadType}`,
          service: 'OCI Compute',
          region: 'Hyderabad',
          monthlyEstimate: monthlyCost,
          yearlyEstimate: monthlyCost * 12,
          configuration: `Shape: ${shape}, RAM: ${req.ramGB}GB, Storage: ${req.bootSpaceGB}GB`
        });
      }

      if (req.dataSpaceGB > 0) {
        const diskCost = req.dataSpaceGB * 0.085; // Block volume pricing
        estimates.push({
          resourceName: `${req.applicationName}-DataVolume`,
          service: 'OCI Block Volume',
          region: 'Hyderabad',
          monthlyEstimate: diskCost,
          yearlyEstimate: diskCost * 12,
          configuration: `Block Storage: ${req.dataSpaceGB}GB`
        });
      }

      if (req.loadBalanced.toLowerCase().includes('yes')) {
        const lbCost = 20.0;
        estimates.push({
          resourceName: `${req.applicationName}-LB`,
          service: 'OCI Load Balancer',
          region: 'Hyderabad',
          monthlyEstimate: lbCost,
          yearlyEstimate: lbCost * 12,
          configuration: 'Flexible Load Balancer'
        });
      }
    });

    return estimates;
  }

  private estimateAzureVMCost(vmSize: string): number {
    const pricing: Record<string, number> = {
      'Standard_B2ms': 60.74,      // per month
      'Standard_B4ms': 121.47,     // per month
      'Standard_E2s_v3': 122.63,   // per month
      'Standard_E8s_v3': 490.51    // per month
    };
    return pricing[vmSize] || pricing['Standard_B2ms'];
  }

  private estimateAzureDBCost(storageGB: number): number {
    const baseCost = 30.0; // S1 tier
    const storageCost = storageGB * 0.125;
    return baseCost + storageCost;
  }

  private estimateGCPComputeCost(machineType: string): number {
    const pricing: Record<string, number> = {
      'n2-standard-2': 70.08,      // per month
      'n2-standard-4': 140.16,     // per month
      'n2-highmem-2': 94.90,       // per month
      'n2-highmem-8': 379.58       // per month
    };
    return pricing[machineType] || pricing['n2-standard-2'];
  }

  private estimateGCPDBCost(storageGB: number): number {
    const baseCost = 150.0; // db-n1-standard-2
    const storageCost = storageGB * 0.187;
    return baseCost + storageCost;
  }

  private estimateOCIComputeCost(shape: string, ocpus: number, ramGB: number): number {
    if (shape.includes('Flex')) {
      const ocpuCost = ocpus * 36.5; // per OCPU per month
      const ramCost = ramGB * 4.56; // per GB per month
      return ocpuCost + ramCost;
    }

    const pricing: Record<string, number> = {
      'VM.Standard.E2.2': 85.41,   // per month
      'VM.Standard.E2.4': 170.82   // per month
    };
    return pricing[shape] || pricing['VM.Standard.E2.2'];
  }

  private estimateOCIDBCost(storageGB: number): number {
    const baseCost = 350.0; // VM.Standard2.2 DB
    const storageCost = storageGB * 0.085;
    return baseCost + storageCost;
  }
}