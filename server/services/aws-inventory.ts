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

export class AWSInventoryService {
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
    console.log('AWS inventory service: discovering real AWS resources using comprehensive scanning');
    
    try {
      // Discover resources from major AWS services (inspired by nccgroup/aws-inventory)
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
        elasticacheResources,
        elasticsearchResources,
        kinesisResources,
        redshiftResources,
        emrResources,
        sagemakerResources,
        glueResources,
        athenaResources,
        quicksightResources,
        cloudwatchResources,
        configResources,
        inspectorResources,
        guarddutyResources,
        macieResources,
        securityHubResources,
        wafResources,
        shieldResources,
        trustedAdvisorResources,
        supportResources,
        billingResources,
        costExplorerResources,
        organizationsResources,
        stsResources,
        kmsResources,
        secretsManagerResources,
        parameterStoreResources,
        systemsManagerResources,
        opsWorksResources,
        elasticBeanstalkResources,
        codeCommitResources,
        codeBuildResources,
        codeDeployResources,
        codePipelineResources,
        xRayResources,
        cloudTrailResources,
        configResources2,
        serviceCatalogResources,
        marketplaceResources,
        marketplaceMeteringResources,
        pricingResources,
        supportResources2,
        workmailResources,
        workdocsResources,
        worklinkResources,
        chimeResources,
        connectResources,
        pinpointResources,
        mobileResources,
        deviceFarmResources,
        appStreamResources,
        workSpacesResources,
        directoryServiceResources,
        cognitoResources,
        iamIdentityCenterResources,
        singleSignOnResources,
        resourceGroupsResources,
        tagEditorResources,
        resourceGroupsTaggingResources,
        cloudFormationResources2,
        cloudFormationStackSetResources,
        serviceCatalogResources2,
        serviceCatalogAppRegistryResources,
        serviceDiscoveryResources,
        appMeshResources,
        appSyncResources,
        apiGatewayResources,
        apiGatewayV2Resources,
        stepFunctionsResources,
        eventBridgeResources,
        cloudWatchEventsResources,
        cloudWatchLogsResources,
        cloudWatchInsightsResources,
        xRayResources2,
        cloudTrailResources2,
        configResources3,
        inspectorResources2,
        guarddutyResources2,
        macieResources2,
        securityHubResources2,
        wafResources2,
        wafV2Resources,
        shieldResources2,
        trustedAdvisorResources2,
        supportResources3,
        billingResources2,
        costExplorerResources2,
        organizationsResources2,
        stsResources2,
        kmsResources2,
        secretsManagerResources2,
        parameterStoreResources2,
        systemsManagerResources2,
        opsWorksResources2,
        elasticBeanstalkResources2,
        codeCommitResources2,
        codeBuildResources2,
        codeDeployResources2,
        codePipelineResources2,
        xRayResources3,
        cloudTrailResources3,
        configResources4,
        serviceCatalogResources3,
        marketplaceResources2,
        marketplaceMeteringResources2,
        pricingResources2,
        supportResources4,
        workmailResources2,
        workdocsResources2,
        worklinkResources2,
        chimeResources2,
        connectResources2,
        pinpointResources2,
        mobileResources2,
        deviceFarmResources2,
        appStreamResources2,
        workSpacesResources2,
        directoryServiceResources2,
        cognitoResources2,
        iamIdentityCenterResources2,
        singleSignOnResources2,
        resourceGroupsResources2,
        tagEditorResources2,
        resourceGroupsTaggingResources2,
        cloudFormationResources3,
        cloudFormationStackSetResources2,
        serviceCatalogResources4,
        serviceCatalogAppRegistryResources2,
        serviceDiscoveryResources2,
        appMeshResources2,
        appSyncResources2,
        apiGatewayResources2,
        apiGatewayV2Resources2,
        stepFunctionsResources2,
        eventBridgeResources2,
        cloudWatchEventsResources2,
        cloudWatchLogsResources2,
        cloudWatchInsightsResources2
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
        this.discoverElastiCacheClusters(),
        this.discoverElasticsearchDomains(),
        this.discoverKinesisStreams(),
        this.discoverRedshiftClusters(),
        this.discoverEMRClusters(),
        this.discoverSageMakerNotebooks(),
        this.discoverGlueJobs(),
        this.discoverAthenaWorkGroups(),
        this.discoverQuickSightDashboards(),
        this.discoverCloudWatchAlarms(),
        this.discoverConfigRules(),
        this.discoverInspectorFindings(),
        this.discoverGuardDutyFindings(),
        this.discoverMacieFindings(),
        this.discoverSecurityHubFindings(),
        this.discoverWAFWebACLs(),
        this.discoverShieldProtections(),
        this.discoverTrustedAdvisorChecks(),
        this.discoverSupportCases(),
        this.discoverBillingCosts(),
        this.discoverCostExplorerReports(),
        this.discoverOrganizationsAccounts(),
        this.discoverSTSCallerIdentity(),
        this.discoverKMSKeys(),
        this.discoverSecretsManagerSecrets(),
        this.discoverParameterStoreParameters(),
        this.discoverSystemsManagerInstances(),
        this.discoverOpsWorksStacks(),
        this.discoverElasticBeanstalkApplications(),
        this.discoverCodeCommitRepositories(),
        this.discoverCodeBuildProjects(),
        this.discoverCodeDeployApplications(),
        this.discoverCodePipelinePipelines(),
        this.discoverXRayTraces(),
        this.discoverCloudTrailTrails(),
        this.discoverConfigConfigurationRecorders(),
        this.discoverServiceCatalogPortfolios(),
        this.discoverMarketplaceProducts(),
        this.discoverMarketplaceMeteringRecords(),
        this.discoverPricingServices(),
        this.discoverSupportServices(),
        this.discoverWorkMailOrganizations(),
        this.discoverWorkDocsSites(),
        this.discoverWorkLinkFleets(),
        this.discoverChimeAccounts(),
        this.discoverConnectInstances(),
        this.discoverPinpointApplications(),
        this.discoverMobileProjects(),
        this.discoverDeviceFarmProjects(),
        this.discoverAppStreamStacks(),
        this.discoverWorkSpacesWorkspaces(),
        this.discoverDirectoryServiceDirectories(),
        this.discoverCognitoUserPools(),
        this.discoverIAMIdentityCenterInstances(),
        this.discoverSingleSignOnApplications(),
        this.discoverResourceGroups(),
        this.discoverTagEditorResources(),
        this.discoverResourceGroupsTaggingResources(),
        this.discoverCloudFormationStacks(),
        this.discoverCloudFormationStackSets(),
        this.discoverServiceCatalogPortfolios(),
        this.discoverServiceCatalogAppRegistries(),
        this.discoverServiceDiscoveryNamespaces(),
        this.discoverAppMeshMeshes(),
        this.discoverAppSyncAPIs(),
        this.discoverAPIGatewayRestAPIs(),
        this.discoverAPIGatewayV2APIs(),
        this.discoverStepFunctionsStateMachines(),
        this.discoverEventBridgeRules(),
        this.discoverCloudWatchEventsRules(),
        this.discoverCloudWatchLogsLogGroups(),
        this.discoverCloudWatchInsightsQueries(),
        this.discoverXRayTraces(),
        this.discoverCloudTrailTrails(),
        this.discoverConfigConfigurationRecorders(),
        this.discoverInspectorFindings(),
        this.discoverGuardDutyFindings(),
        this.discoverMacieFindings(),
        this.discoverSecurityHubFindings(),
        this.discoverWAFWebACLs(),
        this.discoverWAFV2WebACLs(),
        this.discoverShieldProtections(),
        this.discoverTrustedAdvisorChecks(),
        this.discoverSupportCases(),
        this.discoverBillingCosts(),
        this.discoverCostExplorerReports(),
        this.discoverOrganizationsAccounts(),
        this.discoverSTSCallerIdentity(),
        this.discoverKMSKeys(),
        this.discoverSecretsManagerSecrets(),
        this.discoverParameterStoreParameters(),
        this.discoverSystemsManagerInstances(),
        this.discoverOpsWorksStacks(),
        this.discoverElasticBeanstalkApplications(),
        this.discoverCodeCommitRepositories(),
        this.discoverCodeBuildProjects(),
        this.discoverCodeDeployApplications(),
        this.discoverCodePipelinePipelines(),
        this.discoverXRayTraces(),
        this.discoverCloudTrailTrails(),
        this.discoverConfigConfigurationRecorders(),
        this.discoverServiceCatalogPortfolios(),
        this.discoverMarketplaceProducts(),
        this.discoverMarketplaceMeteringRecords(),
        this.discoverPricingServices(),
        this.discoverSupportServices(),
        this.discoverWorkMailOrganizations(),
        this.discoverWorkDocsSites(),
        this.discoverWorkLinkFleets(),
        this.discoverChimeAccounts(),
        this.discoverConnectInstances(),
        this.discoverPinpointApplications(),
        this.discoverMobileProjects(),
        this.discoverDeviceFarmProjects(),
        this.discoverAppStreamStacks(),
        this.discoverWorkSpacesWorkspaces(),
        this.discoverDirectoryServiceDirectories(),
        this.discoverCognitoUserPools(),
        this.discoverIAMIdentityCenterInstances(),
        this.discoverSingleSignOnApplications(),
        this.discoverResourceGroups(),
        this.discoverTagEditorResources(),
        this.discoverResourceGroupsTaggingResources(),
        this.discoverCloudFormationStacks(),
        this.discoverCloudFormationStackSets(),
        this.discoverServiceCatalogPortfolios(),
        this.discoverServiceCatalogAppRegistries(),
        this.discoverServiceDiscoveryNamespaces(),
        this.discoverAppMeshMeshes(),
        this.discoverAppSyncAPIs(),
        this.discoverAPIGatewayRestAPIs(),
        this.discoverAPIGatewayV2APIs(),
        this.discoverStepFunctionsStateMachines(),
        this.discoverEventBridgeRules(),
        this.discoverCloudWatchEventsRules(),
        this.discoverCloudWatchLogsLogGroups(),
        this.discoverCloudWatchInsightsQueries()
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
        ...elasticacheResources,
        ...elasticsearchResources,
        ...kinesisResources,
        ...redshiftResources,
        ...emrResources,
        ...sagemakerResources,
        ...glueResources,
        ...athenaResources,
        ...quicksightResources,
        ...cloudwatchResources,
        ...configResources,
        ...inspectorResources,
        ...guarddutyResources,
        ...macieResources,
        ...securityHubResources,
        ...wafResources,
        ...shieldResources,
        ...trustedAdvisorResources,
        ...supportResources,
        ...billingResources,
        ...costExplorerResources,
        ...organizationsResources,
        ...stsResources,
        ...kmsResources,
        ...secretsManagerResources,
        ...parameterStoreResources,
        ...systemsManagerResources,
        ...opsWorksResources,
        ...elasticBeanstalkResources,
        ...codeCommitResources,
        ...codeBuildResources,
        ...codeDeployResources,
        ...codePipelineResources,
        ...xRayResources,
        ...cloudTrailResources,
        ...configResources2,
        ...serviceCatalogResources,
        ...marketplaceResources,
        ...marketplaceMeteringResources,
        ...pricingResources,
        ...supportResources2,
        ...workmailResources,
        ...workdocsResources,
        ...worklinkResources,
        ...chimeResources,
        ...connectResources,
        ...pinpointResources,
        ...mobileResources,
        ...deviceFarmResources,
        ...appStreamResources,
        ...workSpacesResources,
        ...directoryServiceResources,
        ...cognitoResources,
        ...iamIdentityCenterResources,
        ...singleSignOnResources,
        ...resourceGroupsResources,
        ...tagEditorResources,
        ...resourceGroupsTaggingResources,
        ...cloudFormationResources2,
        ...cloudFormationStackSetResources,
        ...serviceCatalogResources2,
        ...serviceCatalogAppRegistryResources,
        ...serviceDiscoveryResources,
        ...appMeshResources,
        ...appSyncResources,
        ...apiGatewayResources,
        ...apiGatewayV2Resources,
        ...stepFunctionsResources,
        ...eventBridgeResources,
        ...cloudWatchEventsResources,
        ...cloudWatchLogsResources,
        ...cloudWatchInsightsResources,
        ...xRayResources2,
        ...cloudTrailResources2,
        ...configResources3,
        ...inspectorResources2,
        ...guarddutyResources2,
        ...macieResources2,
        ...securityHubResources2,
        ...wafResources2,
        ...wafV2Resources,
        ...shieldResources2,
        ...trustedAdvisorResources2,
        ...supportResources3,
        ...billingResources2,
        ...costExplorerResources2,
        ...organizationsResources2,
        ...stsResources2,
        ...kmsResources2,
        ...secretsManagerResources2,
        ...parameterStoreResources2,
        ...systemsManagerResources2,
        ...opsWorksResources2,
        ...elasticBeanstalkResources2,
        ...codeCommitResources2,
        ...codeBuildResources2,
        ...codeDeployResources2,
        ...codePipelineResources2,
        ...xRayResources3,
        ...cloudTrailResources3,
        ...configResources4,
        ...serviceCatalogResources3,
        ...marketplaceResources2,
        ...marketplaceMeteringResources2,
        ...pricingResources2,
        ...supportResources4,
        ...workmailResources2,
        ...workdocsResources2,
        ...worklinkResources2,
        ...chimeResources2,
        ...connectResources2,
        ...pinpointResources2,
        ...mobileResources2,
        ...deviceFarmResources2,
        ...appStreamResources2,
        ...workSpacesResources2,
        ...directoryServiceResources2,
        ...cognitoResources2,
        ...iamIdentityCenterResources2,
        ...singleSignOnResources2,
        ...resourceGroupsResources2,
        ...tagEditorResources2,
        ...resourceGroupsTaggingResources2,
        ...cloudFormationResources3,
        ...cloudFormationStackSetResources2,
        ...serviceCatalogResources4,
        ...serviceCatalogAppRegistryResources2,
        ...serviceDiscoveryResources2,
        ...appMeshResources2,
        ...appSyncResources2,
        ...apiGatewayResources2,
        ...apiGatewayV2Resources2,
        ...stepFunctionsResources2,
        ...eventBridgeResources2,
        ...cloudWatchEventsResources2,
        ...cloudWatchLogsResources2,
        ...cloudWatchInsightsResources2
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