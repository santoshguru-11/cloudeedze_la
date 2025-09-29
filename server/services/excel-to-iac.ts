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

  generateTerraformCode(requirements: InfrastructureRequirement[]): string {
    let terraformCode = `# Generated Infrastructure as Code
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

  generateCSV(estimates: CostEstimate[]): string {
    const totalUpfront = 0;
    const totalMonthly = estimates.reduce((sum, est) => sum + est.monthlyEstimate, 0);
    const total12Months = totalMonthly * 12;

    let csv = `Estimate summary\n`;
    csv += `Upfront cost,Monthly cost,Total 12 months cost,Currency\n`;
    csv += `${totalUpfront},${totalMonthly.toFixed(2)},${total12Months.toFixed(2)},USD\n`;
    csv += `,,* Includes upfront cost\n\n\n`;
    csv += `Detailed Estimate\n`;
    csv += `Group hierarchy,Region,Description,Service,Upfront,Monthly,First 12 months total,Currency,Status,Configuration summary\n`;

    estimates.forEach(est => {
      csv += `BYOL-Cost-estimate,${est.region},${est.resourceName},${est.service},0,${est.monthlyEstimate.toFixed(2)},${est.yearlyEstimate.toFixed(2)},USD,,${est.configuration}\n`;
    });

    csv += `\n\nAcknowledgement\n`;
    csv += `"* AWS Pricing Calculator provides only an estimate of your AWS fees and doesn't include any taxes that might apply. Your actual fees depend on a variety of factors, including your actual usage of AWS services."\n`;

    return csv;
  }
}