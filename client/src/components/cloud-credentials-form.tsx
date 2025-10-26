import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const awsCredentialsSchema = z.object({
  accessKeyId: z.string().min(16, "Access Key ID must be at least 16 characters"),
  secretAccessKey: z.string().min(16, "Secret Access Key must be at least 16 characters"),
  region: z.string().min(1, "Region is required"),
  sessionToken: z.string().optional(),
  nativeName: z.string().min(1, "Account name is required").max(50, "Account name must be less than 50 characters"),
});

const azureCredentialsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  subscriptionId: z.string().min(1, "Subscription ID is required"),
  nativeName: z.string().min(1, "Account name is required").max(50, "Account name must be less than 50 characters"),
});

const gcpCredentialsSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  keyFilename: z.string().optional(),
  credentials: z.string().optional(),
  nativeName: z.string().min(1, "Account name is required").max(50, "Account name must be less than 50 characters"),
});

const ociCredentialsSchema = z.object({
  tenancyId: z.string().min(1, "Tenancy OCID is required"),
  userId: z.string().min(1, "User OCID is required"),
  fingerprint: z.string().min(1, "Key fingerprint is required"),
  privateKey: z.string().min(1, "Private key is required"),
  region: z.string().min(1, "Region is required"),
  nativeName: z.string().min(1, "Account name is required").max(50, "Account name must be less than 50 characters"),
});


export interface CloudCredential {
  id: string;
  provider: 'aws' | 'azure' | 'gcp' | 'oci';
  name: string;
  nativeName?: string;
  credentials: any;
  validated?: boolean;
}

interface CloudCredentialsFormProps {
  credentials: CloudCredential[];
  onCredentialsChange: (credentials: CloudCredential[]) => void;
  onValidateCredentials: (provider: string, credentials: any) => Promise<{valid: boolean; message: string}>;
}

const AWS_REGIONS = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-central-1", "ap-southeast-1",
  "ap-southeast-2", "ap-northeast-1", "ca-central-1"
];

const OCI_REGIONS = [
  "us-ashburn-1", "us-phoenix-1", "us-chicago-1", "us-sanjose-1",
  "eu-frankfurt-1", "eu-zurich-1", "eu-amsterdam-1", "uk-london-1",
  "ap-tokyo-1", "ap-osaka-1", "ap-mumbai-1", "ap-seoul-1",
  "ap-sydney-1", "ca-toronto-1", "sa-saopaulo-1", "ap-singapore-1"
];


