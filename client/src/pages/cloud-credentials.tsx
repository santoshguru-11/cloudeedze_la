import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, KeyIcon, EditIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface CloudCredential {
  id: string;
  name: string;
  provider: string;
  isValidated: boolean;
  createdAt: string;
}

export default function CloudCredentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newCredential, setNewCredential] = useState({
    name: "",
    provider: "",
    credentials: ""
  });

  const { data: credentials = [], isLoading } = useQuery<CloudCredential[]>({
    queryKey: ["/api/credentials"],
  });

  const [editingCredential, setEditingCredential] = useState<CloudCredential | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    provider: "",
    credentials: ""
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; provider: string; encryptedCredentials: string }) => {
      return await apiRequest("POST", "/api/credentials", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setIsCreating(false);
      setNewCredential({ name: "", provider: "", credentials: "" });
      toast({
        title: "Success",
        description: "Cloud credentials added successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to add credentials",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      toast({
        title: "Success",
        description: "Credentials deleted successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete credentials",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; provider: string; encryptedCredentials: string }) => {
      return await apiRequest("PUT", `/api/credentials/${data.id}`, {
        name: data.name,
        provider: data.provider,
        encryptedCredentials: data.encryptedCredentials
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/credentials"] });
      setEditingCredential(null);
      setEditForm({ name: "", provider: "", credentials: "" });
      toast({
        title: "Success",
        description: "Credentials updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update credentials",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newCredential.name || !newCredential.provider || !newCredential.credentials) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      name: newCredential.name,
      provider: newCredential.provider,
      encryptedCredentials: newCredential.credentials,
    });
  };


  const startEdit = async (credential: CloudCredential) => {
    try {
      // Fetch the full credential details
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://app.cloudedze.ai';
      const response = await fetch(`${API_BASE_URL}/api/credentials/${credential.id}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch credential details');
      }
      
      const credentialData = await response.json();
      
      setEditingCredential(credential);
      setEditForm({
        name: credential.name,
        provider: credential.provider,
        credentials: JSON.stringify(credentialData.credentials, null, 2)
      });
    } catch (error) {
      console.error('Error fetching credential details:', error);
      toast({
        title: "Error",
        description: "Failed to load credential details for editing",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = () => {
    if (!editingCredential || !editForm.name || !editForm.provider || !editForm.credentials) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate({
      id: editingCredential.id,
      name: editForm.name,
      provider: editForm.provider,
      encryptedCredentials: editForm.credentials,
    });
  };

  const cancelEdit = () => {
    setEditingCredential(null);
    setEditForm({ name: "", provider: "", credentials: "" });
  };

  const getCredentialTemplate = (provider: string) => {
    switch (provider) {
      case "aws":
        return `{
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "secretAccessKey": "YOUR_SECRET_ACCESS_KEY",
  "region": "us-east-1"
}`;
      case "azure":
        return `{
  "clientId": "YOUR_CLIENT_ID",
  "clientSecret": "YOUR_CLIENT_SECRET",
  "tenantId": "YOUR_TENANT_ID",
  "subscriptionId": "YOUR_SUBSCRIPTION_ID"
}`;
      case "gcp":
        return `{
  "projectId": "YOUR_PROJECT_ID",
  "credentials": {
    "type": "service_account",
    "project_id": "YOUR_PROJECT_ID",
    "private_key_id": "KEY_ID",
    "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
    "client_email": "service-account@project.iam.gserviceaccount.com",
    "client_id": "CLIENT_ID",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token"
  }
}`;
      case "oci":
        return `{
  "tenancyId": "ocid1.tenancy.oc1..aaaaaaaa...",
  "userId": "ocid1.user.oc1..aaaaaaaa...",
  "fingerprint": "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99",
  "privateKey": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "region": "us-ashburn-1"
}`;
      default:
        return "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Cloud Credentials - Cloudedze</title>
        <meta name="description" content="Manage your cloud provider credentials for AWS, Azure, GCP, and Oracle Cloud to enable live resource scanning and cost analysis." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cloud Credentials</h1>
        <p className="text-gray-600">
          Manage your cloud provider credentials for AWS, Azure, GCP, and Oracle Cloud to enable live resource scanning and cost analysis.
        </p>
      </div>

      <Tabs defaultValue="manage" className="space-y-6">
        <TabsList>
          <TabsTrigger value="manage" data-testid="tab-manage">Manage Credentials</TabsTrigger>
          <TabsTrigger value="add" data-testid="tab-add">Add New Credential</TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5" />
                Your Cloud Credentials
              </CardTitle>
              <CardDescription>
                View and manage your stored cloud provider credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading credentials...</div>
              ) : credentials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No credentials configured yet. Add your first credential to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {credentials.map((credential) => (
                    <div
                      key={credential.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`credential-item-${credential.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium">{credential.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{credential.provider}</p>
                        </div>
                        <Badge variant={credential.isValidated ? "default" : "secondary"}>
                          {credential.isValidated ? (
                            <><CheckCircleIcon className="h-3 w-3 mr-1" /> Validated</>
                          ) : (
                            <><XCircleIcon className="h-3 w-3 mr-1" /> Not Validated</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(credential)}
                          data-testid={`button-edit-${credential.id}`}
                        >
                          <EditIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(credential.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${credential.id}`}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Credential Form */}
          {editingCredential && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EditIcon className="h-5 w-5" />
                  Edit Credential
                </CardTitle>
                <CardDescription>
                  Update your cloud provider credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Credential Name</Label>
                    <Input
                      id="edit-name"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Enter credential name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-provider">Cloud Provider</Label>
                    <Select
                      value={editForm.provider}
                      onValueChange={(value) => setEditForm({ ...editForm, provider: value, credentials: getCredentialTemplate(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select cloud provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                        <SelectItem value="azure">Microsoft Azure</SelectItem>
                        <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                        <SelectItem value="oci">Oracle Cloud Infrastructure (OCI)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-credentials">Credentials (JSON)</Label>
                  <Textarea
                    id="edit-credentials"
                    value={editForm.credentials}
                    onChange={(e) => setEditForm({ ...editForm, credentials: e.target.value })}
                    placeholder={getCredentialTemplate(editForm.provider)}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Updating..." : "Update Credential"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusIcon className="h-5 w-5" />
                Add New Credential
              </CardTitle>
              <CardDescription>
                Add cloud provider credentials to enable resource scanning and cost analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="credential-name">Credential Name</Label>
                  <Input
                    id="credential-name"
                    placeholder="e.g., Production AWS Account"
                    value={newCredential.name}
                    onChange={(e) => setNewCredential({ ...newCredential, name: e.target.value })}
                    data-testid="input-credential-name"
                  />
                </div>

                <div>
                  <Label htmlFor="provider">Cloud Provider</Label>
                  <Select
                    value={newCredential.provider}
                    onValueChange={(value) => setNewCredential({ ...newCredential, provider: value, credentials: getCredentialTemplate(value) })}
                  >
                    <SelectTrigger data-testid="select-provider">
                      <SelectValue placeholder="Select a cloud provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                      <SelectItem value="azure">Microsoft Azure</SelectItem>
                      <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                      <SelectItem value="oci">Oracle Cloud Infrastructure (OCI)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newCredential.provider && (
                  <div>
                    <Label htmlFor="credentials">Credentials (JSON Format)</Label>
                    <Textarea
                      id="credentials"
                      rows={12}
                      placeholder={getCredentialTemplate(newCredential.provider)}
                      value={newCredential.credentials}
                      onChange={(e) => setNewCredential({ ...newCredential, credentials: e.target.value })}
                      className="font-mono text-sm"
                      data-testid="textarea-credentials"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your {newCredential.provider.toUpperCase()} credentials in JSON format. 
                      These will be encrypted and stored securely.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending || !newCredential.name || !newCredential.provider || !newCredential.credentials}
                  data-testid="button-save-credential"
                >
                  {createMutation.isPending ? "Adding..." : "Add Credential"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}