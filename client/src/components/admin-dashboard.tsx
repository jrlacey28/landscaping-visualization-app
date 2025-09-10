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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
  Trash2,
  LogOut
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, Lead } from "@shared/schema";
import EmbedCodeGenerator from "./embed-code-generator";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [selectedTenantForStats, setSelectedTenantForStats] = useState<number | null>(null); // No default - requires selection
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Tenant | null>(null);
  const [deletingClient, setDeletingClient] = useState<Tenant | null>(null);
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null);
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

  const { data: allTenants = [] as Tenant[] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<Lead[]>({
    queryKey: [`/api/tenants/${mockTenantId}/leads`],
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

  const { data: poolVisualizations = [], isLoading: poolVizLoading } =
    useQuery<any[]>({
      queryKey: [`/api/tenants/${selectedTenantForStats}/pool-visualizations`],
      enabled: !!selectedTenantForStats,
    });

  const { data: usageStats, isLoading: usageLoading } = useQuery<{
    stats: any[];
    totals: {
      totalGenerations: number;
      imageGenerations: number;
      landscapeGenerations: number;
      poolGenerations: number;
    };
    period: string;
  }>({
    queryKey: [`/api/tenants/${selectedTenantForStats}/usage`],
    enabled: !!selectedTenantForStats,
  });

  // Get all registered users for admin management
  const { data: allUsersData, isLoading: usersLoading } = useQuery<{
    success: boolean;
    data: Array<{
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      businessName?: string;
      phone?: string;
      emailVerified: boolean;
      createdAt: string;
      usage?: {
        planName: string;
        currentUsage: number;
        limit: number;
        canUse: boolean;
      };
      subscription?: {
        status: string;
        planId: string;
        currentPeriodEnd: string;
      };
    }>;
  }>({
    queryKey: ["/api/customers"],
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

  const toggleClientStatusMutation = useMutation({
    mutationFn: async ({ id, active }: { id: number; active: boolean }) => {
      return apiRequest("PATCH", `/api/tenants/${id}`, { active });
    },
    onSuccess: (_, { active }) => {
      toast({
        title: active ? "Client Activated" : "Client Deactivated",
        description: active 
          ? "Client access has been restored." 
          : "Client access has been suspended.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update client status.",
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tenants/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Client Deleted",
        description: "Client and all associated data have been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setDeletingClient(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete client.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/leads/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Lead Deleted",
        description: "Lead has been permanently removed.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tenants/${mockTenantId}/leads`] });
      setDeletingLead(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead.",
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

  const handleDeleteClient = () => {
    if (!deletingClient) return;
    deleteClientMutation.mutate(deletingClient.id);
  };

  const handleDeleteLead = () => {
    if (!deletingLead) return;
    deleteLeadMutation.mutate(deletingLead.id);
  };

  // For the embed code generator, we need the tenant data to generate the correct embed URL.
  const tenant = currentTenant;

  const selectedTenantLeads = leads;
  const selectedTenantVisualizations = visualizations;

  // Renamed from allTenants to tenants for clarity in the analytics tab
  const tenants = allTenants;

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.reload(); // Refresh to trigger auth check
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 lg:grid-cols-6 gap-1 h-auto p-1">
            <TabsTrigger
              value="overview"
              className="flex items-center justify-center space-x-1 text-xs md:text-sm px-2 py-2"
            >
              <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex items-center justify-center space-x-1 text-xs md:text-sm px-2 py-2"
            >
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="clients" 
              className="flex items-center justify-center space-x-1 text-xs md:text-sm px-2 py-2"
            >
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Clients</span>
            </TabsTrigger>
            <TabsTrigger 
              value="leads" 
              className="flex items-center justify-center space-x-1 text-xs md:text-sm px-2 py-2"
            >
              <Mail className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger 
              value="embed" 
              className="flex items-center justify-center space-x-1 text-xs md:text-sm px-2 py-2"
            >
              <Code className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Embed</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center justify-center space-x-1 text-xs md:text-sm px-2 py-2"
            >
              <Settings className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">Dashboard Overview</h2>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="tenantSelector" className="text-sm whitespace-nowrap">View stats for:</Label>
                  <select
                    id="tenantSelector"
                    value={selectedTenantForStats || ''}
                    onChange={(e) => setSelectedTenantForStats(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[150px]"
                  >
                    <option value="">All Clients</option>
                    {allTenants.map((tenant: Tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <Users className="h-5 w-5" />
                    Active Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900">
                    {allTenants.filter(tenant => tenant.active).length}
                  </div>
                  <p className="text-blue-600 text-sm">
                    {allTenants.filter(tenant => !tenant.active).length} inactive
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Users className="h-5 w-5" />
                    Total Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-900">
                    {selectedTenantLeads.length}
                  </div>
                  <p className="text-green-600 text-sm">
                    Captured leads
                  </p>
                </CardContent>
              </Card>


              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-orange-700">
                    <BarChart3 className="h-5 w-5" />
                    Total Gens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-900">
                    {(selectedTenantVisualizations.length + landscapeVisualizations.length + (poolVisualizations?.length || 0))}
                  </div>
                  <p className="text-orange-600 text-sm">
                    All images
                  </p>
                </CardContent>
              </Card>
            </div>

{selectedTenantForStats ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <p className="text-muted-foreground">Latest leads and client activity</p>
                </CardHeader>
                <CardContent>
                  {selectedTenantLeads.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recent Activity</h3>
                      <p className="text-gray-500">
                        Leads will appear here once clients start using your visualization tools.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTenantLeads.slice(0, 5).map((lead: Lead) => (
                        <div
                          key={lead.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {lead.email}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {new Date(lead.createdAt!).toLocaleDateString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Client Generation Usage</CardTitle>
                  <p className="text-muted-foreground">Monthly generation limits and current usage</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Client</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-right py-3 px-2">Used/Limit</th>
                          <th className="text-right py-3 px-2">Progress</th>
                          <th className="text-right py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTenants.map((tenant: Tenant) => {
                          const usagePercent = Math.min((tenant.currentMonthGenerations || 0) / (tenant.monthlyGenerationLimit || 100) * 100, 100);
                          const isOverLimit = (tenant.currentMonthGenerations || 0) > (tenant.monthlyGenerationLimit || 100);

                          return (
                            <tr key={tenant.id} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-2">
                                <div>
                                  <p className="font-medium">{tenant.companyName}</p>
                                  <p className="text-sm text-gray-500">/{tenant.slug}</p>
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <Badge variant={tenant.active ? (isOverLimit ? "destructive" : "default") : "destructive"}>
                                  {!tenant.active ? "Suspended" : isOverLimit ? "Over Limit" : "Active"}
                                </Badge>
                              </td>
                              <td className="py-4 px-2 text-right">
                                <span className={`font-mono ${isOverLimit ? 'text-red-600' : ''}`}>
                                  {tenant.currentMonthGenerations || 0}/{tenant.monthlyGenerationLimit || 100}
                                </span>
                              </td>
                              <td className="py-4 px-2 text-right">
                                <div className="w-20 ml-auto">
                                  <div className="bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${isOverLimit ? 'bg-red-500' : usagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                      style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">{Math.round(usagePercent)}%</span>
                                </div>
                              </td>
                              <td className="py-4 px-2 text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Reset generation count
                                    updateClientMutation.mutate({
                                      id: tenant.id, 
                                      data: { 
                                        currentMonthGenerations: 0, 
                                        lastResetDate: new Date(),
                                        active: true // Reactivate if suspended
                                      }
                                    });
                                  }}
                                  className="text-xs"
                                >
                                  Reset
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">User Management</h2>
              <div className="text-sm text-gray-600">
                Total Users: {allUsersData?.data?.length || 0}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Registered Users</CardTitle>
                <CardDescription>All users who have signed up for your platform</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading users...</p>
                  </div>
                ) : allUsersData?.data?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Users Yet</h3>
                    <p className="text-gray-500">New user signups will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">User</th>
                          <th className="text-left py-3 px-2">Business</th>
                          <th className="text-left py-3 px-2">Plan</th>
                          <th className="text-left py-3 px-2">Usage</th>
                          <th className="text-left py-3 px-2">Status</th>
                          <th className="text-left py-3 px-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allUsersData?.data?.map((user) => {
                          const usagePercent = user.usage?.limit === -1 ? 0 : 
                            Math.min((user.usage?.currentUsage || 0) / (user.usage?.limit || 5) * 100, 100);
                          const isOverLimit = user.usage?.limit !== -1 && 
                            (user.usage?.currentUsage || 0) > (user.usage?.limit || 5);

                          return (
                            <tr key={user.id} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-2">
                                <div>
                                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                                  <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <div>
                                  <p className="text-sm">{user.businessName || 'Personal'}</p>
                                  {user.phone && (
                                    <p className="text-xs text-gray-500">{user.phone}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <Badge variant={user.subscription?.status === 'active' ? 'default' : 'outline'}>
                                  {user.usage?.planName || 'Free'}
                                </Badge>
                              </td>
                              <td className="py-4 px-2">
                                {user.usage?.limit === -1 ? (
                                  <span className="text-sm text-green-600">Unlimited</span>
                                ) : (
                                  <div>
                                    <span className={`font-mono text-sm ${isOverLimit ? 'text-red-600' : ''}`}>
                                      {user.usage?.currentUsage || 0}/{user.usage?.limit || 5}
                                    </span>
                                    <div className="w-16 mt-1">
                                      <div className="bg-gray-200 rounded-full h-1">
                                        <div 
                                          className={`h-1 rounded-full ${isOverLimit ? 'bg-red-500' : usagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </td>
                              <td className="py-4 px-2">
                                <div className="space-y-1">
                                  <Badge variant={user.emailVerified ? 'default' : 'destructive'}>
                                    {user.emailVerified ? 'Verified' : 'Unverified'}
                                  </Badge>
                                  {user.subscription && (
                                    <div>
                                      <Badge variant={
                                        user.subscription.status === 'active' ? 'default' : 
                                        user.subscription.status === 'past_due' ? 'destructive' : 'secondary'
                                      }>
                                        {user.subscription.status}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-2">
                                <span className="text-sm text-gray-600">
                                  {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="space-y-8">
            <Card>
              <CardHeader className="pb-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div>
                    <CardTitle className="text-xl">Client Management</CardTitle>
                    <p className="text-muted-foreground mt-2">
                      Manage all your clients and their embed configurations
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.location.href = '/embed-manager'}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Settings className="h-4 w-4 mr-2" /> Manage Embeds
                    </Button>
                    <Button 
                      onClick={() => setIsAddingClient(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add New Client
                    </Button>
                  </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editMonthlyLimit">Monthly Generation Limit</Label>
                          <Input
                            id="editMonthlyLimit"
                            type="number"
                            min="0"
                            value={editingClient.monthlyGenerationLimit || 100}
                            onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, monthlyGenerationLimit: parseInt(e.target.value) }) : null)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editCurrentGenerations">Current Month Usage</Label>
                          <Input
                            id="editCurrentGenerations"
                            type="number"
                            min="0"
                            value={editingClient.currentMonthGenerations || 0}
                            onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, currentMonthGenerations: parseInt(e.target.value) }) : null)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Set to 0 to reset usage count
                          </p>
                        </div>
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

                {/* Clients Grid */}
                {allTenants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No clients yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first client to start managing their visualizer embeds
                    </p>
                    <Button 
                      onClick={() => setIsAddingClient(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Your First Client
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {allTenants.map((tenant: Tenant) => (
                      <Card key={tenant.id} className={`transition-all hover:shadow-lg ${!tenant.active ? 'opacity-75 border-red-200' : 'border-green-200'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${tenant.active ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <CardTitle className="text-lg">{tenant.companyName}</CardTitle>
                                <p className="text-sm text-muted-foreground">/{tenant.slug}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={tenant.active ? "default" : "destructive"}>
                                {tenant.active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Client Info */}
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            {tenant.email && (
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span>{tenant.email}</span>
                              </div>
                            )}
                            {tenant.phone && (
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{tenant.phone}</span>
                              </div>
                            )}
                            {/* Generation Usage */}
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-600">Monthly Usage</span>
                                <span className="text-xs font-mono">
                                  {tenant.currentMonthGenerations || 0}/{tenant.monthlyGenerationLimit || 100}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    (tenant.currentMonthGenerations || 0) > (tenant.monthlyGenerationLimit || 100) 
                                      ? 'bg-red-500' 
                                      : (tenant.currentMonthGenerations || 0) / (tenant.monthlyGenerationLimit || 100) > 0.8 
                                        ? 'bg-yellow-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min((tenant.currentMonthGenerations || 0) / (tenant.monthlyGenerationLimit || 100) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleEditClient(tenant)}
                                className="flex items-center space-x-1"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const embedUrl = `${window.location.origin}/embed?tenant=${tenant.slug}`;
                                  window.open(embedUrl, '_blank');
                                }}
                                className="flex items-center space-x-1"
                              >
                                <Code className="h-4 w-4" />
                                <span>Preview</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingClient(tenant)}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </Button>
                            </div>

                            <Button
                              variant={tenant.active ? "destructive" : "default"}
                              size="sm"
                              onClick={() => toggleClientStatusMutation.mutate({ 
                                id: tenant.id, 
                                active: !tenant.active 
                              })}
                              disabled={toggleClientStatusMutation.isPending}
                              className="flex items-center space-x-1"
                            >
                              {tenant.active ? (
                                <>
                                  <XCircle className="h-4 w-4" />
                                  <span>Suspend</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Activate</span>
                                </>
                              )}
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
          <TabsContent value="leads" className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-bold">Leads Management</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Website Leads
                </CardTitle>
                <CardDescription>
                  All contact form submissions from your website
                </CardDescription>
              </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg mb-2">No leads yet</p>
                      <p className="text-gray-500 text-sm">Contact form submissions will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Total leads: {leads.length}
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left p-3 font-medium text-gray-700">Name</th>
                              <th className="text-left p-3 font-medium text-gray-700">Business</th>
                              <th className="text-left p-3 font-medium text-gray-700">Email</th>
                              <th className="text-left p-3 font-medium text-gray-700">Phone</th>
                              <th className="text-left p-3 font-medium text-gray-700">Date</th>
                              <th className="text-left p-3 font-medium text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {leads.map((lead) => (
                              <tr key={lead.id} className="border-b hover:bg-gray-50">
                                <td className="p-3">
                                  <div className="font-medium text-gray-900">
                                    {lead.firstName} {lead.lastName}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <div className="text-gray-700">
                                    {lead.businessName || 'Not provided'}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <a 
                                    href={`mailto:${lead.email}`}
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {lead.email}
                                  </a>
                                </td>
                                <td className="p-3">
                                  {lead.phone ? (
                                    <a 
                                      href={`tel:${lead.phone}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                      {lead.phone}
                                    </a>
                                  ) : (
                                    <span className="text-gray-500">Not provided</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="text-gray-700 text-sm">
                                    {lead.createdAt ? (
                                      <>
                                        {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString()}
                                      </>
                                    ) : (
                                      'Date not available'
                                    )}
                                  </div>
                                </td>
                                <td className="p-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingLead(lead)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* Embed Code Tab */}
          <TabsContent value="embed" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Website Embed Code Generator</CardTitle>
                <p className="text-muted-foreground">
                  Generate embed code for your clients to add visualizers to their websites
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="embed-client-select">Select Client:</Label>
                    <select
                      id="embed-client-select"
                      value={selectedTenant?.id || ''}
                      onChange={(e) => {
                        const tenantId = e.target.value ? parseInt(e.target.value) : null;
                        const tenant = allTenants.find(t => t.id === tenantId);
                        setSelectedTenant(tenant || null);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="">Choose a client...</option>
                      {allTenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.companyName} ({tenant.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTenant ? (
                    <EmbedCodeGenerator tenant={selectedTenant} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Please select a client to generate their embed code
                    </div>
                  )}
                </div>
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
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
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
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-600"
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Client</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deletingClient?.companyName}</strong>? 
                This action cannot be undone and will permanently remove:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All client data and settings</li>
                  <li>All generated visualizations</li>
                  <li>All collected leads</li>
                  <li>Embed access will be terminated</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteClient}
                disabled={deleteClientMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteClientMutation.isPending ? "Deleting..." : "Delete Permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Lead Confirmation Dialog */}
        <AlertDialog open={!!deletingLead} onOpenChange={() => setDeletingLead(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lead</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the lead for <strong>{deletingLead?.firstName} {deletingLead?.lastName}</strong>? 
                This action cannot be undone and will permanently remove:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Contact information ({deletingLead?.email})</li>
                  <li>Business details and notes</li>
                  <li>All submission data</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLead}
                disabled={deleteLeadMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteLeadMutation.isPending ? "Deleting..." : "Delete Lead"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}