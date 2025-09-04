import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Tenant, Lead } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // For demo purposes, we'll use a mock tenant ID
  const mockTenantId = 1;

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: [`/api/tenants/${mockTenantId}/leads`],
    enabled: !!mockTenantId,
  });

  const { data: visualizations = [], isLoading: visualizationsLoading } =
    useQuery({
      queryKey: [`/api/tenants/${mockTenantId}/visualizations`],
      enabled: !!mockTenantId,
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
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/demo`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  // Load current tenant data
  const { data: currentTenant } = useQuery({
    queryKey: [`/api/tenant/demo`],
  });

  const [tenantSettings, setTenantSettings] = useState({
    companyName: "AI Roofing & Siding Visualizer",
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
          currentTenant.companyName || "AI Roofing & Siding Visualizer",
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {/* House */}
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                  {/* Windows */}
                  <rect x="8.5" y="14" width="1.5" height="1.5" fill="currentColor" opacity="0.8" />
                  <rect x="14" y="14" width="1.5" height="1.5" fill="currentColor" opacity="0.8" />
                  <rect x="8.5" y="16.5" width="1.5" height="1.5" fill="currentColor" opacity="0.8" />
                  <rect x="14" y="16.5" width="1.5" height="1.5" fill="currentColor" opacity="0.8" />
                  {/* Star */}
                  <path d="M19 8l-1.5-3-1.5 3-3 1.5 3 1.5 1.5 3 1.5-3 3-1.5z" fill="currentColor" />
                </svg>
              </div>
              <h1 className="text-xl font-bold">
                RoofPro AI - Admin Dashboard
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger
              value="branding"
              className="flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Branding</span>
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
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Leads
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{leads.length}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Visualizations
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {visualizations.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Conversion Rate
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">24.5%</div>
                  <p className="text-xs text-muted-foreground">
                    +3% from last month
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
                  {leads.slice(0, 5).map((lead: Lead, index) => (
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
                ) : leads.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No leads yet. Start promoting your visualization tool!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leads.map((lead: Lead) => (
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

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Branding</CardTitle>
                <p className="text-muted-foreground">
                  Customize your company's appearance
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={tenantSettings.companyName}
                      onChange={(e) =>
                        setTenantSettings((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={tenantSettings.phone}
                      onChange={(e) =>
                        setTenantSettings((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={tenantSettings.email}
                      onChange={(e) =>
                        setTenantSettings((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={tenantSettings.primaryColor}
                        onChange={(e) =>
                          setTenantSettings((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="w-16"
                      />
                      <Input
                        value={tenantSettings.primaryColor}
                        onChange={(e) =>
                          setTenantSettings((prev) => ({
                            ...prev,
                            primaryColor: e.target.value,
                          }))
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea
                    id="address"
                    value={tenantSettings.address}
                    onChange={(e) =>
                      setTenantSettings((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea
                    id="description"
                    value={tenantSettings.description}
                    onChange={(e) =>
                      setTenantSettings((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={updateTenantMutation.isPending}
                >
                  {updateTenantMutation.isPending
                    ? "Saving..."
                    : "Save Branding"}
                </Button>
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
