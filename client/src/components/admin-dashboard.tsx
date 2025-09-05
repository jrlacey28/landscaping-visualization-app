import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  BarChart3,
  Plus,
  Edit,
  Mail,
  Phone,
  MapPin,
  Code,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, Lead } from "@shared/schema";
import EmbedCodeGenerator from "./embed-code-generator";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedTenantForStats, setSelectedTenantForStats] = useState<number>(1); // Default to mockTenantId
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Tenant | null>(null);
  const [newClientData, setNewClientData] = useState({
    companyName: "",
    slug: "",
    email: "",
    phone: "",
    description: "",
    primaryColor: "#2563EB",
    secondaryColor: "#059669"
  });

  // For demo purposes, we'll use a mock tenant ID
  const mockTenantId = 1;

  const { data: allTenants = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: [`/api/tenants/${selectedTenantForStats}/leads`],
    enabled: !!selectedTenantForStats,
  });

  const { data: visualizations = [], isLoading: visualizationsLoading } =
    useQuery<any[]>({
      queryKey: [`/api/tenants/${selectedTenantForStats}/visualizations`],
      enabled: !!selectedTenantForStats,
    });

  const { data: landscapeVisualizations = [], isLoading: landscapeVizLoading } =
    useQuery<any[]>({
      queryKey: [`/api/tenants/${selectedTenantForStats}/landscape-visualizations`],
      enabled: !!selectedTenantForStats,
    });

  const { data: usageStats, isLoading: usageLoading } = useQuery({
    queryKey: [`/api/tenants/${selectedTenantForStats}/usage`],
    enabled: !!selectedTenantForStats,
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (data: Partial<Tenant>) => {
      return apiRequest("PATCH", `/api/tenants/${mockTenantId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your branding and settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/${mockTenantId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/tenants", data);
    },
    onSuccess: () => {
      toast({
        title: "Client Created",
        description: "New client has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setIsAddingClient(false);
      setNewClientData({
        companyName: "",
        slug: "",
        email: "",
        phone: "",
        description: "",
        primaryColor: "#2563EB",
        secondaryColor: "#059669"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client.",
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Tenant> }) => {
      return apiRequest("PATCH", `/api/tenants/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Client Updated",
        description: "Client has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setEditingClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client.",
        variant: "destructive",
      });
    },
  });

  // Load current tenant data
  const { data: currentTenant } = useQuery<Tenant>({
    queryKey: [`/api/tenant/${mockTenantId}`],
  });

  const [tenantSettings, setTenantSettings] = useState({
    companyName: "DreamBuilder",
    primaryColor: "#2563EB",
    secondaryColor: "#059669",
    phone: "(555) 123-4567",
    email: "info@roofpro.com",
    address: "123 Construction Drive\nRiverside, CA 92501",
    description: "Professional roofing and siding services",
    showPricing: true,
    requirePhone: false,
  });

  // Update settings when tenant data loads
  useEffect(() => {
    if (currentTenant) {
      setTenantSettings({
        companyName:
          currentTenant.companyName || "DreamBuilder",
        primaryColor: currentTenant.primaryColor || "#2563EB",
        secondaryColor: currentTenant.secondaryColor || "#059669",
        phone: currentTenant.phone || "(555) 123-4567",
        email: currentTenant.email || "info@roofpro.com",
        address:
          currentTenant.address || "123 Construction Drive\nRiverside, CA 92501",
        description:
          currentTenant.description ||
          "Professional roofing and siding services",
        showPricing: currentTenant.showPricing ?? true,
        requirePhone: currentTenant.requirePhone ?? false,
      });
    }
  }, [currentTenant]);

  const handleSaveSettings = () => {
    updateTenantMutation.mutate(tenantSettings);
  };

  const handleCreateClient = () => {
    if (!newClientData.companyName || !newClientData.slug || !newClientData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Company Name, Slug, Email).",
        variant: "destructive",
      });
      return;
    }
    createTenantMutation.mutate(newClientData);
  };

  const handleEditClient = (tenant: Tenant) => {
    setEditingClient(tenant);
  };

  const handleSaveClient = () => {
    if (!editingClient) return;
    updateClientMutation.mutate({ 
      id: editingClient.id, 
      data: editingClient 
    });
  };

  // For the embed code generator, we need the tenant data to generate the correct embed URL.
  const tenant = currentTenant;

  const selectedTenantLeads = leads;
  const selectedTenantVisualizations = visualizations;


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 128.37 135.86"
                  fill="currentColor"
                  style={{ transform: 'translate(0.5px, -0.5px)' }}
                >
                  <path fill="#fff" d="M111.98,78.77L56.63,23.24.92,78.76c-1.23,1.22-1.23,3.21,0,4.44,1.22,1.23,3.21,1.23,4.43,0l10.33-10.3v59.82c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-25.09c0-3.46,2.81-6.27,6.27-6.27h12.54c3.46,0,6.27,2.81,6.27,6.27v25.09c0,1.73,1.4,3.14,3.14,3.14h21.95c1.73,0,3.14-1.4,3.14-3.14v-59.89l10.32,10.36c1.22,1.23,3.21,1.23,4.43,0,1.23-1.22,1.23-3.21,0-4.43Z"/>
                  <path fill="#fff" d="M102.82,0c-2.69,20.69-4.87,22.87-25.55,25.55,20.69,2.69,22.87,4.87,25.55,25.55,2.69-20.69,4.87-22.87,25.55-25.55-20.69-2.69-22.87-4.87-25.55-25.55Z"/>
                </svg>
              </div>
              <h1 className="text-xl font-bold">
                DreamBuilder - Admin Dashboard
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/")}
            >
              Back to Site
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Clients</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger
              value="visualizations"
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Visualizations</span>
            </TabsTrigger>
            <TabsTrigger value="embed" className="flex items-center space-x-2">
              <Code className="h-4 w-4" />
              <span>Embed Code</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Dashboard Overview</h2>
              <div className="flex items-center space-x-2">
                <Label htmlFor="tenantSelector">View stats for:</Label>
                <select
                  id="tenantSelector"
                  value={selectedTenantForStats}
                  onChange={(e) => setSelectedTenantForStats(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  {allTenants.map((tenant: Tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {selectedTenantLeads.length}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    All time leads captured
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Total Generations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {(selectedTenantVisualizations.length + landscapeVisualizations.length)}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Images processed
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedTenantLeads.slice(0, 5).map((lead: Lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {lead.email}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {new Date(lead.createdAt!).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab (New) */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <div className="flex justify-between items-center">
                  <p className="text-muted-foreground">
                    Manage all your clients (tenants)
                  </p>
                  <Button onClick={() => setIsAddingClient(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Client
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Add New Client Form */}
                {isAddingClient && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Add New Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="newCompanyName">Company Name *</Label>
                          <Input
                            id="newCompanyName"
                            value={newClientData.companyName}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, companyName: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newSlug">Slug (URL identifier) *</Label>
                          <Input
                            id="newSlug"
                            value={newClientData.slug}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                            placeholder="company-name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newEmail">Email *</Label>
                          <Input
                            id="newEmail"
                            type="email"
                            value={newClientData.email}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPhone">Phone</Label>
                          <Input
                            id="newPhone"
                            value={newClientData.phone}
                            onChange={(e) => setNewClientData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newDescription">Description</Label>
                        <Textarea
                          id="newDescription"
                          value={newClientData.description}
                          onChange={(e) => setNewClientData(prev => ({ ...prev, description: e.target.value }))}
                          rows={2}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleCreateClient} disabled={createTenantMutation.isPending}>
                          {createTenantMutation.isPending ? "Creating..." : "Create Client"}
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddingClient(false)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Edit Client Form */}
                {editingClient && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Edit Client: {editingClient.companyName}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editCompanyName">Company Name</Label>
                          <Input
                            id="editCompanyName"
                            value={editingClient.companyName}
                            onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, companyName: e.target.value }) : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editEmail">Email</Label>
                          <Input
                            id="editEmail"
                            type="email"
                            value={editingClient.email || ""}
                            onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editPhone">Phone</Label>
                          <Input
                            id="editPhone"
                            value={editingClient.phone || ""}
                            onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editPrimaryColor">Primary Color</Label>
                          <Input
                            id="editPrimaryColor"
                            type="color"
                            value={editingClient.primaryColor || "#2563EB"}
                            onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, primaryColor: e.target.value }) : null)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="editDescription">Description</Label>
                        <Textarea
                          id="editDescription"
                          value={editingClient.description || ""}
                          onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                          rows={2}
                        />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveClient} disabled={updateClientMutation.isPending}>
                          {updateClientMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button variant="outline" onClick={() => setEditingClient(null)}>
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Clients List */}
                {allTenants.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No clients yet. Add your first client!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allTenants.map((tenant: Tenant) => (
                      <Card key={tenant.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                          <div>
                            <h4 className="font-semibold">{tenant.companyName}</h4>
                            <p className="text-sm text-muted-foreground">{tenant.email}</p>
                            <p className="text-xs text-muted-foreground">Slug: {tenant.slug}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEditClient(tenant)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
                <p className="text-muted-foreground">
                  Manage and track your customer leads
                </p>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : selectedTenantLeads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No leads yet for this client. Start promoting your visualization tool!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedTenantLeads.map((lead: Lead) => (
                      <Card key={lead.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <h4 className="font-semibold">
                                {lead.firstName} {lead.lastName}
                              </h4>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {lead.email}
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {lead.phone}
                                  </div>
                                )}
                                {lead.address && (
                                  <div className="flex items-center">
                                    <MapPin className="h-4 w-4 mr-1" />
                                    {lead.address}
                                  </div>
                                )}
                              </div>
                              {lead.projectDetails && (
                                <p className="text-sm">{lead.projectDetails}</p>
                              )}
                              {lead.timeline && (
                                <Badge variant="outline">{lead.timeline}</Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {new Date(lead.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visualizations Tab */}
          <TabsContent value="visualizations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualizations</CardTitle>
                <p className="text-muted-foreground">
                  Manage your landscape visualizations
                </p>
              </CardHeader>
              <CardContent>
                {visualizationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : selectedTenantVisualizations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No visualizations yet. Upload a new one!
                    </p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" /> Add Visualization
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {selectedTenantVisualizations.map((viz: any) => (
                      <Card key={viz.id} className="relative group overflow-hidden">
                        <CardContent className="p-0">
                          <img
                            src={viz.thumbnailUrl}
                            alt="Visualization"
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        </CardContent>
                        <CardHeader className="p-4">
                          <CardTitle className="text-lg">
                            {viz.name}
                          </CardTitle>
                          <CardDescription>{viz.description}</CardDescription>
                        </CardHeader>
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <Button onClick={() => alert("View/Edit Visualization")}>
                            View/Edit
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Embed Code Tab */}
          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Website Embed Code</CardTitle>
                <p className="text-muted-foreground">
                  Generate embed code to add the landscape visualizer to your
                  website
                </p>
              </CardHeader>
              <CardContent>
                {tenant && <EmbedCodeGenerator tenant={tenant} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <p className="text-muted-foreground">
                  Configure how your application behaves
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">
                      Show Pricing Information
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Display pricing details to potential customers
                    </p>
                  </div>
                  <Switch
                    checked={tenantSettings.showPricing}
                    onCheckedChange={(checked) =>
                      setTenantSettings((prev) => ({
                        ...prev,
                        showPricing: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Require Phone Number</Label>
                    <p className="text-sm text-muted-foreground">
                      Make phone number mandatory in lead forms
                    </p>
                  </div>
                  <Switch
                    checked={tenantSettings.requirePhone}
                    onCheckedChange={(checked) =>
                      setTenantSettings((prev) => ({
                        ...prev,
                        requirePhone: checked,
                      }))
                    }
                  />
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={updateTenantMutation.isPending}
                >
                  {updateTenantMutation.isPending
                    ? "Saving..."
                    : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}