export function CloudCredentialsForm({ 
  credentials, 
  onCredentialsChange, 
  onValidateCredentials 
}: CloudCredentialsFormProps) {
  const [activeProvider, setActiveProvider] = useState<'aws' | 'azure' | 'gcp' | 'oci'>('aws');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [validationStatus, setValidationStatus] = useState<Record<string, {loading: boolean; result?: {valid: boolean; message: string}}>>({});
  const [deletingCredentials, setDeletingCredentials] = useState<Set<string>>(new Set());

  const awsForm = useForm({
    resolver: zodResolver(awsCredentialsSchema),
    defaultValues: {
      accessKeyId: "",
      secretAccessKey: "",
      region: "us-east-1",
      sessionToken: "",
      nativeName: "",
    },
  });

  const azureForm = useForm({
    resolver: zodResolver(azureCredentialsSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      tenantId: "",
      subscriptionId: "",
      nativeName: "",
    },
  });

  const gcpForm = useForm({
    resolver: zodResolver(gcpCredentialsSchema),
    defaultValues: {
      projectId: "",
      keyFilename: "",
      credentials: "",
      nativeName: "",
    },
  });

  const ociForm = useForm({
    resolver: zodResolver(ociCredentialsSchema),
    defaultValues: {
      tenancyId: "",
      userId: "",
      fingerprint: "",
      privateKey: "",
      region: "us-ashburn-1",
      nativeName: "",
    },
  });


  const addCredential = async (provider: 'aws' | 'azure' | 'gcp' | 'oci', data: any) => {
    const credentialId = `${provider}-${Date.now()}`;
    
    // Validate credentials first
    setValidationStatus(prev => ({ ...prev, [credentialId]: { loading: true } }));
    
    try {
      const validation = await onValidateCredentials(provider, data);
      
      if (validation.valid) {
        // Save to database
        const response = await fetch(`/api/credentials`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            provider,
            name: data.nativeName || `${provider.toUpperCase()} Account`,
            encryptedCredentials: JSON.stringify(data), // Send as JSON string - server will encrypt
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save credentials');
        }

        const savedCredential = await response.json();
        
        const newCredential: CloudCredential = {
          id: savedCredential.id,
          provider,
          name: savedCredential.name,
          nativeName: data.nativeName,
          credentials: data,
          validated: true,
        };

        setValidationStatus(prev => ({ 
          ...prev, 
          [credentialId]: { loading: false, result: validation } 
        }));

        onCredentialsChange([...credentials, newCredential]);
      } else {
        setValidationStatus(prev => ({ 
          ...prev, 
          [credentialId]: { loading: false, result: validation } 
        }));
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      setValidationStatus(prev => ({ 
        ...prev, 
        [credentialId]: { 
          loading: false, 
          result: { valid: false, message: "Failed to save credentials" } 
        } 
      }));
    }
    
    // Reset form
    if (provider === 'aws') awsForm.reset();
    if (provider === 'azure') azureForm.reset();
    if (provider === 'gcp') gcpForm.reset();
    if (provider === 'oci') ociForm.reset();
  };

  const removeCredential = async (id: string) => {
    setDeletingCredentials(prev => new Set(prev).add(id));
    
    try {
      // Call API to delete credential from server
      const response = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Update local state only after successful server deletion
        onCredentialsChange(credentials.filter(c => c.id !== id));
        setValidationStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[id];
          return newStatus;
        });
      } else {
        console.error('Failed to delete credential from server');
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      // You might want to show a toast notification here
    } finally {
      setDeletingCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const toggleSecretVisibility = (credentialId: string) => {
    setShowSecrets(prev => ({ ...prev, [credentialId]: !prev[credentialId] }));
  };

  const renderCredentialCard = (credential: CloudCredential) => {
    const validation = validationStatus[credential.id];
    const isVisible = showSecrets[credential.id];

    return (
      <Card key={credential.id} className="mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <CardTitle className="text-lg">{credential.name}</CardTitle>
                {credential.nativeName && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Account: {credential.nativeName}
                  </p>
                )}
              </div>
              <Badge variant="outline">{credential.provider.toUpperCase()}</Badge>
              {validation?.result && (
                validation.result.valid ? 
                  <CheckCircle className="h-4 w-4 text-green-500" /> :
                  <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSecretVisibility(credential.id)}
              >
                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCredential(credential.id)}
                disabled={deletingCredentials.has(credential.id)}
                className="text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {deletingCredentials.has(credential.id) ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          {validation?.result && !validation.result.valid && (
            <Alert className="mt-2">
              <AlertDescription className="text-sm text-red-600">
                {validation.result.message}
              </AlertDescription>
            </Alert>
          )}
        </CardHeader>
        <CardContent>
          {credential.provider === 'aws' && (
            <div className="space-y-2 text-sm">
              <div><strong>Access Key:</strong> {isVisible ? credential.credentials.accessKeyId : '***************'}</div>
              <div><strong>Secret Key:</strong> {isVisible ? credential.credentials.secretAccessKey : '***************'}</div>
              <div><strong>Region:</strong> {credential.credentials.region}</div>
            </div>
          )}
          {credential.provider === 'azure' && (
            <div className="space-y-2 text-sm">
              <div><strong>Client ID:</strong> {isVisible ? credential.credentials.clientId : '***************'}</div>
              <div><strong>Tenant ID:</strong> {credential.credentials.tenantId}</div>
              <div><strong>Subscription:</strong> {credential.credentials.subscriptionId}</div>
            </div>
          )}
          {credential.provider === 'gcp' && (
            <div className="space-y-2 text-sm">
              <div><strong>Project ID:</strong> {credential.credentials.projectId}</div>
              {credential.credentials.keyFilename && (
                <div><strong>Key File:</strong> {credential.credentials.keyFilename}</div>
              )}
            </div>
          )}
          {credential.provider === 'oci' && (
            <div className="space-y-2 text-sm">
              <div><strong>Tenancy OCID:</strong> {isVisible ? credential.credentials.tenancyId : '***************'}</div>
              <div><strong>User OCID:</strong> {isVisible ? credential.credentials.userId : '***************'}</div>
              <div><strong>Region:</strong> {credential.credentials.region}</div>
              <div><strong>Fingerprint:</strong> {credential.credentials.fingerprint}</div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Cloud Credentials</h3>
        <p className="text-sm text-muted-foreground">
          Add your cloud provider credentials to automatically discover and analyze your existing infrastructure.
        </p>
        
        {credentials.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Configured Credentials</h4>
            {credentials.map(renderCredentialCard)}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Cloud Credentials
          </CardTitle>
          <CardDescription>
            Connect your cloud accounts to enable automatic resource discovery and cost analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeProvider} onValueChange={(value) => setActiveProvider(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="aws">AWS</TabsTrigger>
              <TabsTrigger value="azure">Azure</TabsTrigger>
              <TabsTrigger value="gcp">Google Cloud</TabsTrigger>
              <TabsTrigger value="oci">Oracle Cloud</TabsTrigger>
            </TabsList>

            <TabsContent value="aws" className="mt-6">
              <Form {...awsForm}>
                <form onSubmit={awsForm.handleSubmit((data) => addCredential('aws', data))} className="space-y-4">
                  <FormField
                    control={awsForm.control}
                    name="accessKeyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Key ID</FormLabel>
                        <FormControl>
                          <Input placeholder="AKIAIOSFODNN7EXAMPLE" {...field} data-testid="input-aws-access-key" />
                        </FormControl>
                        <FormDescription>
                          Your AWS access key ID from IAM console
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={awsForm.control}
                    name="secretAccessKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Secret Access Key</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" 
                            {...field} 
                            data-testid="input-aws-secret-key"
                          />
                        </FormControl>
                        <FormDescription>
                          Your AWS secret access key
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={awsForm.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Region</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-aws-region">
                              <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {AWS_REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Primary AWS region for resource discovery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={awsForm.control}
                    name="sessionToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Token (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="For temporary credentials only" 
                            {...field} 
                            data-testid="input-aws-session-token"
                          />
                        </FormControl>
                        <FormDescription>
                          Only required if using temporary credentials
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={awsForm.control}
                    name="nativeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Production AWS, Dev Account, etc." 
                            {...field} 
                            data-testid="input-aws-account-name"
                          />
                        </FormControl>
                        <FormDescription>
                          A friendly name to identify this AWS account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" data-testid="button-add-aws-credentials">
                    Add AWS Credentials
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="azure" className="mt-6">
              <Form {...azureForm}>
                <form onSubmit={azureForm.handleSubmit((data) => addCredential('azure', data))} className="space-y-4">
                  <FormField
                    control={azureForm.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                          <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} data-testid="input-azure-client-id" />
                        </FormControl>
                        <FormDescription>
                          Application (client) ID from Azure portal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={azureForm.control}
                    name="clientSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Client secret value" 
                            {...field} 
                            data-testid="input-azure-client-secret"
                          />
                        </FormControl>
                        <FormDescription>
                          Client secret from Azure portal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={azureForm.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant ID</FormLabel>
                        <FormControl>
                          <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} data-testid="input-azure-tenant-id" />
                        </FormControl>
                        <FormDescription>
                          Directory (tenant) ID from Azure portal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={azureForm.control}
                    name="subscriptionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subscription ID</FormLabel>
                        <FormControl>
                          <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" {...field} data-testid="input-azure-subscription-id" />
                        </FormControl>
                        <FormDescription>
                          Azure subscription ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={azureForm.control}
                    name="nativeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Production Azure, Dev Tenant, etc." 
                            {...field} 
                            data-testid="input-azure-account-name"
                          />
                        </FormControl>
                        <FormDescription>
                          A friendly name to identify this Azure account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" data-testid="button-add-azure-credentials">
                    Add Azure Credentials
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="gcp" className="mt-6">
              <Form {...gcpForm}>
                <form onSubmit={gcpForm.handleSubmit((data) => addCredential('gcp', data))} className="space-y-4">
                  <FormField
                    control={gcpForm.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input placeholder="my-gcp-project-id" {...field} data-testid="input-gcp-project-id" />
                        </FormControl>
                        <FormDescription>
                          Your Google Cloud Project ID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={gcpForm.control}
                    name="keyFilename"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Account Key File Path</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="/path/to/service-account-key.json" 
                            {...field} 
                            data-testid="input-gcp-key-file"
                          />
                        </FormControl>
                        <FormDescription>
                          Path to your service account key JSON file
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gcpForm.control}
                    name="credentials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Account Key JSON (Alternative)</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full min-h-[100px] p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical rounded-md"
                            placeholder='{"type": "service_account", "project_id": "..."}'
                            {...field}
                            data-testid="textarea-gcp-credentials"
                          />
                        </FormControl>
                        <FormDescription>
                          Paste your service account key JSON directly
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={gcpForm.control}
                    name="nativeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Production GCP, Dev Project, etc." 
                            {...field} 
                            data-testid="input-gcp-account-name"
                          />
                        </FormControl>
                        <FormDescription>
                          A friendly name to identify this GCP account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" data-testid="button-add-gcp-credentials">
                    Add GCP Credentials
                  </Button>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="oci" className="mt-6">
              <Form {...ociForm}>
                <form onSubmit={ociForm.handleSubmit((data) => addCredential('oci', data))} className="space-y-4">
                  <FormField
                    control={ociForm.control}
                    name="tenancyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenancy OCID</FormLabel>
                        <FormControl>
                          <Input placeholder="ocid1.tenancy.oc1..aaaaaaaa..." {...field} data-testid="input-oci-tenancy-id" />
                        </FormControl>
                        <FormDescription>
                          Your Oracle Cloud tenancy OCID from console
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={ociForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User OCID</FormLabel>
                        <FormControl>
                          <Input placeholder="ocid1.user.oc1..aaaaaaaa..." {...field} data-testid="input-oci-user-id" />
                        </FormControl>
                        <FormDescription>
                          Your Oracle Cloud user OCID
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ociForm.control}
                    name="fingerprint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Fingerprint</FormLabel>
                        <FormControl>
                          <Input placeholder="aa:bb:cc:dd:ee:ff:..." {...field} data-testid="input-oci-fingerprint" />
                        </FormControl>
                        <FormDescription>
                          Fingerprint of your API signing key
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ociForm.control}
                    name="privateKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Private Key</FormLabel>
                        <FormControl>
                          <textarea
                            className="w-full min-h-[120px] p-3 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical rounded-md"
                            placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                            {...field}
                            data-testid="textarea-oci-private-key"
                          />
                        </FormControl>
                        <FormDescription>
                          Your Oracle Cloud API signing private key (PEM format)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ociForm.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-oci-region">
                              <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OCI_REGIONS.map((region) => (
                              <SelectItem key={region} value={region}>{region}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Primary Oracle Cloud region for resource discovery
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={ociForm.control}
                    name="nativeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Production OCI, Dev Tenancy, etc." 
                            {...field} 
                            data-testid="input-oci-account-name"
                          />
                        </FormControl>
                        <FormDescription>
                          A friendly name to identify this OCI account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" data-testid="button-add-oci-credentials">
                    Add Oracle Cloud Credentials
                  </Button>
                </form>
              </Form>
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}