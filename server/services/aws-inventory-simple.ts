import AWS from 'aws-sdk';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

export interface AWSResource {
  id: string;
  name: string;
  type: string;
  service: string;
  region: string;
  tags?: Record<string, string>;
  state: string;
  costDetails?: {
    instanceType?: string;
    size?: string;
    vcpus?: number;
    memory?: number;
    storage?: number;
  };
}

export interface AWSInventory {
  resources: AWSResource[];
  summary: {
    totalResources: number;
    services: Record<string, number>;
    regions: Record<string, number>;
  };
  scanDate: string;
}

export class AWSSimpleInventoryService {
  private credentials: AWSCredentials;

  constructor(credentials: AWSCredentials) {
    this.credentials = credentials;
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
      ...(credentials.sessionToken && { sessionToken: credentials.sessionToken })
    });
  }

  async discoverResources(): Promise<AWSInventory> {
    console.log('AWS inventory service: discovering real AWS resources using focused scanning');
    
    try {
      // Discover resources from key AWS services (inspired by nccgroup/aws-inventory)
      const [
        ec2Resources,
        s3Resources,
        rdsResources,
        lambdaResources,
        elbResources,
        ebsResources,
        vpcResources,
        securityGroupResources,
        iamResources,
        cloudFormationResources,
        cloudFrontResources,
        route53Resources,
        snsResources,
        sqsResources,
        dynamoDbResources,
        elasticacheResources
      ] = await Promise.all([
        this.discoverEC2Instances(),
        this.discoverS3Buckets(),
        this.discoverRDSInstances(),
        this.discoverLambdaFunctions(),
        this.discoverLoadBalancers(),
        this.discoverEBSVolumes(),
        this.discoverVPCs(),
        this.discoverSecurityGroups(),
        this.discoverIAMUsers(),
        this.discoverCloudFormationStacks(),
        this.discoverCloudFrontDistributions(),
        this.discoverRoute53HostedZones(),
        this.discoverSNSTopics(),
        this.discoverSQSQueues(),
        this.discoverDynamoDBTables(),
        this.discoverElastiCacheClusters()
      ]);

      const allResources = [
        ...ec2Resources,
        ...s3Resources,
        ...rdsResources,
        ...lambdaResources,
        ...elbResources,
        ...ebsResources,
        ...vpcResources,
        ...securityGroupResources,
        ...iamResources,
        ...cloudFormationResources,
        ...cloudFrontResources,
        ...route53Resources,
        ...snsResources,
        ...sqsResources,
        ...dynamoDbResources,
        ...elasticacheResources
      ];

      // Calculate summary
      const services: Record<string, number> = {};
      const regions: Record<string, number> = {};

      allResources.forEach(resource => {
        services[resource.service] = (services[resource.service] || 0) + 1;
        regions[resource.region] = (regions[resource.region] || 0) + 1;
      });

      const summary = {
        totalResources: allResources.length,
        services,
        regions
      };

      console.log(`AWS inventory scan completed: ${allResources.length} resources found across ${Object.keys(services).length} services`);

      return {
        resources: allResources,
        summary,
        scanDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error discovering AWS resources:', error);
      throw new Error(`Failed to discover AWS resources: ${error.message}`);
    }
  }

  private async discoverEC2Instances(): Promise<AWSResource[]> {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await ec2.describeInstances().promise();
      
      for (const reservation of response.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const tags: Record<string, string> = {};
          instance.Tags?.forEach(tag => {
            if (tag.Key && tag.Value) {
              tags[tag.Key] = tag.Value;
            }
          });

          resources.push({
            id: instance.InstanceId || 'unknown',
            name: tags.Name || instance.InstanceId || 'unnamed',
            type: instance.InstanceType || 'unknown',
            service: 'EC2',
            region: this.credentials.region,
            tags,
            state: instance.State?.Name || 'unknown',
            costDetails: {
              instanceType: instance.InstanceType,
              vcpus: this.getVCPUsFromInstanceType(instance.InstanceType),
              memory: this.getMemoryFromInstanceType(instance.InstanceType)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error discovering EC2 instances:', error);
    }

    return resources;
  }

  private async discoverS3Buckets(): Promise<AWSResource[]> {
    const s3 = new AWS.S3({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await s3.listBuckets().promise();
      
      for (const bucket of response.Buckets || []) {
        resources.push({
          id: bucket.Name || 'unknown',
          name: bucket.Name || 'unnamed',
          type: 'Bucket',
          service: 'S3',
          region: this.credentials.region,
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering S3 buckets:', error);
    }

    return resources;
  }

  private async discoverRDSInstances(): Promise<AWSResource[]> {
    const rds = new AWS.RDS({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await rds.describeDBInstances().promise();
      
      for (const instance of response.DBInstances || []) {
        resources.push({
          id: instance.DBInstanceIdentifier || 'unknown',
          name: instance.DBInstanceIdentifier || 'unnamed',
          type: instance.DBInstanceClass || 'unknown',
          service: 'RDS',
          region: this.credentials.region,
          state: instance.DBInstanceStatus || 'unknown',
          costDetails: {
            instanceType: instance.DBInstanceClass,
            storage: instance.AllocatedStorage
          }
        });
      }
    } catch (error) {
      console.error('Error discovering RDS instances:', error);
    }

    return resources;
  }

  private async discoverLambdaFunctions(): Promise<AWSResource[]> {
    const lambda = new AWS.Lambda({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await lambda.listFunctions().promise();
      
      for (const func of response.Functions || []) {
        resources.push({
          id: func.FunctionArn || 'unknown',
          name: func.FunctionName || 'unnamed',
          type: 'Function',
          service: 'Lambda',
          region: this.credentials.region,
          state: func.State || 'unknown',
          costDetails: {
            memory: func.MemorySize
          }
        });
      }
    } catch (error) {
      console.error('Error discovering Lambda functions:', error);
    }

    return resources;
  }

  private async discoverLoadBalancers(): Promise<AWSResource[]> {
    const elbv2 = new AWS.ELBv2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await elbv2.describeLoadBalancers().promise();
      
      for (const lb of response.LoadBalancers || []) {
        resources.push({
          id: lb.LoadBalancerArn || 'unknown',
          name: lb.LoadBalancerName || 'unnamed',
          type: lb.Type || 'unknown',
          service: 'ELB',
          region: this.credentials.region,
          state: lb.State?.Code || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error discovering Load Balancers:', error);
    }

    return resources;
  }

  private async discoverEBSVolumes(): Promise<AWSResource[]> {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await ec2.describeVolumes().promise();
      
      for (const volume of response.Volumes || []) {
        const tags: Record<string, string> = {};
        volume.Tags?.forEach(tag => {
          if (tag.Key && tag.Value) {
            tags[tag.Key] = tag.Value;
          }
        });

        resources.push({
          id: volume.VolumeId || 'unknown',
          name: tags.Name || volume.VolumeId || 'unnamed',
          type: volume.VolumeType || 'unknown',
          service: 'EBS',
          region: this.credentials.region,
          tags,
          state: volume.State || 'unknown',
          costDetails: {
            storage: volume.Size
          }
        });
      }
    } catch (error) {
      console.error('Error discovering EBS volumes:', error);
    }

    return resources;
  }

  private async discoverVPCs(): Promise<AWSResource[]> {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await ec2.describeVpcs().promise();
      
      for (const vpc of response.Vpcs || []) {
        const tags: Record<string, string> = {};
        vpc.Tags?.forEach(tag => {
          if (tag.Key && tag.Value) {
            tags[tag.Key] = tag.Value;
          }
        });

        resources.push({
          id: vpc.VpcId || 'unknown',
          name: tags.Name || vpc.VpcId || 'unnamed',
          type: 'VPC',
          service: 'VPC',
          region: this.credentials.region,
          tags,
          state: vpc.State || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error discovering VPCs:', error);
    }

    return resources;
  }

  private async discoverSecurityGroups(): Promise<AWSResource[]> {
    const ec2 = new AWS.EC2({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await ec2.describeSecurityGroups().promise();
      
      for (const sg of response.SecurityGroups || []) {
        resources.push({
          id: sg.GroupId || 'unknown',
          name: sg.GroupName || 'unnamed',
          type: 'SecurityGroup',
          service: 'EC2',
          region: this.credentials.region,
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering Security Groups:', error);
    }

    return resources;
  }

  private async discoverIAMUsers(): Promise<AWSResource[]> {
    const iam = new AWS.IAM();
    const resources: AWSResource[] = [];

    try {
      const response = await iam.listUsers().promise();
      
      for (const user of response.Users || []) {
        resources.push({
          id: user.UserName || 'unknown',
          name: user.UserName || 'unnamed',
          type: 'User',
          service: 'IAM',
          region: 'global',
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering IAM Users:', error);
    }

    return resources;
  }

  private async discoverCloudFormationStacks(): Promise<AWSResource[]> {
    const cloudFormation = new AWS.CloudFormation({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await cloudFormation.listStacks().promise();
      
      for (const stack of response.StackSummaries || []) {
        resources.push({
          id: stack.StackId || 'unknown',
          name: stack.StackName || 'unnamed',
          type: 'Stack',
          service: 'CloudFormation',
          region: this.credentials.region,
          state: stack.StackStatus || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error discovering CloudFormation Stacks:', error);
    }

    return resources;
  }

  private async discoverCloudFrontDistributions(): Promise<AWSResource[]> {
    const cloudFront = new AWS.CloudFront();
    const resources: AWSResource[] = [];

    try {
      const response = await cloudFront.listDistributions().promise();
      
      for (const distribution of response.DistributionList?.Items || []) {
        resources.push({
          id: distribution.Id || 'unknown',
          name: distribution.DomainName || 'unnamed',
          type: 'Distribution',
          service: 'CloudFront',
          region: 'global',
          state: distribution.Status || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error discovering CloudFront Distributions:', error);
    }

    return resources;
  }

  private async discoverRoute53HostedZones(): Promise<AWSResource[]> {
    const route53 = new AWS.Route53();
    const resources: AWSResource[] = [];

    try {
      const response = await route53.listHostedZones().promise();
      
      for (const zone of response.HostedZones || []) {
        resources.push({
          id: zone.Id || 'unknown',
          name: zone.Name || 'unnamed',
          type: 'HostedZone',
          service: 'Route53',
          region: 'global',
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering Route53 Hosted Zones:', error);
    }

    return resources;
  }

  private async discoverSNSTopics(): Promise<AWSResource[]> {
    const sns = new AWS.SNS({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await sns.listTopics().promise();
      
      for (const topic of response.Topics || []) {
        resources.push({
          id: topic.TopicArn || 'unknown',
          name: topic.TopicArn?.split(':').pop() || 'unnamed',
          type: 'Topic',
          service: 'SNS',
          region: this.credentials.region,
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering SNS Topics:', error);
    }

    return resources;
  }

  private async discoverSQSQueues(): Promise<AWSResource[]> {
    const sqs = new AWS.SQS({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await sqs.listQueues().promise();
      
      for (const queueUrl of response.QueueUrls || []) {
        resources.push({
          id: queueUrl || 'unknown',
          name: queueUrl.split('/').pop() || 'unnamed',
          type: 'Queue',
          service: 'SQS',
          region: this.credentials.region,
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering SQS Queues:', error);
    }

    return resources;
  }

  private async discoverDynamoDBTables(): Promise<AWSResource[]> {
    const dynamodb = new AWS.DynamoDB({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await dynamodb.listTables().promise();
      
      for (const tableName of response.TableNames || []) {
        resources.push({
          id: tableName || 'unknown',
          name: tableName || 'unnamed',
          type: 'Table',
          service: 'DynamoDB',
          region: this.credentials.region,
          state: 'active'
        });
      }
    } catch (error) {
      console.error('Error discovering DynamoDB Tables:', error);
    }

    return resources;
  }

  private async discoverElastiCacheClusters(): Promise<AWSResource[]> {
    const elasticache = new AWS.ElastiCache({ region: this.credentials.region });
    const resources: AWSResource[] = [];

    try {
      const response = await elasticache.describeCacheClusters().promise();
      
      for (const cluster of response.CacheClusters || []) {
        resources.push({
          id: cluster.CacheClusterId || 'unknown',
          name: cluster.CacheClusterId || 'unnamed',
          type: cluster.CacheNodeType || 'unknown',
          service: 'ElastiCache',
          region: this.credentials.region,
          state: cluster.CacheClusterStatus || 'unknown'
        });
      }
    } catch (error) {
      console.error('Error discovering ElastiCache Clusters:', error);
    }

    return resources;
  }

  private getVCPUsFromInstanceType(instanceType?: string): number | undefined {
    if (!instanceType) return undefined;
    
    // Simplified mapping - in production, use AWS API or detailed mapping
    const vcpuMap: Record<string, number> = {
      't2.nano': 1, 't2.micro': 1, 't2.small': 1, 't2.medium': 2, 't2.large': 2,
      't3.nano': 2, 't3.micro': 2, 't3.small': 2, 't3.medium': 2, 't3.large': 2,
      'm5.large': 2, 'm5.xlarge': 4, 'm5.2xlarge': 8, 'm5.4xlarge': 16,
      'c5.large': 2, 'c5.xlarge': 4, 'c5.2xlarge': 8, 'c5.4xlarge': 16,
      'r5.large': 2, 'r5.xlarge': 4, 'r5.2xlarge': 8, 'r5.4xlarge': 16
    };
    
    return vcpuMap[instanceType] || undefined;
  }

  private getMemoryFromInstanceType(instanceType?: string): number | undefined {
    if (!instanceType) return undefined;
    
    // Simplified mapping - in production, use AWS API or detailed mapping
    const memoryMap: Record<string, number> = {
      't2.nano': 0.5, 't2.micro': 1, 't2.small': 2, 't2.medium': 4, 't2.large': 8,
      't3.nano': 0.5, 't3.micro': 1, 't3.small': 2, 't3.medium': 4, 't3.large': 8,
      'm5.large': 8, 'm5.xlarge': 16, 'm5.2xlarge': 32, 'm5.4xlarge': 64,
      'c5.large': 4, 'c5.xlarge': 8, 'c5.2xlarge': 16, 'c5.4xlarge': 32,
      'r5.large': 16, 'r5.xlarge': 32, 'r5.2xlarge': 64, 'r5.4xlarge': 128
    };
    
    return memoryMap[instanceType] || undefined;
  }
}